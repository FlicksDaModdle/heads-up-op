import 'package:shared_preferences/shared_preferences.dart';

const roundLengthOptions = [30, 60, 90, 120];

/// A finished round, shown under "Recent rounds" on the home screen.
class RoundSummary {
  const RoundSummary({
    required this.deckName,
    required this.score,
    required this.played,
  });

  final String deckName;
  final int score;
  final int played;

  String encode() => '$score|$played|$deckName';

  static RoundSummary? decode(String raw) {
    final parts = raw.split('|');
    if (parts.length < 3) return null;
    final score = int.tryParse(parts[0]);
    final played = int.tryParse(parts[1]);
    if (score == null || played == null) return null;
    return RoundSummary(
      deckName: parts.sublist(2).join('|'),
      score: score,
      played: played,
    );
  }
}

/// Persisted settings and round history.
class Prefs {
  static const _roundSecondsKey = 'roundSeconds';
  static const _hapticsKey = 'haptics';
  static const _historyKey = 'history';
  static const maxHistory = 10;

  static Future<int> roundSeconds() async =>
      (await SharedPreferences.getInstance()).getInt(_roundSecondsKey) ?? 60;

  static Future<void> setRoundSeconds(int seconds) async =>
      (await SharedPreferences.getInstance()).setInt(_roundSecondsKey, seconds);

  static Future<bool> haptics() async =>
      (await SharedPreferences.getInstance()).getBool(_hapticsKey) ?? true;

  static Future<void> setHaptics(bool on) async =>
      (await SharedPreferences.getInstance()).setBool(_hapticsKey, on);

  /// Most recent first.
  static Future<List<RoundSummary>> history() async {
    final raw =
        (await SharedPreferences.getInstance()).getStringList(_historyKey) ??
        const [];
    return raw.map(RoundSummary.decode).whereType<RoundSummary>().toList();
  }

  static Future<void> addRound(RoundSummary round) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getStringList(_historyKey) ?? const [];
    await prefs.setStringList(
      _historyKey,
      [round.encode(), ...raw].take(maxHistory).toList(),
    );
  }
}
