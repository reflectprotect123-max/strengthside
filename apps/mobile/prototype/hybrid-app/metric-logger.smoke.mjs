/**
 * Smoke: logger hero metrics from exercise logColumns (plank seconds + squat kg×reps).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');

if (!html.includes("LOCAL_BUILD='the-hybrid-athlete-engine-v154'")) {
  throw new Error('expected cache v154');
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
vm.runInContext(readFileSync(join(dir, 'strength-one-set-logger.js'), 'utf8'), sandbox);

const L = sandbox.StrengthOneSetLogger;
if (!L.metricCellsHtml) throw new Error('metricCellsHtml export missing');
if (L.loggerPhase({}) !== 'active') throw new Error('loggerPhase stub should return active');

const plankTask = {
  kind: 'strength',
  name: 'Plank',
  exerciseId: 'plank',
  restSec: 60,
  logColumns: [{ id: 't', kind: 'time_sec', value: '30', values: ['30'] }],
  rows: [{ n: 1, target: '30', targetKind: 'seconds', reps: '', weight: '', done: false, extra: false }],
};
sandbox._task = plankTask;
const plankHtml = L.renderTask(plankTask);
if (!plankHtml.includes('seconds') && !plankHtml.includes('Seconds')) {
  throw new Error('plank logger should label seconds, not reps');
}
if (plankHtml.includes('metric-unit>reps')) throw new Error('plank logger must not show reps unit');
if (plankHtml.includes('oneSetWeight')) throw new Error('plank should not show weight input');
if (plankHtml.includes('metric-sep')) throw new Error('single-column plank should not show separator');

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
const squatHtml = L.renderTask(squatTask);
if (!squatHtml.includes('oneSetWeight')) throw new Error('squat regression: weight input missing');
if (!squatHtml.includes('oneSetReps')) throw new Error('squat regression: reps input missing');
if (!squatHtml.includes('metric-unit>kg')) throw new Error('squat regression: kg unit missing');
if (!squatHtml.includes('metric-unit>reps')) throw new Error('squat regression: reps unit missing');
if (!squatHtml.includes('metric-sep')) throw new Error('squat regression: × separator missing');

console.log('metric-logger.smoke: ok');
