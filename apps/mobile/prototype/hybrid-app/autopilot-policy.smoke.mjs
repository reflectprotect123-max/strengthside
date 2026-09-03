/**
 * Smoke: V3 autopilot — anchors apply immediately; %WM opt-in from builder columns.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const adapter = readFileSync(join(dir, 'strength-adapter.js'), 'utf8');

if (!html.includes("LOCAL_BUILD='the-hybrid-athlete-blank-v165'")) {
  throw new Error('expected cache v163');
}
if (html.includes('repairFullBodyADefaultPctWm')) {
  throw new Error('legacy Full Body A %WM repair should be removed');
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
const fullBodyA = (seed.templates || []).find((x) => x && x.name === 'Full Body A');
if (!fullBodyA) throw new Error('Full Body A missing from seed');
const bench = (fullBodyA.blocks || []).flatMap((b) => b.exercises || []).find((e) => e.exerciseId === 'core-bench-press');
if (!bench) throw new Error('Bench missing from Full Body A');
if (bench.loadExpr) throw new Error('Bench should not hardcode %WM anymore');
if (bench.sets != null || bench.reps != null) throw new Error('Full Body A bench should use autopilot volume');
if (bench.autopilotVolume !== true) throw new Error('Full Body A bench should be autopilot');
const exs = (fullBodyA.blocks || []).flatMap((b) => b.exercises || []);
const dip = exs.find((e) => e.exerciseId === 'program-strict-bar-dip');
const curl = exs.find((e) => e.exerciseId === 'program-barbell-curl');
if (!dip || !dip.supersetWithNext) throw new Error('Full Body A dip should link to nordic');
if (!curl || !curl.supersetWithNext) throw new Error('Full Body A curl should link to pushdown');
if ((fullBodyA.blocks || []).length !== 1) throw new Error('Full Body A should be one strength block');

if (!adapter.includes('saveSessionAnchors')) throw new Error('V3 saveSessionAnchors missing');
if (!adapter.includes("source: 'session_anchor'")) throw new Error('session_anchor source missing');
if (adapter.includes('hint && hint.loadKg && autopilotReadyForExercise(state, exerciseId, 2)')) {
  throw new Error('2-session hint gate should be removed in V3');
}
if (!html.includes('saveSessionAnchors')) throw new Error('index should call saveSessionAnchors on finish');

console.log('autopilot-policy.smoke: ok');
