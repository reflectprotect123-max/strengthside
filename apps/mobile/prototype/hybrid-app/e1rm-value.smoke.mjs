/**
 * Smoke: finish e1RM via engine (S5) — e1rmValue uses Brzycki when bundle present.
 * Run: bash apps/mobile/prototype/hybrid-app/build-strength.sh && node apps/mobile/prototype/hybrid-app/e1rm-value.smoke.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const bundle = readFileSync(join(dir, 'strength-bundle.js'), 'utf8');

const match = html.match(/function e1rmValue\([\s\S]*?(?=function [a-zA-Z])/);
if (!match) throw new Error('e1rmValue not found in index.html');

function localEpley(w, effective) {
  return w * (1 + effective / 30);
}

function brzycki(w, reps) {
  return w * (36 / (37 - reps));
}

// With bundle: engine Brzycki on effective reps (RIR adjustment preserved).
const withBundle = { window: {}, console };
vm.createContext(withBundle);
vm.runInContext(`${bundle}; window.HybridStrength = HybridStrength;`, withBundle);
vm.runInContext(`const num = (v) => Number(v) || 0;\n${match[0]}`, withBundle);

const engineVal = withBundle.e1rmValue(100, 5);
const expectedBrzycki = brzycki(100, 5);
if (Math.abs(engineVal - expectedBrzycki) > 0.001) {
  throw new Error(`With bundle: expected Brzycki ${expectedBrzycki}, got ${engineVal}`);
}
const oldEpley = localEpley(100, 5);
if (Math.abs(engineVal - oldEpley) < 0.001) {
  throw new Error('With bundle: e1rmValue should differ from old inline Epley');
}

// RIR inflates effective reps before engine call.
const withRir = withBundle.e1rmValue(100, 5, 2);
const expectedRir = brzycki(100, 7);
if (Math.abs(withRir - expectedRir) > 0.001) {
  throw new Error(`RIR path: expected ${expectedRir}, got ${withRir}`);
}

// Without bundle: local Epley fallback.
const noBundle = { window: {}, console };
vm.createContext(noBundle);
vm.runInContext(`const num = (v) => Number(v) || 0;\n${match[0]}`, noBundle);

const fallbackVal = noBundle.e1rmValue(100, 5);
if (Math.abs(fallbackVal - oldEpley) > 0.001) {
  throw new Error(`Fallback: expected Epley ${oldEpley}, got ${fallbackVal}`);
}

console.log('e1rm-value.smoke: ok', {
  engine: engineVal,
  oldEpley,
  fallback: fallbackVal,
});
