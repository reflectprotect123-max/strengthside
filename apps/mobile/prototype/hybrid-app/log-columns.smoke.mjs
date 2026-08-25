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
if (!html.includes("LOCAL_BUILD='the-hybrid-athlete-engine-v73'")) throw new Error('expected cache v72');
if (!html.includes('Rest seconds')) throw new Error('builder missing Rest seconds above twin');
if (!html.includes('id=exPick')) throw new Error('builder missing exercise selection');

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
if (!twin.includes('logcol-kind')) throw new Error('column dropdowns missing');
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

console.log('log-columns.smoke: ok');
