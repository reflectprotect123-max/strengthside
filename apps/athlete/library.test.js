import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
require(join(dirname(fileURLToPath(import.meta.url)), 'training-core.js'));
require(join(dirname(fileURLToPath(import.meta.url)), 'strength-targets.js'));
require(join(dirname(fileURLToPath(import.meta.url)), 'strength-equipment.js'));
require(join(dirname(fileURLToPath(import.meta.url)), 'strength-rts.js'));
require(join(dirname(fileURLToPath(import.meta.url)), 'strength-policy.js'));
require(join(dirname(fileURLToPath(import.meta.url)), 'strength-brain-core.js'));
require(join(dirname(fileURLToPath(import.meta.url)), 'library.js'));
const Lib = globalThis.HybridLibrary;

test('track lock includes reps kg meters and for completion', () => {
  const keys = Lib.TRACK.map((t) => t.key);
  assert.ok(keys.includes('reps'));
  assert.ok(keys.includes('weight_kg'));
  assert.ok(keys.includes('meters'));
  assert.ok(keys.includes('for_completion'));
  assert.equal(keys.filter((k) => k === 'inches').length, 1);
  assert.ok(!keys.includes('none'));
  assert.ok(!keys.includes('rpe'));
});

test('create session template starts empty then letters A warmup B1 B2 B3 C', () => {
  let st = Lib.emptyState();
  st = Lib.createTemplate(st, { title: 'Upper' });
  const tid = st.templates[0].id;
  st = Lib.addCircuit(st, tid, { title: 'Bench Press Warm-Up', instructions: 'Foam roll\nPec stretch' });
  st = Lib.addExercise(st, tid, { title: 'Bench Press', setCount: 3, columns: ['reps', 'weight_kg'] });
  st = Lib.addExercise(st, tid, { title: 'Lat Pull Downs', setCount: 3, columns: ['reps', 'weight_kg'] });
  st = Lib.linkSuperset(st, tid, st.templates[0].blocks[1].id, st.templates[0].blocks[2].id);
  st = Lib.addExercise(st, tid, { title: 'Back Squat', setCount: 3, columns: ['reps', 'weight_kg'] });
  st = Lib.linkSuperset(st, tid, st.templates[0].blocks[2].id, st.templates[0].blocks[3].id);
  st = Lib.addExercise(st, tid, { title: 'Bendh', setCount: 3, columns: ['reps', 'meters'] });
  const letters = Lib.lettered(st.templates[0]).map((b) => b.letter);
  assert.deepEqual(letters, ['A', 'B1', 'B2', 'B3', 'C']);
});

test('compile plan maps complete + lifts + section labels for training/logger', () => {
  let st = Lib.emptyState();
  st = Lib.createTemplate(st, { title: 'Session Template', instructions: 'Test' });
  const tid = st.templates[0].id;
  st = Lib.addCircuit(st, tid, { title: 'Warm-Up', instructions: '1. Foam roll' });
  st = Lib.addExercise(st, tid, { title: 'Bench Press', setCount: 5, columns: ['reps', 'weight_kg'], notes: ['increase weight'] });
  const plan = Lib.compile(st.templates[0]);
  assert.equal(plan.title, 'Session Template');
  assert.equal(plan.instructions, 'Test');
  const kinds = plan.blocks.map((b) => b.kind);
  assert.ok(kinds.includes('warmup'));
  assert.ok(kinds.includes('lift'));
  assert.ok(kinds.includes('section'));
  const lift = plan.blocks.find((b) => b.kind === 'lift');
  assert.equal(lift.prescription.includes('5'), true);
  assert.deepEqual(lift.columns, ['reps', 'weight_kg']);
});

test('assign template to date wins over fallback demo', () => {
  let st = Lib.emptyState();
  st = Lib.createTemplate(st, { title: 'Mine' });
  const tid = st.templates[0].id;
  st = Lib.addExercise(st, tid, { title: 'Front Squat', setCount: 3, columns: ['reps'] });
  st = Lib.assignDate(st, tid, '2026-09-11');
  const plan = Lib.planForDate(st, '2026-09-11', { title: 'Demo', blocks: [{ kind: 'lift', letter: 'Z', title: 'Demo Lift' }] });
  assert.equal(plan.title, 'Mine');
  assert.equal(plan.blocks.some((b) => b.title === 'Front Squat'), true);
});

test('reps plus meters compiles a metres prescription', () => {
  let st = Lib.emptyState();
  st = Lib.createTemplate(st, { title: 'Sled day' });
  const tid = st.templates[0].id;
  st = Lib.addExercise(st, tid, { title: 'Sled', setCount: 3, columns: ['reps', 'meters'] });
  const lift = Lib.compile(st.templates[0]).blocks.find((b) => b.kind === 'lift');
  assert.match(lift.prescription, /m/);
  assert.deepEqual(lift.columns, ['reps', 'meters']);
});

test('create catalog exercise with reps + meters is searchable', () => {
  let st = Lib.emptyState();
  st = Lib.createCatalogExercise(st, { title: 'Bendh', columns: ['reps', 'meters'] });
  const hits = Lib.searchCatalog(st, 'exercises', 'bend');
  assert.equal(hits[0].title, 'Bendh');
  assert.deepEqual(hits[0].columns, ['reps', 'meters']);
});

test('authored reps and ranges reach the session and progression engine', () => {
  require(join(dirname(fileURLToPath(import.meta.url)), 'session.js'));
  require(join(dirname(fileURLToPath(import.meta.url)), 'strength-brain.js'));
  let st = Lib.createTemplate(Lib.emptyState(), {title:'Rep targets'});
  const tid=st.templates[0].id;
  st=Lib.addExercise(st,tid,{title:'Back Squat',setCount:3,columns:['reps','weight_kg']});
  const bid=st.templates[0].blocks[0].id;
  for (const [value,min,max] of [['1',1,1],['5',5,5],['3-5',3,5],['6–8',6,8],['12-20',12,20],['20-30',20,30],['50-100',50,100]]) {
    st=Lib.patchBlock(st,tid,bid,{repTarget:Lib.parseRepTarget(value).text,targetEffort:'max_effort'});
    const block=Lib.compile(st.templates[0]).blocks.find(b=>b.kind==='lift');
    const page=HybridSession.pagesFromPlan({blocks:[block]})[0];
    assert.equal(page.targetReps,min);assert.equal(page.targetRepMax,max);
    assert.equal(block.targetEffort,undefined);assert.equal(StrengthBrain.target(page), 'average');
    const sets=Array.from({length:3},()=>({kg:40,reps:min,effort:'average',logged:true,purpose:'working'}));
    if(min!==max) assert.equal(StrengthBrain.review(page,sets).nextKg,40);
    sets.forEach(s=>s.reps=max);assert.equal(StrengthBrain.review(page,sets).nextKg,42.5);
  }
  for(const value of ['','0','8-6','2.5','6-','-8','8-10-12']) assert.equal(Lib.parseRepTarget(value),null,value);
});

test('deleting a template clears every assignment; stale cloud assignments are pruned',()=>{
 let state=Lib.createTemplate(Lib.emptyState(),{title:'Delete me'});const tid=state.templates[0].id;
 state=Lib.addExercise(state,tid,{title:'Squat'});state=Lib.assignDate(state,tid,'2026-10-10');state=Lib.assignDate(state,tid,'2026-10-12');
 const deleted=Lib.deleteTemplate(state,tid);assert.deepEqual(deleted.assignments,{});assert.equal(deleted.templates.length,0);
 assert.deepEqual(Lib.ensure({...deleted,assignments:{'2026-10-10':tid}}).assignments,{});
});


test('older authored ranges retain their target and select Rep Range on upgrade', () => {
 const lib=HybridLibrary.ensure({templates:[{id:'old',blocks:[{kind:'lift',columns:['reps','weight_kg'],repTarget:'6-8'}]}],assignments:{},catalog:{exercises:[],circuits:[]}});
 assert.deepEqual(lib.templates[0].blocks[0].columns,['reps_range','weight_kg']);
 assert.equal(lib.templates[0].blocks[0].repTarget,'6-8');
});

test('compile preserves arbitrary set targets and final first-working-weight AMRAP',()=>{
 let st=Lib.createTemplate(Lib.emptyState(),{title:'Wave'}),tid=st.templates[0].id;
 st=Lib.addExercise(st,tid,{title:'Squat',setCount:4,columns:['reps','weight_kg']});
 const bid=st.templates[0].blocks[0].id;
 const reps=[10,8,6].map((n,i)=>({id:`${bid}:set:${i}`,purpose:'working',reps:{min:n,max:n},loadRule:{kind:'adaptive'},toFailure:false}));
 reps.push({id:`${bid}:set:3`,purpose:'amrap',reps:null,loadRule:{kind:'first_working_set'},toFailure:false});
 st=Lib.patchBlock(st,tid,bid,{setTargets:reps});
 const lift=Lib.compile(st.templates[0]).blocks.find(b=>b.kind==='lift');
 assert.deepEqual(lift.setTargets.map(t=>t.reps?.min??null),[10,8,6,null]);
 assert.equal(lift.setTargets[3].loadRule.kind,'first_working_set');assert.equal(lift.setCount,4);
 assert.equal(lift.prescription,'10 / 8 / 6 / AMRAP');
});
