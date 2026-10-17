import 'dart:math';

import 'package:flutter/material.dart';

import '../game/custom_decks.dart';
import '../game/decks.dart';
import '../game/prefs.dart';
import 'deck_editor_screen.dart';
import 'game_screen.dart';

enum DeckAction { play, edit }

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _roundSeconds = 60;
  bool _haptics = true;
  List<RoundSummary> _history = const [];
  List<CustomDeck> _custom = const [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final seconds = await Prefs.roundSeconds();
    final haptics = await Prefs.haptics();
    final history = await Prefs.history();
    final custom = await CustomDeckStore.load();
    if (!mounted) return;
    setState(() {
      _custom = custom;
      _roundSeconds = seconds;
      _haptics = haptics;
      _history = history;
    });
  }

  void _openSettings() {
    showModalBottomSheet<void>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setSheetState) => SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Round length',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 16),
                SegmentedButton<int>(
                  segments: [
                    for (final s in roundLengthOptions)
                      ButtonSegment(value: s, label: Text('${s}s')),
                  ],
                  selected: {_roundSeconds},
                  onSelectionChanged: (selection) {
                    setState(() => _roundSeconds = selection.first);
                    setSheetState(() {});
                    Prefs.setRoundSeconds(selection.first);
                  },
                ),
                const SizedBox(height: 8),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Vibration'),
                  subtitle: const Text('Buzz on correct, pass and time up'),
                  value: _haptics,
                  onChanged: (on) {
                    setState(() => _haptics = on);
                    setSheetState(() {});
                    Prefs.setHaptics(on);
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _editDeck([CustomDeck? existing]) async {
    final changed = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => DeckEditorScreen(existing: existing)),
    );
    if (changed == true) _load();
  }

  Future<void> _openDeck(Deck deck) async {
    final action = await showGeneralDialog<DeckAction>(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Close',
      barrierColor: Colors.black54,
      transitionDuration: const Duration(milliseconds: 220),
      pageBuilder: (_, _, _) => DeckDetail(deck: deck),
      transitionBuilder: (_, animation, _, child) => ScaleTransition(
        scale: CurvedAnimation(parent: animation, curve: Curves.easeOutBack),
        child: child,
      ),
    );
    if (action == DeckAction.edit) {
      _editDeck(_custom.firstWhere((d) => d.id == deck.customId));
      return;
    }
    if (action != DeckAction.play || !mounted) return;
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => GameScreen(
          deck: deck,
          roundSeconds: _roundSeconds,
          haptics: _haptics,
        ),
      ),
    );
    _load();
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Scaffold(
      floatingActionButton: FloatingActionButton(
        tooltip: 'Settings',
        onPressed: _openSettings,
        child: const Icon(Icons.settings),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.only(bottom: 96),
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 4),
              child: Text(
                'Forehead\nFrenzy',
                style: textTheme.displaySmall?.copyWith(
                  fontWeight: FontWeight.w900,
                  height: 1,
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Text(
                'Phone on your forehead. Friends shout clues. Go!',
                style: textTheme.bodyMedium?.copyWith(color: Colors.white70),
              ),
            ),
            const _SectionTitle('Decks'),
            SizedBox(
              height: 210,
              child: ListView.separated(
                key: const Key('decks'),
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                itemCount: builtInDecks.length,
                separatorBuilder: (_, _) => const SizedBox(width: 12),
                itemBuilder: (context, i) => DeckPoster(
                  deck: builtInDecks[i],
                  onTap: () => _openDeck(builtInDecks[i]),
                ),
              ),
            ),
            const _SectionTitle('Your decks'),
            SizedBox(
              height: 210,
              child: ListView.separated(
                key: const Key('customDecks'),
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                itemCount: _custom.length + 1,
                separatorBuilder: (_, _) => const SizedBox(width: 12),
                itemBuilder: (context, i) {
                  if (i == 0) return _NewDeckPoster(onTap: _editDeck);
                  final deck = _custom[i - 1].toDeck();
                  return DeckPoster(deck: deck, onTap: () => _openDeck(deck));
                },
              ),
            ),
            const _SectionTitle('Recent rounds'),
            if (_history.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 20),
                child: Text(
                  'Play a round and your scores land here.',
                  style: TextStyle(color: Colors.white54),
                ),
              )
            else
              for (final round in _history)
                ListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 20),
                  leading: CircleAvatar(child: Text('${round.score}')),
                  title: Text(round.deckName),
                  subtitle: Text('${round.score} of ${round.played} guessed'),
                ),
          ],
        ),
      ),
    );
  }
}

class _NewDeckPoster extends StatelessWidget {
  const _NewDeckPoster({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: 2 / 3,
      child: Material(
        color: Colors.white10,
        borderRadius: BorderRadius.circular(14),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: const Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.add_circle_outline, size: 44),
              SizedBox(height: 8),
              Text(
                'New deck',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
              ),
              Text('Write your own', style: TextStyle(color: Colors.white54)),
            ],
          ),
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 28, 20, 12),
      child: Text(
        text,
        style: Theme.of(
          context,
        ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800),
      ),
    );
  }
}

/// Tall deck card, drawn entirely in code.
class DeckPoster extends StatelessWidget {
  const DeckPoster({super.key, required this.deck, this.onTap});

  final Deck deck;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final dark = Color.lerp(deck.color, Colors.black, 0.45)!;
    return AspectRatio(
      aspectRatio: 2 / 3,
      child: Material(
        borderRadius: BorderRadius.circular(14),
        clipBehavior: Clip.antiAlias,
        elevation: 4,
        child: InkWell(
          onTap: onTap,
          child: Ink(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [deck.color, dark],
              ),
            ),
            child: Stack(
              children: [
                Positioned(
                  right: -18,
                  top: 10,
                  child: Icon(deck.icon, size: 110, color: Colors.white24),
                ),
                Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(deck.icon, color: Colors.white, size: 28),
                      const Spacer(),
                      Text(
                        deck.name,
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                          height: 1.05,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${deck.words.length} cards',
                        style: const TextStyle(color: Colors.white70),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Deck rules panel shown before a round. Pops the chosen [DeckAction].
class DeckDetail extends StatelessWidget {
  DeckDetail({super.key, required this.deck})
    : _samples = ([...deck.words]..shuffle()).take(3).toList();

  final Deck deck;
  final List<String> _samples;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
        child: Column(
          children: [
            Expanded(
              child: Material(
                color: deck.color,
                borderRadius: BorderRadius.circular(24),
                clipBehavior: Clip.antiAlias,
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(deck.icon, size: 56, color: Colors.white),
                      const SizedBox(height: 12),
                      Text(
                        deck.name,
                        style: const TextStyle(
                          fontSize: 36,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                          height: 1,
                        ),
                      ),
                      const SizedBox(height: 20),
                      Expanded(
                        child: SingleChildScrollView(
                          child: Text(
                            deck.blurb,
                            style: const TextStyle(
                              fontSize: 20,
                              color: Colors.white,
                              height: 1.35,
                            ),
                          ),
                        ),
                      ),
                      Row(
                        children: [
                          IconButton.filledTonal(
                            tooltip: 'Back',
                            icon: const Icon(Icons.arrow_back),
                            onPressed: () => Navigator.of(context).pop(),
                          ),
                          if (deck.isCustom) ...[
                            const SizedBox(width: 8),
                            IconButton.filledTonal(
                              tooltip: 'Edit deck',
                              icon: const Icon(Icons.edit),
                              onPressed: () =>
                                  Navigator.of(context).pop(DeckAction.edit),
                            ),
                          ],
                          const Spacer(),
                          FilledButton(
                            style: FilledButton.styleFrom(
                              backgroundColor: Colors.white,
                              foregroundColor: Colors.black,
                              padding: const EdgeInsets.symmetric(
                                horizontal: 32,
                                vertical: 16,
                              ),
                              textStyle: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            onPressed: () =>
                                Navigator.of(context).pop(DeckAction.play),
                            child: const Text('Play!'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
            SizedBox(
              height: 110,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  for (var i = 0; i < _samples.length; i++)
                    Transform.translate(
                      offset: Offset((i - 1) * 105.0, i == 1 ? 18 : 0),
                      child: Transform.rotate(
                        angle: (i - 1) * -0.12 + (i == 1 ? 0 : pi / 90),
                        child: _SampleTile(_samples[i]),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SampleTile extends StatelessWidget {
  const _SampleTile(this.word);

  final String word;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(10),
      elevation: 3,
      child: SizedBox(
        width: 110,
        height: 56,
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 6),
            child: FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                word,
                style: const TextStyle(
                  color: Colors.black87,
                  fontWeight: FontWeight.w800,
                  fontSize: 16,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
