import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  closeCond,
  decideNextCond,
  openCond,
} from './index';
import * as api from './index';

describe('public API', () => {
  it('exports cond Open/Next/Close only', () => {
    expect(typeof openCond).toBe('function');
    expect(typeof decideNextCond).toBe('function');
    expect(typeof closeCond).toBe('function');
    expect(api).not.toHaveProperty('decideNextLift');
    expect(api).not.toHaveProperty('openLift');
    expect(api).not.toHaveProperty('closeLift');
    expect(api).not.toHaveProperty('estimateOneRm');
    expect(api).not.toHaveProperty('roundToPlate');
    expect(api).not.toHaveProperty('parseRepRange');
  });

  it('lift modules are gone', () => {
    const dir = dirname(fileURLToPath(import.meta.url));
    expect(existsSync(join(dir, 'decide-next-lift.ts'))).toBe(false);
    expect(existsSync(join(dir, 'open-lift.ts'))).toBe(false);
    expect(existsSync(join(dir, 'close-lift.ts'))).toBe(false);
    expect(existsSync(join(dir, 'estimate-one-rm.ts'))).toBe(false);
    expect(existsSync(join(dir, 'plates.ts'))).toBe(false);
  });
});
