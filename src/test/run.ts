import { Checker } from './Harness';
import { runErrorSuite, runUnreachableCases } from './ErrorSuite';
import { runInvariantSuite } from './InvariantSuite';
import { runTranscriptSuite } from './TranscriptSuite';

const suites: readonly { title: string; run: (check: Checker) => void }[] = [
  { title: '第 6 章逐字比对', run: runTranscriptSuite },
  { title: '4.2 报错覆盖', run: runErrorSuite },
  { title: '4.2 不可达分支', run: runUnreachableCases },
  { title: '不变量', run: runInvariantSuite },
];

let failed = false;
for (const suite of suites) {
  const check = new Checker();
  suite.run(check);
  const report = check.summary(suite.title);
  console.log(report);
  if (check.failed) {
    failed = true;
  }
}

console.log(failed ? '\nRESULT: FAIL' : '\nRESULT: PASS');
process.exitCode = failed ? 1 : 0;
