import { Shape } from './Shape';

/** 圆：靠 cx / cy / r 定位。与 Rect 的差别只在"我有哪些几何属性" */
export class Circle extends Shape {
  readonly tagName = 'circle';

  protected readonly xKeys = ['cx'] as const;
  protected readonly yKeys = ['cy'] as const;
  protected readonly scaleKeys = ['cx', 'cy', 'r'] as const;

  /** tree 显示成 cx=100 cy=100 r=20 fill=red */
  treeAttrs(): string {
    return this.joinAttrs(
      `cx=${this.getNumber('cx')}`,
      `cy=${this.getNumber('cy')}`,
      `r=${this.getNumber('r')}`,
      this.styleAttrs(),
    );
  }
}
