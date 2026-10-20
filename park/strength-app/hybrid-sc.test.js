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

test('datesFromState marks scheduled plans, not archived session keys', () => {
  const state = {
    library: { templates:[{id:'tpl_a',blocks:[{kind:'lift'}]},{id:'tpl_b',blocks:[{kind:'lift'}]}], assignments: { '2026-09-11': 'tpl_a', '2026-09-12': 'tpl_b' } },
    sessions: { '2026-09-12': { date: '2026-09-12' }, '2026-09-15': {} },
  };
  assert.deepEqual(H.datesFromState(state), {
    '2026-09-11': true,
    '2026-09-12': true,
  });
});

test('occupancy and calendar dots contain Strength only', () => {
  const occ = H.occupancy({ '2026-09-12': true });
  assert.deepEqual(occ, { strength: { '2026-09-12': true } });
  assert.match(H.dotsHtml('2026-09-12', occ), /cal-dot strength/);
  assert.doesNotMatch(H.dotsHtml('2026-09-12', occ), /engine|conditioning/i);
  assert.equal(H.dotsHtml('2026-09-13', occ), '');
});

test('brand stays Strength; account card carries the Strength | Engine switch', () => {
  assert.match(H.brandHtml(), /HYBRID STRENGTH/);
  const card = H.lockerCardHtml();
  assert.match(card, /role="group" aria-label="Locker"/);
  assert.match(card, /aria-pressed="true" onclick="switchHybridLocker\('strength'\)">Strength</);
  assert.match(card, /aria-pressed="false" onclick="switchHybridLocker\('engine'\)">Engine</);
  assert.doesNotMatch(card, /plan sync|copy training/i);
});

test('applyOccupancyToState stores only Strength dates', () => {
  const state = {};
  H.applyOccupancyToState(state, { '2026-09-11': true });
  assert.deepEqual(state.hybridOccupancy, { strength: { '2026-09-11': true } });
});

test('snapshot domains contain only the Strength aliases', () => {
  assert.deepEqual(H.SNAPSHOT_DOMAINS, { strength: ['strength_side', 'strength'] });
});

test('deleted, orphaned and empty templates cannot leave ghost calendar markers', () => {
 const archived={phase:'summary',logs:{A:{sets:[{logged:true,reps:8,kg:40}]}}};
 const state={library:{templates:[{id:'empty',blocks:[]}],assignments:{'2026-10-10':'deleted','2026-10-11':'empty'}},sessions:{'2026-10-10':archived},trainingPlans:{'2026-10-12':{blocks:[{kind:'lift'}]}}};
 assert.deepEqual(H.datesFromState(state),{'2026-10-12':true});assert.equal(state.sessions['2026-10-10'],archived);
});
