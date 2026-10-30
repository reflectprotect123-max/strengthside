// Dan's phase-3 load rules: ibex owns sets/reps; the brain only picks load.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
const ctx=vm.createContext({crypto:webcrypto,S:{accountId:'athlete'}});
for(const name of ['training-core','strength-targets','strength-equipment','strength-rts','strength-policy','strength-load','strength-context','strength-learning','strength-replay','strength-brain-core','strength-brain'])vm.runInContext(readFileSync(new URL(`./${name}.js`,import.meta.url),'utf8'),ctx);
const B=ctx.StrengthBrain,E=ctx.StrengthEquipment,C=ctx.StrengthBrainCore;
const tg=(id,n=3,reps=5)=>Array.from({length:n},(_,i)=>({id:`${id}:set:${i}`,purpose:'working',reps:{min:reps,max:reps},loadRule:{kind:'adaptive'},toFailure:false}));
const mk=(over={})=>{const id=over.id||'A';return {id,kind:'lift',title:'Back Squat',exerciseId:'ex_back_squat',equipmentId:'barbell',loadConvention:'total',minimumKg:20,barWeightKg:20,equipmentStepKg:2.5,loadUnit:'kg',logMode:'kg',columns:['reps','weight_kg'],setCount:3,targetReps:5,setTargets:tg(id),...over};};
const squat=mk(),bench=mk({title:'Bench Press',exerciseId:'ex_bench'});
const db=mk({title:'DB Bench Press',exerciseId:'ex_db_bench',equipmentId:'dumbbell',loadConvention:'per_hand',minimumKg:1,barWeightKg:undefined,equipmentStepKg:undefined});
const kb=mk({title:'KB Goblet Squat',exerciseId:'ex_kb_goblet',equipmentId:'kettlebell',loadConvention:'single',minimumKg:4,barWeightKg:undefined,equipmentStepKg:undefined});
const row=(page,i,kg,effort='average',extra={})=>({id:`${page.id}r${i}`,targetId:`${page.id}:set:${i}`,purpose:'working',workingIndex:i,ordinal:i,kg,plannedKg:kg,reps:5,effort,logged:true,miss:false,...extra});
const ramp=(page,i,kg,effort)=>({id:`${page.id}w${i}`,targetId:`${page.id}:warmup:${i}`,purpose:'ramp',kg,plannedKg:kg,reps:5,effort,logged:true,miss:false});
const next=(page,src,nextRow,index=1,extra={})=>B.next({page:{...page,startConfidence:'history',workingKg:100,...extra},row:src,nextRow,index,state:{rows:[src,nextRow],records:{}}}).kg;
const open=(page,i,kg)=>({targetId:`${page.id}:set:${i}`,purpose:'working',kg,plannedKg:kg,logged:false});

for(const effort of ['very_easy','easy','average','hard','max_effort'])test(`#1 ramp rated ${effort} never pushes working sets above plan`,()=>{
  const kg=next(squat,ramp(squat,1,60,effort),open(squat,0,100),0);
  assert.ok(kg<=100,`${effort} -> ${kg}`);
  if(['very_easy','easy','average'].includes(effort))assert.equal(kg,100);
});
test('#1 ramp rated hard lowers the working set relative to plan, at most 10%',()=>{
  const kg=next(squat,ramp(squat,1,60,'hard'),open(squat,0,100),0);
  assert.ok(kg<100&&kg>=90,String(kg));
});
test('#1 ramp to ramp keeps the planned ramp load',()=>{
  const out=B.next({page:{...squat,startConfidence:'history'},row:ramp(squat,0,20,'very_easy'),nextRow:{targetId:'A:warmup:1',purpose:'ramp',kg:60,plannedKg:60,logged:false},index:1,state:{rows:[]}});
  assert.equal(out.kg,60);
});
test('#1 logger only moves the next set after a ramp',()=>{
  const src=readFileSync(new URL('./logger.js',import.meta.url),'utf8');
  assert.doesNotMatch(src,/for \(let i = index \+ 1; i < rows\.length; i\+\+\)/);
});
test('with history, Easy/Very Easy within a session hold the plan',()=>{
  assert.equal(next(squat,row(squat,0,100,'easy'),open(squat,1,100)),100);
  assert.equal(next(squat,row(squat,0,100,'very_easy'),open(squat,1,100)),100);
});
test('Hard with all reps done holds; missed reps drop ~5% (one DB step)',()=>{
  assert.equal(next(squat,row(squat,0,100,'hard'),open(squat,1,100)),100);
  assert.equal(next(squat,row(squat,0,100,'max_effort'),open(squat,1,100)),100);
  assert.equal(next(squat,row(squat,0,100,'hard',{reps:3,miss:true}),open(squat,1,100)),95);
  assert.equal(next(db,row(db,0,20,'hard',{reps:3,miss:true}),open(db,1,20),1,{workingKg:20}),18);
  assert.equal(next(kb,row(kb,0,16,'hard',{reps:3,miss:true}),open(kb,1,16),1,{workingKg:16}),14);
});
test('never drops more than 10% within a session',()=>{
  assert.equal(next(squat,row(squat,1,92.5,'hard',{reps:2,miss:true,plannedKg:100}),open(squat,2,100),2),90);
  assert.equal(next(squat,row(squat,2,90,'hard',{reps:2,miss:true,plannedKg:100}),open(squat,3,100),3),90);
});
test('a dropped set carries its change to later sets (relative to plan)',()=>{
  assert.equal(next(squat,row(squat,1,95,'average',{plannedKg:100}),open(squat,2,100),2),95);
});
test('cold start: Very Easy +2 steps, Easy +1 step per set (upper 2.5, lower 5, DB rung)',()=>{
  const cold=(page,src,o)=>B.next({page:{...page,startConfidence:'coach'},row:src,nextRow:o,index:1,state:{rows:[]}}).kg;
  assert.equal(cold(squat,row(squat,0,60,'easy'),open(squat,1,60)),65);
  assert.equal(cold(squat,row(squat,0,60,'very_easy'),open(squat,1,60)),70);
  assert.equal(cold(bench,row(bench,0,40,'easy'),open(bench,1,40)),42.5);
  assert.equal(cold(bench,row(bench,0,40,'very_easy'),open(bench,1,40)),45);
  assert.equal(cold(db,row(db,0,10,'easy'),open(db,1,10)),12);
  assert.equal(cold(kb,row(kb,0,16,'very_easy'),open(kb,1,16)),24);
  assert.equal(cold(squat,row(squat,0,60,'average'),open(squat,1,60)),60);
});
test('next session: Very Easy +2 steps, Easy +1, Average/Hard hold, missed drops',()=>{
  const s=(page,effs,extra=[])=>C.sessionNext(page,effs.map((e,i)=>row(page,i,100,e,extra[i]||{}))).nextKg;
  assert.equal(s(squat,['very_easy','very_easy','very_easy']),110);
  assert.equal(s(squat,['easy','easy','easy']),105);
  assert.equal(s(bench,['easy','easy','easy']),102.5);
  assert.equal(s(squat,['average','average','average']),100);
  assert.equal(s(squat,['hard','hard','hard']),100);
  assert.equal(s(squat,['average','average','hard'],[{},{},{reps:3,miss:true}]),95);
});
test('a last set one level harder is normal fatigue',()=>{
  const s=effs=>C.sessionNext(squat,effs.map((e,i)=>row(squat,i,100,e))).nextKg;
  assert.equal(s(['easy','easy','average']),105);
  assert.equal(s(['very_easy','very_easy','easy']),110);
  assert.equal(s(['easy','easy','hard']),100);
});
test('#8 kettlebell ladder',()=>{
  assert.deepEqual([...E.profile(kb).loads],[4,6,8,10,12,14,16,20,24,28,32,36,40,48]);
  assert.equal(E.next(16,kb),20);assert.equal(E.floor(30,kb),28);
});
test('#9 a machine with no declared step moves in 5 kg',()=>{
  const m=mk({title:'Leg Press',exerciseId:'ex_leg_press',equipmentId:'machine',loadConvention:'single',minimumKg:undefined,barWeightKg:undefined,equipmentStepKg:undefined});
  assert.equal(E.next(40,m),45);
});
test('#10 cold start uses the coach starting weight',()=>{
  assert.deepEqual({...E.starter({...squat,startingKg:60})},{kg:60,confidence:'coach',reason:'equipment-starters-v1:coach_starting_weight'});
  assert.equal(E.starter({...db,startingKg:13}).kg,12);
});
test('#16 off-ladder weights round to the ladder',()=>{
  assert.equal(E.nearest(13,db),12);assert.equal(E.nearest(15,kb),14);assert.equal(E.nearest(18.5,kb),20);
});
test('#2 a lift with no exerciseId keeps history under a title key',()=>{
  const p={...squat,exerciseId:null,title:'Zercher Squat'};
  const key=B.learningContext({athleteId:'a',page:p,load:ctx.StrengthLoad.fromPage({page:p,value:60,provenance:'explicit'})});
  assert.ok(key&&key.includes('title:zercher_squat'),String(key));
});
test('#4 weighted bodyweight lifts are supported with a 2.5 kg step',()=>{
  const p=mk({title:'Weighted Pull-up',exerciseId:'ex_pullup',equipmentId:'bodyweight',loadConvention:'added_bodyweight',minimumKg:undefined,barWeightKg:undefined,equipmentStepKg:undefined});
  assert.equal(C.supported(p),true);assert.equal(E.next(10,p),12.5);
});
const rec=(page,r,{sessionId='s1',startedAt=1,completed=true}={})=>({id:`${sessionId}-${r.id}`,localRevision:1,deleted:false,kind:'set',sessionId,exerciseKey:B.key(page),payload:{contractVersion:3,ownerId:'athlete',completed,page,row:{...r},normalizedLoad:ctx.StrengthLoad.fromPage({page,value:r.kg,provenance:'explicit'}),sessionStartedAt:startedAt}});
const recs=(page,effs,opts,kg=100)=>Object.fromEntries(effs.map((e,i)=>{const r=rec(page,row(page,i,kg,e),opts);return [r.id,r];}));
test('#3 an unfinished session still teaches load at lower confidence',()=>{
  const h=B.history(recs(squat,['easy','easy','easy'],{completed:false}),squat,'now','athlete');
  assert.ok(h.latest,'latest from partial session');assert.equal(h.latest.nextKg,100);assert.equal(h.confidence,'partial');
});
test('#5 a conflicted fact falls back to the newest clean session, not the starter',()=>{
  const old=recs(squat,['easy','easy','easy'],{sessionId:'s1',startedAt:1});
  const newer=recs(squat,['average','average','average'],{sessionId:'s2',startedAt:2},110);
  const all=Object.values({...old,...newer});
  const first=all.find(r=>r.sessionId==='s2'&&r.payload.row.workingIndex===0);
  all.push({...first,payload:{...first.payload,row:{...first.payload.row,kg:120},normalizedLoad:ctx.StrengthLoad.fromPage({page:squat,value:120,provenance:'explicit'})}});
  const h=B.history(all.reduce((o,r,i)=>(o['k'+i]=r,o),{}),squat,'now','athlete');
  assert.ok(h.latest);assert.equal(h.latest.nextKg,105);
});
test('second session seeds from the first (Easy -> +5 lower)',()=>{
  const session={id:'now',pages:[{...squat,setTargets:undefined,setCount:3,targetReps:5}],logs:{A:{sets:[0,1,2].map(()=>({kg:null,reps:5,logged:false}))}}};
  const seeded=B.seed(session,recs(squat,['easy','easy','easy'],{}));
  assert.equal(seeded.pages[0].workingKg,105);assert.equal(seeded.pages[0].startConfidence,'history');
  assert.ok(seeded.logs.A.sets.filter(r=>r.purpose==='working').every(r=>r.kg===105&&r.plannedKg===105));
});
test('carry: no progression; next session prefills the last entered weight whatever the rating',()=>{
  const carry={id:'C',kind:'lift',title:'Farmer Carry',exerciseId:'ex_farmer_carry',equipmentId:'dumbbell',loadConvention:'per_hand',loadUnit:'kg',columns:['meters','weight_kg'],prescribed:'40',setCount:2};
  const crow=(e,m=40)=>({id:'c0',kg:24,effort:e,logged:true,cells:{meters:String(m)},ordinal:0,purpose:'working'});
  const run=(e,m)=>{const r=rec(carry,crow(e,m));const s={id:'now',pages:[{...carry}],logs:{C:{sets:[{kg:null,logged:false},{kg:null,logged:false}]}}};return B.seed(s,{[r.id]:r}).logs.C.sets[0].kg;};
  assert.equal(run('easy'),24);assert.equal(run('very_easy'),24);assert.equal(run('average'),24);assert.equal(run('easy',20),24);
});
test('a prescription without % carries no pct',()=>{
  assert.equal(JSON.stringify(ctx.StrengthTargets.normalize(squat)).includes('pct'),false);
});
test('a weight typed into an unlogged set is the plan the brain keeps',()=>{
  const o={...open(squat,0,60),plannedKg:0};
  assert.equal(next(squat,ramp(squat,1,30,'average'),o,0),60);
});
test('a weight the athlete changed carries to the next set (both ways); off-ladder weights round',()=>{
  assert.equal(next(squat,row(squat,0,110,'average',{plannedKg:100}),open(squat,1,100)),110);
  assert.equal(next(db,row(db,0,22.5,'average',{plannedKg:5}),{targetId:'A:set:1',purpose:'working',logged:false,kg:5,plannedKg:5},1),22.5);
  assert.equal(next(db,row(db,0,21,'average',{plannedKg:20}),{targetId:'A:set:1',purpose:'working',logged:false,kg:22.5,plannedKg:22.5},1),24); // 23.6 computed -> rounds to a real dumbbell
});
test('session pages with an empty availableLoads list still use barbell steps (+5 lower)',()=>{
  const p={...squat,availableLoads:[]};
  assert.equal(C.stepUp(60,p,1),65);
});
test('cold empty-bar plan: after a loaded Average set the next set keeps that load, not the empty bar',()=>{
  const p={...squat,startConfidence:'unknown'};
  assert.equal(next(p,row(p,0,80,'average',{plannedKg:0}),{targetId:'A:set:1',purpose:'working',logged:false,kg:0,plannedKg:0},1),80);
});
test('holding the weight the athlete actually used never snaps it to a different dumbbell',()=>{
  assert.equal(next(db,row(db,0,24,'average',{plannedKg:22.5}),{targetId:'A:set:1',purpose:'working',logged:false,kg:22.5,plannedKg:22.5},1),24);
});
test('cold placeholder work: the athlete-calibrated last ramp sets the working load (held, Hard drops)',()=>{
  const p={...squat,startConfidence:'unknown'};
  const w={targetId:'A:set:0',purpose:'working',logged:false,kg:0,plannedKg:0};
  assert.equal(next(p,ramp(p,1,85,'average'),w,2),85);
  assert.ok(next(p,ramp(p,1,85,'hard'),w,2)<85);
});
test('dumbbell ladder: 1-10 by 1 kg, then 12..50 by 2 kg',()=>{
  assert.equal(E.next(9,db),10);assert.equal(E.next(10,db),12);assert.equal(E.next(12,db),14);assert.equal(E.next(48,db),50);assert.equal(E.next(50,db),null);
  assert.equal(E.floor(19,db),18);assert.equal(E.nearest(22.5,db)%2,0);assert.equal(C.stepUp(24,db,1),26);
});
test('carry: the athlete enters the weight; it is kept exactly as entered (no rounding, gym max 32)',()=>{
  const base={id:'C',kind:'lift',exerciseId:'ex_suitcase',loadUnit:'kg',columns:['meters','weight_kg'],prescribed:'40',setCount:1};
  const run=(page,kg,effort='easy')=>{const r=rec(page,{id:'c0',kg,effort,logged:true,cells:{meters:'40'},ordinal:0,purpose:'working'});const s={id:'now',pages:[{...page}],logs:{C:{sets:[{kg:null,logged:false}]}}};return B.seed(s,{[r.id]:r}).logs.C.sets[0].kg;};
  assert.equal(run({...base,title:'Farmer Carry',equipmentId:'dumbbell',loadConvention:'per_hand'},9),9);
  assert.equal(run({...base,title:'Farmer Carry',equipmentId:'dumbbell',loadConvention:'per_hand'},32,'very_easy'),32);
  assert.equal(run({...base,title:'KB Suitcase Carry',equipmentId:'kettlebell',loadConvention:'single'},24),24);
});
test('manual (unsupported) lift remembers its last weight by title key: prefills and exposes LAST',()=>{
  const man={id:'M',kind:'lift',title:'Zercher Good Morning',loadUnit:'kg',columns:['reps','weight_kg'],setCount:3,targetReps:8};
  assert.equal(B.eligible(man),false);
  const rs=[30,30,32.5].map((kg,i)=>rec(man,{id:'m'+i,kg,reps:8,effort:'easy',logged:true,ordinal:i,purpose:'working'}));
  const records=Object.fromEntries(rs.map(r=>[r.id,r]));
  const s={id:'now',pages:[{...man}],logs:{M:{sets:[0,1,2].map(()=>({kg:null,reps:8,logged:false}))}}};
  const out=B.seed(s,records);
  assert.ok(out.logs.M.sets.every(r=>r.kg===32.5),JSON.stringify(out.logs.M.sets));
  assert.equal(B.lastLogged(records,man,'now').kg,32.5);
  assert.equal(B.lastLogged(records,{...man,title:'Something Else'},'now'),null);
});
// Dan's % rules: 1RM estimated with Epley from his own logged sets; % loads come from it.
const pctTg=(id,reps,pcts)=>reps.map((r,i)=>({id:`${id}:set:${i}`,purpose:'working',reps:{min:r,max:r},loadRule:{kind:'adaptive'},toFailure:false,pct:pcts[i]}));
const dl=mk({id:'D',title:'Deadlift',exerciseId:'ex_deadlift',setCount:4,targetReps:6,setTargets:pctTg('D',[6,6,6,6],[65,68,70,72])});
const sess=(page,startedAt,sets)=>Object.fromEntries(sets.map(([kg,reps,effort],i)=>{const r=rec(page,row(page,i,kg,effort,{reps}),{sessionId:'s'+startedAt,startedAt});return [r.id,r];}));
test('% sets: Epley 1RM from the first logged sets; never rises on easier, lower estimates',()=>{
  const first=sess(dl,1,[[100,5,'easy'],[100,5,'average']]);
  assert.equal(Math.round(B.oneRM(first,dl,'now').kg*100)/100,116.67);
  const lower={...first,...sess(dl,2,[[90,5,'hard']])};assert.equal(Math.round(B.oneRM(lower,dl,'now').kg*100)/100,116.67);
  const easyHigher={...first,...sess(dl,3,[[105,5,'average']])};assert.equal(Math.round(B.oneRM(easyHigher,dl,'now').kg*100)/100,116.67,'average/easy estimate does not raise');
  const hard={...first,...sess(dl,4,[[105,5,'hard']])};assert.equal(B.oneRM(hard,dl,'now').kg,122.5);
  const beaten={...first,...sess(dl,5,[[120,1,'easy']])};assert.equal(B.oneRM(beaten,dl,'now').kg,120,'lifting more than the 1RM raises it');
  assert.equal(B.oneRM({},dl,'now'),null);
});
test('% sets: loads = 1RM x % rounded to 2.5 kg total on a barbell (Week 2 deadlift 65/68/70/72)',()=>{
  const records=sess(dl,1,[[120,6,'hard']]);// Epley 144
  const s={id:'now',pages:[{...dl}],logs:{D:{sets:[0,1,2,3].map(()=>({kg:null,reps:6,logged:false}))}}};
  const out=B.seed(s,records),w=out.logs.D.sets.filter(r=>r.purpose==='working').map(r=>r.kg);
  assert.deepEqual(JSON.parse(JSON.stringify(w)),[92.5,97.5,100,102.5]);// 93.6, 97.92, 100.8, 103.68
  assert.equal(out.pages[0].oneRmKg,144);assert.equal(out.pages[0].startConfidence,'one_rm');
});
test('% sets: before any 1RM estimate exists the first-set pick is kept',()=>{
  const p={...dl,startingKg:60};
  const s={id:'now',pages:[p],logs:{D:{sets:[0,1,2,3].map(()=>({kg:null,reps:6,logged:false}))}}};
  const out=B.seed(s,{}),w=out.logs.D.sets.filter(r=>r.purpose==='working').map(r=>r.kg);
  assert.ok(w.every(k=>k===60),JSON.stringify(w));assert.notEqual(out.pages[0].startConfidence,'one_rm');
});
test('% sets on dumbbells round to a real dumbbell size',()=>{
  const p=mk({id:'Q',title:'DB Bench Press',exerciseId:'ex_db_bench',equipmentId:'dumbbell',loadConvention:'per_hand',minimumKg:1,barWeightKg:undefined,equipmentStepKg:undefined,setTargets:pctTg('Q',[5,5,5],[65,70,75])});
  const records=sess(p,1,[[30,5,'hard']]);// 35
  const out=B.seed({id:'now',pages:[p],logs:{Q:{sets:[0,1,2].map(()=>({kg:null,reps:5,logged:false}))}}},records);
  assert.deepEqual(JSON.parse(JSON.stringify(out.logs.Q.sets.filter(r=>r.purpose==='working').map(r=>r.kg))),[22,24,26]);// 22.75, 24.5, 26.25
});
