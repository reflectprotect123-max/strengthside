import {test,expect} from 'playwright/test';

async function openMonitor(page,mode){
 await page.route('**/engine/native-plugins.js',route=>route.fulfill({contentType:'text/javascript',body:`
 window.calls=[];window.discoveryCount=0;
 const services=[{uuid:'180d',characteristics:[{uuid:'2a37',properties:{notify:true}}]}];
 window.EngineNative={Capacitor:{isNativePlatform:()=>true},Directory:{Data:'DATA'},
 Filesystem:{readFile:async()=>{throw Error('no backup')},writeFile:async()=>{}},
 KeepAwake:{keepAwake:async()=>{},allowSleep:async()=>{}},
 App:{addListener:async()=>{},minimizeApp:async()=>{}},
 WorkoutService:{start:async()=>{},stop:async()=>{}},
 CapacitorUpdater:{notifyAppReady:async()=>{},addListener:async()=>{}},
 BleClient:{initialize:async()=>{},isEnabled:async()=>true,
 requestLEScan:async(options,callback)=>{window.scanCallback=callback;},stopLEScan:async()=>{},
 connect:async()=>{},getServices:async()=>{
  discoveryCount++;return ${JSON.stringify(mode)}==='absent'?[{uuid:'180f',characteristics:[]}]:
   ${JSON.stringify(mode)}==='stale'&&discoveryCount===1?[]:services;
 },discoverServices:async()=>calls.push('rediscover'),
 startNotifications:async(id,s,c,callback)=>{
  if(${JSON.stringify(mode)}==='notify-failure')throw Error('Characteristic not found.');
  window.hrCallback=callback;
 },stopNotifications:async()=>{},disconnect:async()=>calls.push('disconnect')}
 };
 `}));
 await page.goto('/engine/index.html');
 await page.getByRole('button',{name:'Train',exact:true}).click();
 await page.getByRole('button',{name:'Continue',exact:true}).click();
 await page.getByRole('button',{name:'Connect HR Monitor',exact:true}).click();
 await page.waitForFunction(()=>window.scanCallback);
 await page.evaluate(()=>scanCallback({device:{deviceId:'air-test',name:'Fitbit Air'}}));
 await page.getByRole('button',{name:'Fitbit Air',exact:true}).click();
}

test('Air-shaped stale service discovery recovers and standard 8/16-bit HR packets display',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await openMonitor(page,'stale');
 await expect(page.getByRole('button',{name:'Fitbit Air · Disconnect',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>calls.filter(x=>x==='rediscover').length)).toBe(1);
 for(const bytes of [[0,140],[1,180,0]]){
  await page.evaluate(bytes=>hrCallback(new DataView(Uint8Array.from(bytes).buffer)),bytes);
  await expect(page.locator('.live-hr')).toContainText(String(bytes[1]));
 }
 await page.getByRole('button',{name:'Fitbit Air · Disconnect',exact:true}).click();
 await page.evaluate(()=>hrCallback(new DataView(Uint8Array.from([0,99]).buffer)));
 await expect(page.locator('.live-hr')).toContainText('—');
 expect(errors).toEqual([]);
});

for(const mode of ['absent','notify-failure'])test(`HR ${mode} closes the link and offers reconnect`,async({page})=>{
 await openMonitor(page,mode);
 await expect(page.locator('.live-device').first()).toContainText(mode==='absent'?'180f':'Characteristic not found');
 await expect(page.getByRole('button',{name:'Connect HR Monitor',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>calls.includes('disconnect'))).toBe(true);
 expect(await page.evaluate(()=>calls.filter(x=>x==='rediscover').length)).toBe(mode==='absent'?1:0);
});
