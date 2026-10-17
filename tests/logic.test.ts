// Run with: npm test  (Node's built-in test runner; types are stripped)
/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { builtInDecks } from '../src/game/decks.ts';
import { moreDecks } from '../src/game/moreDecks.ts';
import { TiltDetector } from '../src/game/tilt.ts';
import { dealOrder, parseWords, shuffle, updateSeen } from '../src/game/words.ts';

// No smoothing, so each sample maps directly to the filtered value.
const detector = () => new TiltDetector({ smoothing: 1 });

/** Feeds a sample for the phone pitched `deg` degrees (negative = screen down). */
const at = (d: TiltDetector, deg: number, g = 1) => {
  const r = (deg * Math.PI) / 180;
  return d.addSample(0, g * Math.cos(r), g * Math.sin(r));
};

test('ignores tilts until the phone has been upright', () => {
  const d = detector();
  assert.equal(at(d, -60), null);
  assert.equal(at(d, 0), null);
  assert.equal(at(d, -60), 'correct');
});

test('screen down is correct, screen up is pass', () => {
  const d = detector();
  at(d, 0);
  assert.equal(at(d, -45), 'correct');
  at(d, 5);
  assert.equal(at(d, 45), 'pass');
});

test('a held tilt fires only once', () => {
  const d = detector();
  at(d, 0);
  assert.equal(at(d, -50), 'correct');
  assert.equal(at(d, -50), null);
  assert.equal(at(d, -80), null);
});

test('small wobbles do not fire', () => {
  const d = detector();
  for (const deg of [0, 10, -20, 25, -35, 38, 5]) assert.equal(at(d, deg), null);
});

test('reset requires returning upright', () => {
  const d = detector();
  at(d, 0);
  d.reset();
  assert.equal(at(d, -50), null);
  at(d, 0);
  assert.equal(at(d, -50), 'correct');
});

test('calibration makes tilts relative to how the phone is held', () => {
  const d = detector();
  at(d, 20); // player holds it tipped back a little
  d.calibrate();
  at(d, 20);
  // 45 degrees down from their pose is correct even though the absolute
  // pitch is only -25...
  assert.equal(at(d, -25), 'correct');
  at(d, 20);
  // ...and 45 degrees up from it is pass.
  assert.equal(at(d, 65), 'pass');
});

test('shaking (stronger or weaker g) does not change the angle', () => {
  const d = detector();
  at(d, 0, 1.6);
  assert.equal(at(d, -20, 1.8), null);
  assert.equal(at(d, -45, 0.6), 'correct');
});

test('a phone lying flat cannot be calibrated as neutral', () => {
  const d = detector();
  at(d, 90);
  d.calibrate();
  at(d, 25);
  assert.equal(at(d, -20), 'correct'); // baseline was capped at +25
});

test('smoothing filters out a brief jolt', () => {
  const d = new TiltDetector();
  at(d, 0);
  assert.equal(at(d, -50), null);
  assert.equal(at(d, 0), null);
});

test('parseWords splits lines and commas, trims and dedupes', () => {
  assert.deepEqual(parseWords(' Cat \n\ndog, Bird\ncat\n  ,  '), ['Cat', 'dog', 'Bird']);
});

test('all decks are well formed', () => {
  const ids = new Set<string>();
  for (const deck of [...builtInDecks, ...moreDecks]) {
    assert.ok(!ids.has(deck.id), `duplicate id ${deck.id}`);
    ids.add(deck.id);
    assert.ok(!deck.words.some((w) => w.includes(',')), `${deck.name} has a comma in a word`);
    assert.ok(deck.words.length >= 20, `${deck.name} has too few words`);
    assert.equal(new Set(deck.words).size, deck.words.length, `${deck.name} has duplicates`);
    assert.ok(deck.blurb.length > 0 && deck.emoji.length > 0, `${deck.name} is incomplete`);
  }
});

test('shuffle keeps every item exactly once', () => {
  const items = Array.from({ length: 50 }, (_, i) => i);
  assert.deepEqual([...shuffle(items)].sort((a, b) => a - b), items);
});

test('dealOrder puts unseen words first', () => {
  const words = ['a', 'b', 'c', 'd', 'e', 'f'];
  const order = dealOrder(words, new Set(['a', 'b', 'c']));
  assert.deepEqual(order.slice(0, 3).sort(), ['d', 'e', 'f']);
  assert.deepEqual(order.slice(3).sort(), ['a', 'b', 'c']);
});

test('updateSeen accumulates, then starts over once the deck is used up', () => {
  const words = ['a', 'b', 'c', 'd'];
  let seen = updateSeen(words, [], ['a', 'b']);
  assert.deepEqual(seen.sort(), ['a', 'b']);
  seen = updateSeen(words, seen, ['c']);
  assert.deepEqual(seen.sort(), ['a', 'b', 'c']);
  // Seeing the last word completes the deck: only this round's words remain.
  seen = updateSeen(words, seen, ['d', 'a']);
  assert.deepEqual(seen.sort(), ['a', 'd']);
});

test('updateSeen forgets words removed from the deck', () => {
  assert.deepEqual(updateSeen(['a', 'b', 'c'], ['x', 'a'], ['b']).sort(), ['a', 'b']);
});

test('a few rounds through a big deck never repeat a word', () => {
  const deck = [...builtInDecks, ...moreDecks].find((d) => d.id === 'wild-things')!;
  let seen: string[] = [];
  const shownSoFar = new Set<string>();
  for (let round = 0; round < 4; round++) {
    const shown = dealOrder(deck.words, new Set(seen)).slice(0, 15);
    for (const w of shown) {
      assert.ok(!shownSoFar.has(w), `repeated ${w} in round ${round + 1}`);
      shownSoFar.add(w);
    }
    seen = updateSeen(deck.words, seen, shown);
  }
});

import { CHAR_WIDTH, fitText, LINE_HEIGHT } from '../src/game/fitText.ts';

test('fitText keeps short words on one line at the max size', () => {
  const fit = fitText('Owl', 600, 250, 110);
  assert.deepEqual(fit.lines, ['Owl']);
  assert.equal(fit.fontSize, 110);
});

test('fitText splits long phrases at spaces and still fits the box', () => {
  const w = 600;
  const h = 250;
  const fit = fitText('Teenage Mutant Ninja Turtles', w, h, 110);
  assert.ok(fit.lines.length >= 2);
  assert.equal(fit.lines.join(' '), 'Teenage Mutant Ninja Turtles');
  const longest = Math.max(...fit.lines.map((l) => l.length));
  assert.ok(longest * CHAR_WIDTH * fit.fontSize <= w + 1);
  assert.ok(fit.lines.length * LINE_HEIGHT * fit.fontSize <= h + 1);
});

test('fitText never breaks inside a word', () => {
  const fit = fitText('Supercalifragilisticexpialidocious', 300, 200, 110);
  assert.deepEqual(fit.lines, ['Supercalifragilisticexpialidocious']);
  assert.ok(fit.fontSize >= 12);
});
