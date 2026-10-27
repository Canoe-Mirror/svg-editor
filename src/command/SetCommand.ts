import type { Command } from './Command';
import type { Document } from '../model/Document';

export class SetCommand implements Command {
  private oldValue: string | undefined;
  private executed = false;

  constructor(
    private readonly doc: Document,
    private readonly id: string,
    private readonly key: string,
    private readonly value: string,
  ) {}

  execute(): void {
    const shape = this.doc.require(this.id);
    this.oldValue = shape.getAttribute(this.key);
    shape.setAttribute(this.key, this.value);
    this.executed = true;
  }

  undo(): void {
    if (!this.executed) {
      throw new Error('command was not executed');
    }
    const shape = this.doc.require(this.id);
    if (this.oldValue === undefined) {
      shape.removeAttribute(this.key);
      return;
    }
    shape.setAttribute(this.key, this.oldValue);
  }

  feedback(): string {
    const shape = this.doc.require(this.id);
    return `${shape.treeHead()} updated: ${this.key}="${this.value}"`;
  }
}
