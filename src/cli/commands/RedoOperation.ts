import type { Command, Operation } from '../../command/Command';
import type { AppContext } from '../AppContext';

export class RedoOperation implements Operation {
  private redone: Command | undefined;

  constructor(private readonly app: AppContext) {}

  execute(): void {
    this.redone = this.app.undo.redo();
  }

  feedback(): string {
    if (this.redone === undefined) {
      return 'nothing to redo';
    }
    return this.redone.feedback();
  }
}
