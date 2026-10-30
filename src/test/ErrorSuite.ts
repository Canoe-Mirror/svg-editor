import { Session } from './Harness';
import type { Checker } from './Harness';
import { OTHER_SVG } from './TranscriptSuite';

interface ErrorCase {
  readonly name: string;
  readonly setup: readonly string[];
  readonly command: string;
  readonly expected: string;
  readonly probe?: string;
}

const CASES: readonly ErrorCase[] = [
  {
    name: '4.2-1 id 已存在',
    setup: ['init 800 600', 'create rect r1 0 0 10 10'],
    command: 'create rect r1 20 20 5 5',
    expected: 'error: id already exists: r1',
  },
  {
    name: '4.2-2 id 不存在',
    setup: ['init 800 600', 'create rect r1 0 0 10 10'],
    command: 'move r9 1 1',
    expected: 'error: no such shape: r9',
  },
  {
    name: '4.2-3 in 目标不存在',
    setup: ['init 800 600'],
    command: 'create rect r1 0 0 10 10 in node9',
    expected: 'error: no such container: node9',
  },
  {
    name: '4.2-4 in 目标不是容器',
    setup: ['init 800 600', 'create rect start 0 0 10 10'],
    command: 'create rect r1 0 0 10 10 in start',
    expected: 'error: not a container: start',
  },
  {
    name: '4.2-5 未注册的图形类型',
    setup: ['init 800 600'],
    command: 'create hexagon h1 1 2 3',
    expected: 'error: unknown shape type: hexagon (is the plugin loaded?)',
  },
  {
    name: '4.2-7 group 容器与其子孙',
    setup: ['init 800 600', 'create g g1', 'create rect c1 0 0 10 10 in g1'],
    command: 'group gx g1 c1',
    expected: 'error: cannot group a container into its own descendant: g1',
  },
  {
    name: '4.2-8 ungroup 根级容器',
    setup: ['init 800 600', 'create g scene'],
    command: 'ungroup scene',
    expected: 'error: cannot ungroup top-level container: scene',
  },
  {
    name: '4.2-9 scale 非正数',
    setup: ['init 800 600', 'create rect b 0 0 10 10'],
    command: 'scale b 0',
    expected: 'error: scale factor must be positive',
  },
  {
    name: '4.2-9b scale 负数',
    setup: ['init 800 600', 'create rect b 0 0 10 10'],
    command: 'scale b -2',
    expected: 'error: scale factor must be positive',
  },
  {
    name: '4.2-10 文件不存在',
    setup: ['init 800 600', 'create rect r1 0 0 10 10'],
    command: 'read a.svg',
    expected: 'error: cannot read file: a.svg',
  },
  {
    name: '4.2-11 文件不可写',
    setup: ['init 800 600', 'create rect r1 0 0 10 10'],
    command: 'save a.svg',
    expected: 'error: cannot write file: a.svg',
  },
  {
    name: '4.2-12 未 init/read',
    setup: [],
    command: 'tree',
    expected: "error: no document. use 'init' or 'read' first",
  },
];

export function runErrorSuite(check: Checker): void {
  for (const item of CASES) {
    const session = new Session();
    if (item.command === 'save a.svg') {
      session.fs.block('a.svg');
    }
    session.sendAll(item.setup);
    const probe = item.probe ?? 'tree';
    const before = session.sendAll([probe]);
    const actual = session.output(item.command);
    check.equal(actual, item.expected, `${item.name} 文案`);
    check.lines(session.sendAll([probe]), before, `${item.name} 失败后状态不变`);
  }

  const locked = new Session();
  locked.fs.block('a.svg');
  locked.sendAll(['init 800 600', 'create rect r1 0 0 10 10', 'move r1 1 1']);
  locked.send('save a.svg');
  check.equal(locked.output('undo'), 'rect#r1 moved back to (0,0)', '4.2-11b 失败的 save 不应锁 undo');

  const readFailed = new Session();
  readFailed.fs.seed('other.svg', OTHER_SVG);
  readFailed.send('read other.svg');
  const kept = readFailed.output('tree');
  readFailed.send('read a.svg');
  check.equal(readFailed.output('tree'), kept, '4.2-10b 失败的 read 保留旧文档');

  const dup = new Session();
  dup.fs.seed('dup.svg', OTHER_SVG.replace('id="c2"', 'id="c1"'));
  check.equal(dup.output('read dup.svg'), 'error: id already exists: c1', '4.2-1b 文件内重复 id 整次拒绝');
  check.equal(dup.output('tree'), "error: no document. use 'init' or 'read' first", '4.2-1b 失败后仍未建立文档');
}

export function runUnreachableCases(check: Checker): void {
  const session = new Session();
  session.sendAll(['init 800 600', 'create rect n1 0 0 10 10']);
  check.equal(session.output('ungroup n1'), 'error: not a container: n1', '4.2-6 替代路径：ungroup 叶子节点');
  check.equal(
    session.output('create box n2 0 0 10 10 x'),
    'error: unknown shape type: box (is the plugin loaded?)',
    '4.2-6 前提：box 属插件阶段，本阶段不可创建',
  );
}
