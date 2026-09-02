/**
 * Smoke: athlete autopilot lift (no loadExpr) gets engine volume + set-1 load at session start.
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

const sessionDate = '2026-09-02';
const state = {
  meta: { ownerId: 'athlete-1' },
  strengthState: {
    workingMaxEvents: [{
      id: 'wm-bench',
      athleteId: 'athlete-1',
      exerciseId: 'core-bench-press',
      valueKg: 100,
      source: 'athlete_set',
      formula: null,
      fromSetId: null,
      effectiveAt: `${sessionDate}T08:00:00.000Z`,
    }],
    prEvents: [],
    loadHints: {},
  },
};

const tasks = [{
  id: 't1',
  kind: 'strength',
  exerciseId: 'core-bench-press',
  name: 'Bench Press',
  category: 'Strength — Push',
  autopilotVolume: true,
  sets: null,
  reps: null,
  logColumns: [
    { id: 'load', kind: 'weight_pct_wm', value: '', values: [''] },
    { id: 'effort', kind: 'reps', value: '', values: [''] },
  ],
  rows: [],
}];

StrengthAdapter.applyAutopilotToTasks(state, tasks, sessionDate);
const t = tasks[0];

if (!t.rows || t.rows.length < 1) {
  throw new Error('Expected autopilot volume rows, got ' + (t.rows?.length));
}
if (!t.reps || !t.sets) {
  throw new Error('Expected engine sets/reps, got sets=' + t.sets + ' reps=' + t.reps);
}
if (t.rows[0].weight !== 70) {
  throw new Error(`Expected set-1 weight 70 kg (70% WM), got ${t.rows[0].weight}`);
}
if (t.rows[0].reps !== '8' && t.rows[0].reps !== String(parseInt(t.reps, 10))) {
  throw new Error(`Expected set-1 reps from prescription, got ${t.rows[0].reps}`);
}

// Progression hint beats default %WM
const hinted = [{
  id: 't2',
  kind: 'strength',
  exerciseId: 'core-bench-press',
  name: 'Bench Press',
  category: 'Strength — Push',
  autopilotVolume: true,
  sets: null,
  reps: null,
  rows: [{ id: 'r1', n: 1, target: '8', targetKind: 'reps', weight: '', reps: '8', done: false, extra: false }],
}];
const stateHint = {
  ...state,
  strengthState: {
    ...state.strengthState,
    loadHints: { 'core-bench-press': { loadKg: 82.5, source: 'auto_estimate', updatedAt: sessionDate } },
  },
};
StrengthAdapter.applyLoadHintsToTasks(stateHint, hinted, sessionDate);
if (hinted[0].rows[0].weight !== 82.5) {
  throw new Error('Expected load hint 82.5, got ' + hinted[0].rows[0].weight);
}

console.log('strength-athlete-autopilot-load.smoke: ok');
