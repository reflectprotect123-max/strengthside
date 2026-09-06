#!/usr/bin/env node
/**
 * Hybrid Strength cut Task 4: strength builder + logger paths must be gone.
 * Run: node apps/mobile/prototype/hybrid-app/cut-strength-builder-logger.smoke.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const failures = [];
function must(cond, msg) {
  if (!cond) failures.push(msg);
}

const banned = [
  'function athleteStrengthBuilder(',
  'function usesAthleteStrengthBuilder(',
  'function ensureAthleteStrengthDraft(',
  'function strengthTask(',
  'function completeStrength(',
  'function applyOpenLiftToEx(',
  'function applyOpenLifts(',
  'function fillNextLiftFromLog(',
  'function persistCloseForEx(',
  'function addLiftToDraft(',
  'function saveStrengthWorkout(',
  'function saveStrengthWorkoutAsCopy(',
  'HybridAdaptive.openLift',
  'HybridAdaptive.decideNextLift',
  'HybridAdaptive.closeLift',
];

for (const sym of banned) {
  must(!html.includes(sym), `${sym} must be absent`);
}

const builderIdx = html.indexOf('function builder()');
must(builderIdx >= 0, 'builder() exists');
const builderEnd = html.indexOf('\nfunction ', builderIdx + 10);
const builderFn = html.slice(builderIdx, builderEnd);
must(!builderFn.includes('usesAthleteStrengthBuilder'), 'builder() must not branch to strength');
must(!builderFn.includes('athleteStrengthBuilder'), 'builder() must not call athleteStrengthBuilder');

const trainIdx = html.indexOf('function train()');
must(trainIdx >= 0, 'train() exists');
const trainEnd = html.indexOf('\nfunction ', trainIdx + 10);
const trainFn = html.slice(trainIdx, trainEnd);
must(!trainFn.includes("t.kind==='strength'"), 'train() must not branch to strength');
must(!trainFn.includes('strengthTask('), 'train() must not call strengthTask');

const enterIdx = html.indexOf('function enterSessionScreen(');
must(enterIdx >= 0, 'enterSessionScreen exists');
const enterEnd = html.indexOf('\nfunction ', enterIdx + 10);
const enterFn = html.slice(enterIdx, enterEnd);
must(!enterFn.includes('sessionHasStrengthWork'), 'enterSessionScreen must not route strength');

if (failures.length) {
  console.error('cut-strength-builder-logger.smoke FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}

must(!html.includes("go('home')}if(sessionLooksLikeConditioning"), 'enterSessionScreen must not orphan train() after go home');
console.log('cut-strength-builder-logger.smoke OK');
