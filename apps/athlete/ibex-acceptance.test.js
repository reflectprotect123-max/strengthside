import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {webcrypto} from 'node:crypto';
import vm from 'node:vm';

const here=dirname(fileURLToPath(import.meta.url));
const ctx=vm.createContext({crypto:webcrypto,S:{accountId:'athlete'},console});
for(const name of ['training-core','strength-targets','strength-equipment','strength-rts','strength-policy','strength-load','strength-context','strength-learning','strength-replay','strength-brain-core','strength-notes','strength-percent','strength-brain','session']) {
  vm.runInContext(readFileSync(join(here,`${name}.js`),'utf8'),ctx);
}
const B=ctx.StrengthBrain,H=ctx.HybridSession,N=ctx.StrengthNotes,E=ctx.StrengthEquipment,P=ctx.StrengthPercent;
const targets=(n=3)=>Array.from({length:n},(_,i)=>({id:`A:set:${i}`,purpose:'working',reps:{min:6,max:8},loadRule:{kind:'adaptive'},toFailure:false}));
const bare=title=>({id:'A',title,kind:'lift',logMode:'kg',columns:['reps','weight_kg'],setCount:3,setTargets:targets()});
function seedLift(title,extra={}) {
  const page={...bare(title),...extra};
  return B.seed({id:webcrypto.randomUUID(),pages:[page],logs:{A:{sets:page.setTargets.map(t=>({targetId:t.id}))}}},extra.records||{});
}
function record(page,row) {
  return {id:'old',localRevision:1,deleted:false,kind:'set',sessionId:'past',exerciseKey:B.key(page),payload:{contractVersion:3,ownerId:'athlete',completed:true,page,row:{...row,miss:false,workingIndex:0,ordinal:0},normalizedLoad:ctx.StrengthLoad.fromPage({page,value:row.kg,provenance:'explicit'}),sessionStartedAt:1}};
}

test('AC1 Incline Bench, Deficit Back Rack Lunge and DB RDL prefill kg on first exposure',()=>{
 for(const title of ['Incline Bench','Deficit Back Rack Lunge','DB RDL']) {
  const seeded=seedLift(title);
  assert.equal(typeof seeded.pages[0].workingKg,'number',title);
  assert.ok(Number.isFinite(seeded.pages[0].workingKg),title);
  const work=seeded.logs.A.sets.filter(r=>r.purpose==='working');
  assert.ok(work.every(r=>r.kg!=null),title);
 }
});

test('AC2 brain picks a conservative start with no history and never leaves kg blank',()=>{
 const seeded=seedLift('Romanian Deadlift');
 assert.equal(seeded.pages[0].startConfidence,'provisional');
 assert.equal(typeof seeded.pages[0].workingKg,'number');
 assert.notEqual(seeded.pages[0].workingKg,null);
 const unknown=E.starter(E.apply({title:'Cable Row'}));
 assert.equal(typeof unknown.kg,'number');
});

test('AC3 two ramp rows on mains and rampCount is honoured',()=>{
 const two=seedLift('Incline Bench');
 assert.equal(two.logs.A.sets.filter(r=>r.purpose==='ramp').length,2);
 const three=seedLift('Incline Bench',{rampCount:3});
 assert.equal(three.logs.A.sets.filter(r=>r.purpose==='ramp').length,3);
 const none=seedLift('Incline Bench',{rampCount:0});
 assert.equal(none.logs.A.sets.filter(r=>r.purpose==='ramp').length,0);
});

test('AC4 Easy raises ramp 2, Hard drops about 90%, working sets resize after the last ramp',()=>{
 const page={...bare('Incline Bench'),equipmentId:'barbell',loadConvention:'total',loadUnit:'kg',minimumKg:20,equipmentStepKg:2.5,workingKg:80};
 const easy=B.next({page,row:{purpose:'ramp',logged:true,reps:6,kg:20,effort:'easy'},nextRow:{purpose:'ramp',kg:20},index:1,state:{rows:[]}});
 assert.ok(easy.kg>20,`Easy ramp should raise, got ${easy.kg}`);
 const hard=B.next({page,row:{purpose:'ramp',logged:true,reps:6,kg:100,effort:'hard'},nextRow:{purpose:'ramp',kg:100},index:1,state:{rows:[]}});
 assert.ok(hard.kg<=90&&hard.kg>=80,`Hard ramp should drop ~90, got ${hard.kg}`);
 const work=B.next({page,row:{purpose:'ramp',logged:true,reps:6,kg:40,effort:'easy'},nextRow:{purpose:'working',kg:80},index:2,state:{rows:[]}});
 assert.equal(work.kg,80);
});

test('AC5 history matches across coach vs library ids and populates Est 1RM / Last',()=>{
 const prior={...bare('Incline Bench'),exerciseId:'ex_library_bench',title:'Incline Bench',equipmentId:'barbell',loadConvention:'total',loadUnit:'kg',minimumKg:20,equipmentStepKg:2.5};
 const current={...prior,exerciseId:'coach-uuid-bench'};
 const records={old:record(prior,{id:'old',targetId:'A:set:0',reps:6,effort:'average',kg:60,logged:true,purpose:'working'})};
 const hist=B.history(records,current);
 assert.ok(hist.latest,JSON.stringify(hist));
 assert.ok(hist.latest.rows.some(r=>r.kg===60));
 assert.ok(hist.rolling>0||hist.freshE1rm>0||hist.latest.nextKg===60);
 const seeded=B.seed({id:'s',pages:[current],logs:{A:{sets:targets().map(t=>({targetId:t.id}))}}},records);
 assert.equal(seeded.pages[0].workingKg,60);
});

test('AC6 coach 1RM seeds the start weight',()=>{
 const seeded=seedLift('Incline Bench',{notes:['70% of 1RM 100kg']});
 assert.equal(seeded.pages[0].workingKg,70);
});

test('AC7 percent straight: set 1 is the bottom, slider clamps, misses may go below',()=>{
 const p={...bare('Incline Bench'),equipmentId:'machine',minimumKg:0,equipmentStepKg:1,notes:['4 x 8 @ 63-68% (RPE 6)'],oneRm:100,setCount:4,setTargets:targets(4)};
 const rx=P.normalize(p);
 assert.equal(P.workingKgs({page:p,rx,oneRm:100})[0],63);
 const seeded=B.seed({id:'s',pages:[p],logs:{A:{sets:p.setTargets.map(t=>({targetId:t.id}))}}},{});
 const first=seeded.logs.A.sets.find(r=>r.purpose==='working');
 assert.equal(first.kg,63);
 const miss=B.next({page:p,row:{...first,logged:true,miss:true,kg:63,effort:null,purpose:'working',workingIndex:0},nextRow:{purpose:'working',workingIndex:1},index:1,state:{rows:[]}});
 assert.ok(miss.kg<63);
});

test('AC8 percent build: final 1-2 sets land inside the range',()=>{
 const p={...bare('Incline Bench'),equipmentId:'machine',minimumKg:0,equipmentStepKg:1,notes:['5 x 5 @ 72-77% (RPE 8) build over the 5 sets'],oneRm:100,setCount:5,setTargets:targets(5)};
 const kgs=P.workingKgs({page:p,rx:P.normalize(p),oneRm:100});
 assert.ok(kgs.at(-2)>=72&&kgs.at(-2)<=77);
 assert.ok(kgs.at(-1)>=72&&kgs.at(-1)<=77);
 assert.ok(kgs[0]<72);
});

test('AC9 ramps warm up to the range bottom; next session starts where the athlete finished',()=>{
 const p={...bare('Incline Bench'),equipmentId:'machine',minimumKg:0,equipmentStepKg:1,notes:['4 x 8 @ 63-68% (RPE 6)'],oneRm:100,setCount:4,setTargets:targets(4)};
 assert.equal(P.rampTargetKg({page:p,rx:P.normalize(p),oneRm:100}),63);
 const next=P.workingKgs({page:p,rx:P.normalize(p),oneRm:100,history:{latest:{rows:[{purpose:'working',logged:true,kg:66}]}}});
 assert.equal(next[0],66);
});

test('AC10 back-off / drop is a percent of the top set',()=>{
 const p={...bare('Incline Bench'),equipmentId:'machine',minimumKg:0,equipmentStepKg:1,pctLow:90,pctHigh:92,percentBasis:'top_set',setTargets:[
  {id:'A:set:0',purpose:'working',reps:{min:2,max:2},loadRule:{kind:'adaptive'},toFailure:false,pctLow:90,pctHigh:92},
  {id:'A:set:1',purpose:'working',reps:{min:8,max:8},loadRule:{kind:'adaptive'},toFailure:false,pctLow:65,setRole:'drop',percentBasis:'top_set'},
 ]};
 const out=P.adjust({page:p,row:{kg:90,effort:'average',logged:true,purpose:'working',workingIndex:0},nextRow:{purpose:'working',workingIndex:1},index:1,state:{rows:[{purpose:'working',logged:true,kg:90}]}});
 assert.equal(out.kg,58);
});

test('AC11 per-set RPE target is mapped for the slider label',()=>{
 const page={...bare('Incline Bench'),targetEfforts:['easy','average','hard'],setTargets:targets().map((t,i)=>({...t,effort:['easy','average','hard'][i]}))};
 assert.equal(B.target(page,{purpose:'working',workingIndex:0},0),'easy');
 assert.equal(B.target(page,{purpose:'working',workingIndex:1},1),'average');
 assert.equal(B.target(page,{purpose:'working',workingIndex:2},2),'hard');
});

test('AC12 prescribed rest including notes is applied automatically',()=>{
 const s=H.startSession({date:'2026-10-24',plan:{blocks:[{kind:'lift',letter:'A',title:'Incline Bench',setCount:3,notes:['Rest 60s']}]}});
 const bench=s.pages.find(p=>p.title==='Incline Bench');
 assert.equal(bench.restSec,60);
 assert.equal(s.restChoices[bench.id],60000);
});

test('AC13 supersets alternate as one page with no rest between',()=>{
 const s=H.startSession({date:'2026-10-24',plan:{blocks:[
  {kind:'lift',letter:'B',title:'DB RDL',setCount:3,notes:['Superset with Deficit Back Rack Lunge']},
  {kind:'lift',letter:'C',title:'Deficit Back Rack Lunge',setCount:3,notes:['Superset with DB RDL']},
 ]}});
 const pair=s.pages.find(p=>p.logMode==='superset');
 assert.ok(pair&&pair.id);assert.equal(pair.restSec,0);
 assert.equal(pair.members.map(m=>m.title).join(','),'DB RDL,Deficit Back Rack Lunge');
});

test('AC15 bodyweight and timed moves have no kg/1RM and seconds are prefilled',()=>{
 const s=H.startSession({date:'2026-10-24',plan:{blocks:[
  {kind:'lift',letter:'D',title:'Foam Roller Plank Rollout',notes:['3 x 45 sec']},
  {kind:'lift',letter:'E',title:'Jump Squat',setCount:3},
 ]}});
 const plank=s.pages.find(p=>p.title==='Foam Roller Plank Rollout');
 const jump=s.pages.find(p=>p.title==='Jump Squat');
 assert.ok(!plank.columns.includes('weight_kg'));assert.equal(plank.prescribed,'45');assert.ok(plank.columns.includes('seconds'));
 assert.ok(!jump.columns.includes('weight_kg'));assert.equal(plank.weighted,false);
});

test('AC16 lunge and RDL expose a kg field',()=>{
 const s=H.startSession({date:'2026-10-24',plan:{blocks:[
  {kind:'lift',letter:'B',title:'DB RDL',setCount:3},
  {kind:'lift',letter:'C',title:'Deficit Back Rack Lunge',setCount:3},
 ]}});
 assert.ok(s.pages.find(p=>p.title==='DB RDL').columns.includes('weight_kg'));
 assert.ok(s.pages.find(p=>p.title==='Deficit Back Rack Lunge').columns.includes('weight_kg'));
});

test('AC17 set list layout keeps the body scrolling above a fixed action bar',()=>{
 const css=readFileSync(join(here,'logger.css'),'utf8');
 assert.match(css,/\.log-body\s*\{[^}]*overflow-y:\s*auto/s);
 assert.match(css,/\.log-bar\s*\{[^}]*flex-shrink:\s*0/s);
 assert.match(css,/\.log-totals\s*\{[^}]*flex-shrink:\s*0/s);
});

test('AC18 header KG is volume (kg × reps), not a raw load sum',()=>{
 let s=H.startSession({date:'2026-10-24',plan:{blocks:[{kind:'lift',letter:'B',title:'Incline Bench',prescription:'4 x 8'}]},letter:'B'});
 s=H.logSet(s,0,{kg:60,reps:8,effort:'average'});
 s=H.logSet(s,1,{kg:60,reps:8,effort:'average'});
 assert.equal(H.totals(s).kg,960);
});

test('AC19 em dash is not garbled',()=>{
 assert.equal(N.decode('Ibex â€” Sat 24 Oct'),'Ibex — Sat 24 Oct');
 const s=H.startSession({date:'2026-10-24',plan:{title:'Ibex â€” Sat 24 Oct',blocks:[]}});
 assert.equal(s.title,'Ibex — Sat 24 Oct');
});
