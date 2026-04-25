export function parseDelimited(
  text: string,
  delimiter?: string | null
): Array<Record<string, string>>;
export function detectDelimiter(text: string): string;
export function normalizeHeader(header: string): string;
export function parseItalianNumber(value: unknown): number | null;
export function firstPresent(row: Record<string, string>, candidates: readonly string[]): string | null;
