# Hybrid athlete — post-volume-budget slice plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan **one slice at a time**. Steps use checkbox (`- [ ]` / `- [x]`) syntax for tracking.
>
> **Rule:** **≤10 slices per phase.** Finish the phase verify gate before starting the next phase. Never batch multiple phases in one PR unless the owner explicitly asks.

**Goal:** Ship the hybrid athlete roadmap (`2026-08-24-hybrid-athlete-roadmap-design.md`) without scope creep — bounded slices, green `pnpm run verify` after every slice that touches code.

**Architecture:** `@hybrid/strength-engine` stays pure (zero I/O). HTML adapters own storage, sync, and UI. Engine dial frozen during strength phases; strength frozen during engine-only slices.

**Tech stack:** TypeScript packages (Vitest), esbuild IIFE bundles, `apps/mobile/prototype/hybrid-app/` HTML app, smoke `.mjs` checks in `pnpm run verify`.

**Master spec:** `docs/superpowers/specs/2026-08-24-hybrid-athlete-roadmap-design.md`

**Ship status:** Phases 1–8 implemented in PR #35 (volume) and PR #36 (everything else). Checkboxes below record the slices that **should** have been executed — use them as the template for any rework or v2 gaps.

---

## Global constraints

- **Silent apply** — no progression accept/decline sheets.
- **Soft volume guides** — never block save or clamp sets.
- **60 min** — planning input only; not a timer or hard stop.
- **Training never blocked** — recovery gates only autopilot load increases.
- **Pain at session end only** — Yes blocks progression for that session's lifts (overrides PR override).
- **No check-in today → no silent bumps** — WHOOP alone cannot unlock.
- **Worst-of** subjective + WHOOP for bump gates.
- **`@hybrid/strength-engine` stays pure** — adapters own I/O.
- **Shared Supabase contract** — no migrations against hybrid-owned tables (`CLAUDE.md`).
- Bump `LOCAL_BUILD` + service-worker `CACHE` together when shipping HTML.
- Run `bash apps/mobile/sync-hybrid-html.sh` when prototype assets change.
- **`pnpm run verify` must stay green** after every code slice.

## File map

| Path | Role |
| --- | --- |
| `packages/strength-engine/` | Pure progression, volume, coordinator math |
| `apps/mobile/prototype/hybrid-app/strength-entry.ts` | Browser export surface |
| `apps/mobile/prototype/hybrid-app/strength-bundle.js` | IIFE `window.HybridStrength` |
| `apps/mobile/prototype/hybrid-app/strength-adapter.js` | HTML ↔ strength-engine |
| `apps/mobile/prototype/hybrid-app/recovery-engine.js` | Pure recovery posture |
| `apps/mobile/prototype/hybrid-app/recovery-signals.js` | Thin gate wrapper → recovery-engine |
| `apps/mobile/prototype/hybrid-app/load-headline.js` | 7-day load headline + split |
| `apps/mobile/prototype/hybrid-app/strength-sync.js` | Cloud snapshot push/pull |
| `apps/mobile/prototype/hybrid-app/coordinator-adapter.js` | Weekly receipt collection + sheet HTML |
| `apps/mobile/prototype/hybrid-app/index.html` | UI wiring only — no engine math inline |
| `apps/mobile/sync-hybrid-html.sh` | Copy assets to preview + root |
| `docs/superpowers/specs/2026-08-24-*.md` | Per-phase design specs |

## Slice numbering

| Phase | Prefix | Spec | Max slices |
| --- | --- | --- | ---: |
| 1 Volume budget | V1–V8 | `strength-volume-budget-design.md` | 8 |
| 2 Silent wire | S1–S10 | `strength-recovery-silent-wire-design.md` | 10 |
| 3 Progress UI | P1–P10 | `strength-progress-ui-design.md` | 10 |
| 4 Load headline | L1–L8 | `training-load-headline-design.md` | 8 |
| 5 Strength sync | Y1–Y10 | `strength-cloud-sync-design.md` | 10 |
| 6 Engine weekly honesty | E1–E10 | `engine-weekly-honesty-design.md` | 10 |
| 7 Recovery engine | R1–R10 | `recovery-engine-design.md` | 10 |
| 8 Coordinator | C1–C10 | `four-system-coordinator-design.md` | 10 |

**Total: 76 slices across 8 phases (all ≤10 each).**

---

# Phase 1 — Strength volume budget (soft guides)

**Spec:** `docs/superpowers/specs/2026-08-24-strength-volume-budget-design.md`  
**Shipped:** PR #35  
**Exit:** Settings schedule + builder volume card; `check:strength-volume` green.

### Slice V1 — Pure `volumeBudget.ts`

- [x] Implement `computeVolumeBudget` in `packages/strength-engine/src/volumeBudget.ts`
- [x] Colocated tests in `volumeBudget.test.ts`
- [x] Export from `strength-entry.ts` / bundle
- [x] `pnpm run verify` green

### Slice V2 — Settings “Strength schedule”

- [x] Add `S.settings.strengthSchedule` defaults (3×60 full body)
- [x] Settings UI: sessions/week, minutes, split type
- [x] Persist on save
- [x] `pnpm run verify` green

### Slice V3 — Builder volume guide card

- [x] Call `HybridStrength.Volume.computeVolumeBudget` from builder
- [x] Show session cap + per-muscle bands (maintain / grow / emphasize)
- [x] Copy states “planning input only” — no timer
- [x] `pnpm run verify` green

### Slice V4 — Session cap audit (warning only)

- [x] `auditSessionWorkingSets` on draft — informational if over cap
- [x] **No** save block or set clamp
- [x] `pnpm run verify` green

### Slice V5 — `check:strength-volume` smoke

- [x] Add `strength-volume.smoke.mjs` — bundle + 3×60 cap sanity
- [x] Wire into `package.json` `verify` + CI
- [x] `pnpm run verify` green

### Slice V6 — Sync preview copies

- [x] Run `bash apps/mobile/sync-hybrid-html.sh`
- [x] `check:hybrid-proxy` green

### Slice V7 — Spec exit criteria

- [x] Mark spec exit criteria checked
- [x] Document in roadmap “shipped” table

### Slice V8 — Phase 1 handoff

- [x] Commit per slice (or logical group); no `--passWithNoTests`
- [x] Phase verify gate: `pnpm run verify` green

---

# Phase 2 — Silent strength + recovery wire

**Spec:** `docs/superpowers/specs/2026-08-24-strength-recovery-silent-wire-design.md`  
**Shipped:** PR #36  
**Exit:** Silent progression + pain prompt + recovery gates; no Coordinator UI.

### Slice S1 — Strength bundle + adapter skeleton

- [x] `build-strength.sh` → `strength-bundle.js` with Progression, Exposure, Pr, WorkingMax
- [x] `strength-adapter.js` namespace with read-only helpers first
- [x] Load scripts in `index.html` without breaking cond/nutrition
- [x] `pnpm run verify` green

### Slice S2 — Session-end pain prompt

- [x] After strength session finish: No / Mild / Yes (+ optional note)
- [x] Persist `sessionPain`, `sessionPainNote`, `trainedExerciseIds`
- [x] `pnpm run verify` green

### Slice S3 — Exposure classification on complete

- [x] Map completed sets → engine exposures (including `pain_blocked` when pain Yes)
- [x] `pnpm run verify` green

### Slice S4 — Minimal recovery gates (`recovery-signals.js`)

- [x] `recoverySignal()` → `ok | caution | hold` from check-in + WHOOP worst-of
- [x] No check-in today → `hold` (WHOOP alone cannot unlock)
- [x] `pnpm run verify` green

### Slice S5 — `applySilentProgression`

- [x] Call `decideProgression` per exercise with enough history
- [x] Force `hold` when gate caution/hold or session pain Yes
- [x] PR / performance override when gate ok and real PR vs history
- [x] `pnpm run verify` green

### Slice S6 — Audit log + working max writes

- [x] Append `S.meta.progressionAudit[]` entries with reason codes
- [x] Write working max / load hints silently — no UI prompt
- [x] Cap audit length (~200)
- [x] `pnpm run verify` green

### Slice S7 — Wire `finalizeSilentStrength` on session complete

- [x] Hook from strength finish path only
- [x] Missing bundle → skip quietly (dev log once)
- [x] `pnpm run verify` green

### Slice S8 — `check:strength-progression` smoke (core)

- [x] `strength-progression.smoke.mjs` — bump, hold, pain, red-day cases
- [x] `recovery-signals.smoke.mjs` — gate matrix
- [x] Add to `package.json` verify + CI
- [x] `pnpm run verify` green

### Slice S9 — Volume guides regression

- [x] Confirm volume budget still soft-only after silent wire
- [x] `check:strength-volume` still green

### Slice S10 — Phase 2 handoff

- [x] Spec exit criteria checked; Coordinator explicitly deferred
- [x] `pnpm run verify` green

---

# Phase 3 — Strength progress UI (read-only proof)

**Spec:** `docs/superpowers/specs/2026-08-24-strength-progress-ui-design.md`  
**Shipped:** PR #36  
**Exit:** Library → Progress shows PRs, WM, audit — no accept/decline UI.

### Slice P1 — `recordPrEvents` on session complete

- [x] Extend adapter: on finish, run `detectPr` vs prior `prEvents`
- [x] Append to `S.strengthState.prEvents`
- [x] `pnpm run verify` green

### Slice P2 — `progressSummary(state)`

- [x] Return `{ prs, workingMaxes, recentAudit }` shape
- [x] Cap lists (e.g. 20 PRs, 8 WM, 20 audit)
- [x] `pnpm run verify` green

### Slice P3 — `auditReasonText(reasonCodes)`

- [x] Map engine codes → plain English one-liners
- [x] Include pain / recovery gate strings
- [x] `pnpm run verify` green

### Slice P4 — Library → Progress route

- [x] One entry path only (Library button — not duplicate on Home)
- [x] `openStrengthProgress()` + `strengthProgressHtml()`
- [x] `pnpm run verify` green

### Slice P5 — PR list render

- [x] Exercise name, reps, load, date
- [x] Empty state copy
- [x] `pnpm run verify` green

### Slice P6 — Working max list render

- [x] Top lifts from `workingMaxEvents`
- [x] `exerciseNameFor()` helper
- [x] `pnpm run verify` green

### Slice P7 — Audit list render (read-only)

- [x] Last N entries with action + reason text
- [x] No undo / no accept-decline
- [x] `pnpm run verify` green

### Slice P8 — Link to weekly review (read-only)

- [x] Progress screen link → `openWeeklyReview()` (Coordinator sheet)
- [x] Does not gate progression
- [x] `pnpm run verify` green

### Slice P9 — `strength-progress-ui.smoke.mjs`

- [x] HTML includes Progress route + adapter exports
- [x] Headless `progressSummary` shape check
- [x] In `check:strength-progression`
- [x] `pnpm run verify` green

### Slice P10 — Phase 3 handoff

- [x] Spec exit criteria checked
- [x] `pnpm run verify` green

---

# Phase 4 — Training load headline

**Spec:** `docs/superpowers/specs/2026-08-24-training-load-headline-design.md`  
**Shipped:** PR #36  
**Exit:** 7-day headline + cardio · strength split on Home/Sleep.

### Slice L1 — `load-headline.js` pure module

- [x] Two channels: conditioning + strength (never merge before split)
- [x] 7-day window + 28-day rolling mean normalization
- [x] Cite `docs/data/training-load-model.md` in comments
- [x] `pnpm run verify` green

### Slice L2 — Strength channel from finish summaries

- [x] Use existing `strengthLoad` / session finish data
- [x] Pain-blocked sessions still count (fatigue happened)
- [x] `pnpm run verify` green

### Slice L3 — Conditioning channel from engine adapter

- [x] Prefer `EngineAdapter.condLoad` when loaded
- [x] Fallback to existing HR-TRIMP path — no invented Recovery-Sync formula
- [x] `pnpm run verify` green

### Slice L4 — Baseline / empty states

- [x] `<3 sessions` → “Building baseline” reason code
- [x] Missing HR → 0 contribution, not NaN
- [x] `pnpm run verify` green

### Slice L5 — Home placement

- [x] Secondary line on Home modules (not a fourth dial)
- [x] `pnpm run verify` green

### Slice L6 — Sleep placement

- [x] Same headline on Sleep overview
- [x] `pnpm run verify` green

### Slice L7 — `load-headline.smoke.mjs`

- [x] Fixture sessions → headline + split numbers
- [x] In `check:strength-progression`
- [x] `pnpm run verify` green

### Slice L8 — Phase 4 handoff

- [x] Spec exit criteria checked
- [x] `pnpm run verify` green

---

# Phase 5 — Strength cloud sync

**Spec:** `docs/superpowers/specs/2026-08-24-strength-cloud-sync-design.md`  
**Shipped:** PR #36  
**Exit:** Domain snapshot push/pull like nutrition; Settings card.

### Slice Y1 — `strength-sync.js` skeleton

- [x] IIFE `window.StrengthSync` mirroring `nutrition-sync.js` shape
- [x] Domain key `strength`
- [x] `pnpm run verify` green

### Slice Y2 — Payload envelope v1

- [x] `{ snapshotVersion, strengthState, progressionAudit slice, revision }`
- [x] Trim audit before push if too large
- [x] **Do not** sync full `S` blob
- [x] `pnpm run verify` green

### Slice Y3 — `schedulePush` debounced

- [x] Hook from `finalizeSilentStrength` / completed workout save
- [x] Offline → queue silently
- [x] `pnpm run verify` green

### Slice Y4 — Pull on sign-in / Settings open

- [x] Merge rules: newest revision wins; stale recovery like nutrition
- [x] No cloud session → skip quietly
- [x] `pnpm run verify` green

### Slice Y5 — Settings card HTML

- [x] `StrengthSync.cardHtml()` next to nutrition sync card
- [x] “Sign in via WHOOP/Nutrition to enable sync” when logged out
- [x] `pnpm run verify` green

### Slice Y6 — RPC wiring

- [x] Use `upsert_athlete_domain_snapshot` (same RPC as nutrition)
- [x] **No** new Postgres migration in this repo
- [x] `pnpm run verify` green

### Slice Y7 — Conflict / error handling

- [x] RPC failure → retry backoff; never corrupt local state
- [x] `pnpm run verify` green

### Slice Y8 — Script load order

- [x] Load after `strength-adapter.js` in `index.html`
- [x] Bump SW cache with HTML ship
- [x] `pnpm run verify` green

### Slice Y9 — `strength-sync.smoke.mjs`

- [x] Assert exports: `schedulePush`, `cardHtml`, snapshot shape
- [x] In `check:strength-progression`
- [x] `pnpm run verify` green

### Slice Y10 — Phase 5 handoff

- [x] Spec exit criteria checked
- [x] Manual note: two-browser pull optional for dogfood
- [x] `pnpm run verify` green

---

# Phase 6 — Engine weekly honesty (Stage 2 gaps)

**Spec:** `docs/superpowers/specs/2026-08-24-engine-weekly-honesty-design.md`  
**Shipped:** PR #36 (helpers largely pre-existing; verified wired)  
**Exit:** 7d zone line on Home; finish zone split; provenance — **Hybrid Strength untouched**.

### Slice E1 — `EngineAdapter.weeklyZoneSeconds`

- [x] Aggregate completed cond sessions over 7-day window
- [x] Return `{ recovery, aerobic, anaerobic, peak }` seconds
- [x] `engine-adapter.parity.mjs` still green

### Slice E2 — Home 7-day zone line

- [x] `athWeeklyZoneLineHtml()` under CONDITIONING module
- [x] Quiet copy: “Week · Aer 42 · …”
- [x] `pnpm run verify` green

### Slice E3 — Zone provenance on save

- [x] `zoneProvenanceForResult()` → `measured | typed | none`
- [x] Persist `result.zsrc` on cond complete
- [x] `pnpm run verify` green

### Slice E4 — Finish zone split (cond-primary)

- [x] `finishZoneSplitHtml(zoneSeconds)` on session summary
- [x] Four rows when data present
- [x] `pnpm run verify` green

### Slice E5 — Interval clock (intervals/tempo/custom)

- [x] `ensureTaskInterval` + work/rest countdown in simple cond log
- [x] Leave/finish prompt still works
- [x] `pnpm run verify` green

### Slice E6 — BLE path unchanged

- [x] Web Bluetooth HR still feeds zone seconds
- [x] No cross-brand calorie invention
- [x] `pnpm run verify` green

### Slice E7 — Strength freeze check

- [x] No edits to strength log / Library / strength-engine call sites in this phase
- [x] `check:strength-progression` regression green

### Slice E8 — Typed HR fallback

- [x] Manual avg HR path unchanged UX
- [x] Provenance reflects `typed` vs `measured`

### Slice E9 — Stage 2 gap doc cross-check

- [x] Close items in `2026-08-23-engine-stage2-logger-gaps.md` that this phase owns
- [x] Defer Assault/Airdyne BLE explicitly

### Slice E10 — Phase 6 handoff

- [x] Spec exit criteria checked
- [x] `pnpm run verify` green

---

# Phase 7 — Full recovery engine

**Spec:** `docs/superpowers/specs/2026-08-24-recovery-engine-design.md`  
**Shipped:** PR #36  
**Exit:** Pure posture module; signals delegate; no training block.

### Slice R1 — `recovery-engine.js` pure module

- [x] `recoveryPosture(input)` → `RecoveryPosture` shape
- [x] Bands: build / control / minimum / insufficient_data
- [x] `pnpm run verify` green

### Slice R2 — Worst-of gate mapping

- [x] Subjective vs WHOOP for bump gate (unchanged silent wire rules)
- [x] No check-in → insufficient_data + hold
- [x] `pnpm run verify` green

### Slice R3 — Session pain in posture

- [x] Today’s session pain Yes → gate hold + `session_pain_active`
- [x] Mild → advisory code only
- [x] `pnpm run verify` green

### Slice R4 — Delegate `recovery-signals.js`

- [x] Remove duplicate mapping — call `RecoveryEngine.recoveryPosture`
- [x] Export thin `recoverySignal()` for adapter compatibility
- [x] `pnpm run verify` green

### Slice R5 — Script load order

- [x] `recovery-engine.js` before `recovery-signals.js` before `strength-adapter.js`
- [x] `pnpm run verify` green

### Slice R6 — Home/Sleep posture hint (optional copy)

- [x] One-liner when gate hold/caution — informational only
- [x] **No** training-start block
- [x] `pnpm run verify` green

### Slice R7 — Progress audit plain-English

- [x] Reason strings can reference posture / gate
- [x] `pnpm run verify` green

### Slice R8 — `recovery-engine.smoke.mjs`

- [x] Table-driven worst-of cases (≥12)
- [x] In `check:strength-progression`
- [x] `pnpm run verify` green

### Slice R9 — Silent wire regression

- [x] `strength-progression.smoke.mjs` still green after delegation
- [x] `pnpm run verify` green

### Slice R10 — Phase 7 handoff

- [x] Spec exit criteria checked
- [x] Delivery load ledger explicitly still deferred
- [x] `pnpm run verify` green

---

# Phase 8 — Four-system Coordinator

**Spec:** `docs/superpowers/specs/2026-08-24-four-system-coordinator-design.md`  
**Shipped:** PR #36  
**Exit:** Pure `planCoordinator` + weekly read-only sheet; strength silent apply unchanged.

### Slice C1 — Pure `coordinator.ts`

- [x] `planCoordinator(receipts, ctx)` in `@hybrid/strength-engine`
- [x] Colocated `coordinator.test.ts`
- [x] Export via bundle `HybridStrength.Coordinator`
- [x] `pnpm run verify` green

### Slice C2 — `collectReceipts` adapter

- [x] Strength: audit window + session pain flags
- [x] Conditioning: weekly zone seconds + session count
- [x] Recovery: daily posture array
- [x] Nutrition: days logged (optional)
- [x] Use `global.*` refs (vm-safe)
- [x] `pnpm run verify` green

### Slice C3 — `planWeek(state, endDate, days)`

- [x] Calls pure `planCoordinator` with collected receipts
- [x] Returns `CoordinatorReceipt` or null if bundle missing
- [x] `pnpm run verify` green

### Slice C4 — `weeklySheetHtml(receipt)`

- [x] Read-only scrollable summary
- [x] Domain · kind · message per item
- [x] Done button closes sheet
- [x] `pnpm run verify` green

### Slice C5 — Home/Sleep “This week” entry

- [x] `openWeeklyReview()` button
- [x] Sheet uses `CoordinatorAdapter.weeklySheetHtml`
- [x] **No** accept/decline per item
- [x] `pnpm run verify` green

### Slice C6 — Strength authority preserved

- [x] Coordinator never calls `decideProgression` directly
- [x] Silent apply path unchanged and authoritative for load bumps
- [x] `pnpm run verify` green

### Slice C7 — Script load order

- [x] `coordinator-adapter.js` after engine + recovery + strength adapters
- [x] Bump SW cache
- [x] `pnpm run verify` green

### Slice C8 — `coordinator.smoke.mjs`

- [x] Bundle exports `Coordinator.planCoordinator`
- [x] Headless `planWeek` returns headline
- [x] In `check:strength-progression`
- [x] `pnpm run verify` green

### Slice C9 — Cross-domain migration check

- [x] No Postgres migration; receipts from local HTML state only
- [x] `check:migrations` green

### Slice C10 — Phase 8 handoff

- [x] Spec exit criteria checked
- [x] Roadmap build order complete (phases 1–8)
- [x] `pnpm run verify` green

---

## Final verify gate (all phases)

- [x] `pnpm run typecheck`
- [x] `pnpm run test` (strength-engine coordinator tests included)
- [x] `pnpm run check:migrations`
- [x] `pnpm run check:strength-volume`
- [x] `pnpm run check:strength-progression` (7 smokes)
- [x] `pnpm run check:hybrid-proxy`
- [x] Full `pnpm run verify`

## What this plan does **not** cover

- Phase B coach authoring UI
- Expo / second athlete shell
- Delivery load / heat ledger (recovery v2)
- Coordinator silent-apply actions beyond copy (future)
- AI progression decider (adaptive engine v2)

---

# Phase 9 — Post-ship gap closure (≤10 slices)

**Scope:** Close gaps found after PR #36 monolithic ship — wire missing pull paths, harden smokes, align verify with specs.

### Slice 9.1 — Slice plan doc committed

- [x] This file exists with ≤10 slices per phase 1–8
- [x] Roadmap references this plan

### Slice 9.2 — Strength sync pull on boot

- [x] `StrengthSync.bootstrap()` reconciles when signed in on app load
- [x] Merged state persisted via `save('strength-sync-pull')`
- [x] `pnpm run verify` green

### Slice 9.3 — Strength sync pull on Settings open

- [x] Settings screen triggers bootstrap (same as nutrition reconcile on Nutrition open)
- [x] `pnpm run verify` green

### Slice 9.4 — Fix strength-sync global refs

- [x] `global.StrengthAdapter` not bare `StrengthAdapter` (vm-safe)
- [x] `pnpm run verify` green

### Slice 9.5 — `check:strength-sync` in verify + CI

- [x] Separate script in `package.json` verify
- [x] CI workflow step matches
- [x] `pnpm run verify` green

### Slice 9.6 — Recovery worst-of matrix smoke (≥12 cases)

- [x] Expand `recovery-engine.smoke.mjs` table-driven cases
- [x] `pnpm run verify` green

### Slice 9.7 — Coordinator fixture smoke

- [x] Golden-style receipt → expected headline fragment in smoke or vitest
- [x] `pnpm run verify` green

### Slice 9.8 — Sync preview copies + cache bump

- [x] `bash apps/mobile/sync-hybrid-html.sh`
- [x] Bump `LOCAL_BUILD` + SW `CACHE` if HTML touched
- [x] `check:hybrid-proxy` green

### Slice 9.9 — Phase 9 verify gate

- [x] Full `pnpm run verify` green

### Slice 9.10 — Phase 9 handoff

- [x] Slice 9 checkboxes updated
- [x] PR updated

## References (phase 9)

- PR #36 gap audit — sync pull not wired on boot
- `docs/superpowers/specs/2026-08-24-strength-cloud-sync-design.md` — pull on load
- `docs/superpowers/specs/2026-08-24-recovery-engine-design.md` — ≥12 worst-of cases

## References (full plan)

- `docs/superpowers/specs/2026-08-24-hybrid-athlete-roadmap-design.md`
- `docs/superpowers/plans/2026-08-23-engine-import-slices.md` — format precedent
- PR #35 (volume), PR #36 (phases 2–8)
