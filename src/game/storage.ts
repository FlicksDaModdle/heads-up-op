import AsyncStorage from '@react-native-async-storage/async-storage';

import { customDeckColors } from '../theme';
import type { Deck, RoundSummary, Settings } from './types';

export { parseWords } from './words';

const SETTINGS_KEY = 'settings';
const HISTORY_KEY = 'history';
const CUSTOM_KEY = 'customDecks';
const MAX_HISTORY = 10;

export const defaultSettings: Settings = { roundSeconds: 60, haptics: true };

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

const writeJson = (key: string, value: unknown) =>
  AsyncStorage.setItem(key, JSON.stringify(value));

export async function loadSettings(): Promise<Settings> {
  return { ...defaultSettings, ...(await readJson(SETTINGS_KEY, {})) };
}

export const saveSettings = (s: Settings) => writeJson(SETTINGS_KEY, s);

/** Most recent first. */
export const loadHistory = () => readJson<RoundSummary[]>(HISTORY_KEY, []);

export async function addRound(round: RoundSummary): Promise<void> {
  const history = await loadHistory();
  await writeJson(HISTORY_KEY, [round, ...history].slice(0, MAX_HISTORY));
}

/** A deck the player wrote, as stored on the device. */
export type CustomDeck = {
  id: string;
  name: string;
  colorIndex: number;
  words: string[];
};

export function customToDeck(c: CustomDeck): Deck {
  const colors = customDeckColors[c.colorIndex] ?? customDeckColors[0];
  return {
    id: c.id,
    name: c.name,
    emoji: '✏️',
    colors,
    panel: colors[1],
    ink: '#FFFFFF',
    blurb:
      'Your own list! Give clues any way you like, just never say the word itself.',
    words: c.words,
    custom: true,
  };
}

export const loadCustomDecks = () => readJson<CustomDeck[]>(CUSTOM_KEY, []);

/** Adds the deck, or replaces the one with the same id. */
export async function upsertCustomDeck(deck: CustomDeck): Promise<void> {
  const decks = await loadCustomDecks();
  const i = decks.findIndex((d) => d.id === deck.id);
  if (i >= 0) decks[i] = deck;
  else decks.push(deck);
  await writeJson(CUSTOM_KEY, decks);
}

export async function deleteCustomDeck(id: string): Promise<void> {
  const decks = await loadCustomDecks();
  await writeJson(
    CUSTOM_KEY,
    decks.filter((d) => d.id !== id),
  );
}
