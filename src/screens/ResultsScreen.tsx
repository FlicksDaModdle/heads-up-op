import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlayButton, SquareIconButton } from '../components/ui';
import type { CardResult, Deck } from '../game/types';
import { play } from '../sound';
import { colors, fonts } from '../theme';

export function ResultsScreen({
  deck,
  results,
  onPlayAgain,
  onHome,
}: {
  deck: Deck;
  results: CardResult[];
  onPlayAgain: () => void;
  onHome: () => void;
}) {
  const insets = useSafeAreaInsets();
  const score = results.filter((r) => r.correct).length;

  useEffect(() => play('fanfare'), []);

  return (
    // Landscape: score and buttons on the left, the word list on the right.
    <View
      style={[
        styles.screen,
        {
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 12,
          paddingLeft: insets.left + 16,
          paddingRight: insets.right + 16,
        },
      ]}
    >
      <View style={styles.side}>
        <View style={styles.header}>
          <Text style={styles.deck} numberOfLines={1} adjustsFontSizeToFit>
            {deck.name}
          </Text>
          <Text style={styles.youGot}>You got</Text>
          <Text style={styles.score} testID="score">
            {score}
          </Text>
          <Text style={styles.youGot}>{score === 1 ? 'word right!' : 'words right!'}</Text>
        </View>
        <View style={styles.actions}>
          <SquareIconButton icon="home" label="Home" onPress={onHome} size={54} />
          <PlayButton label="Play Again!" onPress={onPlayAgain} style={{ flex: 1 }} />
        </View>
      </View>
      <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 10 }}>
        {results.length === 0 && <Text style={styles.empty}>No cards played</Text>}
        {results.map((r, i) => (
          <View key={i} style={styles.item}>
            <Ionicons
              name={r.correct ? 'checkmark-circle' : 'close-circle'}
              size={26}
              color={r.correct ? colors.correct : 'rgba(255,255,255,0.35)'}
            />
            <Text style={[styles.word, !r.correct && styles.missed]}>{r.word}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, flexDirection: 'row', gap: 16, backgroundColor: colors.page },
  side: { width: '40%', justifyContent: 'space-between' },
  header: {
    flex: 1,
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 6,
    borderColor: colors.white,
    backgroundColor: colors.card,
    alignItems: 'center',
    paddingVertical: 10,
  },
  deck: { fontFamily: fonts.display, fontSize: 26, color: colors.yellow },
  youGot: { fontFamily: fonts.heavy, fontSize: 22, color: colors.white },
  score: {
    fontFamily: fonts.black,
    fontSize: 84,
    lineHeight: 92,
    color: colors.white,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 0,
  },
  list: { flex: 1 },
  empty: { fontFamily: fonts.bold, color: colors.white, textAlign: 'center', marginTop: 20 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 9,
    paddingHorizontal: 14,
    marginBottom: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  word: { fontFamily: fonts.black, fontSize: 21, color: colors.white, flex: 1 },
  missed: { color: 'rgba(255,255,255,0.45)', fontFamily: fonts.bold },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 12 },
});
