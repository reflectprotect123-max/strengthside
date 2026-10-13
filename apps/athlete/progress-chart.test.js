import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const sandbox = { window: {} };
runInNewContext(readFileSync(new URL('./progress-chart.js', import.meta.url), 'utf8'), sandbox);
const { trend } = sandbox.window.ProgressChart;

test('recorded days keep their calendar place and missing days are not invented', () => {
  const rows = [
    { date: '2026-10-01', recovery: 40 },
    { date: '2026-10-03', recovery: 80 },
  ];
  const drawn = trend(rows, 'recovery', { start: '2026-10-01', end: '2026-10-11' });
  assert.equal(drawn.count, 2);
  assert.equal(drawn.points.length, 2);
  assert.equal(drawn.points[0].x, 12);
  assert.ok(Math.abs(drawn.points[1].x - (12 + (2 / 10) * 296)) < 0.01);
  assert.equal(drawn.points.some((point) => point.date === '2026-10-02'), false);
});

test('a single recorded day stays a point when the period is wider', () => {
  const drawn = trend([{ date: '2026-10-10', hrv: 48 }], 'hrv', { start: '2026-10-01', end: '2026-10-10' });
  assert.equal(drawn.points.length, 1);
  assert.equal(drawn.points[0].x, 308);
});

test('no recorded values produce no line', () => {
  assert.equal(trend([{ date: '2026-10-01', recovery: null }], 'recovery', { start: '2026-10-01', end: '2026-10-10' }), null);
});
