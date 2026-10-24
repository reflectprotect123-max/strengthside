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

/** Real signed-in UUID plus a mocked athlete_starting_level row. */
export async function bindRealAccount(page, {accountId, level} = {}) {
  await page.waitForFunction(() => Boolean(window.S && window.StrengthWeights && window.StrengthMemory));
  await page.evaluate(async ({accountId, level}) => {
    const rows = {};
    if (level) rows[accountId] = {level};
    const prev = window.Whoop?.client;
    window.Whoop = window.Whoop || {};
    window.Whoop.client = () => {
      const inner = typeof prev === 'function' ? prev() : {};
      return {
        ...inner,
        from(table) {
          if (table !== 'athlete_starting_level') return inner.from ? inner.from(table) : {};
          return {
            select() { return this; },
            eq(col, value) { this._id = value; return this; },
            async maybeSingle() { return {data: rows[this._id] || null, error: null}; },
            async upsert(row) { rows[row.athlete_id] = {level: row.level}; return {error: null}; },
          };
        },
      };
    };
    S.accountId = accountId;
    await StrengthWeights.loadAccount(accountId);
    await StrengthMemory.bind(accountId);
  }, {accountId, level});
}
