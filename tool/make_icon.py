"""Draws the Forehead Frenzy launcher icon and writes every platform size.

Run from the repo root:  python tool/make_icon.py
The artwork is generated here from simple shapes; no external images.
"""

import json
import os
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

SIZE = 1024
TOP = (255, 61, 127)  # pink
BOTTOM = (98, 0, 234)  # violet


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

    # Tilted card with drop shadow.
    card = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    cd = ImageDraw.Draw(card)
    box = (c - 300, c - 220, c + 300, c + 220)
    cd.rounded_rectangle(box, radius=70, fill=(255, 255, 255, 255))
    cd.rounded_rectangle(
        (box[0] + 28, box[1] + 28, box[2] - 28, box[3] - 28),
        radius=48,
        outline=BOTTOM + (255,),
        width=14,
    )
    font = find_font(330)
    cd.text((c, c + 6), "?", font=font, fill=TOP + (255,), anchor="mm")
    card = card.rotate(-12, resample=Image.BICUBIC, center=(c, c))

    shadow = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    shadow.paste((0, 0, 0, 110), mask=card.split()[3])
    shadow = shadow.filter(ImageFilter.GaussianBlur(24))
    img = img.convert("RGBA")
    img.alpha_composite(shadow, (18, 30))
    img.alpha_composite(card)
    return img.convert("RGB")


def main():
    icon = draw_icon()

    android = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
    for density, px in android.items():
        out = f"android/app/src/main/res/mipmap-{density}/ic_launcher.png"
        icon.resize((px, px), Image.LANCZOS).save(out)

    ios_dir = "ios/Runner/Assets.xcassets/AppIcon.appiconset"
    with open(os.path.join(ios_dir, "Contents.json")) as f:
        images = json.load(f)["images"]
    for entry in images:
        name = entry.get("filename")
        if not name:
            continue
        points = float(entry["size"].split("x")[0])
        scale = int(entry["scale"].rstrip("x"))
        px = round(points * scale)
        icon.resize((px, px), Image.LANCZOS).save(os.path.join(ios_dir, name))

    os.makedirs("assets", exist_ok=True)
    icon.save("assets/icon.png")
    print("Icons written.")


if __name__ == "__main__":
    main()
