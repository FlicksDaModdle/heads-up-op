export type Deck = {
  id: string;
  name: string;
  /** Big symbol drawn on the poster. */
  emoji: string;
  /** Poster gradient, top to bottom. */
  colors: [string, string];
  /** Background of the rules panel. */
  panel: string;
  /** Text colour on the rules panel. */
  ink: string;
  /** How to give clues for this deck. */
  blurb: string;
  words: string[];
  /** Corner ribbon on the poster. */
  badge?: 'NEW' | 'POPULAR';
  /** Set for decks the player wrote. */
  custom?: boolean;
};

export type CardResult = { word: string; correct: boolean };

export type RoundSummary = {
  deckName: string;
  score: number;
  played: number;
};

export type Settings = {
  roundSeconds: number;
  haptics: boolean;
  sound: boolean;
};
