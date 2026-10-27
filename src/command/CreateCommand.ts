import type { Command } from './Command';
import { ShapeFactory } from './ShapeFactory';
import type { Document } from '../model/Document';
import type { Group } from '../model/Group';
import type { Shape } from '../model/Shape';

export class CreateCommand implements Command {
  private shape: Shape | undefined;

  constructor(
    private readonly doc: Document,
    private readonly type: string,
    private readonly id: string,
    private readonly params: string[],
  ) {}

  execute(): void {
    if (this.doc.has(this.id)) {
      throw new Error(`id already exists: ${this.id}`);
    }
    const shape = ShapeFactory.create(this.type, this.id, this.params);
    this.doc.add(shape, this.doc.root);
    this.shape = shape;
  }

  undo(): void {
    if (this.shape === undefined) {
      throw new Error('command was not executed');
    }
    this.doc.detach(this.shape);
  }

  feedback(): string {
    const head = this.shape === undefined ? this.id : this.shape.treeHead();
    return `${head} created`;
  }
}
