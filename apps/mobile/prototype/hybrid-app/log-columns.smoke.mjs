/**
 * Smoke: log column kinds + simplified coach builder (autopilot volume + load).
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
if (!coachHtml.includes('LogColumns.builderPrescriptionHtml')) throw new Error('coach builder prescription grid not wired');
if (html.includes('LogColumns.builderPrescriptionHtml({compact:false})')) throw new Error('athlete exerciseSheet must not wire Prescription card');
if (!html.includes("LOCAL_BUILD='the-hybrid-athlete-engine-v140'")) throw new Error('expected cache v120');
if (!html.includes('athleteLiftEditor') || !html.includes('ath-lift-card')) throw new Error('athlete lift editor missing');

const sandbox = { window: {}, console, document: { getElementById: () => null, querySelector: () => null, createElement: () => ({ innerHTML: '', firstChild: null, replaceWith() {} }) } };
sandbox.window = sandbox;
vm.runInNewContext(src, sandbox);
const LC = sandbox.LogColumns;
if (!LC) throw new Error('LogColumns missing');

LC.beginSheet({ autopilotVolume: true, sets: null, reps: null, restSec: 150 });
if (!LC.getSheetColumns().length) throw new Error('effort column expected for preview');
const twin = LC.builderPrescriptionHtml();
if (!twin.includes('autopilot-strip')) throw new Error('autopilot strip missing');
if (!twin.includes('Volume')) throw new Error('volume autopilot strip missing');
if (!twin.includes('Autopilot')) throw new Error('autopilot label missing');
if (!twin.includes('Pin sets')) throw new Error('pin volume advanced missing');

LC.beginAthleteSheet({ autopilotVolume: true, sets: null, reps: null, restSec: 120 });
const athlete = LC.builderAthleteColumnsHtml();
if (!athlete.includes('builder-colhead-row')) throw new Error('athlete column row missing');
if (athlete.includes('Add column')) throw new Error('athlete builder should not offer add column');
if (athlete.includes('Pin sets')) throw new Error('athlete builder should not show pin UI');
if ((LC.getSheetColumns() || []).length !== 2) throw new Error('athlete default should be 2 columns');

LC.beginSheet({ sets: 3, reps: '8', restSec: 120, autopilotVolume: false });
LC.onSimpleReps('5-7');
const out = { sets: 3, reps: 'x' };
LC.syncLegacyFromColumns(out, LC.getSheetColumns(), 3);
if (out.autopilotVolume !== false) throw new Error('pinned volume should disable autopilot');
if (out.reps !== '5-7') throw new Error('sync reps ' + out.reps);

LC.beginSheet({ autopilotVolume: true, sets: null, reps: null, restSec: 120 });
LC.syncLegacyFromColumns(out, LC.getSheetColumns(), 3);
if (!out.autopilotVolume) throw new Error('blank volume should stay autopilot');
if (out.sets != null) throw new Error('autopilot should null sets');

console.log('log-columns.smoke: ok');
