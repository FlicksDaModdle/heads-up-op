"""Draws the Forehead Frenzy launcher icon and writes every platform size.

Run from the repo root:  python tool/make_icon.py
The artwork is generated here from simple shapes; no external images.
"""

import os
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

SIZE = 1024
TOP = (41, 182, 246)  # sky blue
BOTTOM = (13, 71, 214)  # deep blue
ACCENT = (255, 214, 0)  # yellow


def find_font(size):
    candidates = [
        "C:/Windows/Fonts/ariblk.ttf",
        "C:/Windows/Fonts/arialbd.ttf",
        "/System/Library/Fonts/Supplemental/Arial Black.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    sys.exit("No bold TrueType font found; add one to find_font().")


def draw_card():
    """The tilted card with its shadow, on a transparent canvas."""
    c = SIZE / 2
    card = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    cd = ImageDraw.Draw(card)
    box = (c - 300, c - 220, c + 300, c + 220)
    cd.rounded_rectangle(box, radius=70, fill=(255, 255, 255, 255))
    cd.rounded_rectangle(
        (box[0] + 28, box[1] + 28, box[2] - 28, box[3] - 28),
        radius=48,
        fill=BOTTOM + (255,),
    )
    font = find_font(330)
    cd.text((c, c + 6), "?", font=font, fill=ACCENT + (255,), anchor="mm")
    card = card.rotate(-12, resample=Image.BICUBIC, center=(c, c))

    shadow = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    shadow.paste((0, 0, 0, 110), mask=card.split()[3])
    shadow = shadow.filter(ImageFilter.GaussianBlur(24))
    out = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    out.alpha_composite(shadow, (18, 30))
    out.alpha_composite(card)
    return out


def draw_icon():
    img = Image.new("RGB", (SIZE, SIZE))
    px = img.load()
    for y in range(SIZE):
        for x in range(SIZE):
            t = (x * 0.35 + y * 0.65) / SIZE
            px[x, y] = tuple(round(a + (b - a) * t) for a, b in zip(TOP, BOTTOM))

    # Burst rays behind the card.
    rays = Image.new("L", (SIZE, SIZE), 0)
    d = ImageDraw.Draw(rays)
    c = SIZE / 2
    for i in range(12):
        d.pieslice((-SIZE, -SIZE, 2 * SIZE, 2 * SIZE), i * 30, i * 30 + 12, fill=40)
    img.paste((255, 255, 255), mask=rays)

    img = img.convert("RGBA")
    img.alpha_composite(draw_card())
    return img.convert("RGB")


def main():
    os.makedirs("assets", exist_ok=True)
    draw_icon().save("assets/icon.png")

    # Android adaptive icon: the card alone, shrunk into the safe zone; the
    # background colour is set in app.json.
    fg = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    small = draw_card().resize((int(SIZE * 0.62),) * 2, Image.LANCZOS)
    fg.alpha_composite(small, ((SIZE - small.width) // 2,) * 2)
    fg.save("assets/adaptive-icon.png")
    draw_card().save("assets/splash-icon.png")
    draw_icon().resize((48, 48), Image.LANCZOS).save("assets/favicon.png")
    print("Icons written to assets/.")


if __name__ == "__main__":
    main()
