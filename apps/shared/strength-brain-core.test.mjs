import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const root={};
for(const name of ['training-core','strength-targets','strength-equipment','strength-rts','strength-policy','strength-brain-core'])
  vm.runInNewContext(readFileSync(new URL(`./${name}.js`,import.meta.url),'utf8'),{window:root});
const B=root.StrengthBrainCore,R=root.StrengthRTS;
const targets=(id,reps)=>reps.map((n,i)=>({id:`${id}:set:${i}`,purpose:'working',reps:{min:n,max:n},loadRule:{kind:'adaptive'},toFailure:false}));
const page=(reps=[10,8,6])=>({id:'a',kind:'lift',logMode:'kg',loadUnit:'kg',loadConvention:'total',equipmentStepKg:1,minimumKg:0,columns:['reps','weight_kg'],setTargets:targets('a',reps)});
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
