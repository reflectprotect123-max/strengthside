/** Isolated fixture accounts. Never bind Dan's real cloud id. */
export const GOLDEN_DAN = 'golden-dan';
export const GOLDEN_PARTNER = 'golden-partner';

/** Rest-time workout: prescribed rest auto-starts, and a pair rests after the round. */
export const GOLDEN_REST_BLOCKS = [
  {
    title: 'Incline Bench', letter: 'A', setCount: 2, rampCount: 0,
    oneRm: 100, pctLow: 63, pctHigh: 68, percentMode: 'straight',
    notes: ['Rest 60s'], restSec: 60,
    columns: ['reps', 'weight_kg'], equipmentId: 'barbell',
    loadConvention: 'total', minimumKg: 20, equipmentStepKg: 2.5, barWeightKg: 20,
  },
  {
    title: 'Wall Sit', letter: 'F1', setCount: 2,
    notes: ['3 x 45 sec', 'Rest 45s', 'Superset with Jump Squat'], restSec: 45,
  },
  {
    title: 'Jump Squat', letter: 'F2', setCount: 2,
    notes: ['3 x 20 sec', 'Superset with Wall Sit'],
  },
];

export async function bindGoldenAthlete(page, accountId = GOLDEN_DAN) {
  await page.waitForFunction(() => Boolean(window.S && window.StrengthWeights && window.StrengthMemory));
  await page.evaluate(async (id) => {
    S.accountId = id;
    S.athleteLevels = StrengthWeights.profile(id);
    StrengthWeights.use(id);
    await StrengthMemory.bind(id);
  }, accountId);
}
