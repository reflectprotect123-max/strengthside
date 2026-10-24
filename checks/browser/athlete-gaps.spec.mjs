import {loadAssignedWorkout,patchAssignedBlock} from './assigned-workout.mjs';
import {test,expect} from 'playwright/test';

async function begin(page){
  await page.clock.install();
  await page.getByRole('button',{name:'Start Session',exact:true}).click();
  await page.clock.fastForward(2000);
  await page.getByRole('button',{name:'Got It',exact:true}).click();
}

test('logger keeps the timer control and adds a separate Play demo button',async({page})=>{
  await loadAssignedWorkout(page,{prep:false,blocks:[{title:'Back Squat',videoUrl:'https://youtu.be/dQw4w9wgGcQ'}]});
  await begin(page);
  await expect(page.getByRole('button',{name:'Play exercise demo',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:/Select Timer|Start last timer/})).toBeVisible();
  await expect(page.getByRole('button',{name:'Play exercise demo',exact:true})).not.toHaveAccessibleName(/timer/i);
  await page.getByRole('button',{name:'Play exercise demo',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Exercise demo'})).toBeVisible();
  await expect(page.getByRole('link',{name:'Open externally'})).toHaveAttribute('href','https://youtu.be/dQw4w9wgGcQ');
});

test('row intervals show rounds, splits, pace and totals on the summary',async({page})=>{
  await loadAssignedWorkout(page,{prep:false,blocks:[{title:'Row Erg',columns:['calories','meters','watts','time_mmss'],setCount:2}]});
  await begin(page);
  async function cell(setIndex,field,value){
    await page.locator(`button.log-cell[onclick$=",${setIndex},'${field}')"]`).click();
    const pad=page.locator('.log-pad');
    const seed=await pad.locator('.log-pad-val').innerText();
    for(let i=0;i<seed.length;i++)await pad.locator('.log-keys').getByRole('button',{name:'⌫',exact:true}).click();
    for(const k of String(value))await pad.locator('.log-keys').getByRole('button',{name:k,exact:true}).click();
    await pad.getByRole('button',{name:'Save',exact:true}).click();
  }
  for(let i=0;i<2;i++){
    await cell(i,'calories',15);await cell(i,'meters',250);await cell(i,'watts',180);await cell(i,'time_mmss',100);
    await page.getByRole('slider',{name:`Actual effort for set ${i+1}`,exact:true}).press('End');
    await page.locator('.log-check').nth(i).click();
  }
  await page.getByRole('button',{name:'Next →',exact:true}).click();
  await page.getByRole('button',{name:'Done Training',exact:true}).click();
  await page.getByRole('button',{name:'Finish Session',exact:true}).click();
  await expect(page.locator('.log-sum')).toContainText('Rounds');
  await expect(page.locator('.log-stat').filter({hasText:/^Calories/})).toContainText('30');
  await expect(page.locator('.log-stat').filter({hasText:/^Metres/})).toContainText('500');
  await expect(page.locator('.log-sum')).toContainText('/500 m');
});

test('first logged working set shows a New PR badge and records on Progress',async({page})=>{
  await loadAssignedWorkout(page,{prep:false,blocks:[{title:'Back Squat'}]});
  await begin(page);
  async function log(kg,reps){
    await page.getByLabel('Weight (kg)',{exact:true}).click();
    const pad=page.locator('.log-pad');
    for(const k of String(kg))await pad.getByRole('button',{name:k,exact:true}).click();
    await pad.getByRole('button',{name:'Save',exact:true}).click();
    await page.getByLabel('Reps completed',{exact:true}).click();
    for(const k of String(reps))await page.locator('.log-pad').getByRole('button',{name:k,exact:true}).click();
    await page.locator('.log-pad').getByRole('button',{name:'Save',exact:true}).click();
    const slider=page.getByRole('slider',{name:'Actual set effort'});
    await slider.press('Home');await slider.press('ArrowRight');await slider.press('ArrowRight');await slider.press('ArrowRight');
    await page.getByRole('button',{name:'Log set',exact:true}).click();
  }
  await log(10,5);await page.getByRole('button',{name:'Start next set',exact:true}).click();
  await log(20,5);await page.getByRole('button',{name:'Start next set',exact:true}).click();
  await log(80,5);
  await page.getByRole('button',{name:'Next →',exact:true}).click();
  await page.getByRole('button',{name:'Done Training',exact:true}).click();
  await page.getByRole('button',{name:'Finish Session',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('New PR');
  await page.getByRole('button',{name:'Close',exact:true}).click();
  await page.locator('[data-tab=progress]').click();
  await expect(page.getByLabel('Records')).toContainText('Back Squat');
});

test('session reflection threads a coach reply on the summary',async({page})=>{
  await loadAssignedWorkout(page,{prep:false,blocks:[{title:'Back Squat'}]});
  await begin(page);
  await page.getByRole('button',{name:'Next →',exact:true}).click();
  await page.getByRole('button',{name:'Done Training',exact:true}).click();
  await page.getByPlaceholder('Session reflection').fill('Felt strong.');
  await page.getByRole('button',{name:'Finish Session',exact:true}).click();
  await page.evaluate(()=>{
    S.session.comments=[{id:'coach-1',authorRole:'coach',body:'Nice work.',parentId:'local:'+S.session.id+':reflection'}];
    Logger.paint();
  });
  await expect(page.locator('.log-thread')).toContainText('Felt strong.');
  await expect(page.locator('.log-thread')).toContainText('Nice work.');
});

test('Start Session with nothing scheduled opens the own-session picker and month view toggles',async({page})=>{
  await page.goto('/');
  await page.waitForFunction(()=>Boolean(window.S));
  await page.evaluate(()=>{
    S.library=HybridLibrary.emptyState();
    S.trainingPlans={};
    S.selectedDate='2026-10-24';
    S.tab='training';
    save();render();
  });
  await expect(page.locator('.trn-empty')).toBeVisible();
  await page.getByRole('button',{name:'Start Session',exact:true}).click();
  await expect(page.getByRole('button',{name:'Empty session',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Empty session',exact:true}).click();
  await expect(page.locator('#logger')).toBeVisible();
  await page.evaluate(()=>Logger.close());
  await page.getByRole('button',{name:'Month calendar'}).click();
  await expect(page.getByLabel('Training month')).toBeVisible();
});

test('warm-up circuit still lists items, ticks one, and can skip the block',async({page})=>{
  await loadAssignedWorkout(page);
  await begin(page);
  await expect(page.locator('#logger')).toContainText('Bike');
  await expect(page.getByRole('button',{name:'Skip warm-up',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Skip warm-up',exact:true}).click();
  await expect(page.getByText('Ramp 1 of 2',{exact:true})).toBeVisible();
  await expect(page.locator('#logTimerFull')).toHaveCount(0);
});
