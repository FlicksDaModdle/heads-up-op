import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import type { Settings } from '../game/types';
import { play } from '../sound';
import { colors, fonts, roundLengthOptions } from '../theme';
import { PlayButton } from './ui';

export function SettingsPanel({
  visible,
  settings,
  onChange,
  onClose,
}: {
  visible: boolean;
  settings: Settings;
  onChange: (s: Settings) => void;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      supportedOrientations={['landscape-left', 'landscape-right']}
    >
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      {/* Landscape: a centred sheet whose body scrolls if the screen is short. */}
      <View style={styles.sheet}>
        <ScrollView contentContainerStyle={styles.sheetBody}>
        <Text style={styles.brand}>Forehead Frenzy!</Text>

        <Text style={styles.section}>Round length</Text>
        <View style={styles.box}>
          <View style={styles.chips}>
            {roundLengthOptions.map((s) => {
              const on = settings.roundSeconds === s;
              return (
                <Pressable
                  key={s}
                  onPress={() => {
                    play('tap');
                    onChange({ ...settings, roundSeconds: s });
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  style={[styles.chip, on && styles.chipOn]}
                >
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>{s}s</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Text style={styles.section}>Settings</Text>
        <View style={[styles.box, styles.switchRow, { marginBottom: 8 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.optionTitle}>Sound effects</Text>
            <Text style={styles.optionSub}>Beeps, dings and buzzers</Text>
          </View>
          <Switch
            value={settings.sound}
            onValueChange={(sound) => {
              onChange({ ...settings, sound });
              if (sound) play('tap');
            }}
            trackColor={{ true: '#4ADE80', false: 'rgba(255,255,255,0.3)' }}
            thumbColor={colors.white}
          />
        </View>
        <View style={[styles.box, styles.switchRow]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.optionTitle}>Vibration</Text>
            <Text style={styles.optionSub}>Buzz on correct, pass and time's up</Text>
          </View>
          <Switch
            value={settings.haptics}
            onValueChange={(haptics) => onChange({ ...settings, haptics })}
            trackColor={{ true: '#4ADE80', false: 'rgba(255,255,255,0.3)' }}
            thumbColor={colors.white}
          />
        </View>

        <Text style={styles.about}>
          Open source · not affiliated with any other party game
        </Text>
        <PlayButton label="Done" onPress={onClose} style={{ marginTop: 14 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,20,60,0.55)' },
  sheet: {
    position: 'absolute',
    alignSelf: 'center',
    top: '5%',
    bottom: '5%',
    width: '90%',
    maxWidth: 560,
    backgroundColor: colors.skyDeep,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: colors.white,
    overflow: 'hidden',
  },
  sheetBody: { padding: 20 },
  brand: {
    fontFamily: fonts.display,
    fontSize: 34,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 2,
  },
  section: { fontFamily: fonts.black, fontSize: 20, color: colors.white, marginTop: 14, marginBottom: 8 },
  box: { backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 14, padding: 12 },
  chips: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  chipOn: { backgroundColor: colors.yellow },
  chipText: { fontFamily: fonts.black, fontSize: 18, color: colors.white },
  chipTextOn: { color: colors.ink },
  switchRow: { flexDirection: 'row', alignItems: 'center' },
  optionTitle: { fontFamily: fonts.black, fontSize: 18, color: colors.white },
  optionSub: { fontFamily: fonts.bold, fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  about: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 18,
  },
});
