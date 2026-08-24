# Strength volume budget — design spec

**Date:** 2026-08-24  
**Status:** Shipped (PR #35) — spec written retroactively for handoff  
**Scope:** Soft time-budget volume guides from athlete schedule settings. **Not** hard caps.

## Problem

RP-style hypertrophy literature talks about ~20 sets/muscle/week at specialize volume. A solo athlete on **3× full body × 60 min** is realistically **6–12 sets/muscle/week**, not 20. Without schedule-aware guides, the builder has no honest context for set counts.

## Goal

Athlete sets **sessions/week**, **typical minutes**, and **split type** in Settings. Builder shows a **Volume guide** card with soft per-session and per-muscle weekly hints derived from `@hybrid/strength-engine` `volumeBudget.ts`. Nothing blocks save.

## Locked product decisions

| Topic | Decision |
| --- | --- |
| Session time | **Planning input only** — copy says so; no timer, no hard stop |
| Volume guides | **Soft** — visible in builder/settings; never block save or clamp sets |
| Split types | `full_body` \| `upper_lower` \| `push_pull_legs` |
| Warmup assumption | 10 min default (engine constant) |
| Minutes per working set | 4 min default (engine constant) |
| Over-cap feedback | Audit warnings only — informational copy in builder card |

## Architecture

```text
Settings (S.settings.strengthSchedule)
  → HybridStrength.Volume.computeVolumeBudget(...)
  → builder card: session cap, per-muscle weekly bands (maintain / grow / emphasize)
  → auditSessionWorkingSets on draft (warning if over session cap)
```

Pure math lives in `packages/strength-engine/src/volumeBudget.ts`. HTML only renders.

## Data shape

```ts
interface StrengthSchedule {
  sessionsPerWeek: number;      // default 3
  minutesPerSession: number;    // default 60
  splitType: 'full_body' | 'upper_lower' | 'push_pull_legs';
}
```

Stored in `S.settings.strengthSchedule`.

## Non-goals

- RP muscle-volume controller (MEV/MRV feedback loops)
- Blocking template save when over cap
- Auto-removing sets from templates
- Session timer tied to minutes setting

## Testing

- `packages/strength-engine/src/volumeBudget.test.ts` — pure unit tests
- `check:strength-volume` smoke — bundle + 3×60 full body cap sanity

## Exit criteria

- [x] `volumeBudget.ts` + tests in strength-engine
- [x] Settings “Strength schedule” UI
- [x] Builder “Volume guide” card
- [x] `check:strength-volume` in verify + CI
- [x] No save blocks or set clamps

## References

- `packages/strength-engine/src/volumeBudget.ts`
- `apps/mobile/prototype/hybrid-app/strength-entry.ts` (Volume export)
