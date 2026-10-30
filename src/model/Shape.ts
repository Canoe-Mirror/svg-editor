import type { Group } from './Group';
export abstract class Shape {
  private static readonly STYLE_KEYS: readonly string[] = ['fill', 'stroke', 'stroke-width'];

  readonly id: string;
  parent: Group | null = null;
  private readonly attrs = new Map<string, string>();

  constructor(id: string, attrs: Record<string, string | number> = {}) {
    if (id.trim() === '') {
      throw new Error('id must not be empty');
    }
    this.id = id;
    for (const [key, value] of Object.entries(attrs)) {
      this.attrs.set(key, String(value));
    }
  }

  abstract readonly tagName: string;
  protected abstract readonly xKeys: readonly string[];
  protected abstract readonly yKeys: readonly string[];
  protected abstract readonly scaleKeys: readonly string[];
  abstract treeAttrs(): string;

  childShapes(): readonly Shape[] {
    return [];
  }

  acceptsChildren(): boolean {
    return false;
  }

  appendChild(child: Shape): void {
    throw new Error(`not a container: ${this.id}`);
  }

  captureText(content: string): void {
    return;
  }

  isSelfOrDescendantOf(ancestor: Shape): boolean {
    let node: Shape | null = this;
    while (node !== null) {
      if (node === ancestor) {
        return true;
      }
      node = node.parent;
    }
    return false;
  }

  protected getNumber(key: string): number {
    const raw = this.attrs.get(key);
    if (raw === undefined) {
      return 0;
    }
    const value = Number(raw);
    return Number.isFinite(value) ? value : 0;
  }

  protected setNumber(key: string, value: number): void {
    this.attrs.set(key, Shape.formatNumber(value));
  }

  static formatNumber(value: number): string {
    return String(Math.round(value * 1000) / 1000);
  }

  move(dx: number, dy: number): void {
    for (const key of this.xKeys) {
      this.setNumber(key, this.getNumber(key) + dx);
    }
    for (const key of this.yKeys) {
      this.setNumber(key, this.getNumber(key) + dy);
    }
  }

  scale(factor: number): void {
    if (!(factor > 0)) {
      throw new Error('scale factor must be positive');
    }
    for (const key of this.scaleKeys) {
      this.setNumber(key, this.getNumber(key) * factor);
    }
  }

  settableKeys(): readonly string[] {
    return [...this.scaleKeys, ...Shape.STYLE_KEYS];
  }

  loadAttributes(attrs: ReadonlyMap<string, string>): void {
    for (const [key, value] of attrs) {
      if (key !== 'id') {
        this.attrs.set(key, value);
      }
    }
  }

  setAttribute(key: string, value: string): void {
    if (!this.settableKeys().includes(key)) {
      throw new Error(`unknown attribute: ${key}`);
    }
    this.attrs.set(key, value);
  }

  getAttribute(key: string): string | undefined {
    return this.attrs.get(key);
  }

  removeAttribute(key: string): void {
    this.attrs.delete(key);
  }

  moveFeedback(dx: number, dy: number): string {
    const x = this.getNumber(this.xKeys[0]);
    const y = this.getNumber(this.yKeys[0]);
    return `moved to (${Shape.formatNumber(x)},${Shape.formatNumber(y)})`;
  }

  moveUndoFeedback(dx: number, dy: number): string {
    const x = this.getNumber(this.xKeys[0]);
    const y = this.getNumber(this.yKeys[0]);
    return `moved back to (${Shape.formatNumber(x)},${Shape.formatNumber(y)})`;
  }

  toSvg(indent: number): string {
    const pad = '  '.repeat(indent);
    return `${pad}<${this.tagName} ${this.attributeString()}/>`;
  }

  treeHead(): string {
    return `${this.tagName}#${this.id}`;
  }

  detailSections(): readonly (readonly string[])[] {
    return [
      this.describeKeys(this.scaleKeys),
      this.describeKeys(Shape.STYLE_KEYS),
      this.describeKeys(this.extraKeys()),
    ];
  }

  protected describeKeys(keys: readonly string[]): readonly string[] {
    const parts: string[] = [];
    for (const key of keys) {
      const value = this.attrs.get(key);
      if (value !== undefined) {
        parts.push(`${key}=${value}`);
      }
    }
    return parts;
  }

  protected extraKeys(): readonly string[] {
    const known: readonly string[] = [...this.scaleKeys, ...Shape.STYLE_KEYS];
    return [...this.attrs.keys()].filter((key) => !known.includes(key));
  }

  protected attributeString(): string {
    const parts = [`id="${Shape.escape(this.id)}"`];
    for (const key of this.orderedAttributeKeys()) {
      const value = this.attrs.get(key);
      if (value !== undefined) {
        parts.push(`${key}="${Shape.escape(value)}"`);
      }
    }
    return parts.join(' ');
  }

  private orderedAttributeKeys(): readonly string[] {
    return [...this.scaleKeys, ...Shape.STYLE_KEYS, ...this.extraKeys()];
  }

  protected styleAttrs(): string {
    const parts: string[] = [];
    for (const key of Shape.STYLE_KEYS) {
      const value = this.attrs.get(key);
      if (value !== undefined) {
        parts.push(`${key}=${value}`);
      }
    }
    return parts.join(' ');
  }

  protected joinAttrs(...parts: string[]): string {
    return parts.filter((part) => part !== '').join(' ');
  }

  protected static escape(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  protected static escapeText(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
