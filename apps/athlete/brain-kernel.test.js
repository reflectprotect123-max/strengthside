import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
require(join(here, 'brain-kernel.js'));
const kernel = globalThis.HybridBrainKernel;

test('kernel exports Engine Open/Next/Close only', () => {
  assert.equal(typeof kernel.decideNextEngine, 'function');
  assert.equal(typeof kernel.dailyZones, 'function');
  assert.equal(typeof kernel.open, 'function');
  assert.equal(typeof kernel.close, 'function');
  assert.equal(kernel.decideNextStrength, undefined);
  assert.equal(kernel.rememberLift, undefined);
  assert.equal(kernel.openingKg, undefined);
  assert.equal(kernel.kgFromPctPad, undefined);
  assert.equal(kernel.estimateE1rmKg, undefined);
});

test('open/close ignore leftover strength facts', () => {
  assert.equal(kernel.open({ kind: 'strength', lastKg: 100 }).needsFirstNumber, undefined);
  assert.equal(kernel.close({ kind: 'strength', actualKg: 102.5 }).lastKg, undefined);
  assert.equal(kernel.decideNext({ kind: 'strength' }).hold, true);
});
