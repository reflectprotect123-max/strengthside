/**
 * Holds + distance carries are sealed from Adaptive.
 * - Timed holds: WorkOverlay only (no decideNextLift).
 * - Loaded carries: distance effort, not a timer; Adaptive never fills/opens/closes them.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const profiles = readFileSync(join(dir, 'exercise-load-profiles.js'), 'utf8');
const columns = readFileSync(join(dir, 'log-columns.js'), 'utf8');

function must(cond, msg) {
  if (!cond) throw new Error(msg);
}

must(html.includes('function isCarryExercise'), 'isCarryExercise helper');
must(html.includes('function isCarryRow'), 'isCarryRow helper');
must(html.includes('function isSealedEffortRow'), 'isSealedEffortRow helper');
must(
  html.includes('if(isHoldRow(r)){startHoldCountdown(i);return}'),
  'holds still start countdown',
);
must(html.includes('isCarryExercise'), 'carry seal referenced in HTML');

const toggleStart = html.indexOf('function toggleSet');
must(toggleStart >= 0, 'toggleSet present');
const toggle = html.slice(toggleStart, toggleStart + 550);
must(toggle.includes('isCarryExercise') || toggle.includes('isCarryRow'), 'toggleSet checks carry seal');
must(toggle.includes('startHoldCountdown'), 'toggleSet still routes holds to countdown');

const fillStart = html.indexOf('function fillNextLiftFromLog');
must(fillStart >= 0, 'fillNextLiftFromLog present');
const fill = html.slice(fillStart, fillStart + 500);
must(fill.includes('isCarryRow') || fill.includes('distance'), 'fillNextLiftFromLog skips distance/carry');

const openStart = html.indexOf('function applyOpenLiftToEx');
must(openStart >= 0, 'applyOpenLiftToEx present');
const open = html.slice(openStart, openStart + 400);
must(open.includes('isCarryExercise'), 'Open skips carry exercises');

const closeStart = html.indexOf('function persistCloseForEx');
must(closeStart >= 0, 'persistCloseForEx present');
const close = html.slice(closeStart, closeStart + 350);
must(close.includes('isCarryExercise'), 'Close skips carry exercises');

must(
  columns.includes("targetKind: 'distance'") || columns.includes('targetKind:"distance"'),
  'distance_m columns use targetKind distance',
);

const sandbox = { window: {}, console };
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(profiles, sandbox);
vm.runInContext(columns, sandbox);

const ELP = sandbox.ExerciseLoadProfiles;
const LC = sandbox.LogColumns;

const farmerWalk = ELP.defaultLogColumns('core-farmer-walk');
must(
  farmerWalk && farmerWalk.map((c) => c.kind).join(',') === 'weight_kg,distance_m',
  'core-farmer-walk → weight_kg + distance_m only (no prescribed time)',
);

const farmerCarry = ELP.defaultLogColumns('core-farmer-carry');
must(
  farmerCarry && farmerCarry.map((c) => c.kind).join(',') === 'weight_kg,distance_m',
  'core-farmer-carry aliases to distance carry profile',
);

const suitcase = ELP.defaultLogColumns('core-suitcase-carry');
must(
  suitcase && suitcase.map((c) => c.kind).join(',') === 'weight_kg,distance_m',
  'core-suitcase-carry → weight + distance',
);

const plank = ELP.defaultLogColumns('core-plank');
must(plank && plank.length === 1 && plank[0].kind === 'time_sec', 'plank stays time_sec');

const carryEx = {
  name: 'Farmer Carry',
  category: 'Carries',
  exerciseId: 'core-farmer-carry',
  logColumns: farmerCarry,
};
const carryRows = [{ n: 1, target: '40', targetKind: 'reps', weight: '', reps: '', done: false }];
LC.applyColumnTargetKinds(carryEx, carryRows);
must(carryRows[0].targetKind === 'distance', 'carry rows get targetKind distance');

console.log('hold-carry-seal.smoke: ok');
