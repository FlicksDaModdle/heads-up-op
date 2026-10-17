export type TiltAction = 'correct' | 'pass';

/**
 * Turns accelerometer Z readings (in g, Android sign convention: +1 with the
 * screen facing up) into "correct" / "pass" gestures.
 *
 * Held sideways against the forehead the screen faces outwards, so Z is near
 * 0. Tilting the screen towards the floor drives Z to about -1 (correct);
 * towards the ceiling, about +1 (pass). The phone must come back upright
 * before the next gesture can fire, so one tilt never counts twice.
 */
export class TiltDetector {
  /** |Z| above which a tilt counts (about 45 degrees from upright). */
  readonly trigger: number;
  /** |Z| below which the phone counts as upright again. */
  readonly neutral: number;
  /** Low-pass filter weight given to each new sample (0..1]. */
  readonly smoothing: number;

  private z: number | null = null;
  private armed = false;

  constructor({ trigger = 0.7, neutral = 0.4, smoothing = 0.35 } = {}) {
    this.trigger = trigger;
    this.neutral = neutral;
    this.smoothing = smoothing;
  }

  get isUpright(): boolean {
    return this.z !== null && Math.abs(this.z) < this.neutral;
  }

  /** Requires the phone to return upright before the next gesture. */
  reset(): void {
    this.armed = false;
  }

  addSample(rawZ: number): TiltAction | null {
    const z = this.z === null ? rawZ : this.z + this.smoothing * (rawZ - this.z);
    this.z = z;

    if (!this.armed) {
      if (Math.abs(z) < this.neutral) this.armed = true;
      return null;
    }
    if (z <= -this.trigger) {
      this.armed = false;
      return 'correct';
    }
    if (z >= this.trigger) {
      this.armed = false;
      return 'pass';
    }
    return null;
  }
}
