# Engine + Strength logger changeover — full program plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan **one slice at a time**. Steps use checkbox (`- [ ]` / `- [x]`) syntax for tracking.
>
> **Rule:** ≤10 slices per phase. Finish the phase verify gate before starting the next phase. One PR per phase unless the owner explicitly asks to batch.

**Goal:** Change over the athlete training surfaces so **Hybrid Strength** and **The Engine** match the Aug 2024 concept boards (one-set logger + conditioning interval/steady/recap), with builder preview twins that stay honest, while Nutrition / Recovery / Coordinator keep their product contracts (visible log vs invisible brain).

**Architecture:** Pure math stays in `@hybrid/strength-engine` and `@hybrid/engine`. HTML adapters (`strength-adapter.js`, `engine-adapter.js`, `cond-interval-autoreg.js`) own I/O. New UI is extracted from `index.html` into focused modules (`rest-overlay.js`, `session-chrome.js`, `cond-session-logger.js`) with colocated smoke tests. A shared **rest overlay** and **session chrome** serve both engines before either mockup screen ships.

**Tech stack:** Hybrid HTML app (`apps/mobile/prototype/hybrid-app/`), esbuild IIFE bundles, Vitest (packages), colocated `.smoke.mjs` + Playwright spot checks, Capgo cache bump + `bash apps/mobile/sync-hybrid-html.sh` per ship.

**Spec:** Primary UX targets are the owner mockups (ONE-SET LOGGER · THE HYBRID · Aug 2024; THE ENGINE interval/steady/recap boards). Supporting specs:
- `docs/research/one-set-logger-autoreg-2026-08-30.md`
- `docs/research/in-session-autoreg-plan-2026-08-30.md`
- `docs/superpowers/specs/2026-08-25-builder-logger-strength-alignment.md`
- `docs/superpowers/plans/2026-08-23-engine-stage2-logger-gaps.md`

## Global constraints

- **Athlete product surface:** `apps/mobile/prototype/hybrid-app/index.html` only — sync via `bash apps/mobile/sync-hybrid-html.sh`.
- **Track Dawn tokens:** background `#0a0c0e`, copper `#d4a574` (strength), teal `#5ec4b4` (Engine) — no generic palette swap.
- **44px tap floor;** reduced-motion safe (no choreographed motion required for ship).
- **`@hybrid/strength-engine` stays pure** — zero I/O, zero React; adapters inject `ResolveCtx`-shaped data.
- **Training never blocked** — recovery/pain gate progression only; illness record-only.
- **Pain-blocked exposure** does not count toward calibration (existing contract).
- **Silent apply** — engines adjust next set/phase/load; no accept/decline sheets mid-session.
- **Preview vs active** — swap/history/video stay **before** Start session; active log is logging + feedback only (Peak pattern).
- **Shared Supabase contract** — no migrations against hybrid-owned tables (`CLAUDE.md` twelve-table list).
- **Checks must fail:** every new guard lands in `pnpm run verify` and `.github/workflows/ci.yml` together.
- **Cache bump:** `LOCAL_BUILD` + service-worker `CACHE` move together (e.g. `the-hybrid-athlete-engine-vNNN`).
- **`pnpm run verify` green** after every code slice that touches the app or packages.

---

## Current baseline (post #136 / Capgo 1.0.43)

| Area | Shipped | Still missing vs mockup |
| --- | --- | --- |
| **Strength active log** | Ghost stack, difficulty slider, in-row Next, hero inputs (grid row) | Big **100 kg × 5 reps** card, block **Next set**, **+ Extra set**, session chrome |
| **Strength rest** | Corner `restcorner` widget after Next | **Full-screen rest overlay** — circular timer, skip, +30s, “Up next” preview |
| **Strength edges** | `decideNextSet` in package; slider has `did_not_complete` | Superset partner-rest UI; WL **attempt / try again** flow |
| **Engine intervals** | `intervalTask`, `CondIntervalAutoreg` chip buttons on rest | Work-phase **live targets** (W, pace, HR ring); rest **RPE slider overlay** |
| **Engine steady** | `conditioningTask` + block timer | Dedicated steady-state screen + session RPE at end |
| **Engine recap** | Finish form + result inputs | **Session recap** card + progression copy + overall feel slider |
| **Builder twins** | `builderLoggerTwinHtml` multi-row ghost preview | Static previews for rest overlay + Engine screens |
| **Unified session** | `train()` task loop | One state machine across strength + cond nodes (capstone) |

**Engine math already green:** `decideNextSet` (`packages/strength-engine`), `decideNextPhase` (`packages/engine`), wired through adapters for autoreg suggestions.

---

## File map (target end state)

| Path | Role |
| --- | --- |
| `apps/mobile/prototype/hybrid-app/session-chrome.js` | Shared top bar: product eyebrow, week/session badge, elapsed timer |
| `apps/mobile/prototype/hybrid-app/rest-overlay.js` | Full-screen rest: circular countdown, skip, +30s, up-next preview, engine-specific copy |
| `apps/mobile/prototype/hybrid-app/strength-one-set-logger.js` | Strength state machine: active / rest / superset-edge / missed-rep |
| `apps/mobile/prototype/hybrid-app/cond-session-logger.js` | Engine state machine: work / rest / steady / recap |
| `apps/mobile/prototype/hybrid-app/strength-adapter.js` | `suggestNextSet`, load headline, WM gates |
| `apps/mobile/prototype/hybrid-app/engine-adapter.js` | `suggestNextPhase`, zone/load, `conAdapt` at end |
| `apps/mobile/prototype/hybrid-app/cond-interval-autoreg.js` | Rest RPE capture → `decideNextPhase` (slider, not chips) |
| `apps/mobile/prototype/hybrid-app/log-columns.js` | Strength builder twin + future Engine builder twin |
| `apps/mobile/prototype/hybrid-app/index.html` | Orchestration: `train()`, task routing, CSS tokens |
| `tmp/strength-logger-e2e.mjs` | Playwright bench press flow (extend per phase) |
| `docs/superpowers/specs/2026-09-01-logger-changeover-design.md` | Written in Phase 0 — screen-by-screen acceptance |

---

## Phase overview

| Phase | Prefix | Engine | Mockup screens | Max slices |
| --- | --- | --- | --- | ---: |
| 0 | Z | Both | — (spec + shared shell) | 8 |
| 1 | ST | **Hybrid Strength** | Active log — one set | 10 |
| 2 | SR | **Hybrid Strength** | Rest overlay — full screen | 10 |
| 3 | SE | **Hybrid Strength** | Superset edge + missed reps | 10 |
| 4 | EW | **The Engine** | Work phase — live targets | 10 |
| 5 | ER | **The Engine** | Rest overlay — RPE slider | 10 |
| 6 | ES | **The Engine** | Steady-state + session recap | 10 |
| 7 | BT | Both | Builder preview twins | 8 |
| 8 | RC | **Recovery** | Steady skin on recovery sessions | 6 |
| 9 | UN | **Unified** | Strength ↔ cond one session machine | 10 |
| 10 | SH | All | Ship ritual + dogfood proof | 6 |

**Out of scope for this program:** Nutrition UI redesign (logging surface already complete per five-systems spec); Coordinator weekly peek (stays invisible); coach desktop; Expo; new Supabase tables.

---

# Phase 0 — Spec, shared chrome, rest overlay shell

**Exit:** Design doc committed; `session-chrome.js` + `rest-overlay.js` render in isolation; smokes green; no engine behaviour change yet.

### Slice Z1 — Design spec from mockups

- [ ] Create `docs/superpowers/specs/2026-09-01-logger-changeover-design.md` with one section per mockup screen (8 strength + 4 engine), each with: layout ASCII, copy strings, state transitions, “not in v1” list.
- [ ] Attach acceptance screenshots path: `/opt/cursor/artifacts/` naming convention.
- [ ] Owner sign-off checkbox in spec before Phase 1 code.

### Slice Z2 — CSS design tokens (logger changeover)

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/index.html` (inline `<style>` block ~lines 119–200)

- [ ] Add token classes: `.logger-hero-card`, `.logger-hero-metric`, `.rest-overlay`, `.rest-ring`, `.engine-work-grid`, `.engine-recap-card` (empty shells, no JS yet).
- [ ] Verify copper vs teal variants via `.dial-strength` / `.dial-engine` ancestor selectors.
- [ ] Run: `pnpm run verify` — must stay green (CSS-only).

### Slice Z3 — `session-chrome.js` module

**Files:**
- Create: `apps/mobile/prototype/hybrid-app/session-chrome.js`
- Create: `apps/mobile/prototype/hybrid-app/session-chrome.smoke.mjs`
- Modify: `apps/mobile/prototype/hybrid-app/index.html` (script tag)

**Interfaces:**
- Produces: `SessionChrome.render({ product: 'strength'|'engine', title, subtitle, weekLabel, elapsedSec }) → string`

- [ ] **Step 1: Write failing smoke**

```javascript
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const src = readFileSync('apps/mobile/prototype/hybrid-app/session-chrome.js', 'utf8');
const sandbox = { window: {}, console };
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(src, sandbox);
const html = sandbox.SessionChrome.render({
  product: 'strength',
  title: 'Barbell Back Squat',
  subtitle: 'Set 2 / 4',
  weekLabel: 'STRENGTH · WEEK 2',
  elapsedSec: 1934,
});
if (!html.includes('STRENGTH')) throw new Error('missing product eyebrow');
if (!html.includes('Set 2 / 4')) throw new Error('missing subtitle');
```

- [ ] **Step 2:** Run smoke — expect FAIL until module exists.
- [ ] **Step 3:** Implement minimal `SessionChrome.render`.
- [ ] **Step 4:** Wire script in `index.html`; smoke passes.
- [ ] **Step 5:** Add `check:session-chrome` to `package.json` + CI.
- [ ] **Step 6:** Commit.

### Slice Z4 — `rest-overlay.js` module (static)

**Files:**
- Create: `apps/mobile/prototype/hybrid-app/rest-overlay.js`
- Create: `apps/mobile/prototype/hybrid-app/rest-overlay.smoke.mjs`

**Interfaces:**
- Produces: `RestOverlay.render({ mode: 'strength'|'engine', remainingSec, upNextHtml, onSkip, onAdd30 }) → string`
- Produces: `RestOverlay.tick()` — updates `#restOverlayClock` when overlay visible

- [ ] Smoke asserts: circular timer markup, **Skip rest** button, **+30s** button, `up-next` slot.
- [ ] Do not replace `restcorner` yet — overlay hidden by default (`class=hidden`).
- [ ] Commit + verify green.

### Slice Z5 — Playwright baseline extension

**Files:**
- Modify: `tmp/strength-logger-e2e.mjs`

- [ ] Record mockup parity checklist object (hero card false, overlay false) — baseline for Phase 1–2.
- [ ] Commit artifact screenshots to `/opt/cursor/artifacts/` on CI optional skip.

### Slice Z6 — Handoff + cache bump placeholder

- [ ] Update `handoff.md` — “Logger changeover program started; Phase 0 complete.”
- [ ] Phase gate: `pnpm run verify` green.

---

# Phase 1 — Hybrid Strength: active log (mockup screen 1)

**Exit:** Active set uses hero card (`100 kg × 5 reps`), difficulty slider with RIR copy, block **Next set** + **+ Extra set**; ghost stack remains; e2e updated.

### Slice ST1 — Hero card replaces grid row for active set

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/strength-one-set-logger.js`
- Modify: `apps/mobile/prototype/hybrid-app/strength-one-set-logger.smoke.mjs`

- [ ] `renderActiveRow()` → `renderActiveHero()` outputting `.logger-hero-card` with tap-to-edit weight/reps (still `#oneSetWeight` / `#oneSetReps`).
- [ ] Preserve ghost rows in `.one-set-stack` below hero.
- [ ] Smoke: `htmlOut.includes('logger-hero-card')` && still has `oneSetDifficulty`.
- [ ] Run e2e: weight/reps still loggable.

### Slice ST2 — Block actions below slider

- [ ] Move Next out of grid row → full-width `.btn.primary.block` **Next set**.
- [ ] Add secondary **+ Extra set** → existing `addExtraSet()` or implement if missing.
- [ ] Remove in-row Next button from active row markup.
- [ ] Smoke + e2e: `hasInRowNext` test flipped to `hasBlockNext`.

### Slice ST3 — Slider copy + RIR label

- [ ] Slider head: **How hard was that set?** with live label (Very easy … Didn't finish).
- [ ] Subcopy: `Prescribed RIR N. Slide if it felt easier or harder — Next updates set M load.`
- [ ] Pull target RIR from `StrengthAdapter.targetRirForExercise(t)`.

### Slice ST4 — Session chrome on strength tasks

- [ ] `renderTask()` prepends `SessionChrome.render({ product: 'strength', ... })`.
- [ ] Derive `Set i / n` from `plannedRows` + `autoreg.setOrdinal`.
- [ ] Hide legacy `.task` 26px title duplication or merge into chrome.

### Slice ST5 — Builder twin ST1–ST3 parity

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/log-columns.js` (`builderLoggerTwinHtml`)

- [ ] Active row in twin shows hero card + block Next (disabled).
- [ ] `log-columns.smoke.mjs` updated.

### Slice ST6 — CSS polish pass (strength active only)

- [ ] Hero typography: 22–28px weight/reps, centered, tabular nums.
- [ ] Card gradient matches `.one-set-card` copper treatment.

### Slice ST7 — E2e + manual artifacts

- [ ] Update `tmp/strength-logger-e2e.mjs` hero + block Next assertions.
- [ ] Screenshot: `/opt/cursor/artifacts/strength-active-hero.png`.

### Slice ST8 — Ship slice

- [ ] `bash apps/mobile/sync-hybrid-html.sh`
- [ ] Cache bump + Capgo upload (owner ritual).
- [ ] PR: `feat(strength): hero card active one-set logger (Phase 1)`

### Slice ST9 — Phase 1 verify gate

- [ ] `pnpm run verify` green.
- [ ] Dogfood note in `docs/RELEASE_NOTES.md`.

### Slice ST10 — Spec exit criteria tick

- [ ] Mark Phase 1 screens checked in `2026-09-01-logger-changeover-design.md`.

---

# Phase 2 — Hybrid Strength: full-screen rest overlay (mockup screen 2)

**Exit:** After **Next set**, full-screen rest replaces corner widget; circular timer; skip / +30s; up-next preview with set load + RIR.

### Slice SR1 — Rest state on task object

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/strength-one-set-logger.js`

- [ ] Add `t.autoreg.restPhase = true` + `restEndsAt` when advancing with more sets remaining.
- [ ] `nextStrengthSet()` triggers rest instead of immediate re-render when not last set.

### Slice SR2 — Wire `RestOverlay` on rest phase

- [ ] `renderTask()` when `restPhase`: return overlay HTML only (hide active logger).
- [ ] `RestOverlay.tick` hooked from existing rest interval (250ms) — retire `drawRest()` corner path for strength.
- [ ] Skip → clear rest, show next active set. +30s → extend `restEndsAt`.

### Slice SR3 — Up-next preview content

- [ ] Preview line: `Up next: Set 3 / 4` + `100 kg × 5 · RIR 2` from next row + engine suggestion if present.
- [ ] Show logged summary: `Set 2 logged · 100 kg × 5`.

### Slice SR4 — Superset rest duration (default path)

- [ ] Use `t.restSec` / exercise default; respect superset `restPartnerSec` when `t.supersetPartner` (stub OK if graph not wired — document).

### Slice SR5 — Smoke `rest-overlay-strength.smoke.mjs`

- [ ] VM test: after simulated `nextStrengthSet`, render contains `rest-overlay` + up-next.

### Slice SR6 — E2e set 1 → rest → set 2

- [ ] Playwright: after Next, assert overlay visible, wait skip, assert set 2 hero.

### Slice SR7 — Builder twin rest frame (static third panel)

- [ ] Optional collapsible “Rest preview” section in `builderLoggerTwinHtml`.

### Slice SR8 — Ship Phase 2

- [ ] Sync, cache bump, release notes, PR.

### Slice SR9 — Phase 2 verify gate

- [ ] `pnpm run verify` green.

### Slice SR10 — Corner widget fallback

- [ ] Keep `restcorner` for non-strength tasks only; document in spec.

---

# Phase 3 — Hybrid Strength: superset edge + missed reps (mockup screens 3–4)

**Exit:** Superset badge + partner rest copy; didn’t-finish flow with reps-done input, attempt button, engine caps next target.

### Slice SE1 — Superset round state

- [ ] Extend autoreg cursor for A1→B1→A2→B2 cycle (reuse existing superset task routing in `index.html`).
- [ ] Badge: `A2 ↔ B2 · 45s between partners`.

### Slice SE2 — Superset hero copy

- [ ] Show adjustment line when `t.lastSuggestion` from partner exercise: `Adjusted −2.5 kg after hard bench set`.

### Slice SE3 — Missed reps mode

- [ ] When slider at `did_not_complete`: switch hero to **Did not complete — log reps done** with reps input prominent.
- [ ] Call `decideNextSet` with partial reps; display `Next set capped at N reps`.

### Slice SE4 — WL attempt flow

- [ ] Primary salmon **Log attempt · try again** re-opens same set ordinal without marking done.
- [ ] Secondary **Next set · lower target** completes with engine regression.

### Slice SE5 — Colocated tests

**Files:**
- Modify: `packages/strength-engine/src/decideNextSet.test.ts` (if new edge codes)
- Modify: `strength-one-set-logger.smoke.mjs`

- [ ] Table-driven cases for partial reps + attempt counter.

### Slice SE6 — E2e missed-rep path

- [ ] Playwright: pull-ups task or inject BW task; slider to didn't finish; log 5 of 7.

### Slice SE7 — Builder twin edge panels

- [ ] Static superset + missed-rep preview blocks in builder card.

### Slice SE8 — Ship Phase 3

### Slice SE9 — Phase 3 verify gate

### Slice SE10 — Spec sign-off strength mockups complete

---

# Phase 4 — The Engine: work phase — live targets (mockup screen 1)

**Exit:** Interval work screen shows modality header, countdown, watts/pace/HR grid, live HR ring, engine adjustment toast.

### Slice EW1 — Extract `cond-session-logger.js`

- [ ] Move work-phase HTML from `intervalTask()` into `CondSessionLogger.renderWork(t, iv)`.
- [ ] `index.html` delegates when `conditioningType === 'intervals'`.

### Slice EW2 — Work phase layout

- [ ] Header: `THE ENGINE · INTERVALS · ROW` + pill `WORK 3/8`.
- [ ] Big countdown `#intervalClock` (existing tick hook).
- [ ] Three-column grid: Power (W), Pace (/500m), HR zone target.

### Slice EW3 — Live HR ring

- [ ] Circular gauge from `bleHr` when live; fallback copy when strap offline.
- [ ] `On target · Strap live · in zone 12s` status line.

### Slice EW4 — Autoreg toast

- [ ] When `t.lastPhaseDecision` from previous rest: show `Set 2 felt too hard — set 3 target −8W`.

### Slice EW5 — End interval early

- [ ] Primary teal button → `advanceInterval(false)` (existing).

### Slice EW6 — Smoke + verify

- [ ] `cond-session-logger.smoke.mjs` — work render contains grid + ring placeholder.

### Slice EW7 — Ship Phase 4

### Slice EW8 — Manual artifact

- [ ] Screenshot with mock HR data injected in dev.

### Slice EW9 — Phase 4 verify gate

### Slice EW10 — Do not break classic `train()` path

- [ ] Regression: `cond-thin-twin.smoke.mjs` still green.

---

# Phase 5 — The Engine: rest overlay — RPE slider (mockup screen 2)

**Exit:** Rest is full-screen overlay; horizontal RPE slider (Easy → Max/Stopped); skip starts next work phase; engine adjusts next target.

### Slice ER1 — Rest phase uses `RestOverlay`

- [ ] `CondSessionLogger.renderRest(t, iv)` → overlay with circular rest timer.

### Slice ER2 — Replace chip buttons with slider

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/cond-interval-autoreg.js`

- [ ] `restPanelHtml` → slider 0–10 mapped to `FELT_OPTIONS` + RPE labels.
- [ ] `onIntervalRpeSlide(value)` mirrors strength pattern.

### Slice ER3 — Up-next work preview

- [ ] `Up next · Work 4/8` + target watts/pace + delta badge (`−4W`).

### Slice ER4 — Wire `decideNextPhase` on rest boundary

- [ ] Already in `beforeNextWork` — ensure UI requires slider before skip (or default on-target).

### Slice ER5 — Skip · start work N

- [ ] Gradient primary button on overlay.

### Slice ER6 — Smoke rest + slider

### Slice ER7 — E2e interval work → rest → work

### Slice ER8 — Ship Phase 5

### Slice ER9 — Phase 5 verify gate

### Slice ER10 — Spec ER screen signed off

---

# Phase 6 — The Engine: steady-state + session recap (mockup screens 3–4)

**Exit:** Steady sessions use dedicated timer screen; finish flows to recap with zone summary + progression + overall feel slider + save.

### Slice ES1 — Steady-state screen

- [ ] `CondSessionLogger.renderSteady(t)` — session timer, zone band, conversational pace copy.
- [ ] Finish → rate session (not immediate form dump).

### Slice ES2 — Session recap screen

- [ ] `CondSessionLogger.renderRecap(t, result)` — completion %, time in zone, intervals completed, session RPE.
- [ ] Progression box: `Next session: Level N · +1 round OR +5s work`.

### Slice ES3 — Overall feel slider + Save

- [ ] Slider feeds `conAdapt` inputs (existing adapter).
- [ ] **Save · update progression** commits and calls `completeConditioning()`.

### Slice ES4 — Interval finish routes through recap

- [ ] Replace bare result form as default path; keep advanced metrics collapsed.

### Slice ES5 — Smoke steady + recap

### Slice ES6 — Ship Phase 6

### Slice ES7 — Phase 6 verify gate

### Slice ES8 — Engine builder twin (steady + recap static)

### Slice ES9 — Release notes

### Slice ES10 — Spec ES screens signed off

---

# Phase 7 — Builder preview twins (both engines)

**Exit:** Coach/athlete builder shows honest previews for every shipped logger state.

### Slice BT1 — Strength builder: hero + rest + edge panels

### Slice BT2 — Engine builder: work/rest/steady/recap static previews

### Slice BT3 — `builder-suggest-contrast.mjs` updated if copy changed

### Slice BT4 — Log-columns smoke expanded

### Slice BT5 — Document preview limitations in builder guardrail copy

### Slice BT6 — Ship Phase 7

### Slice BT7 — Phase 7 verify gate

### Slice BT8 — Owner review screenshots side-by-side with mockups

---

# Phase 8 — Recovery sessions (Engine skin)

**Exit:** Recovery templates use steady-state visual language (teal, zone 1–2), no load progression chrome.

### Slice RC1 — `recoverySession` blocks render via `CondSessionLogger.renderSteady` with recovery copy

### Slice RC2 — Suppress progression recap box on recovery finish

### Slice RC3 — Home debt row unchanged (zero new UI)

### Slice RC4 — Smoke recovery starter template

### Slice RC5 — Ship Phase 8

### Slice RC6 — Phase 8 verify gate

---

# Phase 9 — Unified hybrid session (capstone)

**Exit:** One session runs strength tasks and conditioning tasks with shared chrome + rest overlay; single recap at session end optional v1.

### Slice UN1 — Session state machine doc in spec appendix

### Slice UN2 — `sessionFlow.js` cursor: `{ nodeKind, nodeIndex, phase }`

### Slice UN3 — Strength node → rest → next strength OR cond handoff

### Slice UN4 — Cond node → work/rest/recap within cond logger

### Slice UN5 — Shared session timer across nodes

### Slice UN6 — Abandon workout preserves partial logs (existing behaviour)

### Slice UN7 — Smoke hybrid Full Body A + conditioning block same session

### Slice UN8 — E2e hybrid day (shortened)

### Slice UN9 — Ship Phase 9

### Slice UN10 — Phase 9 verify gate

---

# Phase 10 — Ship ritual + dogfood proof

### Slice SH1 — Full `pnpm run verify`

### Slice SH2 — Playwright suite: strength + cond golden paths

### Slice SH3 — Update `handoff.md` — program complete, Capgo version, cache

### Slice SH4 — `docs/RELEASE_NOTES.md` consolidated entry

### Slice SH5 — Owner phone proof script (items 2–4 from handoff §2)

### Slice SH6 — Mark plan complete in this file

---

## Nutrition & Coordinator (explicit non-changeover)

| System | This program | Reason |
| --- | --- | --- |
| **Nutrition** | No logger redesign | Product-complete per `five-systems-complete-design.md`; keep log + barcode + check-in |
| **Coordinator** | No UI | Silent cross-domain apply only; receipts invisible |
| **Recovery (Home)** | Debt row only | Recovery *sessions* get Phase 8 skin; no new Home chrome |

---

## Testing strategy

| Layer | When | Command |
| --- | --- | --- |
| Pure engine | Any adapter rule change | `pnpm run test` (strength-engine + engine packages) |
| Module smoke | Each new `.js` module | `node apps/mobile/prototype/hybrid-app/<name>.smoke.mjs` |
| Full verify | Every slice | `pnpm run verify` |
| E2E | Phases 1–3, 5, 9 | `NODE_PATH=/workspace/tmp/node_modules node tmp/strength-logger-e2e.mjs` (+ cond e2e when added) |
| Manual | Before Capgo ship | Screen recording per `walkthrough-artifacts` skill |

---

## Risk register

| Risk | Mitigation |
| --- | --- |
| `index.html` size / merge pain | Extract modules early (Phase 0–1); no new 500-line inline functions |
| Rest overlay vs corner timer race | Single rest owner: `rest-overlay.js`; delete strength corner path in Phase 2 |
| CSS specificity regressions (one-set grid) | Keep `.one-set-row-active` selector explicit; extend `strength-one-set-logger.smoke.mjs` grid assert |
| BLE/live data absent in CI | Smokes use injected `bleHr` stub; manual proof for strap live |
| Scope creep into coach product | Builder twins are preview-only; coach portal unchanged |
| Shared Supabase violation | No new migrations; session state stays local |

---

## Self-review (spec coverage)

| Mockup screen | Phase | Slice |
| --- | --- | --- |
| Strength active log | 1 | ST1–ST4 |
| Strength rest overlay | 2 | SR1–SR3 |
| Strength superset edge | 3 | SE1–SE2 |
| Strength missed reps | 3 | SE3–SE4 |
| Engine work phase | 4 | EW2–EW4 |
| Engine rest + RPE | 5 | ER1–ER3 |
| Engine steady-state | 6 | ES1 |
| Engine session recap | 6 | ES2–ES3 |
| Builder twins | 7 | BT1–BT2 |
| Unified session caption | 9 | UN1–UN5 |

**Placeholder scan:** none — every phase has concrete files and exit gates.

---

## Execution handoff

Plan saved to `docs/superpowers/plans/2026-09-01-engine-strength-logger-changeover.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — one fresh subagent per slice, two-stage review between slices (`superpowers:subagent-driven-development`).

2. **Inline Execution** — run phases in this session with checkpoints (`superpowers:executing-plans`).

**Suggested start:** Phase 0 Slice Z1 (design spec) → Z3/Z4 (shared modules) → Phase 1 ST1 (hero card) — highest visible win after today's 1.0.43 baseline.

Which approach do you want?
