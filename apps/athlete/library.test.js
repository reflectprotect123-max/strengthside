import {workout} from '../../checks/fixtures/workouts.mjs';
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

test('athlete library exposes reading and compilation without authoring operations',()=>{
 for(const name of ['createTemplate','patchTemplate','addExercise','addCircuit','patchBlock','moveBlock','placeTextBlock','linkSuperset','assignDate','createCatalogExercise'])assert.equal(Lib[name],undefined,name);
 assert.equal(typeof Lib.compile,'function');assert.equal(typeof Lib.ensure,'function');
});
test('received template keeps its ranges, tempo, equipment and first-set AMRAP',()=>{
 const t=workout({prep:false,blocks:[{title:'Back Squat',tempo:'33X1',setTargets:[{id:'a',purpose:'working',reps:{min:6,max:8},loadRule:{kind:'adaptive'}},{id:'b',purpose:'amrap',reps:null,loadRule:{kind:'first_working_set'}}]}]});
 const before=JSON.stringify(t),plan=Lib.compile(t),lift=plan.blocks.find(b=>b.kind==='lift');
 assert.equal(lift.tempo,'33X1');assert.equal(lift.loadConvention,'total');assert.equal(lift.minimumKg,20);assert.equal(lift.setTargets[1].purpose,'amrap');assert.equal(lift.setTargets[1].loadRule.kind,'first_working_set');assert.deepEqual(lift.setTargets[0].reps,{min:6,max:8});assert.equal(JSON.stringify(t),before);
});
test('older ranges and saved metadata remain readable after normalization',()=>{
 const t=workout({prep:false,blocks:[{title:'Back Squat',repTarget:'20-25',columns:['reps','weight_kg']}]});
 const st=Lib.ensure({templates:[t],assignments:{'2026-10-18':t.id}});
 assert.deepEqual(st.templates[0].blocks[0].columns,['reps_range','weight_kg']);assert.equal(st.templates[0].blocks[0].repTarget,'20-25');assert.equal(Lib.planForDate(st,'2026-10-18').title,t.title);
 assert.equal(Lib.planForDate(st,'2026-10-19'),null);
});
test('deleting a saved workout clears its assignments and keeps other workouts',()=>{
 const a=workout({id:'a'}),b=workout({id:'b'}),st=Lib.ensure({templates:[a,b],assignments:{'2026-10-18':'a','2026-10-19':'a','2026-10-20':'b'}});
 const next=Lib.deleteTemplate(st,'a');assert.deepEqual(next.templates.map(t=>t.id),['b']);assert.deepEqual(next.assignments,{'2026-10-20':'b'});assert.equal(st.templates.length,2);
 assert.deepEqual(Lib.ensure({...next,assignments:{missing:'gone'}}).assignments,{});
});
test('a prescribed rest stays on the block and reaches the logger page',()=>{
 const t=workout({prep:false,blocks:[{title:'Bench Press',restSec:45,columns:['reps','weight_kg'],notes:['rest 90']}]});
 const kept=Lib.ensure({templates:[t],assignments:{}});
 const block=kept.templates[0].blocks.find(b=>b.title==='Bench Press');
 assert.equal(block.restSec,45);
 const pages=HybridSession.pagesFromPlan(Lib.compile(kept.templates[0]));
 assert.equal(pages.find(p=>p.title==='Bench Press').restSec,45);
});
test('received warm-up, working lifts and cool-down still compile in session order',()=>{
 const t=workout();t.blocks.push({id:'cool',kind:'lift',title:'Breathing',role:'cooldown',columns:['seconds'],prescribed:'60',setCount:3,countIn:3});
 const plan=Lib.compile(t),lifts=plan.blocks.filter(b=>b.kind==='lift');
 assert.equal(lifts[0].role,'warmup');assert.equal(lifts[0].prescribed,'180');assert.equal(lifts[0].setCount,3);assert.equal(lifts.at(-1).role,'cooldown');assert.equal(lifts.at(-1).countIn,3);
 const pages=HybridSession.pagesFromPlan(plan);assert.ok(pages.length>0);assert.equal(pages[0].section,'Warm-Up');assert.equal(pages.filter(p=>p.section).at(-1).section,'Cool-Down');
});
