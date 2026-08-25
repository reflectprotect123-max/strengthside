/**
 * Smoke: log column kinds + normalize/sync helpers.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(dir, 'log-columns.js'), 'utf8');
const html = readFileSync(join(dir, 'index.html'), 'utf8');

if (!html.includes('log-columns.js')) throw new Error('index.html missing log-columns.js');
if (!html.includes('LogColumns.builderColumnsHtml')) throw new Error('builder columns UI not wired');
if (!html.includes('LogColumns.loggerCellsHtml')) throw new Error('logger columns UI not wired');
if (!html.includes("LOCAL_BUILD='the-hybrid-athlete-engine-v71'")) throw new Error('expected cache v71');

const sandbox = { window: {}, console };
sandbox.window = sandbox;
vm.runInNewContext(src, sandbox);
const LC = sandbox.LogColumns;
if (!LC) throw new Error('LogColumns missing');

const keys = LC.KINDS.map((k) => k.key);
for (const k of [
  'reps',
  'reps_range',
  'weight_kg',
  'weight_pct_wm',
  'weight_lwp',
  'time_sec',
  'distance_m',
]) {
  if (!keys.includes(k)) throw new Error('missing kind ' + k);
}

const ex = { sets: 4, reps: '10, 10, 10, MAX' };
const cols = LC.normalizeColumns(ex);
if (cols.length !== 2) throw new Error('default columns expected 2, got ' + cols.length);
if (cols[0].kind !== 'weight_kg') throw new Error('default load col');
if (cols[1].kind !== 'reps') throw new Error('default reps col');

const withPct = LC.normalizeColumns({
  reps: '8',
  loadExpr: { exprKind: 'pct_of_max', exprArg: 0.7 },
});
if (withPct[0].kind !== 'weight_pct_wm' || withPct[0].value !== '70') {
  throw new Error('pct normalize failed ' + JSON.stringify(withPct[0]));
}

const out = { sets: 3, reps: 'x' };
LC.syncLegacyFromColumns(out, [
  { id: 'a', kind: 'weight_pct_wm', value: '65' },
  { id: 'b', kind: 'reps', value: '8, 8, 8' },
]);
if (!out.loadExpr || out.loadExpr.exprKind !== 'pct_of_max') throw new Error('sync loadExpr');
if (out.reps !== '8, 8, 8') throw new Error('sync reps');

console.log('log-columns.smoke: ok');
