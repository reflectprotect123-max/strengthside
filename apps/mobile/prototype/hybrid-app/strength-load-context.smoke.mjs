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
    loadHints: { squat: { loadKg: 62.5, updatedAt: `${date}T09:00:00.000Z`, source: 'session_anchor' } },
  },
  sessions: [],
};

const ex = {
  exerciseId: 'squat',
  loadExpr: { exprKind: 'pct_of_max', exprArg: 0.7 },
};

// V3: saved anchor wins immediately — no calibration gate before using loadHints.
const hintCtx = StrengthAdapter.sessionLoadContext(baseState, ex, date);
if (!hintCtx.ok || hintCtx.loadKg !== 62.5 || hintCtx.source !== 'anchor') {
  throw new Error('Expected anchor hint 62.5kg, got ' + JSON.stringify(hintCtx));
}
if (!String(hintCtx.detail || '').includes('70 kg')) {
  throw new Error('Expected %WM prescription noted in detail, got ' + hintCtx.detail);
}

const coldCal = StrengthAdapter.calibrationForExercise(baseState, 'squat');
if (!coldCal || coldCal.state !== 'uncalibrated' || coldCal.count !== 0) {
  throw new Error('Expected cold uncalibrated state, got ' + JSON.stringify(coldCal));
}

// Without a hint, %WM prescription drives the headline.
const noHintState = {
  ...baseState,
  strengthState: {
    ...baseState.strengthState,
    loadHints: {},
  },
};
const prescCtx = StrengthAdapter.sessionLoadContext(noHintState, ex, date);
if (!prescCtx.ok || prescCtx.loadKg !== 70 || prescCtx.source !== 'prescription') {
  throw new Error('Expected prescription 70kg without hint, got ' + JSON.stringify(prescCtx));
}

console.log('strength-load-context.smoke: ok');
