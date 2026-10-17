import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import type { Deck } from '../game/types';
import { play } from '../sound';
import { colors, fonts } from '../theme';

/** Tall deck card, drawn entirely in code. */
export function DeckPoster({
  deck,
  width,
  onPress,
}: {
  deck: Deck;
  width: number;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress && (() => {
        play('open');
        onPress();
      })}
      accessibilityRole="button"
      accessibilityLabel={deck.name}
      style={({ pressed }) => [
        styles.posterShadow,
        { width, transform: [{ scale: pressed ? 0.96 : 1 }] },
      ]}
    >
      <LinearGradient colors={deck.colors} style={styles.poster}>
        {deck.badge && (
          <View
            style={[
              styles.badge,
              { backgroundColor: deck.badge === 'NEW' ? '#2F3BF5' : '#F0263C' },
            ]}
          >
            <Text style={[styles.badgeText, { fontSize: Math.max(9, width * 0.085) }]}>
              {deck.badge}
            </Text>
          </View>
        )}
        <Text style={[styles.posterEmoji, { fontSize: width * 0.48 }]}>
          {deck.emoji}
        </Text>
        <Text
          style={[styles.posterTitle, { fontSize: width * 0.17 }]}
          numberOfLines={2}
          adjustsFontSizeToFit
        >
          {deck.name}
        </Text>
      </LinearGradient>
    </Pressable>
  );
}

/** Placeholder poster that opens the deck editor. */
export function NewDeckPoster({
  width,
  onPress,
}: {
  width: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress && (() => {
        play('open');
        onPress();
      })}
      accessibilityRole="button"
      accessibilityLabel="New deck"
      style={({ pressed }) => [
        styles.newPoster,
        { width, transform: [{ scale: pressed ? 0.96 : 1 }] },
      ]}
    >
      <Ionicons name="add-circle" size={width * 0.38} color={colors.white} />
      <Text style={styles.newPosterText}>New deck</Text>
    </Pressable>
  );
}

/** Glossy cyan action button. */
export function PlayButton({
  label,
  onPress,
  style,
}: {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={() => {
        play('tap');
        onPress();
      }}
      accessibilityRole="button"
      style={({ pressed }) => [style, { opacity: pressed ? 0.85 : 1 }]}
    >
      <LinearGradient
        colors={[colors.playTop, colors.playBottom]}
        style={styles.playButton}
      >
        <Text style={styles.playText}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

/** Wide bright-green call-to-action bar. */
export function GreenButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        play('tap');
        onPress();
      }}
      accessibilityRole="button"
      style={({ pressed }) => [styles.greenButton, { opacity: pressed ? 0.85 : 1 }]}
    >
      <Text style={styles.greenText}>{label}</Text>
    </Pressable>
  );
}

/** Small square icon button with a translucent fill. */
export function SquareIconButton({
  icon,
  onPress,
  label,
  size = 44,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  label: string;
  size?: number;
}) {
  return (
    <Pressable
      onPress={() => {
        play('tap');
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => [
        styles.squareButton,
        { width: size, height: size, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Ionicons name={icon} size={size * 0.62} color={colors.white} />
    </Pressable>
  );
}

/** A small word card, as fanned under the deck panel. */
export function WordTile({ word }: { word: string }) {
  return (
    <View style={styles.wordTile}>
      <Text style={styles.wordTileText} numberOfLines={2} adjustsFontSizeToFit>
        {word}
      </Text>
    </View>
  );
}

/** Full-bleed solid card with faint diagonal stripes. */
export function StripedCard({
  color,
  children,
}: {
  color: string;
  children: ReactNode;
}) {
  return (
    <View style={[styles.gameCard, { backgroundColor: color }]}>
      <View style={styles.stripes} pointerEvents="none">
        {Array.from({ length: 60 }, (_, i) => (
          <View key={i} style={[styles.stripe, { left: i * 28 - 400 }]} />
        ))}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  posterShadow: {
    aspectRatio: 0.74,
    borderRadius: 16,
    shadowColor: '#0A2A55',
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  poster: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  posterEmoji: { marginTop: 6, textAlign: 'center' },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderBottomLeftRadius: 12,
    zIndex: 1,
  },
  badgeText: { fontFamily: fonts.bold, color: colors.white, letterSpacing: 0.4 },
  posterTitle: {
    fontFamily: fonts.display,
    color: colors.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  newPoster: {
    aspectRatio: 0.74,
    borderRadius: 16,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.8)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newPosterText: {
    fontFamily: fonts.black,
    color: colors.white,
    fontSize: 16,
    marginTop: 4,
  },
  playButton: {
    borderRadius: 12,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  playText: {
    fontFamily: fonts.black,
    fontSize: 24,
    color: colors.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  greenButton: {
    backgroundColor: '#22E52E',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 4,
    borderBottomColor: '#13A71B',
  },
  greenText: {
    fontFamily: fonts.black,
    fontSize: 22,
    color: colors.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  squareButton: {
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordTile: {
    width: 128,
    height: 76,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: colors.white,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  wordTileText: {
    fontFamily: fonts.black,
    fontSize: 20,
    color: colors.white,
    textAlign: 'center',
  },
  gameCard: {
    flex: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stripes: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  stripe: {
    position: 'absolute',
    top: -400,
    width: 10,
    height: 2000,
    backgroundColor: colors.cardStripe,
    transform: [{ rotate: '35deg' }],
  },
});
