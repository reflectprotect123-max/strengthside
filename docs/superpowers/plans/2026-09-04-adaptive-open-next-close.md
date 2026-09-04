# Adaptive Open / Next / Close Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a pure `@hybrid/adaptive` package that implements Open, Next, Close, and Est. 1RM exactly as the 4 Sep recipe lock — tests green, no HTML logger wire yet.

**Architecture:** New workspace package under `packages/adaptive/`. Zero I/O, zero React. Callers pass `dayKind` and log rows in; functions return the next target or the Close anchor. Strength and conditioning share function names and split internally on `kind`. Timed holds and empty recovery stamps are not called (functions return skip/refuse if they are).

**Tech Stack:** TypeScript (ES2022, `tsconfig.base.json`), Vitest 3, pnpm workspace (`packages/*`).

**Spec:** `docs/superpowers/specs/2026-09-03-engine-three-module-redesign.md`

## Global Constraints

- Package name `@hybrid/adaptive`. Do not revive `@hybrid/strength-engine`, `@hybrid/engine`, adapters, Big Mac, or old `decideProgression`.
- Pure functions only — no `fetch`, no Supabase, no `localStorage`.
- `dayKind` is input only; it must never appear on returned objects.
- Next never changes set count or cond round count.
- One typed reps range; no hidden 3–30 cage; no `/calf/i` 20–30 override.
- Est. 1RM is the existing HTML `e1rmValue` formula; it does not pick Next kg.
- Lift Next is the RIR double-progression table in the spec, plate step 2.5 kg. Lift RIR is **not** the cond 1–10 talk-test scale. A single painted number (`min === max`) never changes Next reps.
- Cond Next is target-RPE vs actual-RPE on **work** output only (watts or split). Cond RPE is the locked talk-test 1–10 scale in the spec. Rest duration never changes. `% Max Capacity` on that table is not a watts formula.
- Colocated tests: `src/foo.ts` ↔ `src/foo.test.ts`. No `--passWithNoTests`.
- No HTML / cache bump / Capgo in this plan. Logger wire is a follow-up plan.
- Shared Supabase: no new migrations.
- After the package exists, `pnpm -r test` and `pnpm -r typecheck` must collect it (they already recurse). Do not add a decorative root script that cannot fail.

## File map

| Path | Responsibility |
| --- | --- |
| `packages/adaptive/package.json` | Workspace package, `typecheck` + `test` scripts |
| `packages/adaptive/tsconfig.json` | Extends repo `tsconfig.base.json`, `noEmit` |
| `packages/adaptive/vitest.config.ts` | Collect `src/**/*.test.ts` |
| `packages/adaptive/src/types.ts` | Shared input/result types |
| `packages/adaptive/src/range.ts` | `parseRepRange` |
| `packages/adaptive/src/plates.ts` | `roundToPlate` |
| `packages/adaptive/src/estimate-one-rm.ts` | `estimateOneRm` |
| `packages/adaptive/src/decide-next-set.ts` | `decideNextSet` (lift table + cond RPE) |
| `packages/adaptive/src/open-target.ts` | `openTarget` |
| `packages/adaptive/src/close-anchor.ts` | `closeAnchor` |
| `packages/adaptive/src/index.ts` | Public exports only |

---

### Task 1: Scaffold `@hybrid/adaptive` + `parseRepRange`

**Files:**
- Create: `packages/adaptive/package.json`
- Create: `packages/adaptive/tsconfig.json`
- Create: `packages/adaptive/vitest.config.ts`
- Create: `packages/adaptive/src/types.ts`
- Create: `packages/adaptive/src/range.ts`
- Test: `packages/adaptive/src/range.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `export type RepRange = { min: number; max: number }`; `export function parseRepRange(input: string | null | undefined): RepRange`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { parseRepRange } from './range.ts';

describe('parseRepRange', () => {
  it('blank becomes 8-12', () => {
    expect(parseRepRange(null)).toEqual({ min: 8, max: 12 });
    expect(parseRepRange(undefined)).toEqual({ min: 8, max: 12 });
    expect(parseRepRange('')).toEqual({ min: 8, max: 12 });
    expect(parseRepRange('   ')).toEqual({ min: 8, max: 12 });
  });

  it('plain number is min=max', () => {
    expect(parseRepRange('5')).toEqual({ min: 5, max: 5 });
    expect(parseRepRange('8')).toEqual({ min: 8, max: 8 });
  });

  it('min-max uses both ends', () => {
    expect(parseRepRange('5-7')).toEqual({ min: 5, max: 7 });
    expect(parseRepRange('20-30')).toEqual({ min: 20, max: 30 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @hybrid/adaptive test`  
Expected: FAIL (package does not exist / `parseRepRange` not found)

- [ ] **Step 3: Write minimal implementation**

`packages/adaptive/package.json`:

```json
{
  "name": "@hybrid/adaptive",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "typecheck": "tsc --noEmit -p tsconfig.json",
    "test": "vitest run"
  },
  "devDependencies": {
    "typescript": "^5.9.3",
    "vitest": "^3.2.4"
  }
}
```

`packages/adaptive/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "noEmit": true,
    "declaration": false,
    "declarationMap": false,
    "types": ["vitest/globals"]
  },
  "include": ["src/**/*.ts"]
}
```

`packages/adaptive/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['src/**/*.test.ts'] },
});
```

`packages/adaptive/src/types.ts`:

```ts
export type RepRange = { min: number; max: number };
```

`packages/adaptive/src/range.ts`:

```ts
import type { RepRange } from './types.ts';

export function parseRepRange(input: string | null | undefined): RepRange {
  const raw = (input ?? '').trim();
  if (!raw) return { min: 8, max: 12 };
  const m = raw.match(/^(\d+)\s*-\s*(\d+)$/);
  if (m) {
    const min = Number(m[1]);
    const max = Number(m[2]);
    return { min: Math.min(min, max), max: Math.max(min, max) };
  }
  const n = Number(raw);
  if (Number.isFinite(n) && n > 0) return { min: n, max: n };
  return { min: 8, max: 12 };
}
```

Empty `packages/adaptive/src/index.ts`:

```ts
export { parseRepRange } from './range.ts';
export type { RepRange } from './types.ts';
```

If `verbatimModuleSyntax` rejects `./range.ts` imports, drop the `.ts` suffix in this package and keep relative specifiers without extensions — pick one style and use it in every file.

Then from repo root: `pnpm install` so the workspace lockfile lists `@hybrid/adaptive`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @hybrid/adaptive test`  
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add packages/adaptive pnpm-lock.yaml
git commit -m "feat(adaptive): scaffold package and parse one reps range"
```

---

### Task 2: `estimateOneRm` + plate round

**Files:**
- Create: `packages/adaptive/src/estimate-one-rm.ts`
- Create: `packages/adaptive/src/plates.ts`
- Modify: `packages/adaptive/src/index.ts`
- Test: `packages/adaptive/src/estimate-one-rm.test.ts`
- Test: `packages/adaptive/src/plates.test.ts`

**Interfaces:**
- Consumes: nothing from Task 1
- Produces: `export function estimateOneRm(input: { loadKg: number; reps: number; rir?: number | null }): number`; `export function roundToPlate(kg: number): number`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { estimateOneRm } from './estimate-one-rm.ts';

describe('estimateOneRm', () => {
  it('matches HTML e1rmValue for 40x6 at RIR 2', () => {
    // load * (1 + clamp(reps+rir, 1, 20) / 30), rounded to 0.1
    expect(estimateOneRm({ loadKg: 40, reps: 6, rir: 2 })).toBe(50.7);
  });

  it('blank RIR is 0 extra and is lower than RIR 2', () => {
    const blank = estimateOneRm({ loadKg: 40, reps: 6, rir: null });
    const hard = estimateOneRm({ loadKg: 40, reps: 6, rir: 0 });
    const easy = estimateOneRm({ loadKg: 40, reps: 6, rir: 2 });
    expect(blank).toBe(hard);
    expect(hard).toBeLessThan(easy);
  });
});
```

```ts
import { describe, expect, it } from 'vitest';
import { roundToPlate } from './plates.ts';

describe('roundToPlate', () => {
  it('rounds to 2.5 kg', () => {
    expect(roundToPlate(81)).toBe(80);
    expect(roundToPlate(81.25)).toBe(82.5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @hybrid/adaptive test`  
Expected: FAIL (`estimateOneRm` / `roundToPlate` not defined)

- [ ] **Step 3: Write minimal implementation**

```ts
export function estimateOneRm(input: {
  loadKg: number;
  reps: number;
  rir?: number | null;
}): number {
  const w = input.loadKg;
  const r = input.reps;
  if (!w || !r) return 0;
  const reserve = input.rir == null || Number.isNaN(input.rir) ? 0 : input.rir;
  const effective = Math.max(1, Math.min(20, r + Math.max(0, Math.min(10, reserve))));
  return Math.round(w * (1 + effective / 30) * 10) / 10;
}
```

```ts
export function roundToPlate(kg: number): number {
  return Math.round(kg / 2.5) * 2.5;
}
```

Re-export both from `index.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @hybrid/adaptive test`  
Expected: PASS including 50.7 for 40×6 @ RIR 2

- [ ] **Step 5: Commit**

```bash
git add packages/adaptive/src
git commit -m "feat(adaptive): Est. 1RM scoreboard and 2.5 kg plates"
```

---

### Task 3: Lift Next — hit the top

**Files:**
- Create: `packages/adaptive/src/decide-next-set.ts`
- Modify: `packages/adaptive/src/types.ts`
- Modify: `packages/adaptive/src/index.ts`
- Test: `packages/adaptive/src/decide-next-set.test.ts`

**Interfaces:**
- Consumes: `parseRepRange`, `roundToPlate`
- Produces:

```ts
export type DayKind = 'strength' | 'conditioning' | 'recovery';

export type LiftNextInput = {
  kind: 'lift';
  dayKind: DayKind;
  range: RepRange;
  logged: { loadKg: number; reps: number; rir?: number | null };
};

export type CondNextInput = {
  kind: 'cond';
  dayKind: DayKind;
  modality: 'watts' | 'split';
  targetRpe: RepRange;
  actualRpe: number;
  stopped?: boolean;
  currentWatts?: number;
  currentSplitSec?: number;
};

export type HoldNextInput = { kind: 'hold' };

export type DecideNextSetInput = LiftNextInput | CondNextInput | HoldNextInput;

export type DecideNextSetResult =
  | { ok: true; loadKg: number; reps: number }
  | { ok: true; watts: number }
  | { ok: true; splitSec: number }
  | { ok: true; skipped: true }
  | { ok: false; reason: 'reps_out_of_sanity' | 'wrong_day' };
```

`decideNextSet` must not put `dayKind` or `setCount` on the result.

- [ ] **Step 1: Write the failing tests** (lift hit-top cases only; stub cond/hold to skip or throw until later tasks)

```ts
import { describe, expect, it } from 'vitest';
import { decideNextSet } from './decide-next-set.ts';

const r812 = { min: 8, max: 12 };

function lift(reps: number, rir: number | null, range = r812, loadKg = 80) {
  return decideNextSet({
    kind: 'lift',
    dayKind: 'strength',
    range,
    logged: { loadKg, reps, rir },
  });
}

describe('decideNextSet lift — hit the top', () => {
  it('easy 12 on 8-12 adds 2.5 and returns to min', () => {
    expect(lift(12, 4)).toEqual({ ok: true, loadKg: 82.5, reps: 8 });
  });

  it('medium 12 on 8-12 adds 2.5 and min+2', () => {
    expect(lift(12, 2)).toEqual({ ok: true, loadKg: 82.5, reps: 10 });
  });

  it('grind 12 on 8-12 keeps kg and tries the top again', () => {
    expect(lift(12, 0)).toEqual({ ok: true, loadKg: 80, reps: 12 });
  });

  it('easy 5 on a typed 5 adds 2.5 and stays at 5', () => {
    expect(lift(5, 4, { min: 5, max: 5 })).toEqual({
      ok: true,
      loadKg: 82.5,
      reps: 5,
    });
  });

  it('medium 5 on a typed 5 adds 2.5 and stays at 5 (no push reps up)', () => {
    expect(lift(5, 2, { min: 5, max: 5 })).toEqual({
      ok: true,
      loadKg: 82.5,
      reps: 5,
    });
  });

  it('logged 6 on a painted 5 still Next 5', () => {
    expect(lift(6, 3, { min: 5, max: 5 })).toEqual({
      ok: true,
      loadKg: 82.5,
      reps: 5,
    });
  });

  it('medium 7 on 5-7 adds 2.5 and min+1', () => {
    expect(lift(7, 2, { min: 5, max: 7 })).toEqual({
      ok: true,
      loadKg: 82.5,
      reps: 6,
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @hybrid/adaptive test src/decide-next-set.test.ts`  
Expected: FAIL (`decideNextSet` not defined)

- [ ] **Step 3: Write minimal implementation**

Implement only the lift branch:

- Blank RIR → 0.
- `reps < 1` or `reps >= 80` → `{ ok: false, reason: 'reps_out_of_sanity' }` (needed in Task 4; can land now).
- `dayKind !== 'strength'` for `kind: 'lift'` → `{ ok: false, reason: 'wrong_day' }`.
- Hit top when `logged.reps >= range.max`.
- If `range.min === range.max`, next reps are **always** that number. Kg still follows easy/medium (+2.5) / grind (hold) / under (−2.5). Do not push reps up even if they logged more than the painted number.
- Easy RIR `>= 3` → `roundToPlate(load+2.5)`, reps `range.min`.
- Medium RIR `=== 2` → `load+2.5`; if min===max, reps stay min; else next reps = `min + ((max-min) >= 4 ? 2 : 1)` capped at max.
- Hard RIR `<= 1` → same load, reps `range.max` (which equals min on a single number).
- `kind: 'hold'` → `{ ok: true, skipped: true }` so later hold tests compile.
- `kind: 'cond'` may throw or return skipped until Task 7 — do not write watts math yet unless tests require it.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @hybrid/adaptive test src/decide-next-set.test.ts`  
Expected: PASS hit-top cases

- [ ] **Step 5: Commit**

```bash
git add packages/adaptive/src
git commit -m "feat(adaptive): lift Next when you hit the top of the range"
```

---

### Task 4: Lift Next — middle, under min, sanity

**Files:**
- Modify: `packages/adaptive/src/decide-next-set.ts`
- Modify: `packages/adaptive/src/decide-next-set.test.ts`

**Interfaces:**
- Consumes: `decideNextSet` from Task 3
- Produces: same signatures; middle / under-min / refuse 0 and 80

- [ ] **Step 1: Write the failing tests** (append to `decide-next-set.test.ts`)

```ts
describe('decideNextSet lift — middle and under', () => {
  it('middle + easy keeps kg and same reps (no jump)', () => {
    expect(lift(10, 3)).toEqual({ ok: true, loadKg: 80, reps: 10 });
  });

  it('middle + grind keeps kg and returns to min', () => {
    expect(lift(10, 0)).toEqual({ ok: true, loadKg: 80, reps: 8 });
  });

  it('under min drops 2.5 and returns to min', () => {
    expect(lift(6, 2)).toEqual({ ok: true, loadKg: 77.5, reps: 8 });
  });

  it('refuses 0 and 80 reps', () => {
    expect(lift(0, 2)).toEqual({ ok: false, reason: 'reps_out_of_sanity' });
    expect(lift(80, 2)).toEqual({ ok: false, reason: 'reps_out_of_sanity' });
  });

  it('does not return setCount', () => {
    const next = lift(12, 4);
    expect(next).not.toHaveProperty('setCount');
    expect(next).not.toHaveProperty('dayKind');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @hybrid/adaptive test src/decide-next-set.test.ts`  
Expected: FAIL on middle/under until those branches exist

- [ ] **Step 3: Write minimal implementation**

- Middle: `range.min <= reps < range.max`. RIR `>= 2` → same kg, same reps. RIR `<= 1` → same kg, `range.min`.
- Under: `reps < range.min` → `roundToPlate(load-2.5)`, reps `range.min`.
- Do not clamp into a 3–30 band.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @hybrid/adaptive test src/decide-next-set.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/adaptive/src/decide-next-set.ts packages/adaptive/src/decide-next-set.test.ts
git commit -m "feat(adaptive): lift Next middle, under-min, and sanity refuse"
```

---

### Task 5: `openTarget` (lifts)

**Files:**
- Create: `packages/adaptive/src/open-target.ts`
- Modify: `packages/adaptive/src/index.ts`
- Test: `packages/adaptive/src/open-target.test.ts`

**Interfaces:**
- Consumes: `parseRepRange`
- Produces:

```ts
export type CloseLiftAnchor = { loadKg: number; reps: number; e1rmKg: number };

export type OpenTargetInput =
  | {
      kind: 'lift';
      dayKind: DayKind;
      rangeText: string | null;
      typedKg: number | null;
      typedReps: number | null;
      lastClose: CloseLiftAnchor | null;
    }
  | { kind: 'hold' }
  | {
      kind: 'cond';
      dayKind: DayKind;
      modality: 'watts' | 'split';
      typedWatts: number | null;
      typedSplitSec: number | null;
      lastClose: { watts?: number; splitSec?: number } | null;
    };

export type OpenTargetResult =
  | { ok: true; loadKg: number | null; reps: number }
  | { ok: true; watts: number | null }
  | { ok: true; splitSec: number | null }
  | { ok: true; skipped: true }
  | { ok: false; reason: 'wrong_day' };

export function openTarget(input: OpenTargetInput): OpenTargetResult;
```

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { openTarget } from './open-target.ts';

describe('openTarget lift', () => {
  it('first-ever blank range: reps 8, kg blank', () => {
    expect(
      openTarget({
        kind: 'lift',
        dayKind: 'strength',
        rangeText: null,
        typedKg: null,
        typedReps: null,
        lastClose: null,
      }),
    ).toEqual({ ok: true, loadKg: null, reps: 8 });
  });

  it('typed kg wins over last Close', () => {
    expect(
      openTarget({
        kind: 'lift',
        dayKind: 'strength',
        rangeText: '8-12',
        typedKg: 40,
        typedReps: null,
        lastClose: { loadKg: 80, reps: 10, e1rmKg: 100 },
      }),
    ).toEqual({ ok: true, loadKg: 40, reps: 10 });
  });

  it('uses last Close reps when logger reps are blank', () => {
    expect(
      openTarget({
        kind: 'lift',
        dayKind: 'strength',
        rangeText: '8-12',
        typedKg: null,
        typedReps: null,
        lastClose: { loadKg: 82.5, reps: 8, e1rmKg: 110 },
      }),
    ).toEqual({ ok: true, loadKg: 82.5, reps: 8 });
  });

  it('hold skips', () => {
    expect(openTarget({ kind: 'hold' })).toEqual({ ok: true, skipped: true });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @hybrid/adaptive test src/open-target.test.ts`  
Expected: FAIL (`openTarget` not defined)

- [ ] **Step 3: Write minimal implementation**

Lift Open:

```text
range = parseRepRange(rangeText)
reps  = typedReps ?? lastClose.reps ?? range.min
kg    = typedKg ?? lastClose.loadKg ?? null
```

If `kind: 'lift'` and `dayKind !== 'strength'` → `wrong_day`.  
Do not compute kg from Est. 1RM. Cond Open can return last Close / typed / null; add a tiny cond case if needed so the type compiles (`typedWatts ?? lastClose.watts ?? null`).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @hybrid/adaptive test src/open-target.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/adaptive/src
git commit -m "feat(adaptive): Open uses typed kg, else last Close, else blank"
```

---

### Task 6: `closeAnchor`

**Files:**
- Create: `packages/adaptive/src/close-anchor.ts`
- Modify: `packages/adaptive/src/index.ts`
- Test: `packages/adaptive/src/close-anchor.test.ts`

**Interfaces:**
- Consumes: `estimateOneRm`
- Produces:

```ts
export type CloseAnchorInput =
  | {
      kind: 'lift';
      lastLogged: { loadKg: number; reps: number; rir?: number | null };
    }
  | { kind: 'hold' }
  | {
      kind: 'cond';
      lastMade: { watts?: number; splitSec?: number };
    };

export type CloseAnchorResult =
  | { ok: true; loadKg: number; reps: number; e1rmKg: number }
  | { ok: true; watts: number }
  | { ok: true; splitSec: number }
  | { ok: true; skipped: true };

export function closeAnchor(input: CloseAnchorInput): CloseAnchorResult;
```

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { closeAnchor } from './close-anchor.ts';
import { estimateOneRm } from './estimate-one-rm.ts';

describe('closeAnchor', () => {
  it('stores last logged lift set only, with that row Est. 1RM', () => {
    const last = { loadKg: 82.5, reps: 8, rir: 3 };
    expect(closeAnchor({ kind: 'lift', lastLogged: last })).toEqual({
      ok: true,
      loadKg: 82.5,
      reps: 8,
      e1rmKg: estimateOneRm(last),
    });
  });

  it('does not add a bonus plate', () => {
    const closed = closeAnchor({
      kind: 'lift',
      lastLogged: { loadKg: 80, reps: 12, rir: 4 },
    });
    expect(closed).toMatchObject({ ok: true, loadKg: 80, reps: 12 });
  });

  it('hold skips', () => {
    expect(closeAnchor({ kind: 'hold' })).toEqual({ ok: true, skipped: true });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @hybrid/adaptive test src/close-anchor.test.ts`  
Expected: FAIL (`closeAnchor` not defined)

- [ ] **Step 3: Write minimal implementation**

Last logged set only. No weekly bump. Cond: return `{ ok: true, watts }` or `{ ok: true, splitSec }` from `lastMade`. Hold: skipped.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @hybrid/adaptive test src/close-anchor.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/adaptive/src
git commit -m "feat(adaptive): Close is last logged set, no secret bump"
```

---

### Task 7: Conditioning Next (watts + split)

**Files:**
- Modify: `packages/adaptive/src/decide-next-set.ts`
- Modify: `packages/adaptive/src/decide-next-set.test.ts`

**Interfaces:**
- Consumes: `DecideNextSetInput` cond branch from Task 3
- Produces: watts/split results; rest duration and round count never on the result

- [ ] **Step 1: Write the failing tests**

```ts
describe('decideNextSet cond', () => {
  const base = {
    kind: 'cond' as const,
    dayKind: 'conditioning' as const,
    modality: 'watts' as const,
    targetRpe: { min: 7, max: 8 },
    currentWatts: 220,
  };

  it('at target holds watts', () => {
    expect(decideNextSet({ ...base, actualRpe: 7 })).toEqual({
      ok: true,
      watts: 220,
    });
  });

  it('too easy adds 3%', () => {
    expect(decideNextSet({ ...base, actualRpe: 5 })).toEqual({
      ok: true,
      watts: 227,
    });
  });

  it('too hard subtracts 5%', () => {
    expect(decideNextSet({ ...base, actualRpe: 9 })).toEqual({
      ok: true,
      watts: 209,
    });
  });

  it('10 or stopped subtracts 8%', () => {
    expect(decideNextSet({ ...base, actualRpe: 10 })).toEqual({
      ok: true,
      watts: 202,
    });
    expect(decideNextSet({ ...base, actualRpe: 8, stopped: true })).toEqual({
      ok: true,
      watts: 202,
    });
  });

  it('split moves by 1s easy/hard and 3s on 10', () => {
    const split = {
      kind: 'cond' as const,
      dayKind: 'conditioning' as const,
      modality: 'split' as const,
      targetRpe: { min: 7, max: 8 },
      currentSplitSec: 120,
    };
    expect(decideNextSet({ ...split, actualRpe: 5 })).toEqual({
      ok: true,
      splitSec: 119,
    });
    expect(decideNextSet({ ...split, actualRpe: 9 })).toEqual({
      ok: true,
      splitSec: 121,
    });
    expect(decideNextSet({ ...split, actualRpe: 10 })).toEqual({
      ok: true,
      splitSec: 123,
    });
  });

  it('does not return rest seconds or round count', () => {
    const next = decideNextSet({ ...base, actualRpe: 7 });
    expect(next).not.toHaveProperty('restSec');
    expect(next).not.toHaveProperty('rounds');
    expect(next).not.toHaveProperty('dayKind');
  });

  it('refuses cond on a strength day', () => {
    expect(
      decideNextSet({ ...base, dayKind: 'strength', actualRpe: 7 }),
    ).toEqual({ ok: false, reason: 'wrong_day' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @hybrid/adaptive test src/decide-next-set.test.ts`  
Expected: FAIL until cond math exists (227 from `Math.round(220 * 1.03)`, 209 from `Math.round(220 * 0.95)`, 202 from `Math.round(220 * 0.92)`)

- [ ] **Step 3: Write minimal implementation**

```ts
function condFactor(actual: number, target: RepRange, stopped?: boolean): 'hold' | 'up' | 'down' | 'cut' {
  if (stopped || actual >= 10) return 'cut';
  if (actual < target.min) return 'up';
  if (actual > target.max) return 'down';
  return 'hold';
}
```

Watts: hold / `round(w*1.03)` / `round(w*0.95)` / `round(w*0.92)`.  
Split: hold / −1 / +1 / +3 seconds.  
`kind: 'cond'` requires `dayKind === 'conditioning'`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @hybrid/adaptive test src/decide-next-set.test.ts`  
Expected: PASS including 227 / 209 / 202

- [ ] **Step 5: Commit**

```bash
git add packages/adaptive/src/decide-next-set.ts packages/adaptive/src/decide-next-set.test.ts
git commit -m "feat(adaptive): cond Next from work RPE vs painted target"
```

---

### Task 8: Public barrel + verify collects the package

**Files:**
- Modify: `packages/adaptive/src/index.ts` (must export `parseRepRange`, `estimateOneRm`, `roundToPlate`, `openTarget`, `decideNextSet`, `closeAnchor`, and public types)
- Test: `packages/adaptive/src/index.test.ts`

**Interfaces:**
- Consumes: all prior exports
- Produces: the public API the HTML follow-up plan will import

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import {
  closeAnchor,
  decideNextSet,
  estimateOneRm,
  openTarget,
  parseRepRange,
} from './index.ts';

describe('public API', () => {
  it('exports the three modules plus estimate and range', () => {
    expect(typeof parseRepRange).toBe('function');
    expect(typeof estimateOneRm).toBe('function');
    expect(typeof openTarget).toBe('function');
    expect(typeof decideNextSet).toBe('function');
    expect(typeof closeAnchor).toBe('function');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @hybrid/adaptive test src/index.test.ts`  
Expected: FAIL only if a name is missing from the barrel

- [ ] **Step 3: Write minimal implementation**

`index.ts` re-exports every public function and type. Run `pnpm --filter @hybrid/adaptive typecheck`. From repo root run `pnpm run typecheck` and `pnpm run test` and confirm `@hybrid/adaptive` appears in the recursive test output. Root `pnpm run verify` should stay green (package tests are already inside `pnpm -r test`; do not add `--passWithNoTests`).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @hybrid/adaptive test && pnpm run typecheck`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/adaptive
git commit -m "feat(adaptive): export Open Next Close for the athlete app"
```

---

## Out of this plan (follow-up)

- Bundle `@hybrid/adaptive` into the Hybrid HTML logger and call it after Log / Finish.
- Cache bump, `sync-hybrid-html.sh`, Capgo.
- Cond rest overlay copy (rest duration still does not change).
- Est. 1RM label on the lift scoreboard UI.

## Self-review

- Spec tests 1–22 each map to Tasks 1–7 (range, e1RM, hit-top, middle/under/sanity, Open, Close, holds/dayKind, cond watts/split).
- No HTML wire in this plan (spec: tests before HTML).
- Names `parseRepRange`, `estimateOneRm`, `roundToPlate`, `openTarget`, `decideNextSet`, `closeAnchor` are consistent across tasks.
- No TBD / “add error handling” / “similar to Task N” leftovers.
