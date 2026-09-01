/**
 * Smoke: Engine session logger — mockup work/rest/steady/recap.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const src = readFileSync(join(dir, 'cond-session-logger.js'), 'utf8');

if (!html.includes('cond-session-logger.js')) throw new Error('index.html missing cond-session-logger.js');
if (!html.includes('.timer-big{')) throw new Error('timer-big CSS missing');
if (!html.includes('.target-row{')) throw new Error('target-row CSS missing');
if (!src.includes('timer-big')) throw new Error('work countdown missing');
if (!src.includes('phasechip')) throw new Error('phasechip missing');

const sandbox = {
  window: {},
  console,
  setInterval: () => 1,
  clearInterval: () => {},
  document: { querySelector: () => null, getElementById: () => null },
  current: () => sandbox._task,
  esc: (s) => String(s),
  save: () => {},
  fmt: (s) => {
    const n = Math.max(0, Math.round(+s || 0));
    return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
  },
  activeSession: () => ({ date: '2026-09-01' }),
  workElapsed: () => 300,
  blockElapsed: () => 300,
  condPlanLineTask: () => '4 × 4:00 / 3:00 · Medium effort',
  condEffortMeta: () => ({ name: 'Medium', zoneKey: 'aerobic' }),
  taskNeedsIntervalClock: () => true,
  ensureTaskInterval: (t) => t.interval,
  normaliseInterval: (t) => t.interval,
  intervalRemaining: () => 136,
  intervalElapsed: () => 44,
  athHomeMetrics: () => ({ recovery: 71 }),
  athZonesForReadiness: () => [
    { key: 'recovery', name: 'Recovery', lo: 100, hi: 120, color: '#7dba9a' },
    { key: 'aerobic', name: 'Aerobic', lo: 121, hi: 140, color: '#5ec4b4' },
    { key: 'anaerobic', name: 'Anaerobic', lo: 141, hi: 160, color: '#d4a574' },
  ],
  mphZoneForHr: (hr, zones) => zones.find((z) => hr >= z.lo && hr <= z.hi) || zones[1],
  bleHr: { status: 'idle', liveBpm: null },
  echoBike: { status: 'idle' },
  SessionChrome: { applyBrand: () => {} },
  RestOverlay: {
    render: (o) =>
      `<div id=restOverlay class="logger-rest dial-engine"><div class=rest-ring><div class=rest-time>02:41</div></div>${o.upNextHtml || ''}${o.sliderHtml || ''}</div>`,
    startRest: () => {},
    remainingSec: () => 161,
    skipRest: () => {},
    stopRest: () => {},
  },
  CondIntervalAutoreg: {
    restSliderHtml: () =>
      '<div class=slider-card><div class=sliderhead><b>How hard was that interval?</b></div></div>',
    recapSliderHtml: () => '<div class=slider-card>recap</div>',
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
if (!workHtml.includes('logger-screen')) throw new Error('work missing logger-screen');
if (!workHtml.includes('timer-big')) throw new Error('work missing timer');
if (!workHtml.includes('target-row')) throw new Error('work missing target row');
if (!workHtml.includes('phasechip')) throw new Error('work missing phasechip');
if (!workHtml.includes('hr-gauge')) throw new Error('work missing HR gauge');
if (!workHtml.includes('loggerHrGauge')) throw new Error('work missing loggerHrGauge id');
if (!workHtml.includes('loggerHrTarget')) throw new Error('work missing loggerHrTarget id');
if (!workHtml.includes('End interval')) throw new Error('work primary should End interval when running');
if (!workHtml.includes('RIR 2 equivalent')) throw new Error('work target effort copy missing');
if (!workHtml.includes('HR bpm')) throw new Error('work HR target label missing');

sandbox.bleHr = { status: 'live', liveBpm: 151 };
const liveWorkHtml = sandbox.CondSessionLogger.renderSimpleCond(intervalTask);
if (!liveWorkHtml.includes('>151<')) throw new Error('live HR not shown in work phase');
if (!liveWorkHtml.includes('Anaerobic')) throw new Error('live HR zone name missing');

intervalTask.interval.phase = 'rest';
const restHtml = sandbox.CondSessionLogger.renderSimpleCond(intervalTask);
if (!restHtml.includes('logger-rest') && !restHtml.includes('rest-ring')) throw new Error('rest missing ring');
if (!restHtml.includes('Recover · between work')) throw new Error('rest eyebrow missing');
if (!restHtml.includes('How hard was that interval')) throw new Error('rest slider missing');
if (!restHtml.includes('Up next · Interval')) throw new Error('rest up-next interval copy missing');
if (!restHtml.includes('loggerHrGauge')) throw new Error('rest missing HR gauge block');
if (!sandbox.RestOverlay) {}

intervalTask.interval.finished = true;
intervalTask.interval.completedRounds = 8;
intervalTask.result = { avgHr: 151, duration: 3600 };
const recapHtml = sandbox.CondSessionLogger.renderSimpleCond(intervalTask);
if (!recapHtml.includes('Session recap')) throw new Error('recap missing');
if (!recapHtml.includes('Cardio completion')) throw new Error('recap stats header missing');
if (!recapHtml.includes('Save · update progression')) throw new Error('recap save missing');
if (!recapHtml.includes('Overall session feel') && !recapHtml.includes('slider-card')) {
  throw new Error('recap slider missing');
}

sandbox.taskNeedsIntervalClock = () => false;
const steady = {
  kind: 'conditioning',
  heading: 'Assault Bike',
  modality: 'Bike',
  condFmt: 'steady',
  effort: 'easy',
  targetDurationMin: 20,
  result: {},
};
sandbox._task = steady;
const steadyHtml = sandbox.CondSessionLogger.renderSimpleCond(steady);
if (!steadyHtml.includes('steady-state')) throw new Error('steady eyebrow missing');
if (!steadyHtml.includes('Finish · rate session')) throw new Error('steady finish missing');

const recovery = {
  kind: 'conditioning',
  heading: 'Recovery movement',
  modality: 'Mixed',
  condFmt: 'steady',
  effort: 'easy',
  recoverySession: true,
  targetDurationMin: 20,
  recoveryPct: 0.35,
  result: {},
};
sandbox._task = recovery;
const recoveryHtml = sandbox.CondSessionLogger.renderSimpleCond(recovery);
if (!recoveryHtml.includes('Conditioning · recovery')) throw new Error('recovery eyebrow missing');
if (!recoveryHtml.includes('Finish recovery')) throw new Error('recovery finish missing');
if (!recoveryHtml.includes('easy flush')) throw new Error('recovery subcopy missing');
if (!sandbox.CondSessionLogger.isRecovery(recovery)) throw new Error('isRecovery false');

recovery.interval = { finished: true, completedRounds: 0, elapsed: 1200 };
recovery.result = { avgHr: 110, duration: 1200 };
const recoveryRecap = sandbox.CondSessionLogger.renderRecap(recovery, recovery.interval);
if (!recoveryRecap.includes('no load progression')) throw new Error('recovery recap should suppress load progression');

const twinInterval = sandbox.CondSessionLogger.builderTwinHtml({
  condFmt: 'intervals',
  modality: 'Rower',
  rounds: 8,
  workSec: 240,
  restSec: 180,
  targetWatts: 152,
  effort: 'medium',
  heading: 'Row ERG',
});
if (!twinInterval.includes('builderEngineCard')) throw new Error('interval twin missing');
if (!twinInterval.includes('End interval')) throw new Error('interval twin CTA missing');

const twinRecovery = sandbox.CondSessionLogger.builderTwinHtml({
  isRecovery: true,
  modality: 'Mixed',
  minutes: 20,
  effort: 'easy',
});
if (!twinRecovery.includes('Finish recovery')) throw new Error('recovery twin CTA missing');

console.log('cond-session-logger.smoke: ok');
