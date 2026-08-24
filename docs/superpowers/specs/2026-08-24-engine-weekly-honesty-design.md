# Engine weekly honesty — design spec

**Date:** 2026-08-24  
**Status:** Implemented (PR #36 — zone helpers pre-existing; load headline + weekly review added)  
**Scope:** Close **Stage 2 logger gaps** for The Engine dial — weekly zone dose, finish zone split, provenance — without touching Hybrid Strength.

## Problem

Engine Stage 1 wired `@hybrid/engine` zones and cond load. Stage 2 gap inventory (`2026-08-23-engine-stage2-logger-gaps.md`) lists open items:

- Home shows **today** zone seconds only — no 7-day aggregate
- Cond-primary finish lacks Rec/Aer/An/Peak minute split
- Zone seconds lack provenance (`measured` / `typed` / `none`)
- Simple cond log interval clock gaps for some formats

Strength is **frozen** during Engine work — same rule as engine import design.

## Goal

Athlete sees **honest conditioning dose** for the rolling week and **credible finish summaries** aligned with `@hybrid/engine` outputs.

## Locked product decisions

| Topic | Decision |
| --- | --- |
| Hybrid Strength | **Untouched** — no edits to strength log, Library, strength-engine call sites |
| UI redesign | **No** — embed controls in existing Engine log card |
| Felt zones | Do not invent — tag provenance; engine `withFeltZones` only when policy clear |
| Weekly card | Home CONDITIONING module — quiet line under zone bar: “7d: 42 aer · 18 ana · …” |
| Finish split | Cond-primary finish shows zone minute breakdown when `zoneSeconds` present |
| BLE HR | Keep existing Web Bluetooth path until engine path proven equal |

## Architecture

```text
completed conditioning sessions
  → EngineAdapter.weeklyZoneSeconds(tasks)
  → Home CONDITIONING render (7-day aggregate)
  → finishSession cond summary → zone split HTML
  → result.zoneSeconds + zsrc metadata on save
```

## Data additions

```ts
interface ConditioningResult {
  // existing fields...
  zoneSeconds?: { recovery: number; aerobic: number; anaerobic: number; peak: number };
  zoneProvenance?: 'measured' | 'typed' | 'none';
}
```

## Non-goals

- Assault/Airdyne BLE
- Replacing strength finish flow
- Store submission / APK changes (Capacitor shell already exists)
- Recovery-Sync invented formula

## Testing

- `engine-adapter.parity.mjs` extended if zone aggregation helpers added
- Manual: complete two cond sessions → Home 7d line updates
- Manual: cond-primary finish shows four zone rows

## Exit criteria

- [x] 7-day zone aggregate on Home CONDITIONING
- [x] Finish zone split on cond-primary sessions
- [x] Zone provenance stored on session result
- [x] Simple log interval clock works for intervals/tempo/custom with work/rest
- [x] Hybrid Strength behavior unchanged (regression smoke)
- [x] `pnpm run verify` green

## References

- `docs/superpowers/specs/2026-08-23-engine-import-design.md`
- `docs/superpowers/plans/2026-08-23-engine-stage2-logger-gaps.md`
- `apps/mobile/prototype/hybrid-app/engine-adapter.js`
