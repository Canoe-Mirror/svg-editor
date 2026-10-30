export interface Operation {
  execute(): void;
  feedback(): string;
}

export interface Command extends Operation {
  undo(): void;
  undoFeedback(): string;
}

export function isCommand(operation: Operation): operation is Command {
  return 'undo' in operation;
}
