import type { Command } from './Command';
import type { Document } from '../model/Document';
import type { Group } from '../model/Group';
import type { Shape } from '../model/Shape';

export class AddToCommand implements Command {
  private shape: Shape | undefined;
  private oldParent: Group | undefined;
  private oldIndex = -1;

  constructor(
    private readonly doc: Document,
    private readonly gid: string,
    private readonly id: string,
  ) {}

  execute(): void {
    const shape = this.doc.require(this.id);
    const container = this.doc.requireContainer(this.gid);

    if (container === shape || container.isSelfOrDescendantOf(shape)) {
      throw new Error(`cannot group a container into its own descendant: ${shape.id}`);
    }

    const parent = shape.parent;
    if (parent === null) {
      throw new Error(`cannot move root: ${shape.id}`);
    }

    this.oldParent = parent;
    this.oldIndex = parent.indexOfChild(shape);
    this.doc.relocate(shape, container);
    this.shape = shape;
  }

  undo(): void {
    if (this.shape === undefined || this.oldParent === undefined) {
      throw new Error('command was not executed');
    }
    this.doc.relocate(this.shape, this.oldParent, this.oldIndex);
  }

  feedback(): string {
    const head = this.shape === undefined ? this.id : this.shape.treeHead();
    return `${head} added to ${this.doc.requireContainer(this.gid).treeHead()}`;
  }

  undoFeedback(): string {
    if (this.shape === undefined || this.oldParent === undefined) {
      throw new Error('command was not executed');
    }
    return `${this.shape.treeHead()} restored into ${this.oldParent.treeHead()}`;
  }
}
