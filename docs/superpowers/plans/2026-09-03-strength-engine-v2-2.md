# Strength Engine V2.2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend V2.1 in-session adaptation so supersets, rep-only lifts, and timed holds use the same slider + hit/miss rulebook, with suggestions in kg, reps, or seconds.

**Architecture:** Keep math in `@hybrid/strength-engine`. Generalize `EffortProfile` / `planNextSet` / `ExerciseAnchor` with `SuggestionUnit`. Adapter detects unit from logger flow / log columns. One-set logger stays dumb: writes the next row for **this** `exerciseId` only; timed holds seed the existing countdown from the suggestion.

**Tech Stack:** Same as V2.1 — TypeScript + Vitest, Hybrid HTML, esbuild `strength-bundle.js`, colocated smokes.

**Spec:** `docs/superpowers/specs/2026-09-03-strength-engine-v2-2-design.md`  
**Prerequisite spec/plan:** `docs/superpowers/specs/2026-09-03-strength-engine-v2-design.md` · `docs/superpowers/plans/2026-09-03-strength-engine-v2-1.md`

**Out of this plan:** V2.1 product (WM-off, weekly bump skip) is **not** re-specified here. **V3 conditioning** is a separate spec/plan. Recovery stays out.

## Global Constraints

- Pure engine; no I/O in `@hybrid/strength-engine`.
- Edit `apps/mobile/prototype/hybrid-app/` then `bash apps/mobile/sync-hybrid-html.sh`.
- Colocated tests. New smokes in `verify` **and** `.github/workflows/ci.yml` same commit.
- No Supabase migrations. No pain/illness gates. No slider tutorial. No “why” copy.
- Partner rest remains logger-only (do not encode 45s in the engine).
- Table A defaults; clamp learning to table B; manual edit nudge ≤ one step in that unit.
- **Prerequisite:** V2.1 files from that plan exist (`effortProfile.ts`, `planNextSet.ts`, `exerciseAnchor.ts`, adapter `suggestNextSet` / `closeV2Session`). If they are missing, **stop and execute V2.1 Tasks 1–6 first** — do not duplicate those APIs under new names.

## File map

| Path | V2.2 change |
| --- | --- |
| `packages/strength-engine/src/effortProfile.ts` | `SuggestionUnit`, `bump` aliases, table A per unit, clamp to B |
| `packages/strength-engine/src/planNextSet.ts` | `performedQuantity` / `targetQuantity` / `unit`; kg aliases kept |
| `packages/strength-engine/src/exerciseAnchor.ts` | `unit` + `lastQuantity`; kg aliases kept |
| `packages/strength-engine/src/suggestionUnit.ts` | Tiny shared type + `defaultBumpTable(unit)` + `maxBumpTable(unit)` + `stepSize(unit)` |
| `apps/mobile/prototype/hybrid-app/strength-adapter.js` | `suggestionUnitForExercise(ex)`; seed/close by unit; superset per-id |
| `apps/mobile/prototype/hybrid-app/strength-one-set-logger.js` | `nextSupersetSet` calls `suggestNextSet` for **current** exercise; timed countdown seed |
| `apps/mobile/prototype/hybrid-app/strength-engine-v2-2.smoke.mjs` | Unit + superset isolation + reps/seconds |

---

### Task 0: Prerequisite gate

**Files:** none created.

- [ ] **Step 1: Confirm V2.1 primitives**

```bash
test -f packages/strength-engine/src/effortProfile.ts \
  && test -f packages/strength-engine/src/planNextSet.ts \
  && test -f packages/strength-engine/src/exerciseAnchor.ts \
  && rg -n "function suggestNextSet" apps/mobile/prototype/hybrid-app/strength-adapter.js
```

Expected: all exist. If not, execute `docs/superpowers/plans/2026-09-03-strength-engine-v2-1.md` Tasks 1–6, commit, then resume this plan.

- [ ] **Step 2: No commit** unless you had to run V2.1 (then those commits belong to V2.1).

---

### Task 1: Shared unit tables (pure)

**Files:**
- Create: `packages/strength-engine/src/suggestionUnit.ts`
- Create: `packages/strength-engine/src/suggestionUnit.test.ts`
- Modify: `packages/strength-engine/src/index.ts`

**Interfaces:**
- Produces:
  - `export type SuggestionUnit = 'kg' | 'reps' | 'seconds'`
  - `export function stepSize(unit: SuggestionUnit): number` → kg `2.5`, reps `1`, seconds `5`
  - `export function defaultBumpTable(unit: SuggestionUnit): Record<SetDifficulty, number>` (spec table A)
  - `export function maxBumpTable(unit: SuggestionUnit): Record<SetDifficulty, number>` (spec table B; kg very_easy max stays `5`)

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { defaultBumpTable, maxBumpTable, stepSize } from './suggestionUnit';

describe('suggestionUnit', () => {
  it('steps: kg 2.5, reps 1, seconds 5', () => {
    expect(stepSize('kg')).toBe(2.5);
    expect(stepSize('reps')).toBe(1);
    expect(stepSize('seconds')).toBe(5);
  });

  it('table A easy bumps', () => {
    expect(defaultBumpTable('kg').easy).toBe(2.5);
    expect(defaultBumpTable('reps').easy).toBe(1);
    expect(defaultBumpTable('seconds').easy).toBe(5);
    expect(defaultBumpTable('reps').very_easy).toBe(2);
    expect(defaultBumpTable('seconds').did_not_complete).toBe(-10);
  });

  it('table B ceilings', () => {
    expect(maxBumpTable('reps').easy).toBe(2);
    expect(maxBumpTable('reps').very_easy).toBe(3);
    expect(maxBumpTable('seconds').easy).toBe(10);
    expect(maxBumpTable('kg').very_easy).toBe(5);
    expect(maxBumpTable('kg').easy).toBe(5);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
pnpm --filter @hybrid/strength-engine exec vitest run src/suggestionUnit.test.ts
```

- [ ] **Step 3: Implement** using the spec tables verbatim. Import `SetDifficulty` from `decideNextSet.ts` (or `difficulty.ts` if V2.1 split it).

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add packages/strength-engine/src/suggestionUnit.ts packages/strength-engine/src/suggestionUnit.test.ts packages/strength-engine/src/index.ts
git commit -m "V2.2: SuggestionUnit tables A/B and step sizes"
```

---

### Task 2: EffortProfile + planNextSet + anchor become unit-aware

**Files:**
- Modify: `packages/strength-engine/src/effortProfile.ts` (+ tests)
- Modify: `packages/strength-engine/src/planNextSet.ts` (+ tests)
- Modify: `packages/strength-engine/src/exerciseAnchor.ts` (+ tests)

**Interfaces:**
- Consumes: `defaultBumpTable`, `maxBumpTable`, `stepSize`
- Produces (keep V2.1 aliases):
  - `defaultEffortProfile(exerciseId, nowIso, unit?: SuggestionUnit)` — default `unit: 'kg'`
  - `profile.bump` required; `profile.bumpKg` getter-or-same-object for kg tests
  - `planNextSet` accepts `performedQuantity`/`targetQuantity`/`unit` **or** legacy `performedLoadKg`/`prescribedReps` (when `unit` omitted, treat as kg and target = prescribedReps for miss detection only on reps-of-set — **legacy path unchanged**: miss is still `performedReps < prescribedReps`, quantity is load)

**Legacy kg path (must not break V2.1 tests):**  
If `performedLoadKg` is present, quantity = load; miss = `performedReps < prescribedReps`; DNF uses load cuts from `bump.did_not_complete`.

**New path:**  
If `unit === 'reps'` or `'seconds'`, quantity **is** the suggestion; miss = `performedQuantity < targetQuantity`; `targetReps` in output is the next quantity (name it `nextQuantity` on `NextSetPlan` and keep `targetReps` as alias when unit is kg for wrapper).

Recommended `NextSetPlan`:

```ts
export interface NextSetPlan {
  loadKg?: number;
  targetReps?: number;
  quantity: number;
  unit: SuggestionUnit;
  reasonCodes: string[];
}
```

For kg, set `quantity`, `unit: 'kg'`, `loadKg: quantity`, `targetReps: prescribedReps` (or DNF-capped reps as today).

- [ ] **Step 1: Add failing tests in `planNextSet.test.ts`**

```ts
it('reps: easy + hit bumps +1', () => {
  const profile = defaultEffortProfile('pu', 't', 'reps');
  const r = planNextSet({
    performedQuantity: 8,
    targetQuantity: 8,
    difficulty: 'easy',
    unit: 'reps',
    equipment: null,
    profile,
  });
  expect(r.quantity).toBe(9);
  expect(r.unit).toBe('reps');
});

it('reps: easy + miss does not bump', () => {
  const profile = defaultEffortProfile('pu', 't', 'reps');
  const r = planNextSet({
    performedQuantity: 5,
    targetQuantity: 8,
    difficulty: 'easy',
    unit: 'reps',
    equipment: null,
    profile,
  });
  expect(r.quantity).toBeLessThan(8);
});

it('seconds: easy + hit bumps +5', () => {
  const profile = defaultEffortProfile('plank', 't', 'seconds');
  const r = planNextSet({
    performedQuantity: 30,
    targetQuantity: 30,
    difficulty: 'easy',
    unit: 'seconds',
    equipment: null,
    profile,
  });
  expect(r.quantity).toBe(35);
});

it('seconds: 20 of 30 cuts', () => {
  const profile = defaultEffortProfile('plank', 't', 'seconds');
  const r = planNextSet({
    performedQuantity: 20,
    targetQuantity: 30,
    difficulty: 'easy',
    unit: 'seconds',
    equipment: null,
    profile,
  });
  expect(r.quantity).toBeLessThan(30);
});
```

- [ ] **Step 2: Run V2.1 + new tests — new FAIL, old PASS until you implement**

```bash
pnpm --filter @hybrid/strength-engine exec vitest run src/planNextSet.test.ts src/effortProfile.test.ts src/exerciseAnchor.test.ts
```

- [ ] **Step 3: Implement**

`roundQuantity(value, unit, equipment)`:

- kg → `roundLoadToEquipment`
- reps → `Math.max(1, Math.round(value))` except DNF proven 0 → next quantity `Math.max(1, proven)` per spec “keep target at 1”
- seconds → honor performed if not bumping; when applying bump, snap result to 5s: `Math.round(value / 5) * 5`, min 5 after a completed set

`updateEffortProfile`: after nudge, clamp each label with `maxBumpTable(profile.unit)`; grow Easy toward B by at most `stepSize(unit)` per call when Easy + hit + no override (optional; spec says may grow — implement: if Easy + hit, `bump.easy = min(B.easy, bump.easy + 0)` on first sessions; **growth rule:** if `sampleCount >= 3` and last update was Easy + hit, add one step toward B. Keep it in `updateEffortProfile` so the logger stays dumb.

Simpler growth rule (implement this):

```ts
if (!input.manualLoadOverride && hit && (difficulty === 'easy' || difficulty === 'very_easy')) {
  const cap = maxBumpTable(unit)[difficulty];
  const step = stepSize(unit);
  if (bump[difficulty] < cap) bump[difficulty] = Math.min(cap, bump[difficulty] + step);
}
```

Miss + Easy still shrinks toward 0 as in V2.1.

`closeStrengthSession`: write `lastQuantity` / `unit`; if omitted, `unit: 'kg'` and `lastQuantity = lastSet.loadKg`.

- [ ] **Step 4: Full package tests PASS**

```bash
pnpm --filter @hybrid/strength-engine test
```

- [ ] **Step 5: Commit**

```bash
git add packages/strength-engine
git commit -m "V2.2: unit-aware planNextSet, EffortProfile clamp to table B"
```

---

### Task 3: Adapter — detect unit, seed, close

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/strength-adapter.js`
- Modify: `apps/mobile/prototype/hybrid-app/strength-entry.ts` if new exports needed (already exporting EffortProfile)

**Interfaces:**
- Produces: `suggestionUnitForExercise(ex): 'kg'|'reps'|'seconds'`
  - `seconds` if `StrengthOneSetLogger.isTimePrimaryHold(ex)` **or** log columns effort kind `time_sec` and no load column
  - `reps` if no load column (`weight_kg` / pct / lwp) and not time-primary
  - else `kg`
- `seedExerciseFromAnchor`: if unit reps/seconds, fill **reps** (or time field) from `lastQuantity`, not weight; first-ever reps/seconds: fill from `ex.reps` / `row.target` (template), not blank
- `closeV2Session`: pass `unit` into `closeStrengthSession`; last quantity = `num(row.weight)` if kg else `num(row.reps)` (timed holds store seconds in `row.reps` today — keep that)

- [ ] **Step 1: Failing smoke file** `apps/mobile/prototype/hybrid-app/strength-engine-v2-2.smoke.mjs`

Load bundle+adapter in vm. Assert:

```js
must(StrengthAdapter.suggestionUnitForExercise({ logColumns: [{ kind: 'reps' }] }) === 'reps');
must(StrengthAdapter.suggestionUnitForExercise({
  logColumns: [{ kind: 'time_sec', values: ['30'] }],
}) === 'seconds');
must(StrengthAdapter.suggestionUnitForExercise({
  logColumns: [{ kind: 'weight_kg' }, { kind: 'reps' }],
}) === 'kg');
```

- [ ] **Step 2: Run — FAIL until exported**

```bash
bash apps/mobile/prototype/hybrid-app/build-strength.sh
node apps/mobile/prototype/hybrid-app/strength-engine-v2-2.smoke.mjs
```

- [ ] **Step 3: Implement detection using existing `LogColumns` if present:**

```js
function suggestionUnitForExercise(ex) {
  if (!ex) return 'kg';
  if (global.StrengthOneSetLogger && global.StrengthOneSetLogger.isTimePrimaryHold && global.StrengthOneSetLogger.isTimePrimaryHold(ex)) {
    return 'seconds';
  }
  var cols = ex.logColumns || [];
  var hasLoad = cols.some(function (c) {
    return c && (c.kind === 'weight_kg' || c.kind === 'weight_pct_wm' || c.kind === 'weight_lwp');
  });
  var hasTime = cols.some(function (c) { return c && c.kind === 'time_sec'; });
  if (hasTime && !hasLoad) return 'seconds';
  if (!hasLoad) return 'reps';
  return 'kg';
}
```

Export on `StrengthAdapter`. Update `suggestNextSet` to pass `unit` and `performedQuantity`/`targetQuantity` when not kg.

- [ ] **Step 4: Smoke PASS**

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/prototype/hybrid-app/strength-adapter.js apps/mobile/prototype/hybrid-app/strength-engine-v2-2.smoke.mjs
git commit -m "V2.2 adapter: detect kg vs reps vs seconds"
```

---

### Task 4: Superset — suggest next set for current lift only

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/strength-one-set-logger.js` (`nextSupersetSet`)
- Modify: `apps/mobile/prototype/hybrid-app/strength-engine-v2-2.smoke.mjs` and/or `strength-one-set-logger.smoke.mjs`

**Interfaces:**
- Consumes: `StrengthAdapter.suggestNextSet(state, ex, input)` where `ex` is the **partner exercise object**, not the superset task

- [ ] **Step 1: Failing logger smoke**

After finishing exercise 0 round 0, exercise 1 round 0 weight/reps must be **unchanged**; exercise 0 round 1 must receive the suggestion.

Extend `strength-one-set-logger.smoke.mjs` with a stub:

```js
sandbox.StrengthAdapter.suggestNextSet = (_S, ex, input) => {
  sandbox._suggestedFor = (sandbox._suggestedFor || []).concat(ex.name);
  return { loadKg: 90, reps: 8, reasonCodes: ['test'] };
};
```

Call `nextSupersetSet` on a 2-lift × 2-round superset with only A1 undone. After log, `must(ss.exercises[1].rows[0].weight === 80)` (unchanged) and `must(ss.exercises[0].rows[1].weight === 90)`.

If `nextSupersetSet` does not call `suggestNextSet` today, this fails.

- [ ] **Step 2: Run `pnpm run check:strength-one-set-logger` — FAIL**

- [ ] **Step 3: In `nextSupersetSet`, after marking the row done**, compute the **same exercise’s** next undone row (next round, same `exIndex`):

```js
var nextSame = null;
var rows = ex.rows || [];
for (var i = item.rowIndex + 1; i < rows.length; i++) {
  if (rows[i] && !rows[i].done) { nextSame = rows[i]; break; }
}
if (nextSame && global.StrengthAdapter && global.StrengthAdapter.suggestNextSet) {
  var suggestion = global.StrengthAdapter.suggestNextSet(global.S, ex, {
    performedLoadKg: Number(item.row.weight),
    performedReps: Number(item.row.reps),
    prescribedReps: parseTargetReps(item.row) || Number(item.row.reps),
    suggestedLoadKg: Number(item.row.suggestedLoadKg || item.row.weight),
    difficulty: item.row.difficulty,
    ordinal: item.rowIndex + 1,
  });
  if (suggestion) {
    if (suggestion.unit === 'reps' || suggestion.unit === 'seconds') {
      nextSame.reps = suggestion.quantity != null ? suggestion.quantity : suggestion.reps;
      nextSame.target = String(nextSame.reps);
    } else {
      nextSame.weight = suggestion.loadKg;
      nextSame.suggestedLoadKg = suggestion.loadKg;
      if (suggestion.reps != null) {
        nextSame.reps = suggestion.reps;
        nextSame.target = String(suggestion.reps);
      }
    }
  }
}
```

Do **not** write onto `exercises[item.exIndex + 1]`.

Keep existing `beginRest` partner/round logic.

- [ ] **Step 4: Logger smoke PASS**

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/prototype/hybrid-app/strength-one-set-logger.js apps/mobile/prototype/hybrid-app/strength-one-set-logger.smoke.mjs
git commit -m "V2.2: superset next-set suggestion is per lift, not per round"
```

---

### Task 5: Rep-only seed, suggest, close

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/strength-adapter.js` (`seedExerciseFromAnchor`, `suggestNextSet`, `closeV2Session`)
- Modify: `apps/mobile/prototype/hybrid-app/strength-engine-v2-2.smoke.mjs`

**Interfaces:** none new beyond Task 3.

- [ ] **Step 1: Smoke**

```js
const pull = {
  kind: 'strength',
  exerciseId: 'pu',
  name: 'Pull-Up',
  logColumns: [{ kind: 'reps', values: ['8'] }],
  reps: '8',
  rows: [
    { n: 1, target: '8', reps: '', done: false },
    { n: 2, target: '8', reps: '', done: false },
  ],
};
StrengthAdapter.applyLoadHintsToExercise(state, pull, '2026-09-03');
must(String(pull.rows[0].reps) === '8', 'first session seeds template reps');

const s1 = StrengthAdapter.suggestNextSet(state, pull, {
  performedQuantity: 8,
  targetQuantity: 8,
  performedReps: 8,
  prescribedReps: 8,
  difficulty: 'easy',
  suggestedLoadKg: 0,
});
must(s1.quantity === 9 || s1.reps === 9, 'easy hit +1 rep');
```

- [ ] **Step 2: Run — FAIL until seed/suggest use reps unit**

- [ ] **Step 3: Implement** — when unit is `reps`, `fillBlankRowReps` already exists; do not fill weight. `suggestNextSet` uses `planNextSet` with `unit: 'reps'`. Close writes `lastQuantity` from `row.reps`.

- [ ] **Step 4: Smoke PASS**

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/prototype/hybrid-app/strength-adapter.js apps/mobile/prototype/hybrid-app/strength-engine-v2-2.smoke.mjs
git commit -m "V2.2: rep-only suggestions and template seed"
```

---

### Task 6: Timed holds — countdown seed + suggest seconds

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/strength-one-set-logger.js` (`beginWork` / `prescribedWorkSec`)
- Modify: `apps/mobile/prototype/hybrid-app/strength-adapter.js` if seed writes `row.reps` as seconds
- Modify: `apps/mobile/prototype/hybrid-app/strength-timed-hold.smoke.mjs` **or** extend `strength-engine-v2-2.smoke.mjs`

**Interfaces:**
- Consumes: existing `prescribedWorkSec(t, row, ordinal)` — change it to prefer `row.suggestedSeconds || row.reps || target seconds`

Find `prescribedWorkSec` in `strength-one-set-logger.js` and set:

```js
function prescribedWorkSec(t, row, ordinal) {
  var n = Number(row && (row.suggestedSeconds || row.reps || parseTargetReps(row)));
  if (Number.isFinite(n) && n > 0) return Math.round(n);
  // existing fallback
}
```

After `suggestNextSet` for a time_primary task, write `nextRow.reps` and `nextRow.suggestedSeconds = quantity`.

- [ ] **Step 1: Failing assertion** in v2-2 smoke or timed-hold smoke: after Easy + 30/30, next prescribed work sec is 35.

If timed-hold smoke is too coupled to old `decideNextSet`, add a focused block in `strength-engine-v2-2.smoke.mjs` with vm logger + stub overlay.

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Implement seed/suggest/countdown start only.** Do not rebuild `work-overlay.js` unless start value is ignored (then pass seconds into `beginWork(prescribedWorkSec(...))` — already the pattern).

- [ ] **Step 4: `pnpm run check:strength-timed-hold` still green; v2-2 smoke PASS**

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/prototype/hybrid-app/strength-one-set-logger.js apps/mobile/prototype/hybrid-app/strength-adapter.js apps/mobile/prototype/hybrid-app/strength-engine-v2-2.smoke.mjs
git commit -m "V2.2: timed-hold countdown starts from engine seconds suggestion"
```

---

### Task 7: Verify + CI + cache bump

**Files:**
- Modify: `package.json` — `"check:strength-engine-v2-2": "bash apps/mobile/prototype/hybrid-app/build-strength.sh && node apps/mobile/prototype/hybrid-app/strength-engine-v2-2.smoke.mjs"` and add to `verify` after `check:strength-engine-v2` (or after `check:strength-one-set-logger` if v2.1 smoke not merged yet)
- Modify: `.github/workflows/ci.yml` same script
- Bump `LOCAL_BUILD` + SW `CACHE` together (next integer after current)

- [ ] **Step 1: Add scripts**

- [ ] **Step 2:**

```bash
bash apps/mobile/sync-hybrid-html.sh
pnpm run check:strength-engine-v2-2
pnpm run check:strength-one-set-logger
pnpm run check:strength-timed-hold
pnpm --filter @hybrid/strength-engine test
```

- [ ] **Step 3: `pnpm run verify`**

- [ ] **Step 4: Commit**

```bash
git add package.json .github/workflows/ci.yml apps/mobile
git commit -m "V2.2: CI smoke and cache bump"
```

---

## Spec coverage

| Spec item | Task |
| --- | --- |
| Same rulebook, three units | 1–2 |
| Independent superset brains | 4 |
| Partner rest logger-only | 4 (no engine change) |
| Template seed for reps/seconds | 3, 5 |
| Return last quantity | 3 (`closeV2Session` / seed) |
| Timed miss = short or DNF | 2 |
| Countdown primary, editable | 6 |
| Table A → clamp B | 1–2 |
| Slight manual nudge | V2.1 `updateEffortProfile` + unit stepSize |
| V3 conditioning | **Not this plan** |

## Names (locked)

`SuggestionUnit`, `stepSize`, `defaultBumpTable`, `maxBumpTable`, `suggestionUnitForExercise`, `NextSetPlan.quantity`, `NextSetPlan.unit`.
