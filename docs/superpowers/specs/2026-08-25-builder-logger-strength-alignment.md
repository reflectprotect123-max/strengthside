# Builder / logger alignment — Hybrid Strength × five engines

**Date:** 25 August 2026  
**Scope:** Athlete HTML app only (`apps/mobile/prototype/hybrid-app/index.html`)

## Problem

Phases 1–5 wired `@hybrid/strength-engine` silently: `%WM` resolve, load hints, session-end progression, Progress tab. The **builder** still hid prescriptions after save; the **logger** prefilled weights with no explanation and treated RIR as optional decoration. Copy still said “dial”, “autopilot”, and “S4”.

## Design direction (Track Dawn — keep existing tokens)

Do **not** adopt generic ui-ux-pro-max palette/fonts. Stay on:

- Background `#0a0c0e`, copper `#d4a574` (strength), teal `#5ec4b4` (conditioning)
- Space Grotesk body, Barlow Condensed display
- Mobile-first; 44px tap floor; reduced-motion safe (no new choreographed motion)

## Information architecture

| Surface | Job | Shows |
| --- | --- | --- |
| **Builder** | Author prescription | Sets × reps, rest, **% WM**, lift cue |
| **Session start** | Stamp loads | `applyLoadHintsToTasks` (unchanged) |
| **Logger** | Log evidence | Today’s load headline, last-set RIR, previous row refs |
| **Summary** | Close the loop | Progression decisions for this session |
| **Progress** | History + anchors | WM, next load, audit (renamed copy) |

## Logger — load headline

New copper card above set rows (`StrengthAdapter.sessionLoadContext`):

- **Progression:** `62.5 kg · progression` — from `loadHints` after silent bump
- **Prescription:** `70 kg · 70% WM` — from `loadExpr` + working max
- **Calibration chip:** `Building load model · 2/3 sessions`
- **Unresolved %WM:** helper text to set WM in Progress

## Logger — RIR

- Last **planned** set gets left copper rule + label `RIR · counts`
- Guardrail: “Log RIR on your last set — it drives the next session load.”
- Engine already maps RIR → RPE on the representative (last) set per session

## Builder

- `exerciseLine` / `previewBlock` show `· 70% WM` when `loadExpr` set
- Exercise sheet: “Load % of working max” helper without internal task ids
- “History calculator” relabeled — separate from session prescription

## Copy pass

| Old | New |
| --- | --- |
| Hybrid Strength · dial | Hybrid Strength |
| Lifts dial | Hybrid Strength |
| other dial — Home | Conditioning lives on Home |
| autopilot hint / Recent autopilot | Next session load / Recent progression |
| Enable 1RM % calculator | History calculator (optional) |

## Out of scope (follow-ups)

- Starter templates with default `%WM` on main barbell lifts
- Superset logger parity (same headline pattern)
- Removing legacy `exerciseProfile()` entirely
- Overturn loadHints-before-%WM precedence

## Verify

- `node apps/mobile/prototype/hybrid-app/strength-load-context.smoke.mjs`
- Existing strength smokes + `pnpm run verify`
- Manual: start Full Body session → see load headline + last-set RIR cue
