/**
 * Smoke: logger hero metrics from exercise logColumns (plank seconds + squat kg×reps).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');

if (!html.includes("LOCAL_BUILD='the-hybrid-athlete-engine-v155'")) {
  throw new Error('expected cache v155');
}

const sandbox = {
  window: {},
  console,
  setInterval: () => 1,
  clearInterval: () => {},
  document: {
    querySelector: () => null,
    getElementById: () => null,
  },
  current: () => sandbox._task,
  esc: (s) => String(s),
  save: () => {},
  train: () => {},
  alert: (m) => {
    throw new Error('alert: ' + m);
  },
  S: {},
  StrengthAdapter: {
    targetRirForExercise: () => 2,
    suggestNextSet: () => ({ loadKg: 102.5, reps: 8, targetRir: 2, reasonCodes: ['on_target_hold'] }),
  },
  activeSession: () => ({ date: '2026-08-30', taskIndex: 0, tasks: [{}, {}] }),
  workElapsed: () => 60,
  restSeconds: () => 90,
  validateStrengthRow: () => '',
  stopRest: () => {},
  nextTask: () => {},
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(readFileSync(join(dir, 'log-columns.js'), 'utf8'), sandbox);
vm.runInContext(readFileSync(join(dir, 'session-chrome.js'), 'utf8'), sandbox);
vm.runInContext(readFileSync(join(dir, 'rest-overlay.js'), 'utf8'), sandbox);
vm.runInContext(readFileSync(join(dir, 'work-overlay.js'), 'utf8'), sandbox);
vm.runInContext(readFileSync(join(dir, 'strength-one-set-logger.js'), 'utf8'), sandbox);

const L = sandbox.StrengthOneSetLogger;
if (!L.metricCellsHtml) throw new Error('metricCellsHtml export missing');

const plankTask = {
  kind: 'strength',
  name: 'Plank',
  exerciseId: 'plank',
  restSec: 60,
  logColumns: [{ id: 't', kind: 'time_sec', value: '30', values: ['30'] }],
  rows: [{ n: 1, target: '30', targetKind: 'seconds', reps: '', weight: '', done: false, extra: false }],
};
sandbox._task = plankTask;
if (L.loggerPhase(plankTask) !== 'work') throw new Error('plank loggerPhase should be work before hold completes');
const plankWorkHtml = L.renderTask(plankTask);
if (!plankWorkHtml.includes('workOverlay')) throw new Error('plank work phase should render work overlay');
if (!plankWorkHtml.includes('Work · hold')) throw new Error('plank work eyebrow missing');
if (!plankWorkHtml.includes('rest-ring')) throw new Error('plank work ring missing');
if (!plankWorkHtml.includes('Done early')) throw new Error('plank done early button missing');
if (plankWorkHtml.includes('oneSetWeight')) throw new Error('plank work phase should not show weight input');
if (plankWorkHtml.includes('slider-card')) throw new Error('plank work phase should not show slider yet');

L.finishWorkPhase(28);
if (plankTask.rows[0].reps !== '28') throw new Error('work phase should write actual seconds to row.reps');
if (plankTask.rows[0].targetKind !== 'seconds') throw new Error('work phase should set targetKind seconds');
if (L.loggerPhase(plankTask) !== 'active') throw new Error('plank loggerPhase should be active after work');

const plankHtml = L.renderTask(plankTask);
if (!plankHtml.includes('seconds') && !plankHtml.includes('Seconds')) {
  throw new Error('plank logger should label seconds, not reps');
}
if (plankHtml.includes('metric-unit>reps')) throw new Error('plank logger must not show reps unit');
if (!plankHtml.includes('slider-card')) throw new Error('plank active phase should show slider');

const squatTask = {
  kind: 'strength',
  name: 'Barbell Back Squat',
  heading: 'Lower · Block A',
  exerciseId: 'squat',
  restSec: 90,
  logColumns: [
    { id: 'load', kind: 'weight_pct_wm', value: '', values: [''] },
    { id: 'effort', kind: 'reps', value: '', values: [''] },
  ],
  rows: [
    { n: 1, target: '5', targetKind: 'reps', weight: 100, reps: '', done: false, extra: false },
    { n: 2, target: '5', targetKind: 'reps', weight: '', reps: '', done: false, extra: false },
  ],
};
sandbox._task = squatTask;
if (L.loggerPhase(squatTask) !== 'active') throw new Error('squat loggerPhase should stay active');
const squatHtml = L.renderTask(squatTask);
if (!squatHtml.includes('oneSetWeight')) throw new Error('squat regression: weight input missing');
if (!squatHtml.includes('oneSetReps')) throw new Error('squat regression: reps input missing');
if (!squatHtml.includes('metric-unit>kg')) throw new Error('squat regression: kg unit missing');
if (!squatHtml.includes('metric-unit>reps')) throw new Error('squat regression: reps unit missing');
if (!squatHtml.includes('metric-sep')) throw new Error('squat regression: × separator missing');
if (squatHtml.includes('workOverlay')) throw new Error('squat should not show work overlay');

console.log('metric-logger.smoke: ok');
