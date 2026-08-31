import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const logColumnsSrc = fs.readFileSync(path.join(__dirname, 'log-columns.js'), 'utf8');

function must(cond, msg) {
  if (!cond) throw new Error(msg);
}

must(html.includes("ATHLETE_BUILDER_VERSION='athlete-builder-v2'"), 'migration version');
must(html.includes('function applyAthleteBuilderPatch'), 'applyAthleteBuilderPatch');
must(html.includes('function normalizeAthleteExercise'), 'normalizeAthleteExercise');

const sandbox = {
  window: {},
  console,
  clone: (x) => JSON.parse(JSON.stringify(x)),
  id: () => 'test-id',
  num: (v) => Number(v) || 0,
  isConditioningTemplate: () => false,
  isCoachPrescription: () => false,
};
sandbox.window = sandbox;
vm.runInNewContext(logColumnsSrc, sandbox);

const patchSrc = html
  .split('const ATHLETE_BUILDER_VERSION')[1]
  .split('function applyAthleteShellPatch')[0];
vm.runInNewContext(
  `const ATHLETE_BUILDER_VERSION${patchSrc}`,
  sandbox,
);

const { normalizeAthleteExercise, normalizeAthleteStrengthBlocks, applyAthleteBuilderPatch } = sandbox;
must(typeof normalizeAthleteExercise === 'function', 'normalizeAthleteExercise export');
must(typeof applyAthleteBuilderPatch === 'function', 'applyAthleteBuilderPatch export');

const ex = normalizeAthleteExercise({
  name: 'Back Squat',
  sets: 5,
  reps: '5',
  restSec: 90,
  loadExpr: { exprKind: 'pct_of_max', exprArg: 0.7 },
});
must(ex.autopilotVolume === true, 'migrated exercise uses autopilot volume');
must(ex.sets === null && ex.reps === null, 'migrated exercise clears pinned sets/reps');
must(ex.restSec === 90, 'rest preserved');
must(Array.isArray(ex.logColumns) && ex.logColumns.length >= 2, 'default log columns');

const state = applyAthleteBuilderPatch({
  meta: {},
  templates: [
    {
      id: 'tpl-1',
      name: 'Leg day',
      templateKind: 'strength',
      blocks: [
        { id: 'w', type: 'text', heading: 'Warm-up', notes: 'Row' },
        {
          id: 's',
          type: 'strength',
          heading: 'Strength',
          exercises: [{ name: 'Squat', sets: 3, reps: '8', restSec: 120 }],
        },
        { id: 'c', type: 'text', heading: 'Cool-down', notes: '' },
      ],
    },
  ],
  sessions: [],
});
must(state.meta.athleteBuilderVersion === 'athlete-builder-v2', 'migration stamp');
must(state.templates[0].blocks.length === 1, 'warm/cool text blocks removed');
must(state.templates[0].blocks[0].type === 'strength', 'single strength block');
must(state.templates[0].blocks[0].exercises[0].autopilotVolume === true, 'template exercise migrated');

console.log('athlete-builder-migrate.smoke: ok');
