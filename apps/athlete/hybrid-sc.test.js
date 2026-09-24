import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
require(join(dirname(fileURLToPath(import.meta.url)), 'hybrid-sc.js'));
const H = globalThis.HybridSc;

test('PRODUCT is The Engine', () => {
  assert.equal(H.PRODUCT, 'The Engine');
});

test('datesFromState collects assignment and session ISO keys', () => {
  const state = {
    library: { assignments: { '2026-09-11': 'tpl_a', '2026-09-12': 'tpl_b' } },
    sessions: { '2026-09-12': { date: '2026-09-12' }, '2026-09-15': {} },
  };
  const dates = H.datesFromState(state);
  assert.equal(dates['2026-09-11'], true);
  assert.equal(dates['2026-09-12'], true);
  assert.equal(dates['2026-09-15'], true);
  assert.equal(Object.keys(dates).length, 3);
});

test('datesFromSnapshot walks snapshot.sessions date fields', () => {
  const snapshot = {
    sessions: [
      { id: 's1', date: '2026-09-07', kind: 'log' },
      { id: 's2', date: '2026-09-09', kind: 'assignment' },
      { id: 's3', kind: 'catalog' },
    ],
  };
  const dates = H.datesFromSnapshot(snapshot);
  assert.equal(dates['2026-09-07'], true);
  assert.equal(dates['2026-09-09'], true);
  assert.equal(Object.keys(dates).length, 2);
});

test('occupancy is engine dates only', () => {
  const occ = H.occupancy({ '2026-09-12': true, '2026-09-13': true });
  assert.deepEqual(occ.engine, { '2026-09-12': true, '2026-09-13': true });
  assert.equal(occ.strength, undefined);
});

test('dotsHtml emits engine span only', () => {
  const occ = H.occupancy({ '2026-09-12': true });
  const html = H.dotsHtml('2026-09-12', occ);
  assert.match(html, /cal-dot engine/);
  assert.ok(!/cal-dot strength/.test(html));
  assert.equal(H.dotsHtml('2026-09-01', occ), '');
});

test('origins stay on the engine house', () => {
  const o = H.origins('https://example.com/apps/athlete/index.html');
  assert.equal(o.engine, './');
  assert.equal(o.strength, undefined);
});

test('lockerCardHtml is gone', () => {
  assert.equal(H.lockerCardHtml(), '');
});

test('brandHtml is conditioning only', () => {
  const html = H.brandHtml();
  assert.match(html, /The Engine/);
  assert.match(html, /Conditioning/);
  assert.ok(!/Strength/.test(html));
});

test('applyOccupancyToState sets engine occupancy', () => {
  const S = {};
  H.applyOccupancyToState(S, { '2026-09-12': true });
  assert.deepEqual(S.hybridOccupancy, {
    engine: { '2026-09-12': true },
  });
});

test('SNAPSHOT_DOMAINS has engine locker names only', () => {
  assert.equal(H.SNAPSHOT_DOMAINS.strength, undefined);
  assert.deepEqual(H.SNAPSHOT_DOMAINS.engine, ['engine_side', 'conditioning']);
});
