import { Shape } from './Shape';

export class Ellipse extends Shape {
  readonly tagName = 'ellipse';

  protected readonly xKeys = ['cx'] as const;
  protected readonly yKeys = ['cy'] as const;
  protected readonly scaleKeys = ['cx', 'cy', 'rx', 'ry'] as const;

  treeAttrs(): string {
    return this.joinAttrs(
      `cx=${this.getNumber('cx')}`,
      `cy=${this.getNumber('cy')}`,
      `rx=${this.getNumber('rx')}`,
      `ry=${this.getNumber('ry')}`,
      this.styleAttrs(),
    );
  }
}
