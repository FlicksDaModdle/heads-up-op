/// What the player signalled by tilting the phone.
enum TiltAction { correct, pass }

/// Turns raw accelerometer Z readings into "correct" / "pass" gestures.
///
/// With the phone held sideways against the forehead, the screen faces
/// outwards and gravity lies in the plane of the screen, so Z is near 0.
/// Tilting the screen towards the floor drives Z to about -9.8 m/s²
/// (correct); tilting it towards the ceiling drives Z to about +9.8 (pass).
/// This holds for both landscape orientations, so X/Y can be ignored.
///
/// After a gesture fires, the phone must come back to upright before the
/// next one can fire, so a single tilt never counts twice.
class TiltDetector {
  TiltDetector({
    this.triggerThreshold = 7.0,
    this.neutralThreshold = 4.0,
    this.smoothing = 0.35,
  });

  /// |Z| above which a tilt counts (≈45° from upright).
  final double triggerThreshold;

  /// |Z| below which the phone counts as upright again.
  final double neutralThreshold;

  /// Low-pass filter weight given to each new sample (0..1].
  final double smoothing;

  double? _z;
  bool _armed = false;

  /// The filtered Z value, or null before the first sample.
  double? get z => _z;

  /// Whether the phone is currently held upright.
  bool get isUpright => _z != null && _z!.abs() < neutralThreshold;

  /// Requires the phone to return to upright before the next gesture.
  void reset() => _armed = false;

  /// Feeds one accelerometer Z reading; returns a gesture when one fires.
  TiltAction? addSample(double rawZ) {
    final z = _z == null ? rawZ : _z! + smoothing * (rawZ - _z!);
    _z = z;

    if (!_armed) {
      if (z.abs() < neutralThreshold) _armed = true;
      return null;
    }
    if (z <= -triggerThreshold) {
      _armed = false;
      return TiltAction.correct;
    }
    if (z >= triggerThreshold) {
      _armed = false;
      return TiltAction.pass;
    }
    return null;
  }
}
