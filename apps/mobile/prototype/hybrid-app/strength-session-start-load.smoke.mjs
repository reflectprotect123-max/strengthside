/**
 * Smoke: session-start %WM load stamp via applyLoadHintsToTasks (S4 flatten path).
 * Fixture: squat 70% WM + 100kg → row weight 70; no overwrite; no_working_max stays blank.
 * Run: bash apps/mobile/prototype/hybrid-app/build-strength.sh && node apps/mobile/prototype/hybrid-app/strength-session-start-load.smoke.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const bundle = readFileSync(join(dir, 'strength-bundle.js'), 'utf8');
const adapterSrc = readFileSync(join(dir, 'strength-adapter.js'), 'utf8');

const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(`${bundle}; window.HybridStrength = HybridStrength; ${adapterSrc}`, sandbox);

const { StrengthAdapter } = sandbox.window;

if (!StrengthAdapter?.applyLoadHintsToTasks) {
  throw new Error('StrengthAdapter.applyLoadHintsToTasks missing');
}

const sessionDate = '2026-08-20';
const state = {
  meta: { ownerId: 'athlete-1' },
  strengthState: {
    workingMaxEvents: [
      {
        id: 'wm-bench',
        athleteId: 'athlete-1',
        exerciseId: 'bench',
        valueKg: 200,
        source: 'coach_set',
        formula: null,
        fromSetId: null,
        effectiveAt: `${sessionDate}T10:00:00.000Z`,
      },
      {
        id: 'wm-squat',
        athleteId: 'athlete-1',
        exerciseId: 'squat',
        valueKg: 100,
        source: 'coach_set',
        formula: null,
        fromSetId: null,
        effectiveAt: `${sessionDate}T08:00:00.000Z`,
      },
    ],
    prEvents: [],
    loadHints: {},
  },
};

function makeRow(weight) {
  return { id: 'r1', n: 1, target: '', targetKind: '', weight, reps: '', rir: '', done: false, extra: false };
}

// Happy path: blank rows get 70% of squat WM (not bench's globally-latest WM)
const tasksBlank = [{
  id: 't1',
  kind: 'strength',
  exerciseId: 'squat',
  loadExpr: { exprKind: 'pct_of_max', exprArg: 0.7 },
  rows: [makeRow(''), makeRow('')],
}];
StrengthAdapter.applyLoadHintsToTasks(state, tasksBlank, sessionDate);
for (const row of tasksBlank[0].rows) {
  if (row.weight !== 70) {
    throw new Error(`Expected blank row weight 70, got ${row.weight}`);
  }
}

// Must not overwrite athlete-edited weight
const tasksFilled = [{
  id: 't2',
  kind: 'strength',
  exerciseId: 'squat',
  loadExpr: { exprKind: 'pct_of_max', exprArg: 0.7 },
  rows: [makeRow('85'), makeRow('')],
}];
StrengthAdapter.applyLoadHintsToTasks(state, tasksFilled, sessionDate);
if (tasksFilled[0].rows[0].weight !== '85') {
  throw new Error('Expected pre-filled row weight 85 unchanged, got ' + tasksFilled[0].rows[0].weight);
}
if (tasksFilled[0].rows[1].weight !== 70) {
  throw new Error('Expected blank row weight 70, got ' + tasksFilled[0].rows[1].weight);
}

// no_working_max before WM effective date → leave blank
const tasksNoWm = [{
  id: 't3',
  kind: 'strength',
  exerciseId: 'squat',
  loadExpr: { exprKind: 'pct_of_max', exprArg: 0.7 },
  rows: [makeRow('')],
}];
StrengthAdapter.applyLoadHintsToTasks(state, tasksNoWm, '2026-08-19');
if (tasksNoWm[0].rows[0].weight !== '') {
  throw new Error('Expected blank weight when no WM as-of session date, got ' + tasksNoWm[0].rows[0].weight);
}

// Equipment rounding: 67.5 with barbell down-round from 70% of 96.43… actually 70% of 100 = 70, use 95 WM → 66.5 → 65 with 2.5 down
const stateRound = {
  meta: { ownerId: 'athlete-1' },
  strengthState: {
    workingMaxEvents: [{
      id: 'wm-dead',
      athleteId: 'athlete-1',
      exerciseId: 'deadlift',
      valueKg: 95,
      source: 'coach_set',
      formula: null,
      fromSetId: null,
      effectiveAt: `${sessionDate}T08:00:00.000Z`,
    }],
    prEvents: [],
    loadHints: {},
  },
};
const tasksRound = [{
  id: 't4',
  kind: 'strength',
  exerciseId: 'deadlift',
  loadExpr: { exprKind: 'pct_of_max', exprArg: 0.7 },
  equipment: { id: 'bb', name: 'Barbell', incrementKg: 2.5, rackValuesKg: null, rounding: 'down' },
  rows: [makeRow('')],
}];
StrengthAdapter.applyLoadHintsToTasks(stateRound, tasksRound, sessionDate);
if (tasksRound[0].rows[0].weight !== 65) {
  throw new Error('Expected equipment-rounded weight 65 (70% of 95 down to 2.5kg), got ' + tasksRound[0].rows[0].weight);
}

console.log('strength-session-start-load.smoke: ok');
