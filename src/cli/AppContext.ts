import type { Document } from '../model/Document';
import { UndoManager } from '../command/UndoManager';

export class AppContext {
  private current: Document | null = null;
  readonly undo = new UndoManager();
  filePath: string | null = null;

  get document(): Document | null {
    return this.current;
  }

  requireDocument(): Document {
    if (this.current === null) {
      throw new Error("no document. use 'init' or 'read' first");
    }
    return this.current;
  }

  setDocument(doc: Document, filePath: string | null): void {
    this.current = doc;
    this.filePath = filePath;
    this.undo.reset();
  }
}
