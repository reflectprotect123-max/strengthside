/**
 * Smoke: exercise load profile fixture covers all 120 library exercises
 * and maps tracking modes → metrics consistently.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const fixturePath = join(repoRoot, 'test/fixtures/exercise-load-profiles.json');
const libraryPath = join(
  repoRoot,
  'evidence-platform/sources/recovered-nested/01-strength/strengthside-research/strength-adaptive-engine-v2/exercise-library/hybrid-engine-exercise-library-120.json',
);

const data = JSON.parse(readFileSync(fixturePath, 'utf8'));
const library = JSON.parse(readFileSync(libraryPath, 'utf8'));

function must(cond, msg) {
  if (!cond) throw new Error(msg);
}

must(data.version === 2, 'expected fixture version 2');
must(data.exercise_count === 120, `expected 120 exercises, got ${data.exercise_count}`);
must(data.exercises.length === 120, 'exercises array length');

const profileIds = new Set(Object.keys(data.profiles || {}));
must(profileIds.size >= 8, 'expected at least 8 profiles');

for (const [id, profile] of Object.entries(data.profiles)) {
  must(Array.isArray(profile.metrics_per_set), `${id} missing metrics_per_set`);
  must(Array.isArray(profile.log_columns), `${id} missing log_columns`);
  for (const m of profile.metrics_per_set) {
    must(data.engine_metrics[m], `${id} references unknown metric ${m}`);
  }
}

const libIds = new Set(library.exercises.map((e) => e.exercise_id));
const fixIds = new Set(data.exercises.map((e) => e.exercise_id));
must(libIds.size === fixIds.size, 'exercise_id count mismatch vs library');
for (const id of libIds) {
  must(fixIds.has(id), `missing exercise_id ${id} in fixture`);
}

for (const entry of data.exercises) {
  must(profileIds.has(entry.profile), `${entry.name}: unknown profile ${entry.profile}`);
  must(entry.metrics_per_set?.length, `${entry.name}: missing metrics_per_set`);
  const mode = data.tracking_modes[entry.tracking_mode];
  must(mode, `${entry.name}: unknown tracking_mode ${entry.tracking_mode}`);
  if (mode.default_profile) {
    must(
      entry.profile === mode.default_profile,
      `${entry.name}: expected profile ${mode.default_profile} for ${entry.tracking_mode}`,
    );
  }
}

// Representative metric contracts
const byName = Object.fromEntries(data.exercises.map((e) => [e.name, e]));

must(byName['Back Squat'].profile === 'main_pct_wm', 'Back Squat → main_pct_wm');
must(byName['Back Squat'].metrics_per_set.includes('load'), 'squat logs load');
must(byName['Barbell Curl'].profile === 'accessory_kg_reps', 'Barbell Curl → accessory_kg_reps');
must(byName['Barbell Curl'].metrics_per_set.includes('load'), 'curl logs load');
must(byName['Pull Up'].profile === 'bodyweight_reps', 'Pull Up → bodyweight_reps');
must(!byName['Pull Up'].metrics_per_set.includes('load'), 'pull-up no load metric');
must(byName['Farmer Walk'].profile === 'carry_distance_load', 'Farmer Walk → carry');
must(byName['Farmer Walk'].metrics_per_set.includes('distance'), 'carry logs distance');
must(!byName['Farmer Walk'].metrics_per_set.includes('duration'), 'carry is non-timed');
must(JSON.stringify(byName['Farmer Walk'].log_columns) === JSON.stringify(['weight_kg','distance_m']), 'carry columns weight+distance');
must(byName['Assault Bike'].profile === 'cardio_duration_distance', 'Assault Bike → cardio');
must(byName['Plank'].profile === 'isometric_time_or_reps', 'Plank → isometric');
must(byName['Nordic Curl'].profile === 'bodyweight_reps', 'Nordic → bodyweight');

// log_column_kinds map to known metrics
for (const kind of Object.values(data.log_column_kinds)) {
  for (const m of kind.maps_to) {
    must(data.engine_metrics[m], `log column maps to unknown metric ${m}`);
  }
}

console.log('exercise-load-profiles.smoke: ok');
