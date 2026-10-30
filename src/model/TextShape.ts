import { Shape } from './Shape';

export class TextShape extends Shape {
  readonly tagName = 'text';

  protected readonly xKeys = ['x'] as const;
  protected readonly yKeys = ['y'] as const;
  protected readonly scaleKeys = ['x', 'y'] as const;

  private content: string;

  constructor(id: string, x: number, y: number, content: string) {
    super(id, { x, y });
    this.content = content;
  }

  getContent(): string {
    return this.content;
  }

  override captureText(content: string): void {
    this.content = content;
  }

  override detailSections(): readonly (readonly string[])[] {
    const [geometry, style, extra] = super.detailSections();
    return [geometry, style, [...extra, `text="${this.content}"`]];
  }

  override settableKeys(): readonly string[] {
    return [...super.settableKeys(), 'text'];
  }

  override getAttribute(key: string): string | undefined {
    if (key === 'text') {
      return this.content;
    }
    return super.getAttribute(key);
  }

  override removeAttribute(key: string): void {
    if (key === 'text') {
      this.content = '';
      return;
    }
    super.removeAttribute(key);
  }

  override setAttribute(key: string, value: string): void {
    if (key === 'text') {
      this.content = value;
      return;
    }
    super.setAttribute(key, value);
  }

  override toSvg(indent: number): string {
    const pad = '  '.repeat(indent);
    return `${pad}<text ${this.attributeString()}>${Shape.escapeText(this.content)}</text>`;
  }

  treeAttrs(): string {
    const x = this.getNumber('x');
    const y = this.getNumber('y');
    return this.joinAttrs(`(${x},${y}) "${this.content}"`, this.styleAttrs());
  }
}
