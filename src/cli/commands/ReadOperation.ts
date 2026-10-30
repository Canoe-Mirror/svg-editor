import type { Operation } from '../../command/Command';
import type { AppContext } from '../AppContext';
import type { Document } from '../../model/Document';
import { SvgParser } from '../../io/SvgParser';

export class ReadOperation implements Operation {
  private doc: Document | undefined;
  private warnings: readonly string[] = [];

  constructor(
    private readonly app: AppContext,
    private readonly path: string,
  ) {}

  execute(): void {
    let source: string;
    try {
      source = this.app.fs.readFile(this.path);
    } catch {
      throw new Error(`cannot read file: ${this.path}`);
    }

    const result = new SvgParser().parse(source);
    this.doc = result.doc;
    this.warnings = result.warnings;
    this.app.setDocument(result.doc, this.path);
  }

  feedback(): string {
    const lines = this.warnings.map((warning) => `warning: ${warning}`);
    const count = this.doc === undefined ? 0 : this.doc.countElements();
    lines.push(`read ${this.path} (${count} elements)`);
    return lines.join('\n');
  }
}
