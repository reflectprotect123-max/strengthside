import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const root={};
for(const name of ['training-core','strength-targets'])vm.runInNewContext(readFileSync(new URL(`./${name}.js`,import.meta.url),'utf8'),{window:root});
const T=root.StrengthTargets;
const plain=value=>JSON.parse(JSON.stringify(value));
const ordinary=(min,max=min)=>({purpose:'working',reps:{min,max},loadRule:{kind:'adaptive'},toFailure:false});
const amrap=()=>({purpose:'amrap',reps:null,loadRule:{kind:'first_working_set'},toFailure:false});

test('legacy 3×6–8 expands identical targets with deterministic IDs and no inferred AMRAP',()=>{
 const block={id:'a',setCount:3,repMin:6,repMax:8};
 const targets=plain(T.normalize(block));
 assert.deepEqual(targets.map(t=>t.reps),[{min:6,max:8},{min:6,max:8},{min:6,max:8}]);
 assert.equal(new Set(targets.map(t=>t.id)).size,3);
 assert.deepEqual(targets.map(t=>t.id),['a:set:0','a:set:1','a:set:2']);
 assert.deepEqual(targets,plain(T.normalize(block)));
 assert.ok(targets.every(t=>t.purpose==='working'&&t.loadRule.kind==='adaptive'&&t.toFailure===false));
});
test('authored unequal 5/3/1 targets override legacy expansion',()=>{
 const targets=T.normalize({id:'a',setCount:9,repTarget:'8',setTargets:[ordinary(5),ordinary(3),ordinary(1)]});
 assert.deepEqual(plain(targets.map(t=>t.reps)),[{min:5,max:5},{min:3,max:3},{min:1,max:1}]);
 assert.equal(T.working(targets).length,3);
});
test('shared rep parser supports 20–25 and arbitrary positive integer ranges',()=>{
 assert.deepEqual(plain(T.normalize({id:'a',setCount:1,repTarget:'20–25'})[0].reps),{min:20,max:25});
 assert.deepEqual(plain(T.normalize({id:'a',setCount:1,repTarget:'100'})[0].reps),{min:100,max:100});
 for(const repTarget of ['0','8-6','1.5','bad'])assert.throws(()=>T.normalize({setCount:1,repTarget}),{name:'RangeError'});
});
test('targets survive serialization without mutating deeply frozen authored input',()=>{
 const input={id:'a',setTargets:[{id:'authored',...ordinary(6,8)},amrap()]};
 const before=JSON.stringify(input);
 for(const t of input.setTargets){if(t.reps)Object.freeze(t.reps);Object.freeze(t.loadRule);Object.freeze(t);}
 Object.freeze(input.setTargets);Object.freeze(input);
 const targets=plain(T.normalize(input));
 assert.deepEqual(plain(T.normalize({id:'a',setTargets:JSON.parse(JSON.stringify(targets))})),targets);
 assert.equal(targets[0].id,'authored');assert.equal(JSON.stringify(input),before);
 assert.equal(targets[1].toFailure,false);
 assert.equal(T.normalize({id:'a',setTargets:[ordinary(5),{...amrap(),toFailure:true}]})[1].toFailure,true);
});
test('first-working-reference AMRAP requires preceding ordinary working target',()=>{
 assert.equal(T.validate([amrap()]).valid,false);
 assert.match(T.validate([amrap()]).error,/ordinary working/i);
 assert.throws(()=>T.normalize({setTargets:[amrap()]}),{name:'RangeError'});
 assert.throws(()=>T.normalize({setTargets:[{...amrap(),loadRule:{kind:'adaptive'}}]}),{name:'RangeError'});
 assert.equal(T.validate([ordinary(5),amrap()]).valid,true);
 assert.equal(T.validate([{...ordinary(5),purpose:'warmup'},amrap()]).valid,false);
 assert.equal(T.validate([ordinary(5),amrap(),ordinary(3)]).valid,false);
});
test('invalid authored contracts fail validation with descriptive errors',()=>{
 const invalid=[[],[ordinary(8,6)],[ordinary(0)],[{...ordinary(5),purpose:'ramp'}],[{...ordinary(5),loadRule:{kind:'unknown'}}],[{...amrap(),loadRule:{kind:'adaptive'},reps:{min:1,max:2}}],[{...ordinary(5),toFailure:'true'}],[{id:'same',...ordinary(5)},{id:'same',...ordinary(5)}]];
 for(const targets of invalid){const result=T.validate(targets);assert.equal(result.valid,false);assert.ok(result.error);assert.throws(()=>T.normalize({setTargets:targets}),{name:'RangeError'});}
 for(const setCount of [0,-1,1.5])assert.throws(()=>T.normalize({setCount,repTarget:'5'}),{name:'RangeError'});
 assert.deepEqual(plain(T.validate([ordinary(5)])),{valid:true,error:null});
});
test('row resolution prefers targetId, uses workingIndex and maps ramps to warmup',()=>{
 const page={id:'a',setTargets:[{...ordinary(3),purpose:'warmup'},ordinary(5),ordinary(3),ordinary(1)]};
 const targets=T.normalize(page);
 assert.equal(T.forRow(page,{targetId:targets[2].id,workingIndex:0},0).id,targets[2].id);
 assert.equal(T.forRow(page,{workingIndex:2},0).id,targets[3].id);
 assert.equal(T.forRow(page,{purpose:'ramp',workingIndex:0,reps:5},0).purpose,'warmup');
 assert.equal(T.forRow(page,{},0).id,targets[1].id);
 assert.equal(T.forRow(page,{workingIndex:10},0),null);
 assert.equal(T.forRow(page,{targetId:'missing',workingIndex:0},0),null);
 assert.equal(T.working(targets).length,3);
});
test('legacy session page aliases resolve ranges without overriding authored prescriptions',()=>{
 const page={id:'legacy',setCount:3,targetReps:6,targetRepMax:8};
 assert.deepEqual(plain(T.forRow(page,{workingIndex:1},0).reps),{min:6,max:8});
 assert.deepEqual(plain(T.normalize({...page,repTarget:'20-25'})[0].reps),{min:20,max:25});
 assert.deepEqual(plain(T.normalize({...page,repMin:3,repMax:5})[0].reps),{min:3,max:5});
});
test('reference uses actual first ordinary working row only, excluding ramps and AMRAP',()=>{
 const target=amrap();
 assert.equal(T.resolveReference(target,[{purpose:'ramp',logged:true,kg:10},{purpose:'working',logged:true,kg:31}]),31);
 assert.equal(T.resolveReference(target,[{purpose:'warmup',logged:true,kg:10},{purpose:'amrap',logged:true,kg:99},{purpose:'working',logged:true,kg:0}]),0);
 for(const invalid of [{logged:false},{deleted:true},{skipped:true},{miss:true},{kg:-1},{kg:Infinity},{kg:null},{kg:''},{kg:true}]){
  assert.equal(T.resolveReference(target,[{purpose:'working',logged:true,kg:31,...invalid},{purpose:'working',logged:true,kg:50}]),null);
 }
 assert.equal(T.resolveReference(target,[{logged:true,kg:'31'}]),31);
 assert.equal(T.resolveReference(ordinary(5),[{purpose:'working',logged:true,kg:31}]),null);
});
