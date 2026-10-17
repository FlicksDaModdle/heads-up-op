// Run with: npm test  (Node's built-in test runner; types are stripped)
/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { builtInDecks } from '../src/game/decks.ts';
import { moreDecks } from '../src/game/moreDecks.ts';
import { TiltDetector } from '../src/game/tilt.ts';
import { parseWords } from '../src/game/words.ts';

// No smoothing, so each sample maps directly to the filtered value.
const detector = () => new TiltDetector({ smoothing: 1 });

test('ignores tilts until the phone has been upright', () => {
  const d = detector();
  assert.equal(d.addSample(-1), null);
  assert.equal(d.addSample(0), null);
  assert.equal(d.addSample(-1), 'correct');
});

test('screen down is correct, screen up is pass', () => {
  const d = detector();
  d.addSample(0);
  assert.equal(d.addSample(-0.8), 'correct');
  d.addSample(0.05);
  assert.equal(d.addSample(0.8), 'pass');
});

test('a held tilt fires only once', () => {
  const d = detector();
  d.addSample(0);
  assert.equal(d.addSample(-0.9), 'correct');
  assert.equal(d.addSample(-0.9), null);
  assert.equal(d.addSample(-1), null);
});

test('small wobbles do not fire', () => {
  const d = detector();
  for (const z of [0, 0.3, -0.5, 0.65, -0.69, 0.2]) assert.equal(d.addSample(z), null);
});

test('reset requires returning upright', () => {
  const d = detector();
  d.addSample(0);
  d.reset();
  assert.equal(d.addSample(-0.9), null);
  d.addSample(0);
  assert.equal(d.addSample(-0.9), 'correct');
});

test('smoothing filters out a single spike', () => {
  const d = new TiltDetector();
  d.addSample(0);
  assert.equal(d.addSample(-1), null);
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
