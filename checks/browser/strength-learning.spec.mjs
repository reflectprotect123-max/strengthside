import {test,expect} from 'playwright/test';

async function actualNumber(page,label,value){await page.getByLabel(label,{exact:true}).click();const pad=page.locator('.log-pad');for(const key of String(value))await pad.getByRole('button',{name:key,exact:true}).click();await pad.getByRole('button',{name:'Save',exact:true}).click();}
async function builder(page){await page.goto('/');await page.getByRole('heading',{name:'Today',exact:true}).waitFor();await page.getByRole('button',{name:'Add',exact:true}).click();await page.getByRole('button',{name:'Create session',exact:true}).click();}
async function setReps(page,label,value){await page.getByRole('button',{name:label,exact:true}).click();const pad=page.getByRole('dialog',{name:'Reps keypad'});for(const key of String(value))await pad.getByRole('button',{name:key,exact:true}).click();await pad.getByRole('button',{name:'Close keypad',exact:true}).click();}
async function log(page,kg,reps,effort=2){await actualNumber(page,'Weight (kg)',kg);await actualNumber(page,'Reps completed',reps);const slider=page.getByRole('slider',{name:'Actual set effort'});await slider.press('Home');for(let i=0;i<effort;i++)await slider.press('ArrowRight');await page.getByRole('button',{name:/^(Log set|Save changes)$/,exact:true}).click();}
async function passWarmups(page){for(let guard=0;guard<20;guard++){const section=await page.evaluate(()=>{const s=window.S?.session;if(!s||s.phase!=='block')return '';return s.pages?.[s.blockIndex]?.section||'';});if(section&&section!=='Warm-Up')return;const total=await page.evaluate(()=>Number(window.S?.timer?.config?.totalMs)||0);if(total>0&&await page.locator('#logTimerFull').count())await page.clock.fastForward(total+500);await page.getByRole('button',{name:'Next →',exact:true}).click();}throw new Error('warm-up did not finish');}
async function beginSession(page){await page.clock.install();await page.getByRole('button',{name:'Start Session',exact:true}).click();await page.clock.fastForward(2000);await page.getByRole('button',{name:'Got It',exact:true}).click();await passWarmups(page);}
async function addSquat(page){await builder(page);await page.getByRole('button',{name:'Next',exact:true}).click();await page.getByRole('button',{name:'+ Add Exercise',exact:true}).click();await page.getByRole('button',{name:'Back Squat',exact:true}).click();await page.getByRole('button',{name:'Add (1)',exact:true}).click();await page.getByRole('button',{name:'Next',exact:true}).click();}
async function scheduleAndStart(page){await page.getByRole('button',{name:'Next',exact:true}).click();await page.getByRole('button',{name:'Next',exact:true}).click();await page.getByRole('button',{name:'Post to calendar',exact:true}).click();await beginSession(page);}
async function completeWarmups(page){for(const kg of [10,20]){await log(page,kg,5,1);await page.getByRole('button',{name:'Start next set',exact:true}).click();}}


for(const prescription of [[5,3,1],['6–8','6–8','6–8']])test(`finished ${prescription.join('/')} learns through real controls offline`,async({page,context},testInfo)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await addSquat(page);await page.evaluate(()=>StrengthMemory.bind('browser-athlete'));
 for(let i=0;i<3;i++)await setReps(page,`Set ${i+1} reps`,prescription[i]);
 await expect(page.getByLabel('Target difficulty')).toHaveCount(0);
 await scheduleAndStart(page);await completeWarmups(page);await context.setOffline(true);
 for(let i=0;i<3;i++){
   const reps=typeof prescription[i]==='number'?prescription[i]:6;
   await expect(page.locator('.log-set-heading span')).toHaveText(`${prescription[i]==='6–8'?'6–8':reps} reps`);
   await log(page,40,reps,2);
   if(i<2)await page.getByRole('button',{name:'Start next set',exact:true}).click();
 }
 expect(await page.evaluate(()=>Object.values(StrengthMemory.records()).filter(r=>r.kind==='set'&&r.payload.completed).length)).toBe(0);
 await page.getByRole('button',{name:'Next →',exact:true}).click();await page.getByRole('button',{name:'Done Training',exact:true}).click();
 await page.getByRole('button',{name:'3',exact:true}).click();await page.getByRole('button',{name:'Finish Session',exact:true}).click();
 await expect(page.locator('.log-sum')).toBeVisible();
 const evidence=await page.evaluate(()=>{const p=S.session.pages.find(page=>page.title==='Back Squat'),h=StrengthMemory.replay(StrengthBrain.key(p));return {accepted:h.accepted,ids:h.evidence.map(e=>e.observation.id),normalized:h.evidence[0]?.normalizedLoad,rows:S.session.logs[p.id].sets.length};});
 expect(evidence.accepted).toBe(1);expect(evidence.rows).toBe(5);expect(evidence.normalized.externalKg).toBe(60);
 await context.setOffline(false);await page.reload();
 expect(await page.evaluate(()=>Object.values(StrengthMemory.records()).filter(r=>r.kind==='set'&&r.payload.completed).length)).toBe(5);
 expect(errors).toEqual([]);await page.screenshot({path:testInfo.outputPath('completed-learning-session.png')});
});
test('quota failure does not acknowledge a logged set',async({page})=>{
 await addSquat(page);await scheduleAndStart(page);await actualNumber(page,'Weight (kg)',10);await actualNumber(page,'Reps completed',5);
 await page.getByRole('slider',{name:'Actual set effort'}).press('End');
 await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('Quota exceeded','QuotaExceededError');};});
 await page.getByRole('button',{name:'Log set',exact:true}).click();
 expect(await page.evaluate(()=>S.session.logs[S.session.pages.find(p=>p.title==='Back Squat').id].sets[0].logged)).toBe(false);
 await expect(page.getByText('Could not save. Free some storage and try again.',{exact:true})).toBeVisible();
});
test('logging out removes the previous owner’s evidence from active memory',async({page})=>{
 await addSquat(page);await page.evaluate(()=>StrengthMemory.bind('a'));await scheduleAndStart(page);await log(page,10,5,1);
 expect(await page.evaluate(()=>Object.keys(StrengthMemory.records()).length)).toBeGreaterThan(0);
 await page.evaluate(()=>signOutStrengthAccount());
 expect(await page.evaluate(()=>StrengthMemory.ownerId())).toBe(null);
 expect(await page.evaluate(()=>Object.keys(StrengthMemory.records()).length)).toBe(0);
 await page.evaluate(()=>StrengthMemory.bind('a'));
 expect(await page.evaluate(()=>Object.keys(StrengthMemory.records()).length)).toBeGreaterThan(0);
});
test('Android-size touch effort and a double tap cannot log the next set accidentally',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await addSquat(page);await scheduleAndStart(page);await actualNumber(page,'Weight (kg)',10);await actualNumber(page,'Reps completed',5);
 const slider=page.getByRole('slider',{name:'Actual set effort'}),box=await slider.boundingBox();
 await page.touchscreen.tap(box.x+box.width*.75,box.y+box.height/2);
 await expect(slider).toHaveAttribute('aria-valuetext','Hard');
 await page.getByRole('button',{name:'Log set',exact:true}).dblclick();
 const facts=await page.evaluate(()=>{const rows=S.session.logs[S.session.pages.find(p=>p.title==='Back Squat').id].sets;return {logged:rows.filter(r=>r.logged).length,effort:rows[0].effort,sets:Object.values(StrengthMemory.records()).filter(r=>r.kind==='set').length};});
 expect(facts).toEqual({logged:1,effort:'hard',sets:1});expect(errors).toEqual([]);
});
