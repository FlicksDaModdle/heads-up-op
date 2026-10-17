import 'package:flutter/material.dart';

import '../game/custom_decks.dart';

/// Creates a new custom deck, or edits [existing]. Pops `true` on any change.
class DeckEditorScreen extends StatefulWidget {
  const DeckEditorScreen({super.key, this.existing});

  final CustomDeck? existing;

  @override
  State<DeckEditorScreen> createState() => _DeckEditorScreenState();
}

class _DeckEditorScreenState extends State<DeckEditorScreen> {
  static const minWords = 3;

  late final _name = TextEditingController(text: widget.existing?.name);
  late final _words = TextEditingController(
    text: widget.existing?.words.join('\n'),
  );
  late int _colorIndex = widget.existing?.colorIndex ?? 0;
  String? _error;

  @override
  void initState() {
    super.initState();
    _words.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _name.dispose();
    _words.dispose();
    super.dispose();
  }

  int get _wordCount => CustomDeck.parseWords(_words.text).length;

  Future<void> _save() async {
    final name = _name.text.trim();
    final words = CustomDeck.parseWords(_words.text);
    if (name.isEmpty) {
      setState(() => _error = 'Give your deck a name.');
      return;
    }
    if (words.length < minWords) {
      setState(() => _error = 'Add at least $minWords words.');
      return;
    }
    await CustomDeckStore.upsert(
      CustomDeck(
        id:
            widget.existing?.id ??
            DateTime.now().microsecondsSinceEpoch.toString(),
        name: name,
        colorIndex: _colorIndex,
        words: words,
      ),
    );
    if (mounted) Navigator.of(context).pop(true);
  }

  Future<void> _delete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Delete "${widget.existing!.name}"?'),
        content: const Text('This deck and its words will be removed.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    await CustomDeckStore.delete(widget.existing!.id);
    if (mounted) Navigator.of(context).pop(true);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.existing == null ? 'New deck' : 'Edit deck'),
        actions: [
          if (widget.existing != null)
            IconButton(
              tooltip: 'Delete deck',
              icon: const Icon(Icons.delete_outline),
              onPressed: _delete,
            ),
          TextButton(onPressed: _save, child: const Text('Save')),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          TextField(
            key: const Key('deckName'),
            controller: _name,
            textCapitalization: TextCapitalization.words,
            maxLength: 30,
            decoration: const InputDecoration(
              labelText: 'Deck name',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              for (var i = 0; i < customDeckColors.length; i++)
                GestureDetector(
                  onTap: () => setState(() => _colorIndex = i),
                  child: CircleAvatar(
                    radius: 20,
                    backgroundColor: customDeckColors[i],
                    child: i == _colorIndex
                        ? const Icon(Icons.check, color: Colors.white)
                        : null,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 20),
          TextField(
            key: const Key('deckWords'),
            controller: _words,
            minLines: 8,
            maxLines: null,
            textCapitalization: TextCapitalization.sentences,
            decoration: InputDecoration(
              labelText: 'Words',
              hintText: 'One per line (or separated by commas)',
              helperText: '$_wordCount words',
              border: const OutlineInputBorder(),
              alignLabelWithHint: true,
            ),
          ),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Text(
                _error!,
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              ),
            ),
        ],
      ),
    );
  }
}
