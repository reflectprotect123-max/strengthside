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
require(join(dirname(fileURLToPath(import.meta.url)), 'strength-load.js'));
require(join(dirname(fileURLToPath(import.meta.url)), 'strength-context.js'));
require(join(dirname(fileURLToPath(import.meta.url)), 'strength-learning.js'));
require(join(dirname(fileURLToPath(import.meta.url)), 'strength-replay.js'));
require(join(dirname(fileURLToPath(import.meta.url)), 'strength-brain-core.js'));
require(join(dirname(fileURLToPath(import.meta.url)), 'library.js'));
require(join(dirname(fileURLToPath(import.meta.url)), 'strength-brain.js'));
require(join(dirname(fileURLToPath(import.meta.url)), 'session.js'));
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
    assert.equal(page.targetReps,undefined);assert.equal(page.targetRepMax,undefined);
    assert.deepEqual(StrengthTargets.normalize(page)[0].reps,{min,max});
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

test('warmup, cooldown, and tempo compile for display without changing the reps the brain reads', () => {
  let st = Lib.createTemplate(Lib.emptyState(), { title: 'Monday Strength', instructions: 'Stay strict on the lowering.' });
  const tid = st.templates[0].id;
  st = Lib.placeTextBlock(st, tid, { role: 'warmup', title: 'Warm-up', instructions: 'Foam roll hamstrings' });
  st = Lib.addExercise(st, tid, { title: 'Back Squat', setCount: 3, columns: ['reps', 'weight_kg'] });
  const bid = st.templates[0].blocks.find((b) => b.kind === 'lift').id;
  st = Lib.patchBlock(st, tid, bid, { tempo: '31X0' });
  st = Lib.placeTextBlock(st, tid, { role: 'cooldown', title: 'Cool-down', instructions: 'Walk five minutes' });
  const plan = Lib.compile(st.templates[0]);
  const lift = plan.blocks.find((b) => b.kind === 'lift');
  assert.equal(plan.blocks.find((b) => b.kind === 'warmup').title, 'Warm-up');
  assert.equal(plan.blocks.find((b) => b.kind === 'recovery').title, 'Cool-down');
  assert.match(lift.prescription, /^3 x 8 · 31X0$/);
  assert.equal(lift.setTargets[0].reps.min, 8);
  assert.equal(lift.tempo, '31X0');
  assert.deepEqual(HybridSession.parseRx(lift.prescription), { setCount: 3, targetReps: 8, targetRepMax: 8, isMax: false });
  st = Lib.placeTextBlock(st, tid, { role: 'warmup', instructions: '   ' });
  assert.equal(Lib.compile(st.templates[0]).blocks.some((b) => b.kind === 'warmup'), false);
});

test('tempo does not change the kilograms the brain would load', () => {
  let st = Lib.createTemplate(Lib.emptyState(), { title: 'Monday' });
  const tid = st.templates[0].id;
  st = Lib.addExercise(st, tid, { title: 'Back Squat', setCount: 3, columns: ['reps', 'weight_kg'] });
  const bid = st.templates[0].blocks.find((b) => b.kind === 'lift').id;
  st = Lib.patchBlock(st, tid, bid, { repTarget: '5', tempo: '31X0' });
  const marked = HybridSession.pagesFromPlan(Lib.compile(st.templates[0])).find((p) => p.title === 'Back Squat');
  st = Lib.patchBlock(st, tid, bid, { tempo: '' });
  const plain = HybridSession.pagesFromPlan(Lib.compile(st.templates[0])).find((p) => p.title === 'Back Squat');
  const decide = (page, reps, effort) => {
    const row = { id: 'r0', targetId: page.setTargets[0].id, reps, effort, kg: 100, logged: true, purpose: 'working', workingIndex: 0 };
    return StrengthBrain.next({ page, row, nextRow: { targetId: page.setTargets[1].id }, index: 1, state: { rows: [row] } });
  };
  assert.equal(marked.prescription, '3 x 5 · 31X0');
  assert.equal(plain.prescription, '3 x 5');
  assert.equal(marked.setCount, 3);
  assert.deepEqual(marked.setTargets.map((t) => t.reps), plain.setTargets.map((t) => t.reps));
  assert.deepEqual(decide(marked, 5, 'average'), decide(plain, 5, 'average'));
  assert.deepEqual(decide(marked, 5, 'hard'), decide(plain, 5, 'hard'));
  assert.equal(decide(marked, 5, 'average').kg, 100);
  assert.equal(decide(marked, 5, 'average').reason, 'combined_projection_hold');
  let hold = Lib.createTemplate(Lib.emptyState(), { title: 'Hold' });
  const hid = hold.templates[0].id;
  hold = Lib.addExercise(hold, hid, { title: 'Plank Hold', setCount: 3, columns: ['time_mmss'] });
  const plank = hold.templates[0].blocks.find((b) => b.kind === 'lift').id;
  hold = Lib.patchBlock(hold, hid, plank, { tempo: '31X0' });
  const timed = Lib.compile(hold.templates[0]).blocks.find((b) => b.kind === 'lift');
  const timedPage = HybridSession.pagesFromPlan(Lib.compile(hold.templates[0])).find((p) => p.title === 'Plank Hold');
  assert.equal(timed.prescription, '3 x time · 31X0');
  assert.equal(timedPage.setCount, 3);
  assert.deepEqual(HybridSession.parseRx('3 x time · 31X0'), HybridSession.parseRx('3 x time'));
  assert.deepEqual(HybridSession.parseRx('3x12'), { setCount: 3, targetReps: 12, targetRepMax: 12, isMax: false });
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

test('builder stores stable invisible exercise metadata and removes obsolete fields',()=>{
 let st=Lib.createTemplate(Lib.emptyState(),{title:'Metadata'}),tid=st.templates[0].id;
 const squat=st.catalog.exercises.find(x=>x.title==='Back Squat');
 st=Lib.addExercise(st,tid,{catalogId:squat.id});const block=st.templates[0].blocks[0];
 assert.equal(block.exerciseId,'ex_back_squat');assert.equal(block.equipmentId,'barbell');
 assert.equal(block.loadConvention,'total');assert.equal(block.minimumKg,20);assert.equal(block.equipmentStepKg,2.5);
 for(const key of ['restSec','targetEffort','demoStartingKg','repMin','repMax','targetReps','targetRepMax'])assert.equal(key in block,false,key);
 const renamed=Lib.patchBlock(st,tid,block.id,{title:'Competition Squat',targetEffort:'hard',restSec:60,demoStartingKg:100}).templates[0].blocks[0];
 assert.equal(renamed.exerciseId,'ex_back_squat');assert.equal(renamed.equipmentId,'barbell');
 assert.equal('targetEffort' in renamed,false);assert.equal('restSec' in renamed,false);assert.equal('demoStartingKg' in renamed,false);
 st=Lib.createCatalogExercise(st,{title:'Dumbbell Curl',columns:['reps','weight_kg']});const curl=st.catalog.exercises[0];
 assert.equal(curl.equipmentId,'dumbbell');assert.equal(curl.loadConvention,'per_hand');assert.equal(curl.minimumKg,1);
});
