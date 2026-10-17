/** Splits pasted text into words: one per line (commas also work). */
export function parseWords(text: string): string[] {
  const seen = new Set<string>();
  return text
    .split(/[\n,]/)
    .map((w) => w.trim())
    .filter((w) => {
      const key = w.toLowerCase();
      if (!w || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}
