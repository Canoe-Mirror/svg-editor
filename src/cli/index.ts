import * as readline from 'readline';
import { AppContext } from './AppContext';
import { buildDefaultRegistry } from './CommandRegistry';
import { Repl } from './Repl';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const app = new AppContext();
const repl = new Repl(app, buildDefaultRegistry());

console.log("svg-editor 0.1 — type 'help' for commands");

function prompt(): void {
  rl.question('svg> ', (line: string) => {
    const text = line.trim();

    if (text === 'quit' || text === 'exit') {
      rl.close();
      return;
    }

    for (const out of repl.handle(line)) {
      console.log(out);
    }
    prompt();
  });
}

prompt();
