import {test, expect} from 'playwright/test';
import {loadAssignedWorkout} from './assigned-workout.mjs';
import {bindGoldenAthlete, GOLDEN_DAN, GOLDEN_REST_BLOCKS} from '../fixtures/golden-athlete.mjs';
import {copyFileSync, mkdirSync} from 'node:fs';

test.use({viewport: {width: 412, height: 915}});

async function passWarmups(page) {
  for (let guard = 0; guard < 20; guard++) {
    const section = await page.evaluate(() => {
      const s = window.S?.session;
      if (!s || s.phase !== 'block') return '';
      return s.pages?.[s.blockIndex]?.section || '';
    });
    if (section && section !== 'Warm-Up') return;
    const total = await page.evaluate(() => Number(window.S?.timer?.config?.totalMs) || 0);
    if (total > 0 && await page.locator('#logTimerFull').count()) await page.clock.fastForward(total + 500);
    await page.getByRole('button', {name: 'Next →', exact: true}).click();
  }
  throw new Error('warm-up did not finish');
}
async function beginSession(page) {
  await page.clock.install();
  await page.getByRole('button', {name: 'Start Session', exact: true}).click();
  await page.clock.fastForward(2000);
  if (await page.getByRole('button', {name: 'Got It', exact: true}).count()) {
    await page.getByRole('button', {name: 'Got It', exact: true}).click();
  }
  await passWarmups(page);
}
async function rateOnly(page, effort = 2) {
  const slider = page.getByRole('slider', {name: 'Actual set effort'});
  await slider.press('Home');
  for (let i = 0; i < effort; i++) await slider.press('ArrowRight');
  await page.getByRole('button', {name: 'Log set', exact: true}).click();
}
async function startNext(page) {
  const btn = page.getByRole('button', {name: 'Start next set', exact: true});
  if (await btn.count()) await btn.click();
}
async function shot(page, testInfo, name) {
  const dest = testInfo.outputPath(`${name}.png`);
  await page.screenshot({path: dest, fullPage: true});
  mkdirSync('/opt/cursor/artifacts', {recursive: true});
  copyFileSync(dest, `/opt/cursor/artifacts/${name}.png`);
  await testInfo.attach(name, {path: dest, contentType: 'image/png'});
}
async function liftSets(page, title) {
  return page.evaluate((want) => {
    const s = S.session;
    const page = s.pages.find((p) => p.title === want) || s.pages.find((p) => p.members?.some((m) => m.title === want));
    const lift = page.members ? page.members.find((m) => m.title === want) : page;
    return (s.logs[lift.id].sets || []).map((r) => ({purpose: r.purpose, kg: r.kg, skipped: !!r.skipped, logged: !!r.logged, reps: r.reps}));
  }, title);
}

test('golden A-B: incline 30/45 then 62.5; Average ramp does not overwrite working', async ({page}, testInfo) => {
  test.setTimeout(180000);
  await loadAssignedWorkout(page, {
    prep: false,
    title: 'Golden A incline',
    blocks: [{
      title: 'Incline Bench', letter: 'A', setCount: 4, rampCount: 2, oneRm: 100, pctLow: 63, pctHigh: 68,
      percentMode: 'straight', notes: ['4 x 8 @ 63-68% (RPE 6)'], columns: ['reps', 'weight_kg'],
      equipmentId: 'barbell', loadConvention: 'total', minimumKg: 20, equipmentStepKg: 2.5, barWeightKg: 20,
    }],
  });
  await bindGoldenAthlete(page, GOLDEN_DAN);
  expect(await page.evaluate(() => S.accountId)).toBe('golden-dan');
  await beginSession(page);
  const opened = await liftSets(page, 'Incline Bench');
  expect(opened.filter((r) => r.purpose === 'ramp').map((r) => r.kg)).toEqual([30, 45]);
  expect(opened.filter((r) => r.purpose === 'working').map((r) => r.kg)).toEqual([62.5, 62.5, 62.5, 62.5]);
  await shot(page, testInfo, 'golden-a-incline-open');
  await rateOnly(page, 2);
  await startNext(page);
  const after = await liftSets(page, 'Incline Bench');
  expect(after.filter((r) => r.purpose === 'working').map((r) => r.kg)).toEqual([62.5, 62.5, 62.5, 62.5]);
  expect(after.filter((r) => r.purpose === 'working').every((r) => r.kg !== 30)).toBeTruthy();
  await shot(page, testInfo, 'golden-b-after-average-ramp');
});

test('golden D-E: build climb 75-107.5 survives Average ramps and the next session', async ({page}, testInfo) => {
  test.setTimeout(180000);
  const block = {
    title: 'Back Squat', letter: 'A', setCount: 5, rampCount: 3, oneRm: 125, pctLow: 80, pctHigh: 85,
    percentMode: 'build', notes: ['5 x 5 @ 80-85% (RPE 8) build over the 5 sets'], columns: ['reps', 'weight_kg'],
    equipmentId: 'barbell', loadConvention: 'total', minimumKg: 20, equipmentStepKg: 2.5, barWeightKg: 20,
  };
  await loadAssignedWorkout(page, {prep: false, title: 'Golden D squat', blocks: [block]});
  await bindGoldenAthlete(page, GOLDEN_DAN);
  await beginSession(page);
  const opened = await liftSets(page, 'Back Squat');
  expect(opened.filter((r) => r.purpose === 'working').map((r) => r.kg)).toEqual([75, 82.5, 92.5, 100, 107.5]);
  expect(opened.filter((r) => r.purpose === 'ramp').every((r, i, all) => i === 0 || r.kg > all[i - 1].kg)).toBeTruthy();
  await shot(page, testInfo, 'golden-d-build-open');
  for (let i = 0; i < 3; i++) {
    await rateOnly(page, 2);
    await startNext(page);
  }
  const after = await liftSets(page, 'Back Squat');
  expect(after.filter((r) => r.purpose === 'working').map((r) => r.kg)).toEqual([75, 82.5, 92.5, 100, 107.5]);
  await shot(page, testInfo, 'golden-d-after-average-ramps');
  const day = await page.evaluate(() => S.selectedDate);
  const tomorrow = await page.evaluate((d) => {
    const date = new Date(d + 'T12:00:00');
    date.setDate(date.getDate() + 1);
    return date.toISOString().slice(0, 10);
  }, day);
  await page.evaluate((date) => {
    const plan = PlanSync.pack(S);
    plan.sessions = plan.sessions.filter((x) => x.id !== 'asg_' + date);
    plan.sessions.push({id: 'asg_' + date, date, kind: 'assignment', templateId: plan.templates[0].id});
    S = PlanSync.applyPlan(S, plan);
    S.selectedDate = date;
    S.tab = 'training';
    S.session = null;
    save();
    render();
  }, tomorrow);
  await page.getByRole('button', {name: 'Start Session', exact: true}).click();
  await page.clock.fastForward(2000);
  if (await page.getByRole('button', {name: 'Got It', exact: true}).count()) {
    await page.getByRole('button', {name: 'Got It', exact: true}).click();
  }
  await passWarmups(page);
  const nextDay = await liftSets(page, 'Back Squat');
  expect(nextDay.filter((r) => r.purpose === 'working').map((r) => r.kg)).toEqual([75, 82.5, 92.5, 100, 107.5]);
  await shot(page, testInfo, 'golden-e-next-build');
});

test('golden B-C: Hard repeats the ramp; Very Easy working set steps +5 through the slider', async ({page}, testInfo) => {
  test.setTimeout(180000);
  await loadAssignedWorkout(page, {
    prep: false,
    title: 'Golden B-C ratings',
    blocks: [{
      title: 'Incline Bench', letter: 'A', setCount: 4, rampCount: 2, oneRm: 100, pctLow: 63, pctHigh: 68,
      percentMode: 'straight', notes: ['4 x 8 @ 63-68% (RPE 6)'], columns: ['reps', 'weight_kg'],
      equipmentId: 'barbell', loadConvention: 'total', minimumKg: 20, equipmentStepKg: 2.5, barWeightKg: 20,
    }],
  });
  await bindGoldenAthlete(page, GOLDEN_DAN);
  await beginSession(page);
  await rateOnly(page, 3);
  await startNext(page);
  const afterHard = await liftSets(page, 'Incline Bench');
  expect(afterHard.filter((r) => r.purpose === 'ramp').map((r) => r.kg)).toEqual([30, 30]);
  expect(afterHard.filter((r) => r.purpose === 'working').map((r) => r.kg)).toEqual([62.5, 62.5, 62.5, 62.5]);
  await shot(page, testInfo, 'golden-b-after-hard-ramp');
  await rateOnly(page, 2);
  await startNext(page);
  const afterLastRamp = await liftSets(page, 'Incline Bench');
  expect(afterLastRamp.filter((r) => r.purpose === 'working').map((r) => r.kg)).toEqual([62.5, 62.5, 62.5, 62.5]);
  await rateOnly(page, 0);
  await startNext(page);
  const afterVe = await liftSets(page, 'Incline Bench');
  expect(afterVe.filter((r) => r.purpose === 'working').map((r) => r.kg).slice(0, 2)).toEqual([62.5, 67.5]);
  await shot(page, testInfo, 'golden-c-after-very-easy');
});

async function openIncline(page) {
  await loadAssignedWorkout(page, {
    prep: false,
    title: 'Golden B-C floor',
    blocks: [{
      title: 'Incline Bench', letter: 'A', setCount: 4, rampCount: 2, oneRm: 100, pctLow: 63, pctHigh: 68,
      percentMode: 'straight', notes: ['4 x 8 @ 63-68% (RPE 6)'], columns: ['reps', 'weight_kg'],
      equipmentId: 'barbell', loadConvention: 'total', minimumKg: 20, equipmentStepKg: 2.5, barWeightKg: 20,
    }],
  });
  await bindGoldenAthlete(page, GOLDEN_DAN);
  await beginSession(page);
}

test('golden B live: Very Hard on ramp 1 skips ramp 2 and keeps working 62.5', async ({page}, testInfo) => {
  test.setTimeout(180000);
  await openIncline(page);
  await rateOnly(page, 4);
  await startNext(page);
  const afterFirstVh = await liftSets(page, 'Incline Bench');
  expect(afterFirstVh.filter((r) => r.purpose === 'ramp').map((r) => ({kg: r.kg, skipped: r.skipped}))).toEqual([
    {kg: 30, skipped: false},
    {kg: 45, skipped: true},
  ]);
  expect(afterFirstVh.filter((r) => r.purpose === 'working').every((r) => r.kg === 62.5)).toBeTruthy();
  await expect(page.getByText('Set 1 of 4', {exact: true})).toBeVisible();
  await expect(page.getByText('Ramp 2 of 2', {exact: true})).toHaveCount(0);
  await shot(page, testInfo, 'golden-b-vh-skips-ramp-2');
});

test('golden B live: last-ramp Very Hard cuts working to the one-step floor', async ({page}, testInfo) => {
  test.setTimeout(180000);
  await openIncline(page);
  await rateOnly(page, 2);
  await startNext(page);
  await rateOnly(page, 4);
  await startNext(page);
  const afterLastVh = await liftSets(page, 'Incline Bench');
  expect(afterLastVh.filter((r) => r.purpose === 'working').map((r) => r.kg)).toEqual([60, 60, 60, 60]);
  await shot(page, testInfo, 'golden-b-last-ramp-vh');
});

test('golden C live: last-ramp Hard to 60 then Average holds 60', async ({page}, testInfo) => {
  test.setTimeout(180000);
  await openIncline(page);
  await rateOnly(page, 2);
  await startNext(page);
  await rateOnly(page, 3);
  await startNext(page);
  const afterLastHard = await liftSets(page, 'Incline Bench');
  expect(afterLastHard.filter((r) => r.purpose === 'working').map((r) => r.kg)).toEqual([60, 60, 60, 60]);
  await rateOnly(page, 2);
  await startNext(page);
  const afterAverage = await liftSets(page, 'Incline Bench');
  expect(afterAverage.filter((r) => r.purpose === 'working').map((r) => r.kg).slice(0, 2)).toEqual([60, 60]);
  await shot(page, testInfo, 'golden-c-average-holds-60');
});

test('golden C live: Very Hard twice floors at one step under pctLow', async ({page}, testInfo) => {
  test.setTimeout(180000);
  await openIncline(page);
  await rateOnly(page, 2);
  await startNext(page);
  await rateOnly(page, 2);
  await startNext(page);
  await rateOnly(page, 4);
  await startNext(page);
  const afterWorkVh = await liftSets(page, 'Incline Bench');
  expect(afterWorkVh.filter((r) => r.purpose === 'working').map((r) => r.kg).slice(0, 2)).toEqual([62.5, 60]);
  await rateOnly(page, 4);
  await startNext(page);
  const afterWorkVhTwice = await liftSets(page, 'Incline Bench');
  expect(afterWorkVhTwice.filter((r) => r.purpose === 'working').map((r) => r.kg).slice(0, 3)).toEqual([62.5, 60, 60]);
  await shot(page, testInfo, 'golden-c-vh-twice-floor');
});

test('golden rest fixture: log auto-starts rest; superset rests after the round', async ({page}, testInfo) => {
  test.setTimeout(180000);
  await loadAssignedWorkout(page, {prep: false, title: 'Golden rest times', blocks: GOLDEN_REST_BLOCKS});
  await bindGoldenAthlete(page, GOLDEN_DAN);
  await beginSession(page);
  const restMs = await page.evaluate(() => {
    const incline = S.session.pages.find((p) => p.title === 'Incline Bench');
    return {pageRest: incline.restSec, chosen: S.session.restChoices[incline.id]};
  });
  expect(restMs.pageRest).toBe(60);
  expect(restMs.chosen).toBe(60000);
  await rateOnly(page, 2);
  expect(await page.evaluate(() => ({mode: S.timer.mode, restMs: S.timer.config.restMs}))).toEqual({mode: 'rest', restMs: 60000});
  await shot(page, testInfo, 'golden-rest-autostart');

  await page.evaluate(() => {
    const pair = S.session.pages.find((p) => p.members?.some((m) => m.title === 'Jump Squat'));
    S.session = HybridSession.goToLetter(S.session, pair.letter || pair.id);
    save();
    Logger.paint();
  });
  const pairRest = await page.evaluate(() => {
    const pair = S.session.pages.find((p) => p.members?.some((m) => m.title === 'Jump Squat'));
    return {restSec: pair.restSec, mode: pair.logMode};
  });
  expect(pairRest.mode).toBe('superset');
  expect(pairRest.restSec).toBe(45);
  await page.locator('[aria-label="Actual effort for set 1"]').first().press('Home');
  await page.locator('[aria-label="Actual effort for set 1"]').first().press('ArrowRight');
  await page.locator('[aria-label="Actual effort for set 1"]').first().press('ArrowRight');
  await page.locator('.log-check').first().click();
  expect(await page.evaluate(() => S.timer.mode)).not.toBe('rest');
  await page.locator('[aria-label="Actual effort for set 1"]').nth(1).press('Home');
  await page.locator('[aria-label="Actual effort for set 1"]').nth(1).press('ArrowRight');
  await page.locator('[aria-label="Actual effort for set 1"]').nth(1).press('ArrowRight');
  await page.locator('.log-check').nth(1).click();
  expect(await page.evaluate(() => ({mode: S.timer.mode, restMs: S.timer.config.restMs}))).toEqual({mode: 'rest', restMs: 45000});
  await shot(page, testInfo, 'golden-rest-superset-round');
});

test('golden F G H I J K: tops, empty-bar lunge, DB starts, history, timed, row timer', async ({page}, testInfo) => {
  test.setTimeout(180000);
  await loadAssignedWorkout(page, {
    prep: true,
    title: 'Golden mixed',
    blocks: [
      {title: 'Incline Bench drop', letter: 'B', setCount: 3, rampCount: 0, oneRm: 100, pctLow: 90, pctHigh: 92, notes: ['2 x 2 @ 90-92% + drop set'], columns: ['reps', 'weight_kg'], equipmentId: 'barbell', loadConvention: 'total', minimumKg: 20, barWeightKg: 20, equipmentStepKg: 2.5},
      {title: 'Deficit Back Rack Lunge', letter: 'C', setCount: 3, rampCount: 0, notes: ['90 seconds rest'], columns: ['reps', 'weight_kg']},
      {title: 'DB RDL', letter: 'D', setCount: 3, rampCount: 0, notes: ['Rest: 60'], columns: ['reps', 'weight_kg']},
      {title: 'Wall Sit', letter: 'E', setCount: 3, notes: ['3 x 45 sec', 'Superset with Jump Squat']},
      {title: 'Jump Squat', letter: 'F', setCount: 3, notes: ['3 x 20 sec', 'Superset with Wall Sit']},
    ],
  });
  await bindGoldenAthlete(page, GOLDEN_DAN);
  const card = await page.evaluate(() => {
    const squat = S.library.templates[0].blocks.find((b) => /5 x 5/.test((b.notes || []).join(' ')));
    return squat ? StrengthWeights.cardPrescription(squat) : StrengthWeights.cardPrescription({prescription: '5 x 8', notes: ['5 x 5 @ 80-85%'], setCount: 5});
  });
  expect(card).toBe('5 x 5');
  await beginSession(page);
  const rowPage = await page.evaluate(() => S.session.pages.find((p) => /row/i.test(p.title) && p.section === 'Warm-Up'));
  expect(rowPage).toBeTruthy();
  // beginSession already passed warmups; reopen a fresh day for K by inspecting compiled pages
  const compiled = await page.evaluate(() => S.session.pages.map((p) => ({title: p.title, section: p.section, columns: p.columns, weighted: p.weighted, logMode: p.logMode})));
  const row = compiled.find((p) => p.title === 'Row' && p.section === 'Warm-Up');
  expect(row.columns).toContain('seconds');
  expect(row.weighted).toBe(false);
  const drop = await liftSets(page, 'Incline Bench drop');
  expect(drop.filter((r) => r.purpose === 'working').map((r) => r.kg).slice(0, 2)).toEqual([90, 90]);
  expect(drop.filter((r) => r.purpose === 'working').at(-1).kg).toBe(77.5);
  await page.evaluate(() => {
    const lunge = S.session.pages.find((p) => p.title === 'Deficit Back Rack Lunge');
    S.session = HybridSession.goToLetter(S.session, lunge.letter || lunge.id);
    save();
    Logger.paint();
  });
  const lunge = await liftSets(page, 'Deficit Back Rack Lunge');
  expect(lunge.filter((r) => r.purpose === 'working')[0].kg).toBe(20);
  await page.evaluate(() => {
    const rdl = S.session.pages.find((p) => p.title === 'DB RDL');
    S.session = HybridSession.goToLetter(S.session, rdl.letter || rdl.id);
    save();
    Logger.paint();
  });
  const rdl = await liftSets(page, 'DB RDL');
  expect(rdl.filter((r) => r.purpose === 'working')[0].kg).toBe(16);
  const pair = await page.evaluate(() => {
    const page = S.session.pages.find((p) => p.members?.some((m) => m.title === 'Jump Squat')) || S.session.pages.find((p) => p.title === 'Jump Squat');
    const jump = page.members ? page.members.find((m) => m.title === 'Jump Squat') : page;
    const wall = page.members ? page.members.find((m) => m.title === 'Wall Sit') : S.session.pages.find((p) => p.title === 'Wall Sit');
    return {jumpCols: jump.columns, wallCols: wall.columns, jumpPrescribed: jump.prescribed, wallPrescribed: wall.prescribed};
  });
  expect(pair.jumpCols).toContain('seconds');
  expect(pair.wallCols).toContain('seconds');
  expect(pair.jumpPrescribed).toBe('20');
  expect(pair.wallPrescribed).toBe('45');
  await shot(page, testInfo, 'golden-f-k-mixed');
});
