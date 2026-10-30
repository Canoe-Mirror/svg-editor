import { Shape } from './Shape';

export class Group extends Shape {
  readonly tagName = 'g';

  protected readonly xKeys: readonly string[] = [];
  protected readonly yKeys: readonly string[] = [];
  protected readonly scaleKeys: readonly string[] = [];

  private readonly _children: Shape[] = [];

  get children(): readonly Shape[] {
    return this._children;
  }

  override childShapes(): readonly Shape[] {
    return this._children;
  }

  override acceptsChildren(): boolean {
    return true;
  }

  override appendChild(child: Shape): void {
    this.append(child);
  }

  override move(dx: number, dy: number): void {
    super.move(dx, dy);
    for (const child of this._children) {
      child.move(dx, dy);
    }
  }

  override scale(factor: number): void {
    super.scale(factor);
    for (const child of this._children) {
      child.scale(factor);
    }
  }

  treeAttrs(): string {
    return '';
  }

  override moveFeedback(dx: number, dy: number): string {
    return `moved by (${Shape.formatNumber(dx)},${Shape.formatNumber(dy)})`;
  }

  override moveUndoFeedback(dx: number, dy: number): string {
    return `moved back by (${Shape.formatNumber(-dx)},${Shape.formatNumber(-dy)})`;
  }

  append(child: Shape): void {
    child.parent = this;
    this._children.push(child);
  }

  insertAt(child: Shape, index: number): void {
    child.parent = this;
    this._children.splice(index, 0, child);
  }

  removeChild(child: Shape): number {
    const index = this._children.indexOf(child);
    if (index >= 0) {
      this._children.splice(index, 1);
      child.parent = null;
    }
    return index;
  }

  indexOfChild(child: Shape): number {
    return this._children.indexOf(child);
  }

  findById(id: string): Shape | null {
    if (this.id === id) {
      return this;
    }
    for (const child of this._children) {
      if (child instanceof Group) {
        const found = child.findById(id);
        if (found !== null) {
          return found;
        }
      } else if (child.id === id) {
        return child;
      }
    }
    return null;
  }

  override toSvg(indent: number): string {
    const pad = '  '.repeat(indent);
    if (this._children.length === 0) {
      return `${pad}<g ${this.attributeString()}/>`;
    }
    const lines = [`${pad}<g ${this.attributeString()}>`];
    for (const child of this._children) {
      lines.push(child.toSvg(indent + 1));
    }
    lines.push(`${pad}</g>`);
    return lines.join('\n');
  }
}
