import type { Operation } from '../../command/Command';
import type { AppContext } from '../AppContext';
import type { Command } from '../../command/Command';

export class UndoOperation implements Operation {
  private undone: Command | undefined;

  constructor(private readonly app: AppContext) {}

  execute(): void {
    this.undone = this.app.undo.undo();
  }

  feedback(): string {
    if (this.undone === undefined) {
      return 'nothing to undo';
    }
    return this.undone.undoFeedback();
  }
}
