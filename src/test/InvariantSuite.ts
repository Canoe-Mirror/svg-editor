import { Session } from './Harness';
import type { Checker } from './Harness';

export function runInvariantSuite(check: Checker): void {
  checkIdUniqueness(check);
  checkRedoClearing(check);
  checkIoLock(check);
  checkGroupAtomicity(check);
  checkStackBounds(check);
  checkRestorePosition(check);
  checkRoundTrip(check);
}

function checkIdUniqueness(check: Checker): void {
  const session = new Session();
  session.sendAll(['init 800 600', 'create g g1', 'create rect a 0 0 10 10 in g1']);
  check.equal(session.output('create circle g1 1 1 2'), 'error: id already exists: g1', '不变量：id 全局唯一（跨层级）');
  check.equal(session.output('group g1 a'), 'error: id already exists: g1', '不变量：group 新 id 同样受唯一性约束');
  check.true(session.output('tree').includes('circle#') === false, '不变量：重名 create 未留下残留节点');
}

function checkRedoClearing(check: Checker): void {
  const session = new Session();
  session.sendAll(['init 800 600', 'create rect a 0 0 10 10', 'move a 5 5', 'undo']);
  check.equal(session.output('redo'), 'rect#a moved to (5,5)', '不变量：undo 后 redo 可用');
  session.send('move a 1 1');
  check.equal(session.output('redo'), 'error: nothing to redo', '不变量：新编辑后 redo 栈清空');
}

function checkIoLock(check: Checker): void {
  const session = new Session();
  session.sendAll(['init 800 600', 'create rect a 0 0 10 10', 'move a 5 5']);
  session.send('save out.svg');
  check.equal(session.output('undo'), 'error: undo not allowed after io command', '不变量：IO 后 undo 被禁止');
  check.equal(session.output('redo'), 'error: redo not allowed after io command', '不变量：IO 后 redo 被禁止');
  session.send('move a 1 1');
  check.equal(session.output('undo'), 'rect#a moved back to (5,5)', '不变量：一次编辑后 undo 解禁');

  const resized = new Session();
  resized.sendAll(['init 800 600', 'create rect a 0 0 10 10', 'move a 5 5']);
  resized.send('canvas 900 700');
  check.equal(resized.output('undo'), 'error: undo not allowed after io command', '不变量：canvas 改尺寸按 IO 类上锁');

  const shown = new Session();
  shown.sendAll(['init 800 600', 'create rect a 0 0 10 10', 'move a 5 5']);
  shown.sendAll(['tree', 'show a', 'canvas']);
  check.equal(shown.output('undo'), 'rect#a moved back to (0,0)', '不变量：显示类命令不锁 undo');
}

function checkGroupAtomicity(check: Checker): void {
  const session = new Session();
  session.sendAll(['init 800 600', 'create rect a 0 0 10 10', 'create rect b 0 0 10 10', 'create rect c 0 0 10 10']);
  const before = session.output('tree');
  check.equal(session.output('group trio a b c'), 'g#trio created with 3 children', '不变量：group 一次收编三个图形');
  check.equal(session.output('undo'), 'g#trio grouping undone', '不变量：group 只需一次 undo');
  check.equal(session.output('tree'), before, '不变量：group 的 undo 完整还原结构');
  check.equal(session.output('undo'), 'rect#c creation undone', '不变量：undo 栈按命令顺序回退');
}

function checkStackBounds(check: Checker): void {
  const session = new Session();
  session.sendAll(['init 800 600', 'create rect a 0 0 10 10']);
  check.equal(session.output('undo'), 'rect#a creation undone', '不变量：create 可撤销');
  check.equal(session.output('undo'), 'error: nothing to undo', '不变量：空栈 undo 报错');
  check.equal(session.output('redo'), 'rect#a created', '不变量：redo 恢复 create');
  check.equal(session.output('redo'), 'error: nothing to redo', '不变量：redo 到顶报错');
}

function checkRestorePosition(check: Checker): void {
  const session = new Session();
  session.sendAll([
    'init 800 600',
    'create rect a 0 0 10 10',
    'create rect b 20 20 10 10',
    'create g outer',
    'create g inner in outer',
    'addto inner b',
  ]);
  const before = session.output('tree');
  session.send('delete b');
  session.send('undo');
  check.equal(session.output('tree'), before, '不变量：delete 的 undo 回到原父与原下标');

  const grouped = session.output('tree');
  session.sendAll(['group duo a inner', 'undo']);
  check.equal(session.output('tree'), grouped, '不变量：group 的 undo 不改变同级顺序');
}

function checkRoundTrip(check: Checker): void {
  const session = new Session();
  session.sendAll(['init 800 600', 'create rect a 1 2 30 40', 'create text t 5 6 "A & B"', 'create g box', 'create circle c 3 4 5 in box']);
  session.send('save round1.svg');
  session.send('read round1.svg');
  session.send('save round2.svg');
  check.equal(session.fs.contentOf('round2.svg'), session.fs.contentOf('round1.svg'), '不变量：save→read→save 幂等');
  check.true(session.fs.contentOf('round1.svg').includes('A &amp; B'), '不变量：文本内容按实体转义写出');
}
