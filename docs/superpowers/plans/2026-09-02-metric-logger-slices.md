# Metric-aware logger — small-slice implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan **one slice at a time**. Steps use checkbox (`- [ ]` / `- [x]`) syntax for tracking.
>
> **Rule:** One PR per slice unless the owner explicitly asks to batch. Finish the slice verify gate before starting the next. **Do not start Slice M1 until owner checks all boxes in the spec sign-off section.**

**Goal:** Let athletes prescribe any mix of load, reps, time, and distance in the strength builder (1–3 metric columns) and log them in the one-set logger — including a work timer for holds — without changing v153 builder card chrome.

**Architecture:** `log-columns.js` owns column kinds and builder metric dropdowns inside the existing `hero-metrics` grid. `strength-one-set-logger.js` gains a column-aware hero and optional work-timer phase, reusing `rest-overlay.js` ring UI. `exercise-load-profiles.js` (new) maps `exerciseId` → default `logColumns` from the existing fixture. `strength-adapter.js` learns timed-hold detection and emits `duration` / `distance` in `htmlRowToPerformed`. Pure engine math stays in `@hybrid/strength-engine`.

**Tech stack:** Hybrid HTML app (`apps/mobile/prototype/hybrid-app/`), colocated `.smoke.mjs`, `pnpm run verify`, cache bump `LOCAL_BUILD` + service worker, sync via `bash apps/mobile/sync-hybrid-html.sh`.

**Spec:** `docs/superpowers/specs/2026-09-02-metric-logger-slices.md`

## Global constraints

- **Baseline build:** `the-hybrid-athlete-engine-v153` (post #148).
- **Frozen builder chrome:** eyebrow `Hybrid Strength · builder`, name input, suggest list, hero label `Load & effort · session start fills numbers`, rest row, calibration slider `How should this feel?`, superset `Superset · builder` — layout/copy unchanged.
- **Allowed builder edits:** metric dropdown count (1–3), dropdown kinds, optional compact `sideMode` row under `hero-metrics`.
- **Forbidden builder edits:** rest countdown preview, post-set slider, Next/Extra set, setchip, new card sections, eyebrow/copy renames.
- **Athlete surface only:** `apps/mobile/prototype/hybrid-app/index.html` — sync after edits.
- **Time/distance:** manual template only — no auto session→session progression.
- **`@hybrid/strength-engine` stays pure** — adapters inject data; no DB client in package.
- **Shared Supabase:** no migrations against hybrid-owned tables.
- **Checks must fail:** every new smoke lands in `package.json` `verify` and `.github/workflows/ci.yml` in the same commit.
- **Cache bump per ship slice:** `LOCAL_BUILD` + service-worker `CACHE` together (e.g. `the-hybrid-athlete-engine-v154`).
- **`pnpm run verify` green** after every code slice.

---

## Slice overview

| Slice | Delivers | PR scope | Cache bump |
| --- | --- | --- | --- |
| **M0** | Owner sign-off on spec | docs only | — |
| **M1** | Builder 1–3 metric columns + add/remove column handlers | builder data row | optional |
| **M2** | Logger dynamic hero from `logColumns` (load×reps unchanged) | logger | v154 |
| **M3** | Library defaults on exercise pick | adapter + new module | — |
| **M4** | Timed-hold exercises skip rep progression | adapter | — |
| **M5** | Work timer phase for `time_sec` primary | logger + work overlay | v155 |
| **M6** | Load+time and carry logger flows | logger | v156 |
| **M7** | `htmlRowToPerformed` emits duration/distance | adapter | — |
| **M8** | `sideMode` L→R per round | builder row + logger | v157 |
| **M9** | Ship ritual + dogfood proof | release | Capgo separate |

**Dependency graph:**

```
M0 → M1 → M2 → M3
              ↘ M4 (can parallel after M2)
M2 → M5 → M6 → M7
M1 → M8 (needs sideMode row from M1)
M7 + M8 → M9
```

---

## File map (end state)

| Path | Role |
| --- | --- |
| `apps/mobile/prototype/hybrid-app/log-columns.js` | 1–3 column builder grid; `columnLayout(ex)` helper |
| `apps/mobile/prototype/hybrid-app/exercise-load-profiles.js` | `defaultLogColumnsForExercise(exerciseId)` from fixture subset |
| `apps/mobile/prototype/hybrid-app/strength-one-set-logger.js` | Column-aware hero, work-timer phase, sideMode rounds |
| `apps/mobile/prototype/hybrid-app/work-overlay.js` | Countdown work ring (mirrors `rest-overlay.js` API) |
| `apps/mobile/prototype/hybrid-app/strength-adapter.js` | `timedHoldLift`, `htmlRowToPerformed` duration/distance |
| `apps/mobile/prototype/hybrid-app/index.html` | `pickAthleteLiftSuggest`, `ensureAthleteLiftShape`, `setAthleteLiftSideMode` |
| `test/fixtures/exercise-load-profiles.json` | Source of truth (already exists) |
| `apps/mobile/prototype/hybrid-app/metric-logger.smoke.mjs` | Cross-slice contract smoke (new) |

---

# Slice M0 — Spec sign-off (no code)

**Exit:** All owner checkboxes ticked in `docs/superpowers/specs/2026-09-02-metric-logger-slices.md`.

- [ ] Walk owner through frozen builder table vs allowed metric-row changes.
- [ ] Confirm logger state machines A–D in spec match product intent.
- [ ] Confirm `sideMode: both_per_round` copy (`Left · Round 1/3`).
- [ ] Confirm time/distance manual-only rule.
- [ ] Owner checks **Slice M1 may start** in spec.

---

# Slice M1 — Builder 1–3 metric columns

**Exit:** Athlete builder shows 1–3 metric dropdowns inside existing `hero-metrics` grid; v153 chrome unchanged; smokes green.

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/log-columns.js` (`ensureAthleteLogColumns`, `builderLiftMetricsHtml`, exports)
- Modify: `apps/mobile/prototype/hybrid-app/index.html` (`ensureAthleteLiftShape`, `setAthleteLiftColumnKind`, column add/remove handlers)
- Modify: `apps/mobile/prototype/hybrid-app/log-columns.smoke.mjs`
- Modify: `apps/mobile/prototype/hybrid-app/athlete-builder-logger.smoke.mjs`

**Interfaces:**
- Produces: `LogColumns.columnLayout(ex) → { cols, loadCol, effortCols, layout: 'single'|'load_x_effort'|'triple' }`
- Produces: `LogColumns.builderLiftMetricsHtml(ex, bi, ei) → string` (1–3 dropdowns, same CSS classes)
- Produces: `global.setAthleteLiftColumnCount(bi, ei, n)` where `n ∈ {1,2,3}`

### Task M1.1 — Relax 2-column cap in `ensureAthleteLogColumns`

- [ ] **Step 1: Extend log-columns smoke for 3-column plank**

Add to `log-columns.smoke.mjs`:

```javascript
const plankEx = {
  name: 'Plank',
  restSec: 60,
  logColumns: [{ id: 't', kind: 'time_sec', value: '', values: [''] }],
};
const plankTwin = LC.builderAthleteTwinHtml(plankEx, { bi: 0, ei: 0 });
if (!plankTwin.includes('Time (seconds)')) throw new Error('plank twin shows time kind');
if (plankTwin.includes('metric-sep')) throw new Error('single-column plank should not show × separator');

const carryEx = {
  name: 'Farmer Walk',
  restSec: 90,
  logColumns: [
    { id: 'w', kind: 'weight_kg', value: '', values: [''] },
    { id: 'd', kind: 'distance_m', value: '', values: [''] },
    { id: 't', kind: 'time_sec', value: '', values: [''] },
  ],
};
const carryTwin = LC.builderAthleteTwinHtml(carryEx, { bi: 0, ei: 0 });
if (!carryTwin.includes('Distance (metres)')) throw new Error('carry twin missing distance');
if (!carryTwin.includes('Time (seconds)')) throw new Error('carry twin missing time');
```

- [ ] **Step 2: Run smoke — expect FAIL**

Run: `pnpm run check:log-columns`  
Expected: FAIL — `ensureAthleteLogColumns` slices carry to 2 columns.

- [ ] **Step 3: Implement `columnLayout` + 3-column `builderLiftMetricsHtml`**

In `log-columns.js`:

```javascript
function columnLayout(ex) {
  const cols = ensureAthleteLogColumns(ex || {});
  const loadCol = loadColumn(cols);
  const effortCols = cols.filter((c) => isEffortKind(c.kind));
  if (cols.length === 1) return { cols, loadCol: null, effortCols, layout: 'single' };
  if (cols.length === 3) return { cols, loadCol, effortCols, layout: 'triple' };
  return { cols, loadCol, effortCols, layout: 'load_x_effort' };
}

function ensureAthleteLogColumns(ex) {
  let cols =
    ex && Array.isArray(ex.logColumns) && ex.logColumns.length
      ? coachNormalizeColumns(ex)
      : defaultAthleteColumns(ex);
  const repOnly = repOnlyAthleteColumns(ex);
  const maxCols = repOnly ? 1 : Math.min(3, Math.max(2, cols.length));
  cols = cols.slice(0, maxCols);
  while (cols.length < (repOnly ? 1 : 2)) {
    cols.push({ id: newId(), kind: 'reps', value: '', values: splitValues('', 3) });
  }
  return cols.slice(0, maxCols).map((c) => ({
    id: c.id || newId(),
    kind: KIND_MAP[c.kind] ? c.kind : 'reps',
    value: '',
    values: splitValues('', 3),
  }));
}
```

Update `builderLiftMetricsHtml` to render:
- **single:** one dropdown (effort kinds only)
- **load_x_effort:** existing two-column with `×`
- **triple:** three `metric-col` cells with `·` separators (no new CSS section — reuse `metric-col` + `metric-sep`)

- [ ] **Step 4: Update `ensureAthleteLiftShape` in index.html**

Stop hard-slicing to 2 when `ex.logColumns.length === 3`:

```javascript
function ensureAthleteLiftShape(ex) {
  ex = ex || {};
  let linked = !!ex.supersetWithNext;
  ex.autopilotVolume = true;
  ex.sets = null;
  ex.reps = null;
  ex.restSec = Math.max(0, num(ex.restSec) || 120);
  ex.sideMode = ex.sideMode || 'none';
  ex.logColumns =
    window.LogColumns && LogColumns.ensureAthleteLogColumns
      ? LogColumns.ensureAthleteLogColumns(ex)
      : athleteDefaultLogColumns(ex);
  let repOnly = athleteLiftRepOnly(ex);
  const maxCols = repOnly ? 1 : Math.min(3, ex.logColumns.length || 2);
  ex.logColumns = ex.logColumns.slice(0, maxCols).map((c) => ({
    id: c.id || id(),
    kind: c.kind || 'reps',
    value: '',
    values: [],
  }));
  delete ex.load;
  delete ex.loadExpr;
  ex.supersetWithNext = linked;
  return ex;
}
```

- [ ] **Step 5: Run smokes**

Run: `pnpm run check:log-columns && pnpm run check:athlete-builder-logger`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/prototype/hybrid-app/log-columns.js \
  apps/mobile/prototype/hybrid-app/index.html \
  apps/mobile/prototype/hybrid-app/log-columns.smoke.mjs \
  apps/mobile/prototype/hybrid-app/athlete-builder-logger.smoke.mjs
git commit -m "feat(builder): support 1-3 metric column dropdowns in frozen chrome"
```

---

# Slice M2 — Logger reads `logColumns`

**Exit:** `StrengthOneSetLogger.heroActive` renders kg×reps, seconds-only, or triple metrics from exercise `logColumns`; existing squat flow unchanged.

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/strength-one-set-logger.js`
- Modify: `apps/mobile/prototype/hybrid-app/strength-one-set-logger.smoke.mjs`
- Create: `apps/mobile/prototype/hybrid-app/metric-logger.smoke.mjs`
- Modify: `package.json`, `.github/workflows/ci.yml` (register `check:metric-logger`)
- Modify: `apps/mobile/prototype/hybrid-app/index.html` (`LOCAL_BUILD` → v154)

**Interfaces:**
- Consumes: `LogColumns.columnLayout(ex)`, `LogColumns.kindMeta(kind)`
- Produces: `StrengthOneSetLogger.metricCellsHtml(t, row) → string`
- Produces: `StrengthOneSetLogger.loggerPhase(t) → 'active'|'work'|'rest'` (work added in M5; stub `'active'` here)

### Task M2.1 — Column-aware hero

- [ ] **Step 1: Add failing metric-logger smoke**

Create `metric-logger.smoke.mjs`:

```javascript
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const sandbox = { /* same base as strength-one-set-logger.smoke.mjs */ };
vm.runInContext(readFileSync(join(dir, 'log-columns.js'), 'utf8'), sandbox);
vm.runInContext(readFileSync(join(dir, 'session-chrome.js'), 'utf8'), sandbox);
vm.runInContext(readFileSync(join(dir, 'rest-overlay.js'), 'utf8'), sandbox);
vm.runInContext(readFileSync(join(dir, 'strength-one-set-logger.js'), 'utf8'), sandbox);

const plankTask = {
  kind: 'strength',
  name: 'Plank',
  exerciseId: 'plank',
  restSec: 60,
  logColumns: [{ id: 't', kind: 'time_sec', value: '30', values: ['30'] }],
  rows: [{ n: 1, target: '30', targetKind: 'seconds', reps: '', weight: '', done: false }],
};
sandbox._task = plankTask;
const html = sandbox.StrengthOneSetLogger.renderTask(plankTask);
if (!html.includes('Seconds') && !html.includes('seconds')) {
  throw new Error('plank logger should label seconds, not reps');
}
if (html.includes('metric-unit>reps')) throw new Error('plank logger must not show reps unit');
console.log('metric-logger.smoke: ok');
```

- [ ] **Step 2: Run — expect FAIL**

Run: `node apps/mobile/prototype/hybrid-app/metric-logger.smoke.mjs`  
Expected: FAIL — hard-coded reps hero.

- [ ] **Step 3: Implement `metricCellsHtml` in strength-one-set-logger.js**

```javascript
function metricCellsHtml(t, row, ri) {
  var cols =
    (t.logColumns && t.logColumns.length && global.LogColumns && global.LogColumns.columnLayout
      ? global.LogColumns.columnLayout(t).cols
      : null) || [
      { kind: 'weight_kg' },
      { kind: 'reps' },
    ];
  return cols
    .map(function (col, i) {
      var meta = global.LogColumns.kindMeta(col.kind);
      var field = meta.field;
      var val = row[field] != null ? row[field] : row.targetKind === meta.targetKind ? row.target : '';
      var unit = meta.loggerLabel.toLowerCase();
      var sep = i > 0 ? (cols.length === 3 ? '<div class=metric-sep>·</div>' : '<div class=metric-sep>×</div>') : '';
      return (
        sep +
        '<div><input type="number" class="metric-val" id="oneSetMetric_' +
        i +
        '" value="' +
        String(val).replace(/"/g, '&quot;') +
        '" onchange="updateSet(' +
        ri +
        ',\'' +
        field +
        '\',this.value)" aria-label="' +
        meta.loggerLabel +
        '">' +
        '<span class=metric-unit>' +
        unit +
        '</span></div>'
      );
    })
    .join('');
}
```

Replace hard-coded kg×reps block in `heroActive` with `metricCellsHtml(t, row, ri)`.

- [ ] **Step 4: Pass `logColumns` onto session tasks at start**

In `index.html`, wherever strength tasks are materialized from draft exercises, copy `ex.logColumns` onto the task object (grep `kind:'strength'` task builder — likely near `strengthTask` / session start).

- [ ] **Step 5: Bump cache v154 + sync**

```bash
# index.html LOCAL_BUILD and sw.js CACHE → the-hybrid-athlete-engine-v154
bash apps/mobile/sync-hybrid-html.sh
```

Update smoke pins in `strength-one-set-logger.smoke.mjs`, `log-columns.smoke.mjs`.

- [ ] **Step 6: Register check + verify**

Add to `package.json`:
```json
"check:metric-logger": "bash apps/mobile/prototype/hybrid-app/build-strength.sh && node apps/mobile/prototype/hybrid-app/metric-logger.smoke.mjs"
```
Mirror in `.github/workflows/ci.yml`.

Run: `pnpm run verify`  
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git commit -m "feat(logger): dynamic hero metrics from logColumns (v154)"
```

---

# Slice M3 — Library defaults on exercise pick

**Exit:** Picking "Plank" from suggest sets `logColumns: [{ kind: 'time_sec' }]`; picking "Farmer Walk" sets 3 columns; builder chrome unchanged.

**Files:**
- Create: `apps/mobile/prototype/hybrid-app/exercise-load-profiles.js`
- Create: `apps/mobile/prototype/hybrid-app/exercise-load-profiles.smoke.mjs`
- Modify: `apps/mobile/prototype/hybrid-app/index.html` (`pickAthleteLiftSuggest`, script tag)
- Modify: `apps/mobile/prototype/hybrid-app/athlete-exercise-pick.smoke.mjs`

**Interfaces:**
- Produces: `ExerciseLoadProfiles.defaultLogColumns(exerciseId) → [{ kind: string }] | null`
- Produces: `ExerciseLoadProfiles.defaultSideMode(exerciseId) → 'none'|'both_per_round' | null` (optional, used in M8)

### Task M3.1 — Minimal runtime lookup module

- [ ] **Step 1: Add smoke for profile → columns**

```javascript
// exercise-load-profiles.smoke.mjs
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const repo = join(dir, '../../../..');
vm.runInNewContext(readFileSync(join(dir, 'exercise-load-profiles.js'), 'utf8'), {
  fetch: async () => ({ json: async () => JSON.parse(readFileSync(join(repo, 'test/fixtures/exercise-load-profiles.json'), 'utf8')) }),
  console,
});
// After init: ExerciseLoadProfiles.defaultLogColumns('plank') → [{ kind: 'time_sec' }]
```

Implementation loads fixture once at init (embedded subset or fetch from bundled JSON — prefer **inline minimal map** for the ~15 common ids + fallback to 2-column default to keep bundle small):

```javascript
// exercise-load-profiles.js — seed map built from fixture profiles.log_columns
const SEED = {
  plank: [{ kind: 'time_sec' }],
  farmer_walk: [{ kind: 'weight_kg' }, { kind: 'distance_m' }, { kind: 'time_sec' }],
  back_squat: [{ kind: 'weight_pct_wm' }, { kind: 'reps' }],
};
function defaultLogColumns(exerciseId) {
  const key = String(exerciseId || '').toLowerCase();
  return SEED[key] ? SEED[key].map((c) => ({ ...c, id: 'col_' + key, value: '', values: [] })) : null;
}
```

Generator script note: extend `scripts/gen-exercise-load-profiles.mjs` to also emit `exercise-load-profiles.seed.json` consumed by the module (keeps 120-exercise coverage without hand maintenance).

- [ ] **Step 2: Wire `pickAthleteLiftSuggest`**

After `ex.exerciseId = exerciseId`:

```javascript
if (window.ExerciseLoadProfiles && exerciseId) {
  const defs = ExerciseLoadProfiles.defaultLogColumns(exerciseId);
  if (defs) ex.logColumns = defs;
}
ensureAthleteLiftShape(ex);
refreshAthleteLiftMetricsOnly(bi, ei); // new: replace hero-metrics inner HTML only, not full card
```

Add `refreshAthleteLiftMetricsOnly` that queries `[data-lift="${bi}_${ei}"] .hero-metrics` and swaps HTML from `LogColumns.builderLiftMetricsHtml`.

- [ ] **Step 3: Extend athlete-exercise-pick smoke**

Assert vm-rendered pick handler sets `time_sec` for plank id.

- [ ] **Step 4: Verify + commit**

Run: `pnpm run verify`  
```bash
git commit -m "feat(builder): apply exercise load profile defaults on pick"
```

**Acceptance artifact (spec M3):** smoke output shows plank twin contains `Time (seconds)` select option selected.

---

# Slice M4 — Timed-hold progression fix

**Exit:** Plank no longer classified as `repProgressionLift`; no rep-volume hints applied to `time_sec`-primary exercises.

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/strength-adapter.js`
- Create: `apps/mobile/prototype/hybrid-app/strength-timed-hold.smoke.mjs`
- Modify: `apps/mobile/prototype/hybrid-app/strength-progression.smoke.mjs` (if plank case exists)

**Interfaces:**
- Produces: `StrengthAdapter.timedHoldLift(name, cat, ex) → boolean`
- Produces: `repProgressionLift` returns `false` when `timedHoldLift` true

### Task M4.1 — Exclude timed holds from rep progression

- [ ] **Step 1: Failing smoke**

```javascript
import vm from 'node:vm';
// load strength-adapter.js with HybridStrength stubs
must(!StrengthAdapter.repProgressionLift('Plank', 'core', {}, 'plank', []), 'plank not rep progression');
must(StrengthAdapter.timedHoldLift('Plank', 'core', { logColumns: [{ kind: 'time_sec' }] }), 'plank is timed hold');
must(StrengthAdapter.repProgressionLift('Pull Up', 'back', {}, 'pull_up', []), 'pull-up still rep progression');
```

- [ ] **Step 2: Implement**

```javascript
function timedHoldLift(name, cat, ex) {
  if (ex && Array.isArray(ex.logColumns) && ex.logColumns.some(function (c) { return c.kind === 'time_sec'; })) {
    var load = ex.logColumns.some(function (c) {
      return c.kind === 'weight_kg' || c.kind === 'weight_pct_wm' || c.kind === 'weight_lwp';
    });
    if (!load) return true; // time-only hold
  }
  return false;
}

function repProgressionLift(name, cat, state, exerciseId, sessionRows) {
  if (timedHoldLift(name, cat, { logColumns: sessionRows && sessionRows.logColumns })) return false;
  // existing regex path — also exclude bare /plank/ when column data unavailable:
  var n = String(name || '').toLowerCase();
  if (/^plank$|front plank|side plank/.test(n) && !exerciseUsesAddedLoadMode(state, exerciseId, name, sessionRows)) return false;
  ...
}
```

Also update `ensureAthleteLiftShape` / `athleteLiftRepOnly` to use `timedHoldLift` so plank gets 1 column not rep-only false positive.

- [ ] **Step 3: Verify + commit**

Run: `pnpm run verify`  
```bash
git commit -m "fix(adapter): exclude timed holds from rep volume progression"
```

---

# Slice M5 — Work timer for time-primary holds

**Exit:** Plank set flow: WORK TIMER countdown → confirm seconds → slider → Next → REST.

**Files:**
- Create: `apps/mobile/prototype/hybrid-app/work-overlay.js`
- Create: `apps/mobile/prototype/hybrid-app/work-overlay.smoke.mjs`
- Modify: `apps/mobile/prototype/hybrid-app/strength-one-set-logger.js`
- Modify: `apps/mobile/prototype/hybrid-app/index.html` (script tag, CSS reuse `.rest-ring`)
- Modify: `apps/mobile/prototype/hybrid-app/metric-logger.smoke.mjs`

**Interfaces:**
- Produces: `WorkOverlay.render({ remainingSec, totalSec, label, skipOnclick, doneEarlyOnclick }) → string`
- Produces: `WorkOverlay.startWork(seconds, onTick, onComplete)`
- Produces: `StrengthOneSetLogger.loggerPhase(t) → 'work'|'active'|'rest'`

### Task M5.1 — Work overlay module

- [ ] **Step 1: Clone rest-overlay API for work phase**

`work-overlay.js` mirrors `rest-overlay.js` but:
- Copy string: `Work · hold` / `remaining`
- Skip → `WorkOverlay.finishEarly()` writes elapsed seconds to row
- Done → auto-transition to active confirm phase

- [ ] **Step 2: Smoke renders work ring**

```javascript
const html = WorkOverlay.render({ remainingSec: 25, totalSec: 30, label: 'Hold' });
if (!html.includes('workOverlay')) throw new Error('work overlay root missing');
```

- [ ] **Step 3: Integrate into logger state machine**

In `ensureAutoreg(t)` add `phase: 'active'`.

When `LogColumns.columnLayout(t).layout === 'single'` and effort kind is `time_sec`:
- On entering set: `phase = 'work'`, `WorkOverlay.startWork(prescribedSec, tick, finishWorkPhase)`
- `finishWorkPhase` sets `row.reps = actualSec` (legacy field) + `row.targetKind = 'seconds'`, `phase = 'active'`
- Active phase shows seconds read-only or editable confirm, then existing slider + Next

- [ ] **Step 4: Bump v155, verify, commit**

**Acceptance artifact (spec M4):** screen recording plank work timer → slider → rest saved to `/opt/cursor/artifacts/`.

```bash
git commit -m "feat(logger): work timer phase for time-primary holds (v155)"
```

---

# Slice M6 — Load+time and carry flows

**Exit:** Weighted plank (load + time) and farmer walk (3 metrics) complete full set cycle.

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/strength-one-set-logger.js`
- Modify: `apps/mobile/prototype/hybrid-app/metric-logger.smoke.mjs`

### Task M6.1 — Multi-phase column flows

- [ ] **Step 1: Add smoke for weighted plank + carry**

```javascript
// layout load_x_effort with time_sec → ACTIVE(load) → WORK → slider
// layout triple → ACTIVE(all three inputs) → optional work timer on time col → slider
```

- [ ] **Step 2: Implement phase routing**

```javascript
function resolveLoggerFlow(t) {
  var layout = global.LogColumns.columnLayout(t);
  if (layout.layout === 'single' && layout.effortCols[0].kind === 'time_sec') return 'time_primary';
  if (layout.layout === 'load_x_effort' && layout.effortCols[0].kind === 'time_sec') return 'load_then_time';
  if (layout.layout === 'triple') return 'carry';
  return 'load_reps';
}
```

- [ ] **Step 3: Carry rest preview copy**

Update `renderRestPhase` up-next line to use `metricCellsHtml` labels instead of hard-coded `kg × reps`.

- [ ] **Step 4: Bump v156, verify, commit**

```bash
git commit -m "feat(logger): load+time and carry set flows (v156)"
```

---

# Slice M7 — Performed measurements for duration/distance

**Exit:** Completed plank sets persist `{ metricKey: 'duration', value: 30 }`; farmer walk adds `distance`.

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/strength-adapter.js` (`htmlRowToPerformed`)
- Modify: `apps/mobile/prototype/hybrid-app/strength-sync.smoke.mjs`

### Task M7.1 — Extend htmlRowToPerformed

- [ ] **Step 1: Failing smoke**

```javascript
const row = { n: 1, weight: 0, reps: 45, targetKind: 'seconds', done: true, rir: 2 };
const perf = StrengthAdapter.htmlRowToPerformed(session, task, ex, row);
must(perf.measurements.some(m => m.metricKey === 'duration' && m.value === 45), 'seconds → duration');
```

- [ ] **Step 2: Implement mapping**

```javascript
function htmlRowToPerformed(session, task, ex, row) {
  ...
  if (row.targetKind === 'seconds' || (ex.logColumns || []).some(c => c.kind === 'time_sec')) {
    var sec = num(row.reps) || num(row.target);
    if (sec > 0) measurements.push({ metricKey: 'duration', value: sec });
  } else {
    if (reps > 0) measurements.push({ metricKey: 'reps', value: reps });
  }
  // distance: read from row.reps when kind distance_m (or dedicated row.distance if added)
  ...
}
```

- [ ] **Step 3: Verify + commit**

```bash
git commit -m "feat(adapter): emit duration and distance in performed measurements"
```

---

# Slice M8 — Left / right (`sideMode`)

**Exit:** Split squat with `sideMode: both_per_round` logs Left → Right → REST per round.

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/log-columns.js` (`builderSideModeHtml`)
- Modify: `apps/mobile/prototype/hybrid-app/index.html` (`setAthleteLiftSideMode`)
- Modify: `apps/mobile/prototype/hybrid-app/strength-one-set-logger.js`

### Task M8.1 — Builder sideMode row

- [ ] **Step 1: Add compact row under hero-metrics**

```html
<div class="side-mode-row">
  <label for="athSideMode_{bi}_{ei}">Sides</label>
  <select id="athSideMode_{bi}_{ei}" onchange="setAthleteLiftSideMode(bi,ei,this.value)">
    <option value="none">None</option>
    <option value="both_per_round">L+R per round</option>
  </select>
</div>
```

Reuse existing `.rest-row` spacing — no new card section.

- [ ] **Step 2: Logger round chip**

When `t.sideMode === 'both_per_round'`, autoreg tracks `{ side: 'left'|'right', round: n }`.

Progress line: `Left · Round 1/3` → log → `Right · Round 1/3` → log → REST.

- [ ] **Step 3: Smoke + recording**

Extend `metric-logger.smoke.mjs` for side chip string.

**Acceptance artifact (spec M7):** screen recording split squat L → R → rest.

- [ ] **Step 4: Bump v157, verify, commit**

```bash
git commit -m "feat(logger): left/right sideMode per round (v157)"
```

---

# Slice M9 — Ship ritual

**Exit:** All smokes green; cache bumped; dogfood checklist updated; Capgo upload ready (owner-triggered).

- [ ] Run full `pnpm run verify`.
- [ ] Run `bash apps/mobile/sync-hybrid-html.sh`.
- [ ] Update `handoff.md` one paragraph: metric logger slices shipped through M8.
- [ ] Confirm smokes pin final cache version across:
  - `log-columns.smoke.mjs`
  - `athlete-builder-logger.smoke.mjs`
  - `strength-one-set-logger.smoke.mjs`
  - `metric-logger.smoke.mjs`
- [ ] Record demo video: back squat (regression) + plank timer + farmer walk 3-col.
- [ ] Owner Capgo OTA (out of scope for agent — document version in PR body only).

```bash
git commit -m "chore: metric logger program verify gate and handoff"
```

---

## Self-review (plan ↔ spec)

| Spec requirement | Plan slice |
| --- | --- |
| Frozen builder chrome | Global constraints + M1 scope guard |
| 1–3 metric dropdowns | M1 |
| Library defaults on pick | M3 |
| Logger state A load×reps | M2 (preserve default) |
| Logger state B time-primary + work timer | M5 |
| Logger state C load+time | M6 |
| Logger state D carry | M1 + M6 |
| sideMode L+R | M8 |
| Time/distance manual only | Global constraints (no progression tasks) |
| Plank rep progression bug | M4 |
| htmlRowToPerformed duration/distance | M7 |
| Acceptance recordings | M5, M8, M9 |

**Placeholder scan:** none — all steps name files, commands, and signatures.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-02-metric-logger-slices.md`. Two execution options:

1. **Subagent-Driven (recommended)** — fresh subagent per slice, review between slices.
2. **Inline Execution** — implement slices in one session with checkpoints after each verify gate.

**Which approach?**
