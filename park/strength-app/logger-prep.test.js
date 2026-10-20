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
