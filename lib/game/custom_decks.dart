import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'decks.dart';

/// Colours a player can pick for their own deck.
const customDeckColors = <Color>[
  Color(0xFFFF3D7F),
  Color(0xFF7C4DFF),
  Color(0xFF00B8D4),
  Color(0xFF00C853),
  Color(0xFFFFAB00),
  Color(0xFFFF6D00),
  Color(0xFF546E7A),
];

/// A word list the player wrote themselves.
class CustomDeck {
  const CustomDeck({
    required this.id,
    required this.name,
    required this.colorIndex,
    required this.words,
  });

  final String id;
  final String name;
  final int colorIndex;
  final List<String> words;

  Color get color =>
      customDeckColors[colorIndex.clamp(0, customDeckColors.length - 1)];

  Deck toDeck() => Deck(
    name: name,
    icon: Icons.edit_note,
    color: color,
    blurb: 'Your own list. Give clues any way you like, '
        'just never say the word itself.',
    words: words,
    customId: id,
  );

  Map<String, Object> toJson() => {
    'id': id,
    'name': name,
    'color': colorIndex,
    'words': words,
  };

  static CustomDeck? fromJson(Object? json) {
    if (json is! Map) return null;
    final id = json['id'], name = json['name'], words = json['words'];
    if (id is! String || name is! String || words is! List) return null;
    return CustomDeck(
      id: id,
      name: name,
      colorIndex: json['color'] is int ? json['color'] as int : 0,
      words: words.whereType<String>().toList(),
    );
  }

  /// Splits pasted text into words: one per line (commas also work).
  static List<String> parseWords(String text) {
    final seen = <String>{};
    return text
        .split(RegExp(r'[\n,]'))
        .map((w) => w.trim())
        .where((w) => w.isNotEmpty && seen.add(w.toLowerCase()))
        .toList();
  }
}

/// Persists the player's own decks on the device.
class CustomDeckStore {
  static const _key = 'customDecks';

  static Future<List<CustomDeck>> load() async {
    final raw = (await SharedPreferences.getInstance()).getString(_key);
    if (raw == null) return [];
    try {
      final list = jsonDecode(raw);
      if (list is! List) return [];
      return list.map(CustomDeck.fromJson).whereType<CustomDeck>().toList();
    } on FormatException {
      return [];
    }
  }

  static Future<void> _save(List<CustomDeck> decks) async =>
      (await SharedPreferences.getInstance()).setString(
        _key,
        jsonEncode([for (final d in decks) d.toJson()]),
      );

  /// Adds the deck, or replaces the one with the same id.
  static Future<void> upsert(CustomDeck deck) async {
    final decks = await load();
    final i = decks.indexWhere((d) => d.id == deck.id);
    i >= 0 ? decks[i] = deck : decks.add(deck);
    await _save(decks);
  }

  static Future<void> delete(String id) async {
    final decks = await load();
    decks.removeWhere((d) => d.id == id);
    await _save(decks);
  }
}
