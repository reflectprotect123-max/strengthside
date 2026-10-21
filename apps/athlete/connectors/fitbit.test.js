import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('./fitbit.js', import.meta.url), 'utf8');

function fixture(fetchImpl) {
  const state = { accountId: 'athlete-a', settings: { fitbit: {} }, checkin: {} };
  const window = {
    S: state,
    STRENGTH_CONFIG: { supabaseAnon: 'anon', hybridProduct: 'strength' },
    Whoop: {
      token: async () => 'athlete-token',
      fnUrl: (path, query) => 'https://example.test/functions/v1/' + path + '?' + new URLSearchParams(query || {}),
    },
    WhoopCommon: { todayIso: () => '2026-10-21' },
    dailyCheckin: (date) => state.checkin[date] ||= { date },
    save() {},
    Capacitor: {},
  };
  runInNewContext(source, { window, URL, URLSearchParams, Date, fetch: fetchImpl });
  return window;
}

test('Fitbit sync writes the same check-in fields WHOOP uses', async () => {
  const window = fixture(async () => ({ ok: true, json: async () => ({ connected: true, syncedAt: '2026-10-21T01:00:00Z', normalized: { date: '2026-10-21', recoveryScore: 72, hrvMs: 48, restingHr: 51, sleepPerformance: 81, sleepHours: 7.5, steps: 6400, strain: 4.2 }, dailyMetrics: [{ date: '2026-10-21', hrv: 48, rhr: 51, sleep: 7.5, steps: 6400, sleepPerformance: 81, strain: 4.2 }] }) }));
  window.StrengthHome = { importHistory(state, body, today, source) {
    state.fitbitHistory = state.fitbitHistory || [];
    state.fitbitHistory.push({ source, today, sleep: body.dailyMetrics[0].sleep, steps: body.dailyMetrics[0].steps });
  } };
  await window.Fitbit.sync({ quiet: true });
  const day = window.S.checkin['2026-10-21'];
  assert.equal(day.whoopRecovery, 72);
  assert.equal(day.hrv, 48);
  assert.equal(day.restingHr, 51);
  assert.equal(day.whoopSleepPerformance, 81);
  assert.equal(day.whoopStrain, 4.2);
  assert.equal(day.sleepHours, 7.5);
  assert.equal(day.steps, 6400);
  assert.equal(window.S.fitbitHistory[0].source, 'Fitbit');
  assert.equal(window.S.settings.fitbit.connected, true);
});

test('two Fitbit syncs share one request', async () => {
  let calls = 0;
  let finish;
  const window = fixture(async () => {
    calls += 1;
    await new Promise((resolve) => { finish = resolve; });
    return { ok: true, json: async () => ({ connected: true, syncedAt: '2026-10-21T01:00:00Z', normalized: { date: '2026-10-21', hrvMs: 40, restingHr: 60 } }) };
  });
  const first = window.Fitbit.sync({ quiet: true });
  const second = window.Fitbit.sync({ quiet: true });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls, 1);
  finish();
  await Promise.all([first, second]);
});

test('the athlete Me page offers Fitbit beside WHOOP', () => {
  const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(app, /Connect WHOOP/);
  assert.match(app, /Connect Fitbit/);
  assert.match(app, /Reconnect Fitbit/);
  assert.match(html, /connectors\/fitbit\.js/);
  assert.match(html, /connectors\/whoop\.js/);
});

test('a failed sync replaces Syncing Fitbit with the Health API error', async () => {
  const window = fixture(async () => ({ ok: false, status: 502, json: async () => ({ error: 'sync_failed', failures: ['sleep:403'] }) }));
  window.render = () => {};
  await assert.rejects(window.Fitbit.sync(), /sleep:403/);
  assert.equal(window.Fitbit.uiMessage(), 'sleep:403');
});

test('an expired Google testing refresh asks the athlete to reconnect', async () => {
  const window = fixture(async () => ({ ok: false, status: 401, json: async () => ({ error: 'reconnect_fitbit', connected: false }) }));
  await assert.rejects(window.Fitbit.sync({ quiet: true }), /Reconnect Fitbit/);
  assert.equal(window.S.settings.fitbit.connected, false);
  assert.equal(window.S.settings.fitbit.reconnect, true);
  assert.match(window.Fitbit.uiMessage(), /Reconnect Fitbit/);
});
