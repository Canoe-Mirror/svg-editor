import type { Command } from './Command';
import type { Document } from '../model/Document';
import { Shape } from '../model/Shape';

export class ScaleCommand implements Command {
  constructor(
    private readonly doc: Document,
    private readonly id: string,
    private readonly factor: number,
  ) {}

  execute(): void {
    this.doc.require(this.id).scale(this.factor);
  }

  undo(): void {
    this.doc.require(this.id).scale(1 / this.factor);
  }

  feedback(): string {
    return `${this.doc.require(this.id).treeHead()} scaled by ${Shape.formatNumber(this.factor)}`;
  }

  undoFeedback(): string {
    return `${this.doc.require(this.id).treeHead()} scaled back by ${Shape.formatNumber(1 / this.factor)}`;
  }
}
