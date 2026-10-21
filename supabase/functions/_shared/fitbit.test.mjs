import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';

const bundle = await build({
  stdin: { contents: "export * from './fitbit.ts';", resolveDir: import.meta.dirname },
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
});
globalThis.Deno = { env: { get: (key) => ({ GOOGLE_HEALTH_CLIENT_ID: 'client', GOOGLE_HEALTH_CLIENT_SECRET: 'secret' })[key] } };
const fitbit = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));

const day = (date, hrv, rhr) => ({ date, hrv, rhr });

test('recovery rises when HRV is above baseline and resting HR is below it', () => {
  const history = Array.from({ length: 8 }, (_, i) => day(`2026-10-0${i + 1}`, 40, 60));
  const high = fitbit.recoveryScore({ hrv: 70, rhr: 48 }, history);
  const low = fitbit.recoveryScore({ hrv: 20, rhr: 75 }, history);
  assert.ok(high > 50 && high <= 100);
  assert.ok(low < 50 && low >= 0);
  assert.equal(fitbit.recoveryScore({ hrv: 70, rhr: 48 }, history.slice(0, 3)), null);
});

test('sleep performance rewards eight hours and deep plus REM', () => {
  const full = fitbit.sleepPerformance({ minutesAsleep: 480, minutesInSleepPeriod: 520, deepMinutes: 90, remMinutes: 110 });
  const short = fitbit.sleepPerformance({ minutesAsleep: 240, minutesInSleepPeriod: 300, deepMinutes: 20, remMinutes: 20 });
  assert.ok(full > short);
  assert.ok(full >= 90 && full <= 100);
  assert.equal(fitbit.sleepPerformance({ minutesAsleep: 0 }), null);
});

test('active zone minutes map into the 0–21 strain field', () => {
  assert.equal(fitbit.strainFromActiveZoneMinutes(15), 1);
  assert.equal(fitbit.strainFromActiveZoneMinutes(400), 21);
  assert.equal(fitbit.strainFromActiveZoneMinutes(null), null);
});

test('daily Google Health points become the WHOOP check-in shape', () => {
  const hrv = Array.from({ length: 8 }, (_, i) => ({
    dailyHeartRateVariability: { date: { year: 2026, month: 10, day: i + 1 }, averageHeartRateVariabilityMilliseconds: 40 },
  }));
  hrv.push({ dailyHeartRateVariability: { date: { year: 2026, month: 10, day: 9 }, averageHeartRateVariabilityMilliseconds: 70 } });
  const resting = [{ dailyRestingHeartRate: { date: { year: 2026, month: 10, day: 9 }, beatsPerMinute: '48' } }];
  const sleep = [{
    sleep: {
      metadata: { mainSleep: true, nap: false },
      interval: { civilEndTime: { year: 2026, month: 10, day: 9 } },
      summary: { minutesAsleep: '480', minutesInSleepPeriod: '520', stagesSummary: [{ type: 'DEEP', minutes: '90' }, { type: 'REM', minutes: '100' }] },
    },
  }];
  const rows = fitbit.buildFitbitDays({ hrv, resting, sleep, zoneMinutes: [{ activeZoneMinutes: { date: { year: 2026, month: 10, day: 9 }, activeZoneMinutes: '30' } }] });
  const latest = fitbit.normalizeFitbitDays(rows);
  assert.equal(latest.source, 'fitbit');
  assert.equal(latest.date, '2026-10-09');
  assert.equal(latest.hrvMs, 70);
  assert.equal(latest.restingHr, 48);
  assert.equal(latest.strain, 2);
  assert.ok(latest.recoveryScore > 50);
  assert.ok(latest.sleepPerformance > 80);
});

test('the native return is a real app redirect, not an HTML page', () => {
  assert.equal(
    fitbit.fitbitReturnLocation('com.hybrid.strength', 'status=error&message=connection_failed'),
    'com.hybrid.strength://fitbit?status=error&message=connection_failed',
  );
  assert.equal(
    fitbit.fitbitReturnLocation('com.hybrid.athlete', 'status=connected'),
    'com.hybrid.athlete://fitbit?status=connected',
  );
  const callback = readFileSync(new URL('../fitbit-callback/index.ts', import.meta.url), 'utf8');
  assert.match(callback, /redirect\(fitbitReturnLocation/);
  assert.doesNotMatch(callback, /text\/html/);
});

test('the authorize URL is Google OAuth with PKCE and the three Health scopes', async () => {
  const url = new URL(await fitbit.createFitbitAuthUrl('state-value-with-enough-length', 'verifier-value'));
  assert.equal(url.origin + url.pathname, 'https://accounts.google.com/o/oauth2/v2/auth');
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(url.searchParams.get('access_type'), 'offline');
  assert.equal(url.searchParams.get('prompt'), 'consent');
  assert.equal(url.searchParams.get('redirect_uri'), 'https://orysjncrksmdfabpuftd.supabase.co/functions/v1/fitbit-callback');
  const scope = url.searchParams.get('scope');
  assert.match(scope, /googlehealth\.health_metrics_and_measurements\.readonly/);
  assert.match(scope, /googlehealth\.sleep\.readonly/);
  assert.match(scope, /googlehealth\.activity_and_fitness\.readonly/);
  assert.equal(url.searchParams.get('code_challenge'), await fitbit.codeChallenge('verifier-value'));
});
