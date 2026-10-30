import type { Command } from './Command';

export class UndoManager {
  private readonly undoStack: Command[] = [];
  private readonly redoStack: Command[] = [];
  private locked = false;

  push(command: Command): void {
    this.undoStack.push(command);
    this.redoStack.length = 0;
    this.locked = false;
  }

  canUndo(): boolean {
    return !this.locked && this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return !this.locked && this.redoStack.length > 0;
  }

  undo(): Command {
    if (this.locked) {
      throw new Error('undo not allowed after io command');
    }
    const command = this.undoStack.pop();
    if (command === undefined) {
      throw new Error('nothing to undo');
    }
    command.undo();
    this.redoStack.push(command);
    return command;
  }

  redo(): Command {
    if (this.locked) {
      throw new Error('redo not allowed after io command');
    }
    const command = this.redoStack.pop();
    if (command === undefined) {
      throw new Error('nothing to redo');
    }
    command.execute();
    this.undoStack.push(command);
    return command;
  }

  lock(): void {
    this.locked = true;
  }

  reset(): void {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
    this.locked = true;
  }
}
