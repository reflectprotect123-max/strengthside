import { describe, expect, it } from 'vitest';
import { decideInitialCondPrescription } from './decideInitialCondPrescription.js';

describe('decideInitialCondPrescription', () => {
  it('returns coach-pinned interval volume unchanged', () => {
    const r = decideInitialCondPrescription({
      formatKey: 'intervals',
      coachRounds: 6,
      coachWorkSec: 60,
      coachRestSec: 120,
    });
    expect(r.rounds).toBe(6);
    expect(r.workSec).toBe(60);
    expect(r.restSec).toBe(120);
    expect(r.autopilotCond).toBe(false);
    expect(r.reasonCodes).toContain('coach_pinned_volume');
  });

  it('fills intervals from conPrescription when coach defers', () => {
    const r = decideInitialCondPrescription({
      formatKey: 'intervals',
      coachRounds: null,
      coachWorkSec: null,
      coachRestSec: null,
    });
    expect(r.rounds).toBeGreaterThan(0);
    expect(r.workSec).toBeGreaterThan(0);
    expect(r.autopilotCond).toBe(true);
    expect(r.reasonCodes).toContain('autopilot_cond');
  });

  it('eases rounds on recovery hold', () => {
    const base = decideInitialCondPrescription({
      formatKey: 'intervals',
      coachRounds: null,
      coachWorkSec: null,
      coachRestSec: null,
      recoveryGate: 'ok',
    });
    const held = decideInitialCondPrescription({
      formatKey: 'intervals',
      coachRounds: null,
      coachWorkSec: null,
      coachRestSec: null,
      recoveryGate: 'hold',
    });
    expect(held.rounds).toBeLessThanOrEqual(base.rounds);
    expect(held.reasonCodes).toContain('recovery_hold_reduce_rounds');
  });

  it('reuses last session rounds when provided', () => {
    const r = decideInitialCondPrescription({
      formatKey: 'intervals',
      coachRounds: null,
      coachWorkSec: null,
      coachRestSec: null,
      lastSession: { rounds: 5, workSec: 45, restSec: 75 },
    });
    expect(r.rounds).toBe(5);
    expect(r.reasonCodes).toContain('history_last_session');
  });

  it('fills steady minutes from conPrescription when deferred', () => {
    const r = decideInitialCondPrescription({
      formatKey: 'steady',
      coachMinutes: null,
    });
    expect(r.minutes).toBeGreaterThanOrEqual(10);
    expect(r.autopilotCond).toBe(true);
  });
});
