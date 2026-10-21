import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const context = { globalThis: {} };
context.window = context.globalThis;
vm.runInNewContext(readFileSync(new URL('./onboarding-rules.js', import.meta.url), 'utf8'), context);
const rules = context.globalThis.EngineOnboardingRules;

test('maximum uses Tanaka for male and Gulati for female', () => {
  assert.equal(rules.estimatedMaximum(40, 'male'), 180);
  assert.equal(rules.estimatedMaximum(40, 'female'), 171);
  assert.equal(rules.estimatedMaximum(17, 'male'), null);
  assert.equal(rules.estimatedMaximum(40, null), null);
  assert.equal(rules.maxEquation('female').version, 'gulati-2010');
  assert.equal(rules.maxEquation('male').version, 'tanaka-2001');
});

test('fitness moves the full-recovery zone fractions', () => {
  const low = rules.zoneFractions('low');
  const moderate = rules.zoneFractions('moderate');
  const high = rules.zoneFractions('high');
  assert.ok(low.green < moderate.green && moderate.green < high.green);
  assert.equal(moderate.blue, 0.5);
  assert.equal(moderate.green, 0.7);
  assert.equal(moderate.red, 0.85);
  assert.equal(rules.zoneFractions('beginner'), null);
});

test('the first week is larger when the goal is to improve, and a high resting HR scales it down', () => {
  const monday = rules.monday('2026-10-21');
  assert.equal(monday, '2026-10-19');
  const maintain = rules.weeklyTarget({ fitness: 'moderate', goal: 'maintain', resting: 55, weekStart: monday });
  const improve = rules.weeklyTarget({ fitness: 'moderate', goal: 'improve', resting: 55, weekStart: monday });
  const tired = rules.weeklyTarget({ fitness: 'moderate', goal: 'improve', resting: 75, weekStart: monday });
  assert.ok(improve.zones.Blue[1] > maintain.zones.Blue[1]);
  assert.deepEqual(JSON.parse(JSON.stringify(tired.zones.Blue)), [108, 162]);
  assert.equal(improve.model_version, 'weekly-targets-v1');
  const kept = rules.putWeekTarget([{ weekStart: monday, source: 'coach', zones: {} }], improve);
  assert.equal(kept.length, 1);
  assert.equal(kept[0].source, 'coach');
});

test('a maximum suggestion needs two samples above the estimate and ignores a strength session', () => {
  const samples = [{ bpm: 190 }, { bpm: 191 }, { bpm: 190 }, { bpm: 250 }];
  assert.deepEqual(JSON.parse(JSON.stringify(rules.peakCandidate({ type: 'Cardio', samples }, 180))), { bpm: 190, previousMax: 180, samples: 2 });
  assert.equal(rules.peakCandidate({ type: 'Cardio', samples: [{ bpm: 190 }] }, 180), null);
  assert.equal(rules.peakCandidate({ type: 'Strength', samples }, 180), null);
  assert.equal(rules.peakCandidate({ type: 'Cardio', samples }, 190), null);
});
