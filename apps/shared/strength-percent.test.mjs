import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const root={};
for(const name of ['strength-equipment','strength-notes','strength-percent']) {
  vm.runInNewContext(readFileSync(new URL(`./${name}.js`,import.meta.url),'utf8'),{window:root});
}
const P=root.StrengthPercent;
const page=(extra={})=>({id:'A',title:'Incline Bench',kind:'lift',equipmentId:'machine',loadConvention:'total',loadUnit:'kg',minimumKg:0,equipmentStepKg:1,setCount:4,...extra});

test('AC7 straight: first set is the bottom of the range and later sets stay clamped',()=>{
 const p=page({notes:['4 x 8 @ 63-68% (RPE 6)'],oneRm:100,setCount:4});
 const rx=P.normalize(p);
 assert.equal(rx.mode,'straight');assert.equal(rx.pctLow,63);assert.equal(rx.pctHigh,68);
 const kgs=P.workingKgs({page:p,rx,oneRm:100});
 assert.equal(kgs[0],63);
 assert.ok(kgs.slice(0,4).every(kg=>kg===63));
 const up=P.adjust({page:p,row:{kg:63,effort:'very_easy',logged:true,purpose:'working',workingIndex:0},nextRow:{purpose:'working',workingIndex:1},index:1,history:{freshE1rm:100}});
 assert.ok(up.kg>63&&up.kg<=68);
 const hold=P.adjust({page:p,row:{kg:63,effort:'easy',logged:true,purpose:'working',workingIndex:0},nextRow:{purpose:'working',workingIndex:1},index:1,history:{freshE1rm:100}});
 assert.equal(hold.kg,63);
 const down=P.adjust({page:p,row:{kg:66,effort:'hard',logged:true,purpose:'working',workingIndex:0},nextRow:{purpose:'working',workingIndex:1},index:1,history:{freshE1rm:100}});
 assert.ok(down.kg>=63&&down.kg<66);
 const miss=P.adjust({page:p,row:{kg:63,miss:true,logged:true,purpose:'working',workingIndex:0,reps:3},nextRow:{purpose:'working',workingIndex:1},index:1,history:{freshE1rm:100}});
 assert.ok(miss.kg<63);
});

test('AC8 build: final 1-2 working sets land inside the range',()=>{
 const p=page({notes:['5 x 5 @ 72-77% (RPE 8)','build over the 5 sets'],setCount:5,oneRm:100});
 const rx=P.normalize(p);
 assert.equal(rx.mode,'build');
 const kgs=P.workingKgs({page:p,rx,oneRm:100});
 assert.equal(kgs.length,5);
 assert.ok(kgs[0]<72,`first set ${kgs[0]} should be below 72`);
 assert.ok(kgs[1]<72);
 assert.ok(kgs[2]<72);
 assert.ok(kgs[3]>=72&&kgs[3]<=77);
 assert.ok(kgs[4]>=72&&kgs[4]<=77);
});

test('AC8 per-set rising percentages are treated as build',()=>{
 const p=page({notes:['Set 1 3 @ 55-60%','Set 2 3 @ 65-70%','Set 3 3 @ 75-80%','Set 4 3 @ 80-85%','Set 5 heavy 3 @ 85-90%'],setCount:5,oneRm:100});
 const rx=P.normalize(p);
 assert.equal(rx.mode,'build');
 const kgs=P.workingKgs({page:p,rx,oneRm:100});
 assert.equal(kgs[0],55);assert.equal(kgs[4],85);
});

test('AC9 ramps target the bottom of the range; next session starts where the athlete finished',()=>{
 const p=page({notes:['4 x 8 @ 63-68% (RPE 6)'],oneRm:100,setCount:4});
 const rx=P.normalize(p);
 assert.equal(P.rampTargetKg({page:p,rx,oneRm:100,firstWorkingKg:63}),63);
 const next=P.workingKgs({page:p,rx,oneRm:100,history:{latest:{rows:[{purpose:'working',logged:true,kg:66}]}}});
 assert.equal(next[0],66);
 const capped=P.workingKgs({page:p,rx,oneRm:100,history:{latest:{rows:[{purpose:'working',logged:true,kg:80}]}}});
 assert.equal(capped[0],68);
 const raised=P.workingKgs({page:p,rx,oneRm:100,history:{latest:{rows:[{purpose:'working',logged:true,kg:50}]}}});
 assert.equal(raised[0],63);
});

test('AC10 back-off and drop sets are a percent of the top set',()=>{
 const p=page({notes:['4x2 @ 90-92% + 1 x 8 at 65% of the top set'],setCount:5,oneRm:100});
 const rx=P.normalize(p);
 assert.equal(rx.sets[4].setRole==='backoff'||rx.sets[4].percentBasis==='top_set'||rx.sets[4].pctLow===65,true);
 const drop=P.adjust({page:{...p,percentBasis:'top_set',pctLow:80,setTargets:[
  {purpose:'working',reps:{min:2,max:2},pctLow:90,pctHigh:92},
  {purpose:'working',reps:{min:8,max:8},pctLow:80,setRole:'drop',percentBasis:'top_set'},
 ]},row:{kg:90,effort:'average',logged:true,purpose:'working',workingIndex:0},nextRow:{purpose:'working',workingIndex:1},index:1,state:{rows:[{purpose:'working',logged:true,kg:90}]}});
 assert.equal(drop.kg,72);
});

test('AC10 unnamed drop seeds 85-90% of the first working set',()=>{
 const p=page({pctLow:90,pctHigh:92,oneRm:100,setCount:2,setTargets:[
  {purpose:'working',reps:{min:2,max:2},pctLow:90,pctHigh:92},
  {purpose:'working',reps:{min:8,max:8},setRole:'drop',percentBasis:'top_set'},
 ]});
 const rx=P.normalize(p);
 const kgs=P.workingKgs({page:p,rx,oneRm:100});
 assert.ok(kgs[1]>=76&&kgs[1]<=81,`got ${kgs[1]}`);
 const unnamed=P.adjust({page:p,row:{kg:90,effort:'average',logged:true,purpose:'working',workingIndex:0},nextRow:{purpose:'working',workingIndex:1},index:1,state:{rows:[{purpose:'working',logged:true,kg:90}]}});
 assert.ok(unnamed.kg>=76&&unnamed.kg<=81,`adjust got ${unnamed.kg}`);
});

test('payload percent fields win over notes and unknown 1RM stays null so the starter can run',()=>{
 const p=page({pctLow:70,pctHigh:75,percentMode:'straight',notes:['4 x 8 @ 63-68%'],setCount:3});
 const rx=P.normalize(p);
 assert.equal(rx.pctLow,70);assert.equal(rx.mode,'straight');
 assert.equal(P.oneRm({page:p,history:{}}),null);
});

test('brain e1RM is preferred to a coach 1RM when both exist',()=>{
 const p=page({oneRm:140,notes:['70% of 1RM 140kg']});
 assert.equal(P.oneRm({page:p,history:{freshE1rm:100}}),100);
 assert.equal(P.oneRm({page:p,history:{}}),140);
});

test('percent of another lift uses the named 1RM',()=>{
 const p=page({notes:['30-40% of your back squat 1RM'],basisOneRm:200,setCount:3});
 const rx=P.normalize(p);
 assert.equal(rx.basis,'other_lift');assert.match(rx.basisLift,/back squat/i);
 assert.equal(P.oneRm({page:p,history:{}}),200);
 assert.equal(P.toKg(30,200,p),60);
});
