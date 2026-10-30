import { AppContext } from '../cli/AppContext';
import { buildDefaultRegistry } from '../cli/CommandRegistry';
import { Repl } from '../cli/Repl';
import type { FileSystem } from '../io/FileSystem';

export class MemoryFileSystem implements FileSystem {
  private readonly files = new Map<string, string>();
  private readonly blocked = new Set<string>();

  block(path: string): void {
    this.blocked.add(path);
  }

  seed(path: string, content: string): void {
    this.files.set(path, content);
  }

  readFile(path: string): string {
    const content = this.files.get(path);
    if (content === undefined) {
      throw new Error(`ENOENT: ${path}`);
    }
    return content;
  }

  writeFile(path: string, content: string): void {
    if (this.blocked.has(path)) {
      throw new Error(`EACCES: ${path}`);
    }
    this.files.set(path, content);
  }

  has(path: string): boolean {
    return this.files.has(path);
  }

  contentOf(path: string): string {
    const content = this.files.get(path);
    if (content === undefined) {
      throw new Error(`ENOENT: ${path}`);
    }
    return content;
  }
}

export class Session {
  readonly fs = new MemoryFileSystem();
  readonly app = new AppContext(this.fs);
  readonly repl = new Repl(this.app, buildDefaultRegistry());

  send(line: string): readonly string[] {
    return this.repl.handle(line);
  }

  sendAll(lines: readonly string[]): string[] {
    const out: string[] = [];
    for (const line of lines) {
      out.push(...this.send(line));
    }
    return out;
  }

  output(line: string): string {
    return this.send(line).join('\n');
  }
}

export class Checker {
  private failures = 0;
  private checks = 0;
  private readonly details: string[] = [];

  private record(ok: boolean, label: string, actual: string, expected: string): void {
    this.checks += 1;
    if (ok) {
      return;
    }
    this.failures += 1;
    this.details.push(`${label}\n    expected: ${JSON.stringify(expected)}\n    actual:   ${JSON.stringify(actual)}`);
  }

  equal(actual: string, expected: string, label: string): void {
    this.record(actual === expected, label, actual, expected);
  }

  lines(actual: readonly string[], expected: readonly string[], label: string): void {
    const longest = Math.max(actual.length, expected.length);
    for (let index = 0; index < longest; index += 1) {
      const left = actual[index];
      const right = expected[index];
      this.record(
        left === right,
        `${label} [line ${index + 1}]`,
        left === undefined ? '<missing>' : left,
        right === undefined ? '<missing>' : right,
      );
    }
  }

  true(condition: boolean, label: string): void {
    this.record(condition, label, String(condition), 'true');
  }

  get failed(): boolean {
    return this.failures > 0;
  }

  summary(title: string): string {
    if (this.failures === 0) {
      return `${title}: ${this.checks} checks passed`;
    }
    return [`${title}: ${this.checks - this.failures}/${this.checks} passed, ${this.failures} failed`, ...this.details].join('\n');
  }
}
