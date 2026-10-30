import { Group } from './Group';
import type { Shape } from './Shape';

export class Document {
  readonly root: Group;
  width: number;
  height: number;

  private readonly index = new Map<string, Shape>();

  constructor(width = 800, height = 600) {
    this.width = width;
    this.height = height;
    this.root = new Group('svg');
    this.register(this.root);
  }

  find(id: string): Shape | undefined {
    return this.index.get(id);
  }

  require(id: string): Shape {
    const shape = this.index.get(id);
    if (shape === undefined) {
      throw new Error(`no such shape: ${id}`);
    }
    return shape;
  }

  requireContainer(id: string): Group {
    const shape = this.index.get(id);
    if (shape === undefined) {
      throw new Error(`no such container: ${id}`);
    }
    const container = shape.asContainer();
    if (container === null) {
      throw new Error(`not a container: ${id}`);
    }
    return container;
  }

  has(id: string): boolean {
    return this.index.has(id);
  }

  register(shape: Shape): void {
    this.track(shape);
    for (const child of shape.childShapes()) {
      this.register(child);
    }
  }

  track(shape: Shape): void {
    if (this.index.has(shape.id)) {
      throw new Error(`id already exists: ${shape.id}`);
    }
    this.index.set(shape.id, shape);
  }

  untrack(shape: Shape): void {
    this.index.delete(shape.id);
  }

  add(shape: Shape, parent: Group = this.root): void {
    this.register(shape);
    parent.append(shape);
  }

  relocate(shape: Shape, parent: Group, index?: number): void {
    const oldParent = shape.parent;
    if (oldParent !== null) {
      oldParent.removeChild(shape);
    }
    if (index === undefined) {
      parent.append(shape);
    } else {
      parent.insertAt(shape, index);
    }
  }

  detach(shape: Shape): Group | null {
    const parent = shape.parent;
    if (parent !== null) {
      parent.removeChild(shape);
    }
    this.unregister(shape);
    return parent;
  }

  private unregister(shape: Shape): void {
    this.untrack(shape);
    for (const child of shape.childShapes()) {
      this.unregister(child);
    }
  }

  toSvg(): string {
    const lines = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<svg xmlns="http://www.w3.org/2000/svg" width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width} ${this.height}">`,
    ];
    for (const child of this.root.children) {
      lines.push(child.toSvg(1));
    }
    lines.push('</svg>');
    return lines.join('\n');
  }

  countElements(): number {
    let total = 0;
    const walk = (shape: Shape): void => {
      total += 1;
      for (const child of shape.childShapes()) {
        walk(child);
      }
    };
    for (const child of this.root.childShapes()) {
      walk(child);
    }
    return total;
  }
}
