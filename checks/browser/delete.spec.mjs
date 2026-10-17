import {loadAssignedWorkout,setAssignedReps,patchAssignedBlock,addAssignedAmrap,scheduleExistingWorkout} from './assigned-workout.mjs';
import {test,expect} from 'playwright/test';
test('deleting a scheduled template clears its day marker even after opening the logger',async({page})=>{
 await loadAssignedWorkout(page);
 await expect(page.locator('.cal-day.active .cal-dot')).toHaveCount(1);await page.getByRole('button',{name:'Start Session',exact:true}).click();await page.getByRole('button',{name:'Got It',exact:true}).click();await page.locator('.log-back-x').click();await page.locator('.log-back-x').click();await page.locator('[data-tab=library]').click();page.on('dialog',d=>d.accept());await page.getByRole('button',{name:'Delete',exact:true}).click();await page.locator('[data-tab=training]').click();
 await expect(page.getByText('Nothing scheduled for this day yet.',{exact:true})).toBeVisible();await expect(page.locator('.cal-day.active .cal-dot')).toHaveCount(0);await page.reload();await expect(page.locator('.cal-day.active .cal-dot')).toHaveCount(0);
});
