import { Circle } from './model/Circle';
import { Document } from './model/Document';
import { Ellipse } from './model/Ellipse';
import { Group } from './model/Group';
import { Line } from './model/Line';
import { Rect } from './model/Rect';
import { TextShape } from './model/TextShape';
import type { Shape } from './model/Shape';
import { CreateCommand } from './command/CreateCommand';
import { DeleteCommand } from './command/DeleteCommand';
import { MoveCommand } from './command/MoveCommand';
import { SetCommand } from './command/SetCommand';
import { UndoManager } from './command/UndoManager';

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

console.error('\n=== 阶段 3：Command 模式与 undo/redo ===');

const doc2 = new Document(800, 600);
const undo = new UndoManager();
const bg2 = new Rect('bg', { x: 0, y: 0, width: 800, height: 600, fill: '#ffffff' });
doc2.add(bg2, doc2.root);

function expectError(label: string, action: () => void): void {
  try {
    action();
    console.error(`${label}: 没有抛错（不对）`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${label}: error: ${message}`);
  }
}

const mv = new MoveCommand(doc2, 'bg', 30, 0);
mv.execute();
undo.push(mv);
console.error(`move        ${mv.feedback()}`);
undo.undo();
console.error(`after undo  ${bg2.treeAttrs()}`);
undo.redo();
console.error(`after redo  ${bg2.treeAttrs()}`);

const create = new CreateCommand(doc2, 'rect', 'r1', ['10', '20', '100', '50', '#eee']);
create.execute();
undo.push(create);
console.error(`create      ${create.feedback()}`);
undo.undo();
console.error(`r1 alive    ${doc2.has('r1')}`);
undo.redo();
console.error(`r1 alive    ${doc2.has('r1')}`);

const st = new SetCommand(doc2, 'r1', 'fill', 'red');
st.execute();
undo.push(st);
console.error(`set         ${st.feedback()}`);
undo.undo();
console.error(`fill now    ${doc2.require('r1').getAttribute('fill')}`);
const st2 = new SetCommand(doc2, 'r1', 'stroke', 'blue');
st2.execute();
undo.push(st2);
console.error(`set         ${st2.feedback()}`);
undo.undo();
console.error(`stroke now  ${String(doc2.require('r1').getAttribute('stroke'))}（undefined = 正确删除）`);

const createText = new CreateCommand(doc2, 'text', 't1', ['20', '40', 'hello']);
createText.execute();
undo.push(createText);
const stText = new SetCommand(doc2, 't1', 'text', 'hello v2');
stText.execute();
undo.push(stText);
console.error(`text set    ${stText.feedback()}`);
undo.undo();
console.error(`text now    "${(doc2.require('t1') as TextShape).getContent()}"`);

const del = new DeleteCommand(doc2, 'r1');
del.execute();
undo.push(del);
console.error(`delete      ${del.feedback()}`);
undo.undo();
const r1 = doc2.require('r1');
console.error(`restored    parent=${r1.parent?.id} ${r1.treeAttrs()}`);

undo.lock();
expectError('locked undo', () => undo.undo());
expectError('locked redo', () => undo.redo());

const mv2 = new MoveCommand(doc2, 'bg', 5, 5);
mv2.execute();
undo.push(mv2);
console.error(`new edit    ${mv2.feedback()}`);
expectError('stale redo', () => undo.redo());

console.log(doc2.toSvg());
