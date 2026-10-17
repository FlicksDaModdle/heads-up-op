import { KaushanScript_400Regular } from '@expo-google-fonts/kaushan-script';
import { LilitaOne_400Regular } from '@expo-google-fonts/lilita-one';
import {
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from '@expo-google-fonts/nunito';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, BackHandler, Platform, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SettingsPanel } from './src/components/SettingsPanel';
import { rotateTo } from './src/orientation';
import { initSounds, setSoundEnabled } from './src/sound';
import {
  addRound,
  customToDeck,
  dealWords,
  markSeen,
  defaultSettings,
  loadCustomDecks,
  loadHistory,
  loadSettings,
  saveSettings,
  type CustomDeck,
} from './src/game/storage';
import type { CardResult, Deck, RoundSummary, Settings } from './src/game/types';
import { EditorScreen } from './src/screens/EditorScreen';
import { GameScreen } from './src/screens/GameScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ResultsScreen } from './src/screens/ResultsScreen';
import { colors } from './src/theme';

// Keep the native splash up until fonts are ready (no spinner flash).
SplashScreen.preventAutoHideAsync().catch(() => {});

const useNative = Platform.OS !== 'web';

type Route =
  | { name: 'home' }
  | { name: 'game'; deck: Deck; words: string[]; round: number }
  | { name: 'results'; deck: Deck; results: CardResult[] }
  | { name: 'editor'; existing?: CustomDeck };

export default function App() {
  const [fontsLoaded] = useFonts({
    KaushanScript_400Regular,
    LilitaOne_400Regular,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });
  const [route, setRoute] = useState<Route>({ name: 'home' });
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [custom, setCustom] = useState<CustomDeck[]>([]);
  const [history, setHistory] = useState<RoundSummary[]>([]);

  const reload = useCallback(async () => {
    const [s, c, h] = await Promise.all([loadSettings(), loadCustomDecks(), loadHistory()]);
    setSettings(s);
    setSoundEnabled(s.sound);
    setCustom(c);
    setHistory(h);
  }, []);

  useEffect(() => {
    initSounds();
    reload();
    rotateTo(false);
  }, [reload]);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  // Rounds are landscape, everything else portrait. A blue cover fades in,
  // the phone rotates behind it, the next screen mounts at its final size,
  // then the cover fades away, so no half-rotated layout is ever seen.
  const cover = useRef(new Animated.Value(0)).current;
  const [covering, setCovering] = useState(false);
  const busy = useRef(false);
  const fade = (to: number, duration: number) =>
    new Promise<void>((resolve) =>
      Animated.timing(cover, { toValue: to, duration, useNativeDriver: useNative }).start(() =>
        resolve(),
      ),
    );

  const go = useCallback(
    async (next: Route) => {
      const landscape = next.name === 'game';
      const rotating = landscape !== (route.name === 'game');
      if (!rotating) {
        setRoute(next);
        return;
      }
      if (busy.current) return;
      busy.current = true;
      setCovering(true);
      await fade(1, 140);
      await rotateTo(landscape);
      setRoute(next);
      // Let the new screen lay out before revealing it.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      await fade(0, 220);
      setCovering(false);
      busy.current = false;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [route.name],
  );

  // Android back: anywhere but home goes home.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (route.name === 'home') return false;
      go({ name: 'home' });
      return true;
    });
    return () => sub.remove();
  }, [route.name, go]);

  const play = async (deck: Deck) => {
    const words = await dealWords(deck);
    go({ name: 'game', deck, words, round: Date.now() });
  };

  const finishRound = async (deck: Deck, results: CardResult[]) => {
    go({ name: 'results', deck, results });
    await markSeen(
      deck,
      results.map((r) => r.word),
    ).catch(() => {});
    await addRound({
      deckName: deck.name,
      score: results.filter((r) => r.correct).length,
      played: results.length,
    }).catch(() => {});
    reload();
  };

  const updateSettings = (s: Settings) => {
    setSettings(s);
    setSoundEnabled(s.sound);
    saveSettings(s);
  };

  const customDecks = useMemo(() => custom.map(customToDeck), [custom]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" hidden={route.name === 'game'} />
      {route.name === 'home' && (
        <HomeScreen
          customDecks={customDecks}
          history={history}
          onPlay={play}
          onNewDeck={() => setRoute({ name: 'editor' })}
          onEditDeck={(d) => setRoute({ name: 'editor', existing: custom.find((c) => c.id === d.id) })}
          onSettings={() => setSettingsOpen(true)}
        />
      )}
      {route.name === 'game' && (
        <GameScreen
          key={route.round}
          deck={route.deck}
          words={route.words}
          roundSeconds={settings.roundSeconds}
          haptics={settings.haptics}
          onQuit={() => go({ name: 'home' })}
          onFinish={(results) => finishRound(route.deck, results)}
        />
      )}
      {route.name === 'results' && (
        <ResultsScreen
          deck={route.deck}
          results={route.results}
          onPlayAgain={() => play(route.deck)}
          onHome={() => setRoute({ name: 'home' })}
        />
      )}
      {route.name === 'editor' && (
        <EditorScreen
          existing={route.existing}
          onDone={(changed) => {
            if (changed) reload();
            setRoute({ name: 'home' });
          }}
        />
      )}
      <Animated.View
        pointerEvents={covering ? 'auto' : 'none'}
        style={[StyleSheet.absoluteFill, { backgroundColor: colors.card, opacity: cover }]}
      />
      <SettingsPanel
        visible={settingsOpen}
        settings={settings}
        onChange={updateSettings}
        onClose={() => setSettingsOpen(false)}
      />
    </SafeAreaProvider>
  );
}
