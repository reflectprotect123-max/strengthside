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

console.log('strength-timed-hold.smoke.mjs OK');
