export class Tokenizer {
  static tokenize(line: string): string[] {
    const text = line.trim();
    if (text === '' || text.startsWith('#')) {
      return [];
    }

    const tokens: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const ch of text) {
      if (ch === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (!inQuotes && /\s/.test(ch)) {
        if (current !== '') {
          tokens.push(current);
          current = '';
        }
        continue;
      }
      current += ch;
    }

    if (inQuotes) {
      throw new Error('unterminated quote');
    }
    if (current !== '') {
      tokens.push(current);
    }
    return tokens;
  }
}
