#!/usr/bin/env python3
"""
Draws the launcher / splash art from the design's own palette.

The mark is the app's checkbox — the lime-filled, ink-outlined square that the
whole checklist is built from — because it's the one element that stays
recognisable at 48dp.

    pip install Pillow && python3 tools/make-icons.py
"""

from pathlib import Path
from PIL import Image, ImageDraw

ASSETS = Path(__file__).resolve().parent.parent / "assets"

INK = (23, 20, 15, 255)
SAND = (255, 224, 174, 255)
LIME = (198, 242, 74, 255)
PAPER = (255, 251, 243, 255)

# Draw oversized, then downsample — Pillow has no anti-aliased shape drawing.
SS = 4


def checkbox(size: int, scale: float, ground=None) -> Image.Image:
    """Ink-outlined rounded square, lime fill, bold ink tick."""
    S = size * SS
    img = Image.new("RGBA", (S, S), ground if ground else (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    box = S * scale
    x0 = (S - box) / 2
    x1 = x0 + box
    border = box * 0.085
    radius = box * 0.28

    d.rounded_rectangle([x0, x0, x1, x1], radius=radius, fill=LIME, outline=INK, width=round(border))

    # Tick, proportioned like the ✓ in the checklist rows.
    w = box * 0.115
    p1 = (x0 + box * 0.27, x0 + box * 0.52)
    p2 = (x0 + box * 0.44, x0 + box * 0.69)
    p3 = (x0 + box * 0.75, x0 + box * 0.33)
    d.line([p1, p2, p3], fill=INK, width=round(w), joint="curve")
    for p in (p1, p3):
        d.ellipse([p[0] - w / 2, p[1] - w / 2, p[0] + w / 2, p[1] + w / 2], fill=INK)

    return img.resize((size, size), Image.LANCZOS)


def solid(size: int, color) -> Image.Image:
    return Image.new("RGBA", (size, size), color)


def main() -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)

    # Store / iOS icon: full-bleed sand ground, mark at 62%.
    checkbox(1024, 0.62, ground=SAND).save(ASSETS / "icon.png")

    # Android adaptive icon. The outer 1/3 of the 1024 canvas can be masked away
    # by any launcher shape, so the mark stays inside the safe circle.
    checkbox(1024, 0.40).save(ASSETS / "android-icon-foreground.png")
    solid(1024, SAND).save(ASSETS / "android-icon-background.png")

    # Monochrome (themed icons, Android 13+): silhouette only, no colour.
    mono = Image.new("RGBA", (1024 * SS, 1024 * SS), (0, 0, 0, 0))
    md = ImageDraw.Draw(mono)
    box = 1024 * SS * 0.40
    x0 = (1024 * SS - box) / 2
    md.rounded_rectangle(
        [x0, x0, x0 + box, x0 + box], radius=box * 0.28, fill=INK
    )
    mono.resize((1024, 1024), Image.LANCZOS).save(ASSETS / "android-icon-monochrome.png")

    # Splash: mark on paper, generous margin — Expo scales it to ~200dp.
    checkbox(512, 0.55, ground=(0, 0, 0, 0)).save(ASSETS / "splash-icon.png")

    # Favicon for the web build.
    checkbox(64, 0.72, ground=SAND).save(ASSETS / "favicon.png")

    for f in ("icon.png", "android-icon-foreground.png", "android-icon-background.png",
              "android-icon-monochrome.png", "splash-icon.png", "favicon.png"):
        print(f"  {f:34} {(ASSETS / f).stat().st_size // 1024}KB")


if __name__ == "__main__":
    main()
