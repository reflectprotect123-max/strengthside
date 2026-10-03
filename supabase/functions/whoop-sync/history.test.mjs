import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

// Exercise the deployed handler and real OAuth/history helpers with synthetic
// WHOOP pages. Only the Supabase client and durable store are substituted.
const result = await build({
  stdin: { contents: "import './index.ts'; export { saveToken, loadData } from '../_shared/oauth.ts';", resolveDir: import.meta.dirname },
  bundle: true, write: false, format: 'esm', platform: 'node',
  plugins: [{ name: 'test-boundaries', setup(builder) {
    builder.onResolve({ filter: /^https:\/\/esm\.sh\// }, () => ({ path: 'supabase', namespace: 'test' }));
    builder.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: `export const createClient = () => ({ auth: { getUser: async jwt => jwt === 'test-user-session' ? { data: { user: { id: 'test-user' } }, error: null } : { data: { user: null }, error: 'invalid' } } });` }));
    builder.onLoad({ filter: /_shared\/store\.ts$/ }, () => ({ contents: `const store = new Map(); export const getJson = async key => store.get(key) ?? null; export const setJson = async (key, value) => store.set(key, value); export const deleteKey = async key => store.delete(key);` }));
  } }],
});
let handler;
globalThis.Deno = { serve: fn => { handler = fn; }, env: { get: key => ({ SUPABASE_URL: 'https://example.test', SUPABASE_SERVICE_ROLE_KEY: 'synthetic-service-key', INTEGRATION_ENCRYPT_KEY: 'synthetic-encryption-key' })[key] } };
const api = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
const request = query => new Request(`https://example.test/whoop-sync${query}`, { headers: { authorization: 'Bearer test-user-session', 'x-hybrid-product': 'strength' } });
const originalFetch = globalThis.fetch;
let pageCount = 0, repeatCursor = false;
globalThis.fetch = async url => {
  const u = new URL(url), cursor = Number(u.searchParams.get('nextToken') || 0), limit = Number(u.searchParams.get('limit'));
  const size = 151, end = Math.min(size, cursor + limit), records = [];
  for (let i = cursor; i < end; i++) {
    const date = new Date(Date.UTC(2026, 8, 30 - i, 2)).toISOString();
    if (u.pathname.endsWith('/recovery')) records.push({ cycle_id: i + 1, sleep_id: 'sleep-'+i, score_state: 'SCORED', score: { recovery_score: i === 0 ? 0 : 80, hrv_rmssd_milli: 48.123 + i / 100, resting_heart_rate: 54 } });
    if (u.pathname.endsWith('/cycle')) records.push({ id: i + 1, start: date, timezone_offset: '-05:00', step_count: i===0?0:8234, score: { strain: 5 } });
  }
  if (u.pathname.endsWith('/activity/sleep')) records.push(...Array.from({length:end-cursor},(_,n)=>({id:'sleep-'+(cursor+n),end:'2026-10-01T08:00:00Z',score_state:'SCORED',nap:false,score:{stage_summary:{total_light_sleep_time_milli:4*3600000,total_slow_wave_sleep_time_milli:2*3600000,total_rem_sleep_time_milli:3600000,total_awake_time_milli:3600000,total_in_bed_time_milli:8*3600000}}})));
  if (u.pathname.endsWith('/recovery')) pageCount++;
  return Response.json({ records, next_token: records.length && end < size ? (repeatCursor ? '1' : String(end)) : '' });
};
await api.saveToken('whoop', 's:test-user', { access_token: 'synthetic-whoop-token', expires_at: Date.now() + 3600000 });

test('full-history handler returns all pages, precise metrics, zero recovery and cycle-local dates', async () => {
  const response = await handler(request('?backfill=1&history=all'));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.dailyMetrics.length, 151);
  assert.equal(pageCount, 7);
  assert.equal(body.dailyMetrics.at(-1).date, '2026-09-29');
  assert.equal(body.dailyMetrics.at(-1).hrv, 48.123);
  assert.equal(body.dailyMetrics.at(-1).sleep, 7);
  assert.equal(body.dailyMetrics[0].sleep, 7);
  assert.equal(body.stepsStatus, 'ok');
  assert.equal(body.stepsProvider, 'whoop-official');
  assert.equal(body.dailyMetrics.at(-1).steps, 0);
  assert.equal(body.dailyMetrics[0].steps, 8234);
  assert.equal(body.dailyMetrics.at(-1).sources.steps, 'WHOOP official API');
  assert.equal(body.normalized.recoveryScore, 0);
  assert.equal(body.normalized.date, '2026-09-29');
  assert.equal(body.historyTruncated, false);
});

test('routine sync retains previously imported history and reports its limited fetch', async () => {
  pageCount = 0;
  const body = await (await handler(request(''))).json();
  assert.equal(pageCount, 1);
  assert.equal(body.dailyMetrics.length, 151);
  assert.equal((await api.loadData('whoop', 's:test-user')).dailyMetrics.length, 151);
  assert.equal(body.historyTruncated, true);
});

test('missing or invalid login cannot retrieve history or make WHOOP requests', async () => {
  pageCount = 0;
  for (const headers of [{}, { authorization: 'Bearer invalid-session' }]) {
    const response = await handler(new Request('https://example.test/whoop-sync?history=all', { headers }));
    assert.equal(response.status, 401);
  }
  assert.equal(pageCount, 0);
});

test('repeated upstream cursor fails rather than storing fabricated complete history', async () => {
  repeatCursor = true;
  try {
    assert.equal((await handler(request('?history=all'))).status, 502);
    assert.equal((await api.loadData('whoop', 's:test-user')).dailyMetrics.length, 151);
  } finally { repeatCursor = false; globalThis.fetch = originalFetch; }
});
