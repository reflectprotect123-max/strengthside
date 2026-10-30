import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
const ctx=vm.createContext({crypto:webcrypto,S:{accountId:'athlete'}});
for(const name of ['training-core','strength-targets','strength-equipment','strength-rts','strength-policy','strength-load','strength-context','strength-learning','strength-replay','strength-brain-core','strength-brain'])vm.runInContext(readFileSync(new URL(`./${name}.js`,import.meta.url),'utf8'),ctx);
const B=ctx.StrengthBrain;
const targets=[0,1,2].map(i=>({id:`A:set:${i}`,purpose:'working',reps:{min:6,max:8},loadRule:{kind:'adaptive'},toFailure:false}));
const page={exerciseId:'squat',equipmentId:'machine',id:'A',title:'Squat',kind:'lift',logMode:'kg',loadUnit:'kg',loadConvention:'total',setCount:3,targetReps:6,targetRepMax:8,equipmentStepKg:1,minimumKg:0,columns:['reps','weight_kg'],setTargets:targets};
const row=(i=0,reps=8,effort='average',kg=40)=>({id:`r${i}`,targetId:`A:set:${i}`,reps,effort,kg,logged:true,miss:false,purpose:'working',workingIndex:i,ordinal:i});

function record(p,r,{id='old',sessionId='past',startedAt=1}={}){
 return {id,localRevision:1,deleted:false,kind:'set',sessionId,exerciseKey:B.key(p),payload:{contractVersion:3,ownerId:'athlete',completed:true,page:p,row:{...r,miss:false,workingIndex:0,ordinal:0},normalizedLoad:ctx.StrengthLoad.fromPage({page:p,value:r.kg,provenance:'explicit'}),sessionStartedAt:startedAt}};
}

test('learning context requires canonical identity, keeps tempo and owner separate, and unifies normalized bars',()=>{
 const canonical={...page,exerciseId:'squat',equipmentId:'barbell',tempo:'33x1'};
 const normalized=ctx.StrengthLoad.normalize({value:40,unit:'kg',convention:'barbell_plates',barKg:20,provenance:'explicit'});
 const context=(p=canonical,load=normalized,athleteId='a')=>B.learningContext({athleteId,page:p,load});
 assert.equal(context(),JSON.stringify(['a','squat','barbell','barbell_total','3-3-X-1']));
 assert.equal(context({...canonical,title:'Renamed',loadUnit:'lb',loadConvention:'total',tempo:'3-3-X-1'}),context());
 assert.equal(context(canonical,ctx.StrengthLoad.normalize({value:60,unit:'kg',convention:'barbell_total',barKg:20,provenance:'explicit'})),context());
 assert.equal(context(canonical,ctx.StrengthLoad.normalize({value:60/0.45359237,unit:'lb',convention:'barbell_total',barKg:20,provenance:'explicit'})),context());
 assert.notEqual(context({...canonical,tempo:'20X1'}),context());assert.notEqual(context({...canonical,tempo:null}),context());assert.notEqual(context(canonical,normalized,'b'),context());
 assert.match(context({...canonical,exerciseId:null}),/title:back_squat|title:squat/);
 for(const [p,load,owner] of [[canonical,normalized,null],[{...canonical,equipmentId:''},normalized,'a'],[canonical,{...normalized,externalKg:999},'a'],[canonical,{...normalized,provenance:'ambiguous_legacy',eligible:false},'a']])assert.equal(context(p,load,owner),null);
 assert.equal(normalized.externalKg,60);assert.equal(normalized.rawValue,40);
});
test('legacy history key and facts remain readable independently of the new context',()=>{
 const canonical={...page,exerciseId:'squat',equipmentId:'barbell',minimumKg:20};
 assert.equal(B.key(canonical),'squat|barbell|total|kg');
 assert.equal(B.key(page),'squat|machine|total|kg');
 const records={old:{id:'old',localRevision:3,kind:'set',sessionId:'past',exerciseKey:B.key(canonical),payload:{contractVersion:2,page:canonical,row:row(0,6,'hard',60),sessionStartedAt:1}}};
 const before=JSON.stringify(records);assert.equal(B.history(records,{...canonical,title:'Renamed'}).sessions,0);assert.equal(JSON.stringify(records),before);
});

test('adapter delegates per-set range progression to the canonical core',()=>{
 assert.equal(B.review(page,[row(0,6),row(1,6),row(2,6)]).nextKg,40);
 assert.equal(B.review(page,[row(0),row(1),row(2)]).nextKg,40,'no rep-range progression');
 assert.equal(B.review(page,[row(0,8,'easy'),row(1,8,'easy'),row(2,8,'easy')]).nextKg,41);
 assert.equal(B.review(page,[row(0,8,'easy'),row(1,8,'easy'),row(2,8,'hard')]).earned,false);
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
 const prior={...row(0,6,'average',60),id:'old'};
 const records={old:record(bar,prior)};
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
 const records={old:record(wave,prior)};
 const seeded=B.seed({id:'s',pages:[wave],logs:{A:{sets:reps.map(t=>({targetId:t.id}))}}},records);
 assert.equal(seeded.pages[0].workingKg,90);
 assert.deepEqual(Array.from(seeded.logs.A.sets,r=>r.kg),[0,45,90,95,100]);
});
test('recognized cold start is provisional and manual actuals remain untouched',()=>{
 const db={...page,id:'D',title:'Dumbbell Bench Press',equipmentId:'dumbbell',loadConvention:'per_hand',setTargets:targets.map((t,i)=>({...t,id:`D:set:${i}`}))};
 const session={id:'s',pages:[db],logs:{D:{sets:db.setTargets.map(t=>({targetId:t.id}))}}};
 const seeded=B.seed(session,{});assert.equal(seeded.pages[0].workingKg,5);assert.equal(seeded.pages[0].startConfidence,'provisional');
 const actual=row(0,8,'average',18),decision=B.next({page:db,row:actual,nextRow:{targetId:'D:set:1'},index:1,state:{rows:[actual]}});
 assert.equal(actual.kg,18);assert.ok(Number.isFinite(decision.kg));
});
test('history replays all canonical first-set facts and isolates exercise identity and tempo',()=>{
 const records={};[40,42,44,46].forEach((kg,i)=>{records[i]=record(page,row(0,6,'hard',kg),{id:'r'+i,sessionId:'s'+i,startedAt:i+1});});
 const h=B.history(records,page);assert.equal(h.sessions,4);assert.ok(h.rolling>46);assert.equal(h.latest.rows[0].kg,46);
 assert.equal(B.history(records,{...page,exerciseId:'bench'}).rolling,null);
 assert.equal(B.history(records,{...page,tempo:'33X1'}).rolling,null);
 assert.equal(B.history(records,{...page,title:'Renamed squat'}).rolling,h.rolling);
 assert.equal(h.evidenceFingerprint,ctx.StrengthReplay.replay(Object.values(records),{ownerId:'athlete',contextKey:h.contextKey}).evidenceFingerprint);
});
test('pending AMRAP uses actual first working weight and unresolved sources remain blank',()=>{
 const amrap={id:'A:set:3',purpose:'amrap',reps:null,loadRule:{kind:'first_working_set'},toFailure:false},p={...page,setTargets:[...targets,amrap],setCount:4};
 const first=row(0,8,'average',31);assert.equal(B.next({page:p,row:row(2),nextRow:{targetId:amrap.id},index:3,state:{rows:[first]}}).kg,31);
 assert.equal(B.next({page:p,row:row(2),nextRow:{targetId:amrap.id},index:3,state:{rows:[{...first,miss:true}]}}).kg,null);
});
test('Easy-only finished range evidence raises a later seed one step without inventing an e1RM',()=>{
 const prior=row(0,6,'easy',40),records={old:record(page,prior)};
 const h=B.history(records,page);assert.equal(h.accepted,0);assert.equal(h.rolling,null);
 const seeded=B.seed({id:'next',pages:[page],logs:{A:{sets:targets.map(t=>({targetId:t.id}))}}},records);
 assert.equal(seeded.pages[0].workingKg,41);
});
test('Easy-only calibration advances when next week asks fewer reps without inventing a precise RIR',()=>{
 const records={old:record(page,row(0,6,'easy',40))};
 const next={...page,setTargets:targets.map(t=>({...t,reps:{min:5,max:5}}))};
 const seeded=B.seed({id:'next',pages:[next],logs:{A:{sets:next.setTargets.map(t=>({targetId:t.id}))}}},records);
 assert.equal(seeded.pages[0].workingKg,41);
 assert.equal(B.history(records,page).rolling,null);
});
test('between-session Easy calibration can take one dumbbell rung when 6 of 6–8 is clearly easy',()=>{
 const db={...page,title:'Dumbbell Bench Press',equipmentId:'dumbbell',loadConvention:'per_hand',minimumKg:1,equipmentStepKg:undefined};
 const records={old:record(db,row(0,6,'easy',10))};
 const seeded=B.seed({id:'next',pages:[db],logs:{A:{sets:targets.map(t=>({targetId:t.id}))}}},records);
 assert.equal(seeded.pages[0].workingKg,12);
 assert.equal(B.history(records,db).rolling,null);
});
test('a zero-rep miss reduces the next seed after the prescription changes; Max Effort with all reps holds',()=>{
 const next={...page,setTargets:targets.map(t=>({...t,reps:{min:5,max:5}}))};
 for(const [prior,low] of [[{...row(0,0,null,40),miss:true},true],[row(0,6,'max_effort',40),false]]){
  const records={old:record(page,prior)};records.old.payload.row.miss=prior.miss;
  const seeded=B.seed({id:'next',pages:[next],logs:{A:{sets:next.setTargets.map(t=>({targetId:t.id}))}}},records);
  assert.equal(seeded.pages[0].workingKg<40,low);
 }
});

test('later ordinary Hard or failed sets veto an Easy-first automatic increase',()=>{
 for(const [last,want] of [[row(2,6,'hard',42),40],[{...row(2,4,'average',42),miss:true},38],[row(2,6,'max_effort',42),40]]){
  const records={first:record(page,row(0,6,'easy',40))};
  const r=record(page,last,{id:'last'});r.payload.row={...last};records.last=r;
  const h=B.history(records,page);
  assert.equal(h.latest.nextKg,want,'an Easy first set must not overrule later struggle; a miss drops ~5%');
  const seeded=B.seed({id:'next',pages:[page],logs:{A:{sets:targets.map(t=>({targetId:t.id}))}}},records);
  assert.equal(seeded.pages[0].workingKg,want);
  assert.equal(h.accepted,0,'later work must not become shape-fitting evidence');
 }
});

test('a first-set-last AMRAP at failure does not veto ordinary-work progression',()=>{
 const amrap={id:'A:set:3',purpose:'amrap',reps:null,loadRule:{kind:'first_working_set'},toFailure:true};
 const p={...page,setCount:4,setTargets:[...targets,amrap]};
 const records={};
 for(let i=0;i<3;i++){
  const actual=row(i,8,'easy',40),r=record(p,actual,{id:'work-'+i});r.payload.row={...actual};records[r.id]=r;
 }
 const actual={...row(3,3,'max_effort',40),targetId:amrap.id,purpose:'amrap',miss:true};
 const r=record(p,actual,{id:'amrap'});r.payload.row=actual;records[r.id]=r;
 const h=B.history(records,p);assert.equal(h.latest.nextKg,41);assert.equal(h.accepted,0);
});

test('backing off a later comparable load vetoes Easy-first seeding without fitting later work',()=>{
 const records={first:record(page,row(0,8,'easy',40))};
 for(let i=1;i<3;i++){
  const actual=row(i,8,'easy',35-i),r=record(page,actual,{id:'later-'+i});r.payload.row=actual;records[r.id]=r;
 }
 const h=B.history(records,page);assert.equal(h.latest.nextKg,40);assert.equal(h.latest.loadReduced,true);assert.equal(h.accepted,0);
});

test('dumbbell and kettlebell ramps both suggest a load below the work weight',()=>{
 const db={...page,id:'D',title:'Dumbbell Bench Press',equipmentId:'dumbbell',loadConvention:'per_hand',setTargets:targets.map((t,i)=>({...t,id:`D:set:${i}`}))};
 const seeded=B.seed({id:'s',pages:[db],logs:{D:{sets:db.setTargets.map(t=>({targetId:t.id}))}}},{});
 assert.deepEqual(Array.from(seeded.logs.D.sets.filter(r=>r.purpose==='ramp'),r=>r.kg),[3,4]);
 const kb={...page,id:'K',title:'Kettlebell Goblet Squat',equipmentId:'kettlebell',loadConvention:'single',setTargets:targets.map((t,i)=>({...t,id:`K:set:${i}`}))};
 const kbSeed=B.seed({id:'k',pages:[kb],logs:{K:{sets:kb.setTargets.map(t=>({targetId:t.id}))}}},{});
 assert.equal(kbSeed.pages[0].workingKg,6);
 // Real bells: only the 4 kg bell sits below a 6 kg working bell.
 assert.equal(kbSeed.logs.K.sets.filter(r=>r.purpose==='ramp')[0].kg,4);
});
test('a superset member gets the same working kg as the same solo history',()=>{
 const reps=id=>[0,1,2].map(i=>({id:`${id}:set:${i}`,purpose:'working',reps:{min:8,max:8},loadRule:{kind:'adaptive'},toFailure:false}));
 const bench=id=>({exerciseId:'db-bench',equipmentId:'dumbbell',id,letter:id,title:'DB Bench Press',kind:'lift',logMode:'kg',loadUnit:'kg',loadConvention:'per_hand',minimumKg:1,setCount:3,columns:['reps','weight_kg'],setTargets:reps(id)});
 const f1=bench('F1');
 const chin={exerciseId:'chin',id:'F2',letter:'F2',title:'Chin-up',kind:'lift',logMode:'reps',loadUnit:'kg',columns:['reps'],setCount:3,setTargets:reps('F2')};
 const pair={id:'F',letter:'F',title:'DB Bench Press / Chin-up',kind:'lift',logMode:'superset',members:[f1,chin]};
 const solo=bench('G');
 const prior=record(f1,{...row(0,8,'average',24),id:'old'},{id:'old'});
 const records={old:prior};
 const sets=targets=>targets.map(t=>({targetId:t.id}));
 const sup=B.seed({id:'sup',pages:[pair],logs:{F1:{sets:sets(f1.setTargets)},F2:{sets:sets(chin.setTargets)}}},records);
 const alone=B.seed({id:'solo',pages:[solo],logs:{G:{sets:sets(solo.setTargets)}}},records);
 const f1kg=sup.logs.F1.sets.find(r=>r.purpose==='working').kg;
 const gkg=alone.logs.G.sets.find(r=>r.purpose==='working').kg;
 assert.equal(f1kg,gkg);
 assert.equal(typeof f1kg,'number');
});

test('a carry gets no suggested load (athlete enters it) and produces no e1RM',()=>{
 const carry={...page,id:'C',title:'Farmer Carry',equipmentId:'dumbbell',loadConvention:'per_hand',columns:['weight_kg','meters'],setTargets:null,setCount:3};
 const seeded=B.seed({id:'s',pages:[carry],logs:{C:{sets:[{kg:null},{kg:null},{kg:null}]}}},{});
 assert.deepEqual(Array.from(seeded.logs.C.sets,r=>r.kg),[null,null,null]);
 assert.equal(seeded.logs.C.sets.some(r=>r.purpose==='ramp'),false);
 assert.equal(B.estimate({...row(),kg:8},seeded.pages[0]),null);
 const suitcase={...page,id:'S',title:'Suitcase Carry',columns:['weight_kg','meters'],setTargets:null};
 const suit=B.seed({id:'s2',pages:[suitcase],logs:{S:{sets:[{kg:null}]}}},{});
 assert.equal(suit.pages[0].loadConvention,'single');
 assert.equal(suit.logs.S.sets[0].kg,null);
 assert.equal(B.estimate({...row(),kg:8},suit.pages[0]),null);
});
test('missing canonical exercise identity cannot share another unidentified lift history',()=>{
 const unknown={...page,exerciseId:null},records={old:record(unknown,row(0,8,'easy',80))};
 const current={...unknown,title:'Different unidentified press'};
 const h=B.history(records,current);assert.equal(h.latest,null);assert.equal(h.rolling,null);
 const seeded=B.seed({id:'next',pages:[current],logs:{A:{sets:targets.map(t=>({targetId:t.id}))}}},records);
 assert.notEqual(seeded.pages[0].workingKg,81);
});
