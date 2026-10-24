import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
require(join(here, 'training-core.js'));
require(join(here, 'strength-targets.js'));
require(join(here, 'session.js'));
require(join(here, 'conditioning-score.js'));
const Score = globalThis.ConditioningScore;
const HS = globalThis.HybridSession;

function rowSession() {
  const plan = {
    title: 'Wed machines',
    blocks: [{
      kind: 'lift', letter: 'A', title: 'Row Erg',
      columns: ['calories', 'meters', 'watts', 'time_mmss'],
      setCount: 2,
    }],
  };
  let s = HS.startSession({date: '2026-10-21', plan, letter: 'A'});
  s = HS.logSet(s, 0, {cells: {calories: 15, meters: 250, watts: 180, time_mmss: 100}, effort: 'average'});
  s = HS.logSet(s, 1, {cells: {calories: 18, meters: 260, watts: 190, time_mmss: 95}, effort: 'hard'});
  return s;
}

test('row intervals produce total rounds, splits, pace per 500 m and session totals', () => {
  const score = Score.fromSession(rowSession());
  assert.equal(score.rounds, 2);
  assert.equal(score.totals.calories, 33);
  assert.equal(score.totals.meters, 510);
  assert.equal(score.totals.watts, 185);
  assert.equal(score.totals.seconds, 195);
  assert.equal(score.splits.length, 2);
  assert.equal(score.splits[0].pace500, 200);
  assert.equal(score.splits[1].pace500, Math.round(95 / (260 / 500)));
  assert.equal(score.pace500, Math.round(195 / (510 / 500)));
  assert.equal(score.machines[0].kind, 'row');
});

test('ski uses pace per 500 m and bike does not', () => {
  const ski = Score.forPage({title: 'Ski Erg'}, [{logged: true, cells: {meters: 500, time_mmss: 120}}]);
  assert.equal(ski.kind, 'ski');
  assert.equal(ski.pace500, 120);
  const bike = Score.forPage({title: 'Assault Bike'}, [{logged: true, cells: {meters: 500, time_mmss: 120, calories: 20}}]);
  assert.equal(bike.kind, 'bike');
  assert.equal(bike.pace500, null);
  assert.equal(bike.totals.calories, 20);
});

test('unlogged sets, ramps and failed intervals do not score', () => {
  const page = {title: 'Row Erg'};
  const score = Score.forPage(page, [
    {logged: false, cells: {meters: 500, time_mmss: 90}},
    {logged: true, purpose: 'ramp', cells: {meters: 100, time_mmss: 30}},
    {logged: true, miss: true, cells: {meters: 200, time_mmss: 80}},
  ]);
  assert.equal(score.rounds, 0);
  assert.equal(score.totals.meters, 0);
});

test('coach receipt payload carries rounds, splits and totals', () => {
  const payload = Score.receipt(rowSession());
  assert.equal(payload.rounds, 2);
  assert.equal(payload.totals.calories, 33);
  assert.equal(payload.splits.length, 2);
  assert.ok(payload.splits[0].pace500);
});
