import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:sensors_plus/sensors_plus.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

import '../game/decks.dart';
import '../game/tilt_detector.dart';
import 'results_screen.dart';

/// One card shown during a round and whether it was guessed.
class CardResult {
  const CardResult(this.word, {required this.correct});

  final String word;
  final bool correct;
}

enum _Phase { ready, countdown, playing, feedback }

class GameScreen extends StatefulWidget {
  const GameScreen({
    super.key,
    required this.deck,
    required this.roundSeconds,
    this.tiltStream,
  });

  final Deck deck;
  final int roundSeconds;

  /// Accelerometer Z readings; defaults to the device sensor. Injectable so
  /// tests can drive the game without hardware.
  final Stream<double>? tiltStream;

  @override
  State<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> {
  static const _countdownFrom = 3;
  static const _feedbackDuration = Duration(milliseconds: 700);

  final _detector = TiltDetector();
  final _results = <CardResult>[];
  late final List<String> _words = [...widget.deck.words]..shuffle();

  StreamSubscription<double>? _tiltSub;
  Timer? _clock;
  Timer? _feedbackTimer;

  _Phase _phase = _Phase.ready;
  int _index = 0;
  int _countdown = _countdownFrom;
  late int _secondsLeft = widget.roundSeconds;
  bool _lastCorrect = false;
  bool _finished = false;

  @override
  void initState() {
    super.initState();
    _setWakelock(true);
    final stream =
        widget.tiltStream ??
        accelerometerEventStream(samplingPeriod: SensorInterval.gameInterval)
            .map((e) => e.z);
    _tiltSub = stream.listen(_onTilt, onError: (_) {});
  }

  @override
  void dispose() {
    _tiltSub?.cancel();
    _clock?.cancel();
    _feedbackTimer?.cancel();
    _setWakelock(false);
    super.dispose();
  }

  void _setWakelock(bool on) {
    // Not available in widget tests; the game works without it.
    (on ? WakelockPlus.enable() : WakelockPlus.disable()).catchError((_) {});
  }

  void _onTilt(double z) {
    final action = _detector.addSample(z);
    if (_phase == _Phase.ready && _detector.isUpright) {
      _startCountdown();
    } else if (_phase == _Phase.playing && action != null) {
      _answer(action == TiltAction.correct);
    }
  }

  void _startCountdown() {
    if (_phase != _Phase.ready) return;
    setState(() {
      _phase = _Phase.countdown;
      _countdown = _countdownFrom;
    });
    _clock = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_countdown > 1) {
        setState(() => _countdown--);
        return;
      }
      timer.cancel();
      HapticFeedback.mediumImpact();
      _detector.reset();
      setState(() => _phase = _Phase.playing);
      _clock = Timer.periodic(const Duration(seconds: 1), (_) => _tick());
    });
  }

  void _tick() {
    setState(() => _secondsLeft--);
    if (_secondsLeft <= 0) _finish();
  }

  void _answer(bool correct) {
    if (_phase != _Phase.playing) return;
    correct ? HapticFeedback.heavyImpact() : HapticFeedback.lightImpact();
    setState(() {
      _results.add(CardResult(_words[_index], correct: correct));
      _lastCorrect = correct;
      _phase = _Phase.feedback;
    });
    _feedbackTimer = Timer(_feedbackDuration, () {
      if (_index + 1 >= _words.length) {
        _finish();
        return;
      }
      setState(() {
        _index++;
        _phase = _Phase.playing;
      });
    });
  }

  void _finish() {
    if (_finished) return;
    _finished = true;
    _clock?.cancel();
    _feedbackTimer?.cancel();
    // A card still on screen when time runs out counts as missed.
    if (_phase == _Phase.playing) {
      _results.add(CardResult(_words[_index], correct: false));
    }
    HapticFeedback.vibrate();
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => ResultsScreen(
          deck: widget.deck,
          roundSeconds: widget.roundSeconds,
          results: List.unmodifiable(_results),
        ),
      ),
    );
  }

  /// Tap fallback: right half = correct, left half = pass.
  void _onTapUp(TapUpDetails details) {
    switch (_phase) {
      case _Phase.ready:
        _startCountdown();
      case _Phase.playing:
        final width = MediaQuery.sizeOf(context).width;
        _answer(details.localPosition.dx > width / 2);
      case _Phase.countdown:
      case _Phase.feedback:
        break;
    }
  }

  Color get _background => switch (_phase) {
    _Phase.feedback =>
      _lastCorrect ? const Color(0xFF2E7D32) : const Color(0xFFEF6C00),
    _ => widget.deck.color,
  };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTapUp: _onTapUp,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          color: _background,
          child: SafeArea(
            child: Stack(
              children: [
                Positioned.fill(child: Center(child: _buildCenter())),
                Positioned(
                  top: 4,
                  left: 4,
                  child: IconButton(
                    tooltip: 'Quit',
                    icon: const Icon(Icons.close, color: Colors.white),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ),
                if (_phase == _Phase.playing || _phase == _Phase.feedback)
                  Positioned(
                    top: 12,
                    right: 16,
                    child: _Badge(
                      icon: Icons.timer_outlined,
                      text: '$_secondsLeft',
                    ),
                  ),
                if (_phase == _Phase.playing || _phase == _Phase.feedback)
                  Positioned(
                    top: 12,
                    left: 0,
                    right: 0,
                    child: Center(
                      child: _Badge(
                        icon: Icons.check,
                        text: '${_results.where((r) => r.correct).length}',
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCenter() {
    const big = TextStyle(
      color: Colors.white,
      fontWeight: FontWeight.w900,
      height: 1.1,
    );
    switch (_phase) {
      case _Phase.ready:
        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.screen_rotation, size: 64, color: Colors.white),
            const SizedBox(height: 16),
            Text('Place on forehead', style: big.copyWith(fontSize: 44)),
            const SizedBox(height: 12),
            const Text(
              'Tilt down = correct  •  Tilt up = pass\nor tap to start',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white70, fontSize: 18),
            ),
          ],
        );
      case _Phase.countdown:
        return Text('$_countdown', style: big.copyWith(fontSize: 160));
      case _Phase.playing:
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 48),
          child: FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              _words[_index],
              textAlign: TextAlign.center,
              style: big.copyWith(fontSize: 96),
            ),
          ),
        );
      case _Phase.feedback:
        return Text(
          _lastCorrect ? 'CORRECT!' : 'PASS',
          style: big.copyWith(fontSize: 110),
        );
    }
  }
}

class _Badge extends StatelessWidget {
  const _Badge({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.black26,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 20, color: Colors.white),
          const SizedBox(width: 6),
          Text(
            text,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}
