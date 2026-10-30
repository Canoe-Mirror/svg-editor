import type { Document } from '../model/Document';
import { UndoManager } from '../command/UndoManager';
import { NodeFileSystem } from '../io/FileSystem';
import type { FileSystem } from '../io/FileSystem';

export class AppContext {
  readonly undo = new UndoManager();

  private current: Document | null = null;
  filePath: string | null = null;

  constructor(readonly fs: FileSystem = new NodeFileSystem()) {}

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
