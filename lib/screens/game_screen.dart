import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:sensors_plus/sensors_plus.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

import '../game/decks.dart';
import '../game/prefs.dart';
import '../game/tilt_detector.dart';
import '../orientation.dart';
import 'results_screen.dart';

/// One card shown during a round and whether it was guessed.
class CardResult {
  const CardResult(this.word, {required this.correct});

  final String word;
  final bool correct;
}

enum _Phase { ready, countdown, playing, feedback, timesUp }

class GameScreen extends StatefulWidget {
  const GameScreen({
    super.key,
    required this.deck,
    required this.roundSeconds,
    this.haptics = true,
    this.tiltStream,
  });

  final Deck deck;
  final int roundSeconds;
  final bool haptics;

  /// Accelerometer Z readings; defaults to the device sensor. Injectable so
  /// tests can drive the game without hardware.
  final Stream<double>? tiltStream;

  @override
  State<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> {
  static const _countdownFrom = 3;
  static const _warnFrom = 5;
  static const _feedbackDuration = Duration(milliseconds: 700);
  static const _timesUpDuration = Duration(milliseconds: 1500);

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
    SystemChrome.setPreferredOrientations(landscapeOrientations);
    _setWakelock(true);
    final stream =
        widget.tiltStream ??
        accelerometerEventStream(
          samplingPeriod: SensorInterval.gameInterval,
        ).map((e) => e.z);
    _tiltSub = stream.listen(_onTilt, onError: (_) {});
  }

  @override
  void dispose() {
    _tiltSub?.cancel();
    _clock?.cancel();
    _feedbackTimer?.cancel();
    _setWakelock(false);
    SystemChrome.setPreferredOrientations(portraitOrientations);
    super.dispose();
  }

  void _setWakelock(bool on) {
    // Not available in widget tests; the game works without it.
    (on ? WakelockPlus.enable() : WakelockPlus.disable()).catchError((_) {});
  }

  void _buzz(Future<void> Function() feedback) {
    if (widget.haptics) feedback();
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
      _buzz(HapticFeedback.mediumImpact);
      _detector.reset();
      setState(() => _phase = _Phase.playing);
      _clock = Timer.periodic(const Duration(seconds: 1), (_) => _tick());
    });
  }

  void _tick() {
    setState(() => _secondsLeft--);
    if (_secondsLeft <= 0) {
      _timeUp();
    } else if (_secondsLeft <= _warnFrom) {
      _buzz(HapticFeedback.selectionClick);
    }
  }

  void _answer(bool correct) {
    if (_phase != _Phase.playing) return;
    _buzz(correct ? HapticFeedback.heavyImpact : HapticFeedback.lightImpact);
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

  /// Shows "Time's up!" briefly, then the results.
  void _timeUp() {
    if (_phase == _Phase.timesUp || _finished) return;
    _clock?.cancel();
    _feedbackTimer?.cancel();
    // A card still on screen when time runs out counts as missed.
    if (_phase == _Phase.playing) {
      _results.add(CardResult(_words[_index], correct: false));
    }
    _buzz(HapticFeedback.vibrate);
    setState(() => _phase = _Phase.timesUp);
    _feedbackTimer = Timer(_timesUpDuration, _finish);
  }

  void _finish() {
    if (_finished) return;
    _finished = true;
    _clock?.cancel();
    _feedbackTimer?.cancel();
    final results = List<CardResult>.unmodifiable(_results);
    Prefs.addRound(
      RoundSummary(
        deckName: widget.deck.name,
        score: results.where((r) => r.correct).length,
        played: results.length,
      ),
    ).catchError((_) {});
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => ResultsScreen(
          deck: widget.deck,
          roundSeconds: widget.roundSeconds,
          haptics: widget.haptics,
          results: results,
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
      case _Phase.timesUp:
        break;
    }
  }

  Color get _cardColor => switch (_phase) {
    _Phase.feedback =>
      _lastCorrect ? const Color(0xFF2EB82E) : const Color(0xFFFF8A00),
    _Phase.timesUp => const Color(0xFFD81B60),
    _ => widget.deck.color,
  };

  bool get _showHud => _phase == _Phase.playing || _phase == _Phase.feedback;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTapUp: _onTapUp,
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(10),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              decoration: BoxDecoration(
                color: _cardColor,
                borderRadius: BorderRadius.circular(32),
                border: Border.all(color: Colors.white, width: 8),
              ),
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
                  if (_showHud)
                    Positioned(
                      top: 12,
                      right: 16,
                      child: _TimerBadge(
                        seconds: _secondsLeft,
                        warning: _secondsLeft <= _warnFrom,
                      ),
                    ),
                  if (_showHud)
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
      ),
    );
  }

  Widget _buildCenter() {
    const big = TextStyle(
      color: Colors.white,
      fontWeight: FontWeight.w900,
      height: 1.1,
    );
    Widget fit(String text, double size) => Padding(
      padding: const EdgeInsets.symmetric(horizontal: 48),
      child: FittedBox(
        fit: BoxFit.scaleDown,
        child: Text(
          text,
          textAlign: TextAlign.center,
          style: big.copyWith(fontSize: size),
        ),
      ),
    );
    switch (_phase) {
      case _Phase.ready:
        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            fit('Hold it to\nyour forehead', 56),
            const SizedBox(height: 16),
            const Text(
              'Tilt down = got it  •  Tilt up = skip\n(or tap to start)',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white70, fontSize: 18),
            ),
          ],
        );
      case _Phase.countdown:
        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Get ready…',
              style: TextStyle(color: Colors.white70, fontSize: 28),
            ),
            Text('$_countdown', style: big.copyWith(fontSize: 150)),
          ],
        );
      case _Phase.playing:
        return fit(_words[_index], 96);
      case _Phase.feedback:
        return fit(_lastCorrect ? 'Got it!' : 'Skip', 110);
      case _Phase.timesUp:
        return fit("Time's up!", 110);
    }
  }
}

class _TimerBadge extends StatelessWidget {
  const _TimerBadge({required this.seconds, required this.warning});

  final int seconds;
  final bool warning;

  @override
  Widget build(BuildContext context) {
    final badge = _Badge(
      icon: Icons.timer_outlined,
      text: '$seconds',
      background: warning ? const Color(0xFFE53935) : Colors.black26,
    );
    if (!warning) return badge;
    // Pops on every tick of the last few seconds.
    return TweenAnimationBuilder<double>(
      key: ValueKey(seconds),
      tween: Tween(begin: 1.35, end: 1),
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeOut,
      builder: (_, scale, child) => Transform.scale(scale: scale, child: child),
      child: badge,
    );
  }
}

class _Badge extends StatelessWidget {
  const _Badge({
    required this.icon,
    required this.text,
    this.background = Colors.black26,
  });

  final IconData icon;
  final String text;
  final Color background;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: background,
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
