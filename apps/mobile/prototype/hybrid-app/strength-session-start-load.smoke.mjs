/**
 * Smoke: session-start load stamp — set 1 only (one-set logger).
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

const sessionDate = '2026-08-20';
const state = {
  meta: { ownerId: 'athlete-1' },
  strengthState: {
    workingMaxEvents: [{
      id: 'wm-squat',
      athleteId: 'athlete-1',
      exerciseId: 'squat',
      valueKg: 100,
      source: 'coach_set',
      formula: null,
      fromSetId: null,
      effectiveAt: `${sessionDate}T08:00:00.000Z`,
    }],
    prEvents: [],
    loadHints: {},
  },
};

function makeRow(weight) {
  return { id: 'r1', n: 1, target: '', targetKind: '', weight, reps: '', rir: '', done: false, extra: false };
}

const tasksBlank = [{
  id: 't1',
  kind: 'strength',
  exerciseId: 'squat',
  sets: 3,
  reps: '5',
  loadExpr: { exprKind: 'pct_of_max', exprArg: 0.7 },
  rows: [makeRow(''), makeRow(''), makeRow('')],
}];
StrengthAdapter.applyAutopilotToTasks(state, tasksBlank, sessionDate);
if (tasksBlank[0].rows[0].weight !== 70) {
  throw new Error(`Expected set-1 weight 70, got ${tasksBlank[0].rows[0].weight}`);
}
if (tasksBlank[0].rows[1].weight !== '') {
  throw new Error('Set 2+ should stay blank at session start, got ' + tasksBlank[0].rows[1].weight);
}

console.log('strength-session-start-load.smoke: ok');
