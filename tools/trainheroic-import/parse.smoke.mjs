#!/usr/bin/env node
/**
 * Smoke: TrainHeroic parsing holds the three defects the real export has.
 * Run: node tools/trainheroic-import/parse.smoke.mjs
 *
 * Fixtures are hand-written rather than a slice of the real export: the export
 * is personal training data and does not belong in the repo, and a fixture that
 * states the defect is readable in a way a 5 MB CSV is not.
 */
import {
  parseExerciseData,
  loadToKg,
  detectSwap,
  setsFromRow,
  buildSessions,
  canonicalNames,
  normaliseExerciseName,
  exerciseIdFor,
  normaliseDate,
} from './parse.mjs';
import { resolveExerciseName, exerciseIdFromRaw } from './aliases.mjs';

const failures = [];
function must(cond, msg) {
  if (!cond) failures.push(msg);
}
function eq(actual, expected, msg) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) failures.push(`${msg}: got ${a}, want ${b}`);
}

// --- Defect 1: every load is pound-encoded, whatever the label says ---------
eq(loadToKg(220.46), 100, 'pound-encoded 220.46 is 100 kg');
eq(loadToKg(132.28), 60, 'pound-encoded 132.28 is 60 kg');
eq(loadToKg(38.58), 17.5, 'half-kilo loads survive the snap');

const kgLabelled = parseExerciseData('8, 8, 8 rep x 88.18, 88.18, 88.18 kilogram');
must(kgLabelled != null, 'kilogram-labelled row parses');
eq(kgLabelled.loads.map(loadToKg), [40, 40, 40], 'kilogram label is still pound-encoded');

// A percent label over 100 is a load; at or below it stays ambiguous and is
// left out rather than guessed at.
must(parseExerciseData('4, 4 rep x 242.51, 242.51 percent') != null, 'percent-labelled load parses');
must(parseExerciseData('4, 4 rep x 80, 80 percent') == null, 'genuine percentage is not imported as load');

// --- Defect 2: transposed reps and load ------------------------------------
must(detectSwap([90, 90, 90], [6, 8, 8]), 'transposed row detected');
must(!detectSwap([5, 5, 3], [100, 110, 120]), 'normal heavy row not flagged as transposed');
must(!detectSwap([12, 12], [20, 20]), 'light high-rep row not flagged as transposed');

const swapped = setsFromRow({ ExerciseData: '90, 90, 90 rep x 13.23, 17.64, 17.64 pound' });
must(swapped.swapped === true, 'setsFromRow reports the correction');
eq(swapped.sets.map((s) => [s.reps, s.weight]), [[6, 90], [8, 90], [8, 90]], 'transposed row corrected');

// --- Defect 3: names collide on punctuation and case ------------------------
eq(normaliseExerciseName('World\u2019s Greatest Stretch'), 'world s greatest stretch', 'curly apostrophe folded');
must(exerciseIdFor('Chin-Up') === exerciseIdFor('chin up'), 'punctuation and case fold to one id');
must(exerciseIdFor('Back Squat') !== exerciseIdFor('Front Squat'), 'different lifts keep different ids');

// A trailing plural is a spelling choice, not a different lift.
must(exerciseIdFor('Pendlay Rows') === exerciseIdFor('Pendlay Row'), 'plural folds to one id');
must(exerciseIdFor('Trap Bar Deadlifts') === exerciseIdFor('Trap Bar Deadlift'), 'plural deadlift folds');
must(exerciseIdFor('Reverse Lunges') === exerciseIdFor('Reverse Lunge'), 'plural lunge folds');
// `-ss` is not a plural: folding it would merge Press into Pres.
eq(normaliseExerciseName('Bench Press'), 'bench press', 'press keeps its double-s');
must(exerciseIdFor('Bench Press') === exerciseIdFor('bench press'), 'press id stable under case');
// Qualified variants stay separate — merging them would invent a history.
must(exerciseIdFor('Pause Back Squat') !== exerciseIdFor('Back Squat'), 'qualified variant stays separate');
must(exerciseIdFor('Deficit Deadlift') !== exerciseIdFor('Deadlift'), 'deficit deadlift stays separate');
must(exerciseIdFor('Clean Deadlift') !== exerciseIdFor('Deadlift'), 'clean deadlift stays separate');

// Explicit alias map — abbreviations and redundant prefixes only.
must(exerciseIdFromRaw('Trap Bar DL') === exerciseIdFromRaw('Trap Bar Deadlift'), 'trap bar dl alias');
must(exerciseIdFromRaw('Barbell Deadlift') === exerciseIdFromRaw('Deadlift'), 'barbell deadlift alias');
must(exerciseIdFromRaw('Barbell Shoulder Press') === exerciseIdFromRaw('Shoulder Press'), 'barbell shoulder press → shoulder press');
must(exerciseIdFromRaw('Barbell Shoulder Press') !== exerciseIdFromRaw('Strict Press'), 'strict press stays separate');
must(resolveExerciseName('Pause Back Squat').aliased === false, 'pause squat not aliased');
must(resolveExerciseName('Deficit Deadlift').aliased === false, 'deficit deadlift not aliased');
must(resolveExerciseName('Trap Bar DL').aliased === true, 'trap bar dl reports aliased');

// --- Rows with nothing logged are the common case, and are skipped ----------
eq(setsFromRow({ ExerciseData: 'rep x  pound' }).sets, [], 'prescription-only row yields no sets');
eq(setsFromRow({ ExerciseData: 'x' }).sets, [], 'empty row yields no sets');
eq(setsFromRow({ ExerciseData: '0, 0, 0 time x 15, 15, 15 calorie' }).sets, [], 'conditioning row yields no strength sets');
eq(setsFromRow({ ExerciseData: '8, 8, 8 rep x' }).sets, [], 'reps without load yield no sets');

// Ragged rows keep the pairs that exist: a 5-set row with 3 loads is 3 sets.
eq(setsFromRow({ ExerciseData: '5, 5, 5, 5, 5 rep x 100, 110, 120 pound' }).sets.length, 3, 'ragged row keeps real pairs');

// Zero-weight placeholder sets are dropped, not imported as 0 kg lifts.
const withZero = setsFromRow({ ExerciseData: '2, 2, 0 rep x 220.46, 220.46, 0 pound' });
eq(withZero.sets.length, 2, 'zero-value sets dropped');
eq(withZero.dropped, 1, 'dropped count reported');

// --- Dates -----------------------------------------------------------------
eq(normaliseDate('0000-00-00'), '', 'null date rejected');
eq(normaliseDate('2026-08-10 19:29:20'), '2026-08-10', 'timestamp trimmed to day');

// --- Grouping --------------------------------------------------------------
const rows = [
  {
    WorkoutTitle: 'Heavy Lower', ScheduledDate: '2026-01-05', RescheduledDate: '',
    ExerciseTitle: 'Back Squat', ExerciseData: '5, 5 rep x 220.46, 242.51 pound', WorkoutNotes: '', ExerciseNotes: '',
  },
  {
    WorkoutTitle: 'Heavy Lower', ScheduledDate: '2026-01-05', RescheduledDate: '',
    ExerciseTitle: 'back squat', ExerciseData: '3 rep x 264.55 pound', WorkoutNotes: '', ExerciseNotes: '',
  },
  {
    WorkoutTitle: 'Heavy Lower', ScheduledDate: '2026-01-05', RescheduledDate: '',
    ExerciseTitle: 'Bench Press', ExerciseData: 'rep x  pound', WorkoutNotes: '', ExerciseNotes: '',
  },
  {
    WorkoutTitle: 'Rescheduled Day', ScheduledDate: '2026-01-06', RescheduledDate: '2026-01-08',
    ExerciseTitle: 'Deadlift', ExerciseData: '3 rep x 330.69 pound', WorkoutNotes: '', ExerciseNotes: '',
  },
];
const { sessions, stats } = buildSessions(rows);
eq(sessions.length, 2, 'one session per performed day');
eq(stats.rowsWithSets, 3, 'only rows with performance counted');

const lower = sessions.find((s) => s.date === '2026-01-05');
eq(lower.tasks.length, 1, 'name variants collapse into one task');
eq(lower.tasks[0].rows.length, 3, 'sets from both spellings merge');
eq(lower.tasks[0].rows.map((r) => r.n), [1, 2, 3], 'set numbers renumbered contiguously');
must(!lower.tasks.some((t) => t.exerciseId === exerciseIdFor('Bench Press')), 'unlogged exercise absent from session');

// RescheduledDate wins: the work happened on the 8th, not the 6th.
must(sessions.some((s) => s.date === '2026-01-08'), 'rescheduled date used for grouping');

const names = canonicalNames(rows);
eq(names.get(exerciseIdFor('Back Squat')).name, 'Back Squat', 'most frequent spelling wins');
eq(names.get(exerciseIdFor('Back Squat')).variants.length, 2, 'variants recorded for the audit');

if (failures.length) {
  console.error('trainheroic-parse.smoke FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('trainheroic-parse.smoke: ok');
