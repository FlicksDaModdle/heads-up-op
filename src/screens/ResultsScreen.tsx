import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlayButton, SquareIconButton } from '../components/ui';
import type { CardResult, Deck } from '../game/types';
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

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <Text style={styles.deck}>{deck.name}</Text>
        <Text style={styles.youGot}>You got</Text>
        <Text style={styles.score} testID="score">
          {score}
        </Text>
        <Text style={styles.youGot}>{score === 1 ? 'word right!' : 'words right!'}</Text>
      </View>
      <ScrollView style={styles.list} contentContainerStyle={{ paddingVertical: 10 }}>
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
      <View style={[styles.actions, { paddingBottom: insets.bottom + 16 }]}>
        <SquareIconButton icon="home" label="Home" onPress={onHome} size={54} />
        <PlayButton label="Play Again!" onPress={onPlayAgain} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sky },
  header: {
    marginHorizontal: 16,
    borderRadius: 22,
    borderWidth: 6,
    borderColor: colors.white,
    backgroundColor: colors.card,
    alignItems: 'center',
    paddingVertical: 16,
  },
  deck: { fontFamily: fonts.display, fontSize: 26, color: colors.yellow },
  youGot: { fontFamily: fonts.heavy, fontSize: 22, color: colors.white },
  score: {
    fontFamily: fonts.black,
    fontSize: 104,
    lineHeight: 112,
    color: colors.white,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 0,
  },
  list: { flex: 1, marginHorizontal: 16, marginTop: 12 },
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
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
});
