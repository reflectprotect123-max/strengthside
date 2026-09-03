/**
 * Smoke: timed holds (plank) excluded from rep-volume progression.
 * Run: bash apps/mobile/prototype/hybrid-app/build-strength.sh && node apps/mobile/prototype/hybrid-app/strength-timed-hold.smoke.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

function must(cond, msg) {
  if (!cond) throw new Error(msg);
}

const dir = dirname(fileURLToPath(import.meta.url));
const bundle = readFileSync(join(dir, 'strength-bundle.js'), 'utf8');
const adapterSrc = readFileSync(join(dir, 'strength-adapter.js'), 'utf8');

const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(`${bundle}; window.HybridStrength = HybridStrength; ${adapterSrc}`, sandbox);

const { StrengthAdapter } = sandbox.window;

must(StrengthAdapter.timedHoldLift, 'timedHoldLift exported');

must(
  !StrengthAdapter.repProgressionLift('Plank', 'core', {}, 'plank', []),
  'plank not rep progression',
);
must(
  StrengthAdapter.timedHoldLift('Plank', 'core', { logColumns: [{ kind: 'time_sec' }] }),
  'plank is timed hold',
);
must(
  StrengthAdapter.repProgressionLift('Pull Up', 'back', {}, 'pull_up', []),
  'pull-up still rep progression',
);
must(
  !StrengthAdapter.repProgressionLift('Plank', 'core', {}, 'plank', [], {
    logColumns: [{ kind: 'time_sec' }],
  }),
  'plank with time_sec logColumns not rep progression',
);
must(
  !StrengthAdapter.timedHoldLift('Farmer Walk', 'carry', {
    logColumns: [{ kind: 'weight_kg' }, { kind: 'distance_m' }, { kind: 'time_sec' }],
  }),
  'loaded carry with time_sec is not time-only hold',
);

must(StrengthAdapter.htmlRowToPerformed, 'htmlRowToPerformed exported');

const session = { id: 's1', completedAt: Date.now() };
const task = { id: 't1', kind: 'strength', exerciseId: 'core-plank' };
const plankEx = { exerciseId: 'core-plank', logColumns: [{ kind: 'time_sec' }] };
const plankRow = { n: 1, weight: 0, reps: 45, targetKind: 'seconds', done: true, rir: 2 };
const plankPerf = StrengthAdapter.htmlRowToPerformed(session, task, plankEx, plankRow);
must(
  plankPerf.measurements.some((m) => m.metricKey === 'duration' && m.value === 45),
  'seconds row → duration measurement',
);
must(
  !plankPerf.measurements.some((m) => m.metricKey === 'reps'),
  'seconds row should not emit reps',
);

const carryEx = {
  exerciseId: 'core-farmer-walk',
  logColumns: [{ kind: 'weight_kg' }, { kind: 'distance_m' }, { kind: 'time_sec' }],
};
const carryRow = { n: 1, weight: 24, distance: 40, reps: 45, targetKind: 'reps', done: true };
const carryPerf = StrengthAdapter.htmlRowToPerformed(session, task, carryEx, carryRow);
must(
  carryPerf.measurements.some((m) => m.metricKey === 'load' && m.value === 24),
  'carry load unchanged',
);
must(
  carryPerf.measurements.some((m) => m.metricKey === 'distance' && m.value === 40),
  'carry distance measurement',
);
must(
  carryPerf.measurements.some((m) => m.metricKey === 'duration' && m.value === 45),
  'carry time_sec → duration',
);
must(
  !carryPerf.measurements.some((m) => m.metricKey === 'reps'),
  'carry with time_sec should not emit reps',
);

const benchEx = { exerciseId: 'bp', logColumns: [{ kind: 'weight_kg' }, { kind: 'reps' }] };
const benchRow = { n: 1, weight: 100, reps: 5, targetKind: 'reps', done: true };
const benchPerf = StrengthAdapter.htmlRowToPerformed(session, task, benchEx, benchRow);
must(
  benchPerf.measurements.some((m) => m.metricKey === 'load' && m.value === 100),
  'bench load unchanged',
);
must(
  benchPerf.measurements.some((m) => m.metricKey === 'reps' && m.value === 5),
  'bench reps unchanged',
);
must(
  !benchPerf.measurements.some((m) => m.metricKey === 'duration'),
  'bench should not emit duration',
);

console.log('strength-timed-hold.smoke.mjs OK');
