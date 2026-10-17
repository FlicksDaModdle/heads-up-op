import 'package:flutter_test/flutter_test.dart';
import 'package:forehead_frenzy/game/tilt_detector.dart';

void main() {
  // No smoothing so each sample maps directly to the filtered value.
  TiltDetector detector() => TiltDetector(smoothing: 1);

  test('ignores tilts until the phone has been upright', () {
    final d = detector();
    expect(d.addSample(-9.8), isNull);
    expect(d.addSample(0), isNull);
    expect(d.addSample(-9.8), TiltAction.correct);
  });

  test('screen down is correct, screen up is pass', () {
    final d = detector();
    d.addSample(0);
    expect(d.addSample(-8), TiltAction.correct);
    d.addSample(0.5);
    expect(d.addSample(8), TiltAction.pass);
  });

  test('a held tilt fires only once', () {
    final d = detector();
    d.addSample(0);
    expect(d.addSample(-9), TiltAction.correct);
    expect(d.addSample(-9), isNull);
    expect(d.addSample(-5), isNull);
    d.addSample(1);
    expect(d.addSample(-9), TiltAction.correct);
  });

  test('small wobbles do not fire', () {
    final d = detector();
    for (final z in [0.0, 3.0, -5.0, 6.5, -6.9, 2.0]) {
      expect(d.addSample(z), isNull);
    }
  });

  test('reset requires returning upright', () {
    final d = detector();
    d.addSample(0);
    d.reset();
    expect(d.addSample(-9), isNull);
    d.addSample(0);
    expect(d.addSample(-9), TiltAction.correct);
  });

  test('smoothing filters out a single spike', () {
    final d = TiltDetector();
    d.addSample(0);
    expect(d.addSample(-9.8), isNull);
  });
}
