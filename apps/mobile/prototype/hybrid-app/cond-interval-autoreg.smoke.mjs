/**
 * Smoke: conditioning interval autoreg — felt panel + decideNextPhase wiring.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const adapterSrc = readFileSync(join(dir, 'engine-adapter.js'), 'utf8');
const autoregSrc = readFileSync(join(dir, 'cond-interval-autoreg.js'), 'utf8');

if (!html.includes('cond-interval-autoreg.js')) throw new Error('index.html missing cond-interval-autoreg.js');
if (!html.includes('CondIntervalAutoreg.onWorkEnd')) throw new Error('advanceInterval must call onWorkEnd');
if (!html.includes('CondIntervalAutoreg.beforeNextWork')) throw new Error('advanceInterval must call beforeNextWork');
if (!adapterSrc.includes('suggestNextPhase')) throw new Error('engine-adapter missing suggestNextPhase');
if (!adapterSrc.includes('applyNextPhaseDecision')) throw new Error('engine-adapter missing applyNextPhaseDecision');

const sandbox = {
  window: {},
  console,
  globalThis: {},
  current: () => sandbox._task,
  esc: (s) => String(s),
  save: () => {},
  refreshCondLogOrTrain: () => {},
  condEffortMeta: (k) => ({ zoneKey: k === 'hard' ? 'anaerobic' : 'aerobic', name: k }),
  bleHr: { zoneSeconds: { recovery: 10, aerobic: 40, anaerobic: 5, peak: 0 } },
  EngineAdapter: {
    suggestNextPhase: (task, input) => ({
      action: input.felt >= 8 ? 'decrease' : input.felt <= 5 ? 'increase' : 'hold',
      reasonCodes: ['smoke'],
      nextTargetWatts: input.felt >= 8 ? 180 : input.felt <= 5 ? 220 : 200,
    }),
    applyNextPhaseDecision: (task, decision) => {
      if (decision.nextTargetWatts != null) task.targetWatts = decision.nextTargetWatts;
      return task;
    },
  },
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(autoregSrc, sandbox);

const task = {
  kind: 'conditioning',
  condFmt: 'intervals',
  effort: 'medium',
  rounds: 4,
  workSec: 60,
  restSec: 90,
  targetWatts: 200,
  interval: { phase: 'rest', round: 1, finished: false, running: true },
};
sandbox._task = task;

sandbox.CondIntervalAutoreg.onWorkEnd(task);
task.autoreg.pendingFelt = 8.5;
sandbox.CondIntervalAutoreg.beforeNextWork(task, task.interval);
if (task.targetWatts !== 180) throw new Error('expected watts decrease after hard felt, got ' + task.targetWatts);

const panel = sandbox.CondIntervalAutoreg.restPanelHtml(task, task.interval);
if (!panel.includes('how did that interval feel')) throw new Error('rest panel missing');
if (!panel.includes('Too hard')) throw new Error('felt buttons missing');

console.log('cond-interval-autoreg.smoke: ok');
