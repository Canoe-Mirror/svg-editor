import type { Operation } from '../../command/Command';
import type { AppContext } from '../AppContext';
import type { Shape } from '../../model/Shape';
import { TreeRenderer } from '../../model/TreeRenderer';

export class TreeOperation implements Operation {
  private target: Shape | undefined;

  constructor(
    private readonly app: AppContext,
    private readonly id: string | undefined,
  ) {}

  execute(): void {
    const doc = this.app.requireDocument();
    this.target = this.id === undefined ? undefined : doc.require(this.id);
  }

  feedback(): string {
    if (this.target !== undefined) {
      return TreeRenderer.forShape(this.target);
    }
    return TreeRenderer.forDocument(this.app.requireDocument());
  }
}
