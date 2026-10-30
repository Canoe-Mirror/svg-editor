import type { Document } from './Document';
import type { Shape } from './Shape';

interface TreeRow {
  prefix: string;
  name: string;
  attrs: string;
}

export class TreeRenderer {
  static forDocument(doc: Document): string {
    const rows: TreeRow[] = [];
    TreeRenderer.collect(doc.root, '', '', rows);
    const body = TreeRenderer.format(rows.slice(1));
    const header = `${doc.root.id} (${doc.width}x${doc.height})`;
    return body === '' ? header : `${header}\n${body}`;
  }

  static forShape(shape: Shape): string {
    const rows: TreeRow[] = [];
    TreeRenderer.collect(shape, '', '', rows);
    const [root, ...rest] = rows as [TreeRow, ...TreeRow[]];
    const head = root.attrs === '' ? root.name : `${root.name} ${root.attrs}`;
    const body = TreeRenderer.format(rest);
    return body === '' ? head : `${head}\n${body}`;
  }

  private static collect(
    shape: Shape,
    rowPrefix: string,
    childrenPrefix: string,
    rows: TreeRow[],
  ): void {
    rows.push({ prefix: rowPrefix, name: shape.treeHead(), attrs: shape.treeAttrs() });

    const children = shape.childShapes();
    children.forEach((child, index) => {
      const isLast = index === children.length - 1;
      TreeRenderer.collect(
        child,
        childrenPrefix + (isLast ? '└── ' : '├── '),
        childrenPrefix + (isLast ? '    ' : '│   '),
        rows,
      );
    });
  }

  private static format(rows: TreeRow[]): string {
    const withAttrs = rows.filter((row) => row.attrs !== '');
    const column =
      withAttrs.length === 0
        ? 0
        : Math.max(...withAttrs.map((row) => row.prefix.length + row.name.length)) + 2;

    return rows
      .map((row) => {
        const head = row.prefix + row.name;
        if (row.attrs === '') {
          return head;
        }
        return head.length >= column ? `${head} ${row.attrs}` : head.padEnd(column) + row.attrs;
      })
      .join('\n');
  }
}
