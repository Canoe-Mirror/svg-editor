import type { Operation } from '../../command/Command';
import type { AppContext } from '../AppContext';
import { Document } from '../../model/Document';

export class InitOperation implements Operation {
  private doc: Document | undefined;

  constructor(
    private readonly app: AppContext,
    private readonly width: number,
    private readonly height: number,
  ) {}

  execute(): void {
    this.doc = new Document(this.width, this.height);
    this.app.setDocument(this.doc, null);
  }

  feedback(): string {
    if (this.doc === undefined) {
      return 'canvas created';
    }
    return `canvas ${this.doc.width}x${this.doc.height} created`;
  }
}
