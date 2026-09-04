# Adaptive Open / Next / Close Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **TDD:** No production code without a failing test first. Watch it fail, then write the minimum to pass. Colocated tests: `src/foo.ts` ↔ `src/foo.test.ts`. No `--passWithNoTests`.
>
> **Worktrees:** If executing in isolation, create the worktree via `using-git-worktrees` first. Stay on the current feature branch if already there.

**Goal:** Ship `@hybrid/adaptive` (pure Open / Next / Close) that matches the 4 Sep recipe, then wire it into the Hybrid HTML logger so lifts use RIR double progression and conditioning uses work-only talk-test RPE.

**Architecture:** New workspace package under `packages/adaptive/` — zero I/O, zero React. HTML is the only caller. Strength and conditioning share `openTarget`, `decideNextSet`, `closeAnchor` and split on `kind`. Timed holds and empty recovery stamps are never called (skip/refuse if they are). After package tests are green, esbuild an IIFE bundle for `apps/mobile/prototype/hybrid-app/`, then `bash apps/mobile/sync-hybrid-html.sh` and bump cache.

**Tech Stack:** TypeScript ES2022 (`tsconfig.base.json`), Vitest 3, pnpm workspace `packages/*`, Hybrid HTML app, esbuild IIFE, colocated `*.smoke.mjs`.

**Spec:** `docs/superpowers/specs/2026-09-03-engine-three-module-redesign.md`

## Global Constraints

- Package name `@hybrid/adaptive`. Do not revive `@hybrid/strength-engine`, `@hybrid/engine`, adapters, Big Mac, or old `decideProgression`.
- Pure functions only — no `fetch`, no Supabase, no `localStorage`.
- `dayKind` is input only; it must never appear on returned objects.
- Next never changes set count or cond round count. Rest seconds never appear on Next.
- One typed reps range **or** a single number. Blank → `{ min: 8, max: 12 }`. No hidden 3–30 cage. No `/calf/i` 20–30 override.
- Single number (`min === max`): same kg rules; **Next reps never change**. Logged extra reps still Next that number.
- Range (`min < max`): double progression via RIR (hit top / middle / under min) at ±2.5 kg plates.
- Lift RIR is **not** cond talk-test 1–10. Blank lift RIR = 0 (grind).
- Est. 1RM = HTML `e1rmValue`: `load × (1 + clamp(reps+rir,1,20) / 30)` rounded to 0.1 kg. Scoreboard + Close. **Not** Next kg.
- Cond: slide after **work** only. Rower/ski = split. Bike/Echo = watts. Easy → +3% W or −1 s/500 m. Hold inside painted band. Hard → −5% W or +1 s. 10 or stopped → −8% W or +3 s. `% Max Capacity` on the talk-test table is copy, not a watts formula.
- 15 s hard / 45 s easy: Next must not return a new rest duration. If still cooked at the next hard, cut **work** (treat as too hard), do not lengthen rest.
- Holds: no Open / Next / Close / Est. 1RM. Existing `WorkOverlay` countdown stays.
- Typed kg / typed watts / typed split always win Open.
- Close is last logged work only. No weekly bump. No layoff reset.
- Athlete edit path: `apps/mobile/prototype/hybrid-app/index.html` then `bash apps/mobile/sync-hybrid-html.sh`. `LOCAL_BUILD` and SW `CACHE` move together.
- Shared Supabase: no new migrations. No nutrition / coach / pain product / LLM decide.
- Phase A (Tasks 1–8) must be green before Phase B (Tasks 9–14). Spec: package tests before HTML wire.

## File map

| Path | Responsibility |
| --- | --- |
| `packages/adaptive/package.json` | Workspace package; `typecheck` + `test` |
| `packages/adaptive/tsconfig.json` | Extends `tsconfig.base.json`, `noEmit` |
| `packages/adaptive/vitest.config.ts` | Collect `src/**/*.test.ts` |
| `packages/adaptive/src/types.ts` | Shared input/result types |
| `packages/adaptive/src/range.ts` | `parseRepRange` |
| `packages/adaptive/src/plates.ts` | `roundToPlate` |
| `packages/adaptive/src/estimate-one-rm.ts` | `estimateOneRm` |
| `packages/adaptive/src/decide-next-set.ts` | `decideNextSet` |
| `packages/adaptive/src/open-target.ts` | `openTarget` |
| `packages/adaptive/src/close-anchor.ts` | `closeAnchor` |
| `packages/adaptive/src/index.ts` | Public barrel |
| `scripts/bundle-adaptive.mjs` | esbuild IIFE → `adaptive-bundle.js` |
| `apps/mobile/prototype/hybrid-app/adaptive-bundle.js` | Generated; do not hand-edit |
| `apps/mobile/prototype/hybrid-app/index.html` | Call Open/Next/Close after Log / Finish |
| `apps/mobile/prototype/hybrid-app/adaptive-logger.smoke.mjs` | Source smokes for wire |
| `package.json` (root) | `build` runs bundle; add smoke to `verify` |

Use **extensionless** relative imports (`from './range.js'` is wrong if files are `.ts` — use `from './range'` so Vitest + `tsc --noEmit` agree without `allowImportingTsExtensions`).

---

# Phase A — `@hybrid/adaptive` (must be green first)

### Task 1: Scaffold + `parseRepRange`

**Files:**
- Create: `packages/adaptive/package.json`
- Create: `packages/adaptive/tsconfig.json`
- Create: `packages/adaptive/vitest.config.ts`
- Create: `packages/adaptive/src/types.ts`
- Create: `packages/adaptive/src/range.ts`
- Create: `packages/adaptive/src/index.ts`
- Test: `packages/adaptive/src/range.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `export type RepRange = { min: number; max: number }`; `export function parseRepRange(input: string | null | undefined): RepRange`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { parseRepRange } from './range';

describe('parseRepRange', () => {
  it('blank becomes 8-12', () => {
    expect(parseRepRange(null)).toEqual({ min: 8, max: 12 });
    expect(parseRepRange(undefined)).toEqual({ min: 8, max: 12 });
    expect(parseRepRange('')).toEqual({ min: 8, max: 12 });
    expect(parseRepRange('   ')).toEqual({ min: 8, max: 12 });
  });

  it('plain number is min=max (single number, no push-reps band)', () => {
    expect(parseRepRange('5')).toEqual({ min: 5, max: 5 });
    expect(parseRepRange('1')).toEqual({ min: 1, max: 1 });
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
Expected: FAIL (package missing / `parseRepRange` not found)

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

export type DayKind = 'strength' | 'conditioning' | 'recovery';
```

`packages/adaptive/src/range.ts`:

```ts
import type { RepRange } from './types';

export function parseRepRange(input: string | null | undefined): RepRange {
  const raw = (input ?? '').trim();
  if (!raw) return { min: 8, max: 12 };
  const m = raw.match(/^(\d+)\s*-\s*(\d+)$/);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    return { min: Math.min(a, b), max: Math.max(a, b) };
  }
  const n = Number(raw);
  if (Number.isFinite(n) && n > 0) return { min: n, max: n };
  return { min: 8, max: 12 };
}
```

`packages/adaptive/src/index.ts`:

```ts
export type { DayKind, RepRange } from './types';
export { parseRepRange } from './range';
```

From repo root: `pnpm install` so the lockfile lists `@hybrid/adaptive`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @hybrid/adaptive test`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/adaptive pnpm-lock.yaml
git commit -m "feat(adaptive): scaffold package and parse one reps range"
```

---

### Task 2: `estimateOneRm` + `roundToPlate`

**Files:**
- Create: `packages/adaptive/src/estimate-one-rm.ts`
- Create: `packages/adaptive/src/plates.ts`
- Modify: `packages/adaptive/src/index.ts`
- Test: `packages/adaptive/src/estimate-one-rm.test.ts`
- Test: `packages/adaptive/src/plates.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `export function estimateOneRm(input: { loadKg: number; reps: number; rir?: number | null }): number`; `export function roundToPlate(kg: number): number`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { estimateOneRm } from './estimate-one-rm';

describe('estimateOneRm', () => {
  it('matches HTML e1rmValue for 40x6 at RIR 2', () => {
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
import { roundToPlate } from './plates';

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
  const reserve = input.rir == null || Number.isNaN(Number(input.rir)) ? 0 : Number(input.rir);
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
Expected: PASS including 50.7

- [ ] **Step 5: Commit**

```bash
git add packages/adaptive/src
git commit -m "feat(adaptive): Est. 1RM scoreboard and 2.5 kg plates"
```

---

### Task 3: Lift Next — range hit the top + single number

**Files:**
- Create: `packages/adaptive/src/decide-next-set.ts`
- Modify: `packages/adaptive/src/types.ts`
- Modify: `packages/adaptive/src/index.ts`
- Test: `packages/adaptive/src/decide-next-set.test.ts`

**Interfaces:**
- Consumes: `RepRange`, `DayKind`, `roundToPlate`
- Produces:

```ts
export type LiftLogged = { loadKg: number; reps: number; rir?: number | null };

export type LiftNextInput = {
  kind: 'lift';
  dayKind: DayKind;
  range: RepRange;
  logged: LiftLogged;
};

export type CondNextInput = {
  kind: 'cond';
  dayKind: DayKind;
  modality: 'watts' | 'split';
  targetRpe: RepRange;
  actualRpe: number;
  stopped?: boolean;
  cooked?: boolean;
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

export function decideNextSet(input: DecideNextSetInput): DecideNextSetResult;
```

Must not put `dayKind`, `setCount`, `restSec`, or `rounds` on the result.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { decideNextSet } from './decide-next-set';

const r812 = { min: 8, max: 12 };

function lift(
  reps: number,
  rir: number | null,
  range = r812,
  loadKg = 80,
) {
  return decideNextSet({
    kind: 'lift',
    dayKind: 'strength',
    range,
    logged: { loadKg, reps, rir },
  });
}

describe('decideNextSet lift — hit the top of a range', () => {
  it('easy 12 on 8-12 adds 2.5 and returns to min', () => {
    expect(lift(12, 4)).toEqual({ ok: true, loadKg: 82.5, reps: 8 });
  });

  it('medium 12 on 8-12 adds 2.5 and min+2', () => {
    expect(lift(12, 2)).toEqual({ ok: true, loadKg: 82.5, reps: 10 });
  });

  it('grind 12 on 8-12 keeps kg and tries the top again', () => {
    expect(lift(12, 0)).toEqual({ ok: true, loadKg: 80, reps: 12 });
  });

  it('medium 7 on 5-7 adds 2.5 and min+1', () => {
    expect(lift(7, 2, { min: 5, max: 7 })).toEqual({
      ok: true,
      loadKg: 82.5,
      reps: 6,
    });
  });
});

describe('decideNextSet lift — single number never pushes reps', () => {
  const five = { min: 5, max: 5 };

  it('easy 5 adds 2.5 and stays at 5', () => {
    expect(lift(5, 4, five)).toEqual({ ok: true, loadKg: 82.5, reps: 5 });
  });

  it('medium 5 adds 2.5 and stays at 5 not 6', () => {
    expect(lift(5, 2, five)).toEqual({ ok: true, loadKg: 82.5, reps: 5 });
  });

  it('logged 6 on painted 5 still Next 5', () => {
    expect(lift(6, 3, five)).toEqual({ ok: true, loadKg: 82.5, reps: 5 });
  });

  it('under 4 on painted 5 drops 2.5 and stays at 5', () => {
    expect(lift(4, 2, five)).toEqual({ ok: true, loadKg: 77.5, reps: 5 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @hybrid/adaptive test src/decide-next-set.test.ts`  
Expected: FAIL (`decideNextSet` not defined)

- [ ] **Step 3: Write minimal implementation**

```ts
import { roundToPlate } from './plates';
import type { DecideNextSetInput, DecideNextSetResult, RepRange } from './types';

function rirValue(rir: number | null | undefined): number {
  if (rir == null || Number.isNaN(Number(rir))) return 0;
  return Number(rir);
}

function mediumBump(range: RepRange): number {
  if (range.min >= range.max) return range.min;
  const extra = range.max - range.min >= 4 ? 2 : 1;
  return Math.min(range.max, range.min + extra);
}

export function decideNextSet(input: DecideNextSetInput): DecideNextSetResult {
  if (input.kind === 'hold') return { ok: true, skipped: true };
  if (input.kind === 'cond') {
    return { ok: false, reason: 'wrong_day' };
  }
  if (input.dayKind !== 'strength') return { ok: false, reason: 'wrong_day' };
  const reps = input.logged.reps;
  if (reps < 1 || reps >= 80) return { ok: false, reason: 'reps_out_of_sanity' };
  const rir = rirValue(input.logged.rir);
  const kg = input.logged.loadKg;
  const { min, max } = input.range;
  const single = min === max;
  const nextRepsSingle = min;

  if (reps < min) {
    return { ok: true, loadKg: roundToPlate(kg - 2.5), reps: single ? nextRepsSingle : min };
  }

  if (reps >= max) {
    if (rir >= 3) {
      return { ok: true, loadKg: roundToPlate(kg + 2.5), reps: single ? nextRepsSingle : min };
    }
    if (rir === 2) {
      return {
        ok: true,
        loadKg: roundToPlate(kg + 2.5),
        reps: single ? nextRepsSingle : mediumBump(input.range),
      };
    }
    return { ok: true, loadKg: kg, reps: single ? nextRepsSingle : max };
  }

  // middle — Task 4 fills this; return a dummy that fails middle tests until then
  return { ok: true, loadKg: kg, reps };
}
```

Put the `DecideNextSet*` types in `types.ts` and import them. Hold skip now so later hold tests compile. Cond can `wrong_day` until Task 7.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @hybrid/adaptive test src/decide-next-set.test.ts`  
Expected: PASS hit-top + single-number cases. Middle tests are not in this file yet.

- [ ] **Step 5: Commit**

```bash
git add packages/adaptive/src
git commit -m "feat(adaptive): lift Next at range top; single number keeps reps"
```

---

### Task 4: Lift Next — middle, under min, sanity, no setCount

**Files:**
- Modify: `packages/adaptive/src/decide-next-set.ts`
- Modify: `packages/adaptive/src/decide-next-set.test.ts`

**Interfaces:**
- Consumes: `decideNextSet` from Task 3
- Produces: same signatures

- [ ] **Step 1: Write the failing tests** (append)

```ts
describe('decideNextSet lift — middle and under on a range', () => {
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

  it('does not return setCount or dayKind', () => {
    const next = lift(12, 4);
    expect(next).not.toHaveProperty('setCount');
    expect(next).not.toHaveProperty('dayKind');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @hybrid/adaptive test src/decide-next-set.test.ts`  
Expected: FAIL on middle/under until those branches exist (if Task 3 already implemented under-min for singles, range under-min may already pass)

- [ ] **Step 3: Write minimal implementation**

Middle: `min <= reps < max`. RIR `>= 2` → same kg, same reps. RIR `<= 1` → same kg, `min`. Do not clamp into a 3–30 band.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @hybrid/adaptive test src/decide-next-set.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/adaptive/src/decide-next-set.ts packages/adaptive/src/decide-next-set.test.ts
git commit -m "feat(adaptive): lift Next middle, under-min, and sanity refuse"
```

---

### Task 5: `openTarget` (lifts + hold skip)

**Files:**
- Create: `packages/adaptive/src/open-target.ts`
- Modify: `packages/adaptive/src/types.ts`
- Modify: `packages/adaptive/src/index.ts`
- Test: `packages/adaptive/src/open-target.test.ts`

**Interfaces:**
- Consumes: `parseRepRange`, `DayKind`

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
import { openTarget } from './open-target';

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

  it('uses last Close when logger boxes are blank', () => {
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

```text
range = parseRepRange(rangeText)
reps  = typedReps ?? lastClose.reps ?? range.min
kg    = typedKg ?? lastClose.loadKg ?? null
```

If `kind: 'lift'` and `dayKind !== 'strength'` → `wrong_day`. Do **not** compute kg from Est. 1RM. Cond Open: `typedWatts ?? lastClose.watts ?? null` (or split). Hold: skipped.

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

```ts
export type CloseAnchorInput =
  | { kind: 'lift'; lastLogged: { loadKg: number; reps: number; rir?: number | null } }
  | { kind: 'hold' }
  | { kind: 'cond'; lastMade: { watts?: number; splitSec?: number } };

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
import { closeAnchor } from './close-anchor';
import { estimateOneRm } from './estimate-one-rm';

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

Last logged set only. No weekly bump. Cond: `{ ok: true, watts }` or `{ ok: true, splitSec }` from `lastMade`. Hold: skipped.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @hybrid/adaptive test src/close-anchor.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/adaptive/src
git commit -m "feat(adaptive): Close is last logged set, no secret bump"
```

---

### Task 7: Conditioning Next (talk-test vs painted work RPE)

**Files:**
- Modify: `packages/adaptive/src/decide-next-set.ts`
- Modify: `packages/adaptive/src/decide-next-set.test.ts`

**Interfaces:**
- Consumes: `CondNextInput` from Task 3
- Produces: watts/split results; never `restSec` or `rounds`

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

  it('at target (talk-test 7-8) holds watts', () => {
    expect(decideNextSet({ ...base, actualRpe: 7 })).toEqual({ ok: true, watts: 220 });
  });

  it('too easy (5 vs 7-8) adds 3%', () => {
    expect(decideNextSet({ ...base, actualRpe: 5 })).toEqual({ ok: true, watts: 227 });
  });

  it('too hard (9) subtracts 5%', () => {
    expect(decideNextSet({ ...base, actualRpe: 9 })).toEqual({ ok: true, watts: 209 });
  });

  it('10 or stopped subtracts 8%', () => {
    expect(decideNextSet({ ...base, actualRpe: 10 })).toEqual({ ok: true, watts: 202 });
    expect(decideNextSet({ ...base, actualRpe: 8, stopped: true })).toEqual({
      ok: true,
      watts: 202,
    });
  });

  it('still cooked at next hard cuts work, does not return restSec', () => {
    const next = decideNextSet({ ...base, actualRpe: 8, cooked: true });
    expect(next).toEqual({ ok: true, watts: 209 });
    expect(next).not.toHaveProperty('restSec');
    expect(next).not.toHaveProperty('rounds');
  });

  it('split moves by 1s easy/hard and 3s on 10', () => {
    const split = {
      kind: 'cond' as const,
      dayKind: 'conditioning' as const,
      modality: 'split' as const,
      targetRpe: { min: 7, max: 8 },
      currentSplitSec: 120,
    };
    expect(decideNextSet({ ...split, actualRpe: 5 })).toEqual({ ok: true, splitSec: 119 });
    expect(decideNextSet({ ...split, actualRpe: 9 })).toEqual({ ok: true, splitSec: 121 });
    expect(decideNextSet({ ...split, actualRpe: 10 })).toEqual({ ok: true, splitSec: 123 });
  });

  it('refuses cond on a strength day', () => {
    expect(decideNextSet({ ...base, dayKind: 'strength', actualRpe: 7 })).toEqual({
      ok: false,
      reason: 'wrong_day',
    });
  });
});
```

Watts math: `Math.round(220 * 1.03) === 227`, `Math.round(220 * 0.95) === 209`, `Math.round(220 * 0.92) === 202`.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @hybrid/adaptive test src/decide-next-set.test.ts`  
Expected: FAIL until cond math exists

- [ ] **Step 3: Write minimal implementation**

```ts
function condBand(
  actual: number,
  target: RepRange,
  stopped?: boolean,
  cooked?: boolean,
): 'hold' | 'up' | 'down' | 'cut' {
  if (stopped || actual >= 10) return 'cut';
  if (cooked) return 'down';
  if (actual < target.min) return 'up';
  if (actual > target.max) return 'down';
  return 'hold';
}
```

Watts: hold / `round(w*1.03)` / `round(w*0.95)` / `round(w*0.92)`.  
Split: hold / −1 / +1 / +3.  
`kind: 'cond'` requires `dayKind === 'conditioning'`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @hybrid/adaptive test src/decide-next-set.test.ts`  
Expected: PASS including 227 / 209 / 202

- [ ] **Step 5: Commit**

```bash
git add packages/adaptive/src/decide-next-set.ts packages/adaptive/src/decide-next-set.test.ts
git commit -m "feat(adaptive): cond Next from talk-test RPE vs painted work"
```

---

### Task 8: Public barrel + `pnpm -r` collects the package

**Files:**
- Modify: `packages/adaptive/src/index.ts`
- Test: `packages/adaptive/src/index.test.ts`

**Interfaces:**
- Consumes: all prior exports
- Produces: public API HTML will import

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import {
  closeAnchor,
  decideNextSet,
  estimateOneRm,
  openTarget,
  parseRepRange,
  roundToPlate,
} from './index';

describe('public API', () => {
  it('exports the three modules plus estimate, plates, and range', () => {
    expect(typeof parseRepRange).toBe('function');
    expect(typeof estimateOneRm).toBe('function');
    expect(typeof roundToPlate).toBe('function');
    expect(typeof openTarget).toBe('function');
    expect(typeof decideNextSet).toBe('function');
    expect(typeof closeAnchor).toBe('function');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @hybrid/adaptive test src/index.test.ts`  
Expected: FAIL only if a name is missing

- [ ] **Step 3: Write minimal implementation**

Re-export every public function and type from `index.ts`. Run `pnpm --filter @hybrid/adaptive typecheck`. From repo root: `pnpm run typecheck` and `pnpm run test` must show `@hybrid/adaptive`. Root `pnpm run verify` stays green (`pnpm -r test` already collects the package). Change root `"build"` from the blank-slate echo only in Task 9.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @hybrid/adaptive test && pnpm run typecheck`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/adaptive
git commit -m "feat(adaptive): export Open Next Close for the athlete app"
```

**Phase A gate:** all spec tests 1–23 that are package-level are covered. Do not start Phase B red.

---

# Phase B — Hybrid HTML wire

### Task 9: IIFE bundle + smoke that the global exists

**Files:**
- Create: `scripts/bundle-adaptive.mjs`
- Create: `apps/mobile/prototype/hybrid-app/adaptive-bundle.js` (generated)
- Modify: `packages/adaptive/package.json` (add `esbuild` devDependency)
- Modify: root `package.json` `build` script and add `check:adaptive-bundle`
- Create: `apps/mobile/prototype/hybrid-app/adaptive-bundle.smoke.mjs`

**Interfaces:**
- Consumes: `packages/adaptive/src/index.ts`
- Produces: `globalThis.HybridAdaptive` with `decideNextSet`, `openTarget`, `closeAnchor`, `estimateOneRm`, `parseRepRange`

- [ ] **Step 1: Write the failing smoke**

```js
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const bundle = readFileSync(join(dir, 'adaptive-bundle.js'), 'utf8');
const ctx = { HybridAdaptive: undefined };
vm.runInNewContext(bundle, ctx);
if (!ctx.HybridAdaptive?.decideNextSet) throw new Error('HybridAdaptive.decideNextSet missing');
const next = ctx.HybridAdaptive.decideNextSet({
  kind: 'lift',
  dayKind: 'strength',
  range: { min: 8, max: 12 },
  logged: { loadKg: 80, reps: 12, rir: 4 },
});
if (next.loadKg !== 82.5 || next.reps !== 8) throw new Error('bundle Next mismatch');
console.log('adaptive-bundle.smoke: ok');
```

- [ ] **Step 2: Run smoke to verify it fails**

Run: `node apps/mobile/prototype/hybrid-app/adaptive-bundle.smoke.mjs`  
Expected: FAIL (file missing)

- [ ] **Step 3: Write minimal bundle script**

`scripts/bundle-adaptive.mjs`:

```js
import * as esbuild from 'esbuild';

await esbuild.build({
  absWorkingDir: new URL('..', import.meta.url).pathname,
  entryPoints: ['packages/adaptive/src/index.ts'],
  bundle: true,
  format: 'iife',
  globalName: 'HybridAdaptive',
  outfile: 'apps/mobile/prototype/hybrid-app/adaptive-bundle.js',
  platform: 'browser',
  target: 'es2022',
});
```

Add `esbuild` to `packages/adaptive` or root `devDependencies`. Root `"build": "node scripts/bundle-adaptive.mjs"`. Add `"check:adaptive-bundle": "node scripts/bundle-adaptive.mjs && node apps/mobile/prototype/hybrid-app/adaptive-bundle.smoke.mjs"` and append it to `verify` **in this same task** (a check that exists and does not run is worthless).

- [ ] **Step 4: Run smoke to verify it passes**

Run: `pnpm run check:adaptive-bundle`  
Expected: PASS `adaptive-bundle.smoke: ok`

- [ ] **Step 5: Commit**

```bash
git add scripts/bundle-adaptive.mjs apps/mobile/prototype/hybrid-app/adaptive-bundle.js packages/adaptive/package.json package.json pnpm-lock.yaml apps/mobile/prototype/hybrid-app/adaptive-bundle.smoke.mjs
git commit -m "feat(adaptive): bundle Open Next Close for the Hybrid HTML app"
```

---

### Task 10: After Log on a lift, fill the next row from `decideNextSet`

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/index.html` (script tag for `adaptive-bundle.js`; after a working set is marked done, call `HybridAdaptive.decideNextSet` and write next row kg/reps)
- Create: `apps/mobile/prototype/hybrid-app/adaptive-logger.smoke.mjs`
- Modify: `package.json` `verify` to include `check:adaptive-logger`

**Interfaces:**
- Consumes: `HybridAdaptive.decideNextSet`, `parseRepRange`
- Produces: next undone strength row gets `{ weight, reps }` from Next; set count unchanged; hold rows never call it

Find the logger function that marks a set done (today `toggleSet` / Log). After `row.done = true` on a **non-hold** strength row, if there is a next planned row:

```js
let range = HybridAdaptive.parseRepRange(String(t.effort || t.repsRange || t.target || ''));
let next = HybridAdaptive.decideNextSet({
  kind: 'lift',
  dayKind: 'strength',
  range,
  logged: { loadKg: num(row.weight), reps: num(row.reps), rir: row.rir === '' ? null : num(row.rir) },
});
if (next.ok && next.loadKg != null) {
  let nxt = t.rows[i + 1];
  if (nxt && !nxt.done && nxt.targetKind !== 'seconds') {
    nxt.weight = next.loadKg;
    nxt.reps = String(next.reps);
  }
}
```

Use the actual field names already on the task/exercise object for the painted range (builder effort text). Do not invent a second 3–30 clamp. Do not call this on `isHoldRow(r)`.

- [ ] **Step 1: Write the failing smoke**

```js
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const html = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'index.html'), 'utf8');
function must(c, m) { if (!c) throw new Error(m); }
must(html.includes('src="./adaptive-bundle.js"'), 'loads adaptive-bundle.js');
must(html.includes('HybridAdaptive.decideNextSet'), 'Log calls decideNextSet');
must(html.includes("kind:'lift'") || html.includes('kind: "lift"') || html.includes("kind: 'lift'"), 'lift kind');
must(!/isHoldRow\(r\)[\s\S]{0,200}HybridAdaptive\.decideNextSet/.test(html) || html.includes("if(isHoldRow(r)){startHoldCountdown"), 'holds still start countdown, not Next');
console.log('adaptive-logger.smoke: ok');
```

Tune the hold assertion to the real `toggleSet` text after you write it: Hold path must remain `startHoldCountdown` without `decideNextSet`.

- [ ] **Step 2: Run smoke to verify it fails**

Run: `node apps/mobile/prototype/hybrid-app/adaptive-logger.smoke.mjs`  
Expected: FAIL (`loads adaptive-bundle.js` or `decideNextSet`)

- [ ] **Step 3: Write minimal HTML**

Add `<script src="./adaptive-bundle.js"></script>` next to the other prototype scripts. In the Log/done path, call Next as above. Do not change set count. Typed kg on the **current** row stays what they logged; Next writes the **following** row.

- [ ] **Step 4: Run smoke + hold smoke**

Run: `node apps/mobile/prototype/hybrid-app/adaptive-logger.smoke.mjs && node apps/mobile/prototype/hybrid-app/hold-countdown.smoke.mjs`  
Expected: both PASS

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/prototype/hybrid-app/index.html apps/mobile/prototype/hybrid-app/adaptive-logger.smoke.mjs package.json
git commit -m "feat(logger): fill next lift from RIR Next"
```

---

### Task 11: Session Finish → `closeAnchor`; next session `openTarget`

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/index.html` (on session complete, store last logged set per lift; on session start, fill first row from `openTarget`)
- Modify: `apps/mobile/prototype/hybrid-app/adaptive-logger.smoke.mjs`

**Interfaces:**
- Consumes: `closeAnchor`, `openTarget`
- Produces: persisted `{ loadKg, reps, e1rmKg }` keyed by exercise id; Open fills first row; typed kg still wins if the box is non-empty

Persist on `S` (existing local state object) under a small map e.g. `S.adaptiveClose = S.adaptiveClose || {}` keyed by `exerciseId || name`. Do not add Supabase migrations.

- [ ] **Step 1: Write the failing smoke** (append to `adaptive-logger.smoke.mjs`)

```js
must(html.includes('HybridAdaptive.closeAnchor'), 'Finish calls closeAnchor');
must(html.includes('HybridAdaptive.openTarget'), 'session start calls openTarget');
must(html.includes('adaptiveClose') || html.includes('lastClose'), 'stores Close locally');
```

- [ ] **Step 2: Run smoke to verify it fails**

Run: `node apps/mobile/prototype/hybrid-app/adaptive-logger.smoke.mjs`  
Expected: FAIL on `closeAnchor` / `openTarget`

- [ ] **Step 3: Write minimal HTML**

On Finish of a strength task: last **done** non-hold row → `closeAnchor({ kind: 'lift', lastLogged: {...} })` → save. On building the first empty row at session start: `openTarget({ kind: 'lift', dayKind: 'strength', rangeText, typedKg, typedReps, lastClose })`. If Open `loadKg` is null, leave the kg box blank.

- [ ] **Step 4: Run smoke to verify it passes**

Run: `node apps/mobile/prototype/hybrid-app/adaptive-logger.smoke.mjs`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/prototype/hybrid-app/index.html apps/mobile/prototype/hybrid-app/adaptive-logger.smoke.mjs
git commit -m "feat(logger): Close last lift set and Open next session from it"
```

---

### Task 12: Conditioning work slider → `decideNextSet` kind cond

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/index.html` (after a **work** bout, 1–10 slider; call cond Next; write next work watts or split; do not change rest seconds or round count)
- Modify: `apps/mobile/prototype/hybrid-app/adaptive-logger.smoke.mjs`

**Interfaces:**
- Consumes: `decideNextSet` cond branch
- Produces: next work target only

Slider labels (talk test, copy only): 1 conversation … 10 cannot speak. Painted target comes from the card (e.g. 7–8). Rest/easy 45 s is not a second slider.

- [ ] **Step 1: Write the failing smoke**

```js
must(html.includes("kind: 'cond'") || html.includes('kind:"cond"') || html.includes("kind:'cond'"), 'cond Next');
must(html.includes('actualRpe'), 'passes actual RPE');
must(html.includes('modality'), 'watts vs split');
```

- [ ] **Step 2: Run smoke to verify it fails**

Run: `node apps/mobile/prototype/hybrid-app/adaptive-logger.smoke.mjs`  
Expected: FAIL until cond strings exist

- [ ] **Step 3: Write minimal HTML**

After work (not rest): read slider 1–10, `decideNextSet({ kind: 'cond', dayKind: 'conditioning', modality, targetRpe, actualRpe, currentWatts or currentSplitSec, stopped })`. Apply `watts` or `splitSec` to the **next work** target. Leave rest duration unchanged. Intervals: after each hard. Tempo: after the block. Steady: one call mid or at end (same function; HTML decides when).

- [ ] **Step 4: Run smoke to verify it passes**

Run: `node apps/mobile/prototype/hybrid-app/adaptive-logger.smoke.mjs`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/prototype/hybrid-app/index.html apps/mobile/prototype/hybrid-app/adaptive-logger.smoke.mjs
git commit -m "feat(logger): cond work RPE slider moves watts or split only"
```

---

### Task 13: Holds still skip the engine

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/hold-countdown.smoke.mjs` only if the Log path change weakened it
- Modify: `apps/mobile/prototype/hybrid-app/adaptive-logger.smoke.mjs`

**Interfaces:**
- Consumes: existing `WorkOverlay` / `startHoldCountdown`
- Produces: unchanged hold clock; no `decideNextSet` on seconds rows

- [ ] **Step 1: Write / keep failing assertions**

Keep `hold-countdown.smoke.mjs` requiring `startHoldCountdown` and no Next on that path. Add:

```js
must(html.includes("kind: 'hold'") === false || html.includes("kind:'hold'"), 'optional explicit hold skip');
```

Prefer: hold path never reaches `HybridAdaptive` at all.

- [ ] **Step 2: Run both smokes**

Run: `node apps/mobile/prototype/hybrid-app/hold-countdown.smoke.mjs && node apps/mobile/prototype/hybrid-app/adaptive-logger.smoke.mjs`  
Expected: PASS (if fail, fix HTML, do not weaken the hold smoke)

- [ ] **Step 3: Fix HTML if needed**

`if (isHoldRow(r)) { startHoldCountdown(i); return; }` before any `decideNextSet`.

- [ ] **Step 4: Re-run smokes**

Expected: PASS

- [ ] **Step 5: Commit** (only if files changed)

```bash
git add apps/mobile/prototype/hybrid-app
git commit -m "fix(logger): timed holds still skip Open Next Close"
```

---

### Task 14: Sync HTML twins, cache bump, `pnpm run verify`

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/index.html` `LOCAL_BUILD` (v170 → `the-hybrid-athlete-blank-v171`)
- Modify: `apps/mobile/prototype/hybrid-app/service-worker.js` `CACHE` to the same string
- Modify: `handoff.md` cache line to v171
- Synced copies via script: `apps/mobile/THE-Hybrid-App.html`, `apps/mobile/preview-site/*`

**Interfaces:**
- Consumes: Phase B HTML
- Produces: twins in sync; verify green

- [ ] **Step 1: Write the failing sync check** (existing)

Run: `pnpm run check:hybrid-html-sync`  
Expected: FAIL until you bump cache in **both** `LOCAL_BUILD` and `CACHE` and run the sync script

- [ ] **Step 2: Confirm it fails for the right reason**

Mismatched cache or unsynced twins.

- [ ] **Step 3: Bump + sync**

```bash
# set LOCAL_BUILD and CACHE to the-hybrid-athlete-blank-v171 together
bash apps/mobile/sync-hybrid-html.sh
```

Add `check:adaptive-logger` to `verify` if Task 10 did not. Update `handoff.md` cache to v171.

- [ ] **Step 4: Run verify**

Run: `pnpm run verify`  
Expected: PASS (typecheck, package tests, smokes, WHOOP ownership, html sync)

- [ ] **Step 5: Commit**

```bash
git add apps/mobile package.json handoff.md
git commit -m "chore: sync Hybrid HTML and bump blank cache to v171"
```

---

## Out of this plan

- Capgo upload / pointing `live` (ship ritual after verify; owner says when)
- Graphify extract / Obsidian vault (local, gitignored)
- Pain/illness stops, nutrition, coach, restoring deleted engines
- Helms/Zourdos table
- Cond `% Max Capacity` as a watts formula

## Self-review

**Spec coverage**

| Spec | Task |
| --- | ---: |
| `parseRepRange` blank / `5` / `5-7` / `20-30` as typed | 1 |
| `estimateOneRm` = `e1rmValue`; blank RIR = 0 | 2 |
| Range hit-top / middle / under; plates 2.5 | 3, 4 |
| Single number never pushes reps | 3 |
| Sanity 0 / 80; no setCount | 4 |
| Open typed / Close / first-ever 8 blank kg | 5, 6 |
| Holds skip | 3, 5, 6, 13 |
| `dayKind` never in output; wrong day | 3, 7 |
| Cond talk-test vs painted work; rest not in result; cooked cuts work | 7, 12 |
| Barrel + verify collects package | 8 |
| HTML Log / Finish / Open / cond slider / sync | 9–14 |

**Placeholder scan:** no TBD / “similar to Task N” / “add error handling” without code.

**Types:** `decideNextSet`, `openTarget`, `closeAnchor`, `estimateOneRm`, `parseRepRange`, `roundToPlate`, `RepRange`, `DayKind`, `cooked` / `stopped` on cond — same names in later tasks.

**Phase split:** HTML is a second phase because the spec forbids wiring before package tests. One plan so executors do not invent a second recipe.

---

## Execution

Do **not** start Phase A until the owner picks **1** or **2**. Do not invent a second recipe while waiting.

**1. Subagent-Driven (recommended)** — fresh implementer per task, spec+quality review between tasks, `subagent-driven-development`. Continuous until Task 14 or a hard stop (Capgo, shared-DB write, plan so broken every path is a guess).

**2. Inline Execution** — same session, `executing-plans`, batch with checkpoints.

After Task 14: `finishing-a-development-branch` (verify already in Task 14; no Capgo unless the owner says ship).

---

## Skills this plan already applied

| Skill | What it did here |
| --- | --- |
| using-superpowers | Find skills before writing; TDD + writing-plans + execution skills required |
| brainstorming | Architectural. Spec already locked. Do not re-open the recipe |
| writing-plans | This file: file map, bite-sized TDD steps, no placeholders |
| test-driven-development | Iron law on every task; watch fail then implement |
| executing-plans | Option 2 |
| subagent-driven-development | Option 1 |
| finishing-a-development-branch | After Task 14, not before |
| verification-before-completion | Task 14 `pnpm run verify` before any success claim |
| using-git-worktrees | Optional isolation at execution time; stay on this feature branch if already on it |
| frontend-design / ui-ux-pro-max | Not for Phase A. Phase B uses existing logger chrome; do not restyle Home |
| caveman | Owner ELI5; keep athlete-facing copy short if any copy is added |
