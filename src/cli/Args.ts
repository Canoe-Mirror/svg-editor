export function toNumber(raw: string | undefined): number {
  const value = raw === undefined ? Number.NaN : Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`invalid number: ${raw ?? ''}`);
  }
  return value;
}

export function requireArgCount(tokens: string[], expected: number, command: string): void {
  if (tokens.length !== expected) {
    throw new Error(`invalid arguments: ${command}`);
  }
}
