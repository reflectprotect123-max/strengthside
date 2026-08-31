import { describe, expect, it } from 'vitest';
import { decideInitialPrescription } from './decideInitialPrescription.js';

describe('decideInitialPrescription', () => {
  it('returns coach-pinned sets and reps unchanged', () => {
    const r = decideInitialPrescription({
      coachSets: 4,
      coachReps: '5',
      calibration: 'calibrated',
    });
    expect(r.sets).toBe(4);
    expect(r.reps).toBe('5');
    expect(r.autopilotVolume).toBe(false);
    expect(r.reasonCodes).toContain('coach_pinned_volume');
  });

  it('defaults to 3x8 when uncalibrated and no history', () => {
    const r = decideInitialPrescription({
      coachSets: null,
      coachReps: null,
      calibration: 'uncalibrated',
    });
    expect(r.sets).toBe(3);
    expect(r.reps).toBe('8');
    expect(r.autopilotVolume).toBe(true);
    expect(r.reasonCodes).toContain('baseline_uncalibrated');
  });

  it('reuses last session volume when history exists', () => {
    const r = decideInitialPrescription({
      coachSets: null,
      coachReps: null,
      calibration: 'calibrated',
      lastSession: { setCount: 5, reps: 3 },
    });
    expect(r.sets).toBe(5);
    expect(r.reps).toBe('3');
    expect(r.reasonCodes).toContain('history_last_session');
  });

  it('reduces sets on recovery hold', () => {
    const r = decideInitialPrescription({
      coachSets: null,
      coachReps: null,
      calibration: 'calibrated',
      lastSession: { setCount: 4, reps: 6 },
      recoveryGate: 'hold',
    });
    expect(r.sets).toBe(3);
    expect(r.reasonCodes).toContain('recovery_hold_reduce_sets');
  });

  it('respects volume cap', () => {
    const r = decideInitialPrescription({
      coachSets: null,
      coachReps: null,
      calibration: 'calibrated',
      lastSession: { setCount: 6, reps: 5 },
      maxSetsForExercise: 4,
    });
    expect(r.sets).toBe(4);
    expect(r.reasonCodes).toContain('volume_cap');
  });
});
