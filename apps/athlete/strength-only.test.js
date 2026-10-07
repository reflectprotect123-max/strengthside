import { test } from 'node:test';
import assert from 'node:assert/strict';
import './strength-only.js';
import './library.js';
import './session.js';
import './plan-sync.js';

test('mixed legacy device state keeps lifts and removes conditioning and its assignments', () => {
  const state = { engineSchedule: {}, library: { templates: [
    { id: 'strength', blocks: [{ kind: 'lift', title: 'Front Squat' }, { kind: 'engine', title: 'Bike' }] },
    { id: 'engine', kind: 'engine', blocks: [] },
  ], assignments: { '2026-10-08': 'strength', '2026-10-09': 'engine' } },
  published: { '2026-10-08': [{ type: 'strength' }, { type: 'engine' }] },
  sessions: { '2026-10-09': { kind: 'conditioning' } } };
  StrengthOnly.cleanState(state);
  assert.deepEqual(state.library.templates[0].blocks, [{ kind: 'lift', title: 'Front Squat' }]);
  assert.equal(state.library.templates.length, 1);
  assert.deepEqual(state.library.assignments, { '2026-10-08': 'strength' });
  assert.deepEqual(state.published['2026-10-08'], [{ type: 'strength' }]);
  assert.deepEqual(state.sessions, {});
  assert.ok(!('engineSchedule' in state));
});

test('removing an earlier conditioning page preserves the current lift and its logged sets', () => {
  const lift = { id: 'B', kind: 'lift' };
  const workout = { pages: [{ id: 'A', kind: 'engine' }, lift, { id: 'done', kind: 'doneHub' }], blockIndex: 1,
    logs: { A: { interval: 2 }, B: { kg: 70, reps: 8 } } };
  StrengthOnly.cleanWorkout(workout);
  assert.equal(workout.pages[workout.blockIndex], lift);
  assert.deepEqual(workout.logs, { B: { kg: 70, reps: 8 } });
});

test('cloud import rejects conditioning while preserving strength and warmups', () => {
  const result = PlanSync.applyPlan({}, { templates: [{ id: 's', blocks: [{ kind: 'circuit', title: 'Warm-Up' }, { kind: 'lift', title: 'Dips' }] }, { id: 'e', kind: 'engine' }],
    sessions: [{ kind: 'assignment', date: '2026-10-08', templateId: 's' }, { kind: 'assignment', date: '2026-10-09', templateId: 'e' }] });
  assert.equal(result.library.templates.length, 1);
  assert.equal(result.library.templates[0].blocks.length, 2);
  assert.ok(!result.library.assignments['2026-10-09']);
});

test('library and logger cannot compile legacy conditioning blocks as lifts', () => {
  const compiled = HybridLibrary.compile({ blocks: [{ kind: 'circuit', title: 'Warm-Up' }, { kind: 'engine', title: 'Bike' }, { kind: 'lift', title: 'Dips' }] });
  assert.ok(!compiled.blocks.some((b) => b.title === 'Bike'));
  assert.equal(compiled.blocks[0].label, 'WARM-UP');
  const pages = HybridSession.pagesFromPlan({ blocks: [{ kind: 'engine', title: 'Bike' }, { kind: 'lift', title: 'Dips' }] });
  assert.ok(!pages.some((p) => p.title === 'Bike'));
  assert.ok(pages.some((p) => p.title === 'Dips'));
});
