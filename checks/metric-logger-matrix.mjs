#!/usr/bin/env node
/**
 * Metric logger matrix — behavioral chain checks (not HTML string grep).
 * builder twin → task shape → logger render for key exercise profiles.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const proto = join(dirname(fileURLToPath(import.meta.url)), '../apps/mobile/prototype/hybrid-app');

function loadSandbox(extra = {}) {
  const sandbox = {
    window: {},
    console,
    setInterval: () => 1,
    clearInterval: () => {},
    document: { querySelector: () => null, getElementById: () => null },
    current: () => sandbox._task,
    esc: (s) => String(s),
    save: () => {},
    train: () => {},
    alert: (m) => {
      throw new Error('alert: ' + m);
    },
    S: { strengthState: { volumeHints: {}, loadHints: {}, workingMaxEvents: [] }, sessions: [] },
    StrengthAdapter: extra.StrengthAdapter || {
      targetRirForExercise: () => 2,
      suggestNextSet: () => ({ loadKg: 100, reps: 5, targetRir: 2, reasonCodes: [] }),
      timedHoldLift: () => false,
      repProgressionLift: () => false,
    },
    activeSession: () => ({ date: '2026-09-02', taskIndex: 0, tasks: [{}, {}] }),
    workElapsed: () => 0,
    restSeconds: () => 90,
    validateStrengthRow: () => '',
    stopRest: () => {},
    nextTask: () => {},
    ...extra,
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(readFileSync(join(proto, 'exercise-load-profiles.js'), 'utf8'), sandbox);
  vm.runInContext(readFileSync(join(proto, 'log-columns.js'), 'utf8'), sandbox);
  vm.runInContext(readFileSync(join(proto, 'session-chrome.js'), 'utf8'), sandbox);
  vm.runInContext(readFileSync(join(proto, 'rest-overlay.js'), 'utf8'), sandbox);
  vm.runInContext(readFileSync(join(proto, 'work-overlay.js'), 'utf8'), sandbox);
  vm.runInContext(readFileSync(join(proto, 'strength-one-set-logger.js'), 'utf8'), sandbox);
  return sandbox;
}

const failures = [];
const must = (c, m) => {
  if (!c) failures.push(m);
};

function scenario(name, exerciseId, assertBuilder, assertLogger) {
  const sb = loadSandbox();
  const cols = sb.ExerciseLoadProfiles.defaultLogColumns(exerciseId);
  must(cols && cols.length, `${name}: profile ${exerciseId} missing columns`);
  const ex = {
    name: name,
    exerciseId,
    restSec: 90,
    autopilotVolume: true,
    sideMode: 'none',
    logColumns: cols,
  };
  const normalized = sb.LogColumns.ensureAthleteLogColumns(ex);
  ex.logColumns = normalized;
  const twin = sb.LogColumns.builderAthleteTwinHtml(ex, { bi: 0, ei: 0 });
  assertBuilder(twin, ex, sb);
  const task = {
    kind: 'strength',
    name: ex.name,
    exerciseId,
    restSec: ex.restSec,
    sideMode: ex.sideMode,
    logColumns: ex.logColumns,
    rows: [{ n: 1, target: '5', targetKind: 'reps', weight: 100, reps: '', done: false, extra: false }],
  };
  if (exerciseId === 'core-plank') {
    task.rows = [{ n: 1, target: '30', targetKind: 'seconds', weight: '', reps: '', done: false, extra: false }];
  }
  if (exerciseId === 'core-farmer-walk') {
    task.rows = [{ n: 1, target: '45', targetKind: 'seconds', weight: 24, reps: 40, distance: 100, done: false, extra: false }];
  }
  sb._task = task;
  const html = sb.StrengthOneSetLogger.renderTask(task);
  assertLogger(html, task, sb);
}

scenario('Back Squat', 'core-back-squat', (twin) => {
  must(twin.includes('Weight %'), 'squat builder shows pct column');
  must(!twin.includes('How hard was that set'), 'builder no post-set slider');
}, (html) => {
  must(html.includes('kg'), 'squat logger shows kg');
  must(html.includes('reps'), 'squat logger shows reps');
});

scenario('Plank', 'core-plank', (twin) => {
  must(twin.includes('Time (seconds)'), 'plank builder time column');
  must(!twin.includes('metric-sep'), 'plank single column no separator');
}, (html) => {
  must(
    html.includes('seconds') || html.includes('Seconds') || html.includes('Work · hold') || html.includes('30s'),
    'plank logger shows timed hold (work phase or seconds label)',
  );
  must(!html.includes('metric-unit>reps'), 'plank logger not reps unit');
});

scenario('Farmer Walk', 'core-farmer-walk', (twin) => {
  must(twin.includes('Distance (metres)'), 'carry builder distance');
  must(twin.includes('Time (seconds)'), 'carry builder time');
}, (html) => {
  must(html.includes('metres') || html.includes('Metres'), 'carry logger distance');
});

(function supersetScenario() {
  const sb = loadSandbox();
  const squatCols = sb.ExerciseLoadProfiles.defaultLogColumns('core-back-squat');
  const plankCols = sb.ExerciseLoadProfiles.defaultLogColumns('core-plank');
  const exA = {
    name: 'Back Squat',
    exerciseId: 'core-back-squat',
    restSec: 90,
    logColumns: sb.LogColumns.ensureAthleteLogColumns({ logColumns: squatCols }),
    rows: [{ n: 1, target: '5', targetKind: 'reps', weight: 100, reps: '', done: false, extra: false }],
  };
  const exB = {
    name: 'Plank',
    exerciseId: 'core-plank',
    restSec: 60,
    logColumns: sb.LogColumns.ensureAthleteLogColumns({ logColumns: plankCols }),
    rows: [{ n: 1, target: '30', targetKind: 'seconds', weight: '', reps: '', done: false, extra: false }],
  };
  const task = {
    kind: 'superset',
    heading: 'Superset',
    exercises: [exA, exB],
    autoreg: { setOrdinal: 0, selectedDifficulty: null, restPhase: false },
  };
  sb._task = task;
  sb.supersetCurrent = (t) => ({ exIndex: 1, rowIndex: 0, row: t.exercises[1].rows[0] });
  const html = sb.StrengthOneSetLogger.renderSupersetTask(task);
  must(html.includes('setSupersetValue'), 'superset logger wires setSupersetValue handlers');
  must(!html.includes('aria-label="Reps"'), 'superset plank hero must not hard-code reps column');
  must(html.includes('seconds') || html.includes('Seconds'), 'superset plank shows time column');
})();

if (failures.length) {
  console.error('metric-logger-matrix FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('metric-logger-matrix: ok');
