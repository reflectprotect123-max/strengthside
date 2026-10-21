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
  const window = fixture(async () => ({ ok: true, json: async () => ({ connected: true, syncedAt: '2026-10-21T01:00:00Z', normalized: { date: '2026-10-21', recoveryScore: 72, hrvMs: 48, restingHr: 51, sleepPerformance: 81, strain: 4.2 } }) }));
  await window.Fitbit.sync({ quiet: true });
  const day = window.S.checkin['2026-10-21'];
  assert.equal(day.whoopRecovery, 72);
  assert.equal(day.hrv, 48);
  assert.equal(day.restingHr, 51);
  assert.equal(day.whoopSleepPerformance, 81);
  assert.equal(day.whoopStrain, 4.2);
  assert.equal(window.S.settings.fitbit.connected, true);
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

test('an expired Google testing refresh asks the athlete to reconnect', async () => {
  const window = fixture(async () => ({ ok: false, status: 401, json: async () => ({ error: 'reconnect_fitbit', connected: false }) }));
  await assert.rejects(window.Fitbit.sync({ quiet: true }), /Reconnect Fitbit/);
  assert.equal(window.S.settings.fitbit.connected, false);
  assert.equal(window.S.settings.fitbit.reconnect, true);
  assert.match(window.Fitbit.uiMessage(), /Reconnect Fitbit/);
});
