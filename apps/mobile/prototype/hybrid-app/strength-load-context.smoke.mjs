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
const state = {
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

const ctx = StrengthAdapter.sessionLoadContext(state, ex, date);
if (!ctx.ok || ctx.loadKg !== 62.5 || ctx.source !== 'progression') {
  throw new Error('Expected progression hint 62.5, got ' + JSON.stringify(ctx));
}

const cal = StrengthAdapter.calibrationForExercise(state, 'squat');
if (!cal || cal.state !== 'uncalibrated') {
  throw new Error('Expected uncalibrated, got ' + JSON.stringify(cal));
}

console.log('strength-load-context.smoke: ok');
