import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
require(join(here, 'training-core.js'));
require(join(here, 'strength-targets.js'));
require(join(here, 'session.js'));
const HybridSession = globalThis.HybridSession;

const demoPlan = {
  blocks: [
    { kind: 'warmup', letter: 'A', title: 'Deadlift Warm-Up' },
    { kind: 'section', label: 'STRENGTH/POWER' },
    { kind: 'lift', letter: 'B', title: 'Snatch Grip Rack Deadlift', prescription: '6 x 3' },
    { kind: 'lift', letter: 'C', title: 'Barbell Lateral Squat', prescription: '3 x 8' },
    { kind: 'lift', letter: 'D', title: 'Goblet Box Squat', prescription: '3 x 12' },
    { kind: 'lift', letter: 'E', title: 'Reverse Hypers', prescription: '4 x 25' },
    { kind: 'lift', letter: 'F1', title: 'Double Leg Banded Leg Curls', prescription: '4 x 25' },
    { kind: 'lift', letter: 'F2', title: 'Garhammer Raises', prescription: '4 x MAX' },
    { kind: 'recovery', letter: 'G', title: 'Recovery Breathing' },
  ],
};

test('pagesFromPlan walks A–G plus done hub and skips sections', () => {
  const pages = HybridSession.pagesFromPlan(demoPlan);
  assert.equal(pages.length, 8);
  assert.deepEqual(pages.map((p) => p.id), ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'done']);
  assert.equal(pages[0].logMode, 'complete');
  assert.equal(pages[1].logMode, 'kg');
  assert.equal(pages[1].setCount, 6);
  assert.equal(pages[1].targetReps, 3);
  assert.equal(pages[5].logMode, 'superset');
  assert.deepEqual(pages[5].members.map((m) => m.id), ['F1', 'F2']);
  assert.equal(pages[5].members[0].logMode, 'reps');
  assert.equal(pages[5].members[1].logMode, 'max');
  assert.equal(pages[6].logMode, 'complete');
  assert.equal(pages[7].logMode, 'doneHub');
});

test('startSession opens on quote then coach then first block', () => {
  let s = HybridSession.startSession({ date: '2026-09-07', plan: demoPlan });
  assert.equal(s.phase, 'quote');
  s = HybridSession.ackQuote(s);
  assert.equal(s.phase, 'coach');
  s = HybridSession.ackCoach(s);
  assert.equal(s.phase, 'block');
  assert.equal(s.blockIndex, 0);
  assert.equal(s.pages[s.blockIndex].id, 'A');
});

test('goToLetter tap-in skips quote and lands on that page', () => {
  const s = HybridSession.startSession({ date: '2026-09-07', plan: demoPlan, letter: 'B' });
  assert.equal(s.phase, 'block');
  assert.equal(s.pages[s.blockIndex].id, 'B');
});

test('next and prev walk eight pages including done hub', () => {
  let s = HybridSession.startSession({ date: '2026-09-07', plan: demoPlan, letter: 'A' });
  for (let i = 0; i < 7; i++) s = HybridSession.nextPage(s);
  assert.equal(s.pages[s.blockIndex].id, 'done');
  s = HybridSession.nextPage(s);
  assert.equal(s.pages[s.blockIndex].id, 'done');
  s = HybridSession.prevPage(s);
  assert.equal(s.pages[s.blockIndex].id, 'G');
});

test('next from F pair lands on G not a second F page', () => {
  let s = HybridSession.startSession({ date: '2026-09-07', plan: demoPlan, letter: 'F1' });
  assert.equal(s.pages[s.blockIndex].id, 'F');
  s = HybridSession.nextPage(s);
  assert.equal(s.pages[s.blockIndex].id, 'G');
});

test('completeCurrent marks warmup done', () => {
  let s = HybridSession.startSession({ date: '2026-09-07', plan: demoPlan, letter: 'A' });
  s = HybridSession.completeCurrent(s);
  assert.equal(s.logs.A.completed, true);
});

test('logSet kg updates totals and check', () => {
  let s = HybridSession.startSession({ date: '2026-09-07', plan: demoPlan, letter: 'B' });
  s = HybridSession.logSet(s, 0, { kg: 60, effort: 'medium' });
  assert.equal(s.logs.B.sets[0].logged, true);
  assert.equal(s.logs.B.sets[0].kg, 60);
  assert.equal(s.logs.B.sets[0].reps, 3);
  const t = HybridSession.totals(s);
  assert.equal(t.reps, 3);
  assert.equal(t.kg, 60);
});

test('logSet preserves the requested rest as set evidence', () => {
  let s = HybridSession.startSession({ date: '2026-09-07', plan: demoPlan, letter: 'B' });
  s = HybridSession.logSet(s, 0, { kg: 60, effort: 'medium', context: { requestedRestSec: 120, elapsedRestSec: null } });
  assert.deepEqual(s.logs.B.sets[0].context, { requestedRestSec: 120, elapsedRestSec: null });
});

test('logSet MAX writes reps on the F2 member of the pair page', () => {
  let s = HybridSession.startSession({ date: '2026-09-07', plan: demoPlan, letter: 'F2' });
  assert.equal(s.pages[s.blockIndex].id, 'F');
  s = HybridSession.logSet(s, 0, { reps: 12, effort: 'medium' }, 'F2');
  assert.equal(s.logs.F2.sets[0].reps, 12);
  assert.equal(s.logs.F2.sets[0].logged, true);
  assert.equal(s.logs.F1.sets[0].logged, false);
  assert.equal(HybridSession.totals(s).reps, 12);
});

test('autofill copies kg down empty rows', () => {
  let s = HybridSession.startSession({ date: '2026-09-07', plan: demoPlan, letter: 'B' });
  s = HybridSession.logSet(s, 0, { kg: 60, effort: 'medium' });
  s = HybridSession.autofillFrom(s, 0);
  assert.equal(s.logs.B.sets[5].kg, 60);
  assert.equal(s.logs.B.sets[5].logged, false);
});

test('B1 B2 B3 is one three-lift superset page', () => {
  const plan = {
    blocks: [
      { kind: 'lift', letter: 'B1', title: 'Bench Press', prescription: '3 x 8' },
      { kind: 'lift', letter: 'B2', title: 'Lat Pull Downs', prescription: '3 x 8' },
      { kind: 'lift', letter: 'B3', title: 'Back Squat', prescription: '3 x 8' },
    ],
  };
  const pages = HybridSession.pagesFromPlan(plan);
  assert.equal(pages.length, 2);
  assert.equal(pages[0].id, 'B');
  assert.equal(pages[0].logMode, 'superset');
  assert.deepEqual(pages[0].members.map((m) => m.id), ['B1', 'B2', 'B3']);
});

test('D1 D2 pairing is one stacked page', () => {
  const plan = {
    blocks: [
      { kind: 'lift', letter: 'D1', title: 'One', prescription: '3 x 8' },
      { kind: 'lift', letter: 'D2', title: 'Two', prescription: '3 x 8' },
    ],
  };
  const pages = HybridSession.pagesFromPlan(plan);
  assert.equal(pages.length, 2);
  assert.equal(pages[0].id, 'D');
  assert.equal(pages[0].logMode, 'superset');
  assert.deepEqual(pages[0].members.map((m) => m.id), ['D1', 'D2']);
  assert.equal(pages[1].id, 'done');
});

test('logSet without effort does not mark logged', () => {
  let s = HybridSession.startSession({ date: '2026-09-07', plan: demoPlan, letter: 'B' });
  s = HybridSession.logSet(s, 0, { kg: 60, effort: null });
  assert.equal(s.logs.B.sets[0].logged, false);
});

test('logSet with effort marks logged', () => {
  let s = HybridSession.startSession({ date: '2026-09-07', plan: demoPlan, letter: 'B' });
  s = HybridSession.logSet(s, 0, { kg: 60, effort: 'medium' });
  assert.equal(s.logs.B.sets[0].logged, true);
  assert.equal(s.logs.B.sets[0].effort, 'medium');
});

test('doneTraining skips feel phase', () => {
  let s = HybridSession.startSession({ date: '2026-09-07', plan: demoPlan, letter: 'done' });
  s = HybridSession.openFeel(s);
  assert.equal(s.phase, 'feel');
  s = HybridSession.finishToSummary(s);
  assert.equal(s.phase, 'summary');
});

test('feel then finish lands on summary', () => {
  let s = HybridSession.startSession({ date: '2026-09-07', plan: demoPlan, letter: 'done' });
  s = HybridSession.openFeel(s);
  assert.equal(s.phase, 'feel');
  s = HybridSession.finishToSummary(s);
  assert.equal(s.phase, 'summary');
});

test('logged working set does not derive lift memory or a next-session load', () => {
  let s = HybridSession.startSession({ date: '2026-09-07', plan: demoPlan, letter: 'B' });
  s = HybridSession.logSet(s, 0, { kg: 100, reps: 3, effort: 'medium' });
  assert.equal(s.liftMemory['snatch grip rack deadlift'], undefined);
  const s2 = HybridSession.startSession({
    date: '2026-09-08',
    plan: demoPlan,
    letter: 'B',
    liftMemory: s.liftMemory,
  });
  assert.equal(s2.logs.B.sets[0].kg, null);
  assert.equal(s2.workingMax.B, undefined);
});

test('legacy lift memory does not seed first kg or working max', () => {
  const liftMemory = { 'snatch grip rack deadlift': { lastKg: 100, e1rmKg: 116.7 } };
  let s = HybridSession.startSession({ date: '2026-09-08', plan: demoPlan, letter: 'B', liftMemory });
  assert.equal(s.logs.B.sets[0].kg, null);
  assert.equal(s.workingMax.B, undefined);
  s.logs.B.sets[0].kg = 90;
  s = HybridSession.seedOpeningLoads(s, liftMemory);
  assert.equal(s.logs.B.sets[0].kg, 90);
  assert.equal(s.workingMax.B, undefined);
});

test('manual working max is stored without changing a set or lift memory', () => {
  const s = HybridSession.startSession({ date: '2026-09-08', plan: demoPlan, letter: 'B' });
  const next = HybridSession.setWorkingMax(s, 'B', 115);
  assert.equal(next.workingMax.B, 115);
  assert.equal(next.logs.B.sets[0].kg, null);
  assert.deepEqual(next.liftMemory, {});
});

test('warmup complete does not write liftMemory', () => {
  let s = HybridSession.startSession({ date: '2026-09-07', plan: demoPlan, letter: 'A' });
  s = HybridSession.completeCurrent(s);
  assert.equal(Object.keys(s.liftMemory || {}).length, 0);
});

test('logging a set records athlete input without changing a future target', () => {
  let s = HybridSession.startSession({ date: '2026-09-07', plan: demoPlan, letter: 'B' });
  const originalSecondKg = s.logs.B.sets[1].kg;
  s = HybridSession.logSet(s, 0, { kg: 100, reps: 6, effort: 'easy' });
  assert.equal(s.logs.B.sets[0].logged, true);
  assert.equal(s.logs.B.sets[0].kg, 100);
  assert.equal(s.logs.B.sets[0].reps, 6);
  assert.equal(s.logs.B.sets[0].effort, 'easy');
  assert.equal('nextKg' in s.logs.B, false);
  assert.equal('ruleVersion' in s.logs.B, false);
  assert.equal('strengthClose' in s, false);
  assert.equal(s.logs.B.sets[1].kg, originalSecondKg);
});

test('arbitrary authored targets are snapshotted into distinct logger rows',()=>{
 const authored=[10,8,6].map((n,i)=>({id:`wave:set:${i}`,purpose:'working',reps:{min:n,max:n},loadRule:{kind:'adaptive'},toFailure:false}));
 authored.push({id:'wave:set:3',purpose:'amrap',reps:null,loadRule:{kind:'first_working_set'},toFailure:false});
 const plan={title:'Wave',blocks:[{kind:'lift',letter:'A',title:'Squat',columns:['reps','weight_kg'],setTargets:authored,setCount:4,repMin:10,repMax:10}]};
 const session=HybridSession.startSession({date:'2026-10-11',plan,letter:'A'});
 assert.deepEqual(session.logs.A.sets.map(r=>r.reps),[10,8,6,null]);
 assert.deepEqual(session.logs.A.sets.map(r=>r.targetId),authored.map(t=>t.id));
 plan.blocks[0].setTargets[0].reps.min=99;
 assert.equal(session.pages[0].setTargets[0].reps.min,10);
});

test('metric rows save drafts separately and complete only after required values and actual effort',()=>{
 const p={blocks:[{kind:'lift',letter:'A',title:'Plank',setCount:1,columns:['seconds'],prescription:'1 x time'}]};
 let s=HybridSession.ackCoach(HybridSession.startSession({date:'2026-10-11',plan:p}));
 s=HybridSession.logSet(s,0,{cells:{seconds:30},effort:'hard'},'A',{commit:false});assert.equal(s.logs.A.sets[0].logged,false);
 s=HybridSession.logSet(s,0,{},'A');assert.equal(s.logs.A.sets[0].logged,true);
 s=HybridSession.logSet(s,0,{cells:{seconds:''}},'A',{commit:false});assert.equal(s.logs.A.sets[0].logged,false);
 s=HybridSession.toggleLogged(s,0,'A');assert.equal(s.logs.A.sets[0].logged,false);
});

test('reopening an active workout preserves captured targets and calibration when its template changes',()=>{
 let s=HybridSession.startSession({date:'2026-10-11',plan:{blocks:[{kind:'lift',letter:'A',title:'Squat',prescription:'3 x 6-8'}]}});
 s.pages[0].workingKg=40;s.pages[0].startConfidence='history';s.brainSeeded=true;
 const reopened=HybridSession.startSession({date:s.date,existing:s,plan:{blocks:[{kind:'lift',letter:'A',title:'Squat',prescription:'3 x 10-12'}]}});
 assert.equal(reopened.pages[0].targetReps,6);assert.equal(reopened.pages[0].workingKg,40);assert.equal(reopened.brainSeeded,true);
});
