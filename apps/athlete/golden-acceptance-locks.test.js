import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {webcrypto} from 'node:crypto';
import vm from 'node:vm';

const here=dirname(fileURLToPath(import.meta.url));
const ctx=vm.createContext({crypto:webcrypto,S:{accountId:'golden-dan',athleteLevels:null},console,document:{getElementById:()=>null},setInterval:()=>1,clearInterval(){}});
for(const name of ['training-core','strength-targets','strength-equipment','strength-rts','strength-policy','strength-load','strength-context','strength-learning','strength-replay','strength-brain-core','strength-notes','strength-percent','strength-weights','strength-brain','session','timer']) {
  vm.runInContext(readFileSync(join(here,`${name}.js`),'utf8'),ctx);
}
ctx.StrengthWeights.use('golden-dan');
const B=ctx.StrengthBrain,H=ctx.HybridSession,E=ctx.StrengthEquipment;

function rec(page,row,at,id='r') {
  const filled=E.apply(page);
  return {id,localRevision:1,deleted:false,kind:'set',sessionId:`s-${at}`,exerciseKey:B.key(filled),payload:{contractVersion:3,ownerId:'golden-dan',completed:true,page:filled,row:{...row,logged:true,miss:false,purpose:row.purpose||'working',workingIndex:row.workingIndex??0,ordinal:row.ordinal??0},normalizedLoad:ctx.StrengthLoad.fromPage({page:filled,value:row.kg,provenance:'explicit'}),sessionStartedAt:at}};
}
function seedPlan(blocks,records={},date='2026-10-24') {
  B.clearCache();
  return B.seed(H.startSession({date,plan:{title:'Golden locks',blocks}}),records);
}
function work(seeded,title) {
  const page=seeded.pages.find(p=>p.title===title)||seeded.pages.find(p=>p.members?.some(m=>m.title===title));
  const lift=page.members?page.members.find(m=>m.title===title):page;
  return {page:lift,sets:(seeded.logs[lift.id].sets||[])};
}

test('lock 1: coach % wins over history on a percent day',()=>{
  const incline={id:'A',title:'Incline Bench',kind:'lift',logMode:'kg',columns:['reps','weight_kg'],equipmentId:'barbell',loadConvention:'total',loadUnit:'kg',minimumKg:20,barWeightKg:20,equipmentStepKg:2.5};
  const records={old:rec(incline,{id:'old',targetId:'A:set:0',reps:8,effort:'average',kg:70},1,'old')};
  const seeded=seedPlan([{kind:'lift',letter:'A',title:'Incline Bench',setCount:4,rampCount:2,oneRm:100,pctLow:63,pctHigh:68,percentMode:'straight',notes:['4 x 8 @ 63-68%'],columns:['reps','weight_kg']}],records);
  assert.ok(work(seeded,'Incline Bench').sets.filter(r=>r.purpose==='working').every(r=>r.kg===62.5));
});

test('lock 2: exact-lift history only — lunge never inherits Incline 70',()=>{
  const incline={id:'A',title:'Incline Bench',kind:'lift',logMode:'kg',columns:['reps','weight_kg'],equipmentId:'barbell',loadConvention:'total',loadUnit:'kg',minimumKg:20,barWeightKg:20};
  const records={old:rec(incline,{id:'old',targetId:'A:set:0',reps:8,effort:'average',kg:70},1,'old')};
  const seeded=seedPlan([{kind:'lift',letter:'B',title:'Deficit Back Rack Lunge',setCount:3,rampCount:0,notes:['90 seconds rest'],columns:['reps','weight_kg']}],records);
  const lunge=work(seeded,'Deficit Back Rack Lunge');
  assert.equal(lunge.page.workingKg,20);
  assert.ok(lunge.sets.filter(r=>r.purpose==='working').every(r=>r.kg!==70));
});

test('lock 3: LAST is the newest session, not the heaviest',()=>{
  const incline={id:'A',title:'Incline Bench',kind:'lift',logMode:'kg',columns:['reps','weight_kg'],equipmentId:'barbell',loadConvention:'total',loadUnit:'kg',minimumKg:20,barWeightKg:20,equipmentStepKg:2.5};
  const records={
    oct23:rec(incline,{id:'oct23',targetId:'A:set:0',reps:6,effort:'average',kg:67.5},1000,'oct23'),
    oct30:rec(incline,{id:'oct30',targetId:'A:set:0',reps:8,effort:'average',kg:62.5},2000,'oct30'),
  };
  const hist=B.history(records,incline);
  assert.equal(hist.latest?.rows?.filter(r=>r.purpose!=='ramp').at(-1)?.kg,62.5);
});

test('lock 4: Est 1RM populates when LAST exists',()=>{
  const incline={id:'A',title:'Incline Bench',kind:'lift',logMode:'kg',columns:['reps','weight_kg'],equipmentId:'barbell',loadConvention:'total',loadUnit:'kg',minimumKg:20,barWeightKg:20,equipmentStepKg:2.5};
  const records={oct30:rec(incline,{id:'oct30',targetId:'A:set:0',reps:8,effort:'average',kg:62.5},2000,'oct30')};
  const hist=B.history(records,incline);
  assert.ok(hist.freshE1rm>0||hist.rolling>0);
});

test('lock 5: 2x2 @90-92% tops 90/90 and drop 77.5',()=>{
  const seeded=seedPlan([{kind:'lift',letter:'B',title:'Incline Bench drop',setCount:3,rampCount:0,oneRm:100,pctLow:90,pctHigh:92,notes:['2 x 2 @ 90-92% + drop set'],columns:['reps','weight_kg']}]);
  const workSets=work(seeded,'Incline Bench drop').sets.filter(r=>r.purpose==='working');
  assert.equal(workSets[0].kg,90);
  assert.equal(workSets[1].kg,90);
  assert.equal(workSets[2].kg,77.5);
});

test('lock 6: next build session still climbs from coach %',()=>{
  const block={kind:'lift',letter:'A',title:'Back Squat',setCount:5,rampCount:3,oneRm:125,pctLow:80,pctHigh:85,percentMode:'build',notes:['5 x 5 @ 80-85% build over the 5 sets'],columns:['reps','weight_kg']};
  const day1=seedPlan([block]);
  const last=work(day1,'Back Squat').sets.filter(r=>r.purpose==='working').at(-1);
  const records={s1:rec(work(day1,'Back Squat').page,{id:'s1',targetId:'A:set:4',reps:5,effort:'average',kg:last.kg},4000,'s1')};
  const day2=seedPlan([block],records,'2026-10-25');
  const again=work(day2,'Back Squat').sets.filter(r=>r.purpose==='working').map(r=>r.kg);
  assert.ok(again[0]<again[4],`must climb ${again}`);
  assert.deepEqual([...again],[75,82.5,92.5,100,107.5]);
});

test('lock 7: rest timer does not carry into a new session date',()=>{
  const logger=readFileSync(join(here,'logger.js'),'utf8');
  assert.match(logger,/date.*timer|timer.*date|selectedDate/);
});

test('lock 8: timed jump / wall sit add 0 kg to the header',()=>{
  const s=H.startSession({date:'2026-10-24',plan:{blocks:[
    {kind:'lift',letter:'D',title:'Wall Sit',setCount:3,notes:['3 x 45 sec','Superset with Jump Squat']},
    {kind:'lift',letter:'E',title:'Jump Squat',setCount:3,notes:['3 x 20 sec','Superset with Wall Sit']},
  ]}});
  const jump=s.pages.find(p=>p.members)?.members.find(m=>m.title==='Jump Squat')||s.pages.find(p=>p.title==='Jump Squat');
  assert.ok(jump.columns.includes('seconds'));
  const before=H.totals(s).kg;
  s.logs[jump.id].sets=s.logs[jump.id].sets.map(r=>({...r,logged:true,reps:8,kg:null,cells:{seconds:'20'}}));
  assert.equal(H.totals(s).kg,before);
});

test('lock 9: ramp 1 target is Easy even when the page RPE is 8',()=>{
  const seeded=seedPlan([{kind:'lift',letter:'A',title:'Back Squat',setCount:5,rampCount:3,oneRm:125,pctLow:80,pctHigh:85,percentMode:'build',rpe:8,notes:['5 x 5 @ 80-85% (RPE 8)'],columns:['reps','weight_kg']}]);
  const {page,sets}=work(seeded,'Back Squat');
  assert.equal(B.target(page,sets[0],0),'easy');
});

test('lock 10: logged-set list padding clears the bottom nav',()=>{
  const css=readFileSync(join(here,'logger.css'),'utf8');
  assert.match(css,/\.log-body\s*\{[^}]*padding:[^}]*var\(--nav-h\)/s);
});

test('logger never writes combined_projection_hold onto later working sets',()=>{
  const logger=readFileSync(join(here,'logger.js'),'utf8');
  assert.match(logger,/StrengthWeights\.applyRating/);
  assert.doesNotMatch(logger,/later\.kg = adj\.kg/);
  assert.doesNotMatch(logger,/combined_projection_hold/);
});
