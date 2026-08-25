/**
 * Smoke: Full Body A Bench defaults to 70% WM; accessories stay blank;
 * superset logger wires the same load-headline helper as singles.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');

if (!html.includes("LOCAL_BUILD='the-hybrid-athlete-engine-v76'")) {
  throw new Error('expected cache v76');
}
if (!html.includes('function repairFullBodyADefaultPctWm')) {
  throw new Error('repairFullBodyADefaultPctWm missing');
}
if (!html.includes('state=repairFullBodyADefaultPctWm(state)')) {
  throw new Error('repair not wired into upgradeAlpha2');
}

const start = html.indexOf('const seed=');
let i = html.indexOf('=', start) + 1;
while (html[i] === ' ') i++;
let depth = 0, inStr = false, esc = false, quote = '';
let seed = null;
for (let j = i; j < html.length; j++) {
  const c = html[j];
  if (inStr) {
    if (esc) { esc = false; continue; }
    if (c === '\\') { esc = true; continue; }
    if (c === quote) inStr = false;
    continue;
  }
  if (c === '"' || c === "'") { inStr = true; quote = c; continue; }
  if (c === '{') depth++;
  else if (c === '}') {
    depth--;
    if (depth === 0) {
      seed = JSON.parse(html.slice(i, j + 1));
      break;
    }
  }
}
if (!seed) throw new Error('seed parse failed');
const t = (seed.templates || []).find((x) => x && x.name === 'Full Body A');
if (!t) throw new Error('Full Body A missing from seed');
const lifts = (t.blocks || []).flatMap((b) => b.exercises || []);
const bench = lifts.find((e) => e.exerciseId === 'core-bench-press');
if (!bench?.loadExpr || bench.loadExpr.exprKind !== 'pct_of_max' || Number(bench.loadExpr.exprArg) !== 0.7) {
  throw new Error('Bench seed missing 70% WM loadExpr: ' + JSON.stringify(bench?.loadExpr));
}
for (const ex of lifts) {
  if (ex.exerciseId === 'core-bench-press') continue;
  if (ex.loadExpr) throw new Error(`Accessory ${ex.name} should not have loadExpr`);
}

const superIdx = html.indexOf('function supersetTask');
const superFn = html.slice(superIdx, html.indexOf('\nfunction ', superIdx + 10));
if (!superFn.includes('strengthLoadHeadlineHtml(ex')) {
  throw new Error('supersetTask missing strengthLoadHeadlineHtml');
}
if (!superFn.includes('RIR on your last set')) {
  throw new Error('supersetTask missing last-set RIR guardrail');
}
if (!html.includes("if(t.kind==='superset'){let item=supersetCurrent(t)")) {
  throw new Error('train() missing Planned line for supersets');
}

console.log('fullbody-a-pct-wm.smoke: ok');
