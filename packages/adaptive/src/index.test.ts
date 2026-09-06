import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { closeCond, decideNextCond, openCond } from './index';

describe('public API', () => {
  it('exports cond-only functions', () => {
    expect(typeof openCond).toBe('function');
    expect(typeof decideNextCond).toBe('function');
    expect(typeof closeCond).toBe('function');
  });

  it('cond source never mentions RIR or loadKg', () => {
    const dir = dirname(fileURLToPath(import.meta.url));
    const cond = readFileSync(join(dir, 'decide-next-cond.ts'), 'utf8');
    expect(cond).not.toMatch(/\brir\b|loadKg/);
  });
});
