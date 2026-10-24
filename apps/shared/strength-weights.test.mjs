import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const root = {};
for (const name of ['strength-equipment', 'strength-notes', 'strength-percent', 'strength-weights']) {
  vm.runInNewContext(readFileSync(new URL(`./${name}.js`, import.meta.url), 'utf8'), {window: root});
}
const W = root.StrengthWeights;
const DAN = W.profile('golden-dan');
const PARTNER = W.profile('golden-partner');

function barbell(title, extra = {}) {
  return {
    id: extra.letter || 'A',
    title,
    kind: 'lift',
    logMode: 'kg',
    columns: ['reps', 'weight_kg'],
    equipmentId: 'barbell',
    loadConvention: 'total',
    loadUnit: 'kg',
    minimumKg: extra.barKg ?? 20,
    barWeightKg: extra.barKg ?? 20,
    equipmentStepKg: 2.5,
    setCount: extra.setCount ?? 4,
    ...extra,
  };
}
function db(title, extra = {}) {
  return {
    id: extra.letter || 'C',
    title,
    kind: 'lift',
    logMode: 'kg',
    columns: ['reps', 'weight_kg'],
    equipmentId: 'dumbbell',
    loadConvention: 'per_hand',
    loadUnit: 'kg',
    minimumKg: 1,
    setCount: extra.setCount ?? 3,
    ...extra,
  };
}
function kgs(rows, purpose) {
  return rows.filter((r) => r.purpose === purpose).map((r) => r.kg);
}
function seedRows(plan, extras = {}) {
  const ramps = (plan.rampKgs || []).map((kg, i) => ({
    purpose: 'ramp', logged: false, skipped: false, kg, reps: extras.reps ?? 5, workingIndex: null,
  }));
  const warmups = (plan.warmupKgs || []).map((kg) => ({
    purpose: 'warmup', logged: false, skipped: false, kg, reps: extras.reps ?? 8, workingIndex: null,
  }));
  const working = (plan.workingKgs || []).map((kg, i) => ({
    purpose: 'working', logged: false, skipped: false, kg, reps: extras.reps ?? 8, workingIndex: i,
    setRole: extras.roles?.[i] || null,
  }));
  return warmups.concat(ramps, working);
}
function rate(page, rows, index, effort, athlete = DAN) {
  const copy = rows.map((r) => ({...r}));
  copy[index] = {...copy[index], logged: true, effort};
  return W.applyRating({page, rows: copy, ratedIndex: index, athlete});
}
function same(actual, expected) {
  assert.deepEqual(Array.isArray(actual) ? [...actual] : actual, expected);
}

test('A. % straight sets: Incline 4x @63-68% of 100 opens 30/45 then 62.5', () => {
  const page = barbell('Incline Bench', {
    oneRm: 100, pctLow: 63, pctHigh: 68, percentMode: 'straight', setCount: 4, rampCount: 2,
    notes: ['4 x 8 @ 63-68% (RPE 6)'],
  });
  const plan = W.plan({page, athlete: DAN, records: {}});
  same(plan.rampKgs, [30, 45]);
  same(plan.workingKgs, [62.5, 62.5, 62.5, 62.5]);
  assert.ok(plan.rampKgs.every((kg) => kg < plan.workingKgs[0]));
  assert.equal(plan.confidence, 'prescription');
});

test('B. Very Easy / Easy / Average leave the next ramp unchanged', () => {
  const page = barbell('Incline Bench', {oneRm: 100, pctLow: 63, pctHigh: 68, setCount: 4, rampCount: 2, workingKg: 62.5});
  const plan = W.plan({page, athlete: DAN, records: {}});
  const rows = seedRows(plan);
  for (const effort of ['very_easy', 'easy', 'average']) {
    const out = rate(page, rows, 0, effort);
    assert.equal(out.rows[1].kg, 45, `${effort} must hold ramp 2 at 45`);
    same(kgs(out.rows, 'working'), [62.5, 62.5, 62.5, 62.5]);
  }
});

test('B. Hard repeats the same ramp load; Very Hard stops ramping', () => {
  const page = barbell('Incline Bench', {oneRm: 100, pctLow: 63, pctHigh: 68, setCount: 4, rampCount: 2, workingKg: 62.5});
  const rows = seedRows(W.plan({page, athlete: DAN, records: {}}));
  const hard = rate(page, rows, 0, 'hard');
  assert.equal(hard.rows[1].kg, 30);
  assert.equal(hard.rows[1].skipped, false);
  const vh = rate(page, rows, 0, 'max_effort');
  assert.equal(vh.rows[1].skipped, true);
  assert.equal(vh.rows.find((r) => !r.logged && !r.skipped).purpose, 'working');
  same(kgs(vh.rows, 'working'), [62.5, 62.5, 62.5, 62.5]);
});

test('B. only the last ramp may cut working sets, and only downward', () => {
  const page = barbell('Incline Bench', {oneRm: 100, pctLow: 63, pctHigh: 68, setCount: 4, rampCount: 2, workingKg: 62.5});
  const rows = seedRows(W.plan({page, athlete: DAN, records: {}}));
  const first = rate(page, rows, 0, 'hard');
  same(kgs(first.rows, 'working'), [62.5, 62.5, 62.5, 62.5]);
  first.rows[1] = {...first.rows[1], logged: true, effort: 'hard'};
  const lastHard = W.applyRating({page, rows: first.rows, ratedIndex: 1, athlete: DAN});
  same(kgs(lastHard.rows, 'working'), [60, 60, 60, 60]);
  const lastVhRows = seedRows(W.plan({page, athlete: DAN, records: {}}));
  lastVhRows[0] = {...lastVhRows[0], logged: true, effort: 'average'};
  lastVhRows[1] = {...lastVhRows[1], logged: true, effort: 'max_effort'};
  const lastVh = W.applyRating({page, rows: lastVhRows, ratedIndex: 1, athlete: DAN});
  same(kgs(lastVh.rows, 'working'), [60, 60, 60, 60]);
  assert.equal(lastVh.flags.belowRange, true);
});

test('B. regression: rating a ramp never writes a ramp weight onto working sets', () => {
  const page = barbell('Incline Bench', {oneRm: 100, pctLow: 63, pctHigh: 68, setCount: 3, rampCount: 2});
  const rows = seedRows(W.plan({page, athlete: DAN, records: {}}));
  const out = rate(page, rows, 0, 'average');
  assert.ok(out.rows.filter((r) => r.purpose === 'working').every((r) => r.kg === 62.5));
  assert.ok(!out.rows.some((r) => r.purpose === 'working' && r.kg === 30));
  assert.notEqual(out.reason, 'combined_projection_hold');
});

test('B. ramps stay strictly climbing and below the first working set', () => {
  const page = barbell('Back Squat', {
    oneRm: 125, pctLow: 80, pctHigh: 85, percentMode: 'build', setCount: 5, rampCount: 3,
    notes: ['5 x 5 @ 80-85% (RPE 8) build over the 5 sets'],
  });
  const plan = W.plan({page, athlete: DAN, records: {}});
  assert.equal(plan.rampKgs.length, 3);
  assert.ok(plan.rampKgs[0] < plan.rampKgs[1] && plan.rampKgs[1] < plan.rampKgs[2]);
  assert.ok(plan.rampKgs[2] < plan.workingKgs[0]);
  const rows = seedRows(plan, {reps: 5});
  const easy = rate(page, rows, 0, 'easy');
  const ramps = kgs(easy.rows, 'ramp');
  assert.ok(ramps[0] < ramps[1] && ramps[1] < ramps[2], `ramps ${ramps}`);
  assert.ok(ramps[2] < easy.rows.find((r) => r.purpose === 'working').kg);
});

test('C. barbell working-set steps and % clamp / stale / below-range flag', () => {
  const page = barbell('Incline Bench', {oneRm: 100, pctLow: 63, pctHigh: 68, percentMode: 'straight', setCount: 4, rampCount: 0});
  const rows = seedRows({rampKgs: [], workingKgs: [62.5, 62.5, 62.5, 62.5]});
  assert.equal(rate(page, rows, 0, 'very_easy').rows[1].kg, 67.5);
  assert.equal(rate(page, rows, 0, 'easy').rows[1].kg, 65);
  assert.equal(rate(page, rows, 0, 'average').rows[1].kg, 62.5);
  const hard = rate(page, rows, 0, 'hard');
  assert.equal(hard.rows[1].kg, 60);
  assert.equal(hard.flags.belowRange, true);
  const vh = rate(page, rows, 0, 'max_effort');
  assert.equal(vh.rows[1].kg, 60);
  assert.equal(vh.flags.belowRange, true);
  vh.rows[1] = {...vh.rows[1], logged: true, effort: 'max_effort', kg: 60};
  const vhTwice = W.applyRating({page, rows: vh.rows, ratedIndex: 1, athlete: DAN});
  assert.equal(vhTwice.rows[2].kg, 60);
  assert.equal(vhTwice.flags.belowRange, true);
  const top = seedRows({rampKgs: [], workingKgs: [67.5, 67.5, 67.5, 67.5]});
  const firstVe = rate(page, top, 0, 'very_easy');
  assert.equal(firstVe.rows[1].kg, 67.5);
  firstVe.rows[1] = {...firstVe.rows[1], logged: true, effort: 'very_easy', kg: 67.5};
  const secondVe = W.applyRating({page, rows: firstVe.rows, ratedIndex: 1, athlete: DAN});
  assert.equal(secondVe.rows[2].kg, 67.5);
  assert.equal(secondVe.flags.staleOneRm, true);
});

test('C. last-ramp Hard to 60 then Average holds, never reclamps up', () => {
  const page = barbell('Incline Bench', {oneRm: 100, pctLow: 63, pctHigh: 68, percentMode: 'straight', setCount: 4, rampCount: 2, workingKg: 62.5});
  const rows = seedRows(W.plan({page, athlete: DAN, records: {}}));
  rows[0] = {...rows[0], logged: true, effort: 'average'};
  rows[1] = {...rows[1], logged: true, effort: 'hard'};
  const cut = W.applyRating({page, rows, ratedIndex: 1, athlete: DAN});
  same(kgs(cut.rows, 'working'), [60, 60, 60, 60]);
  assert.equal(cut.flags.belowRange, true);
  const afterCut = cut.rows.map((r, i) => i === 2 ? {...r, logged: true, effort: 'average', kg: 60} : r);
  const held = W.applyRating({page, rows: afterCut, ratedIndex: 2, athlete: DAN});
  assert.equal(held.rows[3].kg, 60);
  assert.equal(held.reason, 'working_hold');
});

test('C. dumbbells take one step, or +/-2 reps when the step is >10%', () => {
  const page = db('DB RDL', {setCount: 3, rampCount: 0});
  const light = seedRows({rampKgs: [], workingKgs: [8, 8, 8]}, {reps: 8});
  const easy = rate(page, light, 0, 'easy', PARTNER);
  assert.equal(easy.rows[1].kg, 8);
  assert.equal(easy.rows[1].reps, 10);
  const mid = seedRows({rampKgs: [], workingKgs: [16, 16, 16]}, {reps: 8});
  const up = rate(page, mid, 0, 'easy', DAN);
  assert.ok(up.rows[1].kg > 16);
  assert.equal(up.rows[1].reps, 8);
});

test('D. build day 1RM 125 to 80-85% is 75 / 82.5 / 92.5 / 100 / 107.5', () => {
  const page = barbell('Back Squat', {
    oneRm: 125, pctLow: 80, pctHigh: 85, percentMode: 'build', setCount: 5, rampCount: 3,
    notes: ['5 x 5 @ 80-85% (RPE 8) build over the 5 sets'],
  });
  const plan = W.plan({page, athlete: DAN, records: {}});
  same(plan.workingKgs, [75, 82.5, 92.5, 100, 107.5]);
  const rows = seedRows(plan, {reps: 5});
  let cur = rows;
  for (let i = 0; i < 3; i++) {
    const out = rate(page, cur, i, 'average');
    cur = out.rows;
  }
  same(kgs(cur, 'working'), [75, 82.5, 92.5, 100, 107.5]);
});

test('E. next build session repeats the coach-% climb, never flats', () => {
  const page = barbell('Back Squat', {
    oneRm: 125, pctLow: 80, pctHigh: 85, percentMode: 'build', setCount: 5, rampCount: 3,
    notes: ['5 x 5 @ 80-85% (RPE 8) build over the 5 sets'],
  });
  const history = {latest: {page, rows: [
    {purpose: 'working', logged: true, kg: 75, reps: 5, effort: 'average'},
    {purpose: 'working', logged: true, kg: 82.5, reps: 5, effort: 'average'},
    {purpose: 'working', logged: true, kg: 92.5, reps: 5, effort: 'average'},
    {purpose: 'working', logged: true, kg: 100, reps: 5, effort: 'average'},
    {purpose: 'working', logged: true, kg: 102.5, reps: 5, effort: 'average'},
  ]}};
  const plan = W.plan({page, history, athlete: DAN, records: {}});
  same(plan.workingKgs, [75, 82.5, 92.5, 100, 107.5]);
  assert.ok(plan.workingKgs[0] < plan.workingKgs[4]);
});

test('F. heavy tops 2x2 @90-92% of 100 are 90 / 90 then drop 77.5 x 8', () => {
  const page = barbell('Incline Bench drop', {
    oneRm: 100, pctLow: 90, pctHigh: 92, setCount: 3, rampCount: 0,
    notes: ['2 x 2 @ 90-92% + drop set'],
    setTargets: [
      {id: 'B:set:0', purpose: 'working', reps: {min: 2, max: 2}, pctLow: 90, pctHigh: 92},
      {id: 'B:set:1', purpose: 'working', reps: {min: 2, max: 2}, pctLow: 90, pctHigh: 92},
      {id: 'B:set:2', purpose: 'working', reps: {min: 8, max: 8}, setRole: 'drop', percentBasis: 'top_set'},
    ],
  });
  const plan = W.plan({page, athlete: DAN, records: {}});
  same(plan.workingKgs.slice(0, 2), [90, 90]);
  assert.equal(plan.workingKgs[2], 77.5);
});

test('G. Dan barbell lunge with no history starts at empty bar 20; rating uses C', () => {
  const page = barbell('Deficit Back Rack Lunge', {setCount: 3, rampCount: 0, notes: ['90 seconds rest']});
  const plan = W.plan({page, athlete: DAN, records: {}});
  assert.equal(plan.workingKgs[0], 20);
  assert.equal(plan.confidence, 'starting_level');
  const rows = seedRows(plan);
  assert.equal(rate(page, rows, 0, 'very_easy').rows[1].kg, 25);
  assert.equal(rate(page, rows, 0, 'easy').rows[1].kg, 22.5);
  assert.equal(rate(page, rows, 0, 'average').rows[1].kg, 20);
  assert.equal(rate(page, rows, 0, 'hard').rows[1].kg, 20);
});

test('H. DB RDL no history uses each athlete starting level', () => {
  const page = db('DB RDL', {setCount: 3, rampCount: 2, notes: ['Rest: 60']});
  assert.equal(W.plan({page, athlete: DAN, records: {}}).workingKgs[0], 16);
  assert.equal(W.plan({page, athlete: PARTNER, records: {}}).workingKgs[0], 8);
});

test('H2. DB lunge bodyweight warmup rating sets the first loaded set', () => {
  const page = db('DB Lunge', {setCount: 3, rampCount: 0});
  const dan = W.plan({page, athlete: DAN, records: {}});
  same(dan.warmupKgs, [0]);
  const danRows = seedRows(dan);
  assert.equal(danRows[0].purpose, 'warmup');
  assert.equal(rate(page, danRows, 0, 'very_easy', DAN).rows[1].kg, 12);
  assert.equal(rate(page, danRows, 0, 'easy', DAN).rows[1].kg, 10);
  assert.equal(rate(page, danRows, 0, 'average', DAN).rows[1].kg, 8);
  assert.equal(rate(page, danRows, 0, 'hard', DAN).rows[1].kg, 0);
  const partner = W.plan({page, athlete: PARTNER, records: {}});
  const pRows = seedRows(partner);
  assert.equal(rate(page, pRows, 0, 'very_easy', PARTNER).rows[1].kg, 6);
  assert.equal(rate(page, pRows, 0, 'easy', PARTNER).rows[1].kg, 5);
  assert.equal(rate(page, pRows, 0, 'average', PARTNER).rows[1].kg, 4);
  assert.equal(rate(page, pRows, 0, 'hard', PARTNER).rows[1].kg, 0);
});

test('H2. partner barbell starts from her profile bar', () => {
  const page = barbell('Back Squat', {setCount: 3, rampCount: 0, barKg: PARTNER.barKg});
  const plan = W.plan({page, athlete: PARTNER, records: {}});
  assert.ok(plan.workingKgs[0] === 15 || plan.workingKgs[0] === 20);
  assert.equal(plan.workingKgs[0], PARTNER.barKg);
});

test('I. history without coach % opens the last exact-lift load', () => {
  const page = db('DB RDL', {setCount: 3, rampCount: 2});
  const history = {latest: {page, rows: [{purpose: 'working', logged: true, kg: 35, reps: 8, effort: 'average'}]}};
  const plan = W.plan({page, history, athlete: DAN, records: {}});
  assert.equal(plan.workingKgs[0], 35);
  assert.equal(plan.confidence, 'history');
});

test('J. timed moves stay seconds with 0 kg; build card is 5 x 5', () => {
  const wall = W.describeTimed({title: 'Wall Sit', notes: ['3 x 45 sec', 'Superset with Jump Squat']});
  const jump = W.describeTimed({title: 'Jump Squat', notes: ['3 x 20 sec', 'Superset with Wall Sit']});
  same(wall.columns, ['seconds']);
  same(jump.columns, ['seconds']);
  assert.equal(wall.kg, 0);
  assert.equal(jump.kg, 0);
  assert.equal(wall.prescribed, '45');
  assert.equal(jump.prescribed, '20');
  const card = W.cardPrescription({
    prescription: '5 x 8',
    notes: ['5 x 5 @ 80-85% (RPE 8) build over the 5 sets'],
    setCount: 5,
  });
  assert.equal(card, '5 x 5');
});

test('K. Row 3:00 is a timer, never a barbell lift', () => {
  const row = W.describeTimed({title: 'Row', notes: ['3:00'], section: 'Warm-Up'});
  assert.equal(row.timer, true);
  assert.equal(row.kg, 0);
  assert.ok(row.columns.includes('seconds'));
  assert.ok(!row.columns.includes('weight_kg'));
  assert.equal(row.weighted, false);
});

test('fixtures never use Dan\'s real account id', () => {
  assert.equal(DAN.accountId, 'golden-dan');
  assert.equal(PARTNER.accountId, 'golden-partner');
  assert.notEqual(DAN.accountId, 'dan');
  assert.ok(!/reflectprotect|real/i.test(DAN.accountId));
});
