/**
 * Smoke: sessionLoadContext + calibrationForExercise for logger headline.
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

if (!StrengthAdapter?.sessionLoadContext) {
  throw new Error('sessionLoadContext missing');
}

const date = '2026-08-20';
const baseState = {
  meta: { ownerId: 'a1' },
  strengthState: {
    workingMaxEvents: [{
      id: 'wm1', athleteId: 'a1', exerciseId: 'squat', valueKg: 100,
      source: 'coach_set', formula: null, fromSetId: null,
      effectiveAt: `${date}T08:00:00.000Z`,
    }],
    prEvents: [],
    loadHints: { squat: { loadKg: 62.5, updatedAt: `${date}T09:00:00.000Z`, source: 'auto_estimate' } },
  },
  sessions: [],
};

const ex = {
  exerciseId: 'squat',
  loadExpr: { exprKind: 'pct_of_max', exprArg: 0.7 },
};

// With no usable exposure history, %WM prescription wins over hint.
const coldCtx = StrengthAdapter.sessionLoadContext(baseState, ex, date);
if (!coldCtx.ok || coldCtx.loadKg !== 70 || coldCtx.source !== 'prescription') {
  throw new Error('Expected prescription 70kg on cold start, got ' + JSON.stringify(coldCtx));
}

const coldCal = StrengthAdapter.calibrationForExercise(baseState, 'squat');
if (!coldCal || coldCal.state !== 'uncalibrated' || coldCal.count !== 0) {
  throw new Error('Expected cold uncalibrated state, got ' + JSON.stringify(coldCal));
}

// After 2 usable sessions, autopilot hint should drive the headline/context.
const state = {
  ...baseState,
  sessions: [
    {
      id: 's1',
      status: 'completed',
      date: '2026-08-18',
      tasks: [{ kind: 'strength', exerciseId: 'squat', rows: [{ done: true, weight: 60, reps: 8, rir: 2, targetKind: '' }] }],
    },
    {
      id: 's2',
      status: 'completed',
      date: '2026-08-19',
      tasks: [{ kind: 'strength', exerciseId: 'squat', rows: [{ done: true, weight: 62.5, reps: 8, rir: 2, targetKind: '' }] }],
    },
  ],
};
const warmCtx = StrengthAdapter.sessionLoadContext(state, ex, date);
if (!warmCtx.ok || warmCtx.loadKg !== 62.5 || warmCtx.source !== 'progression') {
  throw new Error('Expected progression hint 62.5 after 2 sessions, got ' + JSON.stringify(warmCtx));
}
const warmCal = StrengthAdapter.calibrationForExercise(state, 'squat');
if (!warmCal || warmCal.state !== 'calibrated' || warmCal.count < 2) {
  throw new Error('Expected calibrated after 2 sessions, got ' + JSON.stringify(warmCal));
}

console.log('strength-load-context.smoke: ok');
