/**
 * Smoke: StrengthAdapter.resolveExerciseLoad for %WM prescriptions.
 * Run: bash apps/mobile/prototype/hybrid-app/build-strength.sh && node apps/mobile/prototype/hybrid-app/strength-adapter-resolve.smoke.mjs
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

if (!StrengthAdapter?.resolveExerciseLoad) {
  throw new Error('StrengthAdapter.resolveExerciseLoad missing');
}

const today = new Date().toISOString().slice(0, 10);
const state = {
  meta: { ownerId: 'athlete-1' },
  strengthState: {
    workingMaxEvents: [{
      id: 'wm1',
      athleteId: 'athlete-1',
      exerciseId: 'squat',
      valueKg: 100,
      source: 'coach_set',
      formula: null,
      fromSetId: null,
      effectiveAt: `${today}T08:00:00.000Z`,
    }],
    prEvents: [],
    loadHints: {},
  },
};

const exercise = {
  exerciseId: 'squat',
  loadExpr: { exprKind: 'pct_of_max', exprArg: 0.7 },
};

const result = StrengthAdapter.resolveExerciseLoad(state, exercise, today);

if (!result || result.unresolvedReason != null) {
  throw new Error('Expected resolved load, got ' + JSON.stringify(result));
}
if (result.loadKg !== 70) {
  throw new Error('Expected loadKg 70 (70% of 100kg WM), got ' + result.loadKg);
}

console.log('strength-adapter-resolve.smoke: ok');
