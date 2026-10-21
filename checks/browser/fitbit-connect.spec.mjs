import { test, expect } from 'playwright/test';

test('Me offers Fitbit next to WHOOP', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.waitForFunction(() => window.S && window.setTab && window.Fitbit && window.Whoop);
  await page.evaluate(() => {
    S.settings.whoop = { ...(S.settings.whoop || {}), email: 'athlete@example.test', connected: false };
    S.settings.fitbit = { connected: false, reconnect: false };
    setTab('me');
  });
  await expect(page.getByRole('button', { name: 'Connect WHOOP', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Connect Fitbit', exact: true })).toBeVisible();
  await page.evaluate(() => {
    S.settings.fitbit = { connected: false, reconnect: true };
    setTab('me');
  });
  await expect(page.getByRole('button', { name: 'Reconnect Fitbit', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
