# Strength Engine V2.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship athlete-only in-session strength adaptation: Set 1 is athlete-entered (or last-session final load), every finished set silently updates the next weight suggestion from slider + reps, with silent effort-profile learning and a slight nudge when the athlete edits weight.

**Architecture:** New pure functions in `@hybrid/strength-engine` (`planNextSet`, `updateEffortProfile`, `closeStrengthSession`). `strength-adapter.js` owns local `ExerciseAnchor` / `EffortProfile` I/O. The one-set logger stays dumb: it shows the suggestion, captures load/reps/difficulty, and calls the adapter. V1 weekly `applySilentProgression` is skipped on the athlete V2 path. No recovery gates. No WM gate. No slider tutorial.

**Tech Stack:** TypeScript (`packages/strength-engine`, Vitest), Hybrid HTML (`apps/mobile/prototype/hybrid-app/`), esbuild IIFE (`build-strength.sh` → `strength-bundle.js`), colocated `*.smoke.mjs`.

**Spec:** `docs/superpowers/specs/2026-09-03-strength-engine-v2-design.md`

**Out of this plan (talk later, then write separate plans):**

- **V2.2** — superset partner-rest parity with V2 suggestions, timed holds, rep-only lifts
- **V3** — conditioning only (same shell later; recovery still out)

## Global Constraints

- `@hybrid/strength-engine` stays pure — zero I/O, zero React; callers inject data.
- Athlete product is Hybrid HTML only: edit `apps/mobile/prototype/hybrid-app/`, then `bash apps/mobile/sync-hybrid-html.sh`.
- Tests colocated: `src/foo.ts` ↔ `src/foo.test.ts`. No `*.test.ts` under `test/`.
- `--passWithNoTests` is banned. New checks land in `package.json` `verify` **and** `.github/workflows/ci.yml` in the same commit.
- Shared Supabase: **no new migrations**. V2.1 is local-first (`strengthState`).
- Pain/illness: do not add consumption, stops, or gates.
- Cache bump: `LOCAL_BUILD` and SW `CACHE` move together.
- Silent UI: hero numbers only — no “because…” copy, no one-time slider hint.
- Manual weight edit recalibrates **slightly** (≤ one equipment increment).
- WM never required. Set 1 first-ever = blank/manual. Return Set 1 = last session final load, editable.
- Week-to-week: **no extra bump** — `closeStrengthSession` writes the final set load as the next suggestion.

---

## File map

| Path | Responsibility |
| --- | --- |
| `packages/strength-engine/src/effortProfile.ts` | Default bump table, `updateEffortProfile`, clamp/nudge math |
| `packages/strength-engine/src/planNextSet.ts` | V2 set-to-set decision (slider + reps) |
| `packages/strength-engine/src/exerciseAnchor.ts` | `ExerciseAnchor` type + `closeStrengthSession` |
| `packages/strength-engine/src/decideNextSet.ts` | Thin wrapper → `planNextSet` with default profile (existing callers keep working) |
| `apps/mobile/prototype/hybrid-app/strength-entry.ts` | Export new namespaces on `HybridStrength` |
| `apps/mobile/prototype/hybrid-app/strength-adapter.js` | Persist anchors/profiles; seed Set 1; skip weekly V1 apply; `suggestNextSet` passes profile + override |
| `apps/mobile/prototype/hybrid-app/strength-one-set-logger.js` | Pass `suggestedLoadKg` vs logged weight; no new copy |
| `apps/mobile/prototype/hybrid-app/index.html` | Skip WM gate when V2 on; `finalizeSilentStrength` calls V2 close |
| `apps/mobile/prototype/hybrid-app/strength-engine-v2.smoke.mjs` | Adapter + bundle contract for V2.1 |

---

### Task 1: EffortProfile defaults + update

**Files:**
- Create: `packages/strength-engine/src/effortProfile.ts`
- Create: `packages/strength-engine/src/effortProfile.test.ts`
- Modify: `packages/strength-engine/src/index.ts` (add `export * from './effortProfile'`)

**Interfaces:**
- Consumes: `SetDifficulty` from `decideNextSet.ts` (re-export from effortProfile or import)
- Produces:
  - `DEFAULT_EFFORT_BUMP_KG: Record<SetDifficulty, number>`
  - `defaultEffortProfile(exerciseId: string, nowIso: string): EffortProfile`
  - `updateEffortProfile(profile: EffortProfile, input: UpdateEffortProfileInput): EffortProfile`

`EffortProfile`:

```ts
export interface EffortProfile {
  exerciseId: string;
  sampleCount: number;
  bumpKg: Record<SetDifficulty, number>;
  lastUpdated: string;
}
```

`UpdateEffortProfileInput`:

```ts
export interface UpdateEffortProfileInput {
  difficulty: SetDifficulty;
  performedLoadKg: number;
  performedReps: number;
  prescribedReps: number;
  suggestedLoadKg: number; // what engine showed before this set
  incrementKg: number;     // equipment step, e.g. 2.5
  nowIso: string;
  manualLoadOverride: boolean;
}
```

Default `bumpKg` (spec table, barbell 2.5 kg steps):

| Label | Δkg |
| --- | ---: |
| very_easy | +5 |
| easy | +2.5 |
| medium | 0 |
| hard | 0 |
| max | −2.5 |
| did_not_complete | −5 |

- [ ] **Step 1: Write the failing tests**

```ts
// packages/strength-engine/src/effortProfile.test.ts
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_EFFORT_BUMP_KG,
  defaultEffortProfile,
  updateEffortProfile,
} from './effortProfile';

describe('defaultEffortProfile', () => {
  it('starts with spec bump table and sampleCount 0', () => {
    const p = defaultEffortProfile('bench', '2026-09-03T10:00:00Z');
    expect(p.exerciseId).toBe('bench');
    expect(p.sampleCount).toBe(0);
    expect(p.bumpKg.easy).toBe(2.5);
    expect(p.bumpKg.very_easy).toBe(5);
    expect(p.bumpKg.max).toBe(-2.5);
    expect(p.bumpKg.did_not_complete).toBe(-5);
    expect(DEFAULT_EFFORT_BUMP_KG.medium).toBe(0);
  });
});

describe('updateEffortProfile', () => {
  const base = defaultEffortProfile('bench', '2026-09-03T10:00:00Z');

  it('increments sampleCount', () => {
    const next = updateEffortProfile(base, {
      difficulty: 'medium',
      performedLoadKg: 100,
      performedReps: 8,
      prescribedReps: 8,
      suggestedLoadKg: 100,
      incrementKg: 2.5,
      nowIso: '2026-09-03T10:01:00Z',
      manualLoadOverride: false,
    });
    expect(next.sampleCount).toBe(1);
    expect(next.lastUpdated).toBe('2026-09-03T10:01:00Z');
  });

  it('shrinks easy bump when easy + missed reps (no override)', () => {
    const next = updateEffortProfile(base, {
      difficulty: 'easy',
      performedLoadKg: 100,
      performedReps: 5,
      prescribedReps: 8,
      suggestedLoadKg: 100,
      incrementKg: 2.5,
      nowIso: '2026-09-03T10:01:00Z',
      manualLoadOverride: false,
    });
    expect(next.bumpKg.easy).toBeLessThan(base.bumpKg.easy);
    expect(next.bumpKg.easy).toBeGreaterThanOrEqual(0);
  });

  it('nudges at most one increment on manual override', () => {
    const next = updateEffortProfile(base, {
      difficulty: 'medium',
      performedLoadKg: 110,
      performedReps: 8,
      prescribedReps: 8,
      suggestedLoadKg: 100,
      incrementKg: 2.5,
      nowIso: '2026-09-03T10:01:00Z',
      manualLoadOverride: true,
    });
    const delta = next.bumpKg.medium - base.bumpKg.medium;
    expect(Math.abs(delta)).toBeLessThanOrEqual(2.5);
    expect(delta).toBeGreaterThan(0);
  });

  it('does not rewrite the whole table on one override', () => {
    const next = updateEffortProfile(base, {
      difficulty: 'medium',
      performedLoadKg: 110,
      performedReps: 8,
      prescribedReps: 8,
      suggestedLoadKg: 100,
      incrementKg: 2.5,
      nowIso: '2026-09-03T10:01:00Z',
      manualLoadOverride: true,
    });
    expect(next.bumpKg.easy).toBe(base.bumpKg.easy);
    expect(next.bumpKg.did_not_complete).toBe(base.bumpKg.did_not_complete);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
pnpm --filter @hybrid/strength-engine exec vitest run src/effortProfile.test.ts
```

Expected: FAIL (`Cannot find module './effortProfile'`).

- [ ] **Step 3: Implement**

```ts
// packages/strength-engine/src/effortProfile.ts
import type { SetDifficulty } from './decideNextSet';

export type { SetDifficulty };

export const DEFAULT_EFFORT_BUMP_KG: Record<SetDifficulty, number> = {
  very_easy: 5,
  easy: 2.5,
  medium: 0,
  hard: 0,
  max: -2.5,
  did_not_complete: -5,
};

export interface EffortProfile {
  exerciseId: string;
  sampleCount: number;
  bumpKg: Record<SetDifficulty, number>;
  lastUpdated: string;
}

export interface UpdateEffortProfileInput {
  difficulty: SetDifficulty;
  performedLoadKg: number;
  performedReps: number;
  prescribedReps: number;
  suggestedLoadKg: number;
  incrementKg: number;
  nowIso: string;
  manualLoadOverride: boolean;
}

export function defaultEffortProfile(exerciseId: string, nowIso: string): EffortProfile {
  return {
    exerciseId,
    sampleCount: 0,
    bumpKg: { ...DEFAULT_EFFORT_BUMP_KG },
    lastUpdated: nowIso,
  };
}

function clampNudge(delta: number, incrementKg: number): number {
  const step = incrementKg > 0 ? incrementKg : 2.5;
  if (delta > step) return step;
  if (delta < -step) return -step;
  return delta;
}

export function updateEffortProfile(
  profile: EffortProfile,
  input: UpdateEffortProfileInput,
): EffortProfile {
  const bumpKg = { ...profile.bumpKg };
  const inc = input.incrementKg > 0 ? input.incrementKg : 2.5;

  if (input.manualLoadOverride) {
    const errorKg = input.performedLoadKg - input.suggestedLoadKg;
    const nudge = clampNudge(errorKg > 0 ? inc : errorKg < 0 ? -inc : 0, inc);
    bumpKg[input.difficulty] = bumpKg[input.difficulty] + nudge;
  } else if (
    (input.difficulty === 'easy' || input.difficulty === 'very_easy') &&
    input.performedReps < input.prescribedReps
  ) {
    bumpKg[input.difficulty] = Math.max(0, bumpKg[input.difficulty] - inc);
  }

  return {
    ...profile,
    sampleCount: profile.sampleCount + 1,
    bumpKg,
    lastUpdated: input.nowIso,
  };
}
```

Keep `SetDifficulty` defined once in `decideNextSet.ts` and import it here (no circular import: effortProfile must not import planNextSet). If `decideNextSet` later imports effortProfile, that is fine (one-way).

- [ ] **Step 4: Run tests — expect PASS**

```bash
pnpm --filter @hybrid/strength-engine exec vitest run src/effortProfile.test.ts
```

- [ ] **Step 5: Export + commit**

Add `export * from './effortProfile';` to `packages/strength-engine/src/index.ts`.

```bash
git add packages/strength-engine/src/effortProfile.ts packages/strength-engine/src/effortProfile.test.ts packages/strength-engine/src/index.ts
git commit -m "Add EffortProfile defaults and silent update (V2.1)"
```

---

### Task 2: planNextSet decision rules

**Files:**
- Create: `packages/strength-engine/src/planNextSet.ts`
- Create: `packages/strength-engine/src/planNextSet.test.ts`

**Interfaces:**
- Consumes: `EffortProfile`, `SetDifficulty`, `roundLoadToEquipment`, `Equipment`
- Produces: `planNextSet(input: PlanNextSetInput): NextSetPlan`

```ts
export interface PlanNextSetInput {
  performedLoadKg: number;
  performedReps: number;
  prescribedReps: number;
  difficulty: SetDifficulty;
  equipment: Equipment | null;
  profile: EffortProfile;
}

export interface NextSetPlan {
  loadKg: number;
  targetReps: number;
  reasonCodes: string[];
}
```

Priority (spec):

1. `did_not_complete` → apply `bumpKg.did_not_complete`; cap `targetReps` to proven reps (min 1 if proven ≥ 1, else keep prescribed).
2. Else if completed but `performedReps < prescribedReps` → decrease load (use `bumpKg.max` if it is negative, else −increment); **never increase**. Reason `reps_short`.
3. Else apply `profile.bumpKg[difficulty]` (medium = 0 hold).
4. Always `roundLoadToEquipment`. Never increase if miss or DNF.

- [ ] **Step 1: Write the failing tests**

```ts
// packages/strength-engine/src/planNextSet.test.ts
import { describe, expect, it } from 'vitest';
import { defaultEffortProfile } from './effortProfile';
import { planNextSet } from './planNextSet';

const barbell = {
  id: 'bb',
  name: 'Barbell',
  incrementKg: 2.5,
  rackValuesKg: null,
  rounding: 'nearest' as const,
};

function input(over: Partial<Parameters<typeof planNextSet>[0]> = {}) {
  return {
    performedLoadKg: 100,
    performedReps: 8,
    prescribedReps: 8,
    difficulty: 'medium' as const,
    equipment: barbell,
    profile: defaultEffortProfile('sq', '2026-09-03T00:00:00Z'),
    ...over,
  };
}

describe('planNextSet', () => {
  it('holds on medium + target met', () => {
    const r = planNextSet(input());
    expect(r.loadKg).toBe(100);
    expect(r.targetReps).toBe(8);
    expect(r.reasonCodes).toContain('on_target_hold');
  });

  it('bumps on easy + target met', () => {
    const r = planNextSet(input({ difficulty: 'easy' }));
    expect(r.loadKg).toBe(102.5);
    expect(r.reasonCodes).toContain('easy_bump');
  });

  it('bumps more on very_easy + target met', () => {
    const r = planNextSet(input({ difficulty: 'very_easy' }));
    expect(r.loadKg).toBe(105);
  });

  it('cuts on max + target met', () => {
    const r = planNextSet(input({ difficulty: 'max' }));
    expect(r.loadKg).toBe(97.5);
    expect(r.reasonCodes).toContain('max_cut');
  });

  it('missed reps pull down even if slider is easy', () => {
    const r = planNextSet(input({ difficulty: 'easy', performedReps: 5 }));
    expect(r.loadKg).toBeLessThan(100);
    expect(r.reasonCodes).toContain('reps_short');
    expect(r.reasonCodes).not.toContain('easy_bump');
  });

  it('did_not_complete cuts harder and caps reps to proven', () => {
    const r = planNextSet(input({ difficulty: 'did_not_complete', performedReps: 5 }));
    expect(r.loadKg).toBe(95);
    expect(r.targetReps).toBe(5);
    expect(r.reasonCodes).toContain('did_not_complete');
  });

  it('never increases after did_not_complete', () => {
    const r = planNextSet(input({ difficulty: 'did_not_complete', performedReps: 0 }));
    expect(r.loadKg).toBeLessThan(100);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
pnpm --filter @hybrid/strength-engine exec vitest run src/planNextSet.test.ts
```

- [ ] **Step 3: Implement**

```ts
// packages/strength-engine/src/planNextSet.ts
import type { Equipment } from './exercise';
import type { EffortProfile } from './effortProfile';
import type { SetDifficulty } from './decideNextSet';
import { roundLoadToEquipment } from './rounding';

export interface PlanNextSetInput {
  performedLoadKg: number;
  performedReps: number;
  prescribedReps: number;
  difficulty: SetDifficulty;
  equipment: Equipment | null;
  profile: EffortProfile;
}

export interface NextSetPlan {
  loadKg: number;
  targetReps: number;
  reasonCodes: string[];
}

function applyDelta(loadKg: number, deltaKg: number, equipment: Equipment | null): number {
  return roundLoadToEquipment(loadKg + deltaKg, equipment);
}

export function planNextSet(input: PlanNextSetInput): NextSetPlan {
  const reasons: string[] = [];
  let loadKg = input.performedLoadKg;
  let targetReps = input.prescribedReps;
  const bump = input.profile.bumpKg;
  const inc = input.equipment?.incrementKg && input.equipment.incrementKg > 0
    ? input.equipment.incrementKg
    : 2.5;

  if (input.difficulty === 'did_not_complete') {
    loadKg = applyDelta(loadKg, bump.did_not_complete, input.equipment);
    const proven = Math.max(0, input.performedReps);
    if (proven > 0) targetReps = Math.min(input.prescribedReps, proven);
    reasons.push('did_not_complete');
    return { loadKg, targetReps, reasonCodes: reasons };
  }

  if (input.performedReps < input.prescribedReps) {
    const cut = bump.max < 0 ? bump.max : -inc;
    loadKg = applyDelta(loadKg, cut, input.equipment);
    reasons.push('reps_short');
    return { loadKg, targetReps, reasonCodes: reasons };
  }

  const delta = bump[input.difficulty] ?? 0;
  if (delta > 0) {
    loadKg = applyDelta(loadKg, delta, input.equipment);
    reasons.push(input.difficulty === 'very_easy' ? 'very_easy_bump' : 'easy_bump');
  } else if (delta < 0) {
    loadKg = applyDelta(loadKg, delta, input.equipment);
    reasons.push(input.difficulty === 'max' ? 'max_cut' : 'hard_cut');
  } else {
    reasons.push('on_target_hold');
  }

  return { loadKg, targetReps, reasonCodes: reasons };
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
pnpm --filter @hybrid/strength-engine exec vitest run src/planNextSet.test.ts
```

- [ ] **Step 5: Export + commit**

Add `export * from './planNextSet';` to `index.ts`.

```bash
git add packages/strength-engine/src/planNextSet.ts packages/strength-engine/src/planNextSet.test.ts packages/strength-engine/src/index.ts
git commit -m "Add planNextSet: slider + reps, missed reps dominate"
```

---

### Task 3: ExerciseAnchor + closeStrengthSession

**Files:**
- Create: `packages/strength-engine/src/exerciseAnchor.ts`
- Create: `packages/strength-engine/src/exerciseAnchor.test.ts`

**Interfaces:**
- Produces: `closeStrengthSession(input: CloseStrengthSessionInput): ExerciseAnchor`

```ts
export interface ExerciseAnchor {
  exerciseId: string;
  lastSetLoadKg: number;
  lastSetReps: number;
  lastTargetReps: number;
  lastDifficulty: SetDifficulty;
  lastSessionId: string;
  updatedAt: string;
  workingMaxKg?: number;
}

export interface CloseStrengthSessionInput {
  exerciseId: string;
  lastSet: {
    loadKg: number;
    reps: number;
    targetReps: number;
    difficulty: SetDifficulty;
  };
  sessionId: string;
  nowIso: string;
  prior?: ExerciseAnchor | null;
}
```

Rule: next session Set 1 suggestion = `lastSetLoadKg` only. Do **not** apply +2.5% weekly bump. Preserve `workingMaxKg` from `prior` if present.

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { closeStrengthSession } from './exerciseAnchor';

describe('closeStrengthSession', () => {
  it('writes final set load as the next-session suggestion (no weekly bump)', () => {
    const a = closeStrengthSession({
      exerciseId: 'bench',
      lastSet: { loadKg: 105, reps: 8, targetReps: 8, difficulty: 'easy' },
      sessionId: 's1',
      nowIso: '2026-09-03T12:00:00Z',
    });
    expect(a.lastSetLoadKg).toBe(105);
    expect(a.lastSetReps).toBe(8);
    expect(a.lastDifficulty).toBe('easy');
    expect(a.lastSessionId).toBe('s1');
  });

  it('keeps optional workingMaxKg from prior', () => {
    const a = closeStrengthSession({
      exerciseId: 'bench',
      lastSet: { loadKg: 100, reps: 8, targetReps: 8, difficulty: 'medium' },
      sessionId: 's2',
      nowIso: '2026-09-03T12:00:00Z',
      prior: {
        exerciseId: 'bench',
        lastSetLoadKg: 97.5,
        lastSetReps: 8,
        lastTargetReps: 8,
        lastDifficulty: 'medium',
        lastSessionId: 's1',
        updatedAt: '2026-09-01T12:00:00Z',
        workingMaxKg: 140,
      },
    });
    expect(a.workingMaxKg).toBe(140);
    expect(a.lastSetLoadKg).toBe(100);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
pnpm --filter @hybrid/strength-engine exec vitest run src/exerciseAnchor.test.ts
```

- [ ] **Step 3: Implement**

```ts
export function closeStrengthSession(input: CloseStrengthSessionInput): ExerciseAnchor {
  return {
    exerciseId: input.exerciseId,
    lastSetLoadKg: input.lastSet.loadKg,
    lastSetReps: input.lastSet.reps,
    lastTargetReps: input.lastSet.targetReps,
    lastDifficulty: input.lastSet.difficulty,
    lastSessionId: input.sessionId,
    updatedAt: input.nowIso,
    ...(input.prior?.workingMaxKg != null ? { workingMaxKg: input.prior.workingMaxKg } : {}),
  };
}
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Export + commit**

```bash
git add packages/strength-engine/src/exerciseAnchor.ts packages/strength-engine/src/exerciseAnchor.test.ts packages/strength-engine/src/index.ts
git commit -m "Add ExerciseAnchor closeStrengthSession (no weekly bump)"
```

---

### Task 4: Point decideNextSet at planNextSet + rebuild bundle export

**Files:**
- Modify: `packages/strength-engine/src/decideNextSet.ts`
- Modify: `packages/strength-engine/src/decideNextSet.test.ts`
- Modify: `apps/mobile/prototype/hybrid-app/strength-entry.ts`

**Interfaces:**
- Consumes: `planNextSet`, `defaultEffortProfile`
- Produces: existing `decideNextSet` still exported; maps `NextSetPlan` → `NextSetDecision` (`reps` = `targetReps`)

- [ ] **Step 1: Rewrite failing decideNextSet tests to V2 rules**

Replace the easy-hold / max-hold cases:

- `easy` + 8/8 → load > 100
- `max` + 8/8 → load < 100
- `easy` + 5/8 → load < 100 (`reps_short` via wrapper reasonCodes)
- Keep DNF cases aligned with `planNextSet` (95 kg on nearest 2.5 from 100 − 5)

Keep `IN_SESSION_STRENGTH` export if other files import it; if unused after wrap, leave constants but stop using them in `decideNextSet`.

- [ ] **Step 2: Run decideNextSet tests — expect FAIL** (old implementation)

```bash
pnpm --filter @hybrid/strength-engine exec vitest run src/decideNextSet.test.ts
```

- [ ] **Step 3: Wrapper implementation**

```ts
export function decideNextSet(input: DecideNextSetInput): NextSetDecision {
  const targetRir = input.targetRir ?? IN_SESSION_STRENGTH.defaultTargetRir;
  const profile = defaultEffortProfile('in-session', new Date(0).toISOString());
  const plan = planNextSet({
    performedLoadKg: input.performedLoadKg,
    performedReps: input.performedReps,
    prescribedReps: input.prescribedReps,
    difficulty: input.difficulty,
    equipment: input.equipment,
    profile,
  });
  return {
    loadKg: plan.loadKg,
    reps: plan.targetReps,
    targetRir,
    reasonCodes: plan.reasonCodes,
  };
}
```

Avoid circular imports: `effortProfile.ts` imports type from `decideNextSet.ts`; `planNextSet.ts` imports both; `decideNextSet.ts` imports `planNextSet` + `defaultEffortProfile`. If the bundler/TS cycle bites, move `SetDifficulty` into `effortProfile.ts` (or a tiny `difficulty.ts`) and have both import that. Prefer a 10-line `difficulty.ts` if the cycle is real.

- [ ] **Step 4: Run full package tests**

```bash
pnpm --filter @hybrid/strength-engine test
```

Expected: all green. Fix any `decideNextSet` callers in package tests.

- [ ] **Step 5: Bundle namespaces**

In `apps/mobile/prototype/hybrid-app/strength-entry.ts` add:

```ts
export * as PlanNextSet from '../../../../packages/strength-engine/src/planNextSet.ts';
export * as EffortProfile from '../../../../packages/strength-engine/src/effortProfile.ts';
export * as ExerciseAnchor from '../../../../packages/strength-engine/src/exerciseAnchor.ts';
```

```bash
bash apps/mobile/prototype/hybrid-app/build-strength.sh
```

- [ ] **Step 6: Commit**

```bash
git add packages/strength-engine apps/mobile/prototype/hybrid-app/strength-entry.ts
git commit -m "Wire decideNextSet through planNextSet; export V2 namespaces"
```

---

### Task 5: Adapter state, V2 flag, skip weekly bump + WM gate

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/strength-adapter.js`
- Modify: `apps/mobile/prototype/hybrid-app/index.html` (`startSession` / WM gate / `finalizeSilentStrength`)
- Test: `apps/mobile/prototype/hybrid-app/strength-engine-v2.smoke.mjs` (create in Task 7; this task can assert in a small vm snippet first or wait — prefer creating the smoke file here with the first assertions)

**Interfaces:**
- Consumes: `HybridStrength.PlanNextSet.planNextSet`, `EffortProfile.*`, `ExerciseAnchor.closeStrengthSession`
- Produces:
  - `isStrengthEngineV2(state): boolean` — `state.settings.strengthEngineV2 !== false` (default **on**)
  - `ensureStrengthState` also initializes `exerciseAnchors: {}` and `effortProfiles: {}`
  - `seedExerciseFromAnchor(state, ex)` — if V2 and anchor exists, `fillBlankRowWeights(ex, anchor.lastSetLoadKg)` **before** loadHints / WM %
  - `closeV2Session(state, session)` — per trained exercise, last done row → `closeStrengthSession` + `updateEffortProfile`
  - `applySilentProgression` early-returns `{ applied: 0, skipped: 'strength_v2' }` when V2 on
  - `ENGINE_VERSION = 'strength-engine-v2.1'`

- [ ] **Step 1: Write smoke assertions (failing)**

Create `apps/mobile/prototype/hybrid-app/strength-engine-v2.smoke.mjs` that:

1. Loads bundle + adapter in vm (same pattern as `blank-slate-wm.smoke.mjs`).
2. `must(adapter.includes('strength-engine-v2.1'))`.
3. `must(adapter.includes('exerciseAnchors'))`.
4. Calls `setWorkingMax` is **not** required to start: `isStrengthEngineV2(state) === true` with empty settings.
5. `applySilentProgression` on V2 state returns `skipped: 'strength_v2'` and does not bump `loadHints`.

- [ ] **Step 2: Run smoke — expect FAIL**

```bash
bash apps/mobile/prototype/hybrid-app/build-strength.sh
node apps/mobile/prototype/hybrid-app/strength-engine-v2.smoke.mjs
```

- [ ] **Step 3: Implement adapter + HTML**

`ensureStrengthState`:

```js
state.strengthState.exerciseAnchors = state.strengthState.exerciseAnchors || {};
state.strengthState.effortProfiles = state.strengthState.effortProfiles || {};
```

`isStrengthEngineV2`:

```js
function isStrengthEngineV2(state) {
  if (!state || !state.settings) return true;
  return state.settings.strengthEngineV2 !== false;
}
```

Top of `applySilentProgression`:

```js
if (isStrengthEngineV2(state)) return { applied: 0, skipped: 'strength_v2' };
```

`applyLoadHintsToExercise`: if V2, after `ensureSessionLoadExpr` / fill reps, if `ss.exerciseAnchors[exerciseId]` has `lastSetLoadKg`, `fillBlankRowWeights` with that and **return** (skip WM-equals-hint repair and raw WM). First-ever lift: no anchor → leave weight blank.

Find `startSession` in `index.html` (it currently opens WM gate). When V2:

```js
if (window.StrengthAdapter && StrengthAdapter.isStrengthEngineV2 && StrengthAdapter.isStrengthEngineV2(S)) {
  startSessionNow(i);
  return;
}
```

Keep the old gate behind `settings.strengthEngineV2 === false` only.

`finalizeSilentStrength`: if V2, call `StrengthAdapter.closeV2Session(S, x)` then skip `applySilentProgression*`. Still record PRs if existing `recordPrEvents` is independent.

`closeV2Session` (adapter):

```js
function lastDoneRow(ex) {
  var rows = (ex.rows || []).filter(function (r) { return r.done && !r.extra; });
  return rows[rows.length - 1] || null;
}

function closeV2Session(state, session) {
  if (!hasStrength() || !global.HybridStrength.ExerciseAnchor) return { closed: 0 };
  var ss = ensureStrengthState(state);
  var closed = 0;
  trainedExerciseIds(session).forEach(function (exerciseId) {
    var meta = findExerciseMetaInSession(session, exerciseId);
    var row = lastDoneRow(meta.ex || meta);
    if (!row) return;
    var now = isoNow();
    var prior = ss.exerciseAnchors[exerciseId] || null;
    ss.exerciseAnchors[exerciseId] = global.HybridStrength.ExerciseAnchor.closeStrengthSession({
      exerciseId: exerciseId,
      lastSet: {
        loadKg: num(row.weight),
        reps: num(row.reps),
        targetReps: num(String(row.target || '').match(/^(\d+)/) && String(row.target).match(/^(\d+)/)[1]) || num(row.reps),
        difficulty: row.difficulty || 'medium',
      },
      sessionId: session.id,
      nowIso: now,
      prior: prior,
    });
    closed++;
  });
  return { closed: closed };
}
```

Use existing `findExerciseMetaInSession` / `iterStrengthTasks` — do not invent a second session walker.

One-time migration helper `seedAnchorsFromHistory(state)`: if `exerciseAnchors` empty, for each exercise with a completed session, take last done row → `closeStrengthSession`. Call from `ensureStrengthState` once (`ss.v2AnchorsSeeded`).

- [ ] **Step 4: Run smoke — expect PASS** (partial: flag + skip weekly). Full suggestNextSet in Task 6.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/prototype/hybrid-app/strength-adapter.js apps/mobile/prototype/hybrid-app/index.html apps/mobile/prototype/hybrid-app/strength-engine-v2.smoke.mjs
git commit -m "V2.1 adapter: anchors, skip WM gate and weekly silent bump"
```

---

### Task 6: suggestNextSet uses planNextSet + slight profile update

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/strength-adapter.js` (`suggestNextSet`)
- Modify: `apps/mobile/prototype/hybrid-app/strength-one-set-logger.js` (`nextStrengthSet`)
- Modify: `apps/mobile/prototype/hybrid-app/strength-engine-v2.smoke.mjs`

**Interfaces:**
- Consumes: `planNextSet`, `updateEffortProfile`, `defaultEffortProfile`
- Produces: `suggestNextSet(state, task, input)` where `input` includes `suggestedLoadKg` and `manualLoadOverride`

- [ ] **Step 1: Extend smoke (failing)**

In the smoke, after building a profile-less state:

```js
const task = {
  kind: 'strength',
  exerciseId: 'bench',
  rows: [
    { n: 1, target: '8', weight: 100, reps: 8, done: true },
    { n: 2, target: '8', weight: '', reps: '' },
  ],
};
const suggestion = StrengthAdapter.suggestNextSet(state, task, {
  performedLoadKg: 100,
  performedReps: 8,
  prescribedReps: 8,
  prescribedLoadKg: 100,
  suggestedLoadKg: 100,
  difficulty: 'easy',
  manualLoadOverride: false,
  ordinal: 2,
});
must(suggestion && suggestion.loadKg === 102.5, 'easy + on target bumps 2.5');

const miss = StrengthAdapter.suggestNextSet(state, task, {
  performedLoadKg: 100,
  performedReps: 5,
  prescribedReps: 8,
  prescribedLoadKg: 100,
  suggestedLoadKg: 100,
  difficulty: 'easy',
  manualLoadOverride: false,
  ordinal: 2,
});
must(miss.loadKg < 100, 'easy + missed reps must not bump');
```

- [ ] **Step 2: Run smoke — expect FAIL** until `suggestNextSet` is updated.

- [ ] **Step 3: Implement `suggestNextSet`**

When V2 and `HybridStrength.PlanNextSet`:

```js
function suggestNextSet(state, task, input) {
  input = input || {};
  if (!hasStrength()) return null;
  var exerciseId = task.exerciseId || task.id;
  var ss = ensureStrengthState(state);
  var equipment = equipmentForExercise(task);
  if (isStrengthEngineV2(state) && global.HybridStrength.PlanNextSet && global.HybridStrength.EffortProfile) {
    var now = isoNow();
    var profile = ss.effortProfiles[exerciseId] || global.HybridStrength.EffortProfile.defaultEffortProfile(exerciseId, now);
    var suggested = num(input.suggestedLoadKg);
    var performed = num(input.performedLoadKg);
    var override = !!input.manualLoadOverride || (suggested > 0 && Math.abs(performed - suggested) > 0.01);
    profile = global.HybridStrength.EffortProfile.updateEffortProfile(profile, {
      difficulty: input.difficulty || 'medium',
      performedLoadKg: performed,
      performedReps: num(input.performedReps),
      prescribedReps: num(input.prescribedReps),
      suggestedLoadKg: suggested || performed,
      incrementKg: (equipment && equipment.incrementKg) || 2.5,
      nowIso: now,
      manualLoadOverride: override,
    });
    ss.effortProfiles[exerciseId] = profile;
    var plan = global.HybridStrength.PlanNextSet.planNextSet({
      performedLoadKg: performed,
      performedReps: num(input.performedReps),
      prescribedReps: num(input.prescribedReps),
      difficulty: input.difficulty || 'medium',
      equipment: equipment,
      profile: profile,
    });
    return { loadKg: plan.loadKg, reps: plan.targetReps, targetRir: targetRirForExercise(task), reasonCodes: plan.reasonCodes };
  }
  // existing DecideNextSet path for V2-off
}
```

Logger `nextStrengthSet`: pass the **row’s pre-edit suggestion**. Store `row.suggestedLoadKg` when seeding from engine; on finish:

```js
var suggestedLoadKg = num(row.suggestedLoadKg);
if (!suggestedLoadKg) suggestedLoadKg = performedLoad;
var suggestion = global.StrengthAdapter.suggestNextSet(global.S, t, {
  performedLoadKg: performedLoad,
  performedReps: performedReps,
  prescribedReps: prescribedReps,
  prescribedLoadKg: suggestedLoadKg,
  suggestedLoadKg: suggestedLoadKg,
  difficulty: autoreg.selectedDifficulty,
  sessionAnchorKg: autoreg.sessionAnchorKg || performedLoad,
  ordinal: ordinal + 1,
});
if (suggestion) {
  nextRow.weight = suggestion.loadKg;
  nextRow.suggestedLoadKg = suggestion.loadKg;
  nextRow.reps = suggestion.reps;
  nextRow.target = String(suggestion.reps);
  t.lastSuggestion = suggestion;
}
```

When applying anchor at session start (adapter), set `rows[0].suggestedLoadKg = anchor.lastSetLoadKg` as well as `weight`. First-ever: leave both empty.

- [ ] **Step 4: Run smoke + one-set-logger smoke**

```bash
bash apps/mobile/prototype/hybrid-app/build-strength.sh
node apps/mobile/prototype/hybrid-app/strength-engine-v2.smoke.mjs
pnpm run check:strength-one-set-logger
```

Update `strength-one-set-logger.smoke.mjs` if the mock `suggestNextSet` still expects 102.5 on medium — keep the mock return value; only production path changed. If the smoke calls real adapter, align expected load with V2 (easy bump). Current smoke uses a stub `suggestNextSet` returning 102.5 — leave the stub.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/prototype/hybrid-app/strength-adapter.js apps/mobile/prototype/hybrid-app/strength-one-set-logger.js apps/mobile/prototype/hybrid-app/strength-engine-v2.smoke.mjs
git commit -m "V2.1 suggestNextSet: planNextSet + slight profile nudge on override"
```

---

### Task 7: Register smoke in verify + CI; cache bump; sync

**Files:**
- Modify: `package.json` (`verify` and new `"check:strength-engine-v2"`)
- Modify: `.github/workflows/ci.yml`
- Modify: `apps/mobile/prototype/hybrid-app/index.html` (`LOCAL_BUILD`)
- Modify: `apps/mobile/prototype/hybrid-app/service-worker.js` (`CACHE`)
- Modify: every smoke that pins `the-hybrid-athlete-engine-vNNN` (same bump as existing cache convention)

**Interfaces:** none new.

- [ ] **Step 1: Add script**

```json
"check:strength-engine-v2": "bash apps/mobile/prototype/hybrid-app/build-strength.sh && node apps/mobile/prototype/hybrid-app/strength-engine-v2.smoke.mjs"
```

Insert into `verify` next to `check:strength-one-set-logger`. Add the same `run:` line in `.github/workflows/ci.yml`.

- [ ] **Step 2: Bump cache** from current `v164` (or whatever is on the branch) to **`v165`** in HTML + SW + smokes that assert the string.

- [ ] **Step 3: Sync + verify**

```bash
bash apps/mobile/sync-hybrid-html.sh
pnpm run check:strength-engine-v2
pnpm --filter @hybrid/strength-engine test
pnpm run verify
```

Expected: green. If `strength-progression.smoke.mjs` still expects weekly bump on default state, either set `settings.strengthEngineV2 = false` in that smoke (legacy path) **or** assert V2 skip. Prefer: **legacy smoke sets `strengthEngineV2: false`** so V1 weekly tests remain a regression net for the bypassed path.

- [ ] **Step 4: Commit**

```bash
git add package.json .github/workflows/ci.yml apps/mobile
git commit -m "V2.1: verify/CI smoke, cache v165, keep V1 progression smoke on flag-off"
```

---

### Task 8: Handoff note (no product copy in logger)

**Files:**
- Modify: `handoff.md` only if this repo’s ritual requires cache/Capgo rows — keep it factual: V2.1 athlete path, WM gate off, weekly silent bump skipped.

Do **not** add slider tutorial UI. Do **not** add “because Easy” hero copy.

- [ ] **Step 1: Confirm logger has no effort-hint string**

```bash
rg -n "could've done about 2|effortHint|Rate how hard that set felt" apps/mobile/prototype/hybrid-app/strength-one-set-logger.js apps/mobile/prototype/hybrid-app/index.html
```

Expected: no matches (except existing slider labels).

- [ ] **Step 2: Commit handoff if you edited it**

```bash
git add handoff.md
git commit -m "Handoff: Strength Engine V2.1 athlete path"
```

---

## Spec coverage (self-review)

| Spec requirement | Task |
| --- | --- |
| In-session every set | 2, 6 |
| Set 1 first-ever manual | 5 (`fillBlankRowWeights` skipped without anchor) |
| Return Set 1 = last final load | 3, 5 |
| Slider + reps; reps dominate | 2 |
| Didn’t finish vs completed-short | 2 |
| No weekly bump | 3, 5 |
| WM never required | 5 |
| No tutorial hint | 8 |
| Silent hero | 6 (numbers only) |
| Slight recalibrate on edit | 1, 6 |
| Pure engine | 1–4 |
| Adapter I/O | 5–6 |
| Check in verify + CI | 7 |
| V2.2 / V3 | **Not in this plan** |

## Type names (locked)

`SetDifficulty`, `EffortProfile`, `UpdateEffortProfileInput`, `PlanNextSetInput`, `NextSetPlan`, `ExerciseAnchor`, `CloseStrengthSessionInput`, `planNextSet`, `updateEffortProfile`, `closeStrengthSession`, `defaultEffortProfile`, `isStrengthEngineV2`, `closeV2Session`.
