export type TiltAction = 'correct' | 'pass';

const DEG = 180 / Math.PI;

/**
 * Turns accelerometer readings (in g, Android sign convention: z = +1 with
 * the screen facing up) into "correct" / "pass" gestures.
 *
 * Held sideways against the forehead, the screen faces outwards. We track
 * the pitch: how far the screen has turned towards the floor (negative) or
 * the ceiling (positive), from atan2(z, |x,y|). Using an angle rather than
 * raw Z keeps it steady when the phone is shaken or moving, because the
 * total acceleration cancels out.
 *
 * The pitch is measured relative to a baseline captured when the round
 * starts, so a player who holds the phone slightly tipped back still gets
 * the same response in both directions. After a gesture fires, the phone
 * must come back near the baseline before the next one can fire.
 */
export class TiltDetector {
  /** Degrees past the baseline that count as a tilt. */
  readonly trigger: number;
  /** Degrees from the baseline that count as "back to neutral". */
  readonly rearm: number;
  /** Low-pass filter weight given to each new sample (0..1]. */
  readonly smoothing: number;
  /** |pitch| below which the phone counts as held upright (to start). */
  readonly upright: number;
  /** Largest baseline accepted, so a phone lying flat can't calibrate. */
  readonly maxBaseline: number;

  private pitch: number | null = null;
  private baseline = 0;
  private armed = false;

  constructor({
    trigger = 40,
    rearm = 15,
    smoothing = 0.4,
    upright = 30,
    maxBaseline = 25,
  } = {}) {
    this.trigger = trigger;
    this.rearm = rearm;
    this.smoothing = smoothing;
    this.upright = upright;
    this.maxBaseline = maxBaseline;
  }

  /** Smoothed pitch in degrees, or null before the first sample. */
  get angle(): number | null {
    return this.pitch;
  }

  get isUpright(): boolean {
    return this.pitch !== null && Math.abs(this.pitch) < this.upright;
  }

  /** Uses the current pose as neutral and waits for it before firing. */
  calibrate(): void {
    const p = this.pitch ?? 0;
    this.baseline = Math.max(-this.maxBaseline, Math.min(this.maxBaseline, p));
    this.armed = false;
  }

  /** Requires the phone to return to neutral before the next gesture. */
  reset(): void {
    this.armed = false;
  }

  addSample(x: number, y: number, z: number): TiltAction | null {
    const raw = Math.atan2(z, Math.hypot(x, y)) * DEG;
    const p = this.pitch === null ? raw : this.pitch + this.smoothing * (raw - this.pitch);
    this.pitch = p;
    const rel = p - this.baseline;

    if (!this.armed) {
      if (Math.abs(rel) < this.rearm) this.armed = true;
      return null;
    }
    if (rel <= -this.trigger) {
      this.armed = false;
      return 'correct';
    }
    if (rel >= this.trigger) {
      this.armed = false;
      return 'pass';
    }
    return null;
  }
}
