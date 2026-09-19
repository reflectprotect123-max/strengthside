import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
require(join(dirname(fileURLToPath(import.meta.url)), 'engine.js'));
const HybridEngine = globalThis.HybridEngine;

const locked = { floor: 60, bg: 136, gr: 168, max: 190 };

test('zoneSlice follows the BPM ruler for the locked 136 / 168 day', () => {
  const span = 190 - 60;
  const blue = HybridEngine.zoneSlice('blue', locked);
  const green = HybridEngine.zoneSlice('green', locked);
  const red = HybridEngine.zoneSlice('red', locked);
  assert.equal(blue.start, 0);
  assert.ok(Math.abs(blue.end - (136 - 60) / span) < 1e-9);
  assert.ok(Math.abs(green.start - blue.end) < 1e-9);
  assert.ok(Math.abs(green.end - (168 - 60) / span) < 1e-9);
  assert.equal(red.start, green.end);
  assert.equal(red.end, 1);
  assert.ok(blue.end > 0.5, 'blue occupies most of the ruler from rest to 136');
  assert.ok(blue.end < green.end);
  assert.ok(green.end < 1);
});
