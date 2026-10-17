import { Ionicons } from '@expo/vector-icons';
import { useState, type ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DeckPanel } from '../components/DeckPanel';
import { DeckPoster, GreenButton, NewDeckPoster, SquareIconButton } from '../components/ui';
import { builtInDecks } from '../game/decks';
import { moreDecks } from '../game/moreDecks';
import type { Deck, RoundSummary } from '../game/types';
import { colors, fonts } from '../theme';

export function HomeScreen({
  customDecks,
  history,
  onPlay,
  onNewDeck,
  onEditDeck,
  onSettings,
}: {
  customDecks: Deck[];
  history: RoundSummary[];
  onPlay: (deck: Deck) => void;
  onNewDeck: () => void;
  onEditDeck: (deck: Deck) => void;
  onSettings: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [open, setOpen] = useState<Deck | null>(null);
  const [expanded, setExpanded] = useState(false);

  const pageWidth = Math.min(width, 520);
  const posterWidth = Math.floor((pageWidth - 40 - 24) / 3.25);
  const gridPoster = Math.floor((pageWidth - 40 - 24) / 3);

  const row = (decks: Deck[], lead?: ReactNode) => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {lead}
      {decks.map((d) => (
        <DeckPoster key={d.id} deck={d} width={posterWidth} onPress={() => setOpen(d)} />
      ))}
    </ScrollView>
  );

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        style={styles.scroll}
      >
        {/* Hero */}
        <View style={[styles.section, { backgroundColor: colors.sky, paddingTop: insets.top + 18 }]}>
          <View style={styles.sticker}>
            <Text style={styles.stickerText}>100%{'\n'}FREE</Text>
          </View>
          <Text style={styles.script}>Let's play</Text>
          <Text style={styles.hero}>Forehead{'\n'}Frenzy!</Text>
          <Text style={styles.tagline}>Make a deck about anything you like!</Text>
          {row(customDecks, <NewDeckPoster width={posterWidth} onPress={onNewDeck} />)}
          <View style={styles.ctaRow}>
            <View style={{ flex: 1 }}>
              <GreenButton label="Make Your Own Deck!" onPress={onNewDeck} />
            </View>
          </View>
          <Text style={styles.ctaNote}>Open source & free forever</Text>
        </View>

        {/* My Decks */}
        <View style={[styles.section, { backgroundColor: colors.skyLight }]}>
          <View style={styles.headingRow}>
            <Text style={styles.heading}>My Decks</Text>
            <Pressable
              onPress={() => setExpanded((e) => !e)}
              accessibilityRole="button"
              accessibilityLabel={expanded ? 'Show as row' : 'Show all decks'}
              style={styles.chevron}
            >
              <Ionicons
                name={expanded ? 'chevron-down' : 'chevron-forward'}
                size={24}
                color={colors.white}
              />
            </Pressable>
          </View>
          <Text style={styles.subheading}>Find all your decks right here!</Text>
          {expanded ? (
            <View style={styles.grid}>
              {builtInDecks.map((d) => (
                <DeckPoster key={d.id} deck={d} width={gridPoster} onPress={() => setOpen(d)} />
              ))}
            </View>
          ) : (
            row(builtInDecks)
          )}
        </View>

        {/* More Decks */}
        <View style={[styles.section, { backgroundColor: colors.sky }]}>
          <Text style={styles.heading}>More Decks</Text>
          <Text style={styles.subheading}>
            {moreDecks.length} more categories, all free!
          </Text>
          <View style={styles.grid}>
            {moreDecks.map((d) => (
              <DeckPoster key={d.id} deck={d} width={gridPoster} onPress={() => setOpen(d)} />
            ))}
          </View>
        </View>

        {/* Recent rounds */}
        <View style={[styles.section, { backgroundColor: colors.skyDeep, minHeight: 220 }]}>
          <Text style={styles.heading}>Recent Rounds</Text>
          {history.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="trophy" size={44} color={colors.yellow} />
              <Text style={styles.emptyText}>Play a round to see your scores here</Text>
            </View>
          ) : (
            history.map((r, i) => (
              <View key={i} style={styles.historyRow}>
                <View style={styles.historyScore}>
                  <Text style={styles.historyScoreText}>{r.score}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyDeck}>{r.deckName}</Text>
                  <Text style={styles.historyDetail}>
                    {r.score} of {r.played} guessed
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <View style={[styles.fab, { bottom: insets.bottom + 18 }]}>
        <SquareIconButton icon="settings-sharp" label="Settings" onPress={onSettings} size={58} />
      </View>

      <DeckPanel
        deck={open}
        onClose={() => setOpen(null)}
        onPlay={(d) => {
          setOpen(null);
          onPlay(d);
        }}
        onEdit={(d) => {
          setOpen(null);
          onEditDeck(d);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.skyDeep },
  scroll: { flex: 1 },
  section: { paddingHorizontal: 20, paddingVertical: 22 },
  sticker: {
    position: 'absolute',
    right: 14,
    top: 46,
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '14deg' }],
    borderWidth: 3,
    borderColor: '#FFC400',
    zIndex: 2,
  },
  stickerText: {
    fontFamily: fonts.display,
    color: '#E53935',
    fontSize: 20,
    textAlign: 'center',
    lineHeight: 21,
  },
  script: { fontFamily: fonts.script, color: colors.yellow, fontSize: 30 },
  hero: {
    fontFamily: fonts.display,
    color: colors.white,
    fontSize: 58,
    lineHeight: 60,
    marginTop: -2,
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 0,
  },
  tagline: { fontFamily: fonts.heavy, color: colors.white, fontSize: 17, marginTop: 6 },
  row: { gap: 12, paddingVertical: 16, paddingRight: 20 },
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ctaNote: { fontFamily: fonts.heavy, color: colors.yellow, fontSize: 16, marginTop: 10 },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heading: {
    fontFamily: fonts.black,
    color: colors.white,
    fontSize: 36,
    textShadowColor: 'rgba(0,0,0,0.12)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },
  chevron: {
    width: 34,
    height: 34,
    borderRadius: 7,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subheading: { fontFamily: fonts.heavy, color: colors.white, fontSize: 17, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingVertical: 16 },
  emptyCard: {
    marginTop: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.14)',
    padding: 22,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: { fontFamily: fonts.heavy, color: colors.white, fontSize: 16 },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  historyScore: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyScoreText: { fontFamily: fonts.black, fontSize: 22, color: colors.ink },
  historyDeck: { fontFamily: fonts.black, fontSize: 18, color: colors.white },
  historyDetail: { fontFamily: fonts.bold, fontSize: 15, color: 'rgba(255,255,255,0.8)' },
  fab: {
    position: 'absolute',
    right: 18,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: colors.white,
    backgroundColor: colors.sky,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 8,
  },
});
