import { describe, expect, it } from 'vitest';
import { decideNextSet, IN_SESSION_STRENGTH } from './decideNextSet.js';

const barbell = {
  id: 'barbell',
  name: 'Barbell',
  incrementKg: 2.5,
  rackValuesKg: null,
  rounding: 'down' as const,
};

function base(overrides: Partial<Parameters<typeof decideNextSet>[0]> = {}) {
  return {
    performedLoadKg: 100,
    performedReps: 8,
    prescribedReps: 8,
    prescribedLoadKg: 100,
    difficulty: 'medium' as const,
    equipment: barbell,
    sessionAnchorKg: 100,
    ordinal: 1,
    totalOrdinals: 3,
    ...overrides,
  };
}

describe('decideNextSet', () => {
  it('holds load and reps when on target (medium)', () => {
    const r = decideNextSet(base({ difficulty: 'medium' }));
    expect(r.loadKg).toBe(100);
    expect(r.reps).toBe(8);
    expect(r.reasonCodes).toContain('on_target_hold');
  });

  it('bumps load when very easy and rounding allows', () => {
    const nearest = { ...barbell, rounding: 'nearest' as const };
    const r = decideNextSet(
      base({ performedLoadKg: 100, prescribedLoadKg: 100, equipment: nearest, difficulty: 'very_easy' }),
    );
    expect(r.loadKg).toBeGreaterThan(100);
    expect(r.reasonCodes).toContain('very_easy_bump_load');
  });

  it('bumps reps when load cannot step up on down-rounded equipment', () => {
    const r = decideNextSet(
      base({ performedLoadKg: 80, prescribedLoadKg: 80, difficulty: 'very_easy', repRangeHi: 12 }),
    );
    expect(r.loadKg).toBe(80);
    expect(r.reps).toBe(9);
    expect(r.reasonCodes).toContain('very_easy_bump_reps');
  });

  it('cuts load when hard', () => {
    const r = decideNextSet(base({ difficulty: 'hard' }));
    expect(r.loadKg).toBeLessThan(100);
    expect(r.reasonCodes).toContain('hard_cut_load');
  });

  it('walks down load and caps reps on partial miss', () => {
    const r = decideNextSet(
      base({
        difficulty: 'did_not_complete',
        performedReps: 5,
      }),
    );
    expect(r.reps).toBe(5);
    expect(r.loadKg).toBeLessThan(100);
    expect(r.reasonCodes).toContain('did_not_complete_partial');
  });

  it('walks down load harder on zero reps', () => {
    const partial = decideNextSet(
      base({ difficulty: 'did_not_complete', performedReps: 3 }),
    );
    const zero = decideNextSet(
      base({ difficulty: 'did_not_complete', performedReps: 0 }),
    );
    expect(zero.loadKg).toBeLessThan(partial.loadKg);
    expect(zero.reasonCodes).toContain('did_not_complete_zero_reps');
  });

  it('exports provisional constants for audit', () => {
    expect(IN_SESSION_STRENGTH.cutSoftPct).toBe(0.025);
    expect(IN_SESSION_STRENGTH.cutHardPct).toBe(0.05);
  });
});
