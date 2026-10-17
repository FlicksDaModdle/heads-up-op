import 'package:flutter/material.dart';

import '../game/decks.dart';
import 'game_screen.dart';

class ResultsScreen extends StatelessWidget {
  const ResultsScreen({
    super.key,
    required this.deck,
    required this.roundSeconds,
    required this.results,
  });

  final Deck deck;
  final int roundSeconds;
  final List<CardResult> results;

  @override
  Widget build(BuildContext context) {
    final score = results.where((r) => r.correct).length;
    return Scaffold(
      body: SafeArea(
        child: Row(
          children: [
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    deck.name,
                    style: const TextStyle(fontSize: 22, color: Colors.white70),
                  ),
                  Text(
                    '$score',
                    key: const Key('score'),
                    style: const TextStyle(
                      fontSize: 120,
                      fontWeight: FontWeight.w900,
                      height: 1,
                    ),
                  ),
                  Text('correct', style: const TextStyle(fontSize: 22)),
                  const SizedBox(height: 24),
                  Wrap(
                    spacing: 12,
                    children: [
                      FilledButton.icon(
                        icon: const Icon(Icons.replay),
                        label: const Text('Play again'),
                        onPressed: () => Navigator.of(context).pushReplacement(
                          MaterialPageRoute(
                            builder: (_) => GameScreen(
                              deck: deck,
                              roundSeconds: roundSeconds,
                            ),
                          ),
                        ),
                      ),
                      OutlinedButton.icon(
                        icon: const Icon(Icons.home),
                        label: const Text('Decks'),
                        onPressed: () => Navigator.of(context).pop(),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            Expanded(
              child: results.isEmpty
                  ? const Center(child: Text('No cards played'))
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      itemCount: results.length,
                      itemBuilder: (context, i) {
                        final r = results[i];
                        return ListTile(
                          leading: Icon(
                            r.correct ? Icons.check_circle : Icons.cancel,
                            color: r.correct
                                ? Colors.greenAccent
                                : Colors.orangeAccent,
                          ),
                          title: Text(
                            r.word,
                            style: TextStyle(
                              fontSize: 20,
                              color: r.correct ? null : Colors.white54,
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
