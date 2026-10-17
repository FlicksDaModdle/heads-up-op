import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:forehead_frenzy/game/decks.dart';
import 'package:forehead_frenzy/game/prefs.dart';
import 'package:forehead_frenzy/main.dart';
import 'package:forehead_frenzy/screens/game_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _deck = Deck(
  name: 'Test',
  icon: Icons.star,
  color: Colors.blue,
  blurb: 'Test deck.',
  words: ['Alpha', 'Bravo', 'Charlie'],
);

void _landscape(WidgetTester tester) {
  tester.view.physicalSize = const Size(1334, 750);
  tester.view.devicePixelRatio = 2;
  addTearDown(tester.view.reset);
}

void main() {
  setUp(() => SharedPreferences.setMockInitialValues({}));

  testWidgets('home lists every built-in deck', (tester) async {
    tester.view.physicalSize = const Size(750, 1334);
    tester.view.devicePixelRatio = 2;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(const FrenzyApp());
    await tester.pumpAndSettle();
    final decks = find.descendant(
      of: find.byKey(const Key('decks')),
      matching: find.byType(Scrollable),
    );
    for (final deck in builtInDecks) {
      await tester.scrollUntilVisible(
        find.text(deck.name),
        100,
        scrollable: decks,
      );
      expect(find.text(deck.name), findsOneWidget);
    }
    expect(find.text('New deck'), findsOneWidget);
  });

  testWidgets('tilting plays through a round to the results', (tester) async {
    _landscape(tester);
    final tilt = StreamController<double>();
    addTearDown(tilt.close);

    await tester.pumpWidget(
      MaterialApp(
        home: GameScreen(
          deck: _deck,
          roundSeconds: 60,
          tiltStream: tilt.stream,
        ),
      ),
    );
    expect(find.textContaining('forehead'), findsOneWidget);

    Future<void> feed(double z, {int times = 8}) async {
      for (var i = 0; i < times; i++) {
        tilt.add(z);
        await tester.pump(const Duration(milliseconds: 20));
      }
    }

    await feed(0); // upright -> countdown
    expect(find.text('3'), findsOneWidget);
    await tester.pump(const Duration(seconds: 3));

    // Correct, pass, correct.
    for (final z in [-9.8, 9.8, -9.8]) {
      expect(
        find.textContaining(RegExp('Alpha|Bravo|Charlie')),
        findsOneWidget,
      );
      await feed(z);
      await tester.pump(const Duration(milliseconds: 800));
      await feed(0);
    }
    await tester.pumpAndSettle();

    expect(tester.widget<Text>(find.byKey(const Key('score'))).data, '2');
    final history = await Prefs.history();
    expect(history.single.score, 2);
    expect(history.single.played, 3);
  });

  testWidgets('time running out shows "Time\'s up!" then results', (
    tester,
  ) async {
    _landscape(tester);
    await tester.pumpWidget(
      const MaterialApp(
        home: GameScreen(
          deck: _deck,
          roundSeconds: 2,
          tiltStream: Stream.empty(),
        ),
      ),
    );
    await tester.tap(find.byType(GameScreen)); // tap to start
    await tester.pump(const Duration(seconds: 3)); // countdown
    await tester.pump(const Duration(seconds: 2)); // round
    expect(find.text("Time's up!"), findsOneWidget);

    await tester.pump(const Duration(milliseconds: 1600));
    await tester.pumpAndSettle();
    // The word on screen when time ran out counts as missed.
    expect(tester.widget<Text>(find.byKey(const Key('score'))).data, '0');
  });
}
