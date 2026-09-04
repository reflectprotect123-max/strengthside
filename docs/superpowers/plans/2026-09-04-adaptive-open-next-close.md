# Adaptive Open / Next / Close Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **TDD:** No production code without a failing test first. Watch it fail, then write the minimum to pass. Colocated tests: `src/foo.ts` ↔ `src/foo.test.ts`. No `--passWithNoTests`.
>
> **Worktrees:** If executing in isolation, create the worktree via `using-git-worktrees` first. Stay on the current feature branch if already there.

**Goal:** Ship `@hybrid/adaptive` (pure Open / Next / Close) that matches the 4 Sep recipe, then wire it into the Hybrid HTML logger so lifts use RIR double progression and conditioning uses work-only talk-test RPE.

**Architecture:** New workspace package under `packages/adaptive/` — zero I/O, zero React. HTML is the only caller. **Three sealed routes:** lift (`openLift` / `decideNextLift` / `closeLift`), cond (`openCond` / `decideNextCond` / `closeCond`), hold (no package). No `kind:` union. Lift files must not import cond files. After package tests are green, esbuild an IIFE bundle for `apps/mobile/prototype/hybrid-app/`, then `bash apps/mobile/sync-hybrid-html.sh` and bump cache.

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
- Lift RIR is **not** cond talk-test 1–10. Blank lift RIR = 0 (grind). Lift Next never reads `actualRpe`. Cond Next never reads `rir`.
- Three HTML doors only: `toggleSet` **and** `logSupersetSet` → `decideNextLift` (Next is **that lift’s** next row, not the partner); `advanceInterval` / `completeConditioning` → `decideNextCond`; `startHoldCountdown` → `WorkOverlay` and **zero** `HybridAdaptive`.
- No `decideNextSet` union. No `{ kind: 'hold' }` on the package.
- Prototype path only. Never edit `preview-site/` or `apps/mobile/*.js` twins by hand.
- Est. 1RM = HTML `e1rmValue`: `load × (1 + clamp(reps+rir,1,20) / 30)` rounded to 0.1 kg. Scoreboard + Close. **Not** Next kg.
- Cond: slide after **work** only. Rower/ski = split. Bike/Echo = watts. Easy → +3% W or −1 s/500 m. Hold inside painted band. Hard → −5% W or +1 s. 10 or stopped → −8% W or +3 s. `% Max Capacity` on the talk-test table is copy, not a watts formula.
- 15 s hard / 45 s easy: Next must not return a new rest duration. If still cooked at the next hard, cut **work** (treat as too hard), do not lengthen rest.
- Holds: no Open / Next / Close / Est. 1RM. Existing `WorkOverlay` countdown stays.
- Engine fills kg first (Open / Next overwrite the box). Logged kg is the proxy for Est. 1RM and the next Next.
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
| `packages/adaptive/src/decide-next-lift.ts` | `decideNextLift` only |
| `packages/adaptive/src/decide-next-cond.ts` | `decideNextCond` only |
| `packages/adaptive/src/open-lift.ts` | `openLift` |
| `packages/adaptive/src/open-cond.ts` | `openCond` |
| `packages/adaptive/src/close-lift.ts` | `closeLift` |
| `packages/adaptive/src/close-cond.ts` | `closeCond` |
| `packages/adaptive/src/index.ts` | Public barrel |
| `scripts/bundle-adaptive.mjs` | esbuild IIFE → `adaptive-bundle.js` |
| `apps/mobile/prototype/hybrid-app/adaptive-bundle.js` | Generated; do not hand-edit |
| `apps/mobile/prototype/hybrid-app/index.html` | Unextracted caller: `toggleSet`, `startHoldCountdown`, `e1rmValue`, `advanceInterval`, `completeConditioning`, `finishSession` |
| `apps/mobile/prototype/hybrid-app/work-overlay.js` | Graph node `completeWork()` / `startWork()` — hold clock only |
| `apps/mobile/prototype/hybrid-app/session-flow.js` | Graph node `nextIncompleteTask()` — task handoff, not set Next |
| `apps/mobile/prototype/hybrid-app/log-columns.js` | Graph node `builderEffortValue()` — painted reps live in `ex.reps` |
| `apps/mobile/prototype/hybrid-app/adaptive-logger.smoke.mjs` | Source smokes for wire |
| `package.json` (root) | `build` runs bundle; add smoke to `verify` |

Use **extensionless** relative imports (`from './range.js'` is wrong if files are `.ts` — use `from './range'` so Vitest + `tsc --noEmit` agree without `allowImportingTsExtensions`).

## Graph-backed routes (Graphify + Obsidian)

Ran against `graphify-out/graph.json` (6695 nodes, built `cd2edf72`). Obsidian notes under `graphify-out/obsidian/` (gitignored). **Always pass the prototype node id** — the same symbol exists three times (`prototype/hybrid-app`, `preview-site`, `apps/mobile/` twin). Edit **only** `apps/mobile/prototype/hybrid-app/`, then sync.

**Gap:** `index.html` is **not a graph node**. Graphify AST skipped the inline script. Natural-language `graphify query` also pulled `evidence-platform/` nutrition noise. After that miss, Read on `index.html` is allowed.

| Job | Hook (do this) | Graph / vault (do not confuse) |
| --- | --- | --- |
| Lift Next | `toggleSet` **and** `logSupersetSet` → `decideNextLift`. Next = next row of **that** exercise, not the partner. Range text = that lift’s `reps`. |
| Lift Est. 1RM | Existing `e1rmValue` (~L2527); `estimateOneRm` must match. `rowE1rm` skips seconds. |
| Lift Close / Open | `closeLift` / `openLift` on Finish / first empty row. |
| Holds | `startHoldCountdown` → `WorkOverlay`. **No** `HybridAdaptive`. |
| Cond Next | `advanceInterval` (work→rest) and `completeConditioning` → `decideNextCond` only. |
| Session “Up next” | `nextIncompleteTask()` is the next **task**. Not set Next. Not cond Next. |
| Builder paint | `builderEffortValue()` → `ex.reps`. Not logger Next. |

`graphify explain` on `completeWork()` (prototype id): called from `tick` and `finishEarly`; calls `stopWork`. `graphify affected completeWork`: `startWork` (inferred), `skip`, `tick`, `finishEarly`. Obsidian `completeWork().md` / `startWork().md` currently point at the **preview-site twin** — ignore those paths when editing.

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
- Create: `packages/adaptive/src/decide-next-lift.ts`
- Modify: `packages/adaptive/src/types.ts`
- Modify: `packages/adaptive/src/index.ts`
- Test: `packages/adaptive/src/decide-next-lift.test.ts`

**Interfaces:**
- Consumes: `RepRange`, `DayKind`, `roundToPlate`
- Produces:

```ts
export type LiftLogged = { loadKg: number; reps: number; rir?: number | null };

export type LiftNextInput = {
  dayKind: DayKind;
  range: RepRange;
  logged: LiftLogged;
};

export type LiftNextResult =
  | { ok: true; loadKg: number; reps: number }
  | { ok: false; reason: 'reps_out_of_sanity' | 'wrong_day' };

export function decideNextLift(input: LiftNextInput): LiftNextResult;
```

No `kind`, no cond fields, no skip. Must not put `dayKind`, `setCount`, `restSec`, or `rounds` on the result. This file must not mention `actualRpe` or `watts`.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { decideNextLift } from './decide-next-lift';

const r812 = { min: 8, max: 12 };

function lift(
  reps: number,
  rir: number | null,
  range = r812,
  loadKg = 80,
) {
  return decideNextLift({
    dayKind: 'strength',
    range,
    logged: { loadKg, reps, rir },
  });
}

describe('decideNextLift — hit the top of a range', () => {
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

describe('decideNextLift — single number never pushes reps', () => {
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

Run: `pnpm --filter @hybrid/adaptive test src/decide-next-lift.test.ts`  
Expected: FAIL (`decideNextLift` not defined)

- [ ] **Step 3: Write minimal implementation**

```ts
import { roundToPlate } from './plates';
import type { LiftNextInput, LiftNextResult, RepRange } from './types';

function rirValue(rir: number | null | undefined): number {
  if (rir == null || Number.isNaN(Number(rir))) return 0;
  return Number(rir);
}

function mediumBump(range: RepRange): number {
  if (range.min >= range.max) return range.min;
  const extra = range.max - range.min >= 4 ? 2 : 1;
  return Math.min(range.max, range.min + extra);
}

export function decideNextLift(input: LiftNextInput): LiftNextResult {
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

Put the lift types in `types.ts`. Do not add cond or hold types in this file.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @hybrid/adaptive test src/decide-next-lift.test.ts`  
Expected: PASS hit-top + single-number cases. Middle tests are not in this file yet.

- [ ] **Step 5: Commit**

```bash
git add packages/adaptive/src
git commit -m "feat(adaptive): lift Next at range top; single number keeps reps"
```

---

### Task 4: Lift Next — middle, under min, sanity, no setCount

**Files:**
- Modify: `packages/adaptive/src/decide-next-lift.ts`
- Modify: `packages/adaptive/src/decide-next-lift.test.ts`

**Interfaces:**
- Consumes: `decideNextLift` from Task 3
- Produces: same signatures

- [ ] **Step 1: Write the failing tests** (append)

```ts
describe('decideNextLift — middle and under on a range', () => {
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

Run: `pnpm --filter @hybrid/adaptive test src/decide-next-lift.test.ts`  
Expected: FAIL on middle/under until those branches exist (if Task 3 already implemented under-min for singles, range under-min may already pass)

- [ ] **Step 3: Write minimal implementation**

Middle: `min <= reps < max`. RIR `>= 2` → same kg, same reps. RIR `<= 1` → same kg, `min`. Do not clamp into a 3–30 band.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @hybrid/adaptive test src/decide-next-lift.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/adaptive/src/decide-next-lift.ts packages/adaptive/src/decide-next-lift.test.ts
git commit -m "feat(adaptive): lift Next middle, under-min, and sanity refuse"
```

---

### Task 5: `openLift`

**Files:**
- Create: `packages/adaptive/src/open-lift.ts`
- Modify: `packages/adaptive/src/types.ts`
- Modify: `packages/adaptive/src/index.ts`
- Test: `packages/adaptive/src/open-lift.test.ts`

**Interfaces:**
- Consumes: `parseRepRange`, `DayKind`

```ts
export type CloseLiftAnchor = { loadKg: number; reps: number; e1rmKg: number };

export type OpenLiftInput = {
  dayKind: DayKind;
  rangeText: string | null;
  lastClose: CloseLiftAnchor | null;
};

export type OpenLiftResult =
  | { ok: true; loadKg: number | null; reps: number }
  | { ok: false; reason: 'wrong_day' };

export function openLift(input: OpenLiftInput): OpenLiftResult;
```

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { openLift } from './open-lift';

describe('openLift', () => {
  it('first-ever blank range: reps 8, kg blank', () => {
    expect(
      openLift({
        dayKind: 'strength',
        rangeText: null,
        lastClose: null,
      }),
    ).toEqual({ ok: true, loadKg: null, reps: 8 });
  });

  it('Open writes last Close even if a leftover typed kg exists (HTML overwrites the box)', () => {
    expect(
      openLift({
        dayKind: 'strength',
        rangeText: '8-12',
        lastClose: { loadKg: 80, reps: 10, e1rmKg: 100 },
      }),
    ).toEqual({ ok: true, loadKg: 80, reps: 10 });
  });

  it('uses last Close when logger boxes are blank', () => {
    expect(
      openLift({
        dayKind: 'strength',
        rangeText: '8-12',
        lastClose: { loadKg: 82.5, reps: 8, e1rmKg: 110 },
      }),
    ).toEqual({ ok: true, loadKg: 82.5, reps: 8 });
  });

  it('refuses a conditioning day', () => {
    expect(openLift({ dayKind: 'conditioning', rangeText: '8-12', lastClose: null })).toEqual({ ok: false, reason: 'wrong_day' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @hybrid/adaptive test src/open-lift.test.ts`  
Expected: FAIL (`openLift` not defined)

- [ ] **Step 3: Write minimal implementation**

```text
range = parseRepRange(rangeText)
reps  = lastClose.reps ?? range.min
kg    = lastClose.loadKg ?? null
```

If `dayKind !== 'strength'` → `wrong_day`. Do **not** compute kg from Est. 1RM. Do not open cond here — that is `openCond` in Task 7.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @hybrid/adaptive test src/open-lift.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/adaptive/src
git commit -m "feat(adaptive): Open fills last Close kg first"
```

---

### Task 6: `closeLift`

**Files:**
- Create: `packages/adaptive/src/close-lift.ts`
- Modify: `packages/adaptive/src/index.ts`
- Test: `packages/adaptive/src/close-lift.test.ts`

**Interfaces:**
- Consumes: `estimateOneRm`

```ts
export type CloseLiftInput = {
  lastLogged: { loadKg: number; reps: number; rir?: number | null };
};

export type CloseLiftResult = { ok: true; loadKg: number; reps: number; e1rmKg: number };

export function closeLift(input: CloseLiftInput): CloseLiftResult;
```

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { closeLift } from './close-lift';
import { estimateOneRm } from './estimate-one-rm';

describe('closeLift', () => {
  it('stores last logged lift set only, with that row Est. 1RM', () => {
    const last = { loadKg: 82.5, reps: 8, rir: 3 };
    expect(closeLift({ lastLogged: last })).toEqual({
      ok: true,
      loadKg: 82.5,
      reps: 8,
      e1rmKg: estimateOneRm(last),
    });
  });

  it('does not add a bonus plate', () => {
    const closed = closeLift({
      lastLogged: { loadKg: 80, reps: 12, rir: 4 },
    });
    expect(closed).toMatchObject({ ok: true, loadKg: 80, reps: 12 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @hybrid/adaptive test src/close-lift.test.ts`  
Expected: FAIL (`closeLift` not defined)

- [ ] **Step 3: Write minimal implementation**

Last logged set only. No weekly bump. No hold skip branch — holds never call this.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @hybrid/adaptive test src/close-lift.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/adaptive/src
git commit -m "feat(adaptive): Close is last logged set, no secret bump"
```

---

### Task 7: Conditioning Next (talk-test vs painted work RPE)

**Files:**
- Create: `packages/adaptive/src/decide-next-cond.ts`
- Create: `packages/adaptive/src/open-cond.ts`
- Create: `packages/adaptive/src/close-cond.ts`
- Modify: `packages/adaptive/src/types.ts`
- Modify: `packages/adaptive/src/index.ts`
- Test: `packages/adaptive/src/decide-next-cond.test.ts`

**Interfaces:**
- Consumes: nothing from lift Next/Open/Close / `estimateOneRm`
- Produces: watts/split results; never `restSec` or `rounds`

```ts
export type CondNextInput = {
  dayKind: DayKind;
  modality: 'watts' | 'split';
  targetRpe: RepRange;
  actualRpe: number;
  stopped?: boolean;
  cooked?: boolean;
  currentWatts?: number;
  currentSplitSec?: number;
};
export function decideNextCond(input: CondNextInput):
  | { ok: true; watts: number }
  | { ok: true; splitSec: number }
  | { ok: false; reason: 'wrong_day' };
```

- [ ] **Step 1: Write the failing tests**

```ts
describe('decideNextCond', () => {
  const base = {
    dayKind: 'conditioning' as const,
    modality: 'watts' as const,
    targetRpe: { min: 7, max: 8 },
    currentWatts: 220,
  };

  it('at target (talk-test 7-8) holds watts', () => {
    expect(decideNextCond({ ...base, actualRpe: 7 })).toEqual({ ok: true, watts: 220 });
  });

  it('too easy (5 vs 7-8) adds 3%', () => {
    expect(decideNextCond({ ...base, actualRpe: 5 })).toEqual({ ok: true, watts: 227 });
  });

  it('too hard (9) subtracts 5%', () => {
    expect(decideNextCond({ ...base, actualRpe: 9 })).toEqual({ ok: true, watts: 209 });
  });

  it('10 or stopped subtracts 8%', () => {
    expect(decideNextCond({ ...base, actualRpe: 10 })).toEqual({ ok: true, watts: 202 });
    expect(decideNextCond({ ...base, actualRpe: 8, stopped: true })).toEqual({
      ok: true,
      watts: 202,
    });
  });

  it('still cooked at next hard cuts work, does not return restSec', () => {
    const next = decideNextCond({ ...base, actualRpe: 8, cooked: true });
    expect(next).toEqual({ ok: true, watts: 209 });
    expect(next).not.toHaveProperty('restSec');
    expect(next).not.toHaveProperty('rounds');
  });

  it('split moves by 1s easy/hard and 3s on 10', () => {
    const split = {
      dayKind: 'conditioning' as const,
      modality: 'split' as const,
      targetRpe: { min: 7, max: 8 },
      currentSplitSec: 120,
    };
    expect(decideNextCond({ ...split, actualRpe: 5 })).toEqual({ ok: true, splitSec: 119 });
    expect(decideNextCond({ ...split, actualRpe: 9 })).toEqual({ ok: true, splitSec: 121 });
    expect(decideNextCond({ ...split, actualRpe: 10 })).toEqual({ ok: true, splitSec: 123 });
  });

  it('refuses cond on a strength day', () => {
    expect(decideNextCond({ ...base, dayKind: 'strength', actualRpe: 7 })).toEqual({
      ok: false,
      reason: 'wrong_day',
    });
  });
});
```

Watts math: `Math.round(220 * 1.03) === 227`, `Math.round(220 * 0.95) === 209`, `Math.round(220 * 0.92) === 202`.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @hybrid/adaptive test src/decide-next-cond.test.ts`  
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
`dayKind === 'conditioning'` is required. This file must not import `./decide-next-lift` or `./estimate-one-rm`. `openCond` / `closeCond`: typed watts/split win, else last Close, else null. Never `rir`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @hybrid/adaptive test src/decide-next-cond.test.ts`  
Expected: PASS including 227 / 209 / 202

- [ ] **Step 5: Commit**

```bash
git add packages/adaptive/src/decide-next-cond.ts packages/adaptive/src/decide-next-cond.test.ts packages/adaptive/src/open-cond.ts packages/adaptive/src/close-cond.ts
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
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  closeCond,
  closeLift,
  decideNextCond,
  decideNextLift,
  estimateOneRm,
  openCond,
  openLift,
  parseRepRange,
  roundToPlate,
} from './index';

describe('public API', () => {
  it('exports lift and cond as separate functions', () => {
    expect(typeof parseRepRange).toBe('function');
    expect(typeof estimateOneRm).toBe('function');
    expect(typeof roundToPlate).toBe('function');
    expect(typeof openLift).toBe('function');
    expect(typeof decideNextLift).toBe('function');
    expect(typeof closeLift).toBe('function');
    expect(typeof openCond).toBe('function');
    expect(typeof decideNextCond).toBe('function');
    expect(typeof closeCond).toBe('function');
  });

  it('lift source never mentions RPE or watts', () => {
    const dir = dirname(fileURLToPath(import.meta.url));
    const lift = readFileSync(join(dir, 'decide-next-lift.ts'), 'utf8');
    expect(lift).not.toMatch(/actualRpe|watts|splitSec/);
  });

  it('cond source never mentions RIR or loadKg', () => {
    const dir = dirname(fileURLToPath(import.meta.url));
    const cond = readFileSync(join(dir, 'decide-next-cond.ts'), 'utf8');
    expect(cond).not.toMatch(/\brir\b|loadKg/);
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
- Produces: `globalThis.HybridAdaptive` with `decideNextLift`, `decideNextCond`, `openLift`, `openCond`, `closeLift`, `closeCond`, `estimateOneRm`, `parseRepRange`

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
if (!ctx.HybridAdaptive?.decideNextLift) throw new Error('HybridAdaptive.decideNextLift missing');
if (!ctx.HybridAdaptive?.decideNextCond) throw new Error('HybridAdaptive.decideNextCond missing');
const next = ctx.HybridAdaptive.decideNextLift({
  dayKind: 'strength',
  range: { min: 8, max: 12 },
  logged: { loadKg: 80, reps: 12, rir: 4 },
});
if (next.loadKg !== 82.5 || next.reps !== 8) throw new Error('bundle lift Next mismatch');
const cond = ctx.HybridAdaptive.decideNextCond({
  dayKind: 'conditioning',
  modality: 'watts',
  targetRpe: { min: 7, max: 8 },
  actualRpe: 7,
  currentWatts: 220,
});
if (!cond.ok || cond.watts !== 220) throw new Error('bundle cond Next mismatch');
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

### Task 10: After Log on a lift, fill the next row from `decideNextLift`

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/index.html` (script tag for `adaptive-bundle.js`; after a working set is marked done, call `HybridAdaptive.decideNextLift` and write next row kg/reps)
- Create: `apps/mobile/prototype/hybrid-app/adaptive-logger.smoke.mjs`
- Create: `apps/mobile/prototype/hybrid-app/adaptive-routes.smoke.mjs`
- Modify: `package.json` `verify` to include `check:adaptive-logger` and `check:adaptive-routes`

**Interfaces:**
- Consumes: `HybridAdaptive.decideNextLift`, `parseRepRange`
- Produces: next undone strength row gets `{ weight, reps }` from Next; set count unchanged; hold rows never call it

`toggleSet` in `index.html` (not in the graph). After a non-hold log it currently copies kg only if the next box is empty. **Overwrite** that next row with Next (engine fills first). If it feels light they change the box, then Log — that logged kg is the next proxy and Est. 1RM.

```js
let range = HybridAdaptive.parseRepRange(String(t.reps || (r && r.target) || ''));
let next = HybridAdaptive.decideNextLift({
  dayKind: 'strength',
  range,
  logged: { loadKg: num(r.weight), reps: num(r.reps), rir: r.rir === '' ? null : num(r.rir) },
});
if (next.ok && next.loadKg != null) {
  let nxt = t.rows.slice(i + 1).find(x => !x.done && x.targetKind !== 'seconds');
  if (nxt) {
    nxt.weight = next.loadKg;
    nxt.reps = String(next.reps);
  }
}
```

- [ ] **Step 1: Write the failing smoke**

```js
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const html = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'index.html'), 'utf8');
function must(c, m) { if (!c) throw new Error(m); }
must(html.includes('src="./adaptive-bundle.js"'), 'loads adaptive-bundle.js');
must(html.includes('HybridAdaptive.decideNextLift'), 'Log calls decideNextLift');
must(html.includes("if(isHoldRow(r)){startHoldCountdown"), 'holds still start countdown, not Next');
must(!html.includes('HybridAdaptive.decideNextCond') || html.includes('function advanceInterval'), 'cond Next is not on the lift Log path');
console.log('adaptive-logger.smoke: ok');
```

`adaptive-routes.smoke.mjs` (same folder):

```js
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const overlay = readFileSync(join(dir, 'work-overlay.js'), 'utf8');
function slice(name) {
  const i = html.indexOf('function ' + name);
  if (i < 0) throw new Error('missing ' + name);
  return html.slice(i, i + 800);
}
function must(c, m) { if (!c) throw new Error(m); }
const toggle = slice('toggleSet');
must(toggle.includes('decideNextLift'), 'toggleSet is the lift door');
must(!toggle.includes('decideNextCond'), 'toggleSet must not call cond Next');
must(!toggle.includes('actualRpe'), 'toggleSet must not see RPE');
const hold = slice('startHoldCountdown');
must(!hold.includes('HybridAdaptive'), 'hold door never calls the package');
must(!overlay.includes('HybridAdaptive'), 'WorkOverlay never calls the package');
console.log('adaptive-routes.smoke: ok');
```
```

Hold path must remain `startHoldCountdown` with zero `HybridAdaptive`.

- [ ] **Step 2: Run smoke to verify it fails**

Run: `node apps/mobile/prototype/hybrid-app/adaptive-logger.smoke.mjs`  
Expected: FAIL (`loads adaptive-bundle.js` or `decideNextLift`)

- [ ] **Step 3: Write minimal HTML**

Also wire `logSupersetSet`: same `decideNextLift` call, next row on **that** `ex.rows`, not the partner lift.

- [ ] **Step 4: Run smoke + hold smoke**

Run: `node apps/mobile/prototype/hybrid-app/adaptive-logger.smoke.mjs && node apps/mobile/prototype/hybrid-app/adaptive-routes.smoke.mjs && node apps/mobile/prototype/hybrid-app/hold-countdown.smoke.mjs`  
Expected: both PASS

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/prototype/hybrid-app/index.html apps/mobile/prototype/hybrid-app/adaptive-logger.smoke.mjs package.json
git commit -m "feat(logger): fill next lift from RIR Next"
```

---

### Task 11: Session Finish → `closeLift`; next session `openLift`

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/index.html` (on session complete, store last logged set per lift; on session start, fill first row from `openLift`)
- Modify: `apps/mobile/prototype/hybrid-app/adaptive-logger.smoke.mjs`

**Interfaces:**
- Consumes: `closeLift`, `openLift`
- Produces: persisted `{ loadKg, reps, e1rmKg }` keyed by exercise id; Open **overwrites** the first row from last Close; they may edit then Log

Persist on `S` (existing local state object) under a small map e.g. `S.adaptiveClose = S.adaptiveClose || {}` keyed by `exerciseId || name`. Do not add Supabase migrations.

- [ ] **Step 1: Write the failing smoke** (append to `adaptive-logger.smoke.mjs`)

```js
must(html.includes('HybridAdaptive.closeLift'), 'Finish calls closeLift');
must(html.includes('HybridAdaptive.openLift'), 'session start calls openLift');
must(html.includes('adaptiveClose') || html.includes('lastClose'), 'stores Close locally');
```

- [ ] **Step 2: Run smoke to verify it fails**

Run: `node apps/mobile/prototype/hybrid-app/adaptive-logger.smoke.mjs`  
Expected: FAIL on `closeLift` / `openLift`

- [ ] **Step 3: Write minimal HTML**

On Finish of a strength task: last **done** non-hold row → `closeLift({ lastLogged: {...} })` → save. On session start: `openLift({ dayKind: 'strength', rangeText, lastClose })` **overwrites** the first row. If Open `loadKg` is null, leave the kg box blank (first-ever).

- [ ] **Step 4: Run smoke to verify it passes**

Run: `node apps/mobile/prototype/hybrid-app/adaptive-logger.smoke.mjs`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/prototype/hybrid-app/index.html apps/mobile/prototype/hybrid-app/adaptive-logger.smoke.mjs
git commit -m "feat(logger): Close last lift set and Open next session from it"
```

---

### Task 12: Conditioning work slider → `decideNextCond`

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/index.html` — `advanceInterval` (work→rest) and `completeConditioning`; **not** `WorkOverlay.completeWork`
- Modify: `apps/mobile/prototype/hybrid-app/adaptive-logger.smoke.mjs`
- Modify: `apps/mobile/prototype/hybrid-app/adaptive-routes.smoke.mjs`

**Interfaces:**
- Consumes: `decideNextCond`
- Produces: next work target only

Slider labels (talk test, copy only): 1 conversation … 10 cannot speak. Painted target comes from the card (e.g. 7–8). Rest/easy 45 s is not a second slider.

- [ ] **Step 1: Write the failing smoke**

```js
must(html.includes('HybridAdaptive.decideNextCond'), 'cond Next');
must(html.includes('actualRpe'), 'passes actual RPE');
must(html.includes('modality'), 'watts vs split');
```

- [ ] **Step 2: Run smoke to verify it fails**

Run: `node apps/mobile/prototype/hybrid-app/adaptive-logger.smoke.mjs`  
Expected: FAIL until cond strings exist

- [ ] **Step 3: Write minimal HTML**

Do **not** hang this on graph `completeWork()` — that is the hold clock (`startHoldCountdown` callback). Cond anchors were ripped: `completeConditioning` still has the `/* cond anchors ripped — rebuild */` comment.

Intervals: when `advanceInterval` sees `iv.phase==='work'` (about to become rest), show the 1–10 slider, then `decideNextCond`. Apply watts/split to the **next work** target only. Leave `t.restSec` and `t.rounds` unchanged. Tempo/steady: one slider at `completeConditioning`. `cooked` if they never came back to easy on 15/45 — treat as too hard; still do not lengthen rest.

```js
decideNextCond({
  dayKind: 'conditioning',
  modality: t.modality,
  targetRpe: /* painted work band from the card, e.g. 7-8 */,
  actualRpe: num(slider),
  currentWatts: num(t.targetWatts) || null,
  currentSplitSec: null,
  stopped: false,
  cooked: false,
});
```

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
- Produces: unchanged hold clock; no adaptive call on seconds rows

- [ ] **Step 1: Write / keep failing assertions**

Keep `hold-countdown.smoke.mjs` requiring `startHoldCountdown` and no Next on that path. Add to `adaptive-routes.smoke.mjs`: after Task 12, `advanceInterval` slice must include `decideNextCond` and must not include `decideNextLift` or `rir`.

- [ ] **Step 2: Run both smokes**

Run: `node apps/mobile/prototype/hybrid-app/hold-countdown.smoke.mjs && node apps/mobile/prototype/hybrid-app/adaptive-logger.smoke.mjs`  
Expected: PASS (if fail, fix HTML, do not weaken the hold smoke)

- [ ] **Step 3: Fix HTML if needed**

Keep the existing early return: `if(isHoldRow(r)){startHoldCountdown(i);return}`. Graph path `startWork` → `tick` → `completeWork` must stay the hold clock. Do not add `HybridAdaptive` inside `work-overlay.js`.

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
| Holds never call the package | 13 |
| `dayKind` never in output; wrong day | 3, 7 |
| Cond talk-test vs painted work; rest not in result; cooked cuts work | 7, 12 |
| Barrel + source isolation (lift vs cond) | 8 |
| HTML three doors + routes smoke | 9–14 |

**Placeholder scan:** no TBD / “similar to Task N” / “add error handling” without code.

**Types:** `decideNextLift`, `decideNextCond`, `openLift`, `openCond`, `closeLift`, `closeCond`, `estimateOneRm`, `parseRepRange`, `roundToPlate`, `RepRange`, `DayKind`, `cooked` / `stopped` on cond — same names in later tasks. No `decideNextSet`.

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
| graphify | `explain` / `path` / `affected` on prototype node ids; `query` without ids is too noisy (evidence-platform) |
| Obsidian vault | Same symbols; notes often cite preview-site twins — do not edit those files |
