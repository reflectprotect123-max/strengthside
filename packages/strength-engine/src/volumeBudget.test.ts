import { describe, expect, it } from 'vitest';
import {
  auditSessionWorkingSets,
  computeVolumeBudget,
  maxSetsForExerciseInSession,
} from './volumeBudget';

describe('computeVolumeBudget', () => {
  it('caps 3×60-min full-body plans near 12 session sets and ~11 emphasize sets/muscle/week', () => {
    const budget = computeVolumeBudget({
      sessionsPerWeek: 3,
      minutesPerSession: 60,
      splitType: 'full_body',
    });

    expect(budget.sessionWorkingSetCap).toBe(12);
    expect(budget.weeklyWorkingSetCap).toBe(36);
    expect(budget.perMuscleSessionCap).toBe(4);
    expect(budget.perMuscleWeeklyCap.emphasize).toBe(11);
    expect(budget.perMuscleWeeklyCap.grow).toBe(9);
    expect(budget.perMuscleWeeklyCap.maintain).toBe(6);
  });

  it('allows more per-muscle volume on upper/lower splits', () => {
    const budget = computeVolumeBudget({
      sessionsPerWeek: 4,
      minutesPerSession: 75,
      splitType: 'upper_lower',
    });

    expect(budget.sessionWorkingSetCap).toBe(16);
    expect(budget.perMuscleSessionCap).toBe(8);
    expect(budget.perMuscleWeeklyCap.emphasize).toBeGreaterThan(12);
  });
});

describe('auditSessionWorkingSets', () => {
  it('flags templates above the session cap', () => {
    const budget = computeVolumeBudget({
      sessionsPerWeek: 3,
      minutesPerSession: 60,
      splitType: 'full_body',
    });
    const audit = auditSessionWorkingSets(15, budget);

    expect(audit.overSessionCap).toBe(true);
    expect(audit.warnings[0]).toContain('15 working sets');
    expect(audit.reasonCodes).toContain('volume.session_guide_exceeded');
  });
});

describe('maxSetsForExerciseInSession', () => {
  it('limits a single lift to the per-muscle session cap', () => {
    const budget = computeVolumeBudget({
      sessionsPerWeek: 3,
      minutesPerSession: 60,
      splitType: 'full_body',
    });

    expect(maxSetsForExerciseInSession(8, 3, budget)).toBe(4);
    expect(maxSetsForExerciseInSession(11, 3, budget)).toBe(4);
    expect(maxSetsForExerciseInSession(11, 3, budget)).toBeLessThanOrEqual(budget.sessionWorkingSetCap);
  });
});
