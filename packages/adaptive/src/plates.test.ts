import { describe, expect, it } from 'vitest';
import { roundToPlate } from './plates';

describe('roundToPlate', () => {
  it('rounds to 2.5 kg', () => {
    expect(roundToPlate(81)).toBe(80);
    expect(roundToPlate(81.25)).toBe(82.5);
  });
});
