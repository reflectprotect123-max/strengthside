async function actualNumber(page,label,value){await page.getByLabel(label,{exact:true}).click();const pad=page.locator('.log-pad');for(const key of String(value))await pad.getByRole('button',{name:key,exact:true}).click();await pad.getByRole('button',{name:'Save',exact:true}).click();}
import {test,expect} from 'playwright/test';
async function enterSetReps(page,n,value){await page.getByRole('button',{name:`Set ${n} reps`,exact:true}).click();const pad=page.getByRole('dialog',{name:'Reps keypad'});for(const key of value)await pad.getByRole('button',{name:key==='-'?'–':key,exact:true}).click();await pad.getByRole('button',{name:'Close keypad',exact:true}).click();}
async function builder(page){await page.goto('/');await page.getByRole('heading',{name:'Today',exact:true}).waitFor();await page.getByRole('button',{name:'Add',exact:true}).click();await page.getByRole('button',{name:'Create session',exact:true}).click();}
test('custom exercise and custom circuit creation',async({page})=>{
 await builder(page);await page.getByRole('button',{name:'+ Add Exercise',exact:true}).click();await page.getByRole('button',{name:'Create New Exercise'}).click();
 await expect(page.getByRole('heading',{name:'New Exercise',exact:true})).toBeVisible({timeout:5000});
 await page.locator('#libNewTitle').fill('Test Curl');await page.locator('#libNewC2').selectOption('weight_kg');await page.getByRole('button',{name:'Create',exact:true}).click();
 await expect(page.locator('.lib-block')).toContainText('Test Curl');
 await page.getByRole('button',{name:'+ Add Circuit',exact:true}).click();await page.getByRole('button',{name:'Create New Circuit'}).click();await page.locator('#libNewTitle').fill('Recovery Breathing');await page.locator('#libNewInstr').fill('Ten slow breaths');await page.getByRole('button',{name:'Create',exact:true}).click();await expect(page.locator('.lib-block').last()).toContainText('Recovery Breathing');
});

test('build, schedule, play full session, reopen history and check next session',async({page},testInfo)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await builder(page);
 const title=page.locator('.lib-field').filter({has:page.locator('label',{hasText:/^Title$/})}).locator('input');
 await title.fill('Full CLI strength session');await title.press('Tab');
 await page.getByRole('button',{name:'+ Add Exercise',exact:true}).click();await page.getByRole('button',{name:'Back Squat',exact:true}).click();await page.getByRole('button',{name:'Add (1)',exact:true}).click();
 await expect(page.getByLabel('Target difficulty')).toHaveCount(0);await expect(page.getByLabel('Smallest weight increase (kg)')).toHaveCount(0);
 for(const n of [1,2,3])await enterSetReps(page,n,'6-8');
 await page.getByRole('button',{name:'+ Add Exercise',exact:true}).click();await page.getByRole('button',{name:'Create New Exercise'}).click();await page.locator('#libNewTitle').fill('Dumbbell Curl');await page.locator('#libNewC2').selectOption('weight_kg');await page.getByRole('button',{name:'Create',exact:true}).click();
 await page.getByRole('button',{name:'Remove a set',exact:true}).last().click();
 for(const n of [1,2])await page.locator('.lib-block').last().getByRole('button',{name:`Set ${n} reps`,exact:true}).click().then(async()=>{const pad=page.getByRole('dialog',{name:'Reps keypad'});await pad.getByRole('button',{name:'5',exact:true}).click();await pad.getByRole('button',{name:'Close keypad',exact:true}).click();});
 await expect(page.locator('.lib-block').first()).toContainText('3 x 6-8');await expect(page.locator('.lib-block').last()).toContainText('2 x 5');
 await page.getByRole('button',{name:'Post to calendar',exact:true}).click();const day=await page.getByLabel('Session date').inputValue();await page.getByRole('button',{name:'Post to calendar',exact:true}).click();
 await page.reload();await expect(page.locator('.trn-block--lift')).toHaveCount(2);await page.getByRole('button',{name:'Start Session',exact:true}).click();await page.getByRole('button',{name:'Got It',exact:true}).click();
 await expect(page.getByText('Warm-up 1 of 2',{exact:true})).toBeVisible();
 async function log(kg,reps,effort){await actualNumber(page,'Weight (kg)',String(kg));await actualNumber(page,'Reps completed',String(reps));const slider=page.getByRole('slider',{name:'Actual set effort'});await slider.press('Home');for(let i=0;i<effort;i++)await slider.press('ArrowRight');await page.getByRole('button',{name:'Log set',exact:true}).click();}
 for(const kg of [10,20]){await log(kg,6,1);await page.getByRole('button',{name:'Start next set',exact:true}).click();}
 await expect(page.getByText('Set 1 of 3',{exact:true})).toBeVisible();
 async function rest(label){await page.getByRole('button',{name:'Select Timer',exact:true}).click();await page.locator('[onclick="Logger.timerChoose(\'rest\')"]').click();await page.getByRole('button',{name:label,exact:true}).click();await page.locator('.tm-start').click();await page.locator('.log-back-x').click();}
 await rest('2:00');await page.clock.install();
 for(let i=0;i<3;i++){await log(40,8,2);expect(await page.evaluate(()=>S.timer.config.restMs)).toBe(120000);expect(await page.evaluate(()=>S.timer.view)).toMatch(/countIn|running/);if(i<2){await page.clock.fastForward(125000);await page.getByRole('button',{name:'Start next set',exact:true}).click();await expect(page.getByLabel('Weight (kg)')).toHaveValue('40');}}
 await page.getByRole('button',{name:'Next →',exact:true}).click();await expect(page.locator('#logger').getByRole('heading',{name:'Dumbbell Curl',exact:true})).toBeVisible();await expect(page.getByText('Set 1 of 2',{exact:true})).toBeVisible();
 expect(await page.evaluate(()=>Object.keys(S.session.restChoices||{}).length)).toBe(1);await rest('0:45');
 for(let i=0;i<2;i++){await log(10,5,2);expect(await page.evaluate(()=>S.timer.config.restMs)).toBe(45000);if(i===0){await page.clock.fastForward(50000);await page.getByRole('button',{name:'Start next set',exact:true}).click();}}
 await page.getByRole('button',{name:'Next →',exact:true}).click();await page.getByRole('button',{name:'Done Training',exact:true}).click();await page.getByRole('button',{name:'3',exact:true}).click();await page.getByPlaceholder('Session reflection').fill('Completed full session through the UI.');await page.getByRole('button',{name:'Finish Session',exact:true}).click();
 await expect(page.locator('.log-sum')).toBeVisible({timeout:5000});await expect(page.locator('.log-stat').filter({hasText:/^Sets/})).toContainText('5');await expect(page.locator('.log-stat').filter({hasText:/^Reps/})).toContainText('34');
 expect(await page.evaluate(()=>Object.values(StrengthMemory.records()).filter(r=>r.kind==='set').length)).toBe(7);
 await page.screenshot({path:testInfo.outputPath('full-session-summary.png'),fullPage:true});await testInfo.attach('Completed session summary',{path:testInfo.outputPath('full-session-summary.png'),contentType:'image/png'});
 await page.getByRole('button',{name:'Close',exact:true}).click();await page.locator('[data-tab=me]').click();await page.getByRole('button',{name:'Training history',exact:true}).click();await expect(page.locator('.history-session')).toContainText('5 sets · 34 reps');await page.reload();await expect(page.locator('.history-session')).toContainText('Full CLI strength session');
 await page.locator('[data-tab=library]').click();await page.getByRole('button',{name:'Add to calendar',exact:true}).click();const tomorrow=await page.evaluate(d=>{const date=new Date(d+'T12:00:00');date.setDate(date.getDate()+1);return date.toISOString().slice(0,10);},day);await page.getByLabel('Session date').fill(tomorrow);await page.getByRole('button',{name:'Post to calendar',exact:true}).click();await page.locator('.trn-block--lift').first().click();
 expect(await page.evaluate(()=>S.session.pages[0].workingKg)).toBe(42.5);await expect(page.getByLabel('Weight (kg)')).toHaveValue('20');expect(errors).toEqual([]);
 await page.screenshot({path:testInfo.outputPath('next-session-load.png'),fullPage:true});
});


test('builder keypad matches the outline logger pad and keeps a typed range',async({page},testInfo)=>{
 await builder(page);await page.getByRole('button',{name:'+ Add Exercise',exact:true}).click();await page.getByRole('button',{name:'Back Squat',exact:true}).click();await page.getByRole('button',{name:'Add (1)',exact:true}).click();
 await page.getByRole('button',{name:'Set 1 reps',exact:true}).click();const pad=page.getByRole('dialog',{name:'Reps keypad'});
 await expect(pad.getByRole('button',{name:'Save',exact:true})).toHaveCount(0);await expect(pad.getByRole('button',{name:'–',exact:true})).toBeVisible();await expect(pad.getByRole('button',{name:'.',exact:true})).toHaveCount(0);
 await page.screenshot({path:testInfo.outputPath('builder-range-keypad.png'),fullPage:true});
 for(const key of ['1','2','–','2','0'])await pad.getByRole('button',{name:key,exact:true}).click();
 await pad.getByRole('button',{name:'Close keypad',exact:true}).click();
 await expect(page.getByRole('button',{name:'Set 1 reps',exact:true})).toHaveText('12-20');
 await expect(page.locator('.lib-block')).toContainText('12-20');await page.reload();await expect(page.locator('.lib-block')).toContainText('12-20');
});

test('logger numeric keypad uses whole reps and decimal weights',async({page})=>{
 await builder(page);await page.getByRole('button',{name:'+ Add Exercise',exact:true}).click();await page.getByRole('button',{name:'Create New Exercise'}).click();await page.locator('#libNewTitle').fill('Band Row');await page.locator('#libNewC2').selectOption('weight_lb');await page.getByRole('button',{name:'Create',exact:true}).click();await page.getByRole('button',{name:'Post to calendar',exact:true}).click();await page.getByRole('button',{name:'Post to calendar',exact:true}).click();await page.getByRole('button',{name:'Start Session',exact:true}).click();await page.getByRole('button',{name:'Got It',exact:true}).click();
 await page.locator('button.log-cell[onclick$="\'reps\')"]').first().click();await expect(page.locator('.log-pad').getByRole('button',{name:'.',exact:true})).toHaveCount(0);await expect(page.locator('.log-pad').getByRole('button',{name:'–',exact:true})).toHaveCount(0);await page.locator('.log-pad-head > button').click();
 await page.locator('button.log-cell[onclick$="\'weight_lb\')"]').first().click();await expect(page.locator('.log-pad').getByRole('button',{name:'.',exact:true})).toBeVisible();
});
