"""Synthesizes the game's sound effects into assets/sounds/*.wav.

Run from the repo root:  python tool/make_sounds.py
Every sound is generated here from basic waveforms (no samples), so they
are original to this project. Only the standard library is needed.
"""

import math
import os
import random
import struct
import wave

RATE = 22050
OUT = "assets/sounds"


def env(i, n, attack=0.005, release=None):
    """Linear attack, exponential-ish decay to silence at the end."""
    t = i / RATE
    a = min(1.0, t / attack) if attack > 0 else 1.0
    r = 1.0 - i / n
    return a * (r ** (release or 1.5))


def tone(freq, dur, wave_fn=math.sin, vol=0.6, attack=0.005, release=1.5, slide_to=None):
    n = int(RATE * dur)
    out, phase = [], 0.0
    for i in range(n):
        f = freq if slide_to is None else freq + (slide_to - freq) * (i / n)
        phase += 2 * math.pi * f / RATE
        out.append(vol * env(i, n, attack, release) * wave_fn(phase))
    return out


def bell(freq, dur, vol=0.5):
    """Sine with two soft overtones: a glassy 'ding'."""
    a = tone(freq, dur, vol=vol, release=2.5)
    b = tone(freq * 2, dur, vol=vol * 0.3, release=3.5)
    c = tone(freq * 3.01, dur, vol=vol * 0.12, release=4.5)
    return mix(a, b, c)


def square(phase):
    return 0.6 if math.sin(phase) >= 0 else -0.6


def triangle(phase):
    return 2 / math.pi * math.asin(math.sin(phase))


def silence(dur):
    return [0.0] * int(RATE * dur)


def mix(*tracks):
    n = max(len(t) for t in tracks)
    return [sum(t[i] for t in tracks if i < len(t)) for i in range(n)]


def seq(*parts):
    out = []
    for p in parts:
        out.extend(p)
    return out


def overlap(parts, step):
    """Starts each part `step` seconds after the previous one."""
    off = int(RATE * step)
    n = off * (len(parts) - 1) + max(len(p) for p in parts)
    out = [0.0] * n
    for k, p in enumerate(parts):
        for i, s in enumerate(p):
            out[k * off + i] += s
    return out


def noise(dur, vol=0.3, lowpass=0.15):
    n = int(RATE * dur)
    rnd, out, y = random.Random(7), [], 0.0
    for i in range(n):
        y += lowpass * (rnd.uniform(-1, 1) - y)
        out.append(vol * y * math.sin(math.pi * i / n))
    return out


def save(name, samples):
    peak = max(1e-9, max(abs(s) for s in samples))
    scale = 0.9 / peak if peak > 0.9 else 1.0
    path = os.path.join(OUT, f"{name}.wav")
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(b"".join(struct.pack("<h", int(s * scale * 32767)) for s in samples))
    print(f"{path}: {len(samples) / RATE:.2f}s")


def main():
    os.makedirs(OUT, exist_ok=True)
    # UI
    save("tap", tone(1300, 0.04, vol=0.35, release=3))
    save("open", seq(tone(500, 0.09, triangle, 0.4, slide_to=950), tone(950, 0.06, vol=0.25)))
    save("close", tone(800, 0.1, triangle, 0.35, slide_to=420))
    save("save", overlap([bell(784, 0.18), bell(1175, 0.3)], 0.08))
    # Round
    save("countdown", tone(660, 0.16, triangle, 0.55, release=2))
    save("go", mix(tone(990, 0.4, triangle, 0.45, release=2), tone(1485, 0.4, vol=0.25, release=2.5)))
    save("correct", overlap([bell(1047, 0.3), bell(1568, 0.45)], 0.09))
    save("pass", mix(tone(392, 0.32, triangle, 0.55, slide_to=196, release=1.2), noise(0.25, 0.12)))
    save("tick", tone(1800, 0.03, square, 0.25, attack=0.001, release=4))
    save(
        "timesup",
        mix(
            tone(196, 0.75, square, 0.45, release=0.8),
            tone(201, 0.75, square, 0.35, release=0.8),
        ),
    )
    # Results fanfare: C5 E5 G5 then a C6 chord.
    save(
        "fanfare",
        overlap(
            [bell(523, 0.25), bell(659, 0.25), bell(784, 0.25), mix(bell(1047, 0.8), bell(1319, 0.8, 0.3))],
            0.11,
        ),
    )


if __name__ == "__main__":
    main()
