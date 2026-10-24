import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {runtime} from '../../scripts/strength-learning-simulator.mjs';
function boot(){
 const {ctx}=runtime();let saved=null;
 const element={innerHTML:'',classList:{add(){},remove(){}},querySelector(){return null;}};
 ctx.document={getElementById:id=>['logger','shell'].includes(id)?element:null};
 ctx.setInterval=()=>1;ctx.clearInterval=()=>{};
 for(const name of ['timer','logger'])vm.runInContext(readFileSync(new URL(`./${name}.js`,import.meta.url),'utf8'),ctx);
 ctx.S={loggerOpen:true,timer:ctx.HybridTimer.create(),session:ctx.HybridSession.startSession({date:'2026-10-17',letter:'A',plan:{blocks:[
  {kind:'lift',letter:'A',title:'Bike',section:'Warm-Up',columns:['seconds'],prescribed:'180',setCount:1},
  {kind:'lift',letter:'B',title:'Stretch',section:'Cool-Down',columns:['seconds'],prescribed:'30',setCount:1}
 ]}})};
 ctx.save=()=>{saved=JSON.parse(JSON.stringify(ctx.S));};
 return {ctx,element,saved:()=>saved};
}
function bootPlan(plan,letter){
 const {ctx}=runtime();
 const element={innerHTML:'',classList:{add(){},remove(){}},querySelector(){return null;}};
 ctx.document={getElementById:id=>['logger','shell'].includes(id)?element:null,querySelectorAll:()=>[]};
 ctx.setInterval=()=>1;ctx.clearInterval=()=>{};
 for(const name of ['timer','logger'])vm.runInContext(readFileSync(new URL(`./${name}.js`,import.meta.url),'utf8'),ctx);
 ctx.S={loggerOpen:true,timer:ctx.HybridTimer.create(),session:ctx.HybridSession.startSession({date:'2026-10-24',letter,plan})};
 ctx.save=()=>{};
 return {ctx,element};
}
test('a timed prep countdown persists its start so reload does not restart it',()=>{
 const b=boot();b.ctx.Logger.paint();
 assert.equal(b.saved()?.timer.mode,'countdown');assert.equal(b.saved()?.session.warmupClock,'A-r1');
 const started=b.ctx.S.timer.startedAt;
 b.ctx.S=JSON.parse(JSON.stringify(b.saved()));b.ctx.Logger.paint();assert.equal(b.ctx.S.timer.startedAt,started);
});
test('Next cannot bypass a running prep countdown, but advances after zero',()=>{
 const {ctx}=boot();ctx.Logger.paint();ctx.Logger.next();assert.equal(ctx.S.session.blockIndex,0);
 ctx.S.timer.startedAt=Date.now()-181000;ctx.Logger.next();assert.equal(ctx.S.session.blockIndex,1);
 assert.equal(ctx.S.timer.config.totalMs,30000);
});
test('painting a closed logger does not start a hidden prep timer',()=>{
 const {ctx}=boot();ctx.S.loggerOpen=false;ctx.Logger.paint();assert.equal(ctx.S.timer.mode,null);
});

test('failed countdown persistence leaves the previous timer intact and reports the storage failure',()=>{
 const {ctx,element}=boot();const previous=ctx.S.timer;
 ctx.save=()=>{throw new Error('quota');};
 assert.doesNotThrow(()=>ctx.Logger.paint());assert.equal(ctx.S.timer,previous);
 assert.equal(ctx.S.session.warmupClock,undefined);assert.match(element.innerHTML,/Could not save/);
});

test('AC14 timed warmup overlay exposes Skip and Next',()=>{
 const {ctx,element}=boot();ctx.Logger.paint();
 assert.match(element.innerHTML,/Skip warm-up/);
 assert.match(element.innerHTML,/Next movement|Next →/);
});

test('AC14 persistTimer patches a live overlay instead of a full paint remount',()=>{
 const {ctx,element}=boot();ctx.Logger.paint();
 ctx.document.createElement=()=>({innerHTML:'',firstElementChild:null});
 const live={id:'logTimerFull',replaceWith(){}};
 const orig=ctx.document.getElementById.bind(ctx.document);
 ctx.document.getElementById=id=>id==='logTimerFull'||id==='logTimerDock'?live:orig(id);
 let paints=0;const paint=ctx.Logger.paint.bind(ctx.Logger);ctx.Logger.paint=()=>{paints+=1;return paint();};
 ctx.Logger.timerNudge(1);
 assert.equal(paints,0);
});

test('AC14 persistTimer paints when the overlay is no longer countIn or running',()=>{
 const {ctx,element}=boot();ctx.Logger.paint();
 const live={id:'logTimerFull',replaceWith(){}};
 const orig=ctx.document.getElementById.bind(ctx.document);
 ctx.document.getElementById=id=>id==='logTimerFull'||id==='logTimerDock'?live:orig(id);
 element.innerHTML='STALE_OVERLAY';
 ctx.Logger.timerStop();
 assert.notEqual(element.innerHTML,'STALE_OVERLAY');
});

test('AC14 Skip warm-up leaves the current countdown page',()=>{
 const {ctx}=boot();ctx.Logger.paint();
 assert.equal(ctx.S.session.pages[ctx.S.session.blockIndex].title,'Bike');
 ctx.Logger.skipBlock();
 assert.equal(ctx.S.session.blockIndex,1);
 assert.equal(ctx.S.session.pages[1].title,'Stretch');
});

test('timerNext marks the page being left, not the next page',()=>{
 const {ctx}=boot();ctx.Logger.paint();
 const left=ctx.S.session.pages[0];
 const next=ctx.S.session.pages[1];
 ctx.Logger.timerNext();
 assert.equal(ctx.S.session.blockIndex,1);
 assert.equal(ctx.S.session.logs[left.id].completed,true);
 assert.notEqual(ctx.S.session.logs[next.id]?.completed,true);
});

test('AC12 logging a lunge set auto-starts the prescribed rest',()=>{
 const {ctx}=bootPlan({blocks:[
  {kind:'lift',letter:'B',title:'Deficit Back Rack Lunge',setCount:3,notes:['90 seconds rest'],columns:['reps','weight_kg']},
 ]},'B');
 const page=ctx.HybridSession.currentPage(ctx.S.session);
 ctx.S.session.loggerSetFlow={[page.id]:{index:0,draft:{reps:8,kg:40,effort:'average',miss:false}}};
 ctx.Logger.saveSet(page.id);
 assert.equal(ctx.S.timer.mode,'rest');
 assert.equal(ctx.S.timer.config.restMs,90000);
});

test('AC13 logger keeps both members as original tables with F1/F2-style titles',()=>{
 const {ctx,element}=bootPlan({blocks:[
  {kind:'lift',letter:'F1',title:'Wall Sit',setCount:3,notes:['Superset with Jump Squat'],restSec:45},
  {kind:'lift',letter:'F2',title:'Jump Squat',setCount:3,notes:['Superset with Wall Sit']},
 ]},'F1');
 ctx.Logger.paint();
 const html=element.innerHTML;
 assert.match(html,/F1\. Wall Sit/);
 assert.match(html,/F2\. Jump Squat/);
 assert.match(html,/log-table/);
 assert.doesNotMatch(html,/F11|F21|F12/);
 assert.doesNotMatch(html,/after each round/);
 assert.equal((html.match(/log-ss-member/g)||[]).length,2);
});

test('bar Next on a warm-up marks the left page done',()=>{
 const {ctx}=bootPlan({blocks:[
  {kind:'lift',letter:'U',title:'Row',section:'Warm-Up',columns:['seconds'],prescribed:'180',setCount:1},
  {kind:'lift',letter:'V',title:'Bodyweight Squat',section:'Warm-Up',setCount:2},
 ]},'U');
 ctx.Logger.paint();
 ctx.S.timer.startedAt=Date.now()-181000;
 const row=ctx.S.session.pages[0];
 ctx.Logger.next();
 assert.equal(ctx.S.session.pages[ctx.S.session.blockIndex].title,'Bodyweight Squat');
 assert.equal(ctx.S.session.logs[row.id].completed,true);
});

test('AC12 logging the last member of a superset round auto-starts prescribed rest',()=>{
 const {ctx}=bootPlan({blocks:[
  {kind:'lift',letter:'A',title:'Wall Sit',setCount:3,notes:['3 x 45 sec','Superset with Jump Squat'],restSec:45,columns:['seconds']},
  {kind:'lift',letter:'B',title:'Jump Squat',setCount:3,notes:['Superset with Wall Sit']},
 ]},'A');
 const pair=ctx.HybridSession.currentPage(ctx.S.session);
 const wall=pair.members[0],jump=pair.members[1];
 ctx.Logger.rateRow(wall.id,0,'2');
 ctx.Logger.check(wall.id,0);
 ctx.Logger.rateRow(jump.id,0,'2');
 ctx.Logger.check(jump.id,0);
 assert.equal(ctx.S.timer.mode,'rest');
 assert.equal(ctx.S.timer.config.restMs,45000);
});
