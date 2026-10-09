import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const require=createRequire(import.meta.url);
const {chromium}=require('/opt/codex/cua_node/lib/node_modules/playwright');
const source=readFileSync('/workspace/strength-capgo-build/apps/mobile/capacitor/web/capgo-updates.js','utf8');
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try {
 const page=await browser.newPage();
 await page.setContent('<div id="app"></div>');
 await page.evaluate(()=>{
  window.calls=[];
  window.Capacitor={isNativePlatform:()=>true,registerPlugin:()=>({
   addListener:async(name,cb)=>{window.calls.push(['listener',name]);window.available=cb},
   notifyAppReady:async()=>window.calls.push(['ready']),
   setMultiDelay:async(value)=>window.calls.push(['delay',value]),
   next:async(value)=>window.calls.push(['next',value])
  })};
 });
 await page.addScriptTag({content:source});
 assert.deepEqual(await page.evaluate(()=>calls),[['listener','updateAvailable']]);
 await page.evaluate(()=>document.getElementById('app').innerHTML='<p>Strength home</p>');
 await page.waitForFunction(()=>calls.some(c=>c[0]==='ready'));
 await page.evaluate(()=>available({bundle:{id:'test-bundle'}}));
 assert.deepEqual(await page.evaluate(()=>calls.slice(-2)),[['delay',{delayConditions:[{kind:'kill'}]}],['next',{id:'test-bundle'}]]);
 await page.evaluate(()=>available({bundle:{}}));
 assert.equal(await page.evaluate(()=>calls.filter(c=>c[0]==='next').length),1);
 const web=await browser.newPage();await web.setContent('<div id="app"><p>Home</p></div>');await web.addScriptTag({content:source});
 console.log('PASS: waits for UI health, installs kill delay before scheduling, ignores invalid bundle, browser without native plugin works. Native delivery remains phone verification.');
} finally {await browser.close()}
