import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
const ctx=vm.createContext({crypto:webcrypto});
for(const name of ['training-core','strength-targets','strength-equipment','strength-rts','strength-policy','strength-brain-core','strength-brain'])vm.runInContext(readFileSync(new URL(`./${name}.js`,import.meta.url),'utf8'),ctx);
const B=ctx.StrengthBrain;
const targets=[0,1,2].map(i=>({id:`A:set:${i}`,purpose:'working',reps:{min:6,max:8},loadRule:{kind:'adaptive'},toFailure:false}));
const page={id:'A',title:'Squat',kind:'lift',logMode:'kg',loadUnit:'kg',loadConvention:'total',setCount:3,targetReps:6,targetRepMax:8,equipmentStepKg:1,minimumKg:0,columns:['reps','weight_kg'],setTargets:targets};
const row=(i=0,reps=8,effort='average',kg=40)=>({id:`r${i}`,targetId:`A:set:${i}`,reps,effort,kg,logged:true,purpose:'working',workingIndex:i});

test('adapter delegates per-set range progression to the canonical core',()=>{
 assert.equal(B.review(page,[row(0,6),row(1,6),row(2,6)]).nextKg,40);
 assert.equal(B.review(page,[row(0),row(1),row(2)]).nextKg,41);
 assert.equal(B.review(page,[row(0),row(1),row(2,8,'hard')]).earned,false);
});
test('RTS estimate ignores ramps failures Easy and unsupported movements',()=>{
 assert.ok(B.estimate(row(0,8,'hard'),page)>40);
 assert.equal(B.estimate({...row(),purpose:'ramp'},page),null);
 assert.equal(B.estimate({...row(),miss:true},page),null);
 assert.equal(B.estimate(row(0,8,'easy'),page),null);
 assert.equal(B.estimate(row(),{...page,title:'Farmer Carry'}),null);
});
test('equipment aliases preserve caps and declared grids',()=>{
 assert.equal(B.stepUp(40,page,.05),41);assert.equal(B.round(45,40,{...page,availableLoads:[40,50]}),40);
 assert.equal(B.equipment(page).step,1);
});
test('seed is idempotent, creates two main warmups and no accessory warmups',()=>{
 const accessory={...page,id:'B',title:'Curl',exerciseType:'accessory',setTargets:targets.map((t,i)=>({...t,id:`B:set:${i}`}))};
 const session={id:webcrypto.randomUUID(),pages:[page,accessory],logs:{A:{sets:targets.map(t=>({targetId:t.id}))},B:{sets:accessory.setTargets.map(t=>({targetId:t.id}))}}};
 const seeded=B.seed(session,{});
 assert.equal(seeded.logs.A.sets.filter(r=>r.purpose==='ramp').length,2);assert.equal(seeded.logs.B.sets.length,3);
 assert.equal(B.seed(seeded,{}).logs.A.sets.length,5);assert.equal(B.target(page,seeded.logs.A.sets[0],0),'easy');
});
test('recognized cold start is provisional and manual actuals remain untouched',()=>{
 const db={...page,id:'D',title:'Dumbbell Bench Press',equipmentId:'dumbbell',loadConvention:'per_hand',setTargets:targets.map((t,i)=>({...t,id:`D:set:${i}`}))};
 const session={id:'s',pages:[db],logs:{D:{sets:db.setTargets.map(t=>({targetId:t.id}))}}};
 const seeded=B.seed(session,{});assert.equal(seeded.pages[0].workingKg,5);assert.equal(seeded.pages[0].startConfidence,'provisional');
 const actual=row(0,8,'average',18),decision=B.next({page:db,row:actual,nextRow:{targetId:'D:set:1'},index:1,state:{rows:[actual]}});
 assert.equal(actual.kg,18);assert.ok(Number.isFinite(decision.kg));
});
test('history is exercise-specific and averages the latest three fresh estimates',()=>{
 const records={};[40,42,44,46].forEach((kg,i)=>{const r=row(0,6,'hard',kg);records[i]={kind:'set',sessionId:'s'+i,exerciseKey:B.key(page),payload:{page,row:{...r,ordinal:0},sessionStartedAt:i+1}};});
 const h=B.history(records,page);assert.equal(h.sessions,3);assert.ok(h.rolling>44);
 assert.equal(B.history(records,{...page,title:'Bench'}).rolling,null);
});
test('pending AMRAP uses actual first working weight and unresolved sources remain blank',()=>{
 const amrap={id:'A:set:3',purpose:'amrap',reps:null,loadRule:{kind:'first_working_set'},toFailure:false},p={...page,setTargets:[...targets,amrap],setCount:4};
 const first=row(0,8,'average',31);assert.equal(B.next({page:p,row:row(2),nextRow:{targetId:amrap.id},index:3,state:{rows:[first]}}).kg,31);
 assert.equal(B.next({page:p,row:row(2),nextRow:{targetId:amrap.id},index:3,state:{rows:[{...first,miss:true}]}}).kg,null);
});
