import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const root={};
for(const name of ['training-core','strength-targets','strength-equipment','strength-rts','strength-policy','strength-load','strength-context','strength-learning','strength-replay','strength-brain-core'])
  vm.runInNewContext(readFileSync(new URL(`./${name}.js`,import.meta.url),'utf8'),{window:root});
const B=root.StrengthBrainCore,R=root.StrengthRTS;
const targets=(id,reps)=>reps.map((n,i)=>({id:`${id}:set:${i}`,purpose:'working',reps:{min:n,max:n},loadRule:{kind:'adaptive'},toFailure:false}));
const page=(reps=[10,8,6])=>({id:'a',equipmentId:'machine',kind:'lift',logMode:'kg',loadUnit:'kg',loadConvention:'total',equipmentStepKg:1,minimumKg:0,columns:['reps','weight_kg'],setTargets:targets('a',reps)});
const row=(targetId,reps,kg=40,effort='average',extra={})=>({id:'r',targetId,purpose:'working',logged:true,reps,kg,effort,...extra});

test('verified RTS chart retains exact source cells',()=>{
 assert.equal(R.percent(1,10),1);assert.equal(R.percent(12,7),.599);assert.equal(R.percent(11,6.5),.613);
 assert.equal(R.percent(13,7),null);assert.equal(R.percent(5,5),null);
});
test('planned lower reps project once while missed prescribed reps reduce',()=>{
 const p=page(),r=row('a:set:0',10),next={targetId:'a:set:1',purpose:'working'};
 const projected=B.suggest({page:p,row:r,nextRow:next,index:1,state:{freshE1rm:55}});
 assert.ok(projected.kg>=40&&projected.kg<=42);
 const missed=B.suggest({page:p,row:{...r,reps:6,miss:true},nextRow:next,index:1,state:{freshE1rm:55}});
 assert.ok(missed.kg<40);
});
test('one rep is ordinary work and Easy is directional without precise e1RM',()=>{
 const p=page([5,3,1]),easy=row('a:set:0',5,40,'easy');
 assert.equal(B.estimate(easy,p),null);
 assert.equal(B.review(p,[easy]).e1rm,null);
 const next=B.suggest({page:p,row:easy,nextRow:{targetId:'a:set:1'},index:1});
 assert.ok(next.kg>=40);assert.notEqual(next.target,'max_effort');
});
test('high reps remain authored and use a conservative hold',()=>{
 const p=page([20,25]),r=row('a:set:0',20,20,'average');
 assert.equal(B.estimate(r,p),null);
 assert.equal(B.suggest({page:p,row:r,nextRow:{targetId:'a:set:1'},index:1}).kg,20);
});
test('fresh evidence is only first ordinary work and excludes warmup AMRAP holds and carries',()=>{
 const p=page([5]),first=row('a:set:0',5,31,'hard');
 assert.ok(B.review(p,[{...first,purpose:'ramp'},first]).e1rm>0);
 assert.equal(B.estimate({...first,purpose:'amrap'},p),null);
 assert.equal(B.estimate(first,{...p,title:'Farmer Carry'}),null);
 assert.equal(B.estimate(first,{...p,columns:['seconds','weight_kg']}),null);
});
test('ranges earn only when every ordinary target reaches its own upper bound at Average or easier',()=>{
 const p=page([8,8,8]);p.setTargets=p.setTargets.map(t=>({...t,reps:{min:6,max:8}}));
 const six=p.setTargets.map((t,i)=>row(t.id,6,40,'average',{id:`r${i}`}));
 assert.equal(B.review(p,six).earned,false);assert.equal(B.review(p,six).nextKg,40);
 const eight=p.setTargets.map((t,i)=>row(t.id,8,40,'average',{id:`r${i}`}));
 assert.equal(B.review(p,eight).earned,true);assert.equal(B.review(p,eight).nextKg,41);
 assert.equal(B.review(p,eight.map((r,i)=>i===2?{...r,effort:'hard'}:r)).earned,false);
 assert.equal(B.review(p,eight.slice(1)).complete,false);
});
test('zero reps reduce and equipment minimum reports a reason',()=>{
 const p={...page([5,5]),availableLoads:[10,20]};
 const result=B.suggest({page:p,row:row('a:set:0',0,10,null,{miss:true}),nextRow:{targetId:'a:set:1'},index:1});
 assert.equal(result.kg,10);assert.equal(result.reason,'minimum_reached');
});
test('Easy warmup advances exactly one feasible equipment step even on a coarse low load',()=>{
 const p=page([5]);p.setTargets=[{id:'a:warmup:1',purpose:'warmup',reps:{min:5,max:5},loadRule:{kind:'adaptive'},toFailure:false},...p.setTargets];
 const result=B.suggest({page:p,row:{purpose:'ramp',logged:true,reps:5,kg:10,effort:'easy'},nextRow:{targetId:'a:warmup:1',purpose:'ramp'},index:0});
 assert.equal(result.kg,11);assert.equal(result.reason,'warmup_step');
 const coarse={...p,equipmentStepKg:2.5};assert.equal(B.suggest({page:coarse,row:{purpose:'ramp',logged:true,reps:5,kg:10,effort:'easy'},nextRow:{targetId:'a:warmup:1',purpose:'ramp'},index:0}).kg,12.5);
 const ontoWork={page:coarse,row:{purpose:'ramp',logged:true,reps:5,kg:12.5,effort:'easy'},nextRow:{targetId:'a:set:0',purpose:'working'},index:1};
 assert.equal(B.suggest(ontoWork).kg,12.5);
 assert.equal(B.suggest({...ontoWork,nextRow:{...ontoWork.nextRow,kg:40}}).kg,40);
 assert.equal(B.suggest({...ontoWork,page:{...coarse,workingKg:60}}).kg,60);
 assert.equal(B.suggest({...ontoWork,nextRow:{...ontoWork.nextRow,kg:0}}).kg,12.5);
});
test('warmup calibration uses physical performance once and later work supersedes it',()=>{
 const p={...page([10,10,10]),workingKg:90,equipmentId:'barbell',equipmentStepKg:2.5,minimumKg:20,title:'Back Squat'};
 const warm={purpose:'ramp',logged:true,reps:10,kg:100,effort:'average'};
 assert.equal(B.suggest({page:p,row:warm,nextRow:{targetId:'a:set:0',kg:90},index:2}).kg,100);
 assert.equal(B.suggest({page:p,row:{...warm,kg:60},nextRow:{targetId:'a:set:0',kg:90},index:2}).kg,60);
 const eight={...p,setTargets:targets('a',[8,8,8])};
 const projected=B.suggest({page:eight,row:warm,nextRow:{targetId:'a:set:0',kg:100},index:2}).kg;
 assert.equal(projected,102.5); // one rung above this target's plan, physical increase below 10%
 const hardLast=B.suggest({page:eight,row:{...warm,effort:'hard',kg:20},nextRow:{targetId:'a:set:0',purpose:'working',kg:80},index:2});
 assert.ok(hardLast.kg>=70&&hardLast.kg<=75,`Hard last ramp must stay near 90% of planned 80, got ${hardLast.kg}`);
 assert.ok(B.suggest({page:eight,row:{...warm,miss:true},nextRow:{targetId:'a:set:0',kg:100},index:2}).kg<100);
 const hard=row('a:set:0',10,40,'hard');
 assert.ok(B.suggest({page:p,row:hard,nextRow:{targetId:'a:set:1',kg:90},index:3,state:{rows:[warm,hard]}}).kg<40);
});
test('a finished set moves the next rep target onto the same chart load',()=>{
 const wave={...page([10,8,6]),workingKg:90,equipmentId:'barbell',equipmentStepKg:2.5,minimumKg:20,title:'Back Squat'};
 const done={targetId:'a:set:0',purpose:'working',logged:true,reps:10,kg:90,effort:'average'};
 assert.equal(B.suggest({page:wave,row:done,nextRow:{targetId:'a:set:1',purpose:'working',kg:95},index:1,state:{rows:[done]}}).kg,95);
 const light={...done,kg:80};
 assert.equal(B.suggest({page:wave,row:light,nextRow:{targetId:'a:set:1',purpose:'working',kg:95},index:1,state:{rows:[light]}}).kg,85);
});
test('AMRAP references actual first working load and never mutates it',()=>{
 const p=page([10]);p.setTargets.push({id:'a:set:1',purpose:'amrap',reps:null,loadRule:{kind:'first_working_set'},toFailure:false});
 const first=row('a:set:0',10,31,'average'),result=B.suggest({page:p,row:first,nextRow:{targetId:'a:set:1'},index:1,state:{rows:[{purpose:'ramp',logged:true,kg:10},first]}});
 assert.equal(result.kg,31);assert.equal(first.kg,31);
});
test('learning is idempotent and blends unique eligible exposures',()=>{
 const one=B.learn({}, {estimate:50,sourceSignature:'s1'}),duplicate=B.learn(one,{estimate:80,sourceSignature:'s1'});
 assert.deepEqual(duplicate,one);const two=B.learn(one,{estimate:60,sourceSignature:'s2'});
 assert.equal(two.exposures,2);assert.equal(two.freshE1rm,51);assert.equal(two.lastSourceSignature,'s2');
});

test('physical bar load is counted once and missing load never becomes zero',()=>{
 const p={...page([5,5]),equipmentId:'barbell',minimumKg:20,equipmentStepKg:2.5};
 const r=row('a:set:0',5,0,'average');
 assert.ok(B.estimate(r,p)>20);
 for(const kg of [null,undefined,'',true])assert.equal(B.suggest({page:p,row:{...r,kg},nextRow:{targetId:'a:set:1'},index:1}).kg,null);
});
test('populated future weights cannot bypass physical guards or override Hard with a warmup floor',()=>{
 const p={...page([10,6]),equipmentId:'machine'};const r=row('a:set:0',10,40,'average');
 const next={targetId:'a:set:1',purpose:'working',kg:42};
 assert.ok(B.suggest({page:p,row:r,nextRow:next,index:1,state:{freshE1rm:100,rows:[r]}}).kg<=43);
 const same={...p,setTargets:targets('a',[6,6])};
 const hard=row('a:set:0',6,40,'hard');
 assert.ok(B.suggest({page:same,row:hard,nextRow:{targetId:'a:set:1',kg:40},index:1,state:{rows:[{purpose:'ramp',logged:true,kg:100,reps:6,effort:'average'},hard]}}).kg<40);
});
test('minimum equipment load escapes Easy deadlock and bodyweight has no fake external-load e1RM',()=>{
 const p={...page([5,5]),equipmentId:'barbell',minimumKg:20,equipmentStepKg:2.5};
 assert.equal(B.suggest({page:p,row:row('a:set:0',5,0,'easy'),nextRow:{targetId:'a:set:1'},index:1}).kg,2.5);
 assert.equal(B.estimate(row('a:set:0',5,20,'average'),{...p,equipmentId:'bodyweight',title:'Weighted Dip'}),null);
});

test('reducing load on comparable work cannot earn a heavier session even when all reps are completed',()=>{
 for(const reps of [[8,8,8],[10,8,6]]){
  const p=page(reps),rows=p.setTargets.map((t,i)=>row(t.id,reps[i],40-i*5,'average'));
  assert.equal(B.review(p,rows).earned,false);
  assert.equal(B.review(p,rows).nextKg,40);
 }
 const p=page([5,8,10]),rows=p.setTargets.map((t,i)=>row(t.id,[5,8,10][i],40-i*3,'average'));
 assert.equal(B.review(p,rows).earned,true,'more reps may legitimately use lighter weights');
});

test('weighted prep and cool-down pages never enter the working-load model',()=>{
 for(const section of ['Warm-Up','Cool-Down']){
  const p={...page([5]),section};
  assert.equal(B.supported(p),false);
  assert.equal(B.estimate(row('a:set:0',5,40,'average'),p),null);
 }
});
