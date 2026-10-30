import type { Command } from './Command';
import type { Document } from '../model/Document';
import type { Group } from '../model/Group';
import type { Shape } from '../model/Shape';

export class UngroupCommand implements Command {
  private group: Group | undefined;
  private parent: Group | undefined;
  private index = -1;
  private children: readonly Shape[] = [];

  constructor(
    private readonly doc: Document,
    private readonly gid: string,
  ) {}

  execute(): void {
    const group = this.doc.requireContainer(this.gid);
    const parent = group.parent;
    if (parent === null) {
      throw new Error(`cannot ungroup root: ${group.id}`);
    }
    if (parent === this.doc.root) {
      throw new Error(`cannot ungroup top-level container: ${group.id}`);
    }

    const children = [...group.childShapes()];
    const index = parent.indexOfChild(group);

    children.forEach((child, offset) => {
      this.doc.relocate(child, parent, index + offset);
    });
    parent.removeChild(group);
    this.doc.untrack(group);

    this.group = group;
    this.parent = parent;
    this.index = index;
    this.children = children;
  }

  undo(): void {
    if (this.group === undefined || this.parent === undefined) {
      throw new Error('command was not executed');
    }
    this.parent.insertAt(this.group, this.index);
    this.doc.track(this.group);
    for (const child of this.children) {
      this.doc.relocate(child, this.group);
    }
  }

  feedback(): string {
    if (this.group === undefined || this.parent === undefined) {
      return `g#${this.gid} ungrouped`;
    }
    return `${this.group.treeHead()} ungrouped into ${this.parent.treeHead()}`;
  }

  undoFeedback(): string {
    const count = this.children.length;
    return `g#${this.gid} regrouped with ${count} ${count === 1 ? 'child' : 'children'}`;
  }
}
