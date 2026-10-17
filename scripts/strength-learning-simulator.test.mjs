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
 assert.equal(r.decisions[0].displayKg,0);const first=r.decisions.filter(d=>d.targetId==='A:set:0');assert.ok(first.at(-1).displayKg>first[0].displayKg,'alternating prescriptions must not trap the first work set at its cold start');
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
test('repeating a scenario for the same athlete does not inflate the bootstrap sample size',async()=>{
 const {summarizePairs}=await import('./strength-learning-simulator.mjs');
 const pair={seed:1,athlete:0,baseline:{sets:3,targetHit:.5,missRate:0},candidate:{sets:3,targetHit:.6,missRate:0,updates:1,firstUpdate:8}};
 const result=summarizePairs([{...pair,scenario:'a'},{...pair,scenario:'b'}]);
 assert.equal(result.athletes,1);assert.equal(result.scenarioPairs,2);assert.ok(Math.abs(result.targetHitDifference.mean-.1)<1e-10);
});
test('paired policies receive identical external day and feedback schedules',()=>{
 const input={seed:912731,scenario:'noisy-feedback',sessions:20};
 const baseline=runScenario({...input,policy:'default'}),online=runScenario({...input,policy:'online'});
 assert.equal(baseline.metrics.exogenousFingerprint,online.metrics.exogenousFingerprint);
});

test('an athlete-adjusted second warm-up carries into work and finished history without extra sets',()=>{
 const r=runScenario({seed:912731,policy:'default',scenario:'athlete-calibrated',sessions:4});
 const first=r.decisions.filter(d=>d.session===0),ramps=first.filter(d=>d.purpose==='ramp');
 assert.equal(ramps.length,2);assert.ok(ramps[1].displayKg>ramps[0].displayKg);
 assert.ok(first.find(d=>d.purpose==='working').displayKg>=ramps[1].displayKg);
 assert.ok(r.decisions.find(d=>d.session===1&&d.purpose==='working').displayKg>0);
 for(const key of ['invalid','actualMutations','wrongReferences','equipmentViolations','excessiveJumps'])assert.equal(r.metrics[key],0,key);
});

test('jump audit treats an unseeded zero next row as a placeholder',()=>{
 for(const policy of ['default','online']){
  const r=runScenario({seed:8201473,athlete:0,policy,scenario:'athlete-calibrated',sessions:1});
  assert.equal(r.metrics.excessiveJumps,0,policy);
 }
});

test('resuming source-scoped checkpoints returns the same paired evaluation',async()=>{
 const {mkdtempSync,rmSync,readdirSync,readFileSync,writeFileSync}=await import('node:fs');
 const {tmpdir}=await import('node:os');const {join}=await import('node:path');
 const {evaluate}=await import('./strength-learning-simulator.mjs');
 const dir=mkdtempSync(join(tmpdir(),'strength-eval-resume-')),previous=process.env.STRENGTH_EVAL_CHECKPOINT_DIR;
 try{
  process.env.STRENGTH_EVAL_CHECKPOINT_DIR=dir;
  const input={athletesPerSeed:1,sessions:2,scenarios:['cold-start']};
  const first=await evaluate(input);assert.equal(readdirSync(dir).filter(n=>n.endsWith('.json')).length,3);
  assert.deepEqual(await evaluate(input),first);
  const file=join(dir,readdirSync(dir).find(n=>n.endsWith('.json')));
  const corrupt=JSON.parse(readFileSync(file,'utf8'));corrupt.results[0].baseline.hits=999;
  writeFileSync(file,JSON.stringify(corrupt));assert.deepEqual(await evaluate(input),first);
  const changed=await evaluate({...input,sessions:3});assert.equal(changed.sessions,3);assert.notDeepEqual(changed.results,first.results);
 }finally{
  if(previous==null)delete process.env.STRENGTH_EVAL_CHECKPOINT_DIR;else process.env.STRENGTH_EVAL_CHECKPOINT_DIR=previous;
  rmSync(dir,{recursive:true,force:true});
 }
});
