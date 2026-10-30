import type { AppContext } from './AppContext';
import type { CommandRegistry } from './CommandRegistry';
import { isCommand } from '../command/Command';
import { Tokenizer } from './Tokenizer';

export class Repl {
  constructor(
    private readonly app: AppContext,
    private readonly registry: CommandRegistry,
  ) {}

  handle(line: string): readonly string[] {
    try {
      const tokens = Tokenizer.tokenize(line);
      if (tokens.length === 0) {
        return [];
      }

      const name = tokens[0] as string;
      const entry = this.registry.lookup(name);
      if (entry === undefined) {
        throw new Error(`unknown command: ${name}`);
      }

      const operation = entry.build(tokens, this.app);
      operation.execute();

      if (isCommand(operation)) {
        this.app.undo.push(operation);
      }
      return splitLines(operation.feedback());
    } catch (error) {
      return [`error: ${errorMessage(error)}`];
    }
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function splitLines(text: string): string[] {
  return text === '' ? [] : text.split('\n');
}
