/**
 * Smoke: Engine session logger — mockup work/rest/steady/recap shells.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const src = readFileSync(join(dir, 'cond-session-logger.js'), 'utf8');

if (!html.includes('cond-session-logger.js')) throw new Error('index.html missing cond-session-logger.js');
if (!html.includes('CondSessionLogger.renderSimpleCond')) throw new Error('renderSimpleCondLog must delegate');
if (!src.includes('engine-work-countdown')) throw new Error('work countdown missing');
if (!src.includes('engine-recap-card')) throw new Error('recap card missing');

const sandbox = {
  window: {},
  console,
  current: () => sandbox._task,
  esc: (s) => String(s),
  save: () => {},
  fmt: (s) => String(s),
  activeSession: () => ({ date: '2026-09-01' }),
  workElapsed: () => 300,
  blockElapsed: () => 1200,
  condPlanLineTask: () => '4×4:00 / 3:00 Medium',
  condEffortMeta: () => ({ name: 'Medium', zoneKey: 'aerobic' }),
  athHomeMetrics: () => ({ recovery: 70 }),
  athZonesForReadiness: () => [{ key: 'aerobic', label: 'Zone 2' }],
  taskNeedsIntervalClock: () => true,
  ensureTaskInterval: (t) => t.interval,
  normaliseInterval: (t) => t.interval,
  intervalRemaining: () => 136,
  intervalElapsed: () => 44,
  bleHr: { status: 'idle', liveBpm: null },
  echoBike: { status: 'idle' },
  modalityWantsEcho: () => false,
  SessionChrome: {
    render: (opts) => `<div class="session-chrome dial-engine">${opts.subtitle}</div>`,
  },
  RestOverlay: {
    render: () => '<div id=restOverlay class="rest-overlay dial-engine"></div>',
    startRest: () => {},
    remainingSec: () => 0,
    skipRest: () => {},
  },
  CondIntervalAutoreg: {
    restSliderHtml: () => '<input type="range" id=condFelt>',
    recapSliderHtml: () => '<input type="range" id=condRecapFelt>',
  },
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(src, sandbox);

const intervalTask = {
  kind: 'conditioning',
  heading: 'Row ERG',
  modality: 'Rower',
  condFmt: 'intervals',
  effort: 'medium',
  rounds: 8,
  workSec: 240,
  restSec: 180,
  targetWatts: 152,
  interval: { phase: 'work', round: 3, finished: false, running: true, remaining: 136 },
};
sandbox._task = intervalTask;

const workHtml = sandbox.CondSessionLogger.renderSimpleCond(intervalTask);
if (!workHtml.includes('session-chrome')) throw new Error('work phase missing session chrome');
if (!workHtml.includes('engine-work-countdown')) throw new Error('work phase missing countdown');
if (!workHtml.includes('engine-work-grid')) throw new Error('work phase missing stat grid');

intervalTask.interval.phase = 'rest';
const restHtml = sandbox.CondSessionLogger.renderSimpleCond(intervalTask);
if (!restHtml.includes('rest-overlay')) throw new Error('rest phase missing overlay');

intervalTask.interval.finished = true;
intervalTask.interval.completedRounds = 8;
intervalTask.result = { avgHr: 151, duration: 3600 };
const recapHtml = sandbox.CondSessionLogger.renderSimpleCond(intervalTask);
if (!recapHtml.includes('engine-recap-card')) throw new Error('recap missing stats card');

console.log('cond-session-logger.smoke: ok');
