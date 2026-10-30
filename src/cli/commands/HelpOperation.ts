import type { Operation } from '../../command/Command';

export interface UsageEntry {
  readonly name: string;
  readonly usage: string;
}

export class HelpOperation implements Operation {
  constructor(private readonly entries: readonly UsageEntry[]) {}

  execute(): void {
  }

  feedback(): string {
    return this.entries.map((entry) => entry.usage).join('\n');
  }
}
