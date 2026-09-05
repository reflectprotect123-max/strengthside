/**
 * Smoke: logger hero metrics from exercise logColumns (plank seconds + squat kg×reps).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');

if (!html.includes("LOCAL_BUILD='the-hybrid-athlete-blank-v176'")) {
  throw new Error('expected cache v157');
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
if (!L.resolveLoggerFlow) throw new Error('resolveLoggerFlow export missing');

const plankTask = {
  kind: 'strength',
  name: 'Plank',
  exerciseId: 'plank',
  restSec: 60,
  logColumns: [{ id: 't', kind: 'time_sec', value: '30', values: ['30'] }],
  rows: [{ n: 1, target: '30', targetKind: 'seconds', reps: '', weight: '', done: false, extra: false }],
};
sandbox._task = plankTask;
if (L.resolveLoggerFlow(plankTask) !== 'time_primary') throw new Error('plank flow should be time_primary');
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

const weightedPlank = {
  kind: 'strength',
  name: 'Weighted Plank',
  exerciseId: 'weighted-plank',
  restSec: 60,
  logColumns: [
    { id: 'load', kind: 'weight_kg', value: '20', values: ['20'] },
    { id: 'effort', kind: 'time_sec', value: '30', values: ['30'] },
  ],
  rows: [
    { n: 1, target: '30', targetKind: 'seconds', weight: 20, reps: '', done: false, extra: false },
    { n: 2, target: '30', targetKind: 'seconds', weight: '', reps: '', done: false, extra: false },
  ],
};
sandbox._task = weightedPlank;
if (L.resolveLoggerFlow(weightedPlank) !== 'load_then_time') throw new Error('weighted plank flow');
if (L.loggerPhase(weightedPlank) !== 'active') throw new Error('weighted plank starts in load edit active');
const wpHtml = L.renderTask(weightedPlank);
if (!wpHtml.includes('oneSetWeight')) throw new Error('weighted plank weight input');
if (wpHtml.includes('workOverlay')) throw new Error('weighted plank should not auto-start work');
if (!wpHtml.includes('Start hold')) throw new Error('weighted plank start hold button');
if (wpHtml.includes('slider-card')) throw new Error('weighted plank load edit should hide slider');

L.startHold();
if (L.loggerPhase(weightedPlank) !== 'work') throw new Error('weighted plank work after start hold');
L.finishWorkPhase(30);
if (weightedPlank.rows[0].reps !== '30') throw new Error('weighted plank seconds logged');
const wpConfirm = L.renderTask(weightedPlank);
if (!wpConfirm.includes('slider-card')) throw new Error('weighted plank slider after work');
if (!wpConfirm.includes('oneSetWeight')) throw new Error('weighted plank confirm shows load');
L.onDifficultySlide('2');
L.nextStrengthSet();
if (!weightedPlank.rows[0].done) throw new Error('weighted plank set 1 not done');
const wpRest = L.renderTask(weightedPlank);
if (!wpRest.includes('Rest · between sets')) throw new Error('weighted plank rest phase');
if (wpRest.includes(' kg × ')) throw new Error('rest up-next should not use hard-coded kg × reps');
if (!wpRest.includes('20 kg')) throw new Error('rest logged summary should show kg');
if (!wpRest.includes('30s')) throw new Error('rest logged summary should show seconds');

const carryTask = {
  kind: 'strength',
  name: 'Farmer Walk',
  exerciseId: 'core-farmer-walk',
  restSec: 90,
  logColumns: [
    { id: 'w', kind: 'weight_kg', value: '', values: [''] },
    { id: 'd', kind: 'distance_m', value: '40', values: ['40'] },
    { id: 't', kind: 'time_sec', value: '', values: [''] },
  ],
  rows: [
    { n: 1, target: '40', targetKind: 'reps', weight: '', reps: '', distance: '', done: false, extra: false },
    { n: 2, target: '40', targetKind: 'reps', weight: '', reps: '', distance: '', done: false, extra: false },
  ],
};
sandbox._task = carryTask;
if (L.resolveLoggerFlow(carryTask) !== 'carry') throw new Error('farmer walk carry flow');
if (L.loggerPhase(carryTask) !== 'active') throw new Error('carry without prescribed time stays active');
const carryHtml = L.renderTask(carryTask);
if (!carryHtml.includes('oneSetMetric_0')) throw new Error('carry weight input');
if (!carryHtml.includes('oneSetMetric_1')) throw new Error('carry distance input');
if (!carryHtml.includes('oneSetMetric_2')) throw new Error('carry time input');
if (!carryHtml.includes('metric-unit>metres')) throw new Error('carry metres unit');
if (!carryHtml.includes('metric-unit>seconds')) throw new Error('carry seconds unit');
carryTask.rows[0].weight = 24;
carryTask.rows[0].distance = 40;
carryTask.rows[0].reps = 45;
L.onDifficultySlide('2');
L.nextStrengthSet();
if (!carryTask.rows[0].done) throw new Error('carry set 1 not done');
const carryRest = L.renderTask(carryTask);
if (!carryRest.includes('24 kg')) throw new Error('carry rest summary kg');
if (!carryRest.includes('40 metres')) throw new Error('carry rest summary metres');
if (!carryRest.includes('45s')) throw new Error('carry rest summary seconds');
if (carryRest.includes(' kg × ')) throw new Error('carry rest should not use kg × reps copy');

const carryTimed = {
  kind: 'strength',
  name: 'Farmer Walk',
  exerciseId: 'core-farmer-walk',
  restSec: 90,
  logColumns: [
    { id: 'w', kind: 'weight_kg', value: '', values: [''] },
    { id: 'd', kind: 'distance_m', value: '', values: [''] },
    { id: 't', kind: 'time_sec', value: '30', values: ['30'] },
  ],
  rows: [{ n: 1, target: '30', targetKind: 'seconds', weight: '', reps: '', distance: '', done: false, extra: false }],
};
sandbox._task = carryTimed;
if (L.loggerPhase(carryTimed) !== 'work') throw new Error('carry with prescribed time should enter work');
const carryWork = L.renderTask(carryTimed);
if (!carryWork.includes('workOverlay')) throw new Error('carry prescribed time work overlay');

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
if (L.resolveLoggerFlow(squatTask) !== 'load_reps') throw new Error('squat flow');
if (L.loggerPhase(squatTask) !== 'active') throw new Error('squat loggerPhase should stay active');
const squatHtml = L.renderTask(squatTask);
if (!squatHtml.includes('oneSetWeight')) throw new Error('squat regression: weight input missing');
if (!squatHtml.includes('oneSetReps')) throw new Error('squat regression: reps input missing');
if (!squatHtml.includes('metric-unit>kg')) throw new Error('squat regression: kg unit missing');
if (!squatHtml.includes('metric-unit>reps')) throw new Error('squat regression: reps unit missing');
if (!squatHtml.includes('metric-sep')) throw new Error('squat regression: × separator missing');
if (squatHtml.includes('workOverlay')) throw new Error('squat should not show work overlay');

const splitSquatTask = {
  kind: 'strength',
  name: 'Bulgarian Split Squat',
  exerciseId: 'core-bulgarian-split-squat',
  sideMode: 'both_per_round',
  restSec: 90,
  logColumns: [
    { id: 'load', kind: 'weight_kg', value: '', values: [''] },
    { id: 'effort', kind: 'reps', value: '', values: [''] },
  ],
  rows: [
    { n: 1, target: '8', targetKind: 'reps', weight: 20, reps: '', done: false, extra: false },
    { n: 2, target: '8', targetKind: 'reps', weight: '', reps: '', done: false, extra: false },
    { n: 3, target: '8', targetKind: 'reps', weight: '', reps: '', done: false, extra: false },
  ],
};
sandbox._task = splitSquatTask;
if (!L.isSidePerRound(splitSquatTask)) throw new Error('split squat sideMode');
const splitLeft = L.renderTask(splitSquatTask);
if (!splitLeft.includes('Left · Round')) throw new Error('split squat left round chip');
if (!splitLeft.includes('Round <b>1</b> / 3')) throw new Error('split squat round 1/3 chip');
splitSquatTask.rows[0].reps = 8;
L.onDifficultySlide('2');
L.nextStrengthSet();
if (splitSquatTask.autoreg.side !== 'right') throw new Error('after left log should be right side');
if (splitSquatTask.rows[0].done) throw new Error('row not done until right logged');
const splitRight = L.renderTask(splitSquatTask);
if (!splitRight.includes('Right · Round')) throw new Error('split squat right round chip');
splitSquatTask.rows[0].reps = 8;
L.onDifficultySlide('2');
L.nextStrengthSet();
if (!splitSquatTask.rows[0].done) throw new Error('row done after right log');
if (splitSquatTask.autoreg.restPhase !== true) throw new Error('rest after right side');
if (splitSquatTask.autoreg.side !== 'left') throw new Error('side resets to left after round');
const splitRest = L.renderTask(splitSquatTask);
if (!splitRest.includes('Rest · between sets')) throw new Error('split squat rest phase');
if (!splitRest.includes('L 20 kg')) throw new Error('rest summary left kg');
if (!splitRest.includes('R 20 kg')) throw new Error('rest summary right kg');

console.log('metric-logger.smoke: ok');
