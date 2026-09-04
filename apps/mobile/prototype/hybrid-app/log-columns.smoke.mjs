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
if (!html.includes("LOCAL_BUILD='the-hybrid-athlete-blank-v172'")) throw new Error('expected cache v162');
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

console.log('log-columns.smoke: ok');
