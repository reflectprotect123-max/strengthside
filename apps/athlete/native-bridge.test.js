import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('./native-bridge.js', import.meta.url),'utf8');
function setup(latest = {version:'1.3.1',url:'https://example.com/update.zip'}) {
  const calls=[];
  const updater={ current:async()=>({native:'1.3.0',bundle:{version:'builtin'}}),getLatest:async()=>{calls.push('check');return latest;},download:async()=>{calls.push('download');return {id:'new',version:latest.version};},setMultiDelay:async()=>calls.push('delay'),next:async()=>calls.push('next'),reload:async()=>calls.push('reload') };
  const root={Capacitor:{isNativePlatform:()=>true,Plugins:{CapacitorUpdater:updater}},S:{session:{phase:'block'}},save:()=>calls.push('save')};
  vm.runInNewContext(source,{window:root}); return {root,calls,updater};
}
test('manual check coalesces, downloads and queues; active workout cannot restart',async()=>{
 const {root,calls}=setup();
 const results=await Promise.all([root.NativeBridge.probeLiveUpdate({refresh:true}),root.NativeBridge.probeLiveUpdate({refresh:true})]);
 assert.equal(results[0].status,'ready');assert.equal(calls.filter(x=>x==='check').length,1);
 assert.equal(await root.NativeBridge.applyLiveUpdate(),'busy');assert.ok(!calls.includes('reload'));
 root.S.session.phase='summary';assert.equal(await root.NativeBridge.applyLiveUpdate(),'restarting');assert.deepEqual(calls.slice(-2),['save','reload']);
});
test('older channel version never downloads; network errors are actionable',async()=>{
 const {root,calls,updater}=setup({version:'1.2.4',url:'https://example.com/old.zip'});
 assert.equal((await root.NativeBridge.probeLiveUpdate({refresh:true})).status,'current');assert.ok(!calls.includes('download'));
 updater.getLatest=async()=>{throw Error('offline');};
 assert.equal((await root.NativeBridge.probeLiveUpdate({refresh:true})).status,'error');
});
test('browser explains that updates require the phone install',async()=>{
 const {root}=setup();root.Capacitor.isNativePlatform=()=>false;
 assert.equal((await root.NativeBridge.probeLiveUpdate({refresh:true})).status,'browser');
});
