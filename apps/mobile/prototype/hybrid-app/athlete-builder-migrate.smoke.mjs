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

must(html.includes("ATHLETE_BUILDER_VERSION='athlete-builder-v6'"), 'migration version');
must(html.includes('function applyAthleteBuilderPatch'), 'applyAthleteBuilderPatch');
must(html.includes('function normalizeAthleteExercise'), 'normalizeAthleteExercise');
must(html.includes('function normalizeAthleteCondBlock'), 'normalizeAthleteCondBlock');
must(html.includes('.rx-prescription-card,.rx-prescription-card.compact{display:none'), 'Prescription card hidden in athlete CSS');
must(!html.includes("LogColumns.builderPrescriptionHtml({compact:false})"), 'exerciseSheet has no Prescription card');

must(html.includes('function athleteLiftOverviewMeta'), 'athleteLiftOverviewMeta');
must(html.includes('function athleteLiftMeta(y){return athleteLiftOverviewMeta(y)}') || html.includes('return athleteLiftOverviewMeta(y)'), 'athleteLiftMeta delegates to overview (no columnsMeta values)');
must(!/exerciseVolumeMeta\(y\)\{[^}]*columnsMeta/.test(html.replace(/\n/g,' ')), 'exerciseVolumeMeta must not call columnsMeta (rehydrates loadExpr values)');

const COND_FORMATS = [
  { key: 'steady', name: 'Steady-state', type: 'easy' },
  { key: 'intervals', name: 'Intervals', type: 'intervals', rounds: 4, workSec: 240, restSec: 180 },
  { key: 'tempo', name: 'Tempo', type: 'intervals', rounds: 10, workSec: 15, restSec: 60 },
  { key: 'free', name: 'Free run', type: 'easy' },
  { key: 'custom', name: 'Custom', type: 'custom', rounds: 6, workSec: 40, restSec: 80 },
];
const COND_EFFORTS = [
  { key: 'easy', name: 'Easy' },
  { key: 'medium', name: 'Medium' },
  { key: 'hard', name: 'Hard' },
];
const COND_MODALITIES = ['Run', 'Walk', 'Bike', 'Rower', 'Ski erg', 'Circuit', 'Other'];

const sandbox = {
  window: {},
  console,
  clone: (x) => JSON.parse(JSON.stringify(x)),
  id: () => 'test-id',
  num: (v) => Number(v) || 0,
  COND_FORMATS,
  COND_EFFORTS,
  COND_MODALITIES,
  condFormatMeta: (key) => COND_FORMATS.find((f) => f.key === key) || COND_FORMATS[0],
  isConditioningTemplate: (t) => {
    if (!t) return false;
    if (String(t.templateKind || '').toLowerCase() === 'conditioning') return true;
    const blocks = t.blocks || [];
    const hasC = blocks.some((b) => b && b.type === 'conditioning');
    const hasS = blocks.some((b) => b && b.type === 'strength');
    return hasC && !hasS;
  },
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
must(ex.logColumns[0].kind === 'weight_pct_wm', 'load column kind preserved');
must(ex.logColumns[0].value === '', 'athlete templates clear pinned load values');
must(Array.isArray(ex.logColumns[0].values) && ex.logColumns[0].values.every((v) => !String(v || '').trim()), 'no prescription value array');

const strengthState = applyAthleteBuilderPatch({
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
must(strengthState.meta.athleteBuilderVersion === 'athlete-builder-v6', 'migration stamp');
must(strengthState.templates[0].blocks.length === 1, 'warm/cool text blocks removed');
must(strengthState.templates[0].blocks[0].type === 'strength', 'single strength block');
must(strengthState.templates[0].blocks[0].exercises[0].autopilotVolume === true, 'template exercise migrated');

const condState = applyAthleteBuilderPatch({
  meta: { athleteBuilderVersion: 'athlete-builder-v4' },
  templates: [
    {
      id: 'tpl-cond',
      name: 'Old intervals',
      templateKind: 'conditioning',
      blocks: [
        { id: 'w', type: 'text', heading: 'Warm-up', notes: 'Easy spin' },
        {
          id: 'c',
          type: 'conditioning',
          heading: 'Intervals',
          conditioningType: 'intervals',
          modality: 'Run / Row / Bike',
          targetDurationMin: 0,
          rounds: 8,
          workSec: 30,
          restSec: 90,
          effort: 'hard',
        },
      ],
    },
  ],
  sessions: [
    {
      id: 'sess-cond',
      name: 'Scheduled cond',
      status: 'scheduled',
      blocks: [
        {
          id: 'c2',
          type: 'conditioning',
          heading: 'Easy aerobic',
          conditioningType: 'easy',
          modality: 'Bike',
          targetDurationMin: 25,
          timeCapMin: 25,
        },
      ],
      tasks: [],
    },
  ],
});
must(condState.templates[0].blocks.length === 1, 'cond template collapses to one block');
const condBlock = condState.templates[0].blocks[0];
must(condBlock.type === 'conditioning', 'cond block type');
must(condBlock.condFmt === 'intervals', 'legacy intervals mapped to condFmt');
must(condBlock.autopilotCond === true, 'cond autopilot flag');
must(condBlock.modality === 'Run', 'legacy modality normalized');
must(condState.sessions[0].blocks[0].condFmt === 'steady', 'easy aerobic maps to steady');
must(condState.sessions[0].blocks[0].autopilotCond === true, 'session cond autopilot');

const recoveryState = applyAthleteBuilderPatch({
  meta: {},
  templates: [
    {
      id: 'tpl-recovery',
      name: 'Recovery flush',
      templateKind: 'conditioning',
      blocks: [
        {
          id: 'r',
          type: 'conditioning',
          heading: 'Easy flush',
          category: 'Recovery',
          modality: 'Run',
          targetDurationMin: 40,
        },
      ],
    },
  ],
  sessions: [],
});
const recoveryBlock = recoveryState.templates[0].blocks[0];
must(recoveryBlock.recoverySession === true, 'recovery flag preserved');
must(recoveryBlock.condFmt === 'steady', 'recovery uses steady format');
must(recoveryBlock.effort === 'easy', 'recovery effort easy');
must(recoveryBlock.modality === 'Mixed', 'recovery modality mixed');
must(recoveryBlock.baselineDurationMin === 40, 'recovery baseline preserved');

console.log('athlete-builder-migrate.smoke: ok');
