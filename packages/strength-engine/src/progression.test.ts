// packages/strength-engine/src/progression.test.ts
import { describe, it, expect } from 'vitest';
import { decideProgression, anchorKgFor, DeterministicDecider } from './progression';
import { calibrationStateFor } from './calibration';
import type { StrengthExposure } from './exposure';

function exposure(overrides: Partial<StrengthExposure>): StrengthExposure {
  return {
    exerciseId: 'sq', assignedSessionId: 'as1', reps: 5, loadKg: 100, rated: true, painFlagged: false, onTarget: true,
    exposureClass: 'successful', performedSetId: 'p1', performedAt: '2026-08-20T10:00:00Z',
    ...overrides,
  };
}

describe('anchorKgFor', () => {
  it('anchors on the last exposure classified successful or successful_but_uncertain — never a missed load', () => {
    const exposures = [
      exposure({ performedSetId: 'p1', loadKg: 100, exposureClass: 'successful', performedAt: '2026-08-18T10:00:00Z' }),
      exposure({ performedSetId: 'p2', loadKg: 94, exposureClass: 'missed', performedAt: '2026-08-20T10:00:00Z' }),
    ];
    expect(anchorKgFor(exposures)).toBe(100);
  });

  it('returns null when nothing on record is on-target — a real held state, not a fallback to a missed weight', () => {
    const exposures = [exposure({ exposureClass: 'missed' }), exposure({ exposureClass: 'pain_blocked', performedSetId: 'p2' })];
    expect(anchorKgFor(exposures)).toBeNull();
  });

  it('picks the MOST RECENT on-target exposure when several exist', () => {
    const exposures = [
      exposure({ performedSetId: 'p1', loadKg: 90, performedAt: '2026-08-10T10:00:00Z' }),
      exposure({ performedSetId: 'p2', loadKg: 95, performedAt: '2026-08-15T10:00:00Z' }),
      exposure({ performedSetId: 'p3', loadKg: 92, exposureClass: 'missed', performedAt: '2026-08-20T10:00:00Z' }),
    ];
    expect(anchorKgFor(exposures)).toBe(95);
  });
});

describe('decideProgression', () => {
  it('holds with no_history when there are no usable exposures', () => {
    const decision = decideProgression([], { exerciseId: 'sq' });
    expect(decision.action).toBe('hold');
    expect(decision.reasonCodes).toContain('no_history');
    expect(decision.source).toBe('deterministic');
  });

  it('progresses 2.5% after one rated on-target success', () => {
    const decision = decideProgression([exposure({})], { exerciseId: 'sq' });
    expect(decision.action).toBe('progress');
    expect(decision.deltaPct).toBe(0.025);
    expect(decision.reasonCodes).toContain('on_target_rated');
  });

  it('still progresses when more history exists — last session governs', () => {
    const exposures = [
      exposure({ performedSetId: 'p1', performedAt: '2026-08-14T10:00:00Z' }),
      exposure({ performedSetId: 'p2', performedAt: '2026-08-17T10:00:00Z' }),
      exposure({ performedSetId: 'p3', performedAt: '2026-08-20T10:00:00Z' }),
    ];
    const decision = decideProgression(exposures, { exerciseId: 'sq' });
    expect(decision.action).toBe('progress');
    expect(decision.reasonCodes).toContain('on_target_rated');
  });

  it('deloads 5% off the anchor when the last two exposures are missed', () => {
    const exposures = [
      exposure({ performedSetId: 'p1', loadKg: 100, exposureClass: 'successful', performedAt: '2026-08-10T10:00:00Z' }),
      exposure({ performedSetId: 'p2', loadKg: 94, exposureClass: 'missed', performedAt: '2026-08-15T10:00:00Z' }),
      exposure({ performedSetId: 'p3', loadKg: 92, exposureClass: 'missed', performedAt: '2026-08-20T10:00:00Z' }),
    ];
    const decision = decideProgression(exposures, { exerciseId: 'sq' });
    expect(decision.action).toBe('deload');
    expect(decision.deltaPct).toBe(-0.05);
    expect(decision.reasonCodes).toContain('repeated_deterioration');
  });

  it('holds with mixed_signal when the last session was not a rated on-target success', () => {
    const exposures = [
      exposure({ performedSetId: 'p1', exposureClass: 'successful', performedAt: '2026-08-14T10:00:00Z' }),
      exposure({ performedSetId: 'p2', exposureClass: 'missed', performedAt: '2026-08-20T10:00:00Z' }),
    ];
    const decision = decideProgression(exposures, { exerciseId: 'sq' });
    expect(decision.action).toBe('hold');
    expect(decision.reasonCodes).toContain('mixed_signal');
  });

  it('holds rather than deloading when repeated_deterioration is met but there is no on-target anchor to deload from', () => {
    const exposures = [
      exposure({ performedSetId: 'p1', exposureClass: 'missed', performedAt: '2026-08-10T10:00:00Z' }),
      exposure({ performedSetId: 'p2', exposureClass: 'missed', performedAt: '2026-08-15T10:00:00Z' }),
      exposure({ performedSetId: 'p3', exposureClass: 'missed', performedAt: '2026-08-20T10:00:00Z' }),
    ];
    const decision = decideProgression(exposures, { exerciseId: 'sq' });
    expect(decision.action).toBe('hold');
    expect(decision.reasonCodes).toContain('mixed_signal');
  });

  it('every decision carries exerciseId and source: deterministic', () => {
    const decision = decideProgression([exposure({})], { exerciseId: 'front-squat' });
    expect(decision.exerciseId).toBe('front-squat');
    expect(decision.source).toBe('deterministic');
  });

  it('does not progress a set that was completed but fell short of the prescribed stimulus', () => {
    const decision = decideProgression(
      [exposure({ exposureClass: 'successful', onTarget: false })],
      { exerciseId: 'sq' },
    );
    expect(decision.action).not.toBe('progress');
  });

  it('does not progress on UNRATED (successful_but_uncertain) exposures', () => {
    const decision = decideProgression(
      [exposure({ exposureClass: 'successful_but_uncertain', onTarget: true })],
      { exerciseId: 'sq' },
    );
    expect(decision.action).toBe('hold');
  });

  it('progresses on [S, S, S, pain] — pain-blocked session is ignored', () => {
    const exposures = [
      exposure({ performedSetId: 'p1', performedAt: '2026-08-10T10:00:00Z' }),
      exposure({ performedSetId: 'p2', performedAt: '2026-08-13T10:00:00Z' }),
      exposure({ performedSetId: 'p3', performedAt: '2026-08-16T10:00:00Z' }),
      exposure({ performedSetId: 'p4', exposureClass: 'pain_blocked', painFlagged: true, performedAt: '2026-08-20T10:00:00Z' }),
    ];
    const decision = decideProgression(exposures, { exerciseId: 'sq' });
    expect(decision.action).toBe('progress');
    expect(decision.reasonCodes).toContain('on_target_rated');
  });

  it('holds on [missed, missed, pain] when there is no successful anchor to deload from', () => {
    const exposures = [
      exposure({ performedSetId: 'p1', exposureClass: 'missed', performedAt: '2026-08-10T10:00:00Z' }),
      exposure({ performedSetId: 'p2', exposureClass: 'missed', performedAt: '2026-08-15T10:00:00Z' }),
      exposure({ performedSetId: 'p3', exposureClass: 'pain_blocked', painFlagged: true, performedAt: '2026-08-20T10:00:00Z' }),
    ];
    const decision = decideProgression(exposures, { exerciseId: 'sq' });
    expect(decision.action).toBe('hold');
    expect(decision.reasonCodes).toContain('mixed_signal');
  });

  it('still deloads off the successful anchor when the misses are real: [S, missed, missed, pain]', () => {
    const exposures = [
      exposure({ performedSetId: 'p1', loadKg: 100, exposureClass: 'successful', performedAt: '2026-08-08T10:00:00Z' }),
      exposure({ performedSetId: 'p2', loadKg: 94, exposureClass: 'missed', performedAt: '2026-08-12T10:00:00Z' }),
      exposure({ performedSetId: 'p3', loadKg: 92, exposureClass: 'missed', performedAt: '2026-08-16T10:00:00Z' }),
      exposure({ performedSetId: 'p4', exposureClass: 'pain_blocked', painFlagged: true, performedAt: '2026-08-20T10:00:00Z' }),
    ];
    const decision = decideProgression(exposures, { exerciseId: 'sq' });
    expect(decision.action).toBe('deload');
    expect(decision.deltaKg).toBe(100 * -0.05);
  });

  it('carries deltaKg computed from the anchor kg on a progress decision', () => {
    const exposures = [exposure({ performedSetId: 'p1', loadKg: 100 })];
    const decision = decideProgression(exposures, { exerciseId: 'sq' });
    const anchor = anchorKgFor(exposures);
    expect(decision.action).toBe('progress');
    expect(decision.deltaKg).toBe(anchor! * decision.deltaPct!);
  });

  it('carries deltaKg computed from the anchor kg on a deload decision', () => {
    const exposures = [
      exposure({ performedSetId: 'p1', loadKg: 100, exposureClass: 'successful', performedAt: '2026-08-10T10:00:00Z' }),
      exposure({ performedSetId: 'p2', loadKg: 94, exposureClass: 'missed', performedAt: '2026-08-15T10:00:00Z' }),
      exposure({ performedSetId: 'p3', loadKg: 92, exposureClass: 'missed', performedAt: '2026-08-20T10:00:00Z' }),
    ];
    const decision = decideProgression(exposures, { exerciseId: 'sq' });
    const anchor = anchorKgFor(exposures);
    expect(decision.action).toBe('deload');
    expect(decision.deltaKg).toBe(anchor! * decision.deltaPct!);
  });
});

describe('DeterministicDecider (async seam)', () => {
  it('resolves to the same decision decideProgression returns for the same inputs', async () => {
    const exposures = [exposure({ performedSetId: 'p1', performedAt: '2026-08-14T10:00:00Z' })];
    const calibration = calibrationStateFor(exposures);
    const viaSeam = await DeterministicDecider.decide(exposures, calibration, { exerciseId: 'sq' });
    const viaCore = decideProgression(exposures, { exerciseId: 'sq' });
    expect(viaSeam).toEqual(viaCore);
  });
});
