import { describe, it, expect } from 'vitest';
import { planCoordinator, type DomainReceipts } from './coordinator';

function emptyReceipts(): DomainReceipts {
  return {
    strength: { progressionAudit: [], sessionPainFlags: [] },
    conditioning: { weeklyZoneSeconds: {}, sessionsCompleted: 0 },
    recovery: [],
    nutrition: { daysLogged: 0, daysInWindow: 7 },
  };
}

describe('planCoordinator', () => {
  it('reports pain flags and recovery holds', () => {
    const r = planCoordinator({
      ...emptyReceipts(),
      strength: {
        progressionAudit: [{ at: 't', sessionId: 's', exerciseId: 'sq', action: 'hold', reasonCodes: ['session_pain_yes'] }],
        sessionPainFlags: [{ sessionId: 's', level: 'yes', at: 't' }],
      },
      recovery: [
        { date: '2026-08-20', band: 'minimum', gate: 'hold' },
        { date: '2026-08-21', band: 'minimum', gate: 'hold' },
      ],
    });
    expect(r.items.some(i => i.domain === 'strength' && i.kind === 'hold')).toBe(true);
    expect(r.items.some(i => i.domain === 'recovery')).toBe(true);
    expect(r.headline).toMatch(/Recovery/i);
  });

  it('celebrates progress when recovery allows', () => {
    const r = planCoordinator({
      ...emptyReceipts(),
      strength: {
        progressionAudit: [{ at: 't', sessionId: 's', exerciseId: 'bp', action: 'progress', reasonCodes: ['three_on_target'] }],
        sessionPainFlags: [],
      },
      conditioning: { weeklyZoneSeconds: { aerobic: 3600 }, sessionsCompleted: 2 },
      recovery: [{ date: '2026-08-22', band: 'build', gate: 'ok' }],
      nutrition: { daysLogged: 5, daysInWindow: 7 },
    });
    expect(r.items.some(i => i.domain === 'strength' && i.kind === 'push')).toBe(true);
    expect(r.reasonCodes).toContain('strength_progress_applied');
  });
});
