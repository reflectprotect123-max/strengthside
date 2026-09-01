/**
 * Smoke: one-set strength logger — 1:1 mockup structure.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const src = readFileSync(join(dir, 'strength-one-set-logger.js'), 'utf8');

if (!html.includes('strength-one-set-logger.js')) throw new Error('index.html missing strength-one-set-logger.js');
if (!html.includes('StrengthOneSetLogger.renderTask')) throw new Error('strengthTask must delegate to StrengthOneSetLogger');
if (!html.includes("LOCAL_BUILD='the-hybrid-athlete-engine-v141'")) throw new Error('expected cache v140');
if (!html.includes('.logger-screen{')) throw new Error('logger-screen CSS missing');
if (!html.includes('.hero-metrics{')) throw new Error('hero-metrics CSS missing');
if (!html.includes('.metric-val{')) throw new Error('metric-val CSS missing');
if (!html.includes('.slider-card{')) throw new Error('slider-card CSS missing');
if (!src.includes('logger-screen')) throw new Error('logger-screen missing in JS');
if (!src.includes('hero-metrics')) throw new Error('hero-metrics missing');
if (!src.includes('setchip')) throw new Error('setchip missing');

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
  alert: (m) => { throw new Error('alert: ' + m); },
  S: {},
  StrengthAdapter: {
    targetRirForExercise: () => 2,
    suggestNextSet: () => ({ loadKg: 102.5, reps: 8, targetRir: 2, reasonCodes: ['on_target_hold'] }),
  },
  activeSession: () => ({ date: '2026-08-30', taskIndex: 1, tasks: [{}, {}, {}] }),
  workElapsed: () => 120,
  restSeconds: () => 90,
  fmt: (s) => {
    const n = Math.max(0, Math.round(+s || 0));
    return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
  },
  validateStrengthRow: () => '',
  stopRest: () => {},
  nextTask: () => {},
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(readFileSync(join(dir, 'session-chrome.js'), 'utf8'), sandbox);
vm.runInContext(readFileSync(join(dir, 'rest-overlay.js'), 'utf8'), sandbox);
vm.runInContext(src, sandbox);

const task = {
  kind: 'strength',
  name: 'Barbell Back Squat',
  heading: 'Lower · Block A',
  exerciseId: 'squat',
  sets: 3,
  reps: '5',
  restSec: 90,
  complete: false,
  rows: [
    { n: 1, target: '5', targetKind: 'reps', weight: 100, reps: '', done: false, extra: false },
    { n: 2, target: '5', targetKind: 'reps', weight: '', reps: '', done: false, extra: false },
    { n: 3, target: '5', targetKind: 'reps', weight: '', reps: '', done: false, extra: false },
  ],
};
sandbox._task = task;

const htmlOut = sandbox.StrengthOneSetLogger.renderTask(task);
if (!htmlOut.includes('logger-screen')) throw new Error('logger-screen missing');
if (!htmlOut.includes('class=task')) throw new Error('task title missing');
if (!htmlOut.includes('setchip')) throw new Error('setchip missing');
if (!htmlOut.includes('hero-metrics')) throw new Error('hero metrics missing');
if (!htmlOut.includes('metric-val')) throw new Error('metric-val missing');
if (!htmlOut.includes('slider-card')) throw new Error('slider-card missing');
if (!htmlOut.includes('How hard was that set')) throw new Error('slider copy missing');
if (!htmlOut.includes('Very easy')) throw new Error('6 slider labels missing');
if (!htmlOut.includes("Didn't finish")) throw new Error("Didn't finish label missing");
if (!htmlOut.includes('Next set')) throw new Error('Next set button missing');
if (!htmlOut.includes('+ Extra set')) throw new Error('Extra set missing');
if (htmlOut.includes('one-set-ghost-stack')) throw new Error('ghost stack should not appear in mockup active screen');
if (htmlOut.includes('How did that set feel')) throw new Error('legacy chips');

task.rows[0].reps = 5;
sandbox.StrengthOneSetLogger.onDifficultySlide('2');
if (task.autoreg.selectedDifficulty !== 'medium') throw new Error('difficulty');

sandbox.StrengthOneSetLogger.nextStrengthSet();
if (!task.rows[0].done) throw new Error('set 1 not done');
if (task.rows[1].weight !== 102.5) throw new Error('suggestion missing');
const restHtml = sandbox.StrengthOneSetLogger.renderTask(task);
if (!restHtml.includes('logger-rest') && !restHtml.includes('rest-ring')) {
  throw new Error('rest phase should show rest ring');
}
if (!restHtml.includes('Rest · between sets')) throw new Error('rest eyebrow missing');

sandbox.StrengthOneSetLogger.finishRest();
task.autoreg.restPhase = false;
sandbox.StrengthOneSetLogger.onDifficultySlide('5');
const missed = sandbox.StrengthOneSetLogger.renderTask(task);
if (!missed.includes('Did not complete')) throw new Error('missed-rep hero missing');
if (!missed.includes('Log attempt · try again')) throw new Error('try again button missing');
if (!missed.includes('Next set · lower target')) throw new Error('lower target button missing');
if (!missed.includes('hero missed') && !missed.includes('class="hero missed"')) {
  throw new Error('missed hero class missing');
}

const ss = {
  kind: 'superset',
  heading: 'Superset A',
  complete: false,
  exercises: [
    {
      name: 'Bench Press',
      restSec: 120,
      rows: [{ n: 1, target: '8', weight: 80, reps: 8, done: true, extra: false }],
    },
    {
      name: 'Romanian Deadlift',
      restSec: 120,
      rows: [{ n: 1, target: '8', weight: 80, reps: '', done: false, extra: false }],
    },
  ],
};
sandbox.supersetCurrent = (t) => {
  const seq = [];
  const max = Math.max(0, ...t.exercises.map((ex) => (ex.rows || []).length));
  for (let round = 0; round < max; round++) {
    for (let exIndex = 0; exIndex < t.exercises.length; exIndex++) {
      const row = t.exercises[exIndex].rows[round];
      if (row) seq.push({ exIndex, rowIndex: round, row });
    }
  }
  return seq.find((item) => !item.row.done) || null;
};
sandbox._task = ss;
const ssHtml = sandbox.StrengthOneSetLogger.renderSupersetTask(ss);
if (!ssHtml.includes('superset-pill')) throw new Error('partner rest pill missing');
if (!ssHtml.includes('Romanian Deadlift')) throw new Error('partner lift missing');
if (!ssHtml.includes('How hard should this feel')) throw new Error('superset slider missing');
if (!ssHtml.includes('Next ·')) throw new Error('round rest Next label missing');

console.log('strength-one-set-logger.smoke: ok');
