import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
for (const f of ['training-core', 'strength-targets', 'session', 'session-slots']) require(join(here, f + '.js'));
const HS = globalThis.HybridSession, Slots = globalThis.HybridSlots;
const lift = (title) => ({ kind: 'lift', letter: 'A', title, prescription: '3 x 5', columns: ['reps', 'weight_kg'], setCount: 3, repTarget: '5' });
const planA = { title: 'Lower', slotKey: '2026-10-30#a1', coachAssignedIds: ['a1'], blocks: [lift('Deadlift')] };
const planB = { title: 'Upper', slotKey: '2026-10-30#b2', coachAssignedIds: ['b2'], blocks: [lift('Bench')] };
const logOne = (s) => HS.logSet(s, 0, { kg: 100, reps: 5, effort: 'average' }, HS.currentPage(s)?.id || s.pages[0].id);

test('two sessions on one day are stored apart and the finished one stays finished', () => {
  const sessions = {};
  let a = HS.startSession({ date: '2026-10-30', plan: planA, letter: 'A' });
  a = HS.finishToSummary(logOne(a));
  Slots.store(sessions, a);
  const b = HS.startSession({ date: '2026-10-30', plan: planB, existing: a });
  assert.notEqual(b.id, a.id, 'a finished session is never reopened as the next one');
  assert.equal(b.slotKey, '2026-10-30#b2');
  Slots.store(sessions, logOne(b));
  assert.deepEqual(Object.keys(sessions).sort(), ['2026-10-30#a1', '2026-10-30#b2']);
  assert.equal(sessions['2026-10-30#a1'].phase, 'summary');
  assert.equal(sessions['2026-10-30#a1'].title, 'Lower');
});
test('an in-progress session of a different slot is not reused', () => {
  const a = logOne(HS.startSession({ date: '2026-10-30', plan: planA, letter: 'A' }));
  const b = HS.startSession({ date: '2026-10-30', plan: planB, existing: a });
  assert.notEqual(b.id, a.id);
  const again = HS.startSession({ date: '2026-10-30', plan: planA, existing: a });
  assert.equal(again.id, a.id, 'same slot resumes');
});
test('status drives the Training button: Start, Resume, View summary', () => {
  const sessions = {};
  assert.equal(Slots.status(sessions, planA.slotKey), 'start');
  const a = logOne(HS.startSession({ date: '2026-10-30', plan: planA, letter: 'A' }));
  Slots.store(sessions, a);
  assert.equal(Slots.status(sessions, planA.slotKey), 'resume');
  Slots.store(sessions, HS.finishToSummary(a));
  assert.equal(Slots.status(sessions, planA.slotKey), 'done');
  assert.deepEqual([...['start', 'resume', 'done'].map(Slots.buttonLabel)], ['Start Session', 'Resume Session', 'View summary']);
});
test('legacy date-keyed sessions still resolve for a single-session day', () => {
  const legacy = { id: 'old', date: '2026-10-01', phase: 'block', logs: {}, pages: [] };
  assert.equal(Slots.find({ '2026-10-01': legacy }, '2026-10-01'), legacy);
  assert.equal(Slots.keyOf(legacy), '2026-10-01');
});
test('history lists finished sessions and past unfinished sessions with logged sets, newest first', () => {
  const done = HS.finishToSummary(logOne(HS.startSession({ date: '2026-10-29', plan: { ...planA, slotKey: '2026-10-29#a1' }, letter: 'A' })));
  const open = logOne(HS.startSession({ date: '2026-10-30', plan: planB, letter: 'A' }));
  const empty = HS.startSession({ date: '2026-10-28', plan: { ...planA, slotKey: '2026-10-28' }, letter: 'A' });
  const sessions = {}; [done, open, empty].forEach((s) => Slots.store(sessions, s));
  const h = Slots.history(sessions);
  assert.deepEqual(h.map((x) => [x.key, x.status]), [['2026-10-30#b2', 'resume'], ['2026-10-29#a1', 'done']]);
});
test('discard removes the slot and the active session when it is the one discarded', () => {
  const a = logOne(HS.startSession({ date: '2026-10-30', plan: planA, letter: 'A' }));
  const state = { sessions: {}, session: a, loggerOpen: true };
  Slots.store(state.sessions, a);
  const removed = Slots.discard(state, planA.slotKey);
  assert.equal(removed.id, a.id);
  assert.equal(state.sessions[planA.slotKey], undefined);
  assert.equal(state.session, null); assert.equal(state.loggerOpen, false);
});
test('Progress strength-history rows open the session detail in Training history',()=>{
 const src=readFileSync(new URL('./app.js',import.meta.url),'utf8');
 assert.match(src,/class="progress-row[^"]*" onclick="openHistorySession\(/);
 assert.match(src,/function openHistorySession\(key\) \{\s*S\.tab = 'history';/);
});
