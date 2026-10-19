import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const context=vm.createContext({EventTarget,Event,DOMException});
vm.runInContext(fs.readFileSync(new URL('../apps/athlete/engine/index.html',import.meta.url),'utf8').match(/\/\* Standard Bluetooth Heart Rate transport[\s\S]*?\}\)\(globalThis\);/)[0],context);
const services=[{uuid:'180d',characteristics:[{uuid:'2a37',properties:{notify:true}}]}];
function setup(maps=[services],notifyError=false){
 const calls=[];let callback,ended;
 const ble={connect:async(id,cb)=>{ended=cb;calls.push('connect');},getServices:async()=>maps.length>1?maps.shift():maps[0],discoverServices:async()=>calls.push('discover'),disconnect:async()=>calls.push('disconnect'),stopNotifications:async()=>{},startNotifications:async(id,s,c,cb)=>{callback=cb;if(notifyError)throw Error('Characteristic not found.');}};
 const device=context.EngineHrTransport.createDevice(ble,{deviceId:'test',name:'Air'},()=>{});
 return {device,calls,packet:()=>callback(new DataView(new ArrayBuffer(2))),ended:()=>ended()};
}
test('standard HR device streams and rejects stale callbacks after disconnect',async()=>{const x=setup();const s=await x.device.gatt.connect();const c=await(await s.getPrimaryService('heart_rate')).getCharacteristic('heart_rate_measurement');let count=0;c.addEventListener('characteristicvaluechanged',()=>count++);await c.startNotifications();x.packet();assert.equal(count,1);await x.device.gatt.disconnect();x.packet();assert.equal(count,1);assert.equal(x.device.gatt.connected,false);assert.deepEqual(x.calls,['connect','disconnect']);});
test('refresh discovery only once when initial services are stale',async()=>{const x=setup([[],services]);await x.device.gatt.connect();assert.deepEqual(x.calls,['connect','discover']);assert.equal(x.device.gatt.connected,true);});
test('absent HR service disconnects with useful service diagnostics',async()=>{const x=setup([[{uuid:'180f',characteristics:[]}]]);await assert.rejects(x.device.gatt.connect(),/180f/);assert.equal(x.device.gatt.connected,false);assert.deepEqual(x.calls,['connect','discover','disconnect']);});
test('absent measurement characteristic or non-notifiable characteristic is rejected',async()=>{for(const characteristics of [[],[{uuid:'2a37',properties:{read:true}}]]){const x=setup([[{uuid:'180d',characteristics}]]);await assert.rejects(x.device.gatt.connect(),/heart-rate measurement/);assert.equal(x.device.gatt.connected,false);}});
test('notification setup failure closes link and allows another attempt',async()=>{const x=setup([services],true);const s=await x.device.gatt.connect();const c=await(await s.getPrimaryService('heart_rate')).getCharacteristic('heart_rate_measurement');await assert.rejects(c.startNotifications(),/Characteristic not found/);assert.equal(x.device.gatt.connected,false);assert.equal(x.calls.at(-1),'disconnect');await x.device.gatt.connect();assert.equal(x.device.gatt.connected,true);});
test('invalid requested service and characteristic are not fabricated',async()=>{const x=setup();const s=await x.device.gatt.connect();await assert.rejects(s.getPrimaryService('180f'));await assert.rejects((await s.getPrimaryService('180d')).getCharacteristic('2a19'));});
test('disconnect during discovery cannot mark an old connection active',async()=>{
 let release,ready;const started=new Promise(r=>ready=r),servicesReady=new Promise(r=>release=r);
 const ble={connect:async()=>{},getServices:async()=>{ready();return servicesReady;},disconnect:async()=>{},stopNotifications:async()=>{}};
 const d=context.EngineHrTransport.createDevice(ble,{deviceId:'test'},()=>{});
 const pending=d.gatt.connect();await started;await d.gatt.disconnect();release(services);
 await assert.rejects(pending,/interrupted/);assert.equal(d.gatt.connected,false);
});
