export interface Command {
  execute(): void;
  undo(): void;
  feedback(): string;
}
