import type { Operation } from '../../command/Command';
import type { AppContext } from '../AppContext';

export class SaveOperation implements Operation {
  private savedPath: string | undefined;
  private count = 0;

  constructor(
    private readonly app: AppContext,
    private readonly path: string | undefined,
  ) {}

  execute(): void {
    const doc = this.app.requireDocument();
    const target = this.path ?? this.app.filePath;
    if (target === null || target === undefined) {
      throw new Error("no file path. use 'save <file>' first");
    }

    try {
      this.app.fs.writeFile(target, `${doc.toSvg()}\n`);
    } catch {
      throw new Error(`cannot write file: ${target}`);
    }

    this.savedPath = target;
    this.count = doc.countElements();
    this.app.filePath = target;
    this.app.undo.lock();
  }

  feedback(): string {
    return `saved to ${this.savedPath ?? ''} (${this.count} elements)`;
  }
}
