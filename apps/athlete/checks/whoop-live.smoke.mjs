/**
 * Live WHOOP: Netlify handlers are gone. Shared Edge is the only connect path.
 */
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const EDGE = 'https://orysjncrksmdfabpuftd.supabase.co/functions/v1/whoop-connect';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yeXNqbmNya3NtZGZhYnB1ZnRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0MTE4NzksImV4cCI6MjA5OTk4Nzg3OX0.GTMBfFtH5O6SikzHo75sXGIZoEhmuJ7TvXiACd7T078';
const DEAD = [
  'https://thehybridsystem.netlify.app/.netlify/functions/whoop-connect',
  'https://thehybridengine1.netlify.app/.netlify/functions/whoop-connect',
];

const failures = [];
function must(cond, msg) {
  if (!cond) failures.push(msg);
}

// A normalized wearable sample may update observations, never training advice.
const sampleDate = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
const checkins = {};
let readinessCalls = 0;
let persistedDate = null;
const window = {
  STRENGTH_CONFIG: { supabaseUrl: 'https://example.test', supabaseAnon: 'test' },
  S: { settings: { whoop: {} }, checkin: checkins },
  today: () => new Date().toISOString().slice(0, 10),
  dailyCheckin: (date) => (checkins[date] ||= { date }),
  HybridIntegrations: { persistWhoop: (_state, date) => { persistedDate = date; } },
  readinessScore: () => {
    readinessCalls += 1;
    return { color: 'green', reason: 'Build', backgroundLoad: 1, recoveryPenalty: 0, wearablePenalty: 0 };
  },
  supabase: { createClient: () => ({ auth: { getSession: async () => ({ data: { session: { access_token: 'test', user: { email: 'athlete@example.test' } } } }) } }) },
  fetch: async () => ({ ok: true, json: async () => ({ whoop: { connected: true, normalized: {
    date: sampleDate, recoveryScore: 72, hrvMs: 58, restingHr: 49, sleepPerformance: 84, strain: 9.2,
  } } }) }),
  setInterval: () => 0,
  save: () => {},
};
const connector = readFileSync(new URL('../connectors/whoop.js', import.meta.url), 'utf8');
runInNewContext(connector, { window, URLSearchParams, Date, fetch: window.fetch });
await window.Whoop.refreshStatus();
const checkin = checkins[sampleDate];
must(checkin.whoopRecovery === 72, 'normalized recovery is stored');
must(checkin.hrv === 58, 'normalized HRV is stored');
must(checkin.restingHr === 49, 'normalized resting HR is stored');
must(checkin.whoopSleepPerformance === 84, 'normalized sleep performance is stored');
must(checkin.whoopStrain === 9.2, 'normalized strain is stored');
must(!!checkin.whoopSyncedAt && checkin.whoopSampleDate === sampleDate, 'sync timestamps are stored');
must(persistedDate === sampleDate, 'sample-date observations are shared on their own date');
must(readinessCalls === 0, 'WHOOP sync must not score readiness');
must(!('sleepQuality' in checkin), 'WHOOP sleep performance must not overwrite a subjective check-in');
for (const key of ['readinessColor', 'mainLimiter', 'backgroundLoad', 'recoveryPenalty', 'wearablePenalty']) {
  must(!(key in checkin), `WHOOP sync must not write ${key}`);
}

if (failures.length) {
  console.error('whoop-live.smoke FAIL');
  failures.forEach((failure) => console.error(' -', failure));
  process.exit(1);
}
if (process.env.WHOOP_LIVE_SMOKE === '0') {
  console.log('whoop-live.smoke: raw sync ok; live endpoint check skipped (WHOOP_LIVE_SMOKE=0)');
  process.exit(0);
}

for (const url of DEAD) {
  const res = await fetch(url, { redirect: 'manual', cache: 'no-store' });
  must(res.status === 404, `${url} should be 404 (moved to Edge), got ${res.status}`);
}

const res = await fetch(`${EDGE}?client=native&product=strength`, {
  headers: { apikey: ANON, 'x-hybrid-product': 'strength' },
  cache: 'no-store',
});
must(res.status === 401, `Edge whoop-connect without Bearer expected 401, got ${res.status}`);
const body = await res.json().catch(() => ({}));
must(
  body.code === 'UNAUTHORIZED_NO_AUTH_HEADER' || body.error === 'unauthorized' || body.message,
  `Edge 401 body unexpected ${JSON.stringify(body)}`,
);

if (failures.length) {
  console.error('whoop-live.smoke FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('whoop-live.smoke: ok — Edge is live, Netlify WHOOP is gone');
