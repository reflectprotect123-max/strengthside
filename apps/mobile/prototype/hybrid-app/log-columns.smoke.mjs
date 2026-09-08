/**
 * Smoke: log column kinds + simplified coach builder (open volume + load).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(dir, 'log-columns.js'), 'utf8');
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const coachHtml = readFileSync(join(dir, 'coach.html'), 'utf8');

if (!html.includes('log-columns.js')) throw new Error('index.html missing log-columns.js');
if (!coachHtml.includes('Coach is parked')) throw new Error('coach should remain parked');
if (html.includes('LogColumns.builderPrescriptionHtml({compact:false})')) throw new Error('athlete exerciseSheet must not wire Prescription card');
if (!html.includes("LOCAL_BUILD='the-hybrid-athlete-blank-v196'")) throw new Error('expected cache v162');
if (!html.includes('athleteLiftEditor') || !html.includes('ath-lift-logger')) throw new Error('athlete lift logger editor missing');

const sandbox = { window: {}, console, document: { getElementById: () => null, querySelector: () => null, createElement: () => ({ innerHTML: '', firstChild: null, replaceWith() {} }) } };
sandbox.window = sandbox;
vm.runInNewContext(src, sandbox);
const LC = sandbox.LogColumns;
if (!LC) throw new Error('LogColumns missing');

LC.beginSheet({ openVolume: true, sets: null, reps: null, restSec: 150 });
if (!LC.getSheetColumns().length) throw new Error('effort column expected for preview');
const twin = LC.builderPrescriptionHtml();
if (!twin.includes('open-strip')) throw new Error('open strip missing');
if (!twin.includes('Volume')) throw new Error('volume open strip missing');
if (!twin.includes('Open')) throw new Error('open label missing');
if (!twin.includes('logger-screen')) throw new Error('builder twin should match athlete logger');
if (!twin.includes('hero-metrics')) throw new Error('builder twin hero missing');
if (!twin.includes('Next set')) throw new Error('builder twin Next set missing');

const ex = {
  openVolume: true,
  restSec: 150,
  name: 'Bench Press',
  logColumns: [
    { id: 'load', kind: 'weight_pct_wm', value: '', values: [''] },
    { id: 'effort', kind: 'reps', value: '', values: [''] },
  ],
};
const athleteTwin = LC.builderAthleteTwinHtml(ex, { bi: 0, ei: 0 });
if (!athleteTwin.includes('logger-screen')) throw new Error('athlete builder twin missing logger-screen');
if (!athleteTwin.includes('builder-metric-select')) throw new Error('athlete builder twin metric selects missing');
if (!athleteTwin.includes('Rest (seconds)')) throw new Error('athlete builder twin rest row missing');
if (!athleteTwin.includes('How should this feel')) throw new Error('athlete builder twin calibration slider missing');
if (athleteTwin.includes('Next set')) throw new Error('athlete builder twin should not show logger Next set');
if (athleteTwin.includes('How hard was that set')) throw new Error('athlete builder twin should not show post-set slider');
if (athleteTwin.includes('Open')) throw new Error('athlete builder twin should not show open strip');

LC.beginAthleteSheet({ openVolume: true, sets: null, reps: null, restSec: 120 });
const athlete = LC.builderAthleteColumnsHtml();
if (!athlete.includes('builder-colhead-row')) throw new Error('athlete column row missing');
if (athlete.includes('Add column')) throw new Error('athlete builder should not offer add column');
if (athlete.includes('Pin sets')) throw new Error('athlete builder should not show pin UI');
if ((LC.getSheetColumns() || []).length !== 2) throw new Error('athlete default should be 2 columns');

LC.beginSheet({ sets: 3, reps: '8', restSec: 120, openVolume: false });
LC.onSimpleReps('5-7');
const out = { sets: 3, reps: 'x' };
LC.syncLegacyFromColumns(out, LC.getSheetColumns(), 3);
if (out.openVolume !== false) throw new Error('pinned volume should disable open volume');
if (out.reps !== '5-7') throw new Error('sync reps ' + out.reps);

LC.beginSheet({ openVolume: true, sets: null, reps: null, restSec: 120 });
LC.syncLegacyFromColumns(out, LC.getSheetColumns(), 3);
if (!out.openVolume) throw new Error('blank volume should stay open volume');
if (out.sets != null) throw new Error('open volume should null sets');

const plankEx = {
  name: 'Plank',
  restSec: 60,
  logColumns: [{ id: 't', kind: 'time_sec', value: '', values: [''] }],
};
const plankTwin = LC.builderAthleteTwinHtml(plankEx, { bi: 0, ei: 0 });
if (!plankTwin.includes('Time (seconds)')) throw new Error('plank twin shows time kind');
if (plankTwin.includes('metric-sep')) throw new Error('single-column plank should not show × separator');

const carryEx = {
  name: 'Farmer Walk',
  restSec: 90,
  logColumns: [
    { id: 'w', kind: 'weight_kg', value: '', values: [''] },
    { id: 'd', kind: 'distance_m', value: '', values: [''] },
    { id: 't', kind: 'time_sec', value: '', values: [''] },
  ],
};
const carryTwin = LC.builderAthleteTwinHtml(carryEx, { bi: 0, ei: 0 });
if (!carryTwin.includes('Distance (metres)')) throw new Error('carry twin missing distance');
if (!carryTwin.includes('Time (seconds)')) throw new Error('carry twin missing time');

if (!LC.columnLayout) throw new Error('columnLayout export missing');
const carryLayout = LC.columnLayout(carryEx);
if (carryLayout.layout !== 'triple') throw new Error('carry layout should be triple');
if (carryLayout.cols.length !== 3) throw new Error('carry should have 3 cols');

if (!LC.toggleColumnOptional) throw new Error('toggleColumnOptional export missing');
if (!LC.liveColumns) throw new Error('liveColumns export missing');
if (!html.includes('function setAthleteLiftColumnOptional')) {
  throw new Error('builder must wire setAthleteLiftColumnOptional');
}

const pair = [
  { id: 'a', kind: 'weight_kg', value: '', values: [''] },
  { id: 'b', kind: 'reps', value: '8', values: ['8'] },
];
const pairEx = { name: 'Bench Press', restSec: 120, logColumns: pair };
const pairTwin = LC.builderAthleteTwinHtml(pairEx, { bi: 0, ei: 0 });
if (!pairTwin.includes('(optional)')) throw new Error('pair columns need (optional) control');
if (!pairTwin.includes('setAthleteLiftColumnOptional(0,0,0)')) {
  throw new Error('optional control must target first column');
}
if (!pairTwin.includes('setAthleteLiftColumnOptional(0,0,1)')) {
  throw new Error('optional control must target second column');
}
if (plankTwin.includes('(optional)')) throw new Error('single-column lift has no optional control');

const opted = LC.toggleColumnOptional(pair, 0);
if (!opted[0].optional) throw new Error('selected column becomes optional');
if (opted[1].optional) throw new Error('other column stays live (not optional)');
const live = LC.liveColumns({ logColumns: opted });
if (live.length !== 1 || live[0].kind !== 'reps') throw new Error('live metric is the other column');
if (!LC.liveTracksKg({ logColumns: opted })) {
  /* kg is optional — must not drive kg progress */
} else {
  throw new Error('optional kg must not live-track kg');
}
if (!LC.liveTracksKg({ logColumns: LC.toggleColumnOptional(pair, 1) })) {
  throw new Error('optional reps leaves kg as the live tracked metric');
}

const skipKg = LC.validateAthleteRow(
  { logColumns: opted },
  { weight: '', reps: 8 },
);
if (skipKg) throw new Error('optional kg may be blank: ' + skipKg);
const needKg = LC.validateAthleteRow(
  { logColumns: LC.toggleColumnOptional(pair, 1) },
  { weight: '', reps: 8 },
);
if (!needKg) throw new Error('live kg must require a weight');

const liveTwin = LC.builderAthleteTwinHtml({ name: 'Bench', restSec: 90, logColumns: opted }, { bi: 0, ei: 0 });
if (!liveTwin.includes('tracks')) throw new Error('live column shows tracks hint');

if (LC.savedLogColumnsStale({ exerciseId: 'core-back-squat', name: 'Back Squat' }, [{ id: 'c', kind: 'reps' }])) {
  throw new Error('1-column reps on a squat is a user choice, not stale');
}
const oneCol = LC.ensureAthleteLogColumns({
  name: 'Back Squat',
  exerciseId: 'core-back-squat',
  logColumns: [{ id: 'c', kind: 'reps', value: '8', values: ['8'] }],
});
if (oneCol.length !== 1) throw new Error('builder must keep a single live column, got ' + oneCol.length);
const keptKg = LC.ensureAthleteLogColumns({
  logColumns: [
    { id: 'a', kind: 'weight_kg', value: '80', values: ['80'] },
    { id: 'b', kind: 'reps', value: '5', values: ['5'] },
  ],
});
if (String(keptKg[0].value || '') !== '80') throw new Error('builder must keep painted kg, got ' + keptKg[0].value);

if (!pairTwin.includes('id="athLoad_0_0_0"')) throw new Error('live kg column needs a load input');
if (!pairTwin.includes('aria-label="Add metric"')) throw new Error('builder needs add-metric control');
if (pairTwin.includes('session start fills kg')) throw new Error('hero must not hard-code kg fill copy');
const kgOptions = (pairTwin.match(/<select class="builder-metric-select[\s\S]*?<\/select>/g) || [])[1] || '';
if (!kgOptions.includes('Weight (kg)')) throw new Error('every column dropdown must list all metric kinds');
if (!html.includes('function setAthleteLiftLoad')) throw new Error('builder must persist painted load');

console.log('log-columns.smoke: ok');
