import type { Command } from './Command';
import type { Document } from '../model/Document';

export class MoveCommand implements Command {
  constructor(
    private readonly doc: Document,
    private readonly id: string,
    private readonly dx: number,
    private readonly dy: number,
  ) {}

  execute(): void {
    this.doc.require(this.id).move(this.dx, this.dy);
  }

  undo(): void {
    this.doc.require(this.id).move(-this.dx, -this.dy);
  }

  feedback(): string {
    const shape = this.doc.require(this.id);
    return `${shape.treeHead()} ${shape.moveFeedback(this.dx, this.dy)}`;
  }

  undoFeedback(): string {
    const shape = this.doc.require(this.id);
    return `${shape.treeHead()} ${shape.moveUndoFeedback(this.dx, this.dy)}`;
  }
}
