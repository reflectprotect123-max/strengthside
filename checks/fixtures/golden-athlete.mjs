/** Isolated fixture accounts. Never bind Dan's real cloud id. */
export const GOLDEN_DAN = 'golden-dan';
export const GOLDEN_PARTNER = 'golden-partner';

export async function bindGoldenAthlete(page, accountId = GOLDEN_DAN) {
  await page.waitForFunction(() => Boolean(window.S && window.StrengthWeights && window.StrengthMemory));
  await page.evaluate(async (id) => {
    S.accountId = id;
    S.athleteLevels = StrengthWeights.profile(id);
    StrengthWeights.use(id);
    await StrengthMemory.bind(id);
  }, accountId);
}
