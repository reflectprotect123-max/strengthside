# Autopilot V3 — unified strength + conditioning (2-day rebuild)

**Date:** 2026-09-03  
**Scope:** Athlete HTML app only. Coach pins, PM5 CSAFE, supersets V2.2, EffortProfile learning — out of scope.

## One rulebook, two domains

| Concept | Strength | Conditioning (Echo intervals MVP) |
|---|---|---|
| **Anchor** | Last load (or rep volume) per `exerciseId` in `loadHints` / `volumeHints` | Last target watts + benchmark max per `format:modality:device` in `settings.condAnchors` |
| **Set / interval 1** | Anchor or manual | Anchor % of benchmark max (easy 60%, medium 80%, hard 92%) or manual |
| **In-session** | Slider + `decideNextSet` | Slider + `decideNextPhase` (max 2 +3% pushes per workout) |
| **Session end** | `saveSessionAnchors` only | `saveCondAnchors` only |
| **Removed (athlete path)** | WM gate, calibration gates, `decideProgression`, session-end bumps | `conAdapt` level/miss loops as primary path |

## Strength

- **Session end:** `StrengthAdapter.saveSessionAnchors` writes last completed load (or rep sets×reps) — no silent bump.
- **Session start:** `loadHints` prefills set 1 immediately (no 2-session calibration gate).
- **WM:** Optional manual override in Progress; not required to start a session.
- **In-session:** Existing `decideNextSet` + one-set logger unchanged.

## Conditioning (Echo intervals — day 2)

- **Anchors:** `settings.condAnchors['intervals:bike:echo'] = { lastTargetWatts, maxWatts, updatedAt }`.
- **Benchmark:** `settings.condBenchmarkMaxW` (manual, settings later).
- **Session start:** Empty `targetWatts` → anchor % of max.
- **In-session:** Rest slider → `decideNextPhase`; cap +3% pushes at 2 per workout.
- **Session end:** `saveCondAnchors`; do not call `conAdapt` for athlete progression.
- **HR:** WHOOP recovery still shifts zone edges via `conZones`; red days do not ease starting watts (volume/HR edges only).

## Files touched

- `apps/mobile/prototype/hybrid-app/strength-adapter.js`
- `apps/mobile/prototype/hybrid-app/engine-adapter.js`
- `packages/engine/src/decideNextPhase.ts`
- `apps/mobile/prototype/hybrid-app/cond-interval-autoreg.js`
- `apps/mobile/prototype/hybrid-app/cond-session-logger.js`
- `apps/mobile/prototype/hybrid-app/index.html`
- `apps/mobile/prototype/hybrid-app/big-mac-bridge.js`
- Smokes + `sync-hybrid-html.sh`
