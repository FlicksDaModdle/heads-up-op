import 'package:flutter/material.dart';

import '../game/decks.dart';
import 'game_screen.dart';

class ResultsScreen extends StatelessWidget {
  const ResultsScreen({
    super.key,
    required this.deck,
    required this.roundSeconds,
    required this.results,
    this.haptics = true,
  });

  final Deck deck;
  final int roundSeconds;
  final bool haptics;
  final List<CardResult> results;

  @override
  Widget build(BuildContext context) {
    final score = results.where((r) => r.correct).length;
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Container(
              width: double.infinity,
              margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              padding: const EdgeInsets.symmetric(vertical: 20),
              decoration: BoxDecoration(
                color: deck.color,
                borderRadius: BorderRadius.circular(24),
              ),
              child: Column(
                children: [
                  Text(
                    deck.name,
                    style: const TextStyle(fontSize: 20, color: Colors.white70),
                  ),
                  Text(
                    '$score',
                    key: const Key('score'),
                    style: const TextStyle(
                      fontSize: 96,
                      fontWeight: FontWeight.w900,
                      height: 1,
                      color: Colors.white,
                    ),
                  ),
                  Text(
                    score == 1 ? 'word guessed' : 'words guessed',
                    style: const TextStyle(fontSize: 20, color: Colors.white),
                  ),
                ],
              ),
            ),
            Expanded(
              child: results.isEmpty
                  ? const Center(child: Text('No cards played'))
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      itemCount: results.length,
                      itemBuilder: (context, i) {
                        final r = results[i];
                        return ListTile(
                          leading: Icon(
                            r.correct ? Icons.check_circle : Icons.cancel,
                            color: r.correct
                                ? Colors.greenAccent
                                : Colors.white24,
                          ),
                          title: Text(
                            r.word,
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: r.correct
                                  ? FontWeight.w700
                                  : FontWeight.normal,
                              color: r.correct ? null : Colors.white38,
                            ),
                          ),
                        );
                      },
                    ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.home),
                      label: const Text('Decks'),
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton.icon(
                      icon: const Icon(Icons.replay),
                      label: const Text('Play again'),
                      onPressed: () => Navigator.of(context).pushReplacement(
                        MaterialPageRoute(
                          builder: (_) => GameScreen(
                            deck: deck,
                            roundSeconds: roundSeconds,
                            haptics: haptics,
                          ),
                        ),
                      ),
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
