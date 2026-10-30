import { Document } from '../model/Document';
import { ShapeFactory } from '../model/ShapeFactory';
import type { Shape } from '../model/Shape';

interface OpenTag {
  readonly name: string;
  readonly attrs: Map<string, string>;
  readonly selfClosing: boolean;
}

type XmlEvent =
  | { readonly kind: 'open'; readonly tag: OpenTag }
  | { readonly kind: 'close'; readonly name: string }
  | { readonly kind: 'text'; readonly value: string };

interface Frame {
  readonly name: string;
  readonly shape: Shape;
  text: string;
}

export interface ParseResult {
  readonly doc: Document;
  readonly warnings: readonly string[];
}

export class SvgParser {
  parse(source: string): ParseResult {
    const events = scan(source);
    const size = readCanvasSize(events);
    const doc = new Document(size.width, size.height);
    const warnings: string[] = [];
    const stack: Frame[] = [{ name: 'svg', shape: doc.root, text: '' }];
    const counters = new Map<string, number>();
    let skipDepth = 0;

    for (const event of events) {
      const top = stack[stack.length - 1];

      if (event.kind === 'text') {
        if (skipDepth === 0 && top !== undefined) {
          top.text += event.value;
        }
        continue;
      }

      if (event.kind === 'close') {
        if (skipDepth > 0) {
          skipDepth -= 1;
          continue;
        }
        if (top === undefined || top.name !== event.name || stack.length === 1) {
          continue;
        }
        top.shape.captureText(top.text.trim());
        stack.pop();
        continue;
      }

      const tag = event.tag;
      if (skipDepth > 0) {
        if (!tag.selfClosing) {
          skipDepth += 1;
        }
        continue;
      }

      if (tag.name === 'svg') {
        continue;
      }

      const container = top === undefined ? null : top.shape.asContainer();
      if (container === null) {
        warnings.push(`skipped <${tag.name}>: parent is not a container`);
        if (!tag.selfClosing) {
          skipDepth = 1;
        }
        continue;
      }

      if (!ShapeFactory.supports(tag.name)) {
        warnings.push(`skipped unsupported element: <${tag.name}>`);
        if (!tag.selfClosing) {
          skipDepth = 1;
        }
        continue;
      }

      const id = resolveId(tag, counters, doc, warnings);
      const shape = ShapeFactory.restore(tag.name, id, tag.attrs);
      if (shape === null) {
        continue;
      }

      doc.track(shape);
      container.append(shape);

      if (!tag.selfClosing) {
        stack.push({ name: tag.name, shape, text: '' });
      }
    }

    return { doc, warnings };
  }
}

function resolveId(
  tag: OpenTag,
  counters: Map<string, number>,
  doc: Document,
  warnings: string[],
): string {
  const raw = tag.attrs.get('id');
  if (raw !== undefined && raw.trim() !== '') {
    return raw.trim();
  }
  const id = nextId(tag.name, counters, doc);
  warnings.push(`assigned id ${id} to unnamed <${tag.name}>`);
  return id;
}

function nextId(tag: string, counters: Map<string, number>, doc: Document): string {
  let index = counters.get(tag) ?? 0;
  let candidate = `${tag}${index + 1}`;
  while (doc.has(candidate)) {
    index += 1;
    candidate = `${tag}${index + 1}`;
  }
  counters.set(tag, index + 1);
  return candidate;
}

function readCanvasSize(events: readonly XmlEvent[]): { width: number; height: number } {
  for (const event of events) {
    if (event.kind !== 'open' || event.tag.name !== 'svg') {
      continue;
    }
    const attrs = event.tag.attrs;
    const viewBox = attrs.get('viewBox');
    const box = viewBox === undefined ? [] : viewBox.trim().split(/[\s,]+/).map(Number);
    const width = readLength(attrs.get('width')) ?? readLength(String(box[2])) ?? 800;
    const height = readLength(attrs.get('height')) ?? readLength(String(box[3])) ?? 600;
    return { width, height };
  }
  return { width: 800, height: 600 };
}

function readLength(raw: string | undefined): number | undefined {
  if (raw === undefined) {
    return undefined;
  }
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function scan(source: string): XmlEvent[] {
  const events: XmlEvent[] = [];
  let i = 0;

  while (i < source.length) {
    const lt = source.indexOf('<', i);
    if (lt === -1) {
      events.push({ kind: 'text', value: decodeEntities(source.slice(i)) });
      break;
    }
    if (lt > i) {
      events.push({ kind: 'text', value: decodeEntities(source.slice(i, lt)) });
    }

    if (source.startsWith('<!--', lt)) {
      i = skipUntil(source, lt + 4, '-->');
      continue;
    }
    if (source.startsWith('<?', lt)) {
      i = skipUntil(source, lt + 2, '?>');
      continue;
    }
    if (source.startsWith('<!', lt)) {
      i = skipUntil(source, lt + 2, '>');
      continue;
    }
    if (source.startsWith('</', lt)) {
      const end = source.indexOf('>', lt + 2);
      const boundary = end === -1 ? source.length : end;
      events.push({ kind: 'close', name: source.slice(lt + 2, boundary).trim() });
      i = end === -1 ? source.length : end + 1;
      continue;
    }

    const parsed = readOpenTag(source, lt + 1);
    events.push({ kind: 'open', tag: parsed.tag });
    i = parsed.next;
  }

  return events;
}

function readOpenTag(source: string, start: number): { tag: OpenTag; next: number } {
  let i = start;
  while (i < source.length && !isNameDelimiter(source[i])) {
    i += 1;
  }
  const name = source.slice(start, i);
  const attrs = new Map<string, string>();
  let selfClosing = false;

  while (i < source.length) {
    while (i < source.length && isSpace(source[i])) {
      i += 1;
    }
    if (i >= source.length) {
      break;
    }
    const ch = source[i];
    if (ch === '/') {
      selfClosing = true;
      i += 1;
      continue;
    }
    if (ch === '>') {
      i += 1;
      break;
    }

    const keyStart = i;
    while (i < source.length && !isAttributeDelimiter(source[i])) {
      i += 1;
    }
    const key = source.slice(keyStart, i);
    while (i < source.length && isSpace(source[i])) {
      i += 1;
    }

    if (source[i] !== '=') {
      if (key !== '') {
        attrs.set(key, '');
      }
      continue;
    }

    i += 1;
    while (i < source.length && isSpace(source[i])) {
      i += 1;
    }
    const quote = source[i];
    let value: string;
    if (quote === '"' || quote === "'") {
      const end = source.indexOf(quote, i + 1);
      value = source.slice(i + 1, end === -1 ? source.length : end);
      i = end === -1 ? source.length : end + 1;
    } else {
      const valueStart = i;
      while (i < source.length && !isSpace(source[i]) && source[i] !== '>' && source[i] !== '/') {
        i += 1;
      }
      value = source.slice(valueStart, i);
    }
    if (key !== '') {
      attrs.set(key, decodeEntities(value));
    }
  }

  return { tag: { name, attrs, selfClosing }, next: i };
}

function isSpace(ch: string): boolean {
  return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r';
}

function isNameDelimiter(ch: string): boolean {
  return isSpace(ch) || ch === '/' || ch === '>';
}

function isAttributeDelimiter(ch: string): boolean {
  return isNameDelimiter(ch) || ch === '=';
}

function skipUntil(source: string, from: number, terminator: string): number {
  const end = source.indexOf(terminator, from);
  return end === -1 ? source.length : end + terminator.length;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&amp;/g, '&');
}
