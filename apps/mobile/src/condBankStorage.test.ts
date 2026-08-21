import {
  clampCondWeek,
  clearCondBank,
  COND_BANK_STORAGE_KEY,
  isStoredCondBank,
  loadCondBank,
  saveCondBank,
  type CondWeek,
} from './condBankStorage';

const sample: CondWeek = {
  low: { banked: 43, target: 90 },
  mod: { banked: 28, target: 60 },
  high: { banked: 14, target: 30 },
};

describe('condBankStorage', () => {
  beforeEach(async () => {
    await clearCondBank();
  });

  it('round-trips a week bank for the same athlete + week', async () => {
    await saveCondBank('dan veldman', 'W1', sample);
    const loaded = await loadCondBank('dan veldman', 'W1');
    expect(loaded).toEqual(sample);
  });

  it('returns null for a different athlete or week', async () => {
    await saveCondBank('dan veldman', 'W1', sample);
    expect(await loadCondBank('other athlete', 'W1')).toBeNull();
    expect(await loadCondBank('dan veldman', 'W2')).toBeNull();
  });

  it('clamps banked minutes to the target', () => {
    expect(
      clampCondWeek({
        low: { banked: 999, target: 90 },
        mod: { banked: -3, target: 60 },
        high: { banked: 14.6, target: 30 },
      }),
    ).toEqual({
      low: { banked: 90, target: 90 },
      mod: { banked: 0, target: 60 },
      high: { banked: 15, target: 30 },
    });
  });

  it('rejects malformed storage payloads', () => {
    expect(isStoredCondBank(null)).toBe(false);
    expect(isStoredCondBank({ athlete: 'x', weekId: 'W1' })).toBe(false);
    expect(COND_BANK_STORAGE_KEY).toContain('condWeek');
  });
});
