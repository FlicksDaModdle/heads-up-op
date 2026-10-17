import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:forehead_frenzy/game/custom_decks.dart';
import 'package:forehead_frenzy/screens/deck_editor_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() => SharedPreferences.setMockInitialValues({}));

  test('parseWords splits lines and commas, trims and dedupes', () {
    expect(
      CustomDeck.parseWords(' Cat \n\ndog, Bird\ncat\n  ,  '),
      ['Cat', 'dog', 'Bird'],
    );
  });

  test('store adds, replaces and deletes decks', () async {
    const deck = CustomDeck(
      id: '1',
      name: 'Family',
      colorIndex: 2,
      words: ['Mum', 'Dad', 'Gran'],
    );
    await CustomDeckStore.upsert(deck);
    expect((await CustomDeckStore.load()).single.name, 'Family');

    await CustomDeckStore.upsert(
      const CustomDeck(id: '1', name: 'Fam', colorIndex: 0, words: ['A']),
    );
    final loaded = await CustomDeckStore.load();
    expect(loaded.single.name, 'Fam');
    expect(loaded.single.toDeck().isCustom, isTrue);

    await CustomDeckStore.delete('1');
    expect(await CustomDeckStore.load(), isEmpty);
  });

  testWidgets('editor validates and saves a new deck', (tester) async {
    // The editor pops when it saves, so open it on top of another route.
    await tester.pumpWidget(
      MaterialApp(
        home: Builder(
          builder: (context) => TextButton(
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute<bool>(builder: (_) => const DeckEditorScreen()),
            ),
            child: const Text('open'),
          ),
        ),
      ),
    );
    await tester.tap(find.text('open'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Save'));
    await tester.pump();
    expect(find.text('Give your deck a name.'), findsOneWidget);

    await tester.enterText(find.byKey(const Key('deckName')), 'Office');
    await tester.enterText(find.byKey(const Key('deckWords')), 'Stapler');
    await tester.tap(find.text('Save'));
    await tester.pump();
    expect(find.text('Add at least 3 words.'), findsOneWidget);

    await tester.enterText(
      find.byKey(const Key('deckWords')),
      'Stapler\nPrinter\nCoffee',
    );
    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();

    final saved = (await CustomDeckStore.load()).single;
    expect(saved.name, 'Office');
    expect(saved.words, ['Stapler', 'Printer', 'Coffee']);
  });
}
