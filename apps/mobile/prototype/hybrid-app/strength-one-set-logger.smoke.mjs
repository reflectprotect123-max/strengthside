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
if (!html.includes("LOCAL_BUILD='the-hybrid-athlete-engine-v116'")) throw new Error('expected cache v100');

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
if (!htmlOut.includes('Set 1 of 3')) throw new Error('one-set header missing');
if (!htmlOut.includes('How did that set feel')) throw new Error('difficulty prompt missing');
if (!htmlOut.includes('Very easy')) throw new Error('difficulty buttons missing');
if (!htmlOut.includes('Next set')) throw new Error('Next set button missing');
if (htmlOut.includes('Log</button>')) throw new Error('legacy per-row Log should not appear');

task.rows[0].reps = 5;
sandbox.StrengthOneSetLogger.selectStrengthDifficulty('medium');
if (task.autoreg.selectedDifficulty !== 'medium') throw new Error('difficulty selection');

sandbox.StrengthOneSetLogger.nextStrengthSet();
if (!task.rows[0].done) throw new Error('set 1 should be marked done');
if (task.rows[1].weight !== 102.5) throw new Error('set 2 should get engine suggestion, got ' + task.rows[1].weight);

console.log('strength-one-set-logger.smoke: ok');
