# THE Hybrid System — Design Master

Persisted from ui-ux-pro-max + frontend-design, then **overridden** to match the
real product vernacular (strength + recovery, local-first athlete PWA). Do **not**
use the tool’s default blue/light SaaS palette on this product.

## Subject

- **Product:** Athlete training engine (Logger + Builder + readiness).
- **Audience:** Coached athletes logging strength/conditioning daily.
- **Home job:** See readiness → open today’s work. Check-in lives under Sleep.

## Signature

**Brass instrument recovery** — concentric rings, brass bezel gauge, Morpheus zone bar.
One bold move; everything else stays quiet dark chrome.

## Color tokens (source of truth)

| Role | Hex | Notes |
|------|-----|--------|
| Background | `#090909` | App ground |
| Panel | `#121212` / `#191919` | Cards |
| Line | `#2a2927` | Borders |
| Text | `#f1ede5` | Primary copy |
| Muted | `#aaa399` | Secondary (≥4.5:1 on `#121212` when possible) |
| Dim | `#8a847a` | Nav inactive — lifted from `#726d65` for contrast |
| Brass | `#b68a50` / `#dab57f` / `#e0bc87` | Brand + focus ring |
| Blue | `#5d8df4` / `#82a8e9` | Athlete name / links |
| Ok / Warn / Bad | `#9cb48b` / `#d4a35b` / `#cb8174` | Status only |

CSS vars in app: `--bg --panel --gold --gold2 --text --muted --dim --focus`.

## Typography

- **Display (sparse):** `"Barlow Condensed", "Arial Narrow", system-ui` — dates, brand mark, live task titles.
- **Body / UI:** existing Inter / system stack — do not restyle every control.
- Base ≥16px where practical; captions ≥12px; letter-spacing on eyebrows only.

## Layout & chrome

- Max content width `760px`, mobile-first.
- Bottom nav ≤4 items (Home / Programs / Calendar / Settings).
- Touch ≥44px; nav items ≥48px tall; 8px gaps between adjacent controls.
- Safe areas: `env(safe-area-inset-*)` on top and bottom chrome.
- Sheets: `role="dialog"` `aria-modal="true"`; Esc closes; focus close control.

## Motion

- 150–250ms opacity/transform only.
- Honor `prefers-reduced-motion: reduce`.
- No decorative parallax; no gamified bounce on data tables.

## Navigation rules

- Check-in is **not** bottom-nav and **not** on Home front CTAs.
- Path: Home → Sleep module → tabs **Check-in | Overview**.

## Anti-patterns (explicit)

- Orange/blue SaaS template palette from generic fitness searches.
- Cream + terracotta serif marketing look.
- Acid-green cyber dark default.
- Emoji as structural icons.
- Removing focus outlines without a brass replacement.
- Fifth bottom-nav tab for Check-in.

## Stack

Static single-file PWA (`apps/mobile/prototype/hybrid-app/index.html`) + Netlify.
Expo Home remains source of truth for RN: `apps/mobile/src/HomeScreen.tsx`.
