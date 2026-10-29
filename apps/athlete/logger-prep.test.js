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

test('a finished warm-up countdown logs its seconds before auto-advancing',()=>{
 const {ctx}=boot([{id:'W',kind:'lift',letter:'A',title:'Bike Easy',section:'Warm-Up',columns:['seconds'],setCount:1,repTarget:'90',prescribed:'90',countIn:3},
               {id:'X',kind:'lift',letter:'B',title:'Plank Hold',section:'Warm-Up',columns:['seconds'],setCount:1,repTarget:'30',prescribed:'30'}]);
 const step=clock(ctx);
 ctx.Logger.paint();
 const page=ctx.HybridSession.currentPage(ctx.S.session);
 step((Number(ctx.S.timer.config?.countInMs)||0)+(Number(ctx.S.timer.config?.totalMs)||94000));
 const w=ctx.S.session.logs[page.id].sets[0];
 assert.equal(w.logged,true);assert.equal(Number(w.cells.seconds),90);assert.notEqual(w.reps,8);
});

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

test('eachSide flag drives side handling without a title suffix',()=>{
 const carry=boot([{id:'C',kind:'lift',letter:'A',title:'Suitcase Carry',eachSide:true,columns:['meters','weight_kg'],setCount:2,repTarget:'20'}]);
 const page=carry.ctx.HybridSession.currentPage(carry.ctx.S.session);
 const sides=carry.ctx.Logger.sidesFor?carry.ctx.Logger.sidesFor(page):null;
 assert.equal(sides,2);
 const hold=boot([
  {kind:'lift',letter:'F1',title:'DB RDL',columns:['reps','weight_kg'],setCount:1,repTarget:'8'},
  {kind:'lift',letter:'F2',title:'Side Plank',eachSide:true,section:'Strength',columns:['seconds'],repTarget:'30',setCount:1}
 ]);
 hold.ctx.Logger.paint();
 const pair=hold.ctx.HybridSession.currentPage(hold.ctx.S.session);
 const plank=pair.members.find(m=>m.title==='Side Plank');
 hold.ctx.Logger.startHold(plank.id,0);
 assert.match(hold.element.innerHTML,/Side Plank · side 1/);
 assert.doesNotMatch(hold.element.innerHTML,/DB RDL \/ Side Plank · side/);
});

test('superset rest uses coach restSec and skips a one-member ramp round',()=>{
 const {ctx}=boot([
  {kind:'lift',letter:'F1',title:'DB Bench Press',restSec:75,columns:['reps','weight_kg'],setCount:1,repTarget:'8',equipmentId:'dumbbell',loadConvention:'per_hand'},
  {kind:'lift',letter:'F2',title:'Chin-up',columns:['reps','weight_kg'],setCount:1,repTarget:'5'}
 ]);
 const page=ctx.HybridSession.currentPage(ctx.S.session);
 const bench=page.members.find(m=>m.title==='DB Bench Press');
 const chin=page.members.find(m=>m.title==='Chin-up');
 ctx.S.session.logs[bench.id].sets.unshift({purpose:'ramp',reps:8,kg:10,effort:'easy',logged:false,miss:false,cells:{}});
 ctx.Logger.check(bench.id,0);
 assert.notEqual(ctx.S.timer.mode,'rest');
 assert.equal(ctx.S.session.logs[bench.id].sets[0].logged,true);
 assert.equal(ctx.S.session.logs[bench.id].sets[0].purpose,'ramp');
 const work=ctx.S.session.logs[bench.id].sets.findIndex(r=>r.purpose!=='ramp');
 ctx.S.session.logs[bench.id].sets[work].reps=8;
 ctx.S.session.logs[bench.id].sets[work].kg=24;
 ctx.S.session.logs[bench.id].sets[work].effort='average';
 ctx.S.session.logs[chin.id].sets[0].reps=5;
 ctx.S.session.logs[chin.id].sets[0].kg=0;
 ctx.S.session.logs[chin.id].sets[0].effort='average';
 ctx.Logger.check(bench.id,work);
 assert.notEqual(ctx.S.timer.mode,'rest');
 ctx.Logger.check(chin.id,0);
 assert.equal(ctx.S.timer.mode,'rest');
 assert.equal(ctx.S.timer.config.restMs,75000);
});

test('a prep result posted before the logger opens is kept',()=>{
 const {ctx}=runtime();
 const element={innerHTML:'',classList:{add(){},remove(){}},querySelector(){return null;}};
 ctx.document={getElementById:id=>['logger','shell'].includes(id)?element:null};
 ctx.setInterval=()=>1;ctx.clearInterval=()=>{};
 ctx.window=ctx;
 const listeners=[];
 ctx.addEventListener=(type,fn)=>{if(type==='message')listeners.push(fn);};
 for(const name of ['timer','logger'])vm.runInContext(readFileSync(new URL(`./${name}.js`,import.meta.url),'utf8'),ctx);
 ctx.S={loggerOpen:false,timer:ctx.HybridTimer.create(),session:null,selectedDate:'2026-11-02'};
 ctx.Logger.paint();
 listeners[0]({data:{type:'hybrid-prep-result',phase:'warmup',items:[{id:'bike',title:'Bike Easy',status:'completed'}]}});
 ctx.Logger.open({date:'2026-11-02',plan:{title:'Monday',blocks:[{kind:'lift',letter:'A',title:'Back Squat',columns:['reps','weight_kg'],setCount:1,repTarget:'5'}]}});
 assert.equal(ctx.S.session.prep.warmup[0].title,'Bike Easy');
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
