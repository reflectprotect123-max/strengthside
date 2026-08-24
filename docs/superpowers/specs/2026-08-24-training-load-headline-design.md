# Training load headline — design spec

**Date:** 2026-08-24  
**Status:** Approved in chat (after silent wire; can parallel Progress UI if thin)  
**Scope:** One displayed training load figure with a **visible cardio / strength split**, per `docs/data/training-load-model.md`. Sleep/Home consumption only — not a fourth dial.

## Problem

WHOOP-style single strain scores under-count lifting. The app already computes separate `strengthLoad` and `conditioningLoad` on session finish, but Home/Sleep does not show a **combined, normalized headline** with an honest split. Athletes cannot see “mostly cardio vs mostly strength” at a glance.

## Goal

Compute and display:

```text
Training load  13.2
               cardio 9.1 · strength 4.1
```

Rolling **7-day** window (match existing `loadSnapshot()` horizon). Numbers are **relative to the athlete's own recent history**, not absolute TRIMP units on screen.

## Locked product decisions

| Topic | Decision |
| --- | --- |
| Channels | **Two** — conditioning + strength; never merged before split is computed |
| Strength channel v1 | Session-RPE proxy: use existing session load math OR `strengthLoad` from finish summary until true sRPE exists |
| Conditioning channel v1 | `@hybrid/engine` cond load when available; else existing `condLoad` / HR-TRIMP path |
| Pain-blocked sessions | **Count toward load** (fatigue happened); separate from calibration exclusion |
| Normalization | Rolling 28-day mean per channel → scale to shared 0–21 **display** band (cosmetic, WHOOP-familiar) |
| Placement | Sleep Overview and/or Home secondary line — **not** a new nav tab |
| Engine Recovery-Sync formula | **Do not ship** invented `round((recovery − 85) / 3)` demo formula — use `@hybrid/engine` zones only |

## Architecture

```text
completed sessions (7–28 day window)
  ├── conditioning channel: EngineAdapter.condLoad / zone seconds × weights
  └── strength channel: strengthLoad or sRPE × duration when RPE captured
        ↓
normalize(channel, rollingMean28)
        ↓
headline = norm(cond) + norm(strength)  // display only
split visible in UI copy
```

New pure module (either):

- `packages/strength-engine/src/trainingLoad.ts` (strength channel + normalization helpers), **or**
- `apps/mobile/prototype/hybrid-app/load-headline.js` (adapter-only v1 — faster ship)

Prefer **adapter v1** to avoid cross-repo engine package scope creep; extract pure functions if reuse emerges.

## Inputs (existing HTML)

| Input | Source |
| --- | --- |
| Completed sessions | `S.sessions` |
| `summary.strengthLoad` | finishSession |
| `summary.conditioningLoad` | finishSession |
| Zone seconds | conditioning `result.zoneSeconds` |
| Session duration | `summary.duration` |

## Non-goals

- Feeding load back into progression (Coordinator owns cross-domain later)
- Nutrition calorie targets from training load
- PubMed-perfect TRIMP calibration in v1
- Replacing WHOOP strain on Home rings

## Error handling

- Missing HR / zero duration → channel contributes 0, not NaN
- No history → show “—” or “Building baseline” until ≥3 sessions in window
- Engine not loaded → strength-only split if cond channel unavailable

## Testing

- Pure: fixture sessions → channel totals + normalized headline
- Smoke: `load-headline.smoke.mjs` in verify
- Manual: heavy lift week vs cardio week → strength share rises in split

## Exit criteria

- [ ] 7-day headline + split rendered on Sleep or Home
- [ ] Strength and conditioning channels documented in code comments with `training-load-model.md` cite
- [ ] Pain-blocked sessions included in strength fatigue channel
- [ ] No invented Recovery-Sync formula
- [ ] `pnpm run verify` green

## References

- `docs/data/training-load-model.md` — authoritative math intent
- `apps/mobile/prototype/hybrid-app/index.html` — `loadSnapshot`, finish summaries
- `apps/mobile/prototype/hybrid-app/engine-adapter.js` — cond load
