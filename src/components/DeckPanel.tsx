import { useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Deck } from '../game/types';
import { fonts } from '../theme';
import { PlayButton, SquareIconButton, WordTile } from './ui';

/** Rules panel shown over the home screen before a round. */
export function DeckPanel({
  deck,
  onClose,
  onPlay,
  onEdit,
}: {
  deck: Deck | null;
  onClose: () => void;
  onPlay: (deck: Deck) => void;
  onEdit: (deck: Deck) => void;
}) {
  const insets = useSafeAreaInsets();
  const samples = useMemo(
    () => (deck ? [...deck.words].sort(() => Math.random() - 0.5).slice(0, 3) : []),
    [deck],
  );

  return (
    <Modal
      visible={deck !== null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      supportedOrientations={['portrait']}
    >
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      {deck && (
        <View
          style={[styles.wrap, { paddingTop: insets.top + 16, paddingBottom: insets.bottom }]}
          pointerEvents="box-none"
        >
          <View style={[styles.panel, { backgroundColor: deck.panel }]}>
            <View style={[styles.inner, { borderColor: deck.ink + '55' }]}>
              <Text
                style={[styles.title, { color: deck.ink }]}
                numberOfLines={2}
                adjustsFontSizeToFit
              >
                {deck.name}
              </Text>
              <ScrollView style={styles.blurbScroll}>
                <Text style={[styles.blurb, { color: deck.ink }]}>{deck.blurb}</Text>
                <Text style={[styles.blurb, styles.challenge, { color: deck.ink }]}>
                  Hold the phone to your forehead. Tilt down when you guess it,
                  tilt up to pass.
                </Text>
              </ScrollView>
              <View style={styles.actions}>
                <SquareIconButton icon="chevron-back" label="Back" onPress={onClose} />
                {deck.custom && (
                  <View style={{ marginLeft: 10 }}>
                    <SquareIconButton
                      icon="create-outline"
                      label="Edit deck"
                      onPress={() => onEdit(deck)}
                    />
                  </View>
                )}
                <View style={{ flex: 1 }} />
                <PlayButton label="Play!" onPress={() => onPlay(deck)} />
              </View>
            </View>
          </View>
          <View style={styles.fan} pointerEvents="none">
            {samples.map((word, i) => (
              <View
                key={word}
                style={[
                  styles.fanTile,
                  {
                    transform: [
                      { translateX: (i - 1) * 100 },
                      { translateY: i === 1 ? 34 : 0 },
                      { rotate: `${(i - 1) * 14}deg` },
                    ],
                    zIndex: i === 1 ? 0 : 1,
                  },
                ]}
              >
                <WordTile word={word} />
              </View>
            ))}
          </View>
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,20,60,0.55)' },
  wrap: { flex: 1, paddingHorizontal: 18 },
  panel: {
    flex: 1,
    borderRadius: 22,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  inner: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 54,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 0,
    marginBottom: 12,
  },
  blurbScroll: { flex: 1 },
  blurb: { fontFamily: fonts.bold, fontSize: 21, lineHeight: 29 },
  challenge: { marginTop: 18 },
  actions: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  fan: { height: 150, alignItems: 'center', justifyContent: 'flex-start', marginTop: -26 },
  fanTile: { position: 'absolute' },
});
