import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("svg-editor 0.1 — type 'help' for commands");

function prompt(): void {
    rl.question('svg> ', (line: string) => {
        const text = line.trim();

        if (text === 'quit') {
            rl.close();
            return;
        }

        if (text !== '' && !text.startsWith('#')) {
            console.log(`echo: ${text}`);
        }

        prompt();
    });
}    

prompt();