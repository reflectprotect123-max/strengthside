// Google Health API (Fitbit) client. Scores are STRENGTHSIDE-DESIGNED.
// Official fields: https://developers.google.com/health/reference/rest/v4/users.dataTypes.dataPoints
// Daily HRV, resting HR, SpO2 and sleep temperature are list queries.
// Active zone minutes use dailyRollUp. Sleep and exercise use list.
// There is no recovery or sleep score in the API.

const API = 'https://health.googleapis.com/v4';
const AUTH = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN = 'https://oauth2.googleapis.com/token';
const TOKENINFO = 'https://oauth2.googleapis.com/tokeninfo';
const REVOKE = 'https://oauth2.googleapis.com/revoke';

export const FITBIT_STATE_LENGTH = 32;
export const FITBIT_SCOPES = [
  'https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly',
  'https://www.googleapis.com/auth/googlehealth.sleep.readonly',
  'https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly',
];
export const SCORE_VERSION = 'fitbit-scores-v1';
const BASELINE_DAYS = 7;

export class FitbitError extends Error {
  status: number;
  code: string;
  kind: string;
  reason: string;
  failures: string[];
  constructor(message: string, { code = 'fitbit_error', kind = 'fitbit', status = 0, reason = '', failures = [] }: { code?: string; kind?: string; status?: number; reason?: string; failures?: string[] } = {}) {
    super(message);
    this.name = 'FitbitError';
    this.code = code;
    this.kind = kind;
    this.status = status;
    this.reason = reason;
    this.failures = failures;
  }
}

function clientId() { return (Deno.env.get('GOOGLE_HEALTH_CLIENT_ID') || '').trim(); }
function clientSecret() { return (Deno.env.get('GOOGLE_HEALTH_CLIENT_SECRET') || '').trim(); }

export function fitbitCallbackUrl() {
  return (Deno.env.get('FITBIT_CALLBACK_URL') || 'https://orysjncrksmdfabpuftd.supabase.co/functions/v1/fitbit-callback').trim();
}

function requireFitbit() {
  if (!clientId() || !clientSecret()) {
    throw new FitbitError('Google Health configuration unavailable', { code: 'configuration_error', kind: 'configuration', status: 500 });
  }
}

function finiteNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '' || typeof value === 'boolean') return null;
  const number = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : null;
  return Number.isFinite(number) ? number : null;
}

function clamp(value: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, value));
}

export function base64Url(bytes: Uint8Array) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function newVerifier() {
  return base64Url(crypto.getRandomValues(new Uint8Array(32)));
}

export async function codeChallenge(verifier: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64Url(new Uint8Array(digest));
}

export async function createFitbitAuthUrl(state: string, verifier: string) {
  requireFitbit();
  if (!state || state.length < 16) throw new FitbitError('Invalid Fitbit OAuth state', { code: 'invalid_state', kind: 'input', status: 400 });
  if (!verifier) throw new FitbitError('PKCE verifier missing', { code: 'invalid_state', kind: 'input', status: 400 });
  const url = new URL(AUTH);
  url.search = new URLSearchParams({
    client_id: clientId(),
    response_type: 'code',
    redirect_uri: fitbitCallbackUrl(),
    scope: FITBIT_SCOPES.join(' '),
    state,
    code_challenge: await codeChallenge(verifier),
    code_challenge_method: 'S256',
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
  }).toString();
  return url.toString();
}

function normalizeTokenResponse(payload: any) {
  if (!payload || typeof payload !== 'object' || typeof payload.access_token !== 'string' || !payload.access_token.trim()) {
    throw new FitbitError('Google token response was invalid', { code: 'invalid_token_response', kind: 'oauth', status: 502 });
  }
  const token = { ...payload, access_token: payload.access_token.trim() };
  const expiresIn = finiteNumber(payload.expires_in);
  if (expiresIn !== null && expiresIn > 0) token.expires_at = Date.now() + expiresIn * 1000;
  return token;
}

async function tokenRequest(body: Record<string, string>) {
  requireFitbit();
  const response = await fetch(TOKEN, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId(), client_secret: clientSecret(), ...body }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const googleError = typeof payload?.error === 'string' && /^[a-z0-9_]+$/i.test(payload.error) ? payload.error : '';
    const grant = googleError === 'invalid_grant';
    throw new FitbitError(grant ? 'Fitbit refresh expired' : 'Google token request failed', {
      code: grant ? 'reconnect_fitbit' : (googleError || 'token_request_failed'),
      kind: 'oauth',
      status: grant ? 401 : response.status || 502,
    });
  }
  return normalizeTokenResponse(payload);
}

export const exchangeFitbitCode = (code: string, verifier: string) =>
  tokenRequest({ grant_type: 'authorization_code', code, code_verifier: verifier, redirect_uri: fitbitCallbackUrl() });

export const refreshFitbitToken = (refreshToken: string) =>
  tokenRequest({ grant_type: 'refresh_token', refresh_token: refreshToken });

export function mergeFitbitToken(previous: any = {}, refreshed: any = {}) {
  const token = { ...previous, ...refreshed };
  if (!refreshed.refresh_token && previous.refresh_token) token.refresh_token = previous.refresh_token;
  if (!refreshed.expires_at && previous.expires_at) token.expires_at = previous.expires_at;
  return token;
}

export function tokenNeedsRefresh(token: any, skewMs = 60 * 1000) {
  if (!token?.access_token) return true;
  const expiresAt = finiteNumber(token.expires_at);
  return expiresAt !== null && Date.now() >= expiresAt - skewMs;
}

export function fitbitReturnLocation(appId: string, outcome: string) {
  const query = /^[a-z0-9_=&-]+$/i.test(outcome) ? outcome : 'status=error';
  const id = appId === 'com.hybrid.athlete' ? 'com.hybrid.athlete' : 'com.hybrid.strength';
  return `${id}://fitbit?${query}`;
}

// Health-only access tokens often have no `sub` on tokeninfo. A missing subject must not fail the connection.
export async function googleSubject(accessToken: string): Promise<string | null> {
  try {
    const response = await fetch(`${TOKENINFO}?access_token=${encodeURIComponent(accessToken)}`);
    if (!response.ok) return null;
    const body = await response.json();
    const sub = typeof body?.sub === 'string' ? body.sub.trim() : '';
    return sub || null;
  } catch {
    return null;
  }
}

export async function revokeFitbitToken(token: any) {
  const value = token?.refresh_token || token?.access_token;
  if (!value) return false;
  const response = await fetch(REVOKE, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token: value }),
  });
  if (!response.ok && response.status !== 400) {
    throw new FitbitError('Google revoke failed', { code: 'revoke_failed', kind: 'oauth', status: response.status });
  }
  return true;
}

function googleReason(body: any) {
  const status = typeof body?.error?.status === 'string' ? body.error.status : '';
  const message = typeof body?.error?.message === 'string' ? body.error.message : '';
  return [status, message].filter(Boolean).join(': ')
    .replace(/ya29\.[A-Za-z0-9_-]+/g, '[token]')
    .replace(/Bearer\s+\S+/gi, 'Bearer [token]')
    .slice(0, 160);
}

async function healthFetch(path: string, accessToken: string, init: RequestInit = {}) {
  const response = await fetch(path.startsWith('http') ? path : `${API}${path}`, {
    ...init,
    signal: init.signal || AbortSignal.timeout(12_000),
    headers: { accept: 'application/json', authorization: `Bearer ${accessToken}`, ...(init.headers || {}) },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new FitbitError('Google Health request failed', { code: 'api_request_failed', kind: 'api', status: response.status, reason: googleReason(body) });
  }
  if (response.status === 204) return null;
  return await response.json();
}

function isoDate(year: number, month: number, day: number) {
  if (!year || !month || !day) return '';
  const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '';
}

export function pointDate(value: any): string {
  if (!value) return '';
  if (typeof value === 'string') return /^(\d{4}-\d{2}-\d{2})/.exec(value)?.[1] || '';
  const date = value.date || value;
  return isoDate(Number(date.year), Number(date.month), Number(date.day));
}

function addDays(date: string, days: number) {
  const next = new Date(`${date}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

function payloadOf(point: any, key: string) {
  return point?.[key] || point?.data?.[key] || null;
}

async function listPoints(dataType: string, accessToken: string, filter: string, pageSize: number) {
  const points: any[] = [];
  let pageToken = '';
  for (let page = 0; page < 20 && points.length < 500; page += 1) {
    const params = new URLSearchParams({ filter, pageSize: String(pageSize) });
    if (pageToken) params.set('pageToken', pageToken);
    const body = await healthFetch(`/users/me/dataTypes/${dataType}/dataPoints?${params}`, accessToken);
    if (Array.isArray(body?.dataPoints)) points.push(...body.dataPoints);
    pageToken = typeof body?.nextPageToken === 'string' ? body.nextPageToken : '';
    if (!pageToken) break;
  }
  return points;
}

function civilRange(start: string, end: string) {
  const part = (date: string) => {
    const [year, month, day] = date.split('-').map(Number);
    return { date: { year, month, day }, time: { hours: 0, minutes: 0, seconds: 0, nanos: 0 } };
  };
  return { start: part(start), end: part(end) };
}

function rollupPoints(body: any) {
  const rows = Array.isArray(body?.rollupDataPoints) ? body.rollupDataPoints
    : Array.isArray(body?.dataPoints) ? body.dataPoints
    : Array.isArray(body?.buckets) ? body.buckets
    : [];
  return rows.map((point: any) => point?.civilStartTime && !point.interval
    ? { ...point, interval: { civilStartTime: point.civilStartTime } }
    : point);
}

async function dailyRollup(dataType: string, accessToken: string, start: string, end: string) {
  const body = await healthFetch(`/users/me/dataTypes/${dataType}/dataPoints:dailyRollUp`, accessToken, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ range: civilRange(start, end), windowSizeDays: 1, dataSourceFamily: 'users/me/dataSourceFamilies/google-wearables' }),
  });
  return rollupPoints(body);
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function robustZ(value: number, baseline: number[]) {
  if (baseline.length < BASELINE_DAYS) return null;
  const center = median(baseline);
  const spread = median(baseline.map((item) => Math.abs(item - center))) || 1;
  return (value - center) / spread;
}

/** Recovery stand-in, 0–100. Needs 7 earlier days of the metric. Higher HRV and lower resting HR raise it. */
export function recoveryScore(today: { hrv?: number | null; rhr?: number | null }, history: { hrv?: number | null; rhr?: number | null }[]) {
  const parts: number[] = [];
  if (today.hrv != null) {
    const z = robustZ(today.hrv, history.map((row) => row.hrv).filter((n): n is number => n != null));
    if (z != null) parts.push(z);
  }
  if (today.rhr != null) {
    const z = robustZ(today.rhr, history.map((row) => row.rhr).filter((n): n is number => n != null));
    if (z != null) parts.push(-z);
  }
  if (!parts.length) return null;
  const mean = parts.reduce((sum, part) => sum + part, 0) / parts.length;
  return clamp(Math.round(50 + 15 * mean), 0, 100);
}

/** Sleep stand-in, 0–100. Eight hours asleep scores 100 on duration. Efficiency is asleep/in-bed. Restorative is deep+REM against a 40% share. */
export function sleepPerformance(input: { minutesAsleep?: number | null; minutesInSleepPeriod?: number | null; deepMinutes?: number | null; remMinutes?: number | null }) {
  const asleep = finiteNumber(input.minutesAsleep);
  if (asleep == null || asleep <= 0) return null;
  const weights: [number, number][] = [[clamp(asleep / 480 * 100, 0, 100), 0.5]];
  const period = finiteNumber(input.minutesInSleepPeriod);
  if (period != null && period > 0) weights.push([clamp(asleep / period * 100, 0, 100), 0.3]);
  const deep = finiteNumber(input.deepMinutes);
  const rem = finiteNumber(input.remMinutes);
  if (deep != null && rem != null) weights.push([clamp(((deep + rem) / asleep) / 0.4 * 100, 0, 100), 0.2]);
  const total = weights.reduce((sum, [, weight]) => sum + weight, 0);
  return clamp(Math.round(weights.reduce((sum, [value, weight]) => sum + value * weight, 0) / total), 0, 100);
}

/** Display mapping into the existing 0–21 strain field. 15 active-zone minutes is 1 strain, capped at 21. */
export function strainFromActiveZoneMinutes(minutes: number | null) {
  if (minutes == null || minutes < 0) return null;
  return Math.round(Math.min(21, minutes / 15) * 10) / 10;
}

function dayMap() {
  return new Map<string, any>();
}

function ensure(days: Map<string, any>, date: string) {
  if (!date) return null;
  const row = days.get(date) || { date, source: 'Fitbit' };
  days.set(date, row);
  return row;
}

function stageMinutes(summary: any, type: string) {
  const row = (summary?.stagesSummary || []).find((stage: any) => stage?.type === type);
  return finiteNumber(row?.minutes);
}

export function buildFitbitDays(input: {
  hrv?: any[];
  resting?: any[];
  spo2?: any[];
  temperature?: any[];
  sleep?: any[];
  zoneMinutes?: any[];
  exercise?: any[];
  heartRate?: any[];
} = {}) {
  const days = dayMap();
  for (const point of input.hrv || []) {
    const body = payloadOf(point, 'dailyHeartRateVariability');
    const row = ensure(days, pointDate(body?.date));
    const hrv = finiteNumber(body?.averageHeartRateVariabilityMilliseconds) ?? finiteNumber(body?.deepSleepRootMeanSquareOfSuccessiveDifferencesMilliseconds);
    if (row && hrv != null) row.hrv = hrv;
  }
  for (const point of input.resting || []) {
    const body = payloadOf(point, 'dailyRestingHeartRate');
    const row = ensure(days, pointDate(body?.date));
    const rhr = finiteNumber(body?.beatsPerMinute);
    if (row && rhr != null) row.rhr = rhr;
  }
  for (const point of input.spo2 || []) {
    const body = payloadOf(point, 'dailyOxygenSaturation');
    const row = ensure(days, pointDate(body?.date));
    const spo2 = finiteNumber(body?.averagePercentage);
    if (row && spo2 != null) row.spo2 = spo2;
  }
  for (const point of input.temperature || []) {
    const body = payloadOf(point, 'dailySleepTemperatureDerivations');
    const row = ensure(days, pointDate(body?.date));
    if (!row) continue;
    const nightly = finiteNumber(body?.nightlyTemperatureCelsius);
    const baseline = finiteNumber(body?.baselineTemperatureCelsius);
    if (nightly != null) row.sleepTemperatureCelsius = nightly;
    if (nightly != null && baseline != null) row.sleepTemperatureDeltaCelsius = Math.round((nightly - baseline) * 100) / 100;
  }
  for (const point of input.sleep || []) {
    const body = payloadOf(point, 'sleep');
    if (!body || body.metadata?.nap === true || body.nap === true) continue;
    const date = pointDate(body.interval?.civilEndTime) || pointDate(body.interval?.endTime);
    const row = ensure(days, date);
    if (!row) continue;
    if (body.metadata?.mainSleep === false && row.sleepPerformance != null) continue;
    const asleep = finiteNumber(body.summary?.minutesAsleep);
    const deep = stageMinutes(body.summary, 'DEEP');
    const rem = stageMinutes(body.summary, 'REM');
    const light = stageMinutes(body.summary, 'LIGHT');
    const awake = stageMinutes(body.summary, 'AWAKE');
    row.sleepMinutes = asleep;
    row.sleep = asleep != null ? asleep / 60 : null;
    row.sleepStages = { deep, light, rem, awake };
    row.sleepPerformance = sleepPerformance({
      minutesAsleep: asleep,
      minutesInSleepPeriod: finiteNumber(body.summary?.minutesInSleepPeriod),
      deepMinutes: deep,
      remMinutes: rem,
    });
  }
  for (const point of input.zoneMinutes || []) {
    const body = payloadOf(point, 'activeZoneMinutes') || point;
    const date = pointDate(body.interval?.civilStartTime) || pointDate(body.date) || pointDate(point.date);
    const row = ensure(days, date);
    const zone = body.activeZoneMinutes;
    const minutes = finiteNumber(zone)
      ?? finiteNumber(zone?.activeZoneMinutes)
      ?? finiteNumber(zone?.total)
      ?? finiteNumber(zone?.sum)
      ?? finiteNumber(zone?.activeZoneMinutesSum)
      ?? finiteNumber(zone?.count);
    if (row && minutes != null) row.activeZoneMinutes = (row.activeZoneMinutes || 0) + minutes;
  }
  for (const point of input.exercise || []) {
    const body = payloadOf(point, 'exercise');
    const date = pointDate(body?.interval?.civilStartTime) || pointDate(body?.interval?.startTime);
    const row = ensure(days, date);
    if (row) row.exerciseCount = (row.exerciseCount || 0) + 1;
  }
  for (const point of input.heartRate || []) {
    const body = payloadOf(point, 'heartRate') || point;
    const date = pointDate(body.sampleTime?.civilTime) || pointDate(body.date) || pointDate(point.date);
    const row = ensure(days, date);
    const bpm = finiteNumber(body.beatsPerMinute) ?? finiteNumber(body.averageBeatsPerMinute);
    if (row && bpm != null && row.heartRateBpm == null) row.heartRateBpm = bpm;
  }
  const rows = [...days.values()].filter((row) => row.hrv != null || row.rhr != null || row.sleepPerformance != null || row.activeZoneMinutes != null).sort((a, b) => a.date.localeCompare(b.date));
  for (const row of rows) {
    const prior = rows.filter((item) => item.date < row.date);
    row.recovery = recoveryScore({ hrv: row.hrv ?? null, rhr: row.rhr ?? null }, prior);
    row.strain = strainFromActiveZoneMinutes(row.activeZoneMinutes ?? null);
  }
  return rows;
}

export function normalizeFitbitDays(rows: any[]) {
  const latest = [...rows].reverse().find((row) => row.hrv != null || row.rhr != null || row.recovery != null) || rows.at(-1) || {};
  const metricDates: Record<string, string> = {};
  const sleep = [...rows].reverse().find((row) => row.sleepPerformance != null);
  const strain = [...rows].reverse().find((row) => row.strain != null);
  if (sleep) metricDates.sleepPerformance = sleep.date;
  if (strain) metricDates.strain = strain.date;
  return {
    source: 'fitbit',
    date: latest.date || '',
    recoveryScore: latest.recovery ?? null,
    sleepPerformance: sleep?.sleepPerformance ?? null,
    hrvMs: latest.hrv ?? null,
    restingHr: latest.rhr ?? null,
    strain: strain?.strain ?? null,
    spo2: latest.spo2 ?? null,
    sleepTemperatureCelsius: latest.sleepTemperatureCelsius ?? null,
    sleepTemperatureDeltaCelsius: latest.sleepTemperatureDeltaCelsius ?? null,
    sleepStages: latest.sleepStages || null,
    activeZoneMinutes: latest.activeZoneMinutes ?? null,
    exerciseCount: latest.exerciseCount ?? null,
    heartRateBpm: latest.heartRateBpm ?? null,
    metricDates,
    modelVersion: SCORE_VERSION,
    capturedAt: new Date().toISOString(),
  };
}

function failureLabel(type: string, error: any) {
  const status = Number(error?.status) || 0;
  const code = typeof error?.code === 'string' && /^[a-z0-9_]+$/i.test(error.code) ? error.code : 'failed';
  return `${type}:${status || code}`;
}

async function readPoints(type: string, primary: () => Promise<any[]>, fallback?: () => Promise<any[]>) {
  try {
    return { type, points: await primary(), error: null as any };
  } catch (error) {
    if ((error as { status?: number })?.status === 401) throw error;
    if (!fallback) return { type, points: [] as any[], error };
    try {
      return { type, points: await fallback(), error: null as any };
    } catch (fallbackError) {
      if ((fallbackError as { status?: number })?.status === 401) throw fallbackError;
      return { type, points: [] as any[], error: fallbackError };
    }
  }
}

export async function fetchFitbitSnapshot(accessToken: string, { historyDays = 10 } = {}) {
  const end = new Date().toISOString().slice(0, 10);
  // Heart-rate rollup accepts at most 14 civil days. A 90-day list window plus the exclusive end is 91 days, over the other rollup cap.
  const listDays = Math.max(1, Math.min(89, historyDays));
  const start = addDays(end, -listDays);
  const exclusive = addDays(end, 1);
  const heartStart = addDays(exclusive, -Math.min(14, listDays + 1));
  const between = (field: string) => `${field} >= "${start}" AND ${field} < "${exclusive}"`;
  const series = await Promise.all([
    readPoints('daily-heart-rate-variability', () => listPoints('daily-heart-rate-variability', accessToken, between('dailyHeartRateVariability.date'), 100)),
    readPoints('daily-resting-heart-rate', () => listPoints('daily-resting-heart-rate', accessToken, between('dailyRestingHeartRate.date'), 100)),
    readPoints('daily-oxygen-saturation', () => listPoints('daily-oxygen-saturation', accessToken, between('dailyOxygenSaturation.date'), 100)),
    readPoints('daily-sleep-temperature-derivations', () => listPoints('daily-sleep-temperature-derivations', accessToken, between('dailySleepTemperatureDerivations.date'), 100)),
    readPoints('sleep', () => listPoints('sleep', accessToken, between('sleep.interval.civil_end_time'), 25)),
    readPoints('active-zone-minutes', () => dailyRollup('active-zone-minutes', accessToken, start, exclusive), () => listPoints('active-zone-minutes', accessToken, between('activeZoneMinutes.interval.civil_start_time'), 100)),
    readPoints('exercise', () => listPoints('exercise', accessToken, between('exercise.interval.civil_start_time'), 25)),
    readPoints('heart-rate', () => dailyRollup('heart-rate', accessToken, heartStart, exclusive)),
  ]);
  const failed = series.filter((item) => item.error);
  if (failed.length === series.length) {
    throw new FitbitError('Google Health request failed', {
      code: 'api_request_failed',
      kind: 'api',
      status: Number(failed.find((item) => item.error?.status)?.error?.status) || 502,
      failures: failed.map((item) => failureLabel(item.type, item.error)),
    });
  }
  const points = Object.fromEntries(series.map((item) => [item.type, item.points]));
  const dailyMetrics = buildFitbitDays({
    hrv: points['daily-heart-rate-variability'],
    resting: points['daily-resting-heart-rate'],
    spo2: points['daily-oxygen-saturation'],
    temperature: points['daily-sleep-temperature-derivations'],
    sleep: points.sleep,
    zoneMinutes: points['active-zone-minutes'],
    exercise: points.exercise,
    heartRate: points['heart-rate'],
  });
  return {
    normalized: normalizeFitbitDays(dailyMetrics),
    dailyMetrics,
    dailyRecovery: dailyMetrics.filter((row) => row.recovery != null).map((row) => ({ date: row.date, recoveryScore: row.recovery })),
    dailyStrain: dailyMetrics.filter((row) => row.strain != null).map((row) => ({ date: row.date, strain: row.strain })),
    warnings: failed.map((item) => failureLabel(item.type, item.error)),
    historyTruncated: false,
    syncedAt: new Date().toISOString(),
  };
}

export function isFitbitReconnect(error: any) {
  return error?.code === 'reconnect_fitbit' || error?.code === 'invalid_grant';
}

export function fitbitErrorResponse(error: any, fallback = 'fitbit_failed') {
  if (error?.code === 'configuration_error') return { status: 500, body: { error: 'configuration_error' } };
  if (isFitbitReconnect(error)) return { status: 401, body: { error: 'reconnect_fitbit', connected: false } };
  if (error?.status === 401) return { status: 401, body: { error: 'reauthorization_required', connected: false } };
  if (error?.status === 429) return { status: 429, body: { error: 'rate_limited' } };
  return { status: 502, body: { error: fallback } };
}
