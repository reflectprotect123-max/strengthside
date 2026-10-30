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
test('#13 EST. 1RM is the Epley working 1RM the % loads use (old estimator retired)',()=>{
 const sq={kind:'lift',letter:'A',title:'Deadlift',columns:['reps','weight_kg'],setCount:1,repTarget:'6',equipmentId:'barbell',loadConvention:'total',minimumKg:20,equipmentStepKg:2.5,exerciseId:'ex_deadlift'};
 const {ctx}=boot([sq]);const page=ctx.HybridSession.currentPage(ctx.S.session);
 const row={id:'r1',purpose:'working',kg:102.5,reps:6,effort:'average',logged:true};
 const records={a:{id:'a',kind:'set',sessionId:'old',deleted:false,payload:{page,row,sessionStartedAt:1}}};
 ctx.StrengthMemory.records=()=>records;
 const html=ctx.Logger._sideHtml({id:'x'},page,{rolling:130.9,latest:{rows:[row]}});
 assert.match(html,/EST\. 1RM<\/span><span>123 kg/);assert.match(html,/LAST<\/span><span>102\.5 kg/);
 ctx.StrengthMemory.records=()=>({});
 assert.match(ctx.Logger._sideHtml({id:'x'},page,{rolling:6.6,latest:null}),/EST\. 1RM<\/span><span>Learning/);
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
const sideButtons=html=>[...(html.match(/<div class="log-pad-side"[\s\S]*?<\/div>/)||[''])[0].matchAll(/<button[^>]*>([^<]*)<\/button>/g)].map(m=>m[1]);
const sq5={kind:'lift',letter:'A',title:'Back Squat',columns:['reps','weight_kg'],setCount:3,repTarget:'5',equipmentId:'barbell',loadConvention:'total',minimumKg:20,equipmentStepKg:2.5,exerciseId:'ex_back_squat'};
test('#8 one tap on an effort rating logs the set',()=>{
 const {ctx}=boot([sq5]);const id=ctx.HybridSession.currentPage(ctx.S.session).id;
 ctx.S.session.logs[id].sets.forEach(r=>{r.kg=100;r.reps=5;});
 ctx.S.session.loggerSetFlow={[id]:{index:0,rest:false,editing:false,draft:{reps:5,kg:100,effort:null,miss:false}}};
 ctx.Logger.rate(id,2);
 const row=ctx.S.session.logs[id].sets[0];assert.equal(row.logged,true);assert.equal(row.effort,'average');
});
test('#8 during rest the next rating logs the next set with no Start-next-set tap',()=>{
 const {ctx}=boot([sq5]);const id=ctx.HybridSession.currentPage(ctx.S.session).id;
 ctx.S.session.logs[id].sets.forEach(r=>{r.kg=100;r.reps=5;});
 ctx.S.session.loggerSetFlow={[id]:{index:0,rest:false,editing:false,draft:{reps:5,kg:100,effort:null,miss:false}}};
 ctx.Logger.rate(id,2);assert.equal(ctx.S.session.loggerSetFlow[id].rest,true);
 ctx.Logger.rate(id,3);
 assert.equal(ctx.S.session.logs[id].sets.filter(r=>r.logged).length,2);assert.equal(ctx.S.session.logs[id].sets[1].effort,'hard');
 ctx.Logger.rate(id,3);assert.equal(ctx.S.session.logs[id].sets.filter(r=>r.logged).length,2,'a duplicate event from the same tap does not log twice');
});
test('#8 the first tap after the keypad registers: an outside tap commits the entry without a repaint',()=>{
 const {ctx,element}=boot([sq5]);const id=ctx.HybridSession.currentPage(ctx.S.session).id;
 ctx.S.session.loggerSetFlow={[id]:{index:0,rest:false,editing:false,draft:{reps:5,kg:100,effort:null,miss:false}}};
 ctx.Logger.focusDraftPad(id,'kg');ctx.Logger.padKey('⌫');ctx.Logger.padKey('⌫');ctx.Logger.padKey('⌫');ctx.Logger.padKey('1');ctx.Logger.padKey('1');ctx.Logger.padKey('0');
 element.innerHTML='SENTINEL';
 assert.equal(ctx.Logger.padDismiss(),true);
 assert.equal(element.innerHTML,'SENTINEL','no repaint, so the tapped control still receives the tap');
 assert.equal(Number(ctx.S.session.loggerSetFlow[id].draft.kg),110);
 ctx.Logger.rate(id,2);assert.equal(ctx.S.session.logs[id].sets[0].kg,110);assert.equal(ctx.S.session.logs[id].sets[0].logged,true);
});
test('#9 the keypad has the same side keys in the same slots on the single-set and table-row screens',()=>{
 const {ctx,element}=boot([sq5]);const id=ctx.HybridSession.currentPage(ctx.S.session).id;
 ctx.Logger.focusDraftPad(id,'kg');const single=sideButtons(element.innerHTML);
 ctx.Logger.closePad();ctx.Logger.focusPad(id,0,'kg');const table=sideButtons(element.innerHTML);
 assert.deepEqual(single,['Save','Clear','Autofill']);assert.deepEqual(table,single);
});
test('#9 Autofill from the single-set keypad fills this and the remaining sets',()=>{
 const {ctx}=boot([sq5]);const id=ctx.HybridSession.currentPage(ctx.S.session).id;
 ctx.S.session.loggerSetFlow={[id]:{index:0,rest:false,editing:false,draft:{reps:5,kg:100,effort:null,miss:false}}};
 ctx.Logger.focusDraftPad(id,'kg');['⌫','⌫','⌫','9','0'].forEach(k=>ctx.Logger.padKey(k));ctx.Logger.padAutofill();
 assert.equal(Number(ctx.S.session.loggerSetFlow[id].draft.kg),90);
 assert.deepEqual(JSON.parse(JSON.stringify(ctx.S.session.logs[id].sets.slice(1).map(r=>r.kg))),[90,90]);
});
test('#8 the rest dock offers Log set (no Start-next-set mode switch) and a tap on the current rating position also logs',()=>{
 const {ctx,element}=boot([sq5]);const id=ctx.HybridSession.currentPage(ctx.S.session).id;
 ctx.S.session.logs[id].sets.forEach(r=>{r.kg=100;r.reps=5;});
 ctx.S.session.loggerSetFlow={[id]:{index:1,rest:true,editing:false,draft:{reps:5,kg:100,effort:null,miss:false}}};
 ctx.Logger.paint();
 assert.doesNotMatch(element.innerHTML,/Start next set/);
 assert.match(element.innerHTML,/class="log-effort-slider"[^>]*onclick="Logger\.rate\(/);
 assert.match(element.innerHTML,/class="log-effort-slider"[^>]*ontouchend="Logger\.rate\(/);
});
test('#8 a resumed session (no Logger.open) still dismisses the keypad on the first outside tap',()=>{
 const {ctx}=boot([sq5]);const listeners=[];ctx.document.addEventListener=(n,fn)=>listeners.push([n,fn]);
 const id=ctx.HybridSession.currentPage(ctx.S.session).id;
 ctx.Logger.focusDraftPad(id,'kg');
 const down=listeners.filter(l=>l[0]==='pointerdown');assert.ok(down.length>=1);
 down[0][1]({target:{closest:()=>null}});
 assert.equal(ctx.Logger.padDismiss(),false);
});
test('#9 table-row Autofill on an empty cell copies the previous row value instead of erroring',()=>{
 const hold={kind:'lift',letter:'F',title:'Plank Hold',columns:['seconds'],setCount:2,exerciseId:'ex_plank'};
 const {ctx}=boot([hold]);const page=ctx.HybridSession.currentPage(ctx.S.session);const id=page.id;
 ctx.S.session=ctx.HybridSession.logSet(ctx.S.session,0,{cells:{seconds:30}},id,{commit:false});
 ctx.Logger.focusPad(id,1,'seconds');ctx.Logger.padClear&&ctx.Logger.padClear();
 ctx.Logger.padAutofill();
 assert.equal(ctx.S.session.logs[id].sets[1].cells.seconds,30);
});
