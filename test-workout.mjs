import {createRequire} from 'node:module';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);const {chromium}=require('/opt/codex/cua_node/lib/node_modules/playwright');
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const errors=[];page.on('pageerror',e=>errors.push(e.message));const btn=name=>page.getByRole('button',{name,exact:true});
const rate=async i=>{const box=await page.getByRole('slider').boundingBox();await page.touchscreen.tap(box.x+15+(box.width-30)*i/4,box.y+box.height/2)};
try{
 await page.goto('http://127.0.0.1:8765/strength-capgo-build/apps/mobile/capacitor/web/');
 await page.locator('[data-tab="me"]').click();await btn('Try slider demo').click();
 assert.equal(await page.getByLabel('Weight (kg)').inputValue(),'31');assert.equal(await page.getByRole('slider').getAttribute('max'),'4');
 await btn('Select Timer').click();await page.locator('[onclick="Logger.timerChoose(\'rest\')"]').click();
 await page.evaluate(()=>Logger.timerQuick(120000));await page.locator('[onclick="Logger.timerStart()"]').click();
 assert.equal(await page.evaluate(()=>S.session.restChoices.A),120000);
 await page.evaluate(()=>Logger.chevron());await rate(1);await btn('Log set').click();
 assert.equal(await page.getByLabel('Weight (kg)').inputValue(),'32');assert.equal(await page.evaluate(()=>S.timer.config.restMs),120000);assert.equal(await page.evaluate(()=>S.timer.display),'docked');
 await page.reload();assert.equal(await page.getByLabel('Weight (kg)').inputValue(),'32');assert.equal(await page.evaluate(()=>S.session.restChoices.A),120000);
 // Elapse rest, verify next log reuses the chosen duration rather than auto-starting itself.
 await page.evaluate(()=>{S.timer.startedAt=Date.now()-125000;Logger.paint()});
 assert.equal(await page.getByRole('button',{name:'Start last timer'}).count(),1);
 await btn('Start next set').click();await rate(2);await btn('Log set').click();assert.equal(await page.getByLabel('Weight (kg)').inputValue(),'32');assert.equal(await page.evaluate(()=>S.timer.config.restMs),120000);
 const started=await page.evaluate(()=>S.timer.startedAt);await page.getByRole('button',{name:/Edit set 1/}).click();await page.getByLabel('Weight (kg)').fill('30');await btn('Save changes').click();assert.equal(await page.evaluate(()=>S.timer.startedAt),started);
 await btn('Next →').click();assert.equal(await page.evaluate(()=>S.timer.last),null);assert.equal(await btn('Select Timer').count(),1);assert.equal(await page.evaluate(()=>S.session.restChoices.B??null),null);
 await rate(3);await btn('Log set').click();assert.equal(await page.getByLabel('Weight (kg)').inputValue(),'30');assert.equal(await page.evaluate(()=>S.timer.view),'idle','New exercise should not inherit rest');
 // Select a different rest duration on the new exercise and verify automatic reuse.
 await btn('Select Timer').click();await page.locator('[onclick="Logger.timerChoose(\'rest\')"]').click();await page.evaluate(()=>Logger.timerQuick(90000));await page.locator('[onclick="Logger.timerStart()"]').click();await page.evaluate(()=>Logger.chevron());
 await btn('Start next set').click();await page.getByLabel('Reps completed').fill('0');await btn('Did Not Complete').click();await btn('Log set').click();assert.equal(await page.getByLabel('Weight (kg)').inputValue(),'28');assert.equal(await page.evaluate(()=>S.timer.config.restMs),90000);
 await btn('Start next set').click();await rate(2);await btn('Log set').click();assert.equal(await page.evaluate(()=>S.timer.view),'running','Final set also starts selected rest');
 await btn('Next →').click();assert.equal(await page.evaluate(()=>S.timer.last),null);await btn('Done Training').click();await btn('3').click();await btn('Finish Session').click();assert.equal(await page.evaluate(()=>S.session.phase),'summary');assert.equal(await page.evaluate(()=>HybridSession.summaryStats(S.session).sets),5);
 await btn('Close').click();await page.locator('[data-tab="library"]').click();await page.evaluate(()=>{LibraryView.create();const t=S.library.templates.at(-1);S.library=HybridLibrary.addExercise(S.library,t.id,{title:'Squat'});save();LibraryView.open(t.id);LibraryView.editBlock(S.library.templates.at(-1).blocks[0].id)});
 assert.equal(await page.getByLabel('Target difficulty').count(),1);await page.getByLabel('Target difficulty').selectOption('hard');assert.equal(await page.evaluate(()=>HybridLibrary.compile(S.library.templates.at(-1)).blocks.find(b=>b.kind==='lift').targetEffort),'hard');
 await page.screenshot({path:'/workspace/strength-apk-build/editor-tested.png'});
 assert.deepEqual(errors,[]);console.log('PASS: five-stop slider; manual 120s choice auto-starts/reuses; timer expiry; reload; editing without restarting; Next resets timer; new 90s choice; incomplete reduction; final-set rest; summary; template target effort.');
}finally{await browser.close()}
