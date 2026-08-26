/**
 * Smoke: %WM is opt-in from builder columns; logger defaults to autopilot after 2 sessions.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const adapter = readFileSync(join(dir, 'strength-adapter.js'), 'utf8');

if (!html.includes("LOCAL_BUILD='the-hybrid-athlete-engine-v84'")) {
  throw new Error('expected cache v84');
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

if (!adapter.includes('autopilotReadyForExercise')) throw new Error('autopilot helper missing');
if (!adapter.includes('usable.length >= 2')) throw new Error('calibration threshold should be 2 sessions');
if (!adapter.includes("'/2 sessions'")) throw new Error('calibration label should reference 2 sessions');
if (!adapter.includes('hint && hint.loadKg && autopilotReadyForExercise(state, exerciseId, 2)')) {
  throw new Error('hint gating for 2-session autopilot missing');
}

console.log('autopilot-policy.smoke: ok');
