import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const context={window:{}};vm.createContext(context);
vm.runInContext(readFileSync(new URL('./zones.js',import.meta.url),'utf8'),context);
context.EngineZones=context.window.EngineZones;
vm.runInContext(readFileSync(new URL('./onboarding-model.js',import.meta.url),'utf8'),context);
const M=context.window.EngineOnboardingModel;
const date='2026-10-03',now='2026-10-03T02:00:00Z';
const state=()=>({settings:{},checkin:{},whoopHistory:[{date,rhr:50,source:'WHOOP account'}]});
const draft=()=>({age:40,fitness:'moderate',goal:'improve',maximumMode:'estimated',restingMode:'whoop'});
test('age estimate is bounded to adult inputs and uses the stated equation',()=>{
  assert.equal(M.estimatedMaximum(40),180);assert.equal(M.estimatedMaximum(30),187);
  for(const value of [null,0,17,101,40.5,NaN])assert.equal(M.estimatedMaximum(value),null);
});
test('completion produces an auditable WHOOP-based profile without mutating state',()=>{
  const s=state(),before=JSON.stringify(s),result=M.complete(s,draft(),date,now);
  assert.equal(JSON.stringify(s),before);assert.equal(result.onboarding.completed,true);
  assert.equal(result.onboarding.completedAt,now);assert.equal(result.profile.cardioFitness,'moderate');
  assert.equal(result.profile.goal,'improve');assert.equal(result.zones.max,180);
  assert.equal(result.zones.maxSource,'age-estimated');assert.equal(result.zones.maxEstimate.age,40);
  assert.equal(result.baseline.resting,50);assert.equal(result.baseline.maxSource,'age-estimated');
});
test('a known maximum overrides age estimate and an explicit resting HR works without WHOOP',()=>{
  const s=state();s.whoopHistory=[];const d={...draft(),maximumMode:'known',knownMaximum:192,restingMode:'manual',restingHR:54};
  const result=M.complete(s,d,date,now);assert.equal(result.zones.max,192);assert.equal(result.zones.maxEstimate,undefined);
  assert.equal(result.baseline.resting,54);assert.equal(result.profile.maximumSource,'entered');
});
test('incomplete answers, missing WHOOP and contradictory max/RHR prevent completion',()=>{
  for(const changes of [{fitness:null},{goal:null},{maximumMode:'known',knownMaximum:0},{restingMode:'manual',restingHR:190}])assert.ok(M.complete(state(),{...draft(),...changes},date,now).error);
  const s=state();s.whoopHistory=[];assert.ok(M.complete(s,draft(),date,now).error);
  assert.equal(s.settings.onboarding,undefined);
});
test('fitness/goal do not secretly change maximum or invent weekly progression',()=>{
  for(const fitness of ['low','moderate','high'])for(const goal of ['maintain','improve']){
    const result=M.complete(state(),{...draft(),fitness,goal},date,now);
    assert.equal(result.zones.max,180);assert.equal(result.baseline.green,141);
    assert.equal(result.weeklyTargets,undefined);
  }
});
test('editing a completed profile preserves its original completion timestamp',()=>{
  const s=state();s.settings.onboarding={completed:true,completedAt:'2026-09-30T00:00:00Z'};
  const result=M.complete(s,draft(),date,now);
  assert.equal(result.onboarding.completedAt,'2026-09-30T00:00:00Z');assert.equal(result.onboarding.updatedAt,now);
});
