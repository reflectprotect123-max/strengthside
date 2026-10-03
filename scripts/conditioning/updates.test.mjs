import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('./updates.js',import.meta.url),'utf8');

function setup({bundles=[],latest={version:'1.1.2',url:'https://example.test/update.zip'},flushFailure=false}={}){
  const calls=[],listeners={};
  const plugin={
    notifyAppReady:async()=>calls.push('ready'),
    addListener:async(name,fn)=>{listeners[name]=fn;},
    current:async()=>({bundle:{id:'builtin',version:'builtin'},native:'1.1.1'}),
    list:async()=>({bundles}),getLatest:async()=>latest,
    download:async options=>{calls.push('download');return {id:'new-bundle',version:options.version,status:'pending'};},
    set:async()=>calls.push('apply'),
  };
  const window={EngineNative:{Capacitor:{isNativePlatform:()=>true},CapacitorUpdater:plugin},S:{liveWorkout:{status:'finished'}},render:()=>{},EngineApp:{flushStorage:async()=>{calls.push('save');if(flushFailure)throw Error('disk failure');}}};
  vm.runInNewContext(source,{window});
  return {api:window.EngineUpdates,window,calls,listeners};
}

test('boot confirms readiness and restores a downloaded pending update without selecting an old bundle',async()=>{
  const ctx=setup({bundles:[{id:'old',version:'1.0.100',status:'success',downloaded:'2026-10-03'},{id:'new',version:'1.1.2',status:'pending',downloaded:'2026-10-02'}]});
  await ctx.api.ready();
  assert.equal(ctx.calls[0],'ready');
  assert.match(ctx.api.html(),/Update 1.1.2 is ready/);
  await ctx.api.apply();assert.deepEqual(ctx.calls,['ready','save','apply']);
});
test('downloads an update but refuses to reload a running or paused workout',async()=>{
  const ctx=setup();await ctx.api.ready();await ctx.api.check();
  for(const status of ['running','paused']){ctx.window.S.liveWorkout.status=status;await ctx.api.apply();assert.match(ctx.api.html(),/Finish your workout/);}
  assert.deepEqual(ctx.calls,['ready','download']);
  ctx.window.S.liveWorkout.status='finished';await ctx.api.apply();assert.deepEqual(ctx.calls,['ready','download','save','apply']);
});
test('failed state flush keeps the existing app loaded',async()=>{
  const ctx=setup({flushFailure:true});await ctx.api.ready();await ctx.api.check();await ctx.api.apply();
  assert.equal(ctx.calls.includes('apply'),false);assert.match(ctx.api.html(),/could not be applied/);
});
test('blocked and failed server responses are distinguished from up-to-date',async()=>{
  for(const [latest,expected] of [[{kind:'blocked',error:'native_version'},/newer APK/],[{kind:'failed',error:'server_failed'},/unavailable/],[{kind:'up_to_date',version:'1.1.1'},/up to date/]]){
    const ctx=setup({latest});await ctx.api.ready();await ctx.api.check();assert.match(ctx.api.html(),expected);assert.equal(ctx.calls.includes('download'),false);
  }
});
test('an older downloaded release cannot become an offered update',async()=>{
  const ctx=setup({bundles:[{id:'old',version:'1.0.100',status:'success',downloaded:'2026-10-03'}]});await ctx.api.ready();await ctx.api.apply();
  assert.doesNotMatch(ctx.api.html(),/Restart now/);assert.deepEqual(ctx.calls,['ready']);
});
