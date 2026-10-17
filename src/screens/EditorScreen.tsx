import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlayButton, SquareIconButton } from '../components/ui';
import {
  deleteCustomDeck,
  parseWords,
  upsertCustomDeck,
  type CustomDeck,
} from '../game/storage';
import { colors, customDeckColors, fonts } from '../theme';

const MIN_WORDS = 3;

/** Creates a new custom deck, or edits [existing]. */
export function EditorScreen({
  existing,
  onDone,
}: {
  existing?: CustomDeck;
  onDone: (changed: boolean) => void;
}) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(existing?.name ?? '');
  const [text, setText] = useState(existing?.words.join('\n') ?? '');
  const [colorIndex, setColorIndex] = useState(existing?.colorIndex ?? 0);
  const [error, setError] = useState<string | null>(null);
  const count = parseWords(text).length;

  const save = async () => {
    const words = parseWords(text);
    if (!name.trim()) return setError('Give your deck a name.');
    if (words.length < MIN_WORDS) return setError(`Add at least ${MIN_WORDS} words.`);
    await upsertCustomDeck({
      id: existing?.id ?? `custom-${Date.now()}`,
      name: name.trim(),
      colorIndex,
      words,
    });
    onDone(true);
  };

  const remove = () => {
    if (!existing) return;
    const doDelete = async () => {
      await deleteCustomDeck(existing.id);
      onDone(true);
    };
    if (Platform.OS === 'web') {
      // Alert buttons are not supported on web.
      if (globalThis.confirm?.(`Delete "${existing.name}"?`)) doDelete();
      return;
    }
    Alert.alert(`Delete "${existing.name}"?`, 'This deck and its words will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: doDelete },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.bar, { paddingTop: insets.top + 10 }]}>
        <SquareIconButton icon="chevron-back" label="Back" onPress={() => onDone(false)} />
        <Text style={styles.title}>{existing ? 'Edit Deck' : 'New Deck'}</Text>
        {existing ? (
          <SquareIconButton icon="trash-outline" label="Delete deck" onPress={remove} />
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>
      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient colors={customDeckColors[colorIndex]} style={styles.preview}>
          <Text style={styles.previewEmoji}>✏️</Text>
          <Text style={styles.previewName} numberOfLines={2} adjustsFontSizeToFit>
            {name.trim() || 'Your Deck'}
          </Text>
        </LinearGradient>

        <Text style={styles.label}>Deck name</Text>
        <TextInput
          testID="deckName"
          value={name}
          onChangeText={setName}
          maxLength={30}
          placeholder="e.g. Inside Jokes"
          placeholderTextColor="#90A4AE"
          style={styles.input}
        />

        <Text style={styles.label}>Colour</Text>
        <View style={styles.swatches}>
          {customDeckColors.map((c, i) => (
            <Pressable
              key={i}
              onPress={() => setColorIndex(i)}
              accessibilityRole="button"
              accessibilityLabel={`Colour ${i + 1}`}
            >
              <LinearGradient colors={c} style={styles.swatch}>
                {i === colorIndex && <Ionicons name="checkmark" size={22} color="#fff" />}
              </LinearGradient>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Words ({count})</Text>
        <TextInput
          testID="deckWords"
          value={text}
          onChangeText={setText}
          multiline
          placeholder={'One per line\n(or separated by commas)'}
          placeholderTextColor="#90A4AE"
          style={[styles.input, styles.words]}
          textAlignVertical="top"
        />
        {error && <Text style={styles.error}>{error}</Text>}
        <PlayButton label="Save Deck" onPress={save} style={{ marginTop: 18 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  title: { fontFamily: fonts.black, fontSize: 30, color: colors.white },
  body: { paddingHorizontal: 20 },
  preview: {
    alignSelf: 'center',
    width: 120,
    aspectRatio: 2 / 3,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    marginVertical: 8,
  },
  previewEmoji: { fontSize: 50, marginTop: 8 },
  previewName: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  },
  label: { fontFamily: fonts.black, fontSize: 18, color: colors.white, marginTop: 16, marginBottom: 6 },
  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.ink,
  },
  words: { minHeight: 200 },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 3,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: { fontFamily: fonts.black, color: colors.yellow, fontSize: 16, marginTop: 10 },
});
