# Design — Lite native shell + Track Dawn punch + label scan

> **Status:** Locked 23 Aug 2026 (brainstorm §1–§2 approved; user: “start the full thing”).  
> **Product surface:** Hybrid HTML athlete mono-app (`apps/mobile/prototype/hybrid-app/`).  
> **Hard freeze:** `@hybrid/strength-engine` math, Library strength templates, and strength log *rules* stay untouched. UI chrome may receive the same light polish as Home / Engine / Settings.

## Goal

Ship a **dogfood Android APK** that wraps the existing athlete HTML app, keep the screen awake during training, let athletes **scan a nutrition label** into Nutrition (confirm before save), and give the whole shell a **medium Track Dawn punch** — sharper presence, not a redesign.

## Locked decisions

| # | Decision | Choice |
| --- | --- | --- |
| 1 | Scope shape | Look polish + thin Cap shell |
| 2 | Visual intensity | Medium Track Dawn punch (user likes current look) |
| 3 | Surfaces | Whole app lightly: Home · Engine · Strength · Settings (+ Nutrition / Calendar match) |
| 4 | Native depth | **Lite native (C)** — Capacitor + native modules only where web fails |
| 5 | Nutrition | **Label scan v1** in this pass |
| 6 | Wake | Native wake lock for training sessions |
| 7 | Ship target | Dogfood APK; not polished Play Store; **not iOS** this pass |

## Non-goals

- Full Kotlin / Compose rewrite
- iOS Capacitor project
- Play Store listing polish, signing playbooks beyond “build a debug/dogfood APK”
- Cloud OCR / remote vision API
- Rewriting Nutrition IA or MacroTrack schema migrations in this repo
- Changing `@hybrid/strength-engine` prescription / WM / PR logic
- Heavy brand rethink or palette swap away from Track Dawn

## Architecture

```
hybrid-app (index.html + *.js)     ← edit here
        │ sync-hybrid-html.sh
        ▼
preview-site / THE-Hybrid-App.html ← web + Netlify
        │ Capacitor webDir
        ▼
Android WebView (Capacitor)        ← dogfood APK
        │
   native bridges (only these):
     • Wake lock (training / live HR)
     • Camera + on-device OCR (ML Kit Text Recognition)
```

### Shell

- Capacitor Android project lives under `apps/mobile/capacitor/`.
- `webDir` points at synced `apps/mobile/preview-site` (or a copy step that mirrors it).
- JS detects Cap via `window.Capacitor` and routes to plugins; browser keeps existing web paths.

### Wake lock

- **Acquire** when: conditioning live log opens, strength train screen is active, or BLE HR is `live` (already partially present).
- **Release** when: leave / finish / abandon session, HR pause/disconnect, `pagehide`, Cap `appStateChange` → background.
- Prefer Cap `@capacitor-community/keep-awake` (or equivalent) when native; fall back to Screen Wake Lock API on Chrome.

### Nutrition label scan v1

Pure parse already exists: `@hybrid/nutrition-core` `parseLabelLines` / `parseLabelText` / `isEmptyLabel` (bundled in `nutrition-bundle.js`).

Flow:

1. Nutrition → **Scan label** (or Custom food → Scan).
2. Cap: Camera photo → ML Kit on-device text → `OcrLine[]` → `parseLabelLines`.
3. Web dogfood: camera/file capture → best-effort text (or paste) → `parseLabelText` / lines if available.
4. Confirm sheet pre-fills kcal / P / C / F (+ serving if known). Athlete edits, then logs or saves custom food.
5. Empty / unreadable → “Couldn’t read label — enter manually.” Never invent macros.

No cloud OCR. Fail soft.

### Look polish (medium punch)

Follow existing Track Dawn tokens and `docs/superpowers/plans/2026-08-23-athlete-ui-ux-full-polish.md` **Zero AI slop** ban list.

- One token layer; Space Grotesk + Barlow Condensed; copper / zone teal / graphite.
- Stronger brand signal in the sticky top (still not a marketing hero).
- Twin instruments: Engine teal / Strength copper share sticky + chip grammar.
- Interaction floor: 44px taps, safe-area, `focus-visible`, reduced motion.
- No new IA, no card soup, no purple/glow/Inter.

## Data / storage

- Training: `THE-builder-clean-v1` (unchanged).
- Nutrition: `hybrid-nutrition-v1` (unchanged).
- No new Postgres tables. No MacroTrack migrations in this repo.

## Testing

| Layer | What |
| --- | --- |
| Unit | Existing `label.test.ts` stays green; any bridge helpers get colocated tests if pure |
| Parity / verify | `pnpm run verify` (engine adapter + packages) |
| Web manual | Home / Engine / Strength / Nutrition confirm flow with fixture text |
| Native | Debug APK installs; wake lock holds during cond log; Scan opens camera and fills confirm sheet on a real label when ML Kit path is present |

## Done when

- Capacitor Android project builds a dogfood APK (or documented blocker if SDK missing in CI — local script still works).
- Screen stays awake for an active Engine or Strength session in Cap and Chrome.
- Scan label → confirm → log works end-to-end on device; web has a usable fallback.
- Medium Track Dawn polish shipped; Strength **math** unchanged.
- Cache / `LOCAL_BUILD` bumped; sync + handoff stamp; `pnpm run verify` green.

## Ship order (summary)

1. Spec + slices plan (this doc + plan).  
2. Cap scaffold + sync wiring.  
3. Wake lock unify.  
4. Label scan bridge + Nutrition UI.  
5. Medium polish + cache bump.  
6. Dogfood APK script + handoff.
