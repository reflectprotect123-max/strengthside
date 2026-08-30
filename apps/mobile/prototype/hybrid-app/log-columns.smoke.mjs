/**
 * Smoke: log column kinds + logger-twin builder helpers.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(dir, 'log-columns.js'), 'utf8');
const html = readFileSync(join(dir, 'index.html'), 'utf8');

if (!html.includes('log-columns.js')) throw new Error('index.html missing log-columns.js');
if (!html.includes('LogColumns.builderLoggerTwinHtml')) throw new Error('builder logger twin not wired');
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
const twin = LC.builderLoggerTwinHtml();
if (!twin.includes('builderLoggerCard')) throw new Error('twin card missing');
if (!twin.includes('mini-select') && !twin.includes('logcol-kind')) throw new Error('column dropdowns missing');
if (!twin.includes('builder-setrow')) throw new Error('set rows missing');
if (!twin.includes('Rest 02:30')) throw new Error('rest chip missing');
if (!twin.includes('Progress')) throw new Error('Progress header missing');

const cols = LC.getSheetColumns();
if (cols.length !== 2) throw new Error('default columns');
if (cols[1].values.length !== 4) throw new Error('per-set values');

const out = { sets: 3, reps: 'x' };
LC.syncLegacyFromColumns(
  out,
  [
    { id: 'a', kind: 'weight_pct_wm', values: ['65', '65', '65'], value: '65' },
    { id: 'b', kind: 'reps', values: ['8', '8', '8'], value: '8' },
  ],
  3,
);
if (!out.loadExpr || out.loadExpr.exprKind !== 'pct_of_max') throw new Error('sync loadExpr');
if (out.reps !== '8') throw new Error('sync reps ' + out.reps);

LC.beginSheet({ sets: 4, reps: '', restSec: 120 });
LC.onCellChange(1, 0, '5-7');
const filled = LC.getSheetColumns()[1].values;
if (filled.join('|') !== '5-7|5-7|5-7|5-7') throw new Error('forward fill reps: ' + filled.join('|'));
LC.onCellChange(1, 2, '3');
const partial = LC.getSheetColumns()[1].values;
if (partial[0] !== '5-7' || partial[1] !== '5-7' || partial[2] !== '3' || partial[3] !== '3') {
  throw new Error('forward fill must not backfill: ' + partial.join('|'));
}
LC.onCellChange(0, 0, '100');
const loadCol = LC.getSheetColumns()[0].values;
if (loadCol[1] !== '' || loadCol[2] !== '' || loadCol[3] !== '') {
  throw new Error('weight column must not forward fill: ' + loadCol.join('|'));
}

const loggerHtml = LC.loggerCellsHtml({ weight: '', reps: '', rir: '' }, 0, [{ kind: 'reps_range' }], false);
if (loggerHtml.match(/Reps<\/span><input type="number"/)) throw new Error('reps_range logger should not use type=number on reps');
if (!loggerHtml.includes('oninput=')) throw new Error('logger inputs should use oninput');

if (!html.includes('function parseEffortValue')) throw new Error('parseEffortValue missing');
if (!html.includes('function setSupersetField')) throw new Error('setSupersetField missing');
if (!html.includes('if(n===0)return 0')) throw new Error('restSeconds(0) fix missing');
if (!html.includes('onclick="restMenu()"')) throw new Error('rest menu button missing');

const coachHtml = readFileSync(join(dir, 'coach.html'), 'utf8');
if (!coachHtml.includes('coachExPersistTimer')) throw new Error('coach persist debounce missing');

console.log('log-columns.smoke: ok');
