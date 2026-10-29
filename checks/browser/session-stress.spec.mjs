import { loadAssignedWorkout } from './assigned-workout.mjs';
import { test, expect } from 'playwright/test';

test.use({ viewport: { width: 412, height: 915 } });

test('stress session holds, carries, ramps, supersets and totals', async ({ page }, testInfo) => {
  test.setTimeout(180000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await loadAssignedWorkout(page, {
    prep: false,
    title: 'Stress session',
    blocks: [
      { title: 'Plank', columns: ['seconds'], prescribed: '30', setCount: 1 },
      { title: 'Farmer Carry', columns: ['weight_kg', 'meters'], prescribed: '20', setCount: 1, equipmentId: 'dumbbell', loadConvention: 'per_hand' },
      { title: 'Dumbbell Bench Press', columns: ['reps', 'weight_kg'], setCount: 1, repTarget: '6', equipmentId: 'dumbbell', loadConvention: 'per_hand', exerciseType: 'main' },
      { title: 'Bench Press', columns: ['reps', 'weight_kg'], setCount: 1, repTarget: '5', notes: ['rest 45'], equipmentId: 'barbell', loadConvention: 'total', minimumKg: 20, equipmentStepKg: 2.5, exerciseType: 'main', groupId: 'pair' },
      { title: 'Dumbbell Row', columns: ['reps', 'weight_kg'], setCount: 1, repTarget: '8', equipmentId: 'dumbbell', loadConvention: 'per_hand', exerciseType: 'accessory', groupId: 'pair' },
    ],
  });
  await page.evaluate(() => StrengthMemory.bind('stress-athlete'));
  await page.clock.install();
  await page.getByRole('button', { name: 'Start Session', exact: true }).click();
  await page.clock.fastForward(2000);
  await page.getByRole('button', { name: 'Got It', exact: true }).click();

  await expect(page.getByRole('button', { name: 'Start hold', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Start hold', exact: true }).click();
  await expect(page.locator('.tm-countin')).toContainText('3');
  await page.screenshot({ path: testInfo.outputPath('hold-count-in.png') });
  await page.clock.fastForward(34000);
  await expect(page.locator('button.log-cell').filter({ hasText: /^30$/ })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('hold-seconds.png') });
  const effort = page.getByRole('slider', { name: 'Actual effort for set 1' });
  await effort.press('Home');
  await effort.press('ArrowRight');
  await page.locator('button.log-check').click();
  await expect(page.locator('.log-totals')).toContainText('30');

  await page.getByRole('button', { name: 'Next →', exact: true }).click();
  await expect(page.getByText('EST. 1RM')).toHaveCount(0);
  await expect(page.getByText('Weight (kg each side)')).toBeVisible();
  await expect(page.locator('button.log-cell').filter({ hasText: /^8$/ })).toBeVisible();
  await expect(page.locator('button.log-cell').filter({ hasText: /^20$/ })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('carry-prefill.png') });
  await page.getByRole('slider', { name: 'Actual effort for set 1' }).press('ArrowRight');
  await page.locator('button.log-check').click();
  await expect(page.locator('.log-totals')).toContainText('20');

  await page.getByRole('button', { name: 'Next →', exact: true }).click();
  await expect(page.getByText('Ramp 1 of 2', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Weight (kg)', { exact: true })).toHaveValue('2');
  await page.screenshot({ path: testInfo.outputPath('db-ramp.png') });

  await page.getByRole('button', { name: 'Next →', exact: true }).click();
  await expect(page.locator('.log-note').first()).toContainText('Ramp 1');
  await expect(page.locator('.log-ss-member')).toHaveCount(1);
  await expect(page.getByText('45 seconds')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('superset-round.png') });
  expect(errors).toEqual([]);
});
