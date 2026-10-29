#!/usr/bin/env python3
"""EDS Strength brand assets, built from the EDS Conditioning AppIcon-1024.

Keeps the EDS ring and lettering unchanged, swaps the heartbeat for a cyan
barbell and CONDITIONING for STRENGTH (option A, approved by Dan). Writes
app_icon_1024.png here, the Android launcher mipmaps, the plain-navy splash
plates, and the in-app logo in apps/athlete/assets/.
Run: python3 apps/mobile/capacitor/brand/make_brand.py
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = Path(__file__).resolve().parent
RES = HERE.parent / "android/app/src/main/res"
ATHLETE_ASSETS = HERE.parents[2] / "athlete/assets"
BG = (8, 16, 31)
NAVY = (10, 16, 32)
CYAN = (34, 211, 238)
SUB = (142, 165, 200)
FONT = "/usr/share/fonts/truetype/sand-box/google/Inter/Inter-VariableFont_opsz,wght.ttf"
SS = 4  # supersampling for crisp edges


def inter(size, weight="SemiBold"):
    font = ImageFont.truetype(FONT, size)
    try:
        font.set_variation_by_name(weight)
    except Exception:
        pass
    return font


def barbell(draw, color, cx, cy, k):
    r = lambda *v: [int(x * k) for x in v]
    draw.rounded_rectangle(r(cx - 185, cy - 7, cx + 185, cy + 7), int(7 * k), fill=color)
    for side in (-1, 1):
        for off, h, t in ((120, 96, 22), (150, 70, 18)):
            x = cx + side * off
            draw.rounded_rectangle(r(x - t / 2, cy - h / 2, x + t / 2, cy + h / 2), int(8 * k), fill=color)
        x = cx + side * 178
        draw.rounded_rectangle(r(x - 6, cy - 22, x + 6, cy + 22), int(5 * k), fill=color)


def build_icon():
    ref = Image.open(HERE / "eds_conditioning_icon_1024.png").convert("RGB")
    im = ref.copy()
    d = ImageDraw.Draw(im)
    d.rectangle([318, 552, 706, 662], fill=BG)   # heartbeat (inside the ring gap)
    d.rectangle([200, 820, 830, 910], fill=BG)   # CONDITIONING
    # Full-bleed square: Android/iOS apply their own corner masks.
    flat = Image.new("RGB", im.size, BG)
    mask = Image.new("L", im.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, 1023, 1023], 200, fill=255)
    mask = mask.point(lambda v: 255 if v > 0 else 0)
    flat.paste(im, (0, 0), mask)
    im = flat.convert("RGBA")
    big = Image.new("RGBA", (1024 * SS, 1024 * SS), (0, 0, 0, 0))
    barbell(ImageDraw.Draw(big), CYAN + (255,), 512, 615, SS)
    mark = big.resize((1024, 1024), Image.LANCZOS)
    im = Image.alpha_composite(im, mark.filter(ImageFilter.GaussianBlur(12)))
    im = Image.alpha_composite(im, mark)
    d = ImageDraw.Draw(im)
    font, text, track = inter(50), "STRENGTH", 22
    widths = [d.textlength(c, font=font) for c in text]
    x = 512 - (sum(widths) + track * (len(text) - 1)) / 2
    for c, w in zip(text, widths):
        d.text((x, 838), c, font=font, fill=SUB)
        x += w + track
    return im.convert("RGB")


def rounded(img, size, radius_frac=0.22, circle=False):
    img = img.resize((size * SS, size * SS), Image.LANCZOS).convert("RGBA")
    m = Image.new("L", img.size, 0)
    dm = ImageDraw.Draw(m)
    if circle:
        dm.ellipse([0, 0, img.width - 1, img.height - 1], fill=255)
    else:
        dm.rounded_rectangle([0, 0, img.width - 1, img.height - 1], int(img.width * radius_frac), fill=255)
    img.putalpha(m)
    return img.resize((size, size), Image.LANCZOS)


def main():
    icon = build_icon()
    icon.save(HERE / "app_icon_1024.png")
    # Adaptive foreground: whole mark inside the 66/108 safe zone on the brand navy.
    art = icon.crop((112, 112, 912, 912))  # ring + STRENGTH
    dens = {"mdpi": 1, "hdpi": 1.5, "xhdpi": 2, "xxhdpi": 3, "xxxhdpi": 4}
    for name, k in dens.items():
        folder = RES / f"mipmap-{name}"
        legacy = int(48 * k)
        rounded(icon, legacy).save(folder / "ic_launcher.png")
        rounded(icon, legacy, circle=True).save(folder / "ic_launcher_round.png")
        fg_size = int(108 * k)
        fg = Image.new("RGBA", (fg_size, fg_size), BG + (255,))
        inner = int(fg_size * 66 / 108)
        fg.paste(art.resize((inner, inner), Image.LANCZOS), ((fg_size - inner) // 2,) * 2)
        fg.save(folder / "ic_launcher_foreground.png")
    # Static splash plates stay plain navy (like EDS Conditioning) so launch
    # never flashes the mark; EdsSplashOverlay then plays the animation.
    for folder in RES.glob("drawable*"):
        p = folder / "splash.png"
        if p.exists():
            Image.new("RGB", Image.open(p).size, NAVY).save(p)
    ATHLETE_ASSETS.mkdir(parents=True, exist_ok=True)
    rounded(icon, 256).save(ATHLETE_ASSETS / "eds-strength-logo.png")
    # Embedded in the imported Engine page by scripts/engine-house-brand.mjs.
    rounded(icon, 96).save(HERE / "eds-mark-96.png", optimize=True)


if __name__ == "__main__":
    main()
