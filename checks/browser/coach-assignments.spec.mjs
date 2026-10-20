import {test,expect} from 'playwright/test';
import {readFileSync} from 'node:fs';
const fixture=JSON.parse(readFileSync(new URL('../fixtures/coach-published.json',import.meta.url))).row;
async function server(page){
  let rows=[structuredClone(fixture)];const pulls=[],receipts=[];
  const user={id:fixture.athlete_id,email:'athlete@example.test',aud:'authenticated',role:'authenticated'};
  await page.addInitScript(({user,date})=>{
    const token=btoa(JSON.stringify({alg:'HS256',typ:'JWT'}))+'.'+btoa(JSON.stringify({sub:user.id,aud:'authenticated',exp:4102444800}))+'.test-signature';
    localStorage.setItem('sb-orysjncrksmdfabpuftd-auth-token',JSON.stringify({access_token:token,refresh_token:'test-refresh',expires_at:4102444800,expires_in:3600,token_type:'bearer',user}));
    if(!localStorage.getItem('THE-brain-v1'))localStorage.setItem('THE-brain-v1',JSON.stringify({build:'THE-brain-v1',selectedDate:date,tab:'training'}));
  },{user,date:fixture.scheduled_date});
  await page.route('https://orysjncrksmdfabpuftd.supabase.co/**',async route=>{
    const req=route.request(),url=new URL(req.url());let body=[];
    if(url.pathname.endsWith('/assigned_session')){
      pulls.push(url.searchParams);
      const lo=Number(req.headers().range?.split('-')[0]||url.searchParams.get('offset')||0);
      body=rows.slice(lo,lo+500);
    }else if(url.pathname.endsWith('/athlete_domain_snapshots'))body=null;
    else if(url.pathname.endsWith('/sync_strength_brain_records'))body={ok:true};
    else if(url.pathname.endsWith('/complete_coach_assignment')){receipts.push(req.postDataJSON());body={ok:true};}
    else if(url.pathname.endsWith('/upsert_athlete_domain_snapshot'))body=true;
    else if(url.pathname.endsWith('/user'))body=user;
    else if(url.pathname.includes('/functions/v1/'))body={ok:true,connected:false};
    await route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(body)});
  });
  return {pulls,receipts,remove:()=>{rows=[];}};
}
async function number(page,label,value){
  await page.getByLabel(label,{exact:true}).click();const pad=page.locator('.log-pad');
  for(const key of String(value))await pad.getByRole('button',{name:key,exact:true}).click();
  await pad.getByRole('button',{name:'Save',exact:true}).click();
}
async function log(page,kg,reps){
  await number(page,'Weight (kg)',kg);await number(page,'Reps completed',reps);
  const slider=page.getByRole('slider',{name:'Actual set effort'});await slider.press('Home');await slider.press('ArrowRight');await slider.press('ArrowRight');
  await page.getByRole('button',{name:'Log set',exact:true}).click();
}
async function begin(page){
  await page.clock.install();await page.getByRole('button',{name:'Start Session',exact:true}).click();
  await page.clock.fastForward(2000);await page.getByRole('button',{name:'Got It',exact:true}).click();
}
test('Coach published payload is fetched with athlete auth, appears in Training and completes through logger',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));const api=await server(page);
  await page.goto('/');await expect(page.locator('.trn-block--lift').filter({hasText:'Back Squat'})).toBeVisible();
  expect(api.pulls.length).toBeGreaterThan(0);expect(api.pulls[0].get('athlete_id')).toBe('eq.'+fixture.athlete_id);expect(api.pulls[0].get('state')).toBe('eq.published');
  expect(await page.evaluate(()=>trainingPlanForDate(S.selectedDate).blocks.find(b=>b.kind==='lift').tempo)).toBe('20X1');
  await begin(page);
  for(const [i,reps] of [10,8,6,12].entries()){
    await expect(page.locator('.log-set-heading span')).toHaveText(i===3?'AMRAP':`${reps} reps`);
    await log(page,40,reps);if(i<3)await page.getByRole('button',{name:'Start next set',exact:true}).click();
  }
  expect(await page.evaluate(()=>{const p=HybridSession.currentPage(S.session);return S.session.logs[p.id].sets.map(r=>r.kg);})).toEqual([40,40,40,40]);
  await page.getByRole('button',{name:'Next →',exact:true}).click();await page.getByRole('button',{name:'Done Training',exact:true}).click();
  await page.getByRole('button',{name:'3',exact:true}).click();await page.getByRole('button',{name:'Finish Session',exact:true}).click();
  await expect(page.locator('.log-sum')).toBeVisible();
  await expect.poll(()=>api.receipts.length,{timeout:10000}).toBeGreaterThan(0);
  expect(api.receipts[0].p_assignment_id).toBe(fixture.id);
  await page.reload();await page.waitForFunction(()=>CoachAssignments.getStatus().ok);
  expect(await page.evaluate(()=>Object.values(StrengthMemory.records()).filter(r=>r.kind==='set'&&r.payload.completed).length)).toBe(4);
  expect(errors).toEqual([]);
});
test('offline pull retains cached workout; unpublishing does not erase an active logged set',async({page,context})=>{
  const api=await server(page);await page.goto('/');await expect(page.locator('.trn-block--lift').filter({hasText:'Back Squat'})).toBeVisible();
  await begin(page);await log(page,40,10);
  const before=await page.evaluate(()=>JSON.stringify(S.session));
  await context.setOffline(true);expect((await page.evaluate(()=>CoachAssignments.sync())).ok).toBe(false);
  expect(await page.evaluate(()=>trainingPlanForDate(S.selectedDate).title)).toBe('Coach published strength');
  await context.setOffline(false);api.remove();expect((await page.evaluate(()=>CoachAssignments.sync())).ok).toBe(true);
  expect(await page.evaluate(()=>JSON.stringify(S.session))).toBe(before);
  expect(await page.evaluate(()=>S.library.assignments[S.selectedDate])).toBeUndefined();
  expect(await page.evaluate(()=>Object.values(StrengthMemory.records()).filter(r=>r.kind==='set'&&!r.deleted).length)).toBe(1);
});
