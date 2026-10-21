import { test, expect } from 'playwright/test';

test('onboarding uses sex, fitness, and goal for zones and the first week', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/engine/index.html');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('button', { name: 'Start onboarding', exact: true }).click();
  const dialog = page.locator('#engineOnboarding');
  await dialog.getByLabel('Age in years').fill('40');
  await dialog.getByRole('button', { name: 'Next', exact: true }).click();
  await dialog.getByRole('button', { name: 'Tanaka 2001 estimate.' }).click();
  await dialog.getByRole('button', { name: 'Next', exact: true }).click();
  await dialog.getByRole('button', { name: 'Low' }).click();
  await dialog.getByRole('button', { name: 'Next', exact: true }).click();
  await dialog.getByRole('button', { name: 'Improve cardio' }).click();
  await dialog.getByRole('button', { name: 'Next', exact: true }).click();
  await dialog.getByRole('button', { name: 'Estimate it for me' }).click();
  await expect(dialog.getByText('180 bpm')).toBeVisible();
  await dialog.getByRole('button', { name: 'Next', exact: true }).click();
  await dialog.getByLabel('Resting HR').fill('60');
  await dialog.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(dialog.getByText('You’re ready to train')).toBeVisible();
  await expect(dialog.getByText('Blue', { exact: true })).toBeVisible();
  await expect(dialog.getByText('114')).toBeVisible();
  await expect(dialog.getByText('First week')).toBeVisible();
  await dialog.getByRole('button', { name: 'Finish', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Onboarding completed', exact: true })).toBeVisible();
  const saved = await page.evaluate(() => ({
    sex: S.settings.fitnessProfile.sex,
    zones: EngineZones.profile(S, today()),
    week: S.weeklyTargetHistory.at(-1),
  }));
  expect(saved.sex).toBe('male');
  expect(saved.zones.blue).toBe(114);
  expect(saved.zones.green).toBe(138);
  expect(saved.zones.red).toBe(156);
  expect(saved.week.zones.Blue).toEqual([80, 120]);
  expect(errors).toEqual([]);
});
