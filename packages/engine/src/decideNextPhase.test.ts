import { describe, expect, it } from 'vitest';
import {
  decideNextPhase,
  IN_SESSION_CONDITIONING,
  isIntrasessionAutoregFormat,
} from './decideNextPhase.js';

const mediumEffort = { rpe: [6, 7] as [number, number] };

describe('decideNextPhase', () => {
  it('returns noop for steady-state', () => {
    const r = decideNextPhase({
      formatKey: 'steady',
      effort: mediumEffort,
      felt: 7,
      zoneCompliance: 'met',
      targetWatts: 200,
    });
    expect(r.action).toBe('noop');
    expect(isIntrasessionAutoregFormat('steady')).toBe(false);
  });

  it('holds when felt is on target', () => {
    const r = decideNextPhase({
      formatKey: 'intervals',
      effort: mediumEffort,
      felt: 6.5,
      zoneCompliance: 'met',
      targetWatts: 200,
    });
    expect(r.action).toBe('hold');
    expect(r.nextTargetWatts).toBe(200);
  });

  it('increases watts when felt easier than prescribed', () => {
    const r = decideNextPhase({
      formatKey: 'intervals',
      effort: mediumEffort,
      felt: 5,
      zoneCompliance: 'met',
      targetWatts: 200,
    });
    expect(r.action).toBe('increase');
    expect(r.nextTargetWatts).toBeGreaterThan(200);
  });

  it('decreases watts when felt harder and zones met', () => {
    const r = decideNextPhase({
      formatKey: 'intervals',
      effort: mediumEffort,
      felt: 8,
      zoneCompliance: 'met',
      targetWatts: 200,
    });
    expect(r.action).toBe('decrease');
    expect(r.nextTargetWatts).toBeLessThan(200);
  });

  it('cuts harder when zones not met', () => {
    const met = decideNextPhase({
      formatKey: 'intervals',
      effort: mediumEffort,
      felt: 8,
      zoneCompliance: 'met',
      targetWatts: 200,
    });
    const miss = decideNextPhase({
      formatKey: 'intervals',
      effort: mediumEffort,
      felt: 8,
      zoneCompliance: 'not_met',
      targetWatts: 200,
    });
    expect(miss.nextTargetWatts).toBeLessThan(met.nextTargetWatts!);
  });

  it('exports provisional conditioning constants', () => {
    expect(IN_SESSION_CONDITIONING.wattsPushPct).toBe(0.03);
    expect(IN_SESSION_CONDITIONING.wattsEaseMetPct).toBe(0.05);
  });
});
