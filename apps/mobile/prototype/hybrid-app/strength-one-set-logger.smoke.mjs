/**
 * Smoke: one-set strength logger module — mockup hero card UI.
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
if (!html.includes("LOCAL_BUILD='the-hybrid-athlete-engine-v139'")) throw new Error('expected cache v139');
if (!html.includes('.logger-hero-card{')) throw new Error('index.html missing logger-hero-card CSS');
if (!html.includes('.one-set-ghost-stack{')) throw new Error('index.html missing ghost stack CSS');
if (!src.includes('oneSetDifficulty')) throw new Error('difficulty slider missing');
if (!src.includes('one-set-ghost-stack')) throw new Error('ghost set stack missing');
if (!src.includes('logger-hero-card')) throw new Error('hero card missing');
if (!src.includes('sessionChromeHtml')) throw new Error('session chrome integration missing');

const sandbox = {
  window: {},
  console,
  setInterval: () => 1,
  clearInterval: () => {},
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
  SessionChrome: {
    render: (opts) =>
      `<div class=session-chrome><span>${opts.subtitle}</span><span>${opts.weekLabel}</span></div>`,
  },
  RestOverlay: {
    render: () => '<div id=restOverlay class="rest-overlay hidden"></div>',
    startRest: () => {},
    stopRest: () => {},
    hide: () => {},
    remainingSec: () => 90,
    skipRest: () => {},
    addRest: () => {},
  },
  activeSession: () => ({ date: '2026-08-30' }),
  workElapsed: () => 120,
  restSeconds: () => 90,
  fmt: (s) => String(s),
  strengthLoadHeadlineHtml: () => '',
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
if (!htmlOut.includes('session-chrome')) throw new Error('session chrome missing');
if (!htmlOut.includes('logger-hero-card')) throw new Error('hero card missing');
if (!htmlOut.includes('one-set-ghost-stack')) throw new Error('ghost stack missing');
if (!htmlOut.includes('oneSetDifficulty')) throw new Error('difficulty slider missing');
if (!htmlOut.includes('onclick="nextStrengthSet()"')) throw new Error('Next set button missing');
if (!htmlOut.includes('oneSetWeight')) throw new Error('weight input missing');
if (!htmlOut.includes('How hard was that set')) throw new Error('slider copy missing');
if (htmlOut.includes('How did that set feel')) throw new Error('legacy chip prompt should not appear');
if (htmlOut.includes('Log</button>')) throw new Error('legacy per-row Log should not appear');

task.rows[0].reps = 5;
sandbox.StrengthOneSetLogger.onDifficultySlide('2');
if (task.autoreg.selectedDifficulty !== 'medium') throw new Error('difficulty slider selection');

sandbox.StrengthOneSetLogger.nextStrengthSet();
if (!task.rows[0].done) throw new Error('set 1 should be marked done');
if (task.rows[1].weight !== 102.5) throw new Error('set 2 should get engine suggestion, got ' + task.rows[1].weight);
const restHtml = sandbox.StrengthOneSetLogger.renderTask(task);
if (!restHtml.includes('rest-overlay') && !restHtml.includes('REST')) {
  throw new Error('set 2 rest phase should show rest overlay');
}

console.log('strength-one-set-logger.smoke: ok');
