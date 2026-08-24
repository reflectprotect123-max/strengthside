# Five systems complete — design spec

**Date:** 2026-08-24  
**Status:** Draft — awaiting owner review  
**Scope:** Close wiring gaps across Strength, Conditioning, Nutrition, Recovery, and Coordinator so each engine is product-complete for solo dogfood. **Invisible brains; visible logging only.**

## Problem

All five systems already exist as engines (or pure modules) with tests. The HTML athlete app wires each only partially. Owner asked to complete all five; polish/coach scrub already shipped on `main` (v59). The remaining work is **wiring and domain finish**, not inventing new packages.

## Product locks (binding)

| Topic | Decision |
| --- | --- |
| Surface | Hybrid HTML app only (`apps/mobile/prototype/hybrid-app/`) |
| Brains | **Invisible** — silent apply; no accept/decline; no Recovery dial; **no weekly Coordinator peek** |
| Visible | Log food / sets / conditioning, check-in, Library, Calendar, Settings, existing Home modules |
| Nutrition extras | **No** new recipes UI; **No** expenditure charts |
| Conditioning progression | Engine **`conAdapt`** (earned levels) — **not** cross-engine vote per bump |
| Cross-domain | **Coordinator** reads all four; silent apply only; no weekly sheet |
| Training blocked? | **Never** in solo dogfood |
| Pain Yes | Holds strength autopilot bumps only |
| Strength `@hybrid/strength-engine` | Stays pure (zero I/O) |
| Shared Supabase | No migrations against hybrid-owned tables (`CLAUDE.md`) |
| Cancelled | Coach / ARC / Expo / Phase B / AI progression v2 / App Store Stage 4 |

## Build order (Approach 1 — vertical by domain)

One domain to “complete” before the next. One PR series per phase. Cache bump + `pnpm run verify` green each phase.

| Phase | System | Complete means |
| --- | ---: | --- |
| 1 | **Strength** | `%WM` resolve + equipment rounding; engine e1RM + session load (replace tonnage/50 stub); Progress stays list-first (no chart requirement); cloud performed-set / set-row sync when signed in |
| 2 | **Nutrition** | Day-status (complete / fasted / partial) wired into adaptive check-in inputs; no recipes UI; no charts; keep existing log + barcode + weekly check-in |
| 3 | **Conditioning** | Wire `conAdapt` + persist level map; prefer engine zone helpers where HTML duplicates; insights stay **silent** (feed Coordinator receipts only — no new athlete insight screen) |
| 4 | **Recovery** | Finish heat ledger + capacity in posture; dampen load-headline **copy only**; **zero new UI** |
| 5 | **Coordinator** | Silent cross-domain apply only; **remove or stop surfacing** weekly “This week” peek if present; no nag sheet |

## Architecture

```text
packages/strength-engine     → strength-bundle + strength-adapter + strength-sync
packages/engine              → engine-bundle + engine-adapter
packages/nutrition-*         → nutrition-bundle + nutrition-ui + nutrition-sync
recovery-engine.js           → recovery-signals (thin) → adapters / coordinator
coordinator.ts               → coordinator-adapter (silent only)
        ↓
index.html (logging surfaces only; brains invisible)
```

Adapters own persistence and silent apply. Engines remain pure functions.

## Phase details

### Phase 1 — Strength

- Export resolve / e1RM / load into browser bundle if missing.
- On session start: resolve `%WM` targets from working max; equipment-aware rounding; fallback when no WM (last load / prompt — no invented loads).
- Finish + load headline use engine load / e1RM (single source of truth).
- Progress: keep PR / WM / audit; deepen history lists only as needed for trust — no charts required this phase.
- Cloud: when signed in, sync set rows (or equivalent snapshot) using existing athlete snapshot / owned-table patterns — local-first offline.

### Phase 2 — Nutrition

- Wire day-status into daily records consumed by `weeklyCheckIn` / expenditure path.
- Do **not** add recipes screens or expenditure charts.
- Leave search, barcode, label scan, Home summary, weekly check-in accept/decline as today.

### Phase 3 — Conditioning

- After cond complete: call `conAdapt`; persist `conProgress` in athlete settings/state.
- Prescription reads `conProgLevel` for progressed formats.
- Prefer `HybridEngine.Hr` helpers for zone seconds where HTML currently duplicates.
- No new insights UI; any insight signals go into Coordinator receipts only.

### Phase 4 — Recovery

- Complete heat / steps → posture fields.
- Capacity hint exists on posture object for Coordinator / load headline; **not rendered** as athlete chrome.
- Load headline may soften wording when gate is hold/caution; never blocks Start.

### Phase 5 — Coordinator

- Keep `Coordinator.plan()` + silent apply paths.
- Hide / remove athlete-facing weekly review entry points.
- Expand silent-safe applies only where domain adapters already allow (e.g. cond ease); never re-implement strength `decideProgression` inside Coordinator.

## Non-goals

- Recipes UX, nutrition charts, weekly Coordinator UI
- Cross-engine vote inside `conAdapt` (rejected — Approach A)
- Pain auto-stop restoration
- Hard volume blocks / progression accept sheets
- Expo, Coach, ARC, iOS native BLE / Play Store listing
- AI / LLM planner

## Testing

- Per phase: extend existing `*.smoke.mjs` / Vitest; `pnpm run verify` green
- Manual dogfood: train a week without seeing autopilot chrome; logging still works
- Strength: %WM session → resolve → finish → Progress + optional sync
- Cond: two measured sessions → level map changes silently
- Nutrition: day-status affects next weekly check-in inputs
- Recovery: red check-in → strength bump held (invisible)
- Coordinator: no “This week” sheet reachable from Home/Sleep

## Exit criteria

- [ ] Phases 1–5 shipped on `main` with cache bumps
- [ ] No new Recovery dial, no weekly Coordinator peek, no recipes/charts UI
- [ ] Strength resolve + engine e1RM/load wired; set sync when signed in
- [ ] Nutrition day-status wired into adaptive path
- [ ] Cond `conAdapt` persisted and consumed
- [ ] Recovery posture complete for silent consumers
- [ ] `pnpm run verify` green after each phase
- [ ] Handoff stamp updated once

## References

- `docs/superpowers/plans/2026-08-23-mono-athlete-app-charter.md`
- `docs/superpowers/specs/2026-08-24-hybrid-athlete-roadmap-design.md`
- `docs/superpowers/specs/2026-08-24-four-system-coordinator-design.md`
- `docs/superpowers/specs/2026-08-24-recovery-engine-design.md`
- `docs/superpowers/specs/2026-08-24-engine-weekly-honesty-design.md`
- Owner brainstorm 24 Aug 2026: Approach 1; Strength→…→Coordinator; invisible brains; no recipes/charts; `conAdapt` Approach A; no weekly peek
