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
      window.fetch=async()=>{syncRequests++;return Response.json({connected:true,dailyMetrics:[{date:today(),recovery:0,hrv:48.123,rhr:54,sleep:7.25,steps:0,sources:{steps:'WHOOP private feed'}}],syncedAt:new Date().toISOString()});};
      S.selectedDate=today();await EngineApp.refreshWhoop();setTab('home');
    });
    assert.equal(await page.evaluate(()=>connectionChecks),1);
    assert.equal(await page.evaluate(()=>syncRequests),1);
    assert.equal(await page.evaluate(()=>S.settings.whoop.connected),true);
    assert.equal(await page.evaluate(()=>S.whoopHistory.at(-1).hrv),48.123);
    const cards=await page.locator('.pg-cards .pg-card').allTextContents();
    assert.match(cards[0],/0\s*%/);assert.match(cards[1],/48\.1\s*ms/);assert.match(cards[2],/54\s*bpm/);
    assert.match(cards[0],/WHOOP account/);assert.match(cards[3],/7\.3\s*h/);assert.match(cards[4],/0/);assert.match(cards[4],/WHOOP private feed/);
    assert.equal(await page.evaluate(()=>S.checkin[today()].sleepHours),7.25);
    assert.equal(await page.evaluate(()=>S.checkin[today()].steps),0);
    await page.evaluate(()=>{setTab('progress');});
    assert.match(await page.locator('#app').innerText(),/7\.3/);
    await page.evaluate(()=>setTab('home'));
    assert.equal(await page.getByRole('button',{name:'Refresh WHOOP',exact:true}).count(),1);
    await page.evaluate(()=>{S.whoopHistory[0].date='2026-09-29';delete S.checkin[today()];render();});
    assert.match(await page.locator('#app').innerText(),/Latest WHOOP reading: 2026-09-29/);
    const restoreMockAccount=async()=>page.evaluate(()=>{
      Whoop.client=()=>({auth:{getSession:async()=>({data:{session:{user:{id:'synthetic-user',email:'athlete@example.test'},access_token:'synthetic-session'}}})}});
      Whoop.refreshStatus=async()=>({whoop:{connected:true}});
      PlanSync.syncNow=async()=>({ok:true});
      window.fetch=async()=>Response.json({connected:true,dailyMetrics:[{date:today(),recovery:0,hrv:48.123,rhr:54,sleep:7.25,steps:0,sources:{steps:'WHOOP private feed'}}],syncedAt:new Date().toISOString()});
      setTab('home');
    });
    // Subjective answers stay separate from WHOOP observations and daily zones.
    await page.evaluate(()=>{S.selectedDate=today();render();});
    const checkin=page.locator('.pg-daily');
    assert.equal(await checkin.getAttribute('open'),'');
    assert.equal(await checkin.locator('input:checked').count(),0);
    assert.equal(await checkin.locator('input[name="sleepHours"]').count(),0);
    await page.getByRole('button',{name:'Not now',exact:true}).click();
    await page.reload();
    await restoreMockAccount();
    assert.equal(await page.locator('.pg-daily').getAttribute('open'),null);
    assert.equal(await page.evaluate(()=>S.checkin[today()].subjectiveRecovery??null),null);
    await page.locator('.pg-daily > summary').click();
    // Empty submission must not create a completed record.
    await page.evaluate(()=>Progress.saveDaily({preventDefault(){},target:document.querySelector('.pg-daily form')},today()));
    assert.equal(await page.evaluate(()=>S.checkin[today()].subjectiveRecovery??null),null);
    assert.match(await page.locator('#dailyCheckinError').innerText(),/all three/);
    await page.getByRole('radio',{name:'Sleep quality: 4',exact:true}).check();
    // A concurrent WHOOP refresh re-renders Home without losing the draft.
    await page.evaluate(async()=>{await EngineApp.refreshWhoop();});
    assert.equal(await page.getByRole('radio',{name:'Sleep quality: 4',exact:true}).isChecked(),true);
    await page.getByRole('radio',{name:'Soreness: 2',exact:true}).check();
    await page.getByRole('radio',{name:'How do you feel?: 5 — Great',exact:true}).check();
    const observed=await page.evaluate(()=>({recovery:S.checkin[today()].whoopRecovery,sleep:S.checkin[today()].sleepHours,zones:LiveWorkout.calculatedZones()}));
    await page.getByRole('button',{name:'Save check-in',exact:true}).click();
    assert.equal(await page.locator('.pg-daily').getAttribute('open'),null);
    assert.match(await page.locator('.pg-daily > summary').innerText(),/Completed/);
    assert.equal(await page.evaluate(()=>S.checkin[today()].subjectiveRecovery.sleepQuality),4);
    assert.equal(await page.evaluate(()=>S.checkin[today()].subjectiveRecovery.soreness),2);
    assert.equal(await page.evaluate(()=>S.checkin[today()].subjectiveRecovery.wellbeing),5);
    await page.reload();
    await restoreMockAccount();
    assert.equal(await page.locator('.pg-daily').getAttribute('open'),null);
    await page.locator('.pg-daily > summary').click();
    await page.getByRole('button',{name:'Edit check-in',exact:true}).click();
    await page.getByRole('radio',{name:'Soreness: 5 — Very sore',exact:true}).check();
    await page.getByRole('button',{name:'Cancel',exact:true}).click();
    assert.equal(await page.evaluate(()=>S.checkin[today()].subjectiveRecovery.soreness),2);
    await page.evaluate(async()=>{await EngineApp.refreshWhoop();});
    assert.equal(await page.evaluate(()=>S.checkin[today()].subjectiveRecovery.wellbeing),5);
    assert.deepEqual(await page.evaluate(()=>({recovery:S.checkin[today()].whoopRecovery,sleep:S.checkin[today()].sleepHours,zones:LiveWorkout.calculatedZones()})),observed);
    await page.evaluate(()=>{S.selectedDate='2026-09-28';render();});
    assert.equal(await page.locator('.pg-daily form').count(),0);
    assert.equal(await page.locator('.pg-daily').getAttribute('open'),null);
    // A new date has no inherited answers and prompts again.
    await page.evaluate(()=>{const previous=today;window.today=()=> '2026-10-04';S.selectedDate=today();render();window.restoreToday=previous;});
    assert.equal(await page.locator('.pg-daily').getAttribute('open'),'');
    assert.equal(await page.locator('.pg-daily input:checked').count(),0);
    for(const width of [320,393]){await page.setViewportSize({width,height:852});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
    await page.screenshot({path:'/workspace/previews/daily-recovery-checkin.png',fullPage:true});
    await page.evaluate(()=>{window.today=restoreToday;});
    assert.deepEqual(errors,[]);
    console.log('PASS: existing-account connection discovery, WHOOP sync to Home, precise HRV, zero recovery, dated stale readings and independent daily questionnaire save/skip/edit/reload/sync (synthetic account).');
  }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
