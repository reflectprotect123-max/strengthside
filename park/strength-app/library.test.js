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
const SEED_WARMUP_BLOCKS = 0;

function letterFor(tpl, title) {
  return Lib.lettered(tpl).find((b) => b.title === title).letter;
}

function liftByTitle(plan, title) {
  return plan.blocks.find((b) => b.kind === 'lift' && b.title === title);
}

test('a new template starts with an empty warm-up and drops a previously seeded circuit', () => {
  const st = Lib.createTemplate(Lib.emptyState(), { title: 'Lower Strength' });
  assert.deepEqual(st.templates[0].blocks, []);
  const old = Lib.emptyState();
  old.templates.push({
    id: 'old',
    title: 'Saved',
    blocks: [
      { id: 'b1', kind: 'lift', title: 'Bike', role: 'warmup', columns: ['seconds'], setCount: 3, prescribed: '180' },
      { id: 'b2', kind: 'lift', title: 'Row', role: 'warmup', columns: ['seconds'], setCount: 3, prescribed: '180' },
      { id: 'b3', kind: 'lift', title: 'Run', role: 'warmup', columns: ['seconds'], setCount: 3, prescribed: '180' },
      { id: 'b4', kind: 'lift', title: 'Ski', role: 'warmup', columns: ['seconds'], setCount: 3, prescribed: '180' },
      { id: 'b5', kind: 'lift', title: 'Jump Rope', role: 'warmup', columns: ['seconds'], setCount: 3, prescribed: '60' },
      { id: 'b6', kind: 'lift', title: 'Back Squat', columns: ['reps'], setCount: 3 },
      { id: 'b7', kind: 'lift', title: 'Push Downs', role: 'warmup', columns: ['reps'], setCount: 3, repTarget: '10' },
    ],
  });
  const cleared = Lib.ensure(old);
  assert.deepEqual(cleared.templates[0].blocks.map((b) => b.title), ['Back Squat', 'Push Downs']);
  const again = Lib.addExercise(cleared, 'old', { title: 'Bike', columns: ['seconds'], setCount: 3, value: '180', role: 'warmup' });
  assert.ok(again.templates[0].blocks.some((b) => b.title === 'Bike' && b.role === 'warmup'));
});

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
  const blocks = () => st.templates[0].blocks;
  st = Lib.linkSuperset(st, tid, blocks()[SEED_WARMUP_BLOCKS + 1].id, blocks()[SEED_WARMUP_BLOCKS + 2].id);
  st = Lib.addExercise(st, tid, { title: 'Back Squat', setCount: 3, columns: ['reps', 'weight_kg'] });
  st = Lib.linkSuperset(st, tid, blocks()[SEED_WARMUP_BLOCKS + 2].id, blocks()[SEED_WARMUP_BLOCKS + 3].id);
  st = Lib.addExercise(st, tid, { title: 'Bendh', setCount: 3, columns: ['reps', 'meters'] });
  const tpl = st.templates[0];
  assert.deepEqual(
    ['Bench Press Warm-Up', 'Bench Press', 'Lat Pull Downs', 'Back Squat', 'Bendh'].map((title) => letterFor(tpl, title)),
    ['A', 'B1', 'B2', 'B3', 'C'],
  );
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
  const lift = liftByTitle(plan, 'Bench Press');
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
  const lift = liftByTitle(Lib.compile(st.templates[0]), 'Sled');
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
  const bid=st.templates[0].blocks.find((b)=>b.title==='Back Squat').id;
  for (const [value,min,max] of [['1',1,1],['5',5,5],['3-5',3,5],['6–8',6,8],['12-20',12,20],['20-30',20,30],['50-100',50,100]]) {
    st=Lib.patchBlock(st,tid,bid,{repTarget:Lib.parseRepTarget(value).text,targetEffort:'max_effort'});
    const block=liftByTitle(Lib.compile(st.templates[0]), 'Back Squat');
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
  const bid = st.templates[0].blocks.find((b) => b.title === 'Back Squat').id;
  st = Lib.patchBlock(st, tid, bid, { tempo: '31X0' });
  st = Lib.placeTextBlock(st, tid, { role: 'cooldown', title: 'Cool-down', instructions: 'Walk five minutes' });
  const plan = Lib.compile(st.templates[0]);
  const lift = liftByTitle(plan, 'Back Squat');
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
  const bid = st.templates[0].blocks.find((b) => b.title === 'Back Squat').id;
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
  const plank = hold.templates[0].blocks.find((b) => b.title === 'Plank Hold').id;
  hold = Lib.patchBlock(hold, hid, plank, { tempo: '31X0' });
  const timed = liftByTitle(Lib.compile(hold.templates[0]), 'Plank Hold');
  const timedPage = HybridSession.pagesFromPlan(Lib.compile(hold.templates[0])).find((p) => p.title === 'Plank Hold');
  assert.equal(timed.prescription, '3 x time · 31X0');
  assert.equal(timedPage.setCount, 3);
  assert.deepEqual(HybridSession.parseRx('3 x time · 31X0'), HybridSession.parseRx('3 x time'));
  assert.deepEqual(HybridSession.parseRx('3x12'), { setCount: 3, targetReps: 12, targetRepMax: 12, isMax: false });
});

test('compile preserves arbitrary set targets and final first-working-weight AMRAP',()=>{
 let st=Lib.createTemplate(Lib.emptyState(),{title:'Wave'}),tid=st.templates[0].id;
 st=Lib.addExercise(st,tid,{title:'Squat',setCount:4,columns:['reps','weight_kg']});
 const bid=st.templates[0].blocks.find((b)=>b.title==='Squat').id;
 const reps=[10,8,6].map((n,i)=>({id:`${bid}:set:${i}`,purpose:'working',reps:{min:n,max:n},loadRule:{kind:'adaptive'},toFailure:false}));
 reps.push({id:`${bid}:set:3`,purpose:'amrap',reps:null,loadRule:{kind:'first_working_set'},toFailure:false});
 st=Lib.patchBlock(st,tid,bid,{setTargets:reps});
 const lift=liftByTitle(Lib.compile(st.templates[0]), 'Squat');
 assert.deepEqual(lift.setTargets.map(t=>t.reps?.min??null),[10,8,6,null]);
 assert.equal(lift.setTargets[3].loadRule.kind,'first_working_set');assert.equal(lift.setCount,4);
 assert.equal(lift.prescription,'10 / 8 / 6 / AMRAP');
});

test('builder stores stable invisible exercise metadata and removes obsolete fields',()=>{
 let st=Lib.createTemplate(Lib.emptyState(),{title:'Metadata'}),tid=st.templates[0].id;
 const squat=st.catalog.exercises.find(x=>x.title==='Back Squat');
 st=Lib.addExercise(st,tid,{catalogId:squat.id});const block=st.templates[0].blocks.find((b)=>b.exerciseId==='ex_back_squat');
 assert.equal(block.exerciseId,'ex_back_squat');assert.equal(block.equipmentId,'barbell');
 assert.equal(block.loadConvention,'total');assert.equal(block.minimumKg,20);assert.equal(block.equipmentStepKg,2.5);
 for(const key of ['restSec','targetEffort','demoStartingKg','repMin','repMax','targetReps','targetRepMax'])assert.equal(key in block,false,key);
 const renamed=Lib.patchBlock(st,tid,block.id,{title:'Competition Squat',targetEffort:'hard',restSec:60,demoStartingKg:100}).templates[0].blocks.find((b)=>b.id===block.id);
 assert.equal(renamed.exerciseId,'ex_back_squat');assert.equal(renamed.equipmentId,'barbell');
 assert.equal('targetEffort' in renamed,false);assert.equal('restSec' in renamed,false);assert.equal('demoStartingKg' in renamed,false);
 st=Lib.createCatalogExercise(st,{title:'Dumbbell Curl',columns:['reps','weight_kg']});const curl=st.catalog.exercises[0];
 assert.equal(curl.equipmentId,'dumbbell');assert.equal(curl.loadConvention,'per_hand');assert.equal(curl.minimumKg,1);
});
test('an explicitly declared 15 kg bar reaches the logger without changing fields or targets',()=>{
 let st=Lib.createTemplate(Lib.emptyState(),{title:'Light bar'}),tid=st.templates[0].id;
 st=Lib.createCatalogExercise(st,{title:'Training Bar Squat',equipmentId:'barbell',loadConvention:'total',minimumKg:20,barWeightKg:15,equipmentStepKg:2.5,columns:['reps','weight_kg']});
 st=Lib.addExercise(st,tid,{catalogId:st.catalog.exercises[0].id});
 const plan=Lib.compile(st.templates[0]),p=HybridSession.pagesFromPlan(plan).find((page)=>page.title==='Training Bar Squat');
 assert.equal(p.barWeightKg,15);assert.equal(globalThis.StrengthLoad.fromPage({page:p,value:0,provenance:'explicit'}).externalKg,15);
});

test('a warm-up circuit keeps its time, distance, and reps beside the working lifts', () => {
  let st = Lib.createTemplate(Lib.emptyState(), { title: 'Lower Strength' });
  const tid = st.templates[0].id;
  const add = (title, columns, value, extra = {}) => {
    st = Lib.addExercise(st, tid, { title, columns, setCount: extra.setCount || 3, value, role: extra.role, countIn: extra.countIn });
  };
  add('Bike', ['seconds'], '180', { role: 'warmup' });
  add('Isometric Hold', ['seconds'], '30', { role: 'warmup', countIn: 3 });
  add('Push Downs', ['reps'], '10', { role: 'warmup' });
  add('Farmers Carry', ['meters'], '20', { role: 'warmup' });
  st = Lib.addExercise(st, tid, { title: 'Back Squat', setCount: 4, columns: ['reps'] });
  const squat = st.templates[0].blocks.at(-1).id;
  const wave = [10, 8, 6].map((n, i) => ({ id: `${squat}:set:${i}`, purpose: 'working', reps: { min: n, max: n }, loadRule: { kind: 'adaptive' }, toFailure: false }));
  wave.push({ id: `${squat}:set:3`, purpose: 'amrap', reps: null, loadRule: { kind: 'first_working_set' }, toFailure: false });
  st = Lib.patchBlock(st, tid, squat, { setTargets: wave, tempo: '20X1' });
  st = Lib.addExercise(st, tid, { title: 'Bench Press', setCount: 3, columns: ['reps_range'], value: '6-8' });
  st = Lib.patchBlock(st, tid, st.templates[0].blocks.at(-1).id, { tempo: '33X1' });
  const plan = Lib.compile(st.templates[0]);
  const lifts = plan.blocks.filter((b) => b.kind === 'lift');
  const addedWarmupStart = SEED_WARMUP_BLOCKS;
  assert.equal(lifts[addedWarmupStart].prescription, '3 x 180 sec');
  assert.equal(lifts[addedWarmupStart].section, 'Warm-Up');
  assert.equal(lifts[addedWarmupStart + 1].prescription, '3 x 30 sec');
  assert.equal(lifts[addedWarmupStart + 1].countIn, 3);
  assert.equal(lifts[addedWarmupStart + 2].prescription, '3 x 10');
  assert.equal(lifts[addedWarmupStart + 3].prescription, '3 x 20 m');
  assert.equal(lifts[addedWarmupStart + 4].prescription, '10 / 8 / 6 / AMRAP · 20X1');
  assert.deepEqual(lifts[addedWarmupStart + 4].columns, ['reps']);
  assert.equal(lifts[addedWarmupStart + 5].prescription, '3 x 6-8 · 33X1');
  const names = HybridSession.pagesFromPlan(plan).map((p) => p.title);
  const customWarmupRound = ['Bike', 'Isometric Hold', 'Push Downs', 'Farmers Carry'];
  assert.deepEqual(names.slice(SEED_WARMUP_BLOCKS, SEED_WARMUP_BLOCKS + customWarmupRound.length), customWarmupRound);
  assert.deepEqual(names.slice(customWarmupRound.length, customWarmupRound.length * 2), customWarmupRound);
  const session = HybridSession.startSession({ date: '2026-10-16', plan, letter: 'A' });
  const bike = session.pages[0];
  const hold = session.pages.find((p) => p.title === 'Isometric Hold');
  assert.equal(bike.section, 'Warm-Up');
  assert.equal(bike.askEffort, false);
  assert.equal(session.logs[bike.id].sets[0].cells.seconds, '180');
  assert.equal(session.logs[bike.id].sets[0].purpose, 'warmup');
  assert.equal(hold.countIn, 3);
  assert.equal(session.logs[hold.id].sets[0].cells.seconds, '30');
  assert.equal(globalThis.TrainingCore.validateRow(session.logs[bike.id].sets[0], bike).ok, true);
  const squatPage = session.pages.find((p) => p.title === 'Back Squat');
  assert.equal(squatPage.logMode, 'reps');
  assert.equal(squatPage.askEffort, true);
});

test('a cool-down plays in rounds and only keeps seconds or reps', () => {
  let st = Lib.createTemplate(Lib.emptyState(), { title: 'Lower Strength' });
  const tid = st.templates[0].id;
  st = Lib.addExercise(st, tid, { title: 'Easy Bike', columns: ['seconds'], setCount: 3, value: '120', role: 'cooldown' });
  st = Lib.addExercise(st, tid, { title: 'Cat-Cow', columns: ['reps'], setCount: 3, value: '8', role: 'cooldown' });
  const plan = Lib.compile(st.templates[0]);
  const cooldownLifts = plan.blocks.filter((b) => b.kind === 'lift' && b.section === 'Cool-Down');
  assert.equal(cooldownLifts[0].prescription, '3 x 120 sec');
  assert.equal(cooldownLifts[0].section, 'Cool-Down');
  assert.deepEqual(cooldownLifts[0].columns, ['seconds']);
  assert.equal(cooldownLifts[1].prescription, '3 x 8');
  assert.deepEqual(cooldownLifts[1].columns, ['reps']);
  const names = HybridSession.pagesFromPlan(plan).map((p) => p.title);
  const cooldownRound = ['Easy Bike', 'Cat-Cow'];
  assert.deepEqual(names.filter((n) => cooldownRound.includes(n)).slice(0, 4), [...cooldownRound, ...cooldownRound]);
  const session = HybridSession.startSession({ date: '2026-10-16', plan, letter: 'A' });
  const bike = session.pages.find((p) => p.title === 'Easy Bike');
  assert.equal(bike.section, 'Cool-Down');
  assert.equal(bike.askEffort, false);
  assert.equal(session.logs[bike.id].sets[0].cells.seconds, '120');
  assert.equal(session.logs[bike.id].sets[0].purpose, 'warmup');
  assert.equal(globalThis.TrainingCore.validateRow(session.logs[bike.id].sets[0], bike).ok, true);
});

test('start session order is warm-up rounds, lifts, cool-down rounds', () => {
  let st = Lib.createTemplate(Lib.emptyState(), { title: 'Lower Strength' });
  const tid = st.templates[0].id;
  st = Lib.addExercise(st, tid, { title: 'Bike', columns: ['seconds'], setCount: 3, value: '180', role: 'warmup' });
  st = Lib.addExercise(st, tid, { title: 'Back Squat', setCount: 3, columns: ['reps'], value: '5' });
  st = Lib.patchBlock(st, tid, st.templates[0].blocks.at(-1).id, { tempo: '20X1' });
  st = Lib.addExercise(st, tid, { title: 'Easy Bike', columns: ['seconds'], setCount: 3, value: '180', role: 'cooldown' });
  const names = HybridSession.pagesFromPlan(Lib.compile(st.templates[0])).map((p) => p.section + ':' + p.title);
  assert.equal(names[0], 'Warm-Up:Bike');
  assert.ok(names.includes('Strength/Power:Back Squat'));
  assert.ok(names.includes('Cool-Down:Easy Bike'));
  assert.ok(names.indexOf('Warm-Up:Bike') < names.indexOf('Strength/Power:Back Squat'));
  assert.ok(names.indexOf('Strength/Power:Back Squat') < names.indexOf('Cool-Down:Easy Bike'));
  assert.equal(names.at(-1), 'undefined:Done Training');
});

test('compile respects explicitly selected metrics on a main lift',()=>{
 let st=Lib.createTemplate(Lib.emptyState(),{title:'Selected metrics'}),tid=st.templates[0].id;
 st=Lib.addExercise(st,tid,{title:'Back Squat',columns:['reps'],setCount:3});
 const block=st.templates[0].blocks.at(-1);
 assert.deepEqual(liftByTitle(Lib.compile(st.templates[0]),'Back Squat').columns,['reps']);
 st=Lib.patchBlock(st,tid,block.id,{columns:['reps','weight_lb']});
 assert.deepEqual(liftByTitle(Lib.compile(st.templates[0]),'Back Squat').columns,['reps','weight_lb']);
});

test('adding a lift after revisiting cool-down still plays warm-up then all lifts then cool-down',()=>{
 let st=Lib.createTemplate(Lib.emptyState(),{title:'Edited session'}),tid=st.templates[0].id;
 st=Lib.addExercise(st,tid,{title:'Back Squat',columns:['reps','weight_kg']});
 st=Lib.addExercise(st,tid,{title:'Breathing',columns:['seconds'],value:'60',role:'cooldown'});
 st=Lib.addExercise(st,tid,{title:'Bench Press',columns:['reps','weight_kg']});
 st=Lib.addExercise(st,tid,{title:'Arm Circle',columns:['reps'],value:'10',role:'warmup'});
 const original=JSON.stringify(st),plan=Lib.compile(st.templates[0]);
 const lifts=plan.blocks.filter(b=>b.kind==='lift');
 assert.deepEqual(lifts.slice(-4).map(b=>b.title),['Arm Circle','Back Squat','Bench Press','Breathing']);
 assert.equal(lifts.at(-1).section,'Cool-Down');assert.equal(JSON.stringify(st),original);
 assert.deepEqual(Lib.lettered(st.templates[0]).slice(-4).map(b=>b.title),lifts.slice(-4).map(b=>b.title));
});
