import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { applyBrand, BRAND_PATCHES } from './engine-house-brand.mjs';

const engine = readFileSync(new URL('../apps/athlete/engine/index.html', import.meta.url), 'utf8');

test('imported Engine page carries the EDS brand, not the old names', () => {
  assert.match(engine, /<title>EDS Engine<\/title>/);
  assert.match(engine, /Choose an EDS Strength backup\./);
  assert.doesNotMatch(engine, /Hybrid Engine|Hybrid Power Project|StrengthSide standalone backup|data:image\/jpeg/);
  assert.doesNotMatch(engine, /class="home-mark" aria-hidden="true">TH</);
  assert.equal(engine.split('data:image/png;base64,').length - 1 >= 4, true);
});

test('brand patches fail safely when the upstream text moved', () => {
  assert.throws(() => applyBrand('unrelated', Buffer.from('x')), /found 0 times/);
  const base = BRAND_PATCHES.map(([from]) => from).join('\n');
  assert.throws(() => applyBrand(base, Buffer.from('x')), /expected 3 embedded HPP logos/);
});
