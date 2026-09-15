import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
require(join(dirname(fileURLToPath(import.meta.url)), 'hybrid-sc.js'));
const H = globalThis.HybridSc;

test('PRODUCT is HYBRID S&C', () => {
  assert.equal(H.PRODUCT, 'HYBRID S&C');
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

test('occupancy merges strength and engine date maps', () => {
  const occ = H.occupancy(
    { '2026-09-11': true, '2026-09-12': true },
    { '2026-09-12': true, '2026-09-13': true },
  );
  assert.deepEqual(occ.strength, { '2026-09-11': true, '2026-09-12': true });
  assert.deepEqual(occ.engine, { '2026-09-12': true, '2026-09-13': true });
});

test('dotsHtml emits both strength and engine spans on shared day', () => {
  const occ = H.occupancy({ '2026-09-12': true }, { '2026-09-12': true });
  const html = H.dotsHtml('2026-09-12', occ);
  assert.match(html, /cal-dot strength/);
  assert.match(html, /cal-dot engine/);
});

test('dotsHtml emits zero spans when day is empty', () => {
  const occ = H.occupancy({}, {});
  assert.equal(H.dotsHtml('2026-09-01', occ), '');
});

test('origins at athlete root points engine to ./engine/', () => {
  const o = H.origins('https://example.com/apps/athlete/index.html');
  assert.equal(o.strength, './');
  assert.equal(o.engine, './engine/');
});

test('origins inside engine house points strength to ../', () => {
  const o = H.origins('https://example.com/apps/athlete/engine/index.html');
  assert.equal(o.strength, '../');
  assert.equal(o.engine, './');
});

test('lockerCardHtml marks Strength primary when active strength', () => {
  const html = H.lockerCardHtml('strength');
  assert.match(html, /HYBRID S&amp;C/);
  assert.match(html, /class="btn primary"[^>]*>Strength/);
  assert.match(html, /class="btn"[^>]*>Engine/);
  assert.match(html, /aria-pressed="true"/);
  assert.match(html, /onclick="switchHybridLocker\('strength'\)"/);
  assert.match(html, /onclick="switchHybridLocker\('engine'\)"/);
  assert.ok(!/PlanSync/i.test(html));
  assert.ok(!/Copy training/i.test(html));
});

test('brandHtml lights active locker on status line', () => {
  const strength = H.brandHtml('strength');
  assert.match(strength, /HYBRID S&amp;C/);
  assert.match(strength, /<span class="on">Strength<\/span>/);
  assert.match(strength, /<span>Engine<\/span>/);

  const engine = H.brandHtml('engine');
  assert.match(engine, /<span class="on">Engine<\/span>/);
  assert.match(engine, /<span>Strength<\/span>/);
});

test('applyOccupancyToState sets hybridOccupancy on state', () => {
  const S = {};
  H.applyOccupancyToState(S, { '2026-09-11': true }, { '2026-09-12': true });
  assert.deepEqual(S.hybridOccupancy, {
    strength: { '2026-09-11': true },
    engine: { '2026-09-12': true },
  });
});

test('SNAPSHOT_DOMAINS prefers locker names then hosted-admitted aliases', () => {
  assert.deepEqual(H.SNAPSHOT_DOMAINS.strength, ['strength_side', 'strength']);
  assert.deepEqual(H.SNAPSHOT_DOMAINS.engine, ['engine_side', 'conditioning']);
});
