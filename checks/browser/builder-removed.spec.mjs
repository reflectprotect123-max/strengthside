import {test,expect} from 'playwright/test';
import {loadAssignedWorkout} from './assigned-workout.mjs';
test('empty and saved libraries provide no workout authoring entry point',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Add',exact:true}).click();
 await expect(page.getByRole('button',{name:/Create session/i})).toHaveCount(0);
 await page.locator('.fab-scrim').click();
 await page.locator('[data-tab=library]').click();await expect(page.getByText('No saved workouts',{exact:true})).toBeVisible();
 expect(await page.evaluate(()=>typeof LibraryView.create)).toBe('undefined');expect(await page.evaluate(()=>typeof HybridLibrary.createTemplate)).toBe('undefined');
 await loadAssignedWorkout(page);await page.locator('[data-tab=library]').click();await page.getByRole('heading',{name:'Assigned Strength Session',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Back Squat',exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:/Add Exercise|Edit|Create|Post to calendar/})).toHaveCount(0);
 await page.reload();await expect(page.getByRole('heading',{name:'Back Squat',exact:true})).toBeVisible();
});
test('old saved builder screen cannot reopen after updating the app',async({page})=>{
 await loadAssignedWorkout(page);await page.evaluate(()=>{S.tab='library';S.libUi={screen:'edit',flow:'wizard',tid:'assigned-workout'};save();});await page.reload();
 await expect(page.getByRole('heading',{name:'Sessions',exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:/Add Exercise|Create Session Template|Post to calendar/})).toHaveCount(0);
 expect(await page.evaluate(()=>S.library.templates.length)).toBe(1);
});
