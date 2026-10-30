import type { Operation } from '../../command/Command';
import type { AppContext } from '../AppContext';

export class CanvasOperation implements Operation {
  private resized = false;

  constructor(
    private readonly app: AppContext,
    private readonly width: number | undefined,
    private readonly height: number | undefined,
  ) {}

  execute(): void {
    const doc = this.app.requireDocument();
    if (this.width === undefined || this.height === undefined) {
      return;
    }
    doc.width = this.width;
    doc.height = this.height;
    this.app.undo.lock();
    this.resized = true;
  }

  feedback(): string {
    const doc = this.app.requireDocument();
    return this.resized ? `canvas ${doc.width}x${doc.height} resized` : `canvas ${doc.width}x${doc.height}`;
  }
}
