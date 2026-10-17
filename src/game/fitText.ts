/** Average glyph width of Nunito Black, as a fraction of the font size. */
export const CHAR_WIDTH = 0.62;
/** Line height used for the big card text, as a multiple of the font size. */
export const LINE_HEIGHT = 1.08;

export type Fit = { lines: string[]; fontSize: number };

/** Splits words into `n` lines, keeping the longest line as short as possible. */
function splitInto(words: string[], n: number): string[] {
  if (n <= 1 || words.length <= 1) return [words.join(' ')];
  let best: string[] = [words.join(' ')];
  let bestLongest = Infinity;
  const recurse = (start: number, left: number, acc: string[]) => {
    if (left === 1) {
      const lines = [...acc, words.slice(start).join(' ')];
      const longest = Math.max(...lines.map((l) => l.length));
      if (longest < bestLongest) {
        bestLongest = longest;
        best = lines;
      }
      return;
    }
    for (let end = start + 1; end <= words.length - (left - 1); end++) {
      recurse(end, left - 1, [...acc, words.slice(start, end).join(' ')]);
    }
  };
  recurse(0, n, []);
  return best;
}

/**
 * Picks the line split (1 to 3 lines, breaking only at spaces) and the
 * largest font size that fits `text` inside a `width` x `height` box.
 * Doing this ourselves, rather than relying on each platform's
 * shrink-to-fit, keeps words the same size and truly centered everywhere.
 */
export function fitText(text: string, width: number, height: number, maxSize: number): Fit {
  const words = text.trim().split(/\s+/);
  let best: Fit = { lines: [text], fontSize: 0 };
  for (let n = 1; n <= Math.min(3, words.length); n++) {
    const lines = splitInto(words, n);
    const longest = Math.max(...lines.map((l) => l.length));
    const size = Math.min(
      maxSize,
      width / (longest * CHAR_WIDTH),
      height / (lines.length * LINE_HEIGHT),
    );
    // Prefer fewer lines unless more lines allow clearly bigger text.
    if (size > best.fontSize * 1.08) best = { lines, fontSize: size };
  }
  return { lines: best.lines, fontSize: Math.max(12, Math.floor(best.fontSize)) };
}
