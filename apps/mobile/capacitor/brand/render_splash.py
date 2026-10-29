#!/usr/bin/env python3
"""EDS Strength splash animation, the same motion as EDS Conditioning.

Ported from the Apps repo (independent/eds-conditioning/splash-preview/
render_preview.py). Reads brand/app_icon_1024.png (made by make_brand.py).

The approved MP4 is packaged as assets/eds_splash.mp4 and played after
the plain-navy Android 12+ / Expo splash. 2.5 s at 60 fps on navy #0a1020:

  ring segments draw with overlapped ease-in-out cubics
  EDS fades in, scales 96→100%, and sharpens from a light blur
  cyan barbell (the 'heartbeat' layer) traces left to right with one soft glow pulse
  STRENGTH (the 'conditioning' layer) fades in while letter-spacing eases tighter
  brief hold with a very subtle whole-logo bloom that settles

No bounce. Calm, high-end motion.
"""
from __future__ import annotations

import argparse
import subprocess
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

APP_ICON = Path(__file__).resolve().parent / "app_icon_1024.png"
NAVY = (10, 16, 32, 255)
NAVY_RGB = np.array([10, 16, 32], dtype=np.int16)
DURATION = 2.5


def ease_in_out_cubic(t: float) -> float:
    t = min(1.0, max(0.0, t))
    if t < 0.5:
        return 4 * t * t * t
    return 1 - ((-2 * t + 2) ** 3) / 2


def span(t: float, start: float, end: float) -> float:
    if end <= start:
        return 1.0 if t >= start else 0.0
    return ease_in_out_cubic((t - start) / (end - start))


def pulse_once(t: float, start: float, end: float) -> float:
    """Single smooth hump, 0 at ends, 1 at the midpoint."""
    if t <= start or t >= end:
        return 0.0
    u = (t - start) / (end - start)
    return 4 * u * (1 - u)


def _hsv(rgb: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    r = rgb[:, :, 0] / 255.0
    g = rgb[:, :, 1] / 255.0
    b = rgb[:, :, 2] / 255.0
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    df = mx - mn + 1e-6
    hue = np.zeros_like(mx)
    hue = np.where(mx == r, (g - b) / df % 6, hue)
    hue = np.where(mx == g, (b - r) / df + 2, hue)
    hue = np.where(mx == b, (r - g) / df + 4, hue)
    hue = hue / 6.0
    sat = np.where(mx == 0, 0, df / np.maximum(mx, 1e-6))
    return hue, sat, mx


def split_layers(icon: Image.Image) -> dict:
    arr = np.array(icon.convert("RGBA"))
    rgb = arr[:, :, :3].astype(np.int16)
    hue, sat, val = _hsv(arr[:, :, :3])
    navy = (np.abs(rgb - NAVY_RGB).sum(axis=2) < 40) | (val < 0.12)
    ys = np.arange(arr.shape[0])[:, None]

    masks = {
        "red": ((hue < 0.06) | (hue > 0.92)) & (sat > 0.35) & (val > 0.35) & ~navy,
        "blue": (hue > 0.55) & (hue < 0.72) & (sat > 0.35) & (val > 0.35) & ~navy & (ys < 760),
        "green": (hue > 0.25) & (hue < 0.45) & (sat > 0.35) & (val > 0.35) & ~navy,
        "heartbeat": (hue > 0.45) & (hue < 0.58) & (sat > 0.25) & (val > 0.20) & ~navy & (ys > 530) & (ys < 700),
        "eds": (sat < 0.28) & (val > 0.70) & ~navy & (ys > 340) & (ys < 560),
        "conditioning": (ys > 760) & ~navy & (val > 0.18),
    }
    layers = {}
    for name, mask in masks.items():
        out = np.zeros_like(arr)
        out[mask] = arr[mask]
        layers[name] = Image.fromarray(out, "RGBA")
    content = arr.copy()
    content[navy, 3] = 0
    layers["full"] = Image.fromarray(content, "RGBA")
    return layers


def _ring_center(layers: dict) -> tuple[float, float]:
    pixels = []
    for name in ("red", "blue", "green"):
        arr = np.array(layers[name])
        ys, xs = np.where(arr[:, :, 3] > 0)
        if len(xs):
            pixels.append((xs.mean(), ys.mean()))
    if not pixels:
        return 512.0, 480.0
    xs, ys = zip(*pixels)
    return float(sum(xs) / len(xs)), float(sum(ys) / len(ys))


def _prepare_ring(layer: Image.Image, cx: float, cy: float) -> dict:
    arr = np.array(layer)
    ys, xs = np.where(arr[:, :, 3] > 0)
    raw = np.arctan2(ys.astype(np.float64) - cy, xs.astype(np.float64) - cx)
    order = np.sort(raw)
    wrap = np.concatenate([order, order[:1] + 2 * np.pi])
    gaps = np.diff(wrap)
    cut = int(np.argmax(gaps))
    start_angle = wrap[cut] + gaps[cut]
    rel = (raw - start_angle) % (2 * np.pi)
    return {"arr": arr, "ys": ys, "xs": xs, "rel": rel, "span": float(rel.max() if rel.size else 1.0)}


def angular_reveal(prep: dict, progress: float) -> Image.Image:
    if progress <= 0:
        return Image.new("RGBA", prep["arr"].shape[1::-1], (0, 0, 0, 0))
    arr = prep["arr"]
    if progress >= 1:
        return Image.fromarray(arr, "RGBA")
    edge = prep["span"] * progress
    soft = np.clip((edge - prep["rel"]) / 0.10 + 1.0, 0.0, 1.0)
    out = np.zeros_like(arr)
    out[prep["ys"], prep["xs"]] = arr[prep["ys"], prep["xs"]]
    out[prep["ys"], prep["xs"], 3] = (out[prep["ys"], prep["xs"], 3].astype(np.float32) * soft).astype(np.uint8)
    return Image.fromarray(out, "RGBA")


def wipe_left_to_right(layer: Image.Image, progress: float) -> Image.Image:
    if progress <= 0:
        return Image.new("RGBA", layer.size, (0, 0, 0, 0))
    if progress >= 1:
        return layer
    arr = np.array(layer)
    ys, xs = np.where(arr[:, :, 3] > 0)
    if not len(xs):
        return layer
    lo, hi = int(xs.min()), int(xs.max())
    edge = lo + (hi - lo) * progress
    fade = np.clip((edge - xs) / 14.0 + 1.0, 0.0, 1.0)
    out = np.zeros_like(arr)
    out[ys, xs] = arr[ys, xs]
    out[ys, xs, 3] = (out[ys, xs, 3].astype(np.float32) * fade).astype(np.uint8)
    return Image.fromarray(out, "RGBA")


def fade_layer(layer: Image.Image, progress: float) -> Image.Image:
    if progress <= 0:
        return Image.new("RGBA", layer.size, (0, 0, 0, 0))
    if progress >= 1:
        return layer
    arr = np.array(layer)
    arr[:, :, 3] = (arr[:, :, 3].astype(np.float32) * progress).astype(np.uint8)
    return Image.fromarray(arr, "RGBA")


def eds_reveal(layer: Image.Image, progress: float) -> Image.Image:
    """Soft fade, 96→100% scale, light blur sharpening into the real pixels."""
    if progress <= 0:
        return Image.new("RGBA", layer.size, (0, 0, 0, 0))
    canvas = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    if progress >= 1:
        return layer
    arr = np.array(layer)
    ys, xs = np.where(arr[:, :, 3] > 0)
    if not len(xs):
        return layer
    left, right = int(xs.min()), int(xs.max()) + 1
    top, bottom = int(ys.min()), int(ys.max()) + 1
    crop = layer.crop((left, top, right, bottom))
    scale = 0.96 + 0.04 * progress
    new_w = max(1, int(crop.width * scale))
    new_h = max(1, int(crop.height * scale))
    scaled = crop.resize((new_w, new_h), Image.Resampling.LANCZOS)
    blur = 2.6 * (1 - progress)
    if blur > 0.15:
        scaled = scaled.filter(ImageFilter.GaussianBlur(radius=blur))
    faded = fade_layer(scaled, 0.15 + 0.85 * progress)
    cx = (left + right) / 2
    cy = (top + bottom) / 2
    canvas.alpha_composite(faded, (int(cx - new_w / 2), int(cy - new_h / 2)))
    return canvas


def conditioning_reveal(layer: Image.Image, progress: float) -> Image.Image:
    """Fade in while tracking eases from slightly open to the designed spacing."""
    canvas = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    if progress <= 0:
        return canvas
    if progress >= 1:
        return layer
    arr = np.array(layer)
    ys, xs = np.where(arr[:, :, 3] > 0)
    if not len(xs):
        return layer
    left, right = int(xs.min()), int(xs.max()) + 1
    top, bottom = int(ys.min()), int(ys.max()) + 1
    crop = layer.crop((left, top, right, bottom))
    spread = 1.0 + 0.07 * (1 - progress)
    new_w = max(1, int(crop.width * spread))
    stretched = crop.resize((new_w, crop.height), Image.Resampling.LANCZOS)
    faded = fade_layer(stretched, 0.12 + 0.88 * progress)
    cx = (left + right) / 2
    canvas.alpha_composite(faded, (int(cx - new_w / 2), top))
    return canvas


def glow_layer(layer: Image.Image, amount: float, radius: float = 7.0) -> Image.Image:
    if amount <= 0:
        return Image.new("RGBA", layer.size, (0, 0, 0, 0))
    bloom = layer.filter(ImageFilter.GaussianBlur(radius=radius))
    arr = np.array(bloom)
    arr[:, :, 3] = (arr[:, :, 3].astype(np.float32) * amount).astype(np.uint8)
    return Image.fromarray(arr, "RGBA")


def compose_logo(layers: dict, rings: dict, cx: float, cy: float, t: float) -> Image.Image:
    canvas = Image.new("RGBA", layers["full"].size, (0, 0, 0, 0))
    canvas.alpha_composite(angular_reveal(rings["red"], span(t, 0.00, 0.70)))
    canvas.alpha_composite(angular_reveal(rings["blue"], span(t, 0.18, 0.88)))
    canvas.alpha_composite(angular_reveal(rings["green"], span(t, 0.36, 1.06)))
    canvas.alpha_composite(eds_reveal(layers["eds"], span(t, 0.85, 1.45)))

    hb = wipe_left_to_right(layers["heartbeat"], span(t, 1.25, 1.90))
    canvas.alpha_composite(glow_layer(hb, 0.55 * pulse_once(t, 1.50, 2.05), radius=8.0))
    canvas.alpha_composite(hb)

    canvas.alpha_composite(conditioning_reveal(layers["conditioning"], span(t, 1.75, 2.22)))

    settle = pulse_once(t, 2.12, 2.50) * 0.22
    if settle > 0:
        bloom = canvas.filter(ImageFilter.GaussianBlur(radius=10))
        canvas = Image.alpha_composite(glow_layer(bloom, settle, radius=1.0), canvas)
    return canvas


def _vignette(width: int, height: int) -> np.ndarray:
    yy, xx = np.mgrid[0:height, 0:width]
    nx = (xx - width / 2) / (width / 2)
    ny = (yy - height / 2) / (height / 2)
    r = np.sqrt(nx * nx + ny * ny)
    # 1.0 at center, ~0.86 in the corners. Very subtle.
    return (1.0 - 0.14 * np.clip(r * r, 0, 1)).astype(np.float32)


def render_frame(layers, rings, cx, cy, width, height, t, vignette) -> Image.Image:
    canvas = Image.new("RGBA", (width, height), NAVY)
    logo = compose_logo(layers, rings, cx, cy, t)
    box = int(min(width, height) * 0.52)
    logo = logo.resize((box, box), Image.Resampling.LANCZOS)
    x = (width - box) // 2
    y = (height - box) // 2
    canvas.alpha_composite(logo, (x, y))
    rgb = np.array(canvas.convert("RGB"), dtype=np.float32)
    rgb *= vignette[:, :, None]
    return Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8), "RGB")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--mp4", type=Path, required=True)
    parser.add_argument("--gif", type=Path, default=None)
    parser.add_argument("--still", type=Path, default=None)
    parser.add_argument("--width", type=int, default=1080)
    parser.add_argument("--height", type=int, default=1920)
    parser.add_argument("--fps", type=int, default=60)
    parser.add_argument("--seconds", type=float, default=DURATION)
    args = parser.parse_args()

    icon = Image.open(APP_ICON)
    layers = split_layers(icon)
    cx, cy = _ring_center(layers)
    rings = {name: _prepare_ring(layers[name], cx, cy) for name in ("red", "blue", "green")}
    vignette = _vignette(args.width, args.height)
    duration = args.seconds
    frames = max(2, int(round(args.fps * duration)))
    args.mp4.parent.mkdir(parents=True, exist_ok=True)
    if args.still:
        render_frame(layers, rings, cx, cy, args.width, args.height, duration, vignette).save(args.still, "PNG")

    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        for index in range(frames):
            t = index / max(1, frames - 1) * duration
            frame = render_frame(layers, rings, cx, cy, args.width, args.height, t, vignette)
            frame.save(tmp_path / f"frame-{index:04d}.png")
        encoded = subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-framerate",
                str(args.fps),
                "-i",
                str(tmp_path / "frame-%04d.png"),
                "-c:v",
                "libx264",
                "-profile:v",
                "baseline",
                "-level",
                "4.0",
                "-pix_fmt",
                "yuv420p",
                "-crf",
                "16",
                "-movflags",
                "+faststart",
                str(args.mp4),
            ],
            capture_output=True,
        )
        if encoded.returncode != 0:
            raise SystemExit(encoded.stderr.decode("utf-8", errors="replace"))
        if args.gif:
            palette = tmp_path / "palette.png"
            subprocess.run(
                [
                    "ffmpeg",
                    "-y",
                    "-i",
                    str(args.mp4),
                    "-vf",
                    "fps=20,scale=540:-1:flags=lanczos,palettegen",
                    str(palette),
                ],
                check=True,
                capture_output=True,
            )
            subprocess.run(
                [
                    "ffmpeg",
                    "-y",
                    "-i",
                    str(args.mp4),
                    "-i",
                    str(palette),
                    "-lavfi",
                    "fps=20,scale=540:-1:flags=lanczos[x];[x][1:v]paletteuse",
                    str(args.gif),
                ],
                check=True,
                capture_output=True,
            )
    print("wrote", args.mp4)
    if args.gif:
        print("wrote", args.gif)
    if args.still:
        print("wrote", args.still)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
