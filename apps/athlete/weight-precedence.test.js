import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {webcrypto} from 'node:crypto';
import vm from 'node:vm';

const here=dirname(fileURLToPath(import.meta.url));
const ctx=vm.createContext({crypto:webcrypto,S:{accountId:'athlete'},console,document:{getElementById:()=>null},setInterval:()=>1,clearInterval(){}});
for(const name of ['training-core','strength-targets','strength-equipment','strength-rts','strength-policy','strength-load','strength-context','strength-learning','strength-replay','strength-brain-core','strength-notes','strength-percent','strength-brain','session','timer']) {
  vm.runInContext(readFileSync(join(here,`${name}.js`),'utf8'),ctx);
}
const B=ctx.StrengthBrain,H=ctx.HybridSession,E=ctx.StrengthEquipment,P=ctx.StrengthPercent;

function rec(page,row,at,id='r') {
  const filled=E.apply(page);
  return {id,localRevision:1,deleted:false,kind:'set',sessionId:`s-${at}`,exerciseKey:B.key(filled),payload:{contractVersion:3,ownerId:'athlete',completed:true,page:filled,row:{...row,logged:true,miss:false,purpose:row.purpose||'working',workingIndex:row.workingIndex??0,ordinal:row.ordinal??0},normalizedLoad:ctx.StrengthLoad.fromPage({page:filled,value:row.kg,provenance:'explicit'}),sessionStartedAt:at}};
}

function seedPlan(blocks,records={},date='2026-10-24') {
  B.clearCache();
  return B.seed(H.startSession({date,plan:{title:'Ibex replay',blocks}}),records);
}

function work(seeded,title) {
  const page=seeded.pages.find(p=>p.title===title)||seeded.pages.find(p=>p.members?.some(m=>m.title===title));
  const id=page.members?page.members.find(m=>m.title===title).id:page.id;
  const lift=page.members?page.members.find(m=>m.title===title):page;
  return {page:lift,sets:(seeded.logs[id].sets||[])};
}

function playDay(seeded,title,rate='average') {
  const {page,sets}=work(seeded,title);
  const rows=[];
  let next=seeded;
  for(let i=0;i<sets.length;i++) {
    const row=sets[i];
    const logged={...row,logged:true,effort:rate,reps:row.reps||5,kg:row.kg};
    rows.push(logged);
    const nxt=sets[i+1];
    if(nxt) {
      const adj=B.next({page,row:logged,nextRow:nxt,index:i+1,state:{rows,records:{}}});
      if(adj?.kg!=null)nxt.kg=adj.kg;
    }
  }
  next.logs[page.id]={...next.logs[page.id],sets:rows.concat(sets.slice(rows.length)),completed:true};
  return {page,rows,session:next};
}

test('precedence (a) percent+coach 1RM wins over history and oneRm leak; (b) exact lift only; (c) starter',()=>{
 const incline={id:'A',title:'Incline Bench',kind:'lift',logMode:'kg',columns:['reps','weight_kg'],equipmentId:'barbell',loadConvention:'total',loadUnit:'kg',minimumKg:20,equipmentStepKg:2.5,barWeightKg:20};
 const records={
  oct23:rec(incline,{id:'oct23',targetId:'A:set:0',reps:6,effort:'average',kg:67.5},1000,'oct23'),
  oct30:rec(incline,{id:'oct30',targetId:'A:set:0',reps:8,effort:'average',kg:62.5},2000,'oct30'),
  empty:rec(incline,{id:'junk',targetId:'A:set:0',reps:8,effort:'average',kg:0},3000,'empty'),
  rdl:rec({...incline,title:'DB RDL',equipmentId:'dumbbell',loadConvention:'per_hand',minimumKg:1},{id:'rdl',targetId:'C:set:0',reps:8,effort:'average',kg:35},500,'rdl'),
 };
 const seeded=seedPlan([
  {kind:'lift',letter:'A',title:'Incline Bench',setCount:4,rampCount:2,oneRm:100,pctLow:63,pctHigh:68,percentMode:'straight',notes:['4 x 8 @ 63-68% (RPE 6)'],columns:['reps','weight_kg']},
  {kind:'lift',letter:'B',title:'Deficit Back Rack Lunge',setCount:3,rampCount:2,oneRm:100,notes:['90 seconds rest'],columns:['reps','weight_kg']},
  {kind:'lift',letter:'C',title:'DB RDL',setCount:3,rampCount:2,oneRm:100,notes:['Rest: 60'],columns:['reps','weight_kg']},
 ],records);
 const bench=work(seeded,'Incline Bench');
 const lunge=work(seeded,'Deficit Back Rack Lunge');
 const rdl=work(seeded,'DB RDL');
 const benchWork=bench.sets.filter(r=>r.purpose==='working');
 assert.ok(benchWork.every(r=>r.kg>=62.5&&r.kg<=68),`straight % must stay in 63-68, got ${benchWork.map(r=>r.kg)}`);
 const hist=B.history(records,bench.page,seeded.id);
 assert.equal(hist.latest?.rows?.filter(r=>r.purpose!=='ramp').at(-1)?.kg,62.5);
 assert.ok(hist.freshE1rm>0,`Est 1RM must populate with LAST, got ${hist.freshE1rm}`);
 assert.ok(Number.isFinite(lunge.page.workingKg)&&lunge.page.workingKg<40&&lunge.page.workingKg!==70,`lunge must be starter not 70, got ${lunge.page.workingKg}`);
 assert.ok(rdl.page.workingKg<=35&&rdl.page.workingKg>0,`RDL must be own history/starter not Incline 70, got ${rdl.page.workingKg}`);
 assert.ok(rdl.sets.filter(r=>r.purpose==='working').every(r=>r.kg===rdl.page.workingKg));
 const rdlRamps=rdl.sets.filter(r=>r.purpose==='ramp');
 assert.ok(rdlRamps.every(r=>r.kg!=null&&r.kg<rdl.page.workingKg),`RDL ramps must stay below working ${rdl.page.workingKg}: ${rdlRamps.map(r=>r.kg)}`);
 const lungeHist=B.history(records,lunge.page,seeded.id);
 assert.equal(lungeHist.latest,null);
});

test('end-to-end replay: seed, rate ramps, working sets, next session keeps precedence',()=>{
 const records={};
 const day1=seedPlan([
  {kind:'lift',letter:'A',title:'Back Squat',setCount:5,rampCount:3,oneRm:140,pctLow:72,pctHigh:77,percentMode:'build',startPct:55,notes:['5 x 5 @ 72-77% (RPE 8) build over the 5 sets'],columns:['reps','weight_kg']},
  {kind:'lift',letter:'B',title:'Incline Bench drop',setCount:3,rampCount:0,oneRm:100,pctLow:90,pctHigh:92,notes:['2 x 2 @ 90-92% + drop set'],columns:['reps','weight_kg']},
 ],records,'2026-10-24');
 const squat=work(day1,'Back Squat');
 assert.match((squat.page.prescription||squat.page.notes.join(' ')),/5\s*[x×]\s*5/);
 assert.ok((squat.page.setTargets||[]).every(t=>t.reps?.min===5),`build reps must be 5 not 8: ${JSON.stringify(squat.page.setTargets)}`);
 const ramps=squat.sets.filter(r=>r.purpose==='ramp');
 const climb=squat.sets.filter(r=>r.purpose==='working');
 assert.equal(ramps.length,3);
 assert.equal(climb.length,5);
 assert.ok(climb[0].kg<climb[2].kg&&climb[2].kg<climb[4].kg,`build must climb evenly ${climb.map(r=>r.kg)}`);
 assert.ok(climb.at(-2).kg>=100&&climb.at(-2).kg<=108,`final-2 in 72-77% of 140, got ${climb.at(-2).kg}`);
 assert.ok(climb.at(-1).kg>=100&&climb.at(-1).kg<=108,`final in range, got ${climb.at(-1).kg}`);
 const gaps=climb.slice(1).map((r,i)=>r.kg-climb[i].kg);
 assert.ok(Math.max(...gaps)<=20,`no 25kg working jump: ${climb.map(r=>r.kg)}`);
 assert.ok(ramps.every(r=>r.kg!=null));
 assert.ok(ramps[0].kg<ramps[1].kg&&ramps[1].kg<ramps[2].kg,`ramps must climb ${ramps.map(r=>r.kg)}`);
 assert.ok(ramps[2].kg<climb[0].kg,`last ramp below first working ${ramps[2].kg} vs ${climb[0].kg}`);
 assert.ok(climb[0].kg-ramps[2].kg<=climb[0].kg*0.35,`last ramp too far from first working`);
 const held=B.next({page:squat.page,row:{...ramps[0],logged:true,effort:'average',reps:5,kg:ramps[0].kg},nextRow:{...ramps[1]},index:1,state:{rows:[ramps[0]]}});
 assert.equal(held.kg,ramps[1].kg,`Average on ramp 1 must hold ramp 2, got ${held.kg}`);

 const drop=work(day1,'Incline Bench drop');
 const tops=drop.sets.filter(r=>r.purpose==='working'&&r.setRole!=='drop');
 const topSets=drop.sets.filter(r=>r.purpose==='working').slice(0,2);
 assert.ok(topSets.every(r=>r.kg>=90&&r.kg<=92),`both tops 90-92% of 100, got ${topSets.map(r=>r.kg)}`);

 const played=playDay(day1,'Back Squat','average');
 const last=played.rows.filter(r=>r.purpose==='working').at(-1);
 records.s1=rec(squat.page,{id:'s1',targetId:'A:set:4',reps:5,effort:'average',kg:last.kg},4000,'s1');
 const day2=seedPlan([
  {kind:'lift',letter:'A',title:'Back Squat',setCount:5,rampCount:3,oneRm:140,pctLow:72,pctHigh:77,percentMode:'build',startPct:55,notes:['5 x 5 @ 72-77% (RPE 8) build over the 5 sets'],columns:['reps','weight_kg']},
 ],records,'2026-10-25');
 const again=work(day2,'Back Squat').sets.filter(r=>r.purpose==='working').map(r=>r.kg);
 assert.ok(again[0]<again[4],`next session must still build, not flat ${again}`);
 assert.ok(again.at(-1)>=100&&again.at(-1)<=108);
});

test('notes 5 x 5 replace payload 8-rep targets and card text',()=>{
 const s=H.startSession({date:'2026-10-24',plan:{blocks:[{
  kind:'lift',letter:'A',title:'Back Squat',setCount:5,columns:['reps','weight_kg'],
  notes:['5 x 5 @ 72-77% (RPE 8) build over the 5 sets'],
  setTargets:Array.from({length:5},(_,i)=>({id:`A:set:${i}`,purpose:'working',reps:{min:8,max:8},loadRule:{kind:'adaptive'},toFailure:false})),
 }]}});
 const page=s.pages.find(p=>p.title==='Back Squat');
 assert.match(page.prescription||page.notes.join(' '),/5\s*[x×]\s*5/);
 assert.ok((page.setTargets||[]).every(t=>t.reps?.min===5),`payload 8 must yield to notes 5: ${JSON.stringify(page.setTargets)}`);
});

test('Jump Squat prescribed seconds stay seconds and do not add bar kg to the header',()=>{
 const s=H.startSession({date:'2026-10-24',plan:{blocks:[
  {kind:'lift',letter:'D',title:'Wall Sit',setCount:3,notes:['3 x 45 sec','Superset with Jump Squat']},
  {kind:'lift',letter:'E',title:'Jump Squat',setCount:3,notes:['3 x 45 sec','Superset with Wall Sit']},
 ]}});
 const jump=s.pages.find(p=>p.members)?s.pages.find(p=>p.members?.some(m=>m.title==='Jump Squat')).members.find(m=>m.title==='Jump Squat'):s.pages.find(p=>p.title==='Jump Squat');
 assert.ok(!jump.columns.includes('weight_kg'));
 assert.ok(jump.columns.includes('seconds'),`Jump Squat columns ${jump.columns}`);
 assert.equal(jump.weighted,false);
 const before=H.totals(s).kg;
 const log=s.logs[jump.id];
 log.sets=log.sets.map(r=>({...r,logged:true,reps:8,kg:null,cells:{seconds:'45'}}));
 assert.equal(H.totals(s).kg,before);
});
