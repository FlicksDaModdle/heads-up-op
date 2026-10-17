import { KaushanScript_400Regular } from '@expo-google-fonts/kaushan-script';
import { LilitaOne_400Regular } from '@expo-google-fonts/lilita-one';
import {
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from '@expo-google-fonts/nunito';
import { useFonts } from 'expo-font';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SettingsPanel } from './src/components/SettingsPanel';
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
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
  }, [reload]);

  // Android back: anywhere but home goes home.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (route.name === 'home') return false;
      setRoute({ name: 'home' });
      return true;
    });
    return () => sub.remove();
  }, [route.name]);

  const play = async (deck: Deck) => {
    const words = await dealWords(deck);
    setRoute({ name: 'game', deck, words, round: Date.now() });
  };

  const finishRound = async (deck: Deck, results: CardResult[]) => {
    setRoute({ name: 'results', deck, results });
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

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.sky, justifyContent: 'center' }}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" hidden={route.name === 'game'} />
      {route.name === 'home' && (
        <HomeScreen
          customDecks={custom.map(customToDeck)}
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
          onQuit={() => setRoute({ name: 'home' })}
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
      <SettingsPanel
        visible={settingsOpen}
        settings={settings}
        onChange={updateSettings}
        onClose={() => setSettingsOpen(false)}
      />
    </SafeAreaProvider>
  );
}
