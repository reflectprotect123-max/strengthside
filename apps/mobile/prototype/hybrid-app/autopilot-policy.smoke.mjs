/**
 * Smoke: blank slate — no product-engine names in athlete index; Full Body A uses open volume.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');

if (!html.includes("LOCAL_BUILD='the-hybrid-athlete-blank-v182'")) {
  throw new Error('expected cache v168');
}

const banned = [
  'StrengthAdapter', 'EngineAdapter', 'BigMacBridge', 'CoachSync', 'NutritionUI',
  'StrengthSync', 'CondSessionLogger', 'CoachAI', 'CoachCloud', 'StrengthOneSetLogger',
  'CondIntervalAutoreg', 'RecoveryPrescription', 'HybridEngine', 'HybridStrength',
  'NutritionSync', 'LabelScan', 'FoodCatalog',
];
for (const name of banned) {
  // allow legacy dual-read key autopilotVolume only as property name in isOpenVolumeEx
  if (name === 'Autopilot') continue;
  const re = new RegExp('\\b' + name + '\\b');
  if (re.test(html)) throw new Error('banned name still present: ' + name);
}
if (/\bAutopilot\b/.test(html)) throw new Error('Autopilot label still present');
if (html.includes("['StrengthAdapter'")) throw new Error('Proxy name list still present');

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
if (bench.loadExpr) throw new Error('Bench should not hardcode %WM');
if (bench.sets != null || bench.reps != null) throw new Error('Full Body A bench should use open volume');
if (bench.openVolume !== true) throw new Error('Full Body A bench should be openVolume');

console.log('autopilot-policy.smoke: ok');
