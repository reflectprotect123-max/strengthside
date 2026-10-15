import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
const ctx=vm.createContext({crypto:webcrypto});
for(const name of ['training-core','strength-targets','strength-equipment','strength-rts','strength-policy','strength-load','strength-context','strength-brain-core','strength-brain'])vm.runInContext(readFileSync(new URL(`./${name}.js`,import.meta.url),'utf8'),ctx);
const B=ctx.StrengthBrain;
const targets=[0,1,2].map(i=>({id:`A:set:${i}`,purpose:'working',reps:{min:6,max:8},loadRule:{kind:'adaptive'},toFailure:false}));
const page={id:'A',title:'Squat',kind:'lift',logMode:'kg',loadUnit:'kg',loadConvention:'total',setCount:3,targetReps:6,targetRepMax:8,equipmentStepKg:1,minimumKg:0,columns:['reps','weight_kg'],setTargets:targets};
const row=(i=0,reps=8,effort='average',kg=40)=>({id:`r${i}`,targetId:`A:set:${i}`,reps,effort,kg,logged:true,purpose:'working',workingIndex:i});

test('learning context requires canonical identity, keeps tempo and owner separate, and unifies normalized bars',()=>{
 const canonical={...page,exerciseId:'squat',equipmentId:'barbell',tempo:'33x1'};
 const normalized=ctx.StrengthLoad.normalize({value:40,unit:'kg',convention:'barbell_plates',barKg:20,provenance:'explicit'});
 const context=(p=canonical,load=normalized,athleteId='a')=>B.learningContext({athleteId,page:p,load});
 assert.equal(context(),JSON.stringify(['a','squat','barbell','barbell_total','3-3-X-1']));
 assert.equal(context({...canonical,title:'Renamed',loadUnit:'lb',loadConvention:'total',tempo:'3-3-X-1'}),context());
 assert.equal(context(canonical,ctx.StrengthLoad.normalize({value:60,unit:'kg',convention:'barbell_total',barKg:20,provenance:'explicit'})),context());
 assert.equal(context(canonical,ctx.StrengthLoad.normalize({value:60/0.45359237,unit:'lb',convention:'barbell_total',barKg:20,provenance:'explicit'})),context());
 assert.notEqual(context({...canonical,tempo:'20X1'}),context());assert.notEqual(context({...canonical,tempo:null}),context());assert.notEqual(context(canonical,normalized,'b'),context());
 for(const [p,load,owner] of [[page,normalized,'a'],[{...canonical,exerciseId:null},normalized,'a'],[canonical,normalized,null],[{...canonical,equipmentId:''},normalized,'a'],[canonical,{...normalized,externalKg:999},'a'],[canonical,{...normalized,provenance:'ambiguous_legacy',eligible:false},'a']])assert.equal(context(p,load,owner),null);
 assert.equal(normalized.externalKg,60);assert.equal(normalized.rawValue,40);
});
test('legacy history key and facts remain readable independently of the new context',()=>{
 const canonical={...page,exerciseId:'squat',equipmentId:'barbell'};
 assert.equal(B.key(canonical),'squat|barbell|total|kg');
 assert.equal(B.key(page),'squat|default|total|kg');
 const records={old:{id:'old',localRevision:3,kind:'set',sessionId:'past',exerciseKey:B.key(canonical),payload:{contractVersion:2,page:canonical,row:row(0,6,'hard',60),sessionStartedAt:1}}};
 const before=JSON.stringify(records);assert.equal(B.history(records,{...canonical,title:'Renamed'}).sessions,1);assert.equal(JSON.stringify(records),before);
});

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
test('barbell warmups start at the empty bar and leave the work weight in place',()=>{
 const bar={...page,title:'Back Squat',equipmentId:'barbell',loadConvention:'total',minimumKg:20,equipmentStepKg:2.5};
 const cold={id:'s',pages:[bar],logs:{A:{sets:targets.map(t=>({targetId:t.id}))}}};
 const first=B.seed(cold,{});
 assert.equal(first.pages[0].workingKg,0);
 assert.deepEqual(Array.from(first.logs.A.sets,r=>r.kg),[0,0,0,0,0]);
 const prior={id:'old',targetId:'A:set:0',reps:6,effort:'hard',kg:60,logged:true,purpose:'working',ordinal:0};
 const records={old:{kind:'set',sessionId:'past',exerciseKey:B.key(bar),payload:{page:bar,row:prior,sessionStartedAt:1}}};
 const again={id:'s2',pages:[JSON.parse(JSON.stringify(bar))],logs:{A:{sets:targets.map(t=>({targetId:t.id}))}}};
 const seeded=B.seed(again,records);
 assert.equal(seeded.pages[0].workingKg,60);
 assert.deepEqual(Array.from(seeded.logs.A.sets,r=>({purpose:r.purpose,kg:r.kg})),[
  {purpose:'ramp',kg:0},{purpose:'ramp',kg:30},{purpose:'working',kg:60},{purpose:'working',kg:60},{purpose:'working',kg:60}
 ]);
 const rows=seeded.logs.A.sets;
 const held=B.next({page:seeded.pages[0],row:{...rows[0],logged:true,reps:6,effort:'easy',kg:0},nextRow:rows[2],index:2,state:{rows}});
 assert.equal(held.kg,60);
});
test('10/8/6 opens with a heavier bar as the reps come down',()=>{
 const reps=[10,8,6].map((n,i)=>({id:`A:set:${i}`,purpose:'working',reps:{min:n,max:n},loadRule:{kind:'adaptive'},toFailure:false}));
 const wave={...page,title:'Back Squat',equipmentId:'barbell',loadConvention:'total',minimumKg:20,equipmentStepKg:2.5,setTargets:reps,setCount:3,targetReps:10};
 const prior={id:'old',targetId:'A:set:0',reps:10,effort:'average',kg:90,logged:true,purpose:'working',ordinal:0};
 const records={old:{kind:'set',sessionId:'past',exerciseKey:B.key(wave),payload:{page:wave,row:prior,sessionStartedAt:1}}};
 const seeded=B.seed({id:'s',pages:[wave],logs:{A:{sets:reps.map(t=>({targetId:t.id}))}}},records);
 assert.equal(seeded.pages[0].workingKg,90);
 assert.deepEqual(Array.from(seeded.logs.A.sets,r=>r.kg),[0,45,90,95,105]);
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
