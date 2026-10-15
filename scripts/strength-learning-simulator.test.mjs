import test from 'node:test';
import assert from 'node:assert/strict';
import {runScenario,bootstrap,registered} from './strength-learning-simulator.mjs';
test('production decisions are deterministic and use physical bars',()=>{
 const input={seed:912731,policy:'online',scenario:'alternating-tempo-10-8-6',sessions:12};
 const a=runScenario(input);assert.deepEqual(a,runScenario(input));assert.ok(a.decisions.length>0);
 for(const d of a.decisions){assert.ok(Number.isFinite(d.physicalKg));assert.ok(d.physicalKg>=20);assert.equal(d.physicalKg,d.displayKg+20);assert.ok(d.targetId);assert.ok(d.context);}
 assert.equal(a.metrics.actualMutations,0);assert.equal(a.metrics.wrongReferences,0);
});
test('cold starts contain no supplied teacher load and Easy-only evidence makes progress',()=>{
 const r=runScenario({seed:912731,policy:'default',scenario:'cold-start',sessions:8});
 assert.equal(r.decisions[0].displayKg,0);assert.ok(r.decisions.some(d=>d.session>0&&d.displayKg>0));
 assert.equal(r.metrics.invalid,0);
});
test('coarse inventory, changed targets, noise and short rest retain actuals and correct references',()=>{
 for(const scenario of ['coarse-equipment','noisy-feedback','short-rest','ranges','bar-15','manual-off-grid','high-reps']){
  const r=runScenario({seed:912731,policy:'online',scenario,sessions:6});
  for(const k of ['invalid','actualMutations','wrongReferences','equipmentViolations','excessiveJumps'])assert.equal(r.metrics[k],0,scenario+':'+k);
 }
});
test('bootstrap resamples paired athletes and preregistered seeds are disjoint',()=>{
 assert.deepEqual(bootstrap([1,1,1],10000),{mean:1,low:1,high:1});
 assert.ok(registered.training.every(s=>!registered.evaluation.includes(s)));
 assert.throws(()=>runScenario({scenario:'unknown'}),/Unknown/);
});
