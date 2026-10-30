import { Session } from './Harness';
import type { Checker } from './Harness';
import { FLOW_COMMANDS, FLOW_EXPECTED, MAIN_COMMANDS, MAIN_EXPECTED } from './TranscriptData';

export const OTHER_SVG = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">',
  '  <rect x="0" y="0" width="400" height="300" fill="#ffffff"/>',
  '  <text id="t1" x="10" y="290">imported</text>',
  '  <circle id="c1" cx="50" cy="50" r="10"/>',
  '  <g id="g1">',
  '    <rect id="r2" x="0" y="0" width="10" height="10"/>',
  '    <circle id="c2" cx="5" cy="5" r="2"/>',
  '  </g>',
  '  <ellipse id="e1" cx="1" cy="2" rx="3" ry="4"/>',
  '</svg>',
  '',
].join('\n');

const TREE_ROW = /^(svg \(|[├└│ ])/;

function squash(text: string): string {
  return text.replace(/ {2,}/g, ' ');
}

function attributeColumn(line: string): number | null {
  const prefix = /^[│├└─ ]*/.exec(line);
  const offset = prefix === null ? 0 : prefix[0].length;
  const match = / {2,}(?=\S)/.exec(line.slice(offset));
  return match === null ? null : offset + match.index + match[0].length;
}

export function runTranscriptSuite(check: Checker): void {
  const main = new Session();
  main.fs.seed('other.svg', OTHER_SVG);
  check.lines(main.sendAll(MAIN_COMMANDS), MAIN_EXPECTED, '第 6 章主 transcript');
  check.true(main.fs.has('demo.svg'), '主 transcript：save 生成 demo.svg');

  const flow = new Session();
  const actual = flow.sendAll(FLOW_COMMANDS);
  const total = Math.max(actual.length, FLOW_EXPECTED.length);
  for (let index = 0; index < total; index += 1) {
    const produced = actual[index];
    const expected = FLOW_EXPECTED[index];
    const label = `6.1 流程图 transcript [line ${index + 1}]`;
    if (produced === undefined || expected === undefined) {
      check.equal(produced ?? '<missing>', expected ?? '<missing>', label);
    } else if (TREE_ROW.test(expected) && TREE_ROW.test(produced)) {
      check.equal(squash(produced), squash(expected), `${label} 内容`);
    } else {
      check.equal(produced, expected, label);
    }
  }

  const columns = new Set(actual.map(attributeColumn).filter((value): value is number => value !== null));
  check.equal([...columns].join(','), '32', '6.1 树内属性列统一（规范示例自身不一致，见验收报告）');
  check.true(flow.fs.has('flowchart.svg'), '6.1：save 生成 flowchart.svg');

  const saved = flow.fs.contentOf('flowchart.svg');
  check.true(saved.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), '6.1：保存文件带 XML 声明');
  check.true(saved.includes('<g id="flowchart">'), '6.1：保存文件含容器节点');
  check.true(saved.includes('处理数据 v2'), '6.1：保存文件含最新文字内容');
}
