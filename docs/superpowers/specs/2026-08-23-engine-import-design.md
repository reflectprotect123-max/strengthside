# Design — Import APK Engine into athlete HTML app

> **Status:** Approved direction 23 Aug 2026 (`go`).  
> **Product surface:** existing Hybrid HTML Engine dial — screens stay intact.  
> **Hard freeze:** do **not** modify Hybrid Strength (Library, strength log, templates, `@hybrid/strength-engine` call sites).

## Goal

Bring the real conditioning brain from the hybrid APK (`@hybrid/engine`) into strengthside so The Engine dial uses proven math, then harden the logger and weekly dose **before** any APK wrap. Concept2 + Echo come later, lightly in HTML, fully in native shell.

## Locked decisions

| Decision | Choice |
| --- | --- |
| UI | Keep every existing screen; no APK Conditioning.tsx port |
| Hybrid Strength | Untouched — already at a good level |
| Package | Import **full** `@hybrid/engine` (+ `@hybrid/shared-core` dep so tests typecheck) |
| Wiring | HTML calls **only** HR / conditioning / zones / load / concept2 helpers — never strength leftovers |
| Connectors | Stage 3 together (C2 + Echo), after logger solid; expect APK for best BLE |
| Ship APK | Only after Stages 1–2 feel solid for a real training week |

## Non-goals

- Rewriting Home / Library / strength finish / Nutrition UI
- Replacing `@hybrid/strength-engine` with engine lift leftovers
- Full Expo `Conditioning.tsx` UI
- Assault/Airdyne BLE (not upstream)
- Store submission in this design

## Architecture

```
@hybrid/shared-core          (dep only — bring with engine)
@hybrid/engine               (pure TS — source of truth for cond math)
        ↑
  engine-bundle.js           (browser IIFE, like nutrition-bundle)
        ↑
  index.html Engine dial     (existing UI; swap ad-hoc math → package)
```

Adapter rule: map existing builder/log fields → engine inputs; map engine outputs → existing finish/zone UI. Prefer thin wrappers over rewriting screens.

## Stages (summary)

1. **Brain** — package in repo, green tests, zones/load/prescription wired  
2. **Logger** — interval runtime, zone provenance, weekly dose card  
3. **Connectors (light)** — Concept2 OAuth/import + Echo FTMS Web Bluetooth (Chrome Android)  
4. **APK shell** — Capacitor wrap of *this* app (separate plan when Stage 2–3 exit)

## Regression rules (binding)

1. No edits to strength logging, Library starter flow, or `@hybrid/strength-engine` unless a compile break forces a one-line fix (document why).  
2. No visual redesign of Engine chrome in Stage 1 — math swap only.  
3. Do not delete Web Bluetooth HR until engine-backed path is proven equal or better.  
4. Do not “tidy” nutrition or strength while doing Engine work.

## Done when (product)

- A prescribed interval session can be run and finished with honest zone seconds + load from `@hybrid/engine`.  
- Home shows a weekly zone-minute card that matches logged work.  
- Hybrid Strength still behaves exactly as today.  
- `pnpm run verify` green including engine package tests.
