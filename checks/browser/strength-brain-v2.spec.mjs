import {loadAssignedWorkout,setAssignedReps,patchAssignedBlock,addAssignedAmrap,scheduleExistingWorkout} from './assigned-workout.mjs';
import {test,expect} from 'playwright/test';

async function actualNumber(page,label,value){await page.getByLabel(label,{exact:true}).click();const pad=page.locator('.log-pad');for(const key of String(value))await pad.getByRole('button',{name:key,exact:true}).click();await pad.getByRole('button',{name:'Save',exact:true}).click();}
async function setReps(page,label,value){await setAssignedReps(page,Number(label.match(/Set (\d+)/)[1])-1,value);}
async function log(page,kg,reps,effort=2){await actualNumber(page,'Weight (kg)',kg);await actualNumber(page,'Reps completed',reps);const slider=page.getByRole('slider',{name:'Actual set effort'});await slider.press('Home');for(let i=0;i<effort;i++)await slider.press('ArrowRight');await page.getByRole('button',{name:/^(Log set|Save changes)$/,exact:true}).click();}
async function passWarmups(page){for(let guard=0;guard<20;guard++){const section=await page.evaluate(()=>{const s=window.S?.session;if(!s||s.phase!=='block')return '';return s.pages?.[s.blockIndex]?.section||'';});if(section&&section!=='Warm-Up')return;const total=await page.evaluate(()=>Number(window.S?.timer?.config?.totalMs)||0);if(total>0&&await page.locator('#logTimerFull').count())await page.clock.fastForward(total+500);await page.getByRole('button',{name:'Next →',exact:true}).click();}throw new Error('warm-up did not finish');}
async function beginSession(page){await page.clock.install();await page.getByRole('button',{name:'Start Session',exact:true}).click();await page.clock.fastForward(2000);await page.getByRole('button',{name:'Got It',exact:true}).click();await passWarmups(page);}
async function addSquat(page){await loadAssignedWorkout(page);}
async function scheduleAndStart(page){await beginSession(page);}
async function completeWarmups(page){for(const kg of [10,20]){await log(page,kg,5,1);await page.getByRole('button',{name:'Start next set',exact:true}).click();}}

test('10 8 6 plus final AMRAP keeps authored targets and immutable completed actuals',async({page},testInfo)=>{
 await addSquat(page);await setReps(page,'Set 1 reps',10);await setReps(page,'Set 2 reps',8);await setReps(page,'Set 3 reps',6);await addAssignedAmrap(page);
 expect(await page.evaluate(()=>{const b=S.library.templates[0].blocks.find(block=>block.title==='Back Squat');return {exerciseId:b.exerciseId,equipmentId:b.equipmentId,loadConvention:b.loadConvention,minimumKg:b.minimumKg,step:b.equipmentStepKg,obsolete:['targetEffort','restSec','demoStartingKg','repMin','repMax','targetReps','targetRepMax'].filter(k=>k in b)};})).toEqual({exerciseId:'ex_back_squat',equipmentId:'barbell',loadConvention:'total',minimumKg:20,step:2.5,obsolete:[]});
 await scheduleAndStart(page);await expect(page.locator('.log-side-row').filter({hasText:'EST. 1RM'})).toContainText('Learning');await expect(page.locator('.log-side-row').filter({hasText:'EST. 1RM'}).getByRole('button')).toHaveCount(0);
 expect(await page.evaluate(()=>{const p=HybridSession.currentPage(S.session);return S.session.logs[p.id].sets.filter(r=>r.purpose!=='ramp').map(r=>({purpose:r.purpose,reps:r.reps,rule:p.setTargets.find(t=>t.id===r.targetId)?.loadRule}));})).toEqual([{purpose:'working',reps:10,rule:{kind:'adaptive'}},{purpose:'working',reps:8,rule:{kind:'adaptive'}},{purpose:'working',reps:6,rule:{kind:'adaptive'}},{purpose:'amrap',reps:null,rule:{kind:'first_working_set'}}]);
 await completeWarmups(page);await log(page,40,10);await page.getByRole('button',{name:'Edit set 3 of Back Squat',exact:true}).click();await log(page,41,10);
 for(const [kg,reps] of [[42.5,8],[45,6]]){await expect(page.locator('.log-set-heading span')).toHaveText(`${reps} reps`);await log(page,kg,reps);await page.getByRole('button',{name:'Start next set',exact:true}).click();}
 await expect(page.locator('.log-set-heading span')).toHaveText('AMRAP');await expect(page.getByLabel('Weight (kg)')).toHaveValue('41');await log(page,41,12,3);
 await page.screenshot({path:testInfo.outputPath('completed-10-8-6-amrap.png'),fullPage:true});await testInfo.attach('Completed 10 8 6 plus AMRAP',{path:testInfo.outputPath('completed-10-8-6-amrap.png'),contentType:'image/png'});
 await page.getByRole('button',{name:'Edit set 3 of Back Squat',exact:true}).click();await log(page,42,10);
 expect(await page.evaluate(()=>{const rows=S.session.logs[HybridSession.currentPage(S.session).id].sets.filter(r=>r.purpose!=='ramp');return {first:rows[0].kg,amrap:rows.at(-1).kg,amrapLogged:rows.at(-1).logged};})).toEqual({first:42,amrap:41,amrapLogged:true});
});

test('six reps at Average inside a 6 to 8 range holds load and accepts an override',async({page})=>{
 await addSquat(page);for(const n of [1,2,3])await setReps(page,`Set ${n} reps`,'6–8');await scheduleAndStart(page);await completeWarmups(page);
 await log(page,40,6,2);await expect(page.getByLabel('Weight (kg)')).toHaveValue('40');await page.getByRole('button',{name:'Start next set',exact:true}).click();await actualNumber(page,'Weight (kg)',43);await expect(page.getByLabel('Weight (kg)')).toHaveValue('43');
});
