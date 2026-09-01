/**
 * Smoke: rep-only lifts use LLM volume path + reps-only logger columns.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const bundle = readFileSync(join(dir, 'strength-bundle.js'), 'utf8');
const adapterSrc = readFileSync(join(dir, 'strength-adapter.js'), 'utf8');
const aiSrc = readFileSync(join(dir, 'strength-ai.js'), 'utf8');
const recoverySrc =
  readFileSync(join(dir, 'recovery-engine.js'), 'utf8') +
  readFileSync(join(dir, 'recovery-signals.js'), 'utf8');
const logCols = readFileSync(join(dir, 'log-columns.js'), 'utf8');

const sandbox = { window: {}, console, fetch: () => Promise.reject(new Error('no network')) };
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(
  `${bundle}; window.HybridStrength = HybridStrength; ${recoverySrc}; ${adapterSrc}; ${aiSrc}; ${logCols}`,
  sandbox,
);

const { StrengthAdapter, StrengthAI, LogColumns } = sandbox;

if (!StrengthAdapter.repProgressionLift('Nordic Curl')) {
  throw new Error('Nordic Curl should be rep progression');
}
if (!StrengthAdapter.repProgressionLift('Strict Bar Dip')) {
  throw new Error('dip should be rep progression');
}
if (!StrengthAdapter.repProgressionLift('Pull Up')) {
  throw new Error('pull-up should be rep progression');
}
if (StrengthAdapter.repProgressionLift('Bench Press')) {
  throw new Error('bench should not be rep progression');
}

if (!StrengthAdapter.percentLiftCandidate('Overhead Press', 'Strength — Push')) {
  throw new Error('Overhead Press should be a working-max lift');
}
if (StrengthAdapter.repProgressionLift('Overhead Press', 'Strength — Push')) {
  throw new Error('Overhead Press should not use rep progression');
}
if (StrengthAdapter.percentLiftCandidate('Lateral Raise')) {
  throw new Error('Lateral Raise should not be a working-max lift');
}

const pullState = {
  meta: { ownerId: 'a1', progressionAudit: [] },
  exercises: [{ id: 'pull', name: 'Pull Up' }],
  strengthState: { workingMaxEvents: [], prEvents: [], loadHints: {}, volumeHints: {} },
  sessions: [{
    id: 'wp1',
    name: 'Full Body A',
    date: '2026-08-20',
    status: 'completed',
    completedAt: Date.now(),
    sessionPain: 'none',
    tasks: [{
      kind: 'strength',
      exerciseId: 'pull',
      name: 'Pull Up',
      rows: [
        { id: 'r1', n: 1, weight: 10, reps: 5, done: true },
        { id: 'r2', n: 2, weight: 10, reps: 5, done: true },
      ],
    }],
  }],
};

if (StrengthAdapter.repProgressionLift('Pull Up', '', pullState, 'pull')) {
  throw new Error('weighted pull-up should leave rep progression');
}
if (!StrengthAdapter.percentLiftCandidate('Pull Up', '', pullState, 'pull')) {
  throw new Error('weighted pull-up should require working max');
}
if (!StrengthAdapter.exerciseUsesAddedLoadMode(pullState, 'pull', 'Pull Up')) {
  throw new Error('weighted pull-up should detect added-load mode');
}

sandbox.S = pullState;
LogColumns.beginAthleteSheet({ name: 'Pull Up', exerciseId: 'pull', rows: [{ weight: 10, reps: 5 }] });
const pullCols = LogColumns.getSheetColumns();
if (pullCols.length !== 2 || pullCols[0].kind !== 'weight_pct_wm') {
  throw new Error('weighted pull-up should get weight + reps logger columns');
}

LogColumns.beginAthleteSheet({ name: 'Pull Up', category: 'Strength — Pull' });
const bwPullCols = LogColumns.getSheetColumns();
if (bwPullCols.length !== 1 || bwPullCols[0].kind !== 'reps') {
  throw new Error('bodyweight pull-up should stay reps-only');
}

LogColumns.beginAthleteSheet({ name: 'Nordic Curl', category: 'Accessories' });
const nordicCols = LogColumns.getSheetColumns();
if (!nordicCols.length || nordicCols[0].kind !== 'reps' || nordicCols.length !== 1) {
  throw new Error('Nordic should get reps-only column');
}

LogColumns.beginAthleteSheet({ name: 'Bench Press', category: 'Strength' });
const benchCols = LogColumns.getSheetColumns();
if (benchCols.length !== 2 || benchCols[0].kind !== 'weight_pct_wm') {
  throw new Error('Bench should keep weight + reps columns');
}

const state = {
  meta: { progressionAudit: [], ownerId: 'a1' },
  exercises: [{ id: 'dip', name: 'Strict Bar Dip' }],
  strengthState: { workingMaxEvents: [], prEvents: [], loadHints: {}, volumeHints: {} },
  sessions: [{
    id: 's1',
    name: 'Full Body A',
    date: '2026-08-24',
    status: 'completed',
    completedAt: Date.now(),
    sessionPain: 'none',
    tasks: [{
      kind: 'strength',
      exerciseId: 'dip',
      name: 'Strict Bar Dip',
      rows: [
        { id: 'r1', n: 1, weight: '', reps: 8, done: true },
        { id: 'r2', n: 2, weight: '', reps: 8, done: true },
        { id: 'r3', n: 3, weight: '', reps: 7, done: true },
      ],
    }],
  }, {
    id: 's2',
    name: 'Full Body A',
    date: '2026-08-17',
    status: 'completed',
    completedAt: Date.now() - 86400000 * 7,
    sessionPain: 'none',
    tasks: [{
      kind: 'strength',
      exerciseId: 'dip',
      name: 'Strict Bar Dip',
      rows: [
        { id: 'r1', n: 1, weight: '', reps: 7, done: true },
        { id: 'r2', n: 2, weight: '', reps: 7, done: true },
      ],
    }],
  }],
};

const repHist = StrengthAdapter.exerciseRepSessionHistory(state, 'dip', 3);
if (repHist.length !== 2 || repHist[0].topReps !== 8) {
  throw new Error('rep session history should track top reps without load');
}

const session = {
  id: 's3',
  name: 'Full Body A',
  date: '2026-08-31',
  status: 'completed',
  sessionPain: 'none',
  tasks: [{
    kind: 'strength',
    exerciseId: 'dip',
    name: 'Strict Bar Dip',
    rows: [{ id: 'r1', n: 1, weight: '', reps: 9, done: true }],
  }],
};

StrengthAdapter.applySilentProgression(state, session, {
  recoverySignal: { gate: 'ok', reasonCodes: [] },
});
const hint = state.strengthState.volumeHints.dip;
if (!hint || !hint.reps) {
  throw new Error('post-session should write volumeHints for rep lift');
}

const flash = StrengthAI.buildRepFlashCard(state, 'dip', {
  exerciseName: 'Strict Bar Dip',
  calibration: 'calibrated',
  sessionPain: 'none',
  recoveryGate: 'ok',
  repHistory: repHist,
  deterministic: { action: 'progress', sets: 3, reps: '9' },
});
if (flash.progression_mode !== 'reps' || !flash.recent_rep_sessions.length) {
  throw new Error('buildRepFlashCard failed');
}

const vol = StrengthAI.validateVolumeDecision({
  action: 'hold',
  sets: 3,
  reps: '8',
  reason_codes: ['quality_reps'],
  confidence: 0.8,
});
if (!vol || vol.reps !== '8') throw new Error('validateVolumeDecision failed');

const merged = StrengthAdapter.mergeAiVolumeAction(
  { action: 'progress', sets: 3, reps: '9', reasonCodes: [] },
  { action: 'hold', sets: 3, reps: '8', reasonCodes: ['caution'] },
);
if (merged.resolved.action !== 'hold' || !merged.aiInfluenced) {
  throw new Error('AI should conservatively hold rep progress');
}

console.log('strength-rep-llm.smoke: ok');
