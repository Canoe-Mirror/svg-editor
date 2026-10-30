import type { Operation } from '../../command/Command';
import type { AppContext } from '../AppContext';
import { ShapeDetail } from '../../model/ShapeDetail';

export class ShowOperation implements Operation {
  private output = '';

  constructor(
    private readonly app: AppContext,
    private readonly id: string,
  ) {}

  execute(): void {
    const doc = this.app.requireDocument();
    this.output = ShapeDetail.render(doc.require(this.id));
  }

  feedback(): string {
    return this.output;
  }
}
