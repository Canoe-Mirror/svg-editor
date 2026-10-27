import type { Command } from './Command';
import type { Document } from '../model/Document';
import type { Group } from '../model/Group';
import type { Shape } from '../model/Shape';

export class DeleteCommand implements Command {
  private shape: Shape | undefined;
  private parent: Group | null = null;
  private index = -1;

  constructor(
    private readonly doc: Document,
    private readonly id: string,
  ) {}

  execute(): void {
    const shape = this.doc.require(this.id);
    this.parent = shape.parent;
    this.index = this.parent === null ? -1 : this.parent.indexOfChild(shape);
    this.shape = shape;
    this.doc.detach(shape);
  }

  undo(): void {
    if (this.shape === undefined || this.parent === null) {
      throw new Error('command was not executed');
    }
    this.doc.register(this.shape);
    this.parent.insertAt(this.shape, this.index);
  }

  feedback(): string {
    const head = this.shape === undefined ? this.id : this.shape.treeHead();
    return `${head} deleted`;
  }
}
