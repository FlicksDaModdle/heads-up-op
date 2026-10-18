import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { Accelerometer } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FittedText, StripedCard } from '../components/ui';
import { TiltDetector } from '../game/tilt';
import type { CardResult, Deck } from '../game/types';
import { play } from '../sound';
import { colors, fonts } from '../theme';

type Phase = 'ready' | 'countdown' | 'playing' | 'feedback' | 'timesUp';

const COUNTDOWN_FROM = 3;
const WARN_FROM = 5;
const FEEDBACK_MS = 700;
const TIMES_UP_MS = 1500;

export function GameScreen({
  deck,
  words,
  roundSeconds,
  haptics,
  onQuit,
  onFinish,
}: {
  deck: Deck;
  /** Play order for this round (unseen words first). */
  words: string[];
  roundSeconds: number;
  haptics: boolean;
  onQuit: () => void;
  onFinish: (results: CardResult[]) => void;
}) {
  const insets = useSafeAreaInsets();

  const [phase, setPhase] = useState<Phase>('ready');
  const [countdown, setCountdown] = useState(COUNTDOWN_FROM);
  const [secondsLeft, setSecondsLeft] = useState(roundSeconds);
  const [index, setIndex] = useState(0);
  const [lastCorrect, setLastCorrect] = useState(false);

  // Mirrors of state for timer and sensor callbacks.
  const phaseRef = useRef<Phase>('ready');
  const indexRef = useRef(0);
  const results = useRef<CardResult[]>([]);
  const detector = useRef(new TiltDetector());
  const clock = useRef<ReturnType<typeof setInterval> | null>(null);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finished = useRef(false);

  const go = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  const buzz = (fn: () => Promise<void>) => {
    if (haptics && Platform.OS !== 'web') fn().catch(() => {});
  };

  const stopTimers = () => {
    if (clock.current) clearInterval(clock.current);
    if (pending.current) clearTimeout(pending.current);
    clock.current = pending.current = null;
  };

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    stopTimers();
    onFinish([...results.current]);
  };

  const timeUp = () => {
    if (phaseRef.current === 'timesUp' || finished.current) return;
    stopTimers();
    // A card still on screen when time runs out counts as missed.
    if (phaseRef.current === 'playing') {
      results.current.push({ word: words[indexRef.current], correct: false });
    }
    play('timesup');
    buzz(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
    go('timesUp');
    pending.current = setTimeout(finish, TIMES_UP_MS);
  };

  const startRound = () => {
    // Whatever pose the player settled into during the countdown is neutral.
    detector.current.calibrate();
    play('go');
    buzz(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
    go('playing');
    let left = roundSeconds;
    clock.current = setInterval(() => {
      left -= 1;
      setSecondsLeft(left);
      if (left <= 0) timeUp();
      else if (left <= WARN_FROM) {
        play('tick');
        buzz(Haptics.selectionAsync);
      }
    }, 1000);
  };

  const startCountdown = () => {
    if (phaseRef.current !== 'ready') return;
    go('countdown');
    let n = COUNTDOWN_FROM;
    setCountdown(n);
    play('countdown');
    clock.current = setInterval(() => {
      n -= 1;
      if (n > 0) {
        setCountdown(n);
        play('countdown');
        return;
      }
      if (clock.current) clearInterval(clock.current);
      startRound();
    }, 1000);
  };

  const answer = (correct: boolean) => {
    if (phaseRef.current !== 'playing') return;
    play(correct ? 'correct' : 'pass');
    buzz(() =>
      correct
        ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    );
    results.current.push({ word: words[indexRef.current], correct });
    setLastCorrect(correct);
    go('feedback');
    pending.current = setTimeout(() => {
      if (indexRef.current + 1 >= words.length) {
        finish();
        return;
      }
      indexRef.current += 1;
      setIndex(indexRef.current);
      go('playing');
    }, FEEDBACK_MS);
  };

  // Keep the screen on during a round. Errors are ignored: on the web the
  // wake lock can be released before the browser has granted it.
  useEffect(() => {
    activateKeepAwakeAsync('round').catch(() => {});
    return () => {
      deactivateKeepAwake('round').catch(() => {});
    };
  }, []);

  // The app shell rotates to landscape before this screen mounts and back
  // to portrait after it; here we only stop the clock if the round is left.
  useEffect(() => stopTimers, []);

  // Tilt input. iOS reports every axis with the opposite sign to Android.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sign = Platform.OS === 'ios' ? -1 : 1;
    Accelerometer.setUpdateInterval(30);
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      const action = detector.current.addSample(sign * x, sign * y, sign * z);
      if (phaseRef.current === 'ready' && detector.current.isUpright) startCountdown();
      else if (phaseRef.current === 'playing' && action) answer(action === 'correct');
    });
    return () => sub.remove();
    // Handlers read refs, so subscribing once is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tap fallback: right half = correct, left half = pass. pageX, because
  // locationX is relative to whichever child (e.g. the word) was touched.
  const { width, height } = useWindowDimensions();
  // Equal padding on opposite sides, so the middle of the text box is the
  // middle of the screen.
  const padV = Math.max(insets.top, insets.bottom) + 56;
  const padH = Math.max(insets.left, insets.right) + 50;
  const boxW = Math.max(100, width - padH * 2);
  const boxH = Math.max(60, height - padV * 2);
  const onTap = (e: GestureResponderEvent) => {
    if (phaseRef.current === 'ready') startCountdown();
    else if (phaseRef.current === 'playing') answer(e.nativeEvent.pageX > width / 2);
  };

  const cardColor =
    phase === 'feedback'
      ? lastCorrect
        ? colors.correct
        : colors.pass
      : phase === 'timesUp'
        ? colors.timesUp
        : colors.card;

  const big = (text: string, maxSize: number) => (
    <FittedText text={text} width={boxW} height={boxH} maxSize={maxSize} style={styles.big} />
  );

  const showTimer = phase === 'playing' || phase === 'feedback';
  const warning = secondsLeft <= WARN_FROM;
  const clockText = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`;

  return (
    <View style={styles.screen}>
      <Pressable
        style={{ flex: 1 }}
        onPress={onTap}
        accessibilityLabel="Game card"
      >
        <StripedCard color={cardColor}>
          {/* The card fills the screen; insets keep the text clear of notches. */}
          <View
            style={[
              styles.center,
              { paddingVertical: padV, paddingHorizontal: padH },
            ]}
          >
            {phase === 'ready' && big('Place on Forehead', 110)}
            {phase === 'countdown' && big(String(countdown), 170)}
            {phase === 'playing' && big(words[index], 110)}
            {phase === 'feedback' && big(lastCorrect ? 'Correct!' : 'Pass', 120)}
            {phase === 'timesUp' && big("Time's Up!", 120)}
          </View>
          {phase === 'countdown' && (
            <Text style={[styles.getReady, { top: insets.top + 16 }]}>Get Ready!</Text>
          )}
          {phase === 'ready' && (
            <Text style={[styles.hint, { bottom: insets.bottom + 18 }]}>
              Tilt down = correct · Tilt up = pass · or tap to start
            </Text>
          )}
          {showTimer && (
            <Text style={[styles.timer, { top: insets.top + 14 }, warning && styles.timerWarn]}>
              {clockText}
            </Text>
          )}
        </StripedCard>
      </Pressable>
      <Pressable
        onPress={onQuit}
        style={[styles.quit, { top: insets.top + 14, left: insets.left + 16 }]}
        accessibilityRole="button"
        accessibilityLabel="Quit round"
        hitSlop={10}
      >
        <Ionicons name="close" size={28} color={colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  big: {
    fontFamily: fonts.black,
    // Android pads text for accents by default, which nudges it off center.
    includeFontPadding: false,
    textAlignVertical: 'center',
    color: colors.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 0,
  },
  getReady: {
    position: 'absolute',
    alignSelf: 'center',
    fontFamily: fonts.heavy,
    fontSize: 28,
    color: 'rgba(255,255,255,0.85)',
  },
  hint: {
    position: 'absolute',
    bottom: 18,
    fontFamily: fonts.bold,
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  timer: {
    position: 'absolute',
    top: 14,
    fontFamily: fonts.black,
    fontSize: 30,
    color: colors.white,
  },
  timerWarn: { color: colors.yellow, fontSize: 38 },
  quit: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
