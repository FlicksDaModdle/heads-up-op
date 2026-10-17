# Behavioural spec (clean-room)

This project is a clean-room reimplementation of the "phone on your forehead"
party-game genre. This file is the only bridge between observing the
commercial game and writing code here.

## Clean-room rules

1. **Observe, then describe.** Someone plays the commercial app and writes down
   *what it does* (screens, flow, timing, gestures) in their own words in this
   file. Nothing else crosses over.
2. **Never copy expression.** No code, decompiled or otherwise; no images,
   icons, fonts, sounds, animations, deck names, deck artwork, word lists, or
   on-screen text from the commercial app. Game mechanics and genre
   conventions are fine; how the original *expresses* them is not.
3. **No reverse engineering of the binary.** No APK/IPA unpacking,
   decompiling, traffic capture, or asset extraction. Observation is limited
   to using the app as a normal player.
4. **Our own identity.** The app ships as **Forehead Frenzy**. It does not use
   the commercial game's name, logo, or trade dress, and does not claim to be
   affiliated with it.
5. **Write decks from scratch.** Every deck name, rules blurb and word list in
   `src/game/decks.ts` is written for this project.

## Observed behaviour → our requirements

Each item is described generically, followed by what this project does.

### Home screen

- *Observed:* portrait, vertically scrolling page with sections. One section
  lists the player's decks as a horizontal row of tall, poster-shaped cards
  (about 2:3), each with bold artwork and the deck title. A round floating
  settings button sits in the bottom-right corner. Other sections are store
  bundles and a strip of recorded rounds.
- *Ours:* the same sectioned layout. The top section has our title, a
  sticker, the player's own decks and a green **Make Your Own Deck!** bar
  where the original sells bundles. **My Decks** lists the built-in decks
  (the chevron expands it to a grid), and **Recent Rounds** lists the last
  few scores. Posters are drawn in code (gradient + emoji + title). Floating
  settings button bottom-right. No store.

### Deck detail

- *Observed:* tapping a deck opens a large rounded panel over the home screen
  with the deck title, a short paragraph explaining how to clue that deck, a
  back control bottom-left and a **Play** button bottom-right. Sample words are
  shown as small tilted tiles peeking out below the panel.
- *Ours:* the same structure, with our own deck blurbs and three sample words
  picked at random from the deck.

### Round start

- *Observed:* the game switches to landscape and shows a single coloured card
  with a thick white rounded border on a black background, reading an
  instruction to put the phone on the forehead. The round only begins once the
  phone is held upright against the forehead (taps are ignored).
- *Ours:* landscape, same card framing in the deck's colour, our own
  instruction text. Starts when the tilt sensor reports upright. **A tap also
  starts it** (deliberate difference: makes emulators and accessibility work).
- Short "get ready" countdown of 3 → 2 → 1 before the first word.

### Playing

- One word per card, very large and centred. Timer and score visible.
- Tilt the screen **down** (towards the floor) = correct: green flash and a
  "correct" label. Tilt the screen **up** (towards the ceiling) = pass: orange
  flash and a "pass" label. The phone must come back upright before the next
  tilt counts.
- *Ours:* tap fallback too: right half = correct, left half = pass.
- Last 5 seconds: the timer is emphasised (ours: it turns yellow and grows, with
  a light haptic each second).
- When time runs out, a full-card "time's up" screen shows for about 1.5 s,
  then results. A word still on screen counts as missed.

### Results

- Large score, then the list of every word shown in order, guessed words
  highlighted and passed words dimmed. Actions: play the same deck again, or
  go back to the decks.
- *Ours:* the round is also saved to **Recent rounds** on the home screen.

### Settings

- *Observed:* a panel with the player's online profile and a toggle for
  recording the guesser on camera.
- *Ours (for now):* round length (30/60/90/120 s) and a toggle for haptics.
  No accounts. Camera recording is a possible later feature and must be
  opt-in.

### Custom decks (our addition)

- Not taken from the commercial app. The top section of the home screen
  shows the player's decks after a **New deck** tile, plus a **Make Your Own
  Deck!** button. The editor takes a name, a colour, and the
  words (one per line or comma-separated; blanks and duplicates are dropped;
  at least 3 words). Custom decks open the same detail panel, with an extra
  **Edit** button, and can be deleted from the editor. They are stored only
  on the device.

## Branding

- Name: **Forehead Frenzy**. Bundle/package ID `com.flicksdamoddle.foreheadFrenzy`
  (iOS) / `com.flicksdamoddle.forehead_frenzy` (Android).
- Icon: a tilted white card with a question mark on a pink-to-violet burst,
  generated by `tool/make_icon.py` from basic shapes.
- Look and feel: follows the genre's familiar layout (bright blue
  sectioned home page, tall deck posters, rules panel with fanned sample
  words, landscape card with a thick white border on black, green for
  correct and orange for pass). All artwork is drawn in code or from emoji,
  fonts are open-licensed (Lilita One, Kaushan Script, Nunito), and labels
  use the genre's plain words ("Correct!", "Pass", "Time's Up!").
- Deck posters are gradients plus an emoji, never copies of any
  commercial deck art. Icons are Ionicons (MIT) via `@expo/vector-icons`.
- Built with React Native + Expo (TypeScript).

## Not in scope

In-app purchases, ads, accounts, online sync, camera recording.
