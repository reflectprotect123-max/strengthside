import {loadAssignedWorkout,setAssignedReps,patchAssignedBlock,addAssignedAmrap,scheduleExistingWorkout} from './assigned-workout.mjs';
async function actualNumber(page,label,value){await page.getByLabel(label,{exact:true}).click();const pad=page.locator('.log-pad');for(const key of String(value))await pad.getByRole('button',{name:key,exact:true}).click();await pad.getByRole('button',{name:'Save',exact:true}).click();}
import {test,expect} from 'playwright/test';
async function passWarmups(page){for(let guard=0;guard<20;guard++){const section=await page.evaluate(()=>{const s=window.S?.session;if(!s||s.phase!=='block')return '';return s.pages?.[s.blockIndex]?.section||'';});if(section&&section!=='Warm-Up')return;const total=await page.evaluate(()=>Number(window.S?.timer?.config?.totalMs)||0);if(total>0&&await page.locator('#logTimerFull').count())await page.clock.fastForward(total+500);await page.getByRole('button',{name:'Next →',exact:true}).click();}throw new Error('warm-up did not finish');}
async function beginSession(page){await page.clock.install();await page.getByRole('button',{name:'Start Session',exact:true}).click();await page.clock.fastForward(2000);await page.getByRole('button',{name:'Got It',exact:true}).click();await passWarmups(page);}
test('received workout plays fully, reopens in history and seeds the next session',async({page},testInfo)=>{
 test.setTimeout(180000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await loadAssignedWorkout(page,{title:'Full CLI strength session',blocks:[{title:'Back Squat',repTarget:'6-8',columns:['reps_range','weight_kg']},{title:'Dumbbell Curl',setCount:2,repTarget:'5',equipmentId:'dumbbell',loadConvention:'per_hand',exerciseType:'accessory',minimumKg:1}]});
 await page.evaluate(()=>StrengthMemory.bind('browser-athlete'));
 const day=await page.evaluate(()=>S.selectedDate);
 await page.reload();await expect(page.locator('.trn-block--lift')).toHaveCount(7);await expect(page.locator('.trn-block--lift').filter({hasText:'Back Squat'})).toBeVisible();await expect(page.locator('.trn-block--lift').filter({hasText:'Dumbbell Curl'})).toBeVisible();await beginSession(page);
 await expect(page.getByText('Ramp 1 of 2',{exact:true})).toBeVisible();
 async function log(kg,reps,effort){await actualNumber(page,'Weight (kg)',String(kg));await actualNumber(page,'Reps completed',String(reps));const slider=page.getByRole('slider',{name:'Actual set effort'});await slider.press('Home');for(let i=0;i<effort;i++)await slider.press('ArrowRight');await page.getByRole('button',{name:'Log set',exact:true}).click();}
 for(const kg of [10,20]){await log(kg,6,1);await page.getByRole('button',{name:'Start next set',exact:true}).click();}
 await expect(page.getByText('Set 1 of 3',{exact:true})).toBeVisible();
 async function rest(label){await page.getByRole('button',{name:'Select Timer',exact:true}).click();await page.locator('[onclick="Logger.timerChoose(\'rest\')"]').click();await page.getByRole('button',{name:label,exact:true}).click();await page.locator('.tm-start').click();await page.locator('.log-back-x').click();}
 await rest('2:00');
 for(let i=0;i<3;i++){await log(40,8,2);expect(await page.evaluate(()=>S.timer.config.restMs)).toBe(120000);expect(await page.evaluate(()=>S.timer.view)).toMatch(/countIn|running/);if(i<2){await page.clock.fastForward(125000);await page.getByRole('button',{name:'Start next set',exact:true}).click();await expect(page.getByLabel('Weight (kg)')).toHaveValue('40');}}
 await page.getByRole('button',{name:'Next →',exact:true}).click();await expect(page.locator('#logger').getByRole('heading',{name:'Dumbbell Curl',exact:true})).toBeVisible();await expect(page.getByText('Set 1 of 2',{exact:true})).toBeVisible();
 expect(await page.evaluate(()=>Object.keys(S.session.restChoices||{}).length)).toBe(1);await rest('0:45');
 for(let i=0;i<2;i++){await log(10,5,2);expect(await page.evaluate(()=>S.timer.config.restMs)).toBe(45000);if(i===0){await page.clock.fastForward(50000);await page.getByRole('button',{name:'Start next set',exact:true}).click();}}
 await page.getByRole('button',{name:'Next →',exact:true}).click();await expect(page.getByRole('button',{name:'Add Exercise',exact:true})).toHaveCount(0);await page.getByRole('button',{name:'Done Training',exact:true}).click();await page.getByRole('button',{name:'3',exact:true}).click();await page.getByPlaceholder('Session reflection').fill('Completed full session through the UI.');await page.getByRole('button',{name:'Finish Session',exact:true}).click();
 await expect(page.locator('.log-sum')).toBeVisible({timeout:5000});await expect(page.locator('.log-stat').filter({hasText:/^Sets/})).toContainText('5');await expect(page.locator('.log-stat').filter({hasText:/^Reps/})).toContainText('34');
 expect(await page.evaluate(()=>Object.values(StrengthMemory.records()).filter(r=>r.kind==='set').length)).toBe(7);
 await page.screenshot({path:testInfo.outputPath('full-session-summary.png'),fullPage:true});await testInfo.attach('Completed session summary',{path:testInfo.outputPath('full-session-summary.png'),contentType:'image/png'});
 await page.clock.resume();await page.getByRole('button',{name:'Close',exact:true}).click();await page.locator('[data-tab=me]').click();await page.getByRole('button',{name:'Training history',exact:true}).click();await expect(page.locator('.history-session')).toContainText('5 sets · 34 reps');await page.reload();await expect(page.locator('.history-session')).toContainText('Full CLI strength session');
 const tomorrow=await page.evaluate(d=>{const date=new Date(d+'T12:00:00');date.setDate(date.getDate()+1);return date.toISOString().slice(0,10);},day);await scheduleExistingWorkout(page,tomorrow);await page.locator('.trn-block--lift').filter({hasText:'Back Squat'}).click();
 expect(await page.evaluate(()=>S.session.pages.find(p=>p.title==='Back Squat').workingKg)).toBe(42.5);expect(errors).toEqual([]);await expect(page.getByText('Ramp 1 of 2',{exact:true})).toBeVisible();await expect(page.getByLabel('Weight (kg)')).toHaveValue('empty bar');expect(await page.evaluate(()=>{const squat=S.session.pages.find(p=>p.title==='Back Squat');return S.session.logs[squat.id].sets.filter(r=>r.purpose==='ramp').map(r=>r.kg);})).toEqual([0,20]);expect(errors).toEqual([]);
 await page.screenshot({path:testInfo.outputPath('next-session-load.png'),fullPage:true});
});

test('warm-up lifts cool-down before Ramp and Skip warm-up jumps to the first lift',async({page})=>{
 test.setTimeout(180000);
 await loadAssignedWorkout(page);
 await page.clock.install();
 await page.getByRole('button',{name:'Start Session',exact:true}).click();
 await page.clock.fastForward(2000);
 await page.getByRole('button',{name:'Got It',exact:true}).click();
 await expect(page.locator('#logger')).toContainText('Bike');
 await expect(page.getByRole('button',{name:'Skip warm-up',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Skip warm-up',exact:true}).click();
 await expect(page.getByText('Ramp 1 of 2',{exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:/skip ramp/i})).toHaveCount(0);
});

test('logger numeric keypad uses whole reps and decimal weights',async({page})=>{
 test.setTimeout(180000);
 await loadAssignedWorkout(page,{blocks:[{title:'Band Row',columns:['reps','weight_lb']}]});await beginSession(page);
 await page.locator('button.log-cell[onclick$="\'reps\')"]').first().click();await expect(page.locator('.log-pad').getByRole('button',{name:'.',exact:true})).toHaveCount(0);await expect(page.locator('.log-pad').getByRole('button',{name:'–',exact:true})).toHaveCount(0);await page.locator('.log-pad-head > button').click();
 await page.locator('button.log-cell[onclick$="\'weight_lb\')"]').first().click();await expect(page.locator('.log-pad').getByRole('button',{name:'.',exact:true})).toBeVisible();
});
