import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:heads_up/game/decks.dart';
import 'package:heads_up/main.dart';
import 'package:heads_up/screens/game_screen.dart';

const _deck = Deck(
  name: 'Test',
  icon: Icons.star,
  color: Colors.blue,
  words: ['Alpha', 'Bravo', 'Charlie'],
);

void main() {
  testWidgets('home lists every built-in deck', (tester) async {
    tester.view.physicalSize = const Size(1334, 750);
    tester.view.devicePixelRatio = 2;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(const HeadsUpApp());
    for (final deck in builtInDecks) {
      await tester.scrollUntilVisible(find.text(deck.name), 100);
      expect(find.text(deck.name), findsOneWidget);
    }
  });

  testWidgets('tilting plays through a round to the results', (tester) async {
    tester.view.physicalSize = const Size(1334, 750);
    tester.view.devicePixelRatio = 2;
    addTearDown(tester.view.reset);

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
    expect(find.text('Place on forehead'), findsOneWidget);

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

    expect(find.byKey(const Key('score')), findsOneWidget);
    expect(tester.widget<Text>(find.byKey(const Key('score'))).data, '2');
  });
}
