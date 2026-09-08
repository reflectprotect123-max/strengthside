/**
 * Smoke: blank slate — no product-engine names in athlete index; HPP days carry painted volume.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');

if (!html.includes("LOCAL_BUILD='the-hybrid-athlete-blank-v213'")) {
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
if ((seed.templates || []).some((x) => x && /^Full Body [ABC]$/.test(x.name))) {
  throw new Error('Full Body A/B/C must not remain in seed');
}
if ((seed.templates || []).some((x) => x && /^HPP (Monday|Wednesday)$/.test(x.name))) {
  throw new Error('HPP days must not remain in seed');
}

console.log('autopilot-policy.smoke: ok');
