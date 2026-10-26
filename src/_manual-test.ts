/**
 * 临时测试脚本
 * 目的：不经过命令行，直接在代码里搭出作业第 6 章那棵树，验证：
 *   1. 六种图形都能正确序列化成 SVG；
 *   2. 容器移动/缩放会递归到子孙；
 *   3. `set` 的白名单和 text 内容改写生效。
 */
import { Circle } from './model/Circle';
import { Document } from './model/Document';
import { Ellipse } from './model/Ellipse';
import { Group } from './model/Group';
import { Line } from './model/Line';
import { Rect } from './model/Rect';
import { TextShape } from './model/TextShape';
import type { Shape } from './model/Shape';

const doc = new Document(800, 600);

const bg = new Rect('bg', { x: 0, y: 0, width: 800, height: 600, fill: '#ffffff' });
const title = new TextShape('title', 20, 40, 'My Diagram');
const c1 = new Circle('c1', { cx: 100, cy: 100, r: 20, fill: 'red' });
const box = new Rect('box', { x: 200, y: 80, width: 60, height: 60, fill: '#3366ff' });
const markers = new Group('markers');
const e1 = new Ellipse('e1', { cx: 400, cy: 300, rx: 60, ry: 30, fill: '#eef' });
const arrow = new Line('arrow', { x1: 280, y1: 110, x2: 380, y2: 110, stroke: 'black' });

doc.add(bg, doc.root);
doc.add(title, doc.root);
doc.add(markers, doc.root);
doc.add(c1, markers);
doc.add(box, markers);
doc.add(e1, doc.root);
doc.add(arrow, doc.root);

function printTree(shape: Shape, depth: number): void {
  const indent = '  '.repeat(depth);
  const attrs = shape.treeAttrs();
  console.error(`${indent}${shape.treeHead()}${attrs === '' ? '' : '  ' + attrs}`);
  if (shape instanceof Group) {
    for (const child of shape.children) {
      printTree(child, depth + 1);
    }
  }
}

console.error('=== tree ===');
console.error(`svg (${doc.width}x${doc.height})`);
for (const child of doc.root.children) {
  printTree(child, 1);
}

console.error('\n=== 容器移动：markers整体右移30 ===');
markers.move(30, 0);
printTree(markers, 1);

console.error('\n=== 容器缩放：markers放大2倍（位置和尺寸同乘）===');
markers.scale(2);
printTree(markers, 1);

console.error('\n=== set：改文字内容+改填充色 ===');
title.setAttribute('text', 'My Diagram v2');
c1.setAttribute('fill', 'teal');
console.error(`title -> ${title.treeAttrs()}`);
console.error(`c1    -> ${c1.treeAttrs()}`);

console.error('\n=== 错误场景 ===');
const bad: Array<() => void> = [
  () => box.setAttribute('opacity', '0.5'),
  () => doc.register(new Rect('bg', { x: 0, y: 0, width: 1, height: 1 })),
  () => doc.require('r9'),
  () => c1.scale(0),
];
for (const action of bad) {
  try {
    action();
    console.error('没有抛错');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`error: ${message}`);
  }
}

console.log(doc.toSvg());
