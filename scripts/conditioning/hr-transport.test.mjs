import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const context=vm.createContext({EventTarget,Event,DOMException});
vm.runInContext(fs.readFileSync(new URL('./hr-transport.js',import.meta.url),'utf8'),context);
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

function bondSetup({bonded=false,rejectBond=false,expose=true}={}){
 const calls=[];let refreshed=0;
 const ble={connect:async()=>{},stopNotifications:async()=>{},disconnect:async()=>calls.push('disconnect'),
 getServices:async()=>refreshed>=2&&expose?services:[],discoverServices:async()=>{refreshed++;calls.push('discover');},
 isBonded:async()=>{calls.push('isBonded');return bonded;},createBond:async(id,options)=>{assert.equal(options.timeout,30000);calls.push('bond');if(rejectBond)throw Error('Pairing declined');bonded=true;}};
 const device=context.EngineHrTransport.createDevice(ble,{deviceId:'air',name:'Fitbit Air'},()=>{},{android:true});
 return {device,calls};
}
test('Android Fitbit missing HR awaits pairing and rediscovery before reporting connected',async()=>{
 const x=bondSetup();await x.device.gatt.connect();assert.equal(x.device.gatt.connected,true);assert.deepEqual(x.calls,['discover','isBonded','bond','isBonded','discover']);
});
test('declined pairing closes connection without another pairing attempt',async()=>{
 const x=bondSetup({rejectBond:true});await assert.rejects(x.device.gatt.connect(),/Pairing declined/);assert.equal(x.device.gatt.connected,false);assert.deepEqual(x.calls,['discover','isBonded','bond','disconnect']);
});
test('already bonded Fitbit is not re-paired and persistent missing service has bond diagnostics',async()=>{
 const x=bondSetup({bonded:true,expose:false});await assert.rejects(x.device.gatt.connect(),/already paired/);assert.equal(x.calls.includes('bond'),false);assert.equal(x.calls.at(-1),'disconnect');
});
test('bonding alone does not count as a usable heart-rate connection',async()=>{
 const x=bondSetup({expose:false});await assert.rejects(x.device.gatt.connect(),/paired, HR service still missing/);assert.equal(x.device.gatt.connected,false);assert.equal(x.calls.filter(c=>c==='bond').length,1);
});

test('working Android Fitbit and missing non-Android/non-Fitbit devices never force pairing',async()=>{
 for(const [name,android,rows] of [['Fitbit Air',true,services],['WHOOP',true,[]],['Fitbit Air',false,[]]]){
  let bonds=0;const ble={connect:async()=>{},getServices:async()=>rows,discoverServices:async()=>{},stopNotifications:async()=>{},disconnect:async()=>{},isBonded:async()=>false,createBond:async()=>bonds++};
  const d=context.EngineHrTransport.createDevice(ble,{deviceId:'test',name},()=>{},{android});
  if(rows.length)await d.gatt.connect();else await assert.rejects(d.gatt.connect());
  assert.equal(bonds,0);
 }
});
test('disconnect while awaiting pairing prevents rediscovery and connected state',async()=>{
 let release,ready,bonded=false;const started=new Promise(r=>ready=r),paired=new Promise(r=>release=r);let discoveries=0;
 const ble={connect:async()=>{},getServices:async()=>[],discoverServices:async()=>discoveries++,stopNotifications:async()=>{},disconnect:async()=>{},isBonded:async()=>bonded,createBond:async()=>{ready();await paired;bonded=true;}};
 const d=context.EngineHrTransport.createDevice(ble,{deviceId:'air',name:'Fitbit Air'},()=>{},{android:true});
 const pending=d.gatt.connect();await started;await d.gatt.disconnect();release();await assert.rejects(pending,/interrupted/);assert.equal(discoveries,1);assert.equal(d.gatt.connected,false);
});
