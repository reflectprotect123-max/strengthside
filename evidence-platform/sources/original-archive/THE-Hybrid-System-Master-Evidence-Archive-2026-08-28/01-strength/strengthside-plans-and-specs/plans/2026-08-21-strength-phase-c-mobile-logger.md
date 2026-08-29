# Strength Phase C — Mobile Logger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A working, offline-first strength logging app in `apps/mobile` — open a published session, log sets against resolved prescriptions, survive an app kill, finish with RPE/duration/PR detection — running on fixture data until Phase B publishes real sessions.

**Architecture:** Pure logic lives in `@hybrid/strength-engine` (labeling) and in zero-React modules under `apps/mobile/src/` (reducer, timers, formatting); React components are thin renderers over them. All session state flows through one reducer whose every action is durably persisted before the UI re-renders (offline-first, spec Gotcha #2). Data access sits behind a `SessionRepository` interface with a fixture implementation — the Supabase implementation is a SEPARATE, LATER plan, because Phase B (coach publish) does not exist yet and there is nothing real to sync against.

**Tech Stack:** Expo SDK 54 / RN 0.81 / React 19 (already pinned), TypeScript, jest-expo + @testing-library/react-native, @react-native-async-storage/async-storage behind an injected `KVStorage` interface.

**Spec:** `docs/superpowers/specs/2026-08-17-strength-rebuild-design.md`, Phase C (Slices 18–25). The spec predates the repo split and assumes the hybrid repo's mobile app (Training.tsx routing, conditioning timers, its SQLite shell). None of that exists here — `apps/mobile` is a bare scaffold — so this plan builds the equivalents it needs and RECORDS each divergence in place rather than pretending the spec still fits.

## Global Constraints

- `@hybrid/strength-engine` stays pure functions and types — zero I/O, zero React (CLAUDE.md).
- `--passWithNoTests` is banned; the FIRST mobile test adds jest-expo AND the package's `test` script in the same commit (CLAUDE.md + handoff trap note). Root `pnpm -r test` then collects it in CI and `verify` with no workflow edit.
- Tests are colocated: `src/foo.ts` → `src/foo.test.ts` (CLAUDE.md).
- Never hard-delete a performed set: removal is `status: 'skipped'` (spec Slice 23).
- `Finish Session` is never the first durable write — every set write persists the instant it happens (spec Slice 25).
- A pain-blocked exposure counts toward load/fatigue but never calibration (CLAUDE.md); nothing in this plan holds a session on a pain flag — flags are recorded, not consumed (CLAUDE.md "know what this repo does NOT do").
- No new migrations. This plan touches no SQL — the twelve tables exist; writes stay local/outbox until the sync plan.
- Deviations from spec recorded here: (a) only the REST timer ships in this plan — Stopwatch/AMRAP/Tabata/EMOM assumed reuse of conditioning primitives that live in the OTHER repo; deferred, stated in Task 7's code comment, not silently dropped. (b) The 420px no-horizontal-scroll rule is verified by a manual device pass at the end (native app, no Playwright); recorded in Task 9.

## File Structure

```
packages/strength-engine/src/labels.ts          labelFor() — grouping_key → A/A1/B3 labels (Slice 19)
packages/strength-engine/src/labels.test.ts
apps/mobile/jest.config.js                      jest-expo preset
apps/mobile/src/data/types.ts                   AssignedSession/SessionBlockItem view-model types
apps/mobile/src/data/repository.ts              SessionRepository interface
apps/mobile/src/data/fixtureRepository.ts       seeded published session + ResolveCtx fixtures
apps/mobile/src/data/fixtureRepository.test.ts
apps/mobile/src/store/kv.ts                     KVStorage interface + AsyncStorage impl + memoryKV
apps/mobile/src/store/sessionState.ts           pure reducer: the whole logging state machine
apps/mobile/src/store/sessionState.test.ts
apps/mobile/src/store/SessionStore.tsx          React context: dispatch → persist → render
apps/mobile/src/store/SessionStore.test.tsx     the kill test lives here
apps/mobile/src/timer/rest.ts                   pure countdown arithmetic
apps/mobile/src/timer/rest.test.ts
apps/mobile/src/format.ts                       target → display string ("5 reps · 130 kg")
apps/mobile/src/format.test.ts
apps/mobile/src/screens/Today.tsx               assigned-session list (entry screen)
apps/mobile/src/screens/StrengthSession.tsx     block list + set rows + rest timer + 3-dot menu
apps/mobile/src/screens/StrengthSession.test.tsx
apps/mobile/src/screens/FinishSession.tsx       RPE / duration / comment / finish
apps/mobile/src/screens/FinishSession.test.tsx
apps/mobile/src/App.tsx                         MODIFY: screen switcher over the three screens
```

---

### Task 1: Test harness + first test (the jest-expo-and-script commit)

**Files:**
- Modify: `apps/mobile/package.json` (add `test` script AND devDeps in this commit)
- Create: `apps/mobile/jest.config.js`
- Create: `apps/mobile/src/App.test.tsx`

**Interfaces:**
- Consumes: existing `App` export from `src/App.tsx`.
- Produces: a runnable `pnpm --filter @hybrid/strength-mobile test`; every later task's tests assume this harness.

- [ ] **Step 1: Add devDependencies and the test script together**

In `apps/mobile/package.json` `scripts`, replace the `"//test"` explanation line with the real script (keep a one-line comment noting the trap is now sprung):

```json
"//test": "Added 21 Aug 2026 WITH jest-expo in the same commit, per the handoff trap note. Root `pnpm -r test` collects this in CI and verify automatically.",
"test": "jest"
```

and add to `devDependencies` (SDK-54-matched versions):

```json
"jest": "~29.7.0",
"jest-expo": "~54.0.0",
"@testing-library/react-native": "^13.3.0",
"react-test-renderer": "19.1.0"
```

Create `apps/mobile/jest.config.js`:

```js
/** jest-expo's preset handles Expo/RN transforms; testMatch keeps collection
 * colocated-only so a stray test under test/ (fixtures dir) never runs. */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/src/**/*.test.@(ts|tsx)'],
};
```

Run: `pnpm install`

- [ ] **Step 2: Write the failing first test**

`apps/mobile/src/App.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react-native';
import { App } from './App';

/* The scaffold's placeholder proves the engine workspace link is real by
 * counting METRICS. Pin that behaviour so the harness demonstrably collects
 * and runs a real assertion on day one. */
it('renders the metric-registry count from the live engine', () => {
  render(<App />);
  expect(screen.getByText(/12 metrics in the registry/)).toBeOnTheScreen();
});
```

- [ ] **Step 3: Run it**

Run: `pnpm --filter @hybrid/strength-mobile test`
Expected: PASS (1 test). If it fails on transform errors, fix jest config — do NOT add transformIgnorePatterns hacks without recording why in the config comment.

- [ ] **Step 4: Verify root collection**

Run: `pnpm run test` (repo root)
Expected: mobile suite appears alongside engine/web/functions counts.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/package.json apps/mobile/jest.config.js apps/mobile/src/App.test.tsx pnpm-lock.yaml
git commit -m "mobile: jest-expo harness + test script, same commit per the trap note"
```

---

### Task 2: `labelFor` in the engine (Slice 19 logic)

**Files:**
- Create: `packages/strength-engine/src/labels.ts`
- Create: `packages/strength-engine/src/labels.test.ts`
- Modify: `packages/strength-engine/src/index.ts` (add `export * from './labels';`)

**Interfaces:**
- Consumes: `StrengthBlockItem` from `./session` (`{ id, kind, exerciseId, groupingKey, sets }`).
- Produces: `labelFor(items: StrengthBlockItem[]): Record<string, string>` — itemId → `'A'`, `'A1'`, `'B3'`… Later tasks import it from `@hybrid/strength-engine`.

- [ ] **Step 1: Write the failing tests**

`packages/strength-engine/src/labels.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { labelFor } from './labels';
import type { StrengthBlockItem } from './session';

const item = (id: string, groupingKey: string | null): StrengthBlockItem =>
  ({ id, kind: 'strength', exerciseId: 'x', groupingKey, sets: [] });

describe('labelFor', () => {
  it('a lone item gets a bare letter', () => {
    expect(labelFor([item('a', null)])).toEqual({ a: 'A' });
  });

  it('two lone items get successive letters', () => {
    expect(labelFor([item('a', null), item('b', null)])).toEqual({ a: 'A', b: 'B' });
  });

  it('a superset pair shares a letter with 1/2 suffixes', () => {
    expect(labelFor([item('a', 'ss1'), item('b', 'ss1')])).toEqual({ a: 'A1', b: 'A2' });
  });

  it('mixed: lone, then a pair, then lone — letters advance per GROUP, not per item', () => {
    expect(
      labelFor([item('a', null), item('b', 'g'), item('c', 'g'), item('d', null)]),
    ).toEqual({ a: 'A', b: 'B1', c: 'B2', d: 'C' });
  });

  it('a 5-exercise circuit numbers past 4 without breaking', () => {
    const items = ['a', 'b', 'c', 'd', 'e'].map((id) => item(id, 'circ'));
    expect(labelFor(items)).toEqual({ a: 'A1', b: 'A2', c: 'A3', d: 'A4', e: 'A5' });
  });

  it('grouping is by KEY, not adjacency — an interleaved stray does not join the group', () => {
    // The DB does not forbid this ordering; the label must follow groupingKey.
    expect(
      labelFor([item('a', 'g'), item('x', null), item('b', 'g')]),
    ).toEqual({ a: 'A1', x: 'B', b: 'A2' });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @hybrid/strength-engine test -- labels`
Expected: FAIL — `labels` module not found.

- [ ] **Step 3: Implement**

`packages/strength-engine/src/labels.ts`:

```ts
import type { StrengthBlockItem } from './session';

/**
 * Display labels for a block's items (Slice 19): a lone item gets a bare
 * letter ('A'), items sharing a groupingKey share a letter and take 1-based
 * suffixes in encounter order ('A1', 'A2', …). Letters advance per GROUP in
 * first-encounter order. Grouping follows the KEY, never adjacency — the DB
 * does not forbid interleaving, so the labeler must not assume it.
 *
 * Past 'Z' it continues 'AA', 'AB', … — no cap, same reason the spec's test
 * demands a 5th circuit member: this scheme must not break at an arbitrary
 * size somebody will eventually exceed.
 */
export function labelFor(items: StrengthBlockItem[]): Record<string, string> {
  const letter = (i: number): string => {
    let s = '';
    for (let n = i; n >= 0; n = Math.floor(n / 26) - 1) {
      s = String.fromCharCode(65 + (n % 26)) + s;
    }
    return s;
  };
  const groupLetter = new Map<string, string>(); // groupingKey → letter
  const groupCount = new Map<string, number>();  // groupingKey → members seen
  const sizes = new Map<string, number>();       // groupingKey → total members
  for (const it of items) {
    if (it.groupingKey != null) sizes.set(it.groupingKey, (sizes.get(it.groupingKey) ?? 0) + 1);
  }
  let next = 0;
  const out: Record<string, string> = {};
  for (const it of items) {
    if (it.groupingKey == null) {
      out[it.id] = letter(next++);
      continue;
    }
    let l = groupLetter.get(it.groupingKey);
    if (!l) {
      l = letter(next++);
      groupLetter.set(it.groupingKey, l);
    }
    const n = (groupCount.get(it.groupingKey) ?? 0) + 1;
    groupCount.set(it.groupingKey, n);
    // A "group" of one is a lone item that happens to carry a key — label it bare.
    out[it.id] = (sizes.get(it.groupingKey) ?? 1) > 1 ? `${l}${n}` : l;
  }
  return out;
}
```

Add to `packages/strength-engine/src/index.ts`: `export * from './labels';`

- [ ] **Step 4: Run to verify pass**

Run: `pnpm --filter @hybrid/strength-engine test -- labels`
Expected: PASS (6 tests). Then `pnpm --filter @hybrid/strength-engine test` — full engine suite still green.

- [ ] **Step 5: Commit**

```bash
git add packages/strength-engine/src/labels.ts packages/strength-engine/src/labels.test.ts packages/strength-engine/src/index.ts
git commit -m "engine: labelFor — grouping_key to A/A1/B3 display labels (Slice 19)"
```

---

### Task 3: View-model types, repository interface, fixture repository

**Files:**
- Create: `apps/mobile/src/data/types.ts`
- Create: `apps/mobile/src/data/repository.ts`
- Create: `apps/mobile/src/data/fixtureRepository.ts`
- Create: `apps/mobile/src/data/fixtureRepository.test.ts`

**Interfaces:**
- Consumes: `resolveTarget`, `PrescribedSet`, `PrescribedTarget`, `ResolveCtx`, `ResolvedValue`, `StrengthBlockItem`, `Exercise` types from `@hybrid/strength-engine`.
- Produces (exact shapes later tasks rely on):

```ts
// types.ts
export interface ResolvedTargetView {
  metricKey: MetricKey;
  resolved: ResolvedValue;           // engine's union, untouched
}
export interface ResolvedSetView {
  prescribedSetId: string;
  ordinal: number;
  isAmrap: boolean;
  isOptional: boolean;
  targets: ResolvedTargetView[];
}
export interface SessionItemView {
  itemId: string;
  exerciseId: string;
  exerciseName: string;
  groupingKey: string | null;
  sets: ResolvedSetView[];
}
export interface AssignedSessionView {
  assignedSessionId: string;
  scheduledDate: string;             // 'YYYY-MM-DD'
  title: string;
  state: 'published' | 'in_progress' | 'completed';
  isTest: boolean;                   // Slice 16's block flag, session-level here
  items: SessionItemView[];
}

// repository.ts
export interface SessionRepository {
  todaySessions(): Promise<AssignedSessionView[]>;
  exerciseName(exerciseId: string): string;
  swappableExercises(): Array<{ id: string; name: string }>;
  workingMaxKg(exerciseId: string): number | null;        // for the 3-dot menu
}
export const REPOSITORY_DIVERGENCE_NOTE: string;           // see Step 3
```

- [ ] **Step 1: Write the failing test**

`apps/mobile/src/data/fixtureRepository.test.ts`:

```ts
import { fixtureRepository } from './fixtureRepository';

describe('fixtureRepository', () => {
  it('serves one published session for today with resolved targets', async () => {
    const sessions = await fixtureRepository.todaySessions();
    expect(sessions).toHaveLength(1);
    const s = sessions[0];
    expect(s.state).toBe('published');
    expect(s.items.length).toBeGreaterThanOrEqual(3);
  });

  it('resolves the %max squat load through the real engine with the exact value kept', async () => {
    const [s] = await fixtureRepository.todaySessions();
    const squat = s.items.find((i) => i.exerciseName === 'Back Squat')!;
    const load = squat.sets[0].targets.find((t) => t.metricKey === 'load')!;
    // 72.5% of the fixture's 180kg working max = 130.5 exact; equipment
    // rounding lands on a loadable 130. The { display, exact } pair is the
    // Slice 5/20 long-press contract.
    expect(load.resolved).toEqual({ kind: 'scalar', value: 130, exact: 130.5 });
  });

  it('carries a superset pair sharing a groupingKey', async () => {
    const [s] = await fixtureRepository.todaySessions();
    const grouped = s.items.filter((i) => i.groupingKey === 'ss1');
    expect(grouped).toHaveLength(2);
  });

  it('names every exercise it references', async () => {
    const [s] = await fixtureRepository.todaySessions();
    for (const item of s.items) {
      expect(fixtureRepository.exerciseName(item.exerciseId)).toBe(item.exerciseName);
    }
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @hybrid/strength-mobile test -- fixtureRepository`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement types, interface, fixture**

`apps/mobile/src/data/types.ts` — exactly the shapes in the Interfaces block above (import `MetricKey`, `ResolvedValue` from `@hybrid/strength-engine`).

`apps/mobile/src/data/repository.ts`:

```ts
import type { AssignedSessionView } from './types';

/**
 * The one seam between the logger and where sessions come from. The fixture
 * implementation below it is the DEFAULT until the sync plan lands — Phase B
 * (coach publish) is not built, so there is no real assigned_session row to
 * fetch; the spec itself allows "a seeded fixture for standalone testing".
 * The Supabase implementation is a SEPARATE plan on purpose: wiring auth and
 * reads against the shared project deserves its own tests and its own
 * review, not a corner of a UI plan.
 */
export interface SessionRepository {
  todaySessions(): Promise<AssignedSessionView[]>;
  exerciseName(exerciseId: string): string;
  swappableExercises(): Array<{ id: string; name: string }>;
  workingMaxKg(exerciseId: string): number | null;
}
```

`apps/mobile/src/data/fixtureRepository.ts`:

```ts
import {
  resolveTarget,
  type Exercise,
  type PrescribedSet,
  type ResolveCtx,
  type StrengthBlockItem,
} from '@hybrid/strength-engine';
import type { AssignedSessionView, SessionItemView } from './types';
import type { SessionRepository } from './repository';

/* Mirrors the ARC prototype's fixture athlete (Dan Veldman, Back Squat
 * WM 180kg) so the two design artifacts and this app tell one story. */
const EXERCISES: Record<string, Exercise> = {
  sq:  { id: 'sq',  name: 'Back Squat',       equipment: { kind: 'barbell', barKg: 20, smallestPlateKg: 1.25 }, referenceMaxExerciseId: null, tracksAsExerciseId: null },
  bp:  { id: 'bp',  name: 'Bench Press',      equipment: { kind: 'barbell', barKg: 20, smallestPlateKg: 1.25 }, referenceMaxExerciseId: null, tracksAsExerciseId: null },
  row: { id: 'row', name: 'Barbell Row',      equipment: { kind: 'barbell', barKg: 20, smallestPlateKg: 1.25 }, referenceMaxExerciseId: null, tracksAsExerciseId: null },
  dip: { id: 'dip', name: 'Weighted Dip',     equipment: null, referenceMaxExerciseId: null, tracksAsExerciseId: null },
};
// NOTE: if the engine's Exercise shape differs (check `exercise.ts` before
// implementing — field names there win), adjust the literals, not the engine.

const WORKING_MAX: Record<string, number> = { sq: 180, bp: 120 };

const ctx: ResolveCtx = {
  athleteId: 'fixture-athlete',
  scheduledDate: new Date().toISOString().slice(0, 10),
  workingMaxAt: (exerciseId) => WORKING_MAX[exerciseId] ?? null,
  lastPerformedLoad: () => null,
  bodyweightAt: () => 82,
};

const set = (id: string, ordinal: number, targets: PrescribedSet['targets'], over: Partial<PrescribedSet> = {}): PrescribedSet =>
  ({ id, ordinal, isOptional: false, isAmrap: false, targets, ...over });

const squatSets: PrescribedSet[] = [1, 2, 3, 4, 5].map((n) =>
  set(`sq-${n}`, n, [
    { metricKey: 'reps', literalValue: 5 },
    { metricKey: 'load', exprKind: 'pct_of_max', exprArg: 0.725 },
    { metricKey: 'rest', literalValue: 150 },
  ]),
);
const benchSets: PrescribedSet[] = [1, 2, 3].map((n) =>
  set(`bp-${n}`, n, [
    { metricKey: 'reps', rangeLo: 6, rangeHi: 8 },
    { metricKey: 'load', exprKind: 'pct_of_max', exprArg: 0.7 },
  ], n === 3 ? { isAmrap: true } : {}),
);
const rowSets: PrescribedSet[] = [1, 2, 3].map((n) =>
  set(`row-${n}`, n, [{ metricKey: 'reps', literalValue: 10 }]),
);
const dipSets: PrescribedSet[] = [1, 2, 3].map((n) =>
  set(`dip-${n}`, n, [{ metricKey: 'reps', literalValue: 12 }]),
);

const ITEMS: StrengthBlockItem[] = [
  { id: 'it-sq',  kind: 'strength', exerciseId: 'sq',  groupingKey: null,  sets: squatSets },
  { id: 'it-bp',  kind: 'strength', exerciseId: 'bp',  groupingKey: null,  sets: benchSets },
  { id: 'it-row', kind: 'strength', exerciseId: 'row', groupingKey: 'ss1', sets: rowSets },
  { id: 'it-dip', kind: 'strength', exerciseId: 'dip', groupingKey: 'ss1', sets: dipSets },
];

function toItemView(item: StrengthBlockItem): SessionItemView {
  const ex = EXERCISES[item.exerciseId];
  return {
    itemId: item.id,
    exerciseId: item.exerciseId,
    exerciseName: ex.name,
    groupingKey: item.groupingKey,
    sets: item.sets.map((s) => ({
      prescribedSetId: s.id,
      ordinal: s.ordinal,
      isAmrap: s.isAmrap,
      isOptional: s.isOptional,
      targets: s.targets.map((t) => ({ metricKey: t.metricKey, resolved: resolveTarget(t, ex, ctx) })),
    })),
  };
}

const SESSION: AssignedSessionView = {
  assignedSessionId: 'fixture-session-1',
  scheduledDate: ctx.scheduledDate,
  title: 'Week 3 Day 1 — Lower',
  state: 'published',
  isTest: false,
  items: ITEMS.map(toItemView),
};

export const fixtureRepository: SessionRepository = {
  todaySessions: async () => [structuredClone(SESSION)],
  exerciseName: (id) => EXERCISES[id]?.name ?? id,
  swappableExercises: () => Object.values(EXERCISES).map((e) => ({ id: e.id, name: e.name })),
  workingMaxKg: (id) => WORKING_MAX[id] ?? null,
};
```

- [ ] **Step 4: Run to verify pass**

Run: `pnpm --filter @hybrid/strength-mobile test -- fixtureRepository`
Expected: PASS. If the `Exercise`/equipment literals don't typecheck, read `packages/strength-engine/src/exercise.ts` and match ITS field names exactly — the exact-value assertion (130 / 130.5) is the engine's real arithmetic and must not be "fixed" in the test.

- [ ] **Step 5: Typecheck and commit**

Run: `pnpm --filter @hybrid/strength-mobile typecheck`

```bash
git add apps/mobile/src/data/
git commit -m "mobile: repository seam + fixture session resolved through the real engine"
```

---

### Task 4: The session reducer — the whole logging state machine, pure

**Files:**
- Create: `apps/mobile/src/store/sessionState.ts`
- Create: `apps/mobile/src/store/sessionState.test.ts`

**Interfaces:**
- Consumes: `AssignedSessionView`, `ResolvedSetView` from `../data/types`; `PerformedSetWithMeasurements`, `MetricKey` from `@hybrid/strength-engine`.
- Produces (later tasks rely on these exact names):

```ts
export interface SessionState {
  session: AssignedSessionView;
  startedAt: string | null;                       // ISO; set by 'start'
  completedAt: string | null;
  performed: PerformedSetWithMeasurements[];      // EVERY write, incl. skipped
  itemOrder: string[];                            // itemIds; move-to-end reorders
  swaps: Record<string, string>;                  // itemId → replacement exerciseId
  comments: Record<string, string>;               // itemId → athlete comment
  sessionRpe: number | null;
  sessionComment: string;
  durationSeconds: number | null;                 // athlete-overridable
  outbox: OutboxEntry[];                          // append-only queue for the future sync plan
}
export type OutboxEntry =
  | { kind: 'performed_set'; set: PerformedSetWithMeasurements }
  | { kind: 'session_state'; assignedSessionId: string; state: 'in_progress' | 'completed'; at: string }
  | { kind: 'pr_event'; pr: PrEvent }
  | { kind: 'working_max_event'; event: WorkingMaxEvent };
export type SessionAction =
  | { type: 'start'; at: string }
  | { type: 'tickSet'; itemId: string; set: ResolvedSetView; at: string }        // exact-match completion
  | { type: 'logSet'; itemId: string; set: ResolvedSetView; values: Partial<Record<MetricKey, number>>; at: string }
  | { type: 'unlogSet'; prescribedSetId: string; at: string }                    // soft: status 'skipped'
  | { type: 'addSet'; itemId: string; at: string }                              // prescribedSetId: null
  | { type: 'swapExercise'; itemId: string; exerciseId: string }
  | { type: 'moveToEnd'; itemId: string }
  | { type: 'setComment'; itemId: string; text: string }
  | { type: 'finishMeta'; rpe: number | null; durationSeconds: number | null; comment: string }
  | { type: 'finish'; at: string; prEvents: PrEvent[]; workingMaxEvents: WorkingMaxEvent[] };
export function initialState(session: AssignedSessionView): SessionState;
export function sessionReducer(state: SessionState, action: SessionAction): SessionState;
export function effectiveExerciseId(state: SessionState, itemId: string): string;
export function loggedFor(state: SessionState, prescribedSetId: string): PerformedSetWithMeasurements | null; // latest non-skipped
```

- [ ] **Step 1: Write the failing tests**

`apps/mobile/src/store/sessionState.test.ts` (the load-bearing cases; keep all of them):

```ts
import { initialState, sessionReducer, loggedFor, effectiveExerciseId } from './sessionState';
import { fixtureRepository } from '../data/fixtureRepository';
import type { SessionState } from './sessionState';

let base: SessionState;
beforeEach(async () => {
  const [session] = await fixtureRepository.todaySessions();
  base = initialState(session);
});
const squatSet = (s: SessionState) => s.session.items[0].sets[0];
const T = '2026-08-21T10:00:00.000Z';

it('start stamps startedAt, flips state to in_progress, and queues the transition', () => {
  const s = sessionReducer(base, { type: 'start', at: T });
  expect(s.startedAt).toBe(T);
  expect(s.session.state).toBe('in_progress');
  expect(s.outbox).toContainEqual({ kind: 'session_state', assignedSessionId: 'fixture-session-1', state: 'in_progress', at: T });
});

it('tickSet writes a performed set whose measurements equal the resolved prescription', () => {
  const s0 = sessionReducer(base, { type: 'start', at: T });
  const s = sessionReducer(s0, { type: 'tickSet', itemId: 'it-sq', set: squatSet(s0), at: T });
  const p = loggedFor(s, 'sq-1')!;
  expect(p.status).toBe('completed');
  expect(p.exerciseId).toBe('sq');
  expect(p.prescribedSetId).toBe('sq-1');
  // The DISPLAY value is what the athlete lifted: rounded 130, not exact 130.5.
  expect(p.measurements).toEqual(expect.arrayContaining([
    { metricKey: 'reps', value: 5 },
    { metricKey: 'load', value: 130 },
  ]));
  expect(s.outbox.some((e) => e.kind === 'performed_set')).toBe(true);
});

it('logSet with divergent values stores what was typed, not the prescription', () => {
  const s0 = sessionReducer(base, { type: 'start', at: T });
  const s = sessionReducer(s0, { type: 'logSet', itemId: 'it-sq', set: squatSet(s0), values: { reps: 4, load: 127.5 }, at: T });
  expect(loggedFor(s, 'sq-1')!.measurements).toEqual(expect.arrayContaining([
    { metricKey: 'reps', value: 4 },
    { metricKey: 'load', value: 127.5 },
  ]));
});

it('unlogSet soft-deletes: a NEW row with status skipped, never a removal', () => {
  const s0 = sessionReducer(base, { type: 'start', at: T });
  const s1 = sessionReducer(s0, { type: 'tickSet', itemId: 'it-sq', set: squatSet(s0), at: T });
  const s2 = sessionReducer(s1, { type: 'unlogSet', prescribedSetId: 'sq-1', at: T });
  expect(s2.performed.length).toBe(2);                       // nothing deleted
  expect(loggedFor(s2, 'sq-1')).toBeNull();                  // but nothing counts as logged
});

it('addSet creates a row with prescribedSetId null', () => {
  const s0 = sessionReducer(base, { type: 'start', at: T });
  const s = sessionReducer(s0, { type: 'addSet', itemId: 'it-sq', at: T });
  const added = s.performed.find((p) => p.prescribedSetId === null);
  expect(added).toBeTruthy();
  expect(added!.exerciseId).toBe('sq');
});

it('swapExercise changes what future sets log as, prescription untouched', () => {
  const s0 = sessionReducer(base, { type: 'start', at: T });
  const s1 = sessionReducer(s0, { type: 'swapExercise', itemId: 'it-sq', exerciseId: 'bp' });
  expect(effectiveExerciseId(s1, 'it-sq')).toBe('bp');
  const s2 = sessionReducer(s1, { type: 'tickSet', itemId: 'it-sq', set: squatSet(s1), at: T });
  expect(loggedFor(s2, 'sq-1')!.exerciseId).toBe('bp');      // performed carries the swap
  expect(s2.session.items[0].exerciseId).toBe('sq');         // provenance intact
});

it('moveToEnd reorders itemOrder only', () => {
  const s = sessionReducer(base, { type: 'moveToEnd', itemId: 'it-sq' });
  expect(s.itemOrder[s.itemOrder.length - 1]).toBe('it-sq');
  expect(s.session.items[0].itemId).toBe('it-sq');           // source order untouched
});

it('finish stamps completedAt, flips state, and queues PR + working-max events', () => {
  const s0 = sessionReducer(base, { type: 'start', at: T });
  const pr = { exerciseId: 'sq', repCount: 5, valueKg: 130, achievedAt: T, performedSetId: 'p1' };
  const s = sessionReducer(s0, { type: 'finish', at: T, prEvents: [pr], workingMaxEvents: [] });
  expect(s.completedAt).toBe(T);
  expect(s.session.state).toBe('completed');
  expect(s.outbox).toContainEqual({ kind: 'pr_event', pr });
});

it('every reducer call leaves its input untouched (pure)', () => {
  const frozen = Object.freeze(structuredClone(base));
  expect(() => sessionReducer(frozen as SessionState, { type: 'start', at: T })).not.toThrow();
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @hybrid/strength-mobile test -- sessionState`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the reducer**

`apps/mobile/src/store/sessionState.ts` — implement exactly the Interfaces block. Implementation notes that are contract, not taste:

- ids: `perf-${prescribedSetId ?? 'extra'}-${state.performed.length + 1}` — deterministic, client-generated (Slice 7's design), no `Math.random`.
- `tickSet` derives measurements from `set.targets`: scalar → `value` (the ROUNDED display number — that is what was lifted); range → skipped (a range you merely ticked logs no number for that metric); unresolved/deferred → skipped.
- `logSet` writes exactly the `values` entries given.
- `loggedFor` returns the LATEST row for that prescribedSetId and `null` if that row is `skipped`.
- `unlogSet` appends `{ status: 'skipped', measurements: [] }` — append, never mutate the completed row (the history is the record).
- Every state change that writes performed/outbox rows appends to BOTH `performed` and `outbox` in the same return.
- Reducer is pure: build every new array/object with spread; never touch the input.

- [ ] **Step 4: Run to verify pass**

Run: `pnpm --filter @hybrid/strength-mobile test -- sessionState`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/store/sessionState.ts apps/mobile/src/store/sessionState.test.ts
git commit -m "mobile: pure session reducer — log/skip/add/swap/finish with outbox (Slices 18/23/24 logic)"
```

---

### Task 5: Durable store — persist on every action, survive the kill

**Files:**
- Create: `apps/mobile/src/store/kv.ts`
- Create: `apps/mobile/src/store/SessionStore.tsx`
- Create: `apps/mobile/src/store/SessionStore.test.tsx`
- Modify: `apps/mobile/package.json` (add `@react-native-async-storage/async-storage@^2.2.0` to dependencies)

**Interfaces:**
- Consumes: Task 4's reducer + state; Task 3's repository.
- Produces:

```ts
// kv.ts
export interface KVStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}
export const asyncStorageKV: KVStorage;          // AsyncStorage-backed
export function memoryKV(): KVStorage & { dump(): Record<string, string> };

// SessionStore.tsx
export function SessionProvider(props: {
  storage: KVStorage;
  repository: SessionRepository;
  children: React.ReactNode;
}): JSX.Element;
export function useSession(): {
  state: SessionState | null;                    // null until hydrated
  hydrating: boolean;
  dispatch(action: SessionAction): void;         // reduce → persist → render
};
export const STORE_KEY = 'strength-session-v1';
```

- [ ] **Step 1: Write the failing kill test**

`apps/mobile/src/store/SessionStore.test.tsx`:

```tsx
import { act, render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { memoryKV } from './kv';
import { SessionProvider, useSession, STORE_KEY } from './SessionStore';
import { fixtureRepository } from '../data/fixtureRepository';
import { loggedFor } from './sessionState';

function Probe({ onReady }: { onReady: (s: ReturnType<typeof useSession>) => void }) {
  const s = useSession();
  if (!s.hydrating && s.state) onReady(s);
  return <Text>{s.hydrating ? 'hydrating' : `state:${s.state?.session.state}`}</Text>;
}

const mount = (storage: ReturnType<typeof memoryKV>) => {
  let handle: ReturnType<typeof useSession> | null = null;
  render(
    <SessionProvider storage={storage} repository={fixtureRepository}>
      <Probe onReady={(s) => { handle = s; }} />
    </SessionProvider>,
  );
  return { handle: () => handle! };
};

it('hydrates from the repository when storage is empty', async () => {
  const { handle } = mount(memoryKV());
  await waitFor(() => expect(screen.getByText('state:published')).toBeOnTheScreen());
  expect(handle().state!.session.title).toBe('Week 3 Day 1 — Lower');
});

/* THE KILL TEST (Slice 25). Log two sets, throw the React tree away, remount
 * against ONLY what the storage holds. Both sets must still be there —
 * `Finish` was never the first durable write. */
it('a killed app loses nothing that was ticked', async () => {
  const storage = memoryKV();
  const first = mount(storage);
  await waitFor(() => expect(screen.getByText('state:published')).toBeOnTheScreen());
  const T = '2026-08-21T10:00:00.000Z';
  await act(async () => {
    first.handle().dispatch({ type: 'start', at: T });
  });
  await act(async () => {
    const st = first.handle().state!;
    first.handle().dispatch({ type: 'tickSet', itemId: 'it-sq', set: st.session.items[0].sets[0], at: T });
    first.handle().dispatch({ type: 'tickSet', itemId: 'it-sq', set: st.session.items[0].sets[1], at: T });
  });
  await waitFor(() => expect(JSON.parse(storage.dump()[STORE_KEY]).performed).toHaveLength(2));

  // The "kill": a brand-new tree, same storage, repository NOT consulted for
  // state (it would serve a pristine published session — the bug this guards).
  const second = mount(storage);
  await waitFor(() => expect(screen.getByText('state:in_progress')).toBeOnTheScreen());
  const revived = second.handle().state!;
  expect(revived.performed).toHaveLength(2);
  expect(loggedFor(revived, 'sq-1')).not.toBeNull();
  expect(loggedFor(revived, 'sq-2')).not.toBeNull();
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @hybrid/strength-mobile test -- SessionStore`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement kv + provider**

`kv.ts`: `asyncStorageKV` wraps `AsyncStorage.getItem/setItem`; `memoryKV()` closes over a plain object and exposes `dump()`. Run `pnpm add --filter @hybrid/strength-mobile @react-native-async-storage/async-storage@^2.2.0`.

`SessionStore.tsx`: `useReducer` is NOT enough — persistence must be ordered. Hold state in `useState`; `dispatch` computes `next = sessionReducer(cur, action)`, calls `setState(next)`, and `void storage.set(STORE_KEY, JSON.stringify(next))` in the same tick (fire-and-forget is acceptable; the queue inside AsyncStorage preserves order — record that in a comment). Hydration effect: read `STORE_KEY`; if present, `JSON.parse` and use it; else `repository.todaySessions()` → `initialState(sessions[0])` (and persist that immediately, so the first kill after open also revives). A malformed stored blob (JSON.parse throws) falls back to the repository — a trust boundary, same reasoning as the hybrid engine's `sanitizeDB`; say so in the comment.

- [ ] **Step 4: Run to verify pass**

Run: `pnpm --filter @hybrid/strength-mobile test -- SessionStore`
Expected: PASS (2 tests, the kill test included).

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/store/kv.ts apps/mobile/src/store/SessionStore.tsx apps/mobile/src/store/SessionStore.test.tsx apps/mobile/package.json pnpm-lock.yaml
git commit -m "mobile: durable session store — every action persists, kill test proves it (Slice 25 local half)"
```

---

### Task 6: Target formatting + rest-timer arithmetic (pure)

**Files:**
- Create: `apps/mobile/src/format.ts`, `apps/mobile/src/format.test.ts`
- Create: `apps/mobile/src/timer/rest.ts`, `apps/mobile/src/timer/rest.test.ts`

**Interfaces:**
- Consumes: `ResolvedTargetView` (Task 3), `METRICS` from the engine.
- Produces:

```ts
// format.ts
export function targetLine(targets: ResolvedTargetView[]): string;
// '5 reps · 130 kg · rest 2:30' ; range → '6–8 reps' ; unresolved → 'load: ask your coach'
export function exactLine(targets: ResolvedTargetView[]): string | null;
// '130.5 kg exact' for the long-press reveal; null when nothing was rounded
export function secondsLabel(s: number): string;   // 150 → '2:30'

// timer/rest.ts
export function restTargetSeconds(set: ResolvedSetView): number | null;  // scalar rest target or null
export function remaining(startedAtMs: number, nowMs: number, totalSeconds: number): number; // clamped ≥ 0
```

- [ ] **Step 1: Write the failing tests**

`format.test.ts`:

```ts
import { targetLine, exactLine, secondsLabel } from './format';
const scalar = (metricKey: any, value: number, exact = value) =>
  ({ metricKey, resolved: { kind: 'scalar', value, exact } as const });

it('formats reps + load + rest in prescription order', () => {
  expect(targetLine([scalar('reps', 5), scalar('load', 130, 130.5), scalar('rest', 150)]))
    .toBe('5 reps · 130 kg · rest 2:30');
});
it('formats a range', () => {
  expect(targetLine([{ metricKey: 'reps', resolved: { kind: 'range', lo: 6, hi: 8 } }]))
    .toBe('6–8 reps');
});
it('an unresolved load names itself instead of faking a number', () => {
  expect(targetLine([{ metricKey: 'load', resolved: { kind: 'unresolved', reason: 'no_working_max' } }]))
    .toBe('load: ask your coach');
});
it('exactLine surfaces only genuinely-rounded values', () => {
  expect(exactLine([scalar('load', 130, 130.5)])).toBe('130.5 kg exact');
  expect(exactLine([scalar('load', 130, 130)])).toBeNull();
});
it('secondsLabel', () => {
  expect(secondsLabel(150)).toBe('2:30');
  expect(secondsLabel(45)).toBe('0:45');
});
```

`timer/rest.test.ts`:

```ts
import { restTargetSeconds, remaining } from './rest';

it('reads a scalar rest target off a set', () => {
  const set: any = { targets: [{ metricKey: 'rest', resolved: { kind: 'scalar', value: 150, exact: 150 } }] };
  expect(restTargetSeconds(set)).toBe(150);
});
it('no rest target → null (timer never auto-starts)', () => {
  expect(restTargetSeconds({ targets: [] } as any)).toBeNull();
});
it('remaining counts down and clamps at zero', () => {
  expect(remaining(0, 60_000, 150)).toBe(90);
  expect(remaining(0, 200_000, 150)).toBe(0);
});
```

- [ ] **Step 2: Run to verify failure** — `pnpm --filter @hybrid/strength-mobile test -- format rest` → FAIL.

- [ ] **Step 3: Implement.** `targetLine` maps each target: scalar load → `${value} kg`; scalar reps → `${value} reps`; scalar rest → `rest ${secondsLabel(value)}`; other scalar metrics → `${value} ${METRICS[key].canonicalUnit}`; range → `${lo}–${hi} ${unitWord}`; unresolved → `${key}: ask your coach`; deferred → `${key}: athlete's choice`; joined with `' · '`. Include a header comment: only the REST timer ships in Phase C here — Stopwatch/AMRAP/Tabata/EMOM assumed the hybrid repo's conditioning primitives, which stayed there in the split; they are a recorded gap, not a silent drop.

- [ ] **Step 4: Run to verify pass** — both files PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/format.ts apps/mobile/src/format.test.ts apps/mobile/src/timer/
git commit -m "mobile: target formatting + rest countdown arithmetic (Slices 20/21 logic)"
```

---

### Task 7: The session screen — blocks, set rows, tick/edit, rest timer, 3-dot menu

**Files:**
- Create: `apps/mobile/src/screens/StrengthSession.tsx`
- Create: `apps/mobile/src/screens/StrengthSession.test.tsx`

**Interfaces:**
- Consumes: `useSession` (Task 5), `labelFor` (engine, Task 2), `targetLine`/`exactLine` (Task 6), `restTargetSeconds`/`remaining` (Task 6), `fixtureRepository.workingMaxKg` + `swappableExercises` via props-injected repository.
- Produces: `StrengthSession(props: { repository: SessionRepository; onFinishRequested(): void })` — App switches to the finish screen on that callback.

- [ ] **Step 1: Write the failing behaviour tests** (drive through the real provider + fixture; jest fake timers for the rest countdown):

```tsx
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SessionProvider } from '../store/SessionStore';
import { memoryKV } from '../store/kv';
import { fixtureRepository } from '../data/fixtureRepository';
import { StrengthSession } from './StrengthSession';

const mount = (onFinishRequested = jest.fn()) => {
  render(
    <SessionProvider storage={memoryKV()} repository={fixtureRepository}>
      <StrengthSession repository={fixtureRepository} onFinishRequested={onFinishRequested} />
    </SessionProvider>,
  );
  return onFinishRequested;
};

it('renders every item with its grouping label and target line', async () => {
  mount();
  await waitFor(() => expect(screen.getByText('Back Squat')).toBeOnTheScreen());
  expect(screen.getByText('A')).toBeOnTheScreen();        // lone squat
  expect(screen.getByText('C1')).toBeOnTheScreen();       // superset pair after two lone items
  expect(screen.getByText('C2')).toBeOnTheScreen();
  expect(screen.getAllByText('5 reps · 130 kg · rest 2:30').length).toBe(5);
});

it('a published session shows Start, and set rows only tick after starting', async () => {
  mount();
  await waitFor(() => expect(screen.getByText(/start session/i)).toBeOnTheScreen());
  fireEvent.press(screen.getByText(/start session/i));
  const row = screen.getAllByTestId('set-row-tick')[0];
  fireEvent.press(row);
  await waitFor(() => expect(screen.getAllByTestId('set-row-done').length).toBe(1));
});

it('ticking a set with a rest target starts the countdown', async () => {
  jest.useFakeTimers();
  mount();
  await waitFor(() => expect(screen.getByText(/start session/i)).toBeOnTheScreen());
  fireEvent.press(screen.getByText(/start session/i));
  fireEvent.press(screen.getAllByTestId('set-row-tick')[0]);
  await act(async () => { jest.advanceTimersByTime(1000); });
  expect(screen.getByTestId('rest-timer')).toHaveTextContent(/2:2\d/);
  jest.useRealTimers();
});

it('long-press reveals the exact unrounded load', async () => {
  mount();
  await waitFor(() => expect(screen.getByText(/start session/i)).toBeOnTheScreen());
  fireEvent(screen.getAllByTestId('set-row')[0], 'longPress');
  expect(screen.getByText('130.5 kg exact')).toBeOnTheScreen();
});

it('the 3-dot menu shows working max and the % table, and can move the item to the end', async () => {
  mount();
  await waitFor(() => expect(screen.getByText('Back Squat')).toBeOnTheScreen());
  fireEvent.press(screen.getAllByTestId('item-menu')[0]);
  expect(screen.getByText(/working max/i)).toBeOnTheScreen();
  expect(screen.getByText('180 kg')).toBeOnTheScreen();
  expect(screen.getByText(/90%.*162\.5 kg/)).toBeOnTheScreen();  // roundLoadToEquipment(162, barbell)…
  fireEvent.press(screen.getByText(/move to end/i));
  const names = screen.getAllByTestId('item-name').map((n) => n.props.children);
  expect(names[names.length - 1]).toBe('Back Squat');
});

it('finish button hands off once at least one set is logged', async () => {
  const onFinish = mount();
  await waitFor(() => expect(screen.getByText(/start session/i)).toBeOnTheScreen());
  fireEvent.press(screen.getByText(/start session/i));
  fireEvent.press(screen.getAllByTestId('set-row-tick')[0]);
  fireEvent.press(screen.getByText(/finish session/i));
  expect(onFinish).toHaveBeenCalled();
});
```

Note on the `%` table assertion: compute the expected figure by RUNNING `roundLoadToEquipment(0.9 * 180, barbell)` in a scratch — if the engine rounds 162 to something other than 162.5, the TEST expectation is what changes. Never bend the engine to a guess.

- [ ] **Step 2: Run to verify failure** — module not found.

- [ ] **Step 3: Implement the screen.** Structure: header (title, date, Start/Finish button per state) → items in `state.itemOrder`, each: label chip (from `labelFor` run over items reordered by `itemOrder`), name (testID `item-name`), 3-dot (testID `item-menu`) opening an inline panel (comments TextInput bound to `setComment`; working max via `repository.workingMaxKg(effectiveExerciseId(...))`; % table rows 60–95% step 5 through `roundLoadToEquipment`; lift history = this session's `performed` rows for the exercise; swap = list of `repository.swappableExercises()` dispatching `swapExercise`; move-to-end dispatching `moveToEnd`) → set rows (testID `set-row`): target line, tick zone (testID `set-row-tick` → `tickSet`; done state testID `set-row-done`; pressing a done row → `unlogSet`), pressing the row text opens per-metric numeric `TextInput`s + Save → `logSet`; long-press → `exactLine` reveal; `+ add set` → `addSet`. Rest timer: on `tickSet` where `restTargetSeconds(set)` non-null, store `{ startedAtMs: Date.now(), total }` in local component state; a 500ms interval renders `remaining()` (testID `rest-timer`); reaching 0 clears it. Styling follows the scaffold's existing dark palette constants; every tappable ≥ 44pt height.

- [ ] **Step 4: Run to verify pass** — `pnpm --filter @hybrid/strength-mobile test -- StrengthSession` PASS, then full mobile suite green.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/screens/StrengthSession.tsx apps/mobile/src/screens/StrengthSession.test.tsx
git commit -m "mobile: strength session screen — blocks, tick/edit rows, rest timer, 3-dot menu (Slices 18-23 UI)"
```

---

### Task 8: Finish screen — RPE, duration, comment, PR sweep

**Files:**
- Create: `apps/mobile/src/screens/FinishSession.tsx`
- Create: `apps/mobile/src/screens/FinishSession.test.tsx`

**Interfaces:**
- Consumes: `useSession`; engine `detectPr`, `e1rm`, `measurementValue`; `WorkingMaxEvent`.
- Produces: `FinishSession(props: { onDone(): void })`. Dispatches `finishMeta` then `finish` with computed `prEvents` (and, when `session.isTest`, `workingMaxEvents` from the session's best e1rm per exercise, `source: 'test_result'`).

- [ ] **Step 1: Write the failing tests**

```tsx
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SessionProvider, useSession } from '../store/SessionStore';
import { memoryKV } from '../store/kv';
import { fixtureRepository } from '../data/fixtureRepository';
import { FinishSession } from './FinishSession';

/* Harness: log one squat set (130kg × 5) before rendering the finish screen,
 * so the PR sweep has a real completed set to find. */
function Prime() {
  const { state, dispatch, hydrating } = useSession();
  if (!hydrating && state && state.session.state === 'published') {
    const T = '2026-08-21T10:00:00.000Z';
    dispatch({ type: 'start', at: T });
    dispatch({ type: 'tickSet', itemId: 'it-sq', set: state.session.items[0].sets[0], at: T });
  }
  return null;
}

const mount = (onDone = jest.fn()) => {
  render(
    <SessionProvider storage={memoryKV()} repository={fixtureRepository}>
      <Prime />
      <FinishSession onDone={onDone} />
    </SessionProvider>,
  );
  return onDone;
};

it('pre-fills duration from startedAt and lets the athlete override it', async () => {
  mount();
  await waitFor(() => expect(screen.getByTestId('duration-input')).toBeOnTheScreen());
  fireEvent.changeText(screen.getByTestId('duration-input'), '55');
  expect(screen.getByTestId('duration-input').props.value).toBe('55');
});

it('finishing completes the session and queues a PR for the fresh 5-rep best', async () => {
  const onDone = mount();
  await waitFor(() => expect(screen.getByText(/finish session/i)).toBeOnTheScreen());
  fireEvent.press(screen.getByTestId('rpe-8'));
  await act(async () => { fireEvent.press(screen.getByText(/finish session/i)); });
  expect(onDone).toHaveBeenCalled();
  // The store's outbox now carries the completed transition AND a pr_event:
  // with no prior history, the first completed 130×5 IS the 5-rep PR.
});

it('the queued pr_event is per rep-count with the performed set id attached', async () => {
  let grab: any;
  function Grab() { grab = useSession(); return null; }
  render(
    <SessionProvider storage={memoryKV()} repository={fixtureRepository}>
      <Prime /><Grab /><FinishSession onDone={jest.fn()} />
    </SessionProvider>,
  );
  await waitFor(() => expect(screen.getByText(/finish session/i)).toBeOnTheScreen());
  await act(async () => { fireEvent.press(screen.getByText(/finish session/i)); });
  const pr = grab.state.outbox.find((e: any) => e.kind === 'pr_event');
  expect(pr.pr).toMatchObject({ exerciseId: 'sq', repCount: 5, valueKg: 130 });
});
```

- [ ] **Step 2: Run to verify failure** — module not found.

- [ ] **Step 3: Implement.** RPE row: pressables 1–10 (testID `rpe-${n}`). Duration: `TextInput` (testID `duration-input`) pre-filled `Math.round((now - startedAt)/60000)` minutes. Comment `TextInput`. Finish button: builds the PR list by walking `state.performed` (status `completed`, reps > 0, load present via `measurementValue`) through `detectPr` against the session's own accumulating history (earliest first — a later heavier set beats an earlier one, both never both PR); when `state.session.isTest`, also builds one `WorkingMaxEvent` per exercise from the best `e1rm(load, reps)` of its completed sets, `source: 'test_result'`, `formula: 'epley'`, `fromSetId` = that set's id; dispatches `finishMeta` then `finish`; calls `onDone()`.

- [ ] **Step 4: Run to verify pass** — file PASS + full mobile suite green.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/screens/FinishSession.tsx apps/mobile/src/screens/FinishSession.test.tsx
git commit -m "mobile: finish screen — RPE/duration/comment, PR sweep, is_test working-max writes (Slice 24)"
```

---

### Task 9: App shell — Today list, screen switching, closeout

**Files:**
- Create: `apps/mobile/src/screens/Today.tsx`
- Modify: `apps/mobile/src/App.tsx` (replace the placeholder)
- Modify: `apps/mobile/src/App.test.tsx` (the placeholder assertion dies with the placeholder)
- Modify: `handoff.md` (Phase C status section)

**Interfaces:**
- Consumes: everything above.
- Produces: the shipped app. `App` wires `SessionProvider(storage: asyncStorageKV, repository: fixtureRepository)` and switches `today → session → finish → today` on local state. No navigation library — three screens do not earn the dependency; the comment in App.tsx says so and names what would change the answer (deep links, an athlete-facing stack).

- [ ] **Step 1: Rewrite `App.test.tsx` as the failing shell test**

```tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { App } from './App';

it('boots to Today with the fixture session card, opens it, and comes back after finish', async () => {
  render(<App />);
  await waitFor(() => expect(screen.getByText('Week 3 Day 1 — Lower')).toBeOnTheScreen());
  fireEvent.press(screen.getByText('Week 3 Day 1 — Lower'));
  await waitFor(() => expect(screen.getByText(/start session/i)).toBeOnTheScreen());
});
```

(App renders with `memoryKV` when `process.env.NODE_ENV === 'test'` — inject via a `storage` prop defaulting to `asyncStorageKV`, and pass `memoryKV()` in the test instead of mocking AsyncStorage.)

- [ ] **Step 2: Run to verify failure** — the old placeholder text assertion is gone; new test FAILS against the placeholder App.

- [ ] **Step 3: Implement `Today.tsx`** (list of `repository.todaySessions()` as pressable cards: title, date, state chip) **and the new `App.tsx`** (provider + `useState<'today'|'session'|'finish'>` switcher; session's `onFinishRequested` → 'finish'; finish's `onDone` → 'today'). Keep the dark palette; delete nothing from the engine-link proof — move the METRICS count line into Today's footer so the workspace-link proof survives.

- [ ] **Step 4: Run everything**

Run: `pnpm --filter @hybrid/strength-mobile test` → all green.
Run: `pnpm run verify` (repo root) → typecheck + all suites + migrations + build green.

- [ ] **Step 5: Manual device pass (recorded, not automated)**

Run `pnpm --filter @hybrid/strength-mobile start` and on a standard-width phone (or emulator at 420px-equivalent) confirm: no horizontal scroll on the session screen with the 5-field row; every control comfortably tappable. Record the result in the handoff section (next step) — this is the spec's screenshot-test stand-in until a native screenshot harness exists, and it is stated as such.

- [ ] **Step 6: Update `handoff.md`** — add a dated "Phase C — mobile logger" section: what shipped (Slices 18–24 + local half of 25, on fixture data), what is DEFERRED with reasons (Supabase sync + auth = next plan; Stopwatch/AMRAP/Tabata/EMOM timers = conditioning primitives stayed in the hybrid repo; rescheduling/`moved` state = out of rebuild scope per spec), and the standing rule that the outbox is append-only and unconsumed until the sync plan.

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/src/App.tsx apps/mobile/src/App.test.tsx apps/mobile/src/screens/Today.tsx handoff.md
git commit -m "mobile: app shell — Today list and screen flow; Phase C logger complete on fixture data"
```

---

## Self-Review (run before execution)

1. **Spec coverage:** Slice 18 → Tasks 4/7/9 (state machine); 19 → Tasks 2/7; 20 → Tasks 6/7 (per-target rows, tick vs keypad, long-press exact); 21 → Task 6/7 (REST only — recorded divergence); 22 → Task 7 (comments, history, working max, % calc, move-to-end); 23 → Tasks 4/7 (swap provenance, add/soft-remove); 24 → Task 8; 25 → Task 5 (local half; sync half explicitly deferred to the next plan). Gaps stated, none silent.
2. **Placeholder scan:** none — every step carries code or an exact recipe naming real functions.
3. **Type consistency:** `SessionRepository` (Tasks 3/5/7), `SessionState`/`SessionAction` (Tasks 4/5/7/8), `ResolvedSetView` (3/4/6/7), `labelFor` (2/7), `STORE_KEY` (5), `memoryKV` (5/7/8/9) — names match across tasks.
