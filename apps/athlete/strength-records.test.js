import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
require(join(here, 'training-core.js'));
require(join(here, 'strength-targets.js'));
require(join(here, 'strength-equipment.js'));
require(join(here, 'strength-rts.js'));
require(join(here, 'strength-policy.js'));
require(join(here, 'strength-load.js'));
require(join(here, 'strength-context.js'));
require(join(here, 'strength-learning.js'));
require(join(here, 'strength-replay.js'));
require(join(here, 'strength-brain-core.js'));
require(join(here, 'strength-brain.js'));
require(join(here, 'session.js'));
require(join(here, 'conditioning-score.js'));
require(join(here, 'strength-records.js'));
const Rec = globalThis.StrengthRecords;
const Brain = globalThis.StrengthBrain;

function squatPage() {
  return {
    id: 'A', letter: 'A', title: 'Back Squat', kind: 'lift',
    exerciseId: 'ex_back_squat', equipmentId: 'barbell', loadConvention: 'barbell_total',
    loadUnit: 'kg', exerciseType: 'main', minimumKg: 20, equipmentStepKg: 2.5, barWeightKg: 20,
    columns: ['reps', 'weight_kg'], setTargets: [
      {id: 'w1', purpose: 'working', reps: {min: 5, max: 5}},
      {id: 'w2', purpose: 'working', reps: {min: 5, max: 5}},
    ],
  };
}

function setRecord(page, row, extra = {}) {
  return {
    id: extra.id || 'r1', kind: 'set', deleted: false, sessionId: extra.sessionId || 'past',
    exerciseKey: Brain.key(page),
    payload: {
      completed: true, page, row, date: extra.date || '2026-10-10',
      sessionStartedAt: extra.startedAt || 1,
    },
  };
}

test('records table keeps best e1RM and best weight at each rep count', () => {
  const page = squatPage();
  const records = {
    a: setRecord(page, {logged: true, purpose: 'working', reps: 5, kg: 100, effort: 'hard'}, {id: 'a', sessionId: 's1'}),
    b: setRecord(page, {logged: true, purpose: 'working', reps: 3, kg: 120, effort: 'hard'}, {id: 'b', sessionId: 's2', startedAt: 2}),
    c: setRecord(page, {logged: true, purpose: 'working', reps: 5, kg: 110, effort: 'hard'}, {id: 'c', sessionId: 's3', startedAt: 3}),
  };
  const table = Rec.table(records);
  const squat = table.find((row) => row.title === 'Back Squat');
  assert.ok(squat);
  assert.equal(squat.repMax['5'], 110);
  assert.equal(squat.repMax['3'], 120);
  assert.ok(squat.e1rm > 110);
});

test('New PR when the finished session beats prior e1RM or a rep-max', () => {
  const page = squatPage();
  const prior = {
    a: setRecord(page, {logged: true, purpose: 'working', reps: 5, kg: 80, effort: 'hard'}, {id: 'a'}),
  };
  const session = {
    id: 'now', date: '2026-10-22', phase: 'summary', title: 'Lift A',
    pages: [page],
    logs: {A: {sets: [
      {logged: true, purpose: 'working', reps: 5, kg: 100, effort: 'hard'},
    ]}},
  };
  const prs = Rec.detect(session, prior);
  assert.ok(prs.some((p) => p.kind === 'rep_max' && p.reps === 5 && p.kg === 100));
  assert.ok(prs.some((p) => p.kind === 'e1rm'));
  assert.equal(Rec.detect(session, {
    a: setRecord(page, {logged: true, purpose: 'working', reps: 5, kg: 110, effort: 'hard'}, {id: 'a'}),
  }).length, 0);
});

test('ramps, holds, misses and Easy sets do not mint e1RM PRs', () => {
  const page = squatPage();
  const session = {
    id: 'now', date: '2026-10-22', phase: 'summary', pages: [page],
    logs: {A: {sets: [
      {logged: true, purpose: 'ramp', reps: 5, kg: 200, effort: 'easy'},
      {logged: true, purpose: 'working', reps: 5, kg: 90, effort: 'easy'},
      {logged: true, purpose: 'working', reps: 5, kg: 95, effort: 'hard', miss: true},
    ]}},
  };
  assert.equal(Rec.detect(session, {}).filter((p) => p.kind === 'e1rm').length, 0);
});

test('conditioning bests keep fastest 500 m pace and highest calories, metres and watts', () => {
  const page = {id: 'A', title: 'Row Erg', kind: 'lift', columns: ['calories', 'meters', 'watts', 'time_mmss']};
  const prior = {
    old: {
      id: 'old', kind: 'set', deleted: false, sessionId: 's1', exerciseKey: 'row',
      payload: {
        completed: true, page, date: '2026-10-01', sessionStartedAt: 1,
        row: {logged: true, cells: {calories: 10, meters: 200, watts: 150, time_mmss: 90}},
      },
    },
  };
  const session = {
    id: 'now', date: '2026-10-22', phase: 'summary', pages: [page],
    logs: {A: {sets: [{logged: true, cells: {calories: 20, meters: 500, watts: 200, time_mmss: 100}}]}},
  };
  const table = Rec.table({...prior, now: {
    id: 'now', kind: 'set', deleted: false, sessionId: 'now', exerciseKey: 'row',
    payload: {completed: true, page, date: '2026-10-22', sessionStartedAt: 2, row: session.logs.A.sets[0]},
  }});
  const row = table.find((r) => r.title === 'Row Erg');
  assert.equal(row.conditioning.calories, 20);
  assert.equal(row.conditioning.meters, 500);
  assert.equal(row.conditioning.watts, 200);
  assert.equal(row.conditioning.pace500, 100);
  const prs = Rec.detect(session, prior);
  assert.ok(prs.some((p) => p.kind === 'calories' && p.value === 20));
  assert.ok(prs.some((p) => p.kind === 'pace500'));
});
