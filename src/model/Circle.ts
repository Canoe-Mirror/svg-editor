import { Shape } from './Shape';

export class Circle extends Shape {
  readonly tagName = 'circle';

  protected readonly xKeys = ['cx'] as const;
  protected readonly yKeys = ['cy'] as const;
  protected readonly scaleKeys = ['cx', 'cy', 'r'] as const;

  treeAttrs(): string {
    return this.joinAttrs(
      `cx=${this.getNumber('cx')}`,
      `cy=${this.getNumber('cy')}`,
      `r=${this.getNumber('r')}`,
      this.styleAttrs(),
    );
  }
}
