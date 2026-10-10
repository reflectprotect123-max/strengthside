import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
require(join(dirname(fileURLToPath(import.meta.url)), 'hybrid-sc.js'));
const H = globalThis.HybridSc;

test('product is Hybrid Strength', () => {
  assert.equal(H.PRODUCT, 'HYBRID STRENGTH');
});

test('datesFromState collects assignment and session ISO keys', () => {
  const state = {
    library: { assignments: { '2026-09-11': 'tpl_a', '2026-09-12': 'tpl_b' } },
    sessions: { '2026-09-12': { date: '2026-09-12' }, '2026-09-15': {} },
  };
  assert.deepEqual(H.datesFromState(state), {
    '2026-09-11': true,
    '2026-09-12': true,
    '2026-09-15': true,
  });
});

test('occupancy and calendar dots contain Strength only', () => {
  const occ = H.occupancy({ '2026-09-12': true });
  assert.deepEqual(occ, { strength: { '2026-09-12': true } });
  assert.match(H.dotsHtml('2026-09-12', occ), /cal-dot strength/);
  assert.doesNotMatch(H.dotsHtml('2026-09-12', occ), /engine|conditioning/i);
  assert.equal(H.dotsHtml('2026-09-13', occ), '');
});

test('brand and account card expose no conditioning switch', () => {
  const html = H.brandHtml() + H.lockerCardHtml();
  assert.match(html, /HYBRID STRENGTH/);
  assert.doesNotMatch(html, /Engine|Conditioning|switchHybridLocker/i);
});

test('applyOccupancyToState stores only Strength dates', () => {
  const state = {};
  H.applyOccupancyToState(state, { '2026-09-11': true });
  assert.deepEqual(state.hybridOccupancy, { strength: { '2026-09-11': true } });
});

test('snapshot domains contain only the Strength aliases', () => {
  assert.deepEqual(H.SNAPSHOT_DOMAINS, { strength: ['strength_side', 'strength'] });
});
