import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {runtime} from '../../scripts/strength-learning-simulator.mjs';
function boot(blocks){
 const {ctx}=runtime();let saved=null;
 const element={innerHTML:'',classList:{add(){},remove(){}},querySelector(){return null;}};
 ctx.document={getElementById:id=>['logger','shell'].includes(id)?element:null};
 ctx.setInterval=(fn)=>{ctx.tick=fn;return 1;};ctx.clearInterval=()=>{};
 for(const name of ['timer','logger'])vm.runInContext(readFileSync(new URL(`./${name}.js`,import.meta.url),'utf8'),ctx);
 ctx.S={loggerOpen:true,timer:ctx.HybridTimer.create(),session:ctx.HybridSession.startSession({date:'2026-10-17',letter:'A',plan:{blocks:blocks||[
  {kind:'lift',letter:'A',title:'Bike',section:'Warm-Up',columns:['seconds'],prescribed:'180',setCount:1},
  {kind:'lift',letter:'B',title:'Stretch',section:'Cool-Down',columns:['seconds'],prescribed:'30',setCount:1}
 ]}})};
 ctx.save=()=>{saved=JSON.parse(JSON.stringify(ctx.S));};
 return {ctx,element,saved:()=>saved};
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

function clock(ctx){
 let now=1700000000000;
 ctx.Date={now:()=>now};
 return (ms)=>{now+=ms;if(ctx.tick)ctx.tick();};
}

test('the logger warm-up clock advances itself at zero',()=>{
 const {ctx}=boot();
 const step=clock(ctx);
 ctx.Logger.paint();
 assert.equal(ctx.S.session.blockIndex,0);
 step(ctx.S.timer.config.totalMs);
 assert.equal(ctx.S.session.blockIndex,1);
 assert.equal(ctx.S.timer.config.totalMs,30000);
});

test('an each-side warm-up runs the second side before it advances',()=>{
 const {ctx,element}=boot([
  {kind:'lift',letter:'A',title:'Couch Stretch (each side)',section:'Warm-Up',columns:['seconds'],prescribed:'60',setCount:1,countIn:3},
  {kind:'lift',letter:'B',title:'Cat-Cow',section:'Cool-Down',columns:['reps'],prescribed:'8',setCount:1}
 ]);
 const step=clock(ctx);
 ctx.Logger.paint();
 step(3000+60000);
 assert.equal(ctx.S.session.blockIndex,0);
 assert.equal(ctx.S.timer.config.prepSide,2);
 assert.match(element.innerHTML,/side 2/);
 step(3000+60000);
 assert.equal(ctx.S.session.blockIndex,1);
});

test('an each-side rep movement shows the reps on the left and the right',()=>{
 const {ctx,element}=boot([
  {kind:'lift',letter:'A',title:'Thread the Needle (each side)',section:'Cool-Down',columns:['reps'],repTarget:'6',setCount:1}
 ]);
 ctx.Logger.paint();
 assert.match(element.innerHTML,/6 L · 6 R/);
});

test('a strength hold counts down after the count-in and records the seconds actually held',()=>{
 const {ctx,element}=boot([
  {kind:'lift',letter:'A',title:'Plank',section:'Strength',columns:['seconds'],prescribed:'30',setCount:1}
 ]);
 const step=clock(ctx);
 ctx.Logger.paint();
 const page=ctx.HybridSession.currentPage(ctx.S.session);
 assert.equal(ctx.S.session.logs[page.id].sets[0].cells.seconds,undefined);
 assert.match(element.innerHTML,/Start hold/);
 ctx.Logger.startHold(page.id,0);
 assert.equal(ctx.S.timer.view,'countIn');
 assert.match(element.innerHTML,/tm-countin[\s\S]*>3</);
 step(3500);
 assert.equal(ctx.S.timer.view,'running');
 assert.match(element.innerHTML,/tm-face[\s\S]*0:2\d\.\d/);
 step(10000);
 ctx.Logger.skipHold();
 assert.equal(ctx.S.session.logs[page.id].sets[0].cells.seconds,10);
 assert.equal(ctx.S.timer.view,'idle');
});

test('a finished hold records the prescribed seconds and a count-in stop records zero',()=>{
 const {ctx}=boot([
  {kind:'lift',letter:'A',title:'Dead Hang',section:'Strength',columns:['seconds'],prescribed:'30',setCount:1}
 ]);
 const step=clock(ctx);
 ctx.Logger.paint();
 const page=ctx.HybridSession.currentPage(ctx.S.session);
 ctx.Logger.stopHold();
 assert.equal(ctx.S.session.logs[page.id].sets[0].cells.seconds,undefined);
 ctx.Logger.startHold(page.id,0);
 ctx.Logger.stopHold();
 assert.equal(ctx.S.session.logs[page.id].sets[0].cells.seconds,0);
 ctx.Logger.startHold(page.id,0);
 step(3000+30000);
 assert.equal(ctx.S.session.logs[page.id].sets[0].cells.seconds,30);
 assert.equal(ctx.S.timer.view,'idle');
});
