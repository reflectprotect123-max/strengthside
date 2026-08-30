/**
 * Smoke: log column kinds + simplified coach builder (autopilot load default).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(dir, 'log-columns.js'), 'utf8');
const html = readFileSync(join(dir, 'index.html'), 'utf8');

if (!html.includes('log-columns.js')) throw new Error('index.html missing log-columns.js');
if (!html.includes('LogColumns.builderPrescriptionHtml')) throw new Error('builder prescription grid not wired');
if (!html.includes('LogColumns.loggerCellsHtml')) throw new Error('logger columns UI not wired');
if (!html.includes("LOCAL_BUILD='the-hybrid-athlete-engine-v99'")) throw new Error('expected cache v90');
if (!html.includes('Rest seconds')) throw new Error('builder missing Rest seconds above twin');
if (!html.includes('id=exNameVisible')) throw new Error('builder missing single exercise-name input');
if (!html.includes('id=exSuggest')) throw new Error('builder missing custom exercise suggest mount');
if (!html.includes('function exerciseSuggestHtml')) throw new Error('builder missing exerciseSuggestHtml');
if (html.includes('id=exNameOptions') || html.includes('list=exNameOptions')) {
  throw new Error('native datalist should be removed (unreadable on dark theme)');
}

const sandbox = { window: {}, console, document: { getElementById: () => null, querySelector: () => null, createElement: () => ({ innerHTML: '', firstChild: null, replaceWith() {} }) } };
sandbox.window = sandbox;
vm.runInNewContext(src, sandbox);
const LC = sandbox.LogColumns;
if (!LC) throw new Error('LogColumns missing');

const keys = LC.KINDS.map((k) => k.key);
for (const k of ['reps', 'reps_range', 'weight_kg', 'weight_pct_wm', 'weight_lwp', 'time_sec', 'distance_m']) {
  if (!keys.includes(k)) throw new Error('missing kind ' + k);
}

LC.beginSheet({ sets: 4, reps: '10, 10, 10, MAX', restSec: 150 });
if (LC.getSetCount() !== 4) throw new Error('set count');
if (LC.getRestSec() !== 150) throw new Error('rest');
const cols = LC.getSheetColumns();
if (cols.length !== 1) throw new Error('coach default is effort-only column, got ' + cols.length);
if (cols[0].values.length !== 4) throw new Error('per-set values');
if (LC.hasPinnedLoad(cols)) throw new Error('new exercise should not pin load');

const twin = LC.builderPrescriptionHtml();
if (!twin.includes('builderPrescriptionCard')) throw new Error('prescription card missing');
if (!twin.includes('builderLoggerCard')) throw new Error('twin card missing');
if (!twin.includes('autopilot-strip')) throw new Error('autopilot strip missing');
if (!twin.includes('Autopilot')) throw new Error('autopilot label missing');
if (!twin.includes('Pin opening load')) throw new Error('advanced pin load missing');
if (!twin.includes('Per-set rep overrides')) throw new Error('overrides section missing');
if (!twin.includes('Athlete logger preview')) throw new Error('preview header missing');
if (!twin.includes('Rest 02:30')) throw new Error('rest chip missing');
if (twin.includes('logcol-kind') && !twin.includes('Target')) throw new Error('target dropdown missing');

LC.beginSheet({ sets: 3, reps: '8', restSec: 120 });
LC.onSimpleReps('5-7');
const presc = LC.getSheetColumns()[0].values;
if (presc.join('|') !== '5-7|5-7|5-7') throw new Error('prescription forward fill reps: ' + presc.join('|'));

LC.onPinLoadKind('weight_pct_wm');
LC.onPinLoadValue('65');
const pinnedCols = LC.getSheetColumns();
if (pinnedCols.length !== 2) throw new Error('pinned load adds load column');
if (!LC.hasPinnedLoad(pinnedCols)) throw new Error('pinned load expected');

const out = { sets: 3, reps: 'x' };
LC.syncLegacyFromColumns(
  out,
  pinnedCols,
  3,
);
if (!out.loadExpr || out.loadExpr.exprKind !== 'pct_of_max') throw new Error('sync loadExpr');
if (out.reps !== '5-7') throw new Error('sync reps ' + out.reps);

LC.clearPinnedLoad();
if (LC.getSheetColumns().some((c) => c.kind.startsWith('weight_'))) {
  throw new Error('clearPinnedLoad should remove load column');
}

LC.beginSheet({ sets: 4, reps: '', restSec: 120 });
LC.onCellChange(0, 0, '5-7');
const filled = LC.getSheetColumns()[0].values;
if (filled.join('|') !== '5-7|5-7|5-7|5-7') throw new Error('forward fill reps: ' + filled.join('|'));
LC.onCellChange(0, 2, '3');
const partial = LC.getSheetColumns()[0].values;
if (partial[0] !== '5-7' || partial[1] !== '5-7' || partial[2] !== '3' || partial[3] !== '3') {
  throw new Error('forward fill must not backfill: ' + partial.join('|'));
}

console.log('log-columns.smoke: ok');
