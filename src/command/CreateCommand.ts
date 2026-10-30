import type { Command } from './Command';
import { ShapeFactory } from './ShapeFactory';
import type { Document } from '../model/Document';
import type { Group } from '../model/Group';
import type { Shape } from '../model/Shape';

export class CreateCommand implements Command {
  private shape: Shape | undefined;
  private container: Group | undefined;

  constructor(
    private readonly doc: Document,
    private readonly type: string,
    private readonly id: string,
    private readonly params: string[],
    private readonly containerId: string | undefined = undefined,
  ) {}

  execute(): void {
    if (this.doc.has(this.id)) {
      throw new Error(`id already exists: ${this.id}`);
    }
    const container =
      this.containerId === undefined ? this.doc.root : this.doc.requireContainer(this.containerId);
    const shape = ShapeFactory.create(this.type, this.id, this.params);

    this.doc.add(shape, container);
    this.shape = shape;
    this.container = container;
  }

  undo(): void {
    if (this.shape === undefined) {
      throw new Error('command was not executed');
    }
    this.doc.detach(this.shape);
  }

  feedback(): string {
    if (this.shape === undefined) {
      return `${this.id} created`;
    }
    const head = this.shape.treeHead();
    if (this.container !== undefined && this.container !== this.doc.root) {
      return `${head} created in ${this.container.treeHead()}`;
    }
    return `${head} created`;
  }

  undoFeedback(): string {
    const head = this.shape === undefined ? this.id : this.shape.treeHead();
    return `${head} creation undone`;
  }
}
