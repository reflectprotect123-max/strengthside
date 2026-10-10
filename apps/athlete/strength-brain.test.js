import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
const ctx=vm.createContext({crypto:webcrypto});vm.runInContext(readFileSync(new URL('./strength-brain.js',import.meta.url),'utf8'),ctx);
const B=ctx.StrengthBrain;
const page={id:'A',title:'Squat',kind:'lift',logMode:'kg',setCount:3,targetReps:6,targetRepMax:8,equipmentStepKg:1,columns:['reps','weight_kg']};
const row=(reps=8,effort='average',kg=40)=>({reps,effort,kg,logged:true,purpose:'working'});
test('lower boundary holds; upper boundary across full prescription earns exactly one step',()=>{
 assert.equal(B.review(page,[row(6),row(6),row(6)]).nextKg,40);
 assert.equal(B.review(page,[row(),row(),row(7)]).nextKg,40);
 assert.equal(B.review(page,[row(),row(),row(8,'hard')]).nextKg,41);
 assert.equal(B.review(page,[row(),row(),row(8,'max_effort')]).nextKg,40);
 assert.equal(B.review(page,[row(),row()]).earned,false);
});
test('mixed loads calibrate without a progression bonus',()=>assert.equal(B.review(page,[row(8,'average',40),row(8,'average',42),row(8,'hard',42)]).nextKg,42));
test('e1RM uses effort, ignores ramps, failures, easy sets and holds',()=>{
 assert.equal(B.estimate(row(8,'hard'),page),52);
 assert.equal(B.estimate({...row(8,'hard'),purpose:'ramp'},page),null);
 assert.equal(B.estimate({...row(8,'hard'),miss:true},page),null);
 assert.equal(B.estimate(row(8,'easy'),page),null);
 assert.equal(B.estimate(row(8,'hard'),{...page,title:'Farmer Carry'}),null);
 assert.equal(B.estimate(row(1,'max_effort',80),page),80);
});
test('coarse equipment never bypasses an upward cap',()=>{
 assert.equal(B.next({page:{...page,equipmentStepKg:2},row:row(6,'easy',4),nextRow:{purpose:'working'}}).kg,4);
 assert.equal(B.round(33.45,31,{...page,equipmentStepKg:1}),32);
 assert.equal(B.round(45,40,{...page,availableLoads:[40,50]}),40);
});
test('two unknown ramps, no invented load and same slider target; accessory gets no ramps',()=>{
 const session={id:webcrypto.randomUUID(),pages:[page,{...page,id:'B',title:'Curl',exerciseType:'accessory'}],logs:{A:{sets:[{}, {}, {}]},B:{sets:[{}, {}, {}]}}};
 const seeded=B.seed(session,{});
 assert.equal(seeded.logs.A.sets.length,5);assert.equal(seeded.logs.A.sets[0].kg,null);
 assert.equal(seeded.logs.B.sets.length,3);assert.equal(B.target(page,seeded.logs.A.sets[0],0),'easy');
 assert.equal(B.seed(seeded,{}).logs.A.sets.length,5);
});
test('history is exercise-specific and latest three session estimates are averaged',()=>{
 const records={};[40,42,44,46].forEach((kg,i)=>{const r=row(6,'hard',kg);records[i]={kind:'set',sessionId:'s'+i,exerciseKey:B.key(page),payload:{page,row:r,sessionStartedAt:i+1}};});
 const expected=[42,44,46].reduce((s,w)=>s+w*(1+7/30),0)/3;
 assert.ok(Math.abs(B.history(records,page).rolling-expected)<1e-8);
 assert.equal(B.history(records,{...page,title:'Bench'}).rolling,null);
});
test('incomplete and max effort cannot increase next weight',()=>{
 for(const r of [{...row(4),miss:true},row(6,'max_effort')])assert.ok(B.next({page,row:r,nextRow:{purpose:'working'}}).kg<40);
});
test('unexpected Hard reduces early work but may hold for the intended final Hard set',()=>{
 const early=B.next({page,row:row(6,'hard'),nextRow:{purpose:'working',workingIndex:1},index:3});
 const final=B.next({page,row:row(6,'hard'),nextRow:{purpose:'working',workingIndex:2},index:4});
 assert.ok(early.kg<40);assert.equal(final.kg,40);assert.equal(final.target,'hard');
});
