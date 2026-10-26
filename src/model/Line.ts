import { Shape } from './Shape';

export class Line extends Shape {
  readonly tagName = 'line';

  protected readonly xKeys = ['x1', 'x2'] as const;
  protected readonly yKeys = ['y1', 'y2'] as const;
  protected readonly scaleKeys = ['x1', 'y1', 'x2', 'y2'] as const;

  treeAttrs(): string {
    const x1 = this.getNumber('x1');
    const y1 = this.getNumber('y1');
    const x2 = this.getNumber('x2');
    const y2 = this.getNumber('y2');
    return this.joinAttrs(`(${x1},${y1}) -> (${x2},${y2})`, this.styleAttrs());
  }
}
