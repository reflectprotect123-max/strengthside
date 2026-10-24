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
 const page={...bare('Incline Bench'),equipmentId:'barbell',loadConvention:'total',loadUnit:'kg',minimumKg:20,equipmentStepKg:2.5,workingKg:80,barWeightKg:20};
 const easy=B.next({page,row:{purpose:'ramp',logged:true,reps:6,kg:20,effort:'easy'},nextRow:{purpose:'ramp',kg:20},index:1,state:{rows:[]}});
 assert.ok(easy.kg>20,`Easy ramp should raise, got ${easy.kg}`);
 const hard=B.next({page,row:{purpose:'ramp',logged:true,reps:6,kg:100,effort:'hard'},nextRow:{purpose:'ramp',kg:100},index:1,state:{rows:[]}});
 assert.ok(hard.kg<=90&&hard.kg>=80,`Hard ramp should drop ~90, got ${hard.kg}`);
 const work=B.next({page,row:{purpose:'ramp',logged:true,reps:6,kg:40,effort:'easy'},nextRow:{purpose:'working',kg:80},index:2,state:{rows:[]}});
 assert.equal(work.kg,80);
 const hardOntoWork=B.next({page,row:{purpose:'ramp',logged:true,reps:6,kg:20,effort:'hard'},nextRow:{purpose:'working',kg:80},index:2,state:{rows:[]}});
 assert.ok(hardOntoWork.kg>=70&&hardOntoWork.kg<=75,`Hard last ramp must be ~90% of planned 80, not empty bar; got ${hardOntoWork.kg}`);
 assert.ok(hardOntoWork.kg<80);
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
 const unnamed={...bare('Incline Bench'),equipmentId:'barbell',loadConvention:'total',loadUnit:'kg',minimumKg:20,equipmentStepKg:2.5,barWeightKg:20,oneRm:100,pctLow:90,pctHigh:92,setCount:2,setTargets:[
  {id:'A:set:0',purpose:'working',reps:{min:2,max:2},loadRule:{kind:'adaptive'},toFailure:false,pctLow:90,pctHigh:92},
  {id:'A:set:1',purpose:'working',reps:{min:8,max:8},loadRule:{kind:'adaptive'},toFailure:false,setRole:'drop',percentBasis:'top_set'},
 ]};
 const rx=P.normalize(unnamed);
 const kgs=P.workingKgs({page:unnamed,rx,oneRm:100});
 assert.ok(kgs[1]>=76&&kgs[1]<=81,`unnamed drop must be 85-90% of 90, got ${kgs[1]}`);
 const seeded=B.seed({id:'s',pages:[unnamed],logs:{A:{sets:unnamed.setTargets.map(t=>({targetId:t.id}))}}},{});
 const drop=seeded.logs.A.sets.filter(r=>r.purpose==='working').at(-1);
 assert.ok(drop.kg>=76&&drop.kg<=81,`seeded drop must be 85-90% of the top set, got ${drop.kg}`);
 assert.notEqual(drop.kg,0);
 assert.notEqual(drop.kg,2.5);
});

test('AC11 per-set RPE target is mapped for the slider label',()=>{
 const page={...bare('Incline Bench'),targetEfforts:['easy','average','hard'],setTargets:targets().map((t,i)=>({...t,effort:['easy','average','hard'][i]}))};
 assert.equal(B.target(page,{purpose:'working',workingIndex:0},0),'easy');
 assert.equal(B.target(page,{purpose:'working',workingIndex:1},1),'average');
 assert.equal(B.target(page,{purpose:'working',workingIndex:2},2),'hard');
});

test('AC12 prescribed rest including notes is applied automatically',()=>{
 const s=H.startSession({date:'2026-10-24',plan:{blocks:[
  {kind:'lift',letter:'A',title:'Incline Bench',setCount:3,notes:['Rest 60s']},
  {kind:'lift',letter:'B',title:'Deficit Back Rack Lunge',setCount:3,notes:['90 seconds rest']},
  {kind:'lift',letter:'C',title:'DB RDL',setCount:3,notes:['Rest: 60']},
 ]}});
 const bench=s.pages.find(p=>p.title==='Incline Bench');
 const lunge=s.pages.find(p=>p.title==='Deficit Back Rack Lunge');
 const rdl=s.pages.find(p=>p.title==='DB RDL');
 assert.equal(bench.restSec,60);
 assert.equal(lunge.restSec,90);
 assert.equal(rdl.restSec,60);
 assert.equal(s.restChoices[bench.id],60000);
 assert.equal(s.restChoices[lunge.id],90000);
 assert.equal(s.restChoices[rdl.id],60000);
 assert.equal(H.restMs(s,lunge),90000);
 assert.equal(H.restMs({restChoices:{}},lunge),90000);
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

test('AC13 Wall Sit + Jump Squat alternate A1/B1/A2/B2 and rest after a round is configurable',()=>{
 const s=H.startSession({date:'2026-10-24',plan:{blocks:[
  {kind:'lift',letter:'A',title:'Wall Sit',setCount:3,notes:['Superset with Jump Squat'],restSec:45},
  {kind:'lift',letter:'B',title:'Jump Squat',setCount:3,notes:['Superset with Wall Sit']},
 ]}});
 const pair=s.pages.find(p=>p.logMode==='superset');
 assert.ok(pair,'expected a shared superset page');
 assert.equal(pair.restSec,45);
 const t0=H.supersetTurn(s,pair);
 assert.equal(t0.label,'A1');
 assert.equal(t0.member.title,'Wall Sit');
 assert.equal(t0.restAfterRound,false);
 let next=H.logSet(s,0,{reps:30,effort:'average'},t0.member.id);
 const t1=H.supersetTurn(next,pair);
 assert.equal(t1.label,'B1');
 assert.equal(t1.member.title,'Jump Squat');
 next=H.logSet(next,0,{reps:8,effort:'average'},t1.member.id);
 assert.equal(H.justFinishedRound(next,pair,t1.member.id,0),true);
 const t2=H.supersetTurn(next,pair);
 assert.equal(t2.label,'A2');
 assert.equal(t2.member.title,'Wall Sit');
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

test('AC18 empty-bar sets count bar weight in header volume',()=>{
 let s=H.startSession({date:'2026-10-24',plan:{blocks:[{kind:'lift',letter:'B',title:'Incline Bench',prescription:'3 x 5'}]},letter:'B'});
 s=H.logSet(s,0,{kg:0,reps:5,effort:'average'});
 assert.equal(H.totals(s).kg,100);
 s=H.logSet(s,1,{kg:80,reps:5,effort:'average'});
 assert.equal(H.totals(s).kg,500);
});

test('Warm-Up cardio and bodyweight items do not get a kg box',()=>{
 const s=H.startSession({date:'2026-10-24',plan:{blocks:[
  {kind:'lift',letter:'U',title:'Row 3x180 sec',section:'Warm-Up',notes:['3 x 180 sec']},
  {kind:'lift',letter:'V',title:'Bodyweight Squat',section:'Warm-Up',setCount:2},
  {kind:'lift',letter:'W',title:'Row',section:'Warm-Up',notes:['3 x 180 sec']},
 ]}});
 for(const title of ['Row 3x180 sec','Bodyweight Squat','Row']) {
  const page=s.pages.find(p=>p.title===title);
  assert.ok(page,title);
  assert.ok(!page.columns.includes('weight_kg'),`${title} must not have a kg column`);
  assert.equal(page.weighted,false,title);
 }
 const timed=s.pages.find(p=>p.title==='Row');
 assert.ok(timed.columns.includes('seconds'));
 assert.equal(timed.prescribed,'180');
});

test('debug build package id is com.hybrid.strength by design',()=>{
 const config=JSON.parse(readFileSync(join(here,'../mobile/capacitor/capacitor.config.json'),'utf8'));
 const gradle=readFileSync(join(here,'../mobile/capacitor/android/app/build.gradle'),'utf8');
 assert.equal(config.appId,'com.hybrid.strength');
 assert.match(gradle,/applicationId\s+"com\.hybrid\.strength"/);
});

test('emulator fixture seeds straight %, build %, coach 1RM, rampCount and history',()=>{
 const seed=JSON.parse(readFileSync(join(here,'../../checks/fixtures/ibex-emulator-seed.json'),'utf8'));
 const straight=seed.coachPublish.days.find(d=>d.id==='straight-percent');
 const build=seed.coachPublish.days.find(d=>d.id==='build-percent');
 const hist=seed.coachPublish.days.find(d=>d.id==='history-alias');
 const bench=straight.blocks[0];
 const squat=build.blocks[0];
 const seeded=seedLift(bench.title,{notes:bench.notes,oneRm:bench.oneRm,pctLow:bench.pctLow,pctHigh:bench.pctHigh,percentMode:bench.percentMode,rampCount:bench.rampCount,setCount:bench.setCount,setTargets:targets(bench.setCount)});
 assert.equal(seeded.logs.A.sets.filter(r=>r.purpose==='ramp').length,2);
 assert.ok(seeded.pages[0].workingKg>=60&&seeded.pages[0].workingKg<=63);
 const built=seedLift(squat.title,{notes:squat.notes,oneRm:squat.oneRm,pctLow:squat.pctLow,pctHigh:squat.pctHigh,percentMode:squat.percentMode,rampCount:squat.rampCount,startPct:squat.startPct,setCount:squat.setCount,setTargets:targets(squat.setCount)});
 assert.equal(built.logs.A.sets.filter(r=>r.purpose==='ramp').length,3);
 const prior={...bare('Incline Bench'),exerciseId:'ex_library_bench',title:'Incline Bench',equipmentId:'barbell',loadConvention:'total',loadUnit:'kg',minimumKg:20,equipmentStepKg:2.5};
 const current={...prior,exerciseId:'coach-uuid-bench'};
 const records={old:record(prior,{id:'old',targetId:'A:set:0',reps:hist.priorHistory.reps,effort:hist.priorHistory.effort,kg:hist.priorHistory.loggedKg,logged:true,purpose:'working'})};
 assert.equal(B.seed({id:'s',pages:[current],logs:{A:{sets:targets().map(t=>({targetId:t.id}))}}},records).pages[0].workingKg,60);
});

test('AC19 em dash is not garbled',()=>{
 assert.equal(N.decode('Ibex â€” Sat 24 Oct'),'Ibex — Sat 24 Oct');
 const s=H.startSession({date:'2026-10-24',plan:{title:'Ibex â€” Sat 24 Oct',blocks:[]}});
 assert.equal(s.title,'Ibex — Sat 24 Oct');
});
