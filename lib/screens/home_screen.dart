import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../game/decks.dart';
import 'game_screen.dart';

const _roundLengthKey = 'roundSeconds';
const _roundLengthOptions = [30, 60, 90, 120];

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _roundSeconds = 60;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getInt(_roundLengthKey);
    if (saved != null && mounted) setState(() => _roundSeconds = saved);
  }

  Future<void> _setRoundSeconds(int seconds) async {
    setState(() => _roundSeconds = seconds);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_roundLengthKey, seconds);
  }

  void _openSettings() {
    showModalBottomSheet<void>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setSheetState) => Padding(
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
                  for (final s in _roundLengthOptions)
                    ButtonSegment(value: s, label: Text('${s}s')),
                ],
                selected: {_roundSeconds},
                onSelectionChanged: (selection) {
                  _setRoundSeconds(selection.first);
                  setSheetState(() {});
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _play(Deck deck) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => GameScreen(deck: deck, roundSeconds: _roundSeconds),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 12, 24, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(
                    'Heads Up',
                    style: textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const Spacer(),
                  Chip(
                    avatar: const Icon(Icons.timer_outlined, size: 18),
                    label: Text('${_roundSeconds}s'),
                  ),
                  IconButton(
                    tooltip: 'Settings',
                    icon: const Icon(Icons.settings),
                    onPressed: _openSettings,
                  ),
                ],
              ),
              Text(
                'Pick a deck, then hold the phone to your forehead.',
                style: textTheme.bodyMedium?.copyWith(color: Colors.white70),
              ),
              const SizedBox(height: 12),
              Expanded(
                child: GridView.builder(
                  padding: const EdgeInsets.only(bottom: 24),
                  gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                    maxCrossAxisExtent: 220,
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 1.4,
                  ),
                  itemCount: builtInDecks.length,
                  itemBuilder: (context, i) => _DeckCard(
                    deck: builtInDecks[i],
                    onTap: () => _play(builtInDecks[i]),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DeckCard extends StatelessWidget {
  const _DeckCard({required this.deck, required this.onTap});

  final Deck deck;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: deck.color,
      borderRadius: BorderRadius.circular(16),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(deck.icon, size: 30, color: Colors.white),
              const Spacer(),
              // Scales the label down rather than overflowing small cards.
              FittedBox(
                fit: BoxFit.scaleDown,
                alignment: Alignment.bottomLeft,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      deck.name,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
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
    );
  }
}
