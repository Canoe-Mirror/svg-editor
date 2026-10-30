import type { Command } from './Command';
import type { Document } from '../model/Document';
import { Group } from '../model/Group';
import type { Shape } from '../model/Shape';

interface Origin {
  readonly shape: Shape;
  readonly parent: Group;
  readonly index: number;
}

export class GroupCommand implements Command {
  private group: Group | undefined;
  private parent: Group | undefined;
  private readonly origin: Origin[] = [];

  constructor(
    private readonly doc: Document,
    private readonly newId: string,
    private readonly ids: readonly string[],
  ) {}

  execute(): void {
    if (new Set(this.ids).size !== this.ids.length) {
      throw new Error('invalid arguments: group');
    }
    if (this.doc.has(this.newId)) {
      throw new Error(`id already exists: ${this.newId}`);
    }

    const shapes = this.ids.map((id) => this.doc.require(id));
    for (const shape of shapes) {
      if (shape.parent === null) {
        throw new Error(`cannot group root: ${shape.id}`);
      }
      for (const other of shapes) {
        if (other !== shape && other.isSelfOrDescendantOf(shape)) {
          throw new Error(`cannot group a container into its own descendant: ${shape.id}`);
        }
      }
    }

    const first = shapes[0] as Shape;
    const parent = first.parent as Group;
    const index = parent.indexOfChild(first);

    for (const shape of shapes) {
      const oldParent = shape.parent as Group;
      this.origin.push({ shape, parent: oldParent, index: oldParent.indexOfChild(shape) });
    }

    const group = new Group(this.newId);
    this.doc.track(group);
    parent.insertAt(group, index);

    for (const shape of shapes) {
      this.doc.relocate(shape, group);
    }

    this.group = group;
    this.parent = parent;
  }

  undo(): void {
    if (this.group === undefined || this.parent === undefined) {
      throw new Error('command was not executed');
    }
    this.parent.removeChild(this.group);
    this.doc.untrack(this.group);
    const restoring = [...this.origin].sort((left, right) => left.index - right.index);
    for (const item of restoring) {
      this.doc.relocate(item.shape, item.parent, item.index);
    }
  }

  feedback(): string {
    if (this.group === undefined) {
      return `g#${this.newId} created`;
    }
    const count = this.group.children.length;
    return `${this.group.treeHead()} created with ${count} ${count === 1 ? 'child' : 'children'}`;
  }

  undoFeedback(): string {
    return `g#${this.newId} grouping undone`;
  }
}
