# Five systems complete — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan **one phase at a time**. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Rule:** Finish each phase’s verify gate before starting the next. ≤10 tasks per phase. Never batch all five phases in one PR unless the owner explicitly asks.

**Goal:** Wire Strength, Nutrition, Conditioning, Recovery, and Coordinator so each engine is product-complete for solo dogfood — **invisible brains, visible logging only**.

**Architecture:** Engines stay pure (`@hybrid/strength-engine`, `@hybrid/engine`, `@hybrid/nutrition-*`). HTML adapters own I/O and silent apply. Vertical build order: Strength → Nutrition → Conditioning → Recovery → Coordinator.

**Tech Stack:** TypeScript packages (Vitest), esbuild IIFE bundles, `apps/mobile/prototype/hybrid-app/` HTML app, smoke `.mjs` in `pnpm run verify`.

**Spec:** `docs/superpowers/specs/2026-08-24-five-systems-complete-design.md`

## Global Constraints

- Brains **invisible** — silent apply; no Recovery dial; **no Coordinator weekly peek** (`openWeeklyReview` in `index.html` must go).
- **Keep** `NutritionUI.openWeeklyReview` — that is the MacroFactor adaptive check-in, not Coordinator.
- **No** recipes UI; **No** expenditure charts.
- Conditioning progression = engine `conAdapt` (earned) — not cross-engine vote.
- Training **never blocked**; pain Yes holds strength bumps only.
- Soft volume guides only; no hard volume blocks.
- `@hybrid/strength-engine` stays pure (zero I/O).
- Shared Supabase: no migrations against hybrid-owned tables (`CLAUDE.md`).
- Bump `LOCAL_BUILD` + service-worker `CACHE` together when shipping HTML.
- Run `bash apps/mobile/sync-hybrid-html.sh` when prototype assets change.
- `pnpm run verify` must stay green after every code task that touches runtime.

## File map

| Path | Role |
| --- | --- |
| `packages/strength-engine/src/resolve.ts` | `%WM` / literal / LWP resolve (pure) |
| `packages/strength-engine/src/e1rm.ts` | Engine e1RM |
| `packages/strength-engine/src/load.ts` | `sessionLoad` tonnage |
| `packages/strength-engine/src/rounding.ts` | Equipment rounding |
| `apps/mobile/prototype/hybrid-app/strength-entry.ts` | Browser exports — add Resolve, E1rm, Load |
| `apps/mobile/prototype/hybrid-app/build-strength.sh` | Rebuild `strength-bundle.js` |
| `apps/mobile/prototype/hybrid-app/strength-adapter.js` | HTML ↔ strength engine |
| `apps/mobile/prototype/hybrid-app/strength-sync.js` | Cloud snapshot — extend for set rows |
| `apps/mobile/prototype/hybrid-app/load-headline.js` | Combined load — drop tonnage/50 stub |
| `apps/mobile/prototype/hybrid-app/engine-adapter.js` | Cond zones / prescription / adapt |
| `apps/mobile/prototype/hybrid-app/recovery-engine.js` | Pure recovery posture |
| `apps/mobile/prototype/hybrid-app/recovery-signals.js` | Thin gate wrapper |
| `apps/mobile/prototype/hybrid-app/coordinator-adapter.js` | Silent apply only |
| `apps/mobile/prototype/hybrid-app/nutrition-ui.js` | Day-status wiring (keep check-in UI) |
| `apps/mobile/prototype/hybrid-app/index.html` | Log surfaces; remove Coordinator peek |
| `apps/mobile/prototype/hybrid-app/service-worker.js` | CACHE bump |
| `apps/mobile/sync-hybrid-html.sh` | Sync preview + Cap webDir |

## Slice numbering

| Phase | Prefix | Max tasks |
| --- | --- | ---: |
| 1 Strength | S1–S10 | 10 |
| 2 Nutrition | N1–N6 | 6 |
| 3 Conditioning | E1–E8 | 8 |
| 4 Recovery | R1–R6 | 6 |
| 5 Coordinator | C1–C6 | 6 |

---

# Phase 1 — Strength complete

**Exit:** `%WM` resolve on start; engine e1RM + sessionLoad wired; set rows in strength sync snapshot; verify green.

### Task S1 — Export Resolve / E1rm / Load from strength-entry

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/strength-entry.ts`
- Modify: `apps/mobile/prototype/hybrid-app/build-strength.sh` (run only)
- Test: `apps/mobile/prototype/hybrid-app/strength-resolve.smoke.mjs` (create)

**Interfaces:**
- Produces: `window.HybridStrength.Resolve.resolveTarget`, `HybridStrength.E1rm.e1rm`, `HybridStrength.Load.sessionLoad`, `HybridStrength.Rounding.roundLoadToEquipment`

- [x] **Step 1: Write failing smoke**

Create `strength-resolve.smoke.mjs` that loads the bundle and asserts:

```js
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { pathToFileURL } from 'url';
import vm from 'vm';

const require = createRequire(import.meta.url);
// After rebuild: bundle must expose Resolve + E1rm + Load
const code = readFileSync(new URL('./strength-bundle.js', import.meta.url), 'utf8');
const sandbox = { console, window: {} };
vm.runInNewContext(code + '\nthis.HybridStrength = HybridStrength;', sandbox);
const HS = sandbox.HybridStrength || sandbox.window.HybridStrength;
if (!HS?.Resolve?.resolveTarget) throw new Error('Resolve missing');
if (!HS?.E1rm?.e1rm) throw new Error('E1rm missing');
if (!HS?.Load?.sessionLoad) throw new Error('Load missing');
console.log('strength-resolve.smoke: ok');
```

- [x] **Step 2: Run smoke — expect FAIL** (`Resolve missing`)

Run: `node apps/mobile/prototype/hybrid-app/strength-resolve.smoke.mjs`

- [x] **Step 3: Add exports to `strength-entry.ts`**

```ts
export * as Resolve from '../../../../packages/strength-engine/src/resolve.ts';
export * as E1rm from '../../../../packages/strength-engine/src/e1rm.ts';
export * as Load from '../../../../packages/strength-engine/src/load.ts';
// keep existing Volume, Progression, Exposure, Performed, Pr, WorkingMax, Rounding, Coordinator
```

- [x] **Step 4: Rebuild + pass smoke**

```bash
bash apps/mobile/prototype/hybrid-app/build-strength.sh
node apps/mobile/prototype/hybrid-app/strength-resolve.smoke.mjs
```

- [x] **Step 5: Wire `check:strength-resolve` into `package.json` verify + `.github/workflows/ci.yml`**

- [x] **Step 6: Commit**

```bash
git add apps/mobile/prototype/hybrid-app/strength-entry.ts \
  apps/mobile/prototype/hybrid-app/strength-bundle.js \
  apps/mobile/prototype/hybrid-app/strength-resolve.smoke.mjs \
  package.json .github/workflows/ci.yml
git commit -m "feat(strength): export Resolve, E1rm, Load in browser bundle"
```

### Task S2 — Adapter: resolve `%WM` for a session task

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/strength-adapter.js`
- Test: extend `strength-resolve.smoke.mjs` or new `strength-adapter-resolve.smoke.mjs`

**Interfaces:**
- Consumes: `HybridStrength.Resolve.resolveTarget`, `HybridStrength.Rounding.roundLoadToEquipment`, working max from `state.strengthState.workingMaxEvents`
- Produces: `StrengthAdapter.resolveExerciseLoad(state, exercise, asOfDate) → { loadKg, unresolvedReason } | null`

HTML bridge (YAGNI — no full PrescribedTarget schema in UI yet):

```js
// exercise.loadExpr optional: { exprKind: 'pct_of_max', exprArg: 0.7 }
// OR reps string containing no load — leave weight blank for athlete
function resolveExerciseLoad(state, exercise, asOfDate) {
  if (!hasStrength() || !exercise || !exercise.loadExpr) return null;
  var HS = global.HybridStrength;
  var ctx = {
    athleteId: (state.meta && state.meta.ownerId) || 'local',
    scheduledDate: asOfDate,
    workingMaxAt: function (exId) { return currentAnchorLoad(state, exId); },
    lastPerformedLoad: function (_a, exId) { /* last completed row weight */ return null; },
    bodyweightAt: function () { return num(state.profile && state.profile.bodyweight) || null; },
  };
  var fakeEx = { id: exercise.exerciseId || exercise.id, equipment: exercise.equipment || 'barbell_kg', referenceMaxExerciseId: null };
  var t = {
    exprKind: exercise.loadExpr.exprKind,
    exprArg: exercise.loadExpr.exprArg,
    literalValue: null,
    rangeLo: null,
    rangeHi: null,
    exprRefExercise: exercise.loadExpr.exprRefExercise || null,
  };
  var r = HS.Resolve.resolveTarget(t, fakeEx, ctx);
  if (r.kind === 'scalar') return { loadKg: r.value, unresolvedReason: null };
  if (r.kind === 'unresolved') return { loadKg: null, unresolvedReason: r.reason };
  return null;
}
```

- [x] **Step 1: Failing smoke** — fixture WM 100kg + `loadExpr: { exprKind:'pct_of_max', exprArg:0.7 }` → `loadKg === 70` (or rounded)
- [x] **Step 2: Implement `resolveExerciseLoad` + export on `StrengthAdapter`
- [x] **Step 3: Smoke PASS**
- [x] **Step 4: Commit** `feat(strength): adapter resolveExerciseLoad for %WM`

### Task S3 — Builder: optional `%WM` load expression on lift sheet

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/index.html` (`exerciseSheet`, `saveExercise`)

- [x] **Step 1:** Add optional field on Add/Edit lift: “Load % of working max” (number 1–100). Empty = no `loadExpr` (current behavior).
- [x] **Step 2:** Persist `exercise.loadExpr = { exprKind:'pct_of_max', exprArg: pct/100 }` when set.
- [x] **Step 3:** Manual / smoke: save lift with 70% → draft JSON has `loadExpr`.
- [x] **Step 4:** Commit `feat(strength): optional %WM field on lift sheet`

### Task S4 — `startSession`: stamp resolved loads onto rows

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/index.html` (`startSession` / flatten path)
- Modify: `apps/mobile/prototype/hybrid-app/strength-adapter.js` (`applyLoadHintsToTasks` or sibling)

- [x] **Step 1:** When starting strength session, for each exercise with `loadExpr`, call `resolveExerciseLoad`; if resolved, prefill row `weight` (do not overwrite athlete-edited weights on resume).
- [x] **Step 2:** If unresolved `no_working_max`, leave weight blank (no invented load).
- [x] **Step 3:** Smoke or manual path documented in smoke comment.
- [x] **Step 4:** Commit `feat(strength): resolve %WM loads on session start`

### Task S5 — Engine e1RM on finish (replace inline formula)

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/index.html` (`e1rmValue` / `sessionE1rmList`)

- [x] **Step 1:** Change `e1rmValue(load, reps)` to call `HybridStrength.E1rm.e1rm(load, reps, 'brzycki')` when available; keep local fallback only if bundle missing.
- [x] **Step 2:** Existing finish summary still lists e1RMs.
- [x] **Step 3:** Commit `feat(strength): finish e1RM via engine`

### Task S6 — Session load via engine (kill tonnage/50 stub)

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/index.html` (`strengthLoad`)
- Modify: `apps/mobile/prototype/hybrid-app/load-headline.js` if it uses the stub

- [x] **Step 1:** Map completed rows → performed measurements shape expected by `Load.sessionLoad`.
- [x] **Step 2:** Use `tonnageKg` (and/or documented intensity) for strength channel of load headline — **not** `tonnage/50`.
- [x] **Step 3:** Update `load-headline.smoke.mjs` expectations if numbers change.
- [x] **Step 4:** Commit `feat(strength): sessionLoad replaces tonnage/50 stub`

### Task S7 — Strength sync: include completed set rows in snapshot

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/strength-sync.js` (`snapshotFromState`, `applySnapshot`, `mergeSnapshots`)
- Test: `apps/mobile/prototype/hybrid-app/strength-sync.smoke.mjs`

**Shape (local-first):**

```js
// Add to snapshot — YAGNI: last N completed sessions' strength rows only
performedSessions: (state.sessions || [])
  .filter(s => s.status === 'completed')
  .slice(-40)
  .map(s => ({
    id: s.id, date: s.date, name: s.name, completedAt: s.completedAt,
    tasks: (s.tasks || []).filter(t => t.kind === 'strength' || t.kind === 'superset'),
  }))
```

Merge rule: union by session `id`; prefer newer `completedAt`.

- [x] **Step 1:** Extend smoke — snapshot round-trip includes a fixture session with rows.
- [x] **Step 2:** Implement snapshot + merge.
- [x] **Step 3:** Bump `SNAPSHOT_VERSION` if needed for compatibility.
- [x] **Step 4:** Commit `feat(strength): sync completed set rows in domain snapshot`

### Task S8 — Progress history trust (list-only)

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/strength-adapter.js` (`progressExerciseDetail`)
- Modify: `apps/mobile/prototype/hybrid-app/index.html` (detail HTML if needed)

- [x] **Step 1:** Ensure per-lift detail shows last loads from completed sessions (already partial — fill gaps only).
- [x] **Step 2:** No charts.
- [x] **Step 3:** `check:strength-progression` still green.
- [x] **Step 4:** Commit `feat(strength): deepen Progress lift history lists`

### Task S9 — Phase 1 sync + cache bump

- [x] Run `bash apps/mobile/sync-hybrid-html.sh`
- [x] Bump `LOCAL_BUILD` + SW `CACHE` (next free after v59)
- [x] `pnpm run verify` green
- [x] Commit `chore: strength complete phase ship stamp`

### Task S10 — Phase 1 handoff

- [x] Update `handoff.md` top checkpoint: Strength resolve + sync sets shipped; brains still silent
- [x] Mark Phase 1 tasks `[x]` in this plan
- [x] Commit `docs: handoff strength phase complete`

---

# Phase 2 — Nutrition complete (math-only extras)

**Exit:** Day-status feeds adaptive check-in; no recipes/charts UI; verify green.

### Task N1 — Audit day-status → weeklyCheckIn path

**Files:**
- Read: `apps/mobile/prototype/hybrid-app/nutrition-ui.js` (`buildDailyRecords` / check-in)
- Read: `packages/nutrition-engine/src/engine.ts` (`weeklyCheckIn`)

- [x] Document in a short comment block in `nutrition-ui.js` which fields `weeklyCheckIn` needs for day completeness.
- [x] Commit only if code changes follow in N2; otherwise fold into N2.

### Task N2 — Athlete can set day status (complete / fasted / partial)

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/nutrition-ui.js`

- [x] **Step 1:** On day screen, add three quiet controls (not a new product module): Complete / Fasted / Partial — write via existing `dayStatus` store helpers.
- [x] **Step 2:** Default remains `complete` when logging food if unset (current behavior).
- [x] **Step 3:** Extend `nutrition-ui.smoke.mjs` to assert status setter exists / markup hook.
- [x] **Step 4:** Commit `feat(nutrition): day status complete/fasted/partial`

### Task N3 — Pass dayStatus into weeklyCheckIn records

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/nutrition-ui.js` (record builder for check-in)

- [x] **Step 1:** Failing unit/smoke — fasted day excluded or flagged per engine contract (match `weeklyCheckIn` / coverage rules already in engine tests).
- [x] **Step 2:** Wire status into records array.
- [x] **Step 3:** Smoke PASS.
- [x] **Step 4:** Commit `feat(nutrition): dayStatus into adaptive check-in inputs`

### Task N4 — Guardrails: no recipes/charts

- [x] Grep plan + PR: confirm no recipe screens / chart canvases added.
- [x] Commit not required if clean; note in handoff.

### Task N5 — Sync + cache + verify

- [x] `bash apps/mobile/sync-hybrid-html.sh`
- [x] Cache bump
- [x] `pnpm run verify`
- [x] Commit `chore: nutrition day-status ship stamp`

### Task N6 — Phase 2 handoff

- [x] Handoff + checkboxes
- [x] Commit `docs: handoff nutrition phase complete`

---

# Phase 3 — Conditioning complete (`conAdapt`)

**Exit:** `conAdapt` persists levels; prescription reads level; zone helpers prefer engine; no insights UI.

### Task E1 — Adapter: `applyConAdapt(state, condResult)`

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/engine-adapter.js`
- Test: `apps/mobile/prototype/hybrid-app/engine-adapt.smoke.mjs` (create)

**Interfaces:**
- Consumes: `HybridEngine.Conditioning.conAdapt`, `conProgLevel`
- Produces: updates `state.settings.conProgress` (or `state.engine.conProgress` — pick one key and stick to it; prefer `state.settings.conProgress` to match engine Settings shape)

```js
function applyConAdapt(state, rec) {
  if (!hasEngine()) return state;
  state.settings = state.settings || {};
  var result = global.HybridEngine.Conditioning.conAdapt(rec, state.settings);
  state.settings.conProgress = result.conProgress;
  state.meta = state.meta || {};
  state.meta.lastConAdapt = { delta: result.delta, at: new Date().toISOString() };
  return state;
}
```

- [x] Steps: failing smoke → implement → pass → commit `feat(engine): applyConAdapt persists conProgress`

### Task E2 — Map HTML cond finish → `CondResult` for adapt

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/engine-adapter.js`
- Modify: `apps/mobile/prototype/hybrid-app/index.html` (`finalizeSimpleCondResult` / finish)

- [x] Build `rec` with `fmt`, `modality`, `zsec`/`zoneSeconds`, `dur`, `rec` (session WHOOP), `sim:false`, `felt` if present.
- [x] Call `applyConAdapt` after successful complete (silent).
- [x] Commit `feat(engine): run conAdapt on conditioning complete`

### Task E3 — Prescription reads `conProgLevel`

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/engine-adapter.js` (`sessionPatchFromBuilder` / `conPrescription` call site)

- [x] Pass `settings` including `conProgress` into prescription so level advances minutes/rounds per engine rules.
- [x] Smoke: level 0 vs level 2 patch differs (or assert `conProgLevel` consulted).
- [x] Commit `feat(engine): prescription consumes conProgLevel`

### Task E4 — Prefer engine zone-second helper

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/engine-adapter.js` and/or `index.html` `tickCondZoneSeconds`

- [x] Where HTML duplicates zone bucketing, call `HybridEngine.Hr` helpers if equivalent; keep BLE tick loop in HTML.
- [x] `engine-adapter.parity.mjs` still green.
- [x] Commit `feat(engine): prefer Hr helpers for zone seconds`

### Task E5 — No insights UI (receipt-only)

- [x] If any insight signals are computed, attach to Coordinator domain receipts only — no Home insight card.
- [x] Commit if code; else note in handoff.

### Task E6–E8 — Sync, cache, verify, handoff

- [x] Sync + cache bump + `pnpm run verify`
- [x] Handoff Phase 3
- [x] Commits: `chore: conditioning conAdapt ship stamp` / `docs: handoff conditioning phase complete`

---

# Phase 4 — Recovery complete (fully invisible)

**Exit:** Heat ledger + capacity on posture; load headline dampener copy only; zero new Recovery UI.

### Task R1 — Heat / steps → posture domains

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/recovery-engine.js`
- Test: `apps/mobile/prototype/hybrid-app/recovery-engine.smoke.mjs`

- [ ] Ensure `domains.heatLoad` and step-derived background signals populate from check-in.
- [ ] Extend smoke cases (≥ existing 12 matrix — add heat high → capacityHint lower).
- [ ] Commit `feat(recovery): heat ledger into posture`

### Task R2 — `capacityHint` always populated when data sufficient

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/recovery-engine.js`

- [ ] When band known, set `capacityHint` 0–100; when `insufficient_data`, `null`.
- [ ] Smoke asserts shape.
- [ ] Commit `feat(recovery): capacityHint on posture`

### Task R3 — Load headline dampener (copy only)

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/load-headline.js`

- [ ] When recovery gate is `hold`/`caution`, reasonCodes / headline wording soften — **no** block of Start.
- [ ] Update `load-headline.smoke.mjs`.
- [ ] Commit `feat(recovery): load headline dampener copy`

### Task R4 — Grep guard: no Recovery dial UI

- [ ] Grep `index.html` for new Recovery nav/module — must not exist.
- [ ] Commit N/A if clean.

### Task R5–R6 — Sync, cache, verify, handoff

- [ ] Ship stamp + handoff commits

---

# Phase 5 — Coordinator complete (silent only)

**Exit:** No athlete Coordinator weekly peek; silent apply remains; smoke updated.

### Task C1 — Remove Coordinator `openWeeklyReview` UI entry points

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/index.html`
- Modify: `apps/mobile/prototype/hybrid-app/coordinator.smoke.mjs`

**Important:** Do **not** remove `NutritionUI.openWeeklyReview`.

- [ ] **Step 1:** Grep `index.html` for `openWeeklyReview(` and “This week” / “Weekly review” Coordinator sheet — remove buttons/links and `openWeeklyReview` function (or make it no-op unused).
- [ ] **Step 2:** Change `coordinator.smoke.mjs` — **must not** require `openWeeklyReview` in index; instead assert `bootstrapSilent` / `applySilentReceipt` still exist and `NutritionUI` check-in unrelated.
- [ ] **Step 3:** Smoke PASS.
- [ ] **Step 4:** Commit `feat(coordinator): hide weekly review peek`

### Task C2 — Keep `weeklySheetHtml` for tests only (optional)

- [ ] Adapter may retain `weeklySheetHtml` for smoke fixtures but nothing in athlete nav calls it.
- [ ] Commit if cleanup needed.

### Task C3 — Silent apply coverage check

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/coordinator-adapter.js` only if gaps

- [ ] Confirm `bootstrapSilent` still runs on finish / boot paths from `index.html`.
- [ ] Cond low-dose silent ease still applied.
- [ ] `coordinator.smoke.mjs` green.
- [ ] Commit only if fixes needed.

### Task C4 — Do not reimplement strength progression in Coordinator

- [ ] Review `coordinator.ts` — still reads receipts only; no `decideProgression` clone.
- [ ] No commit if already true.

### Task C5 — Final sync + cache + full verify

- [ ] `bash apps/mobile/sync-hybrid-html.sh`
- [ ] Final cache bump for five-systems arc
- [ ] `pnpm run verify` green
- [ ] Commit `chore: five systems complete ship stamp`

### Task C6 — Final handoff + mark plan complete

- [ ] Update `handoff.md` authoritative checkpoint: five systems wiring complete; invisible brains; vNN cache
- [ ] Mark all phase checkboxes `[x]` in this plan
- [ ] Update roadmap status line in `2026-08-24-hybrid-athlete-roadmap-design.md` if needed
- [ ] Commit `docs: five systems complete handoff`

---

## Spec coverage checklist

| Spec requirement | Tasks |
| --- | --- |
| Strength `%WM` resolve + rounding | S1–S4 |
| Engine e1RM + session load | S5–S6 |
| Cloud set rows | S7 |
| Progress list deepen | S8 |
| Nutrition day-status; no recipes/charts | N2–N4 |
| Cond `conAdapt` + level consume | E1–E3 |
| Prefer engine zone helpers | E4 |
| No insights UI | E5 |
| Recovery heat + capacity invisible | R1–R4 |
| Load headline dampener | R3 |
| Hide Coordinator weekly peek | C1 |
| Silent Coordinator only | C3 |
| Cache / verify / handoff | S9–S10, N5–N6, E6–E8, R5–R6, C5–C6 |

## Anti-regression (every phase PR)

- [ ] Library → Full Body A still starts and logs a set
- [ ] Home still shows Sleep / Conditioning / Nutrition
- [ ] Nutrition weekly **check-in** still opens (`NutritionUI.openWeeklyReview`)
- [ ] Coordinator **athlete** weekly sheet does **not** open
- [ ] `pnpm run verify` green

---

## Execution

**Plan complete.** Two options:

1. **Subagent-Driven (recommended)** — one task (or small group) per agent; review between  
2. **Inline** — execute Phase 1 Task S1 onward in this session with checkpoints  

**Which approach — and start at Task S1?**
