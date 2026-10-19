import {test,expect} from 'playwright/test';

for(const status of ['running','paused'])test(`Engine update preserves a ${status} workout across restart`,async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/engine/native-plugins.js',route=>route.fulfill({contentType:'text/javascript',body:`
 window.EngineNative={Capacitor:{isNativePlatform:()=>true},Directory:{Data:'DATA'},
 Filesystem:{readFile:async()=>{throw Error('no backup')},writeFile:async()=>{}},
 KeepAwake:{keepAwake:async()=>{},allowSleep:async()=>{}},App:{addListener:async()=>{},minimizeApp:async()=>{}},WorkoutService:{start:async()=>{},stop:async()=>{}},
 CapacitorUpdater:{notifyAppReady:async()=>{},addListener:async()=>{},current:async()=>({bundle:{id:'current',version:'1.3.16'},native:'1.3.0'}),list:async()=>({bundles:[]}),getLatest:async()=>({version:'1.3.17',url:'https://example.test/update.zip'}),download:async()=>({id:'update',version:'1.3.17',status:'pending'}),set:async()=>{sessionStorage.setItem('engine-update-applied','yes');location.reload();}}};
 `}));
 await page.goto('/engine/index.html');
 await page.getByRole('button',{name:'Train',exact:true}).click();
 await page.getByRole('button',{name:'Continue',exact:true}).click();
 await page.getByRole('button',{name:'Start workout',exact:true}).click();
 if(status==='paused')await page.getByRole('button',{name:'Pause workout',exact:true}).click();
 await page.evaluate(()=>{S.liveWorkout.notes='Keep this unfinished workout';save();setTab('me');});
 const before=await page.evaluate(()=>JSON.parse(JSON.stringify(S.liveWorkout)));
 expect(before.status).toBe(status);
 await page.getByRole('button',{name:'Check for updates',exact:true}).click();
 const restart=page.getByRole('button',{name:'Restart now',exact:true});
 await expect(restart).toBeEnabled();
 await Promise.all([page.waitForEvent('load'),restart.click()]);
 await page.waitForFunction(()=>window.EngineUpdates&&window.S?.liveWorkout);
 const after=await page.evaluate(()=>S.liveWorkout);
 expect(after.id).toBe(before.id);expect(after.status).toBe('paused');
 expect(after.notes).toBe(before.notes);expect(after.samples).toEqual(before.samples);
 expect(after.elapsed).toBeGreaterThanOrEqual(before.elapsed);
 expect(after.elapsed-before.elapsed).toBeLessThan(5);
 expect(await page.evaluate(()=>sessionStorage.getItem('engine-update-applied'))).toBe('yes');
 expect(errors).toEqual([]);
});
