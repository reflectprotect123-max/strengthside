const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('/home/agent/.local/lib/node_modules/@playwright/cli/node_modules/playwright');
(async()=>{
  const root=path.resolve(__dirname,'../../apps/athlete/conditioning');
  const server=http.createServer((q,r)=>{const name=q.url==='/native-plugins.js'?'native-plugins.js':'index.html';r.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':'text/html');r.end(fs.readFileSync(path.join(root,name)));});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:393,height:852}}),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto('http://127.0.0.1:'+server.address().port);
    await page.evaluate(async()=>{
      window.connectionChecks=0;window.syncRequests=0;
      Whoop.client=()=>({auth:{getSession:async()=>({data:{session:{user:{id:'synthetic-user',email:'athlete@example.test'},access_token:'synthetic-session'}}})}});
      Whoop.refreshStatus=async()=>{connectionChecks++;return {whoop:{connected:true}};};
      PlanSync.syncNow=async()=>({ok:true});
      window.fetch=async()=>{syncRequests++;return Response.json({connected:true,dailyMetrics:[{date:today(),recovery:0,hrv:48.123,rhr:54}],syncedAt:new Date().toISOString()});};
      S.selectedDate=today();await EngineApp.refreshWhoop();setTab('home');
    });
    assert.equal(await page.evaluate(()=>connectionChecks),1);
    assert.equal(await page.evaluate(()=>syncRequests),1);
    assert.equal(await page.evaluate(()=>S.settings.whoop.connected),true);
    assert.equal(await page.evaluate(()=>S.whoopHistory.at(-1).hrv),48.123);
    const cards=await page.locator('.pg-cards .pg-card').allTextContents();
    assert.match(cards[0],/0\s*%/);assert.match(cards[1],/48\.1\s*ms/);assert.match(cards[2],/54\s*bpm/);
    assert.match(cards[0],/WHOOP account/);
    assert.equal(await page.getByRole('button',{name:'Refresh WHOOP',exact:true}).count(),1);
    await page.evaluate(()=>{S.whoopHistory[0].date='2026-09-29';delete S.checkin[today()];render();});
    assert.match(await page.locator('#app').innerText(),/Latest WHOOP reading: 2026-09-29/);
    assert.deepEqual(errors,[]);
    console.log('PASS: existing-account connection discovery, WHOOP sync to Home, precise HRV, zero recovery and dated stale readings (synthetic account).');
  }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
