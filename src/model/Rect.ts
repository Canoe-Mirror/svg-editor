import { Shape } from './Shape';

export class Rect extends Shape {
  readonly tagName = 'rect';

  protected readonly xKeys = ['x'] as const;
  protected readonly yKeys = ['y'] as const;
  protected readonly scaleKeys = ['x', 'y', 'width', 'height'] as const;

  treeAttrs(): string {
    return this.joinAttrs(
      `x=${this.getNumber('x')}`,
      `y=${this.getNumber('y')}`,
      `w=${this.getNumber('width')}`,
      `h=${this.getNumber('height')}`,
      this.styleAttrs(),
    );
  }
}
