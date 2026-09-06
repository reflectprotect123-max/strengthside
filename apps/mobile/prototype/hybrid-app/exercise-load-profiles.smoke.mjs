/**
 * Smoke: runtime ExerciseLoadProfiles.defaultLogColumns from generated seed
 * (120 library ids + athlete carry aliases).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const repo = join(dir, '../../../..');
const seed = JSON.parse(
  readFileSync(join(dir, 'exercise-load-profiles.seed.json'), 'utf8'),
);

const sandbox = { window: {}, console };
sandbox.window = sandbox;
vm.runInNewContext(readFileSync(join(dir, 'exercise-load-profiles.js'), 'utf8'), sandbox);

const ELP = sandbox.ExerciseLoadProfiles;
if (!ELP || !ELP.defaultLogColumns) throw new Error('ExerciseLoadProfiles.defaultLogColumns missing');

const ids = Object.keys(seed);
if (ids.length < 120) throw new Error('expected at least 120 seed ids, got ' + ids.length);
// 120 library exercises remain; athlete *-carry aliases are extra.
const coreLibraryCount = ids.filter((id) =>
  id.startsWith('core-') || id.startsWith('rebuilt-') || id.startsWith('library-'),
).length;
if (coreLibraryCount < 120) throw new Error('expected >=120 library-shaped ids, got ' + coreLibraryCount);

for (const id of ids) {
  const cols = ELP.defaultLogColumns(id);
  if (!cols || !cols.length) throw new Error('missing defaultLogColumns for ' + id);
  const kinds = cols.map((c) => c.kind);
  const want = seed[id];
  if (JSON.stringify(kinds) !== JSON.stringify(want)) {
    throw new Error(`${id}: kinds ${JSON.stringify(kinds)} !== seed ${JSON.stringify(want)}`);
  }
  for (const col of cols) {
    if (!col.id || col.value !== '' || !Array.isArray(col.values) || col.values.length) {
      throw new Error(`${id}: bad column shape ${JSON.stringify(col)}`);
    }
  }
}

const plank = ELP.defaultLogColumns('core-plank');
if (!plank || plank.length !== 1 || plank[0].kind !== 'time_sec') {
  throw new Error('core-plank → time_sec');
}

const farmer = ELP.defaultLogColumns('core-farmer-walk');
if (
  !farmer ||
  farmer.length !== 2 ||
  farmer[0].kind !== 'weight_kg' ||
  farmer[1].kind !== 'distance_m'
) {
  throw new Error('core-farmer-walk → weight_kg+distance_m (non-timed)');
}
const farmerCarry = ELP.defaultLogColumns('core-farmer-carry');
if (
  !farmerCarry ||
  farmerCarry.length !== 2 ||
  farmerCarry[0].kind !== 'weight_kg' ||
  farmerCarry[1].kind !== 'distance_m'
) {
  throw new Error('core-farmer-carry alias → weight_kg+distance_m');
}

const squat = ELP.defaultLogColumns('core-back-squat');
if (
  !squat ||
  squat.length !== 2 ||
  squat[0].kind !== 'weight_pct_wm' ||
  squat[1].kind !== 'reps'
) {
  throw new Error('core-back-squat → weight_pct_wm+reps');
}

const pull = ELP.defaultLogColumns('core-pull-up');
if (!pull || pull.length !== 1 || pull[0].kind !== 'reps') {
  throw new Error('core-pull-up → reps only');
}

if (ELP.defaultLogColumns('unknown-exercise-id')) {
  throw new Error('unknown id should return null');
}

const html = readFileSync(join(dir, 'index.html'), 'utf8');
if (!html.includes('exercise-load-profiles.js')) throw new Error('index.html missing exercise-load-profiles.js');

console.log('exercise-load-profiles.smoke: ok');
