import type { Command } from './Command';
import type { Document } from '../model/Document';
import type { Group } from '../model/Group';

export type ReorderTarget = 'front' | 'back';

export class ReorderCommand implements Command {
  private parent: Group | undefined;
  private oldIndex = -1;

  constructor(
    private readonly doc: Document,
    private readonly id: string,
    private readonly target: ReorderTarget,
  ) {}

  execute(): void {
    const shape = this.doc.require(this.id);
    const parent = shape.parent;
    if (parent === null) {
      throw new Error(`cannot reorder root: ${this.id}`);
    }

    this.parent = parent;
    this.oldIndex = parent.indexOfChild(shape);
    parent.removeChild(shape);
    if (this.target === 'front') {
      parent.append(shape);
    } else {
      parent.insertAt(shape, 0);
    }
  }

  undo(): void {
    if (this.parent === undefined) {
      throw new Error('command was not executed');
    }
    const shape = this.doc.require(this.id);
    this.parent.removeChild(shape);
    this.parent.insertAt(shape, this.oldIndex);
  }

  feedback(): string {
    return `${this.doc.require(this.id).treeHead()} moved to ${this.target}`;
  }

  undoFeedback(): string {
    return `${this.doc.require(this.id).treeHead()} order restored`;
  }
}
