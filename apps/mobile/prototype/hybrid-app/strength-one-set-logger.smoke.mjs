/**
 * Smoke: one-set strength logger module.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const src = readFileSync(join(join(dir, 'strength-one-set-logger.js')), 'utf8');

if (!html.includes('strength-one-set-logger.js')) throw new Error('index.html missing strength-one-set-logger.js');
if (!html.includes('StrengthOneSetLogger.renderTask')) throw new Error('strengthTask must delegate to StrengthOneSetLogger');
if (!src.includes('nextStrengthSet')) throw new Error('nextStrengthSet handler missing in strength-one-set-logger.js');
if (!html.includes("LOCAL_BUILD='the-hybrid-athlete-engine-v138'")) throw new Error('expected cache v138');
if (!html.includes('.one-set-row-active{grid-template-columns:')) {
  throw new Error('index.html missing one-set-row-active grid CSS');
}
if (!src.includes('oneSetDifficulty')) throw new Error('difficulty slider missing');
if (!src.includes('one-set-stack')) throw new Error('ghost set stack missing');

const sandbox = {
  window: {},
  console,
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
  activeSession: () => ({ date: '2026-08-30' }),
  restSeconds: () => 90,
  fmt: (s) => String(s),
  restBtn: () => '<button>Rest</button>',
  strengthLoadHeadlineHtml: () => '',
  lastRows: () => [],
  validateStrengthRow: () => '',
  maybeStartRestAfterLog: () => {},
  stopRest: () => {},
  nextTask: () => {},
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(src, sandbox);

const task = {
  kind: 'strength',
  name: 'Back Squat',
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
if (!htmlOut.includes('One set at a time')) throw new Error('one-set header missing');
if (!htmlOut.includes('one-set-stack')) throw new Error('set stack missing');
if (!htmlOut.includes('one-set-ghost')) throw new Error('ghost rows missing');
if (!htmlOut.includes('oneSetDifficulty')) throw new Error('difficulty slider missing');
if (!htmlOut.includes('onclick="nextStrengthSet()"')) throw new Error('in-row Next missing');
if (!htmlOut.includes('oneSetWeight')) throw new Error('weight input missing');
if (htmlOut.includes('How did that set feel')) throw new Error('legacy chip prompt should not appear');
if (htmlOut.includes('Log</button>')) throw new Error('legacy per-row Log should not appear');

const sandboxNoEsc = {
  window: {},
  console,
  current: () => sandboxNoEsc._task,
  save: () => {},
  train: () => {},
  S: {},
  StrengthAdapter: { targetRirForExercise: () => 2 },
  activeSession: () => ({ date: '2026-08-30' }),
  restSeconds: () => 90,
  fmt: (s) => String(s),
  restBtn: () => '',
  strengthLoadHeadlineHtml: () => '',
  lastRows: () => [],
};
sandboxNoEsc.window = sandboxNoEsc;
vm.createContext(sandboxNoEsc);
vm.runInContext(src, sandboxNoEsc);
sandboxNoEsc._task = task;
const htmlNoEsc = sandboxNoEsc.StrengthOneSetLogger.renderTask(task);
if (!htmlNoEsc.includes('oneSetWeight')) throw new Error('renderTask must work without window.esc');

task.rows[0].reps = 5;
sandbox.StrengthOneSetLogger.onDifficultySlide('2');
if (task.autoreg.selectedDifficulty !== 'medium') throw new Error('difficulty slider selection');

sandbox.StrengthOneSetLogger.nextStrengthSet();
if (!task.rows[0].done) throw new Error('set 1 should be marked done');
if (task.rows[1].weight !== 102.5) throw new Error('set 2 should get engine suggestion, got ' + task.rows[1].weight);
if (!sandbox.StrengthOneSetLogger.renderTask(task).includes('one-set-done')) {
  throw new Error('set 2 view should show completed set 1');
}

console.log('strength-one-set-logger.smoke: ok');
