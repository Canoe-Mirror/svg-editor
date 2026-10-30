import type { Shape } from './Shape';

export class ShapeDetail {
  static render(shape: Shape): string {
    const lines = [`${ShapeDetail.label(shape)}  parent=${ShapeDetail.parentLabel(shape)}`];
    for (const section of shape.detailSections()) {
      if (section.length > 0) {
        lines.push(`  ${section.join(' ')}`);
      }
    }
    return lines.join('\n');
  }

  private static label(shape: Shape): string {
    return shape.parent === null ? shape.id : shape.treeHead();
  }

  private static parentLabel(shape: Shape): string {
    const parent = shape.parent;
    return parent === null ? '-' : ShapeDetail.label(parent);
  }
}
