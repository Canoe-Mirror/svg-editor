import { readFileSync, writeFileSync } from 'node:fs';

export interface FileSystem {
  readFile(path: string): string;
  writeFile(path: string, content: string): void;
}

export class NodeFileSystem implements FileSystem {
  readFile(path: string): string {
    return readFileSync(path, 'utf8');
  }

  writeFile(path: string, content: string): void {
    writeFileSync(path, content, 'utf8');
  }
}
