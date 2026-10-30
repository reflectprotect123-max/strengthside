import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {runtime} from '../../scripts/strength-learning-simulator.mjs';
function boot(blocks){
 const {ctx}=runtime();
 const element={innerHTML:'',classList:{add(){},remove(){}},querySelector(){return null;}};
 ctx.document={getElementById:id=>['logger','shell'].includes(id)?element:null};
 ctx.setInterval=()=>1;ctx.clearInterval=()=>{};
 for(const name of ['timer','logger'])vm.runInContext(readFileSync(new URL(`./${name}.js`,import.meta.url),'utf8'),ctx);
 ctx.S={loggerOpen:true,timer:ctx.HybridTimer.create(),session:ctx.HybridSession.startSession({date:'2026-11-02',letter:'A',plan:{blocks}})};
 ctx.save=()=>{};
 return {ctx,element};
}
const dbBench={kind:'lift',letter:'A',title:'DB Bench Press',columns:['reps','weight_kg'],setCount:3,repTarget:'8',equipmentId:'dumbbell',loadConvention:'per_hand',minimumKg:1,exerciseId:'ex_db_bench'};

test('#6 a cleared weight on a missed set saves null, not 0',()=>{
 const {ctx}=boot([dbBench]);const id=ctx.HybridSession.currentPage(ctx.S.session).id;
 ctx.S.session.logs[id].sets.forEach(r=>{r.kg=20;});
 ctx.Logger.setField(id,'kg','');ctx.Logger.setIncomplete(id);ctx.Logger.saveSet(id);
 const row=ctx.S.session.logs[id].sets[0];
 assert.equal(row.logged,true);assert.equal(row.kg,null);
});
test('#6 a 0 kg dumbbell set does not lock the next suggestion at 0',()=>{
 const {ctx}=boot([dbBench]);const page=ctx.HybridSession.currentPage(ctx.S.session);
 const rows=[{targetId:page.setTargets[0].id,purpose:'working',kg:0,reps:8,effort:'average',logged:true},{targetId:page.setTargets[1].id,purpose:'working',kg:20,logged:false}];
 const out=ctx.StrengthBrain.next({page,row:rows[0],nextRow:rows[1],index:1,state:{rows}});
 assert.equal(out.kg,20);
});
test('#7 ticking a single lift off in the table view feeds the brain',()=>{
 const {ctx}=boot([dbBench]);const id=ctx.HybridSession.currentPage(ctx.S.session).id;
 const rows=()=>ctx.S.session.logs[id].sets;
 rows().forEach(r=>{r.kg=20;});Object.assign(rows()[0],{reps:8,effort:'very_easy'});
 ctx.Logger.check(id,0);
 assert.equal(rows()[0].logged,true);assert.ok(rows()[0].loadDecision,'brain decision recorded');
 assert.equal(rows()[1].kg,rows()[0].loadDecision.kg);assert.ok(rows()[1].kg>=20);
});
test('#11 a block added after seeding still gets a starting weight; logged pages are untouched',()=>{
 const {ctx}=boot([dbBench]);
 let s=ctx.StrengthBrain.seed(ctx.S.session,{});assert.equal(s.brainSeeded,true);
 const added=ctx.HybridSession.startSession({date:'2026-11-02',letter:'B',plan:{blocks:[{...dbBench,letter:'B',title:'DB Row',exerciseId:'ex_db_row'}]}});
 s.pages.push(added.pages[0]);s.logs[added.pages[0].id]=added.logs[added.pages[0].id];
 const firstRows=JSON.stringify(s.logs[s.pages[0].id].sets);
 s=ctx.StrengthBrain.seed(s,{});
 const row=s.pages.find(p=>p.id==='B');assert.equal(row.workingKg,6);assert.ok(s.logs.B.sets.every(r=>r.kg!=null));
 assert.equal(JSON.stringify(s.logs[s.pages[0].id].sets),firstRows,'already-seeded page keeps its rows and ramps');
});
test('#12 per-hand weight is labelled per hand, and each-side reps count both sides',()=>{
 const {ctx}=boot([{...dbBench,title:'DB Split Squat (each side)',eachSide:true}]);
 const page=ctx.HybridSession.currentPage(ctx.S.session);
 assert.equal(ctx.Logger._columnLabel(page,'weight_kg'),'Weight (kg per hand)');
 let s=ctx.HybridSession.logSet(ctx.S.session,0,{kg:10,reps:8,effort:'average'},page.id);
 const t=ctx.HybridSession.totals(s);
 assert.equal(t.reps,16);assert.equal(t.kg,10*8*2*2);
});
test('#13 barbell Est. 1RM and Last are on the same (plates) basis',()=>{
 const sq={kind:'lift',letter:'A',title:'Back Squat',columns:['reps','weight_kg'],setCount:1,repTarget:'5',equipmentId:'barbell',loadConvention:'total',minimumKg:20,equipmentStepKg:2.5,exerciseId:'ex_back_squat'};
 const {ctx}=boot([sq]);const page=ctx.HybridSession.currentPage(ctx.S.session);
 const html=ctx.Logger._sideHtml({id:'x'},page,{rolling:100,latest:{rows:[{logged:true,purpose:'working',kg:60}]}});
 assert.match(html,/EST\. 1RM<\/span><span>80 kg/);assert.match(html,/LAST<\/span><span>60 kg/);
});
test('#15 odd effort spellings are normalised, unknown ones warn',()=>{
 const {ctx}=boot([dbBench]);const page=ctx.HybridSession.currentPage(ctx.S.session);
 const base={targetId:page.setTargets[0].id,purpose:'working',kg:20,reps:8,logged:true};
 const next={targetId:page.setTargets[1].id,purpose:'working',kg:20};
 const hard=ctx.StrengthBrain.next({page,row:{...base,effort:'hard'},nextRow:next,index:1,state:{}});
 for(const e of ['HARD',' Hard ','rpe9'])assert.equal(ctx.StrengthBrain.next({page,row:{...base,effort:e},nextRow:next,index:1,state:{}}).kg,hard.kg,e);
 assert.equal(ctx.StrengthBrain.next({page,row:{...base,effort:'medium'},nextRow:next,index:1,state:{}}).reason,'hold_planned');
 const odd=ctx.StrengthBrain.next({page,row:{...base,effort:'banana'},nextRow:next,index:1,state:{}});
 assert.equal(odd.reason,'unknown_effort');assert.equal(odd.warning,'unrecognised_effort');
});
test('#14 the kg/lb toggle cannot switch the logger into lb',()=>{
 const {ctx}=boot([dbBench]);ctx.Logger.unit('lb');assert.notEqual(ctx.S.session.unit,'lb');
});
test('#4 a weighted lift the brain cannot pick for shows an unobtrusive manual note',()=>{
 const odd={kind:'lift',letter:'A',title:'Landmine Press',columns:['reps','weight_kg','seconds'],setCount:3,repTarget:'8',exerciseId:'ex_landmine'};
 const {ctx}=boot([odd]);const page=ctx.HybridSession.currentPage(ctx.S.session);
 assert.match(ctx.Logger._sideHtml(ctx.S.session,page),/<span>LOAD<\/span><span>Manual<\/span>/);
 const {ctx:c2}=boot([dbBench]);const p2=c2.HybridSession.currentPage(c2.S.session);
 assert.doesNotMatch(c2.Logger._sideHtml(c2.S.session,p2),/Manual/);
});
test('manual lift: LAST shows the last weight used (title-key fallback)',()=>{
 const odd={kind:'lift',letter:'A',title:'Landmine Press',columns:['reps','weight_kg','seconds'],setCount:3,repTarget:'8'};
 const {ctx}=boot([odd]);const page=ctx.HybridSession.currentPage(ctx.S.session);
 ctx.StrengthBrain.lastLogged=()=>({kg:27.5,sessionId:'old'});
 assert.match(ctx.Logger._sideHtml(ctx.S.session,page),/<span>LAST<\/span><span>27.5 kg<\/span>/);
});
