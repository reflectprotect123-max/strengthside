import {test,expect} from 'playwright/test';
test('WHOOP account routes use Supabase while coach text uses its separate owner',async({page})=>{
 await page.goto('/');await page.getByRole('heading',{name:'Today',exact:true}).waitFor();
 const routes=await page.evaluate(()=>Object.fromEntries(['whoop-connect','whoop-sync','strength-whoop-status','strength-whoop-disconnect','brain-coach'].map(k=>[k,Whoop.fnUrl(k)])));
 for(const key of ['whoop-connect','whoop-sync','strength-whoop-status','strength-whoop-disconnect'])expect(routes[key]).toContain('/functions/v1/'+key+'?product=strength');
 expect(routes['brain-coach']).toBe('https://thehybridengine1.netlify.app/.netlify/functions/brain-coach?product=strength');
});
test('saving a generic metric stays a draft; missed sets and edits update memory explicitly',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Add',exact:true}).click();await page.getByRole('button',{name:'Create session',exact:true}).click();await page.getByRole('button',{name:'+ Add Exercise',exact:true}).click();await page.getByRole('button',{name:'Create New Exercise'}).click();await page.locator('#libNewTitle').fill('Plank Hold');await page.locator('#libNewC1').selectOption('time_mmss');await page.getByRole('button',{name:'Create',exact:true}).click();await page.getByRole('button',{name:'Post to calendar',exact:true}).click();await page.getByRole('button',{name:'Post to calendar',exact:true}).click();await page.getByRole('button',{name:'Start Session',exact:true}).click();await page.getByRole('button',{name:'Got It',exact:true}).click();
 async function value(keys){await page.locator("button.log-cell[onclick$=\"'time_mmss')\"]").first().click();const pad=page.getByRole('dialog',{name:'Number entry keypad'});await pad.getByRole('button',{name:'Clear',exact:true}).click();for(const k of keys)await pad.getByRole('button',{name:k,exact:true}).click();await pad.getByRole('button',{name:'Save',exact:true}).click();}
 const row=()=>page.evaluate(()=>{const p=HybridSession.currentPage(S.session);return S.session.logs[p.id].sets[0];});
 await page.getByRole('button',{name:'Select Timer',exact:true}).click();await page.locator('[onclick="Logger.timerChoose(\'rest\')"]').click();await page.getByRole('button',{name:'0:45',exact:true}).click();await page.locator('.tm-start').click();await page.locator('.log-back-x').click();
 await value('1:30');expect((await row()).cells.time_mmss).toBe(90);expect((await row()).logged).toBe(false);
 await page.locator('.log-check').first().click();expect((await row()).logged).toBe(false);
 await page.getByRole('slider',{name:'Actual effort for set 1',exact:true}).press('End');await page.locator('.log-check').first().click();const id=(await row()).id;expect((await row()).logged).toBe(true);expect(await page.evaluate(()=>S.timer.config.restMs)).toBe(45000);expect(await page.evaluate(()=>S.timer.view)).toMatch(/countIn|running/);
 expect(await page.evaluate(id=>StrengthMemory.records()[id].payload.row.cells.time_mmss,id)).toBe(90);
 await value('0:45');expect((await row()).logged).toBe(false);expect(await page.evaluate(id=>StrengthMemory.records()[id].deleted,id)).toBe(true);
 await page.locator('.log-check').first().click();expect(await page.evaluate(id=>StrengthMemory.records()[id].payload.row.cells.time_mmss,id)).toBe(45);
 await page.getByRole('button',{name:'Did Not Complete set 1',exact:true}).click();await page.locator('.log-check').first().click();expect((await row()).miss).toBe(true);expect((await row()).logged).toBe(true);
 await page.reload();expect((await row()).miss).toBe(true);expect(await page.evaluate(id=>StrengthMemory.records()[id].payload.row.miss,id)).toBe(true);
});
