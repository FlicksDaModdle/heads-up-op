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

/** Fisher-Yates shuffle into a new array. */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Orders a deck for a round: words not yet shown come first (shuffled),
 * then the ones already seen (shuffled), so repeats only happen once the
 * deck has been worked through.
 */
export function dealOrder(
  words: readonly string[],
  seen: ReadonlySet<string>,
  random: () => number = Math.random,
): string[] {
  const fresh = words.filter((w) => !seen.has(w));
  const stale = words.filter((w) => seen.has(w));
  return [...shuffle(fresh, random), ...shuffle(stale, random)];
}

/**
 * Adds a round's words to the seen list. Once every word in the deck has
 * been seen, starts over with just this round's words.
 */
export function updateSeen(
  words: readonly string[],
  seen: readonly string[],
  shown: readonly string[],
): string[] {
  const deckWords = new Set(words);
  const next = new Set(seen.filter((w) => deckWords.has(w)));
  for (const w of shown) next.add(w);
  if ([...deckWords].every((w) => next.has(w))) return [...new Set(shown)];
  return [...next];
}
