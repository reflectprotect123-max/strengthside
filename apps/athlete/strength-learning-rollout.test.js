import test from 'node:test';
import assert from 'node:assert/strict';
import {runtime} from '../../scripts/strength-learning-simulator.mjs';
function page(){return {id:'A',kind:'lift',logMode:'kg',title:'Press',exerciseId:'press',equipmentId:'machine',loadConvention:'total',loadUnit:'kg',minimumKg:0,equipmentStepKg:.5,columns:['reps','weight_kg'],setTargets:[10,8].map((n,i)=>({id:'A:set:'+i,purpose:'working',reps:{min:n,max:n},loadRule:{kind:'adaptive'},toFailure:false}))};}
function args(p=page()){const row={targetId:'A:set:0',purpose:'working',kg:40,reps:10,effort:'average',logged:true,miss:false};return {page:p,row,nextRow:{targetId:'A:set:1',kg:42},index:1,state:{rows:[row],learning:{version:'online-v1',k:.08,conflicted:false}}};}
test('shipping policy is default and shadow returns exactly the default visible decision',()=>{
 const {ctx}=runtime();assert.equal(ctx.StrengthPolicy.learningMode,'default');assert.equal(ctx.StrengthPolicy.learningVersion,'online-v1');
 const a=args(),baseline=ctx.StrengthBrain.next(a);ctx.StrengthPolicy.learningMode='shadow';
 assert.deepEqual(ctx.StrengthBrain.next(a),baseline);assert.equal(ctx.StrengthBrain.diagnostics().length,1);
 // Fixed-step rules: the learned curve never changes a visible load, even online.
 ctx.StrengthPolicy.learningMode='online';assert.deepEqual(ctx.StrengthBrain.next(a),baseline);
 const event=ctx.StrengthBrain.diagnostics()[0];assert.deepEqual(Object.keys(event),['contextHash','model','reason','delta']);
});
test('corrupt or incompatible learning state selects the corrected default',()=>{
 const {ctx}=runtime(),a=args(),baseline=ctx.StrengthBrain.next(a);ctx.StrengthPolicy.learningMode='online';
 for(const patch of [{k:NaN},{k:999},{version:'future'},{conflicted:true}])assert.deepEqual(ctx.StrengthBrain.next({...a,state:{...a.state,learning:{...a.state.learning,...patch}}}),baseline);
});
test('repeated immutable memory reads fit once; edits and owner changes invalidate',async()=>{
 const {ctx}=runtime(),M=ctx.StrengthMemory,B=ctx.StrengthBrain,p=page();
 const s={id:'session',startedAt:1,completedAt:'2026-10-16T00:00:00Z',phase:'summary',pages:[p],logs:{A:{sets:[{...args(p).row,id:'row',workingIndex:0,ordinal:0,context:{normalizedLoad:ctx.StrengthLoad.fromPage({page:p,value:40,provenance:'explicit'})}}]}}};
 M.capture(s);let calls=0;const original=ctx.StrengthReplay.replay;ctx.StrengthReplay.replay=(...a)=>{calls++;return original(...a);};B.clearCache();
 const first=B.history(M.records(),p);for(let i=0;i<20;i++)assert.equal(B.history(M.records(),p),first);
 assert.equal(calls,1);assert.ok(Object.isFrozen(M.records().row.payload.row));
 s.logs.A.sets[0].reps=9;M.capture(s);const edited=B.history(M.records(),p);
 assert.notEqual(edited.evidenceFingerprint,first.evidenceFingerprint);assert.equal(edited.evidence[0].observation.reps,9);
 await M.bind('other');assert.equal(B.history(M.records(),p).accepted,0);
});
test('missing learner dependencies retain manual logging and conservative decisions',()=>{
 for(const missing of ['StrengthReplay','StrengthLearning','StrengthContext','StrengthLoad']){
  const {ctx}=runtime(),p=page();delete ctx[missing];
  assert.doesNotThrow(()=>ctx.StrengthBrain.next(args(p)));
  const s={id:'session',startedAt:1,phase:'block',pages:[p],logs:{A:{sets:[args(p).row]}}};
  assert.doesNotThrow(()=>ctx.StrengthMemory.capture(s));
  assert.equal(Object.values(ctx.StrengthMemory.records()).find(r=>r.kind==='set').payload.row.kg,40);
 }
});
test('rollback clears derived caches and diagnostics while retaining facts and pending writes',()=>{
 const {ctx}=runtime(),p=page(),M=ctx.StrengthMemory;
 M.capture({id:'s',startedAt:1,phase:'block',pages:[p],logs:{A:{sets:[args(p).row]}}});
 const before=JSON.stringify(M.records()),pending=M.getStatus().pending;
 ctx.StrengthPolicy.learningMode='shadow';ctx.StrengthBrain.next(args(p));ctx.StrengthPolicy.learningMode='default';ctx.StrengthBrain.clearCache();
 assert.equal(JSON.stringify(M.records()),before);assert.equal(M.getStatus().pending,pending);assert.equal(ctx.StrengthBrain.diagnostics().length,0);
});
