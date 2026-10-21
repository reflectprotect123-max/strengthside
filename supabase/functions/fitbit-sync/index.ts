import { ownerFromRequest } from '../_shared/auth.ts';
import { json, methodGuard, preflight } from '../_shared/http.ts';
import { loadToken, removeToken, saveToken, setReconnect, syncRecord } from '../_shared/oauth.ts';
import { fetchFitbitSnapshot, fitbitErrorResponse, isFitbitReconnect, mergeFitbitToken, refreshFitbitToken, SCORE_VERSION, tokenNeedsRefresh } from '../_shared/fitbit.ts';

async function tokenSavedByAnotherSync(owner: string, current: any) {
  try {
    const latest = await loadToken('fitbit', owner) as any;
    return latest?.access_token && latest.access_token !== current?.access_token ? latest : null;
  } catch {
    return null;
  }
}

async function refreshed(owner: string, current: any) {
  const already = await tokenSavedByAnotherSync(owner, current);
  if (already && !tokenNeedsRefresh(already)) return already;
  try {
    const next = mergeFitbitToken(current, await refreshFitbitToken(current.refresh_token));
    await saveToken('fitbit', owner, next);
    return next;
  } catch (error) {
    const saved = await tokenSavedByAnotherSync(owner, current);
    if (saved && !tokenNeedsRefresh(saved)) return saved;
    if (isFitbitReconnect(error)) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const later = await tokenSavedByAnotherSync(owner, current);
      if (later && !tokenNeedsRefresh(later)) return later;
    }
    throw error;
  }
}

async function markReconnect(owner: string) {
  await removeToken('fitbit', owner);
  await setReconnect('fitbit', owner);
}

Deno.serve(async (req) => {
  const options = preflight(req);
  if (options) return options;
  const denied = methodGuard(req, ['GET']);
  if (denied) return denied;
  let owner: string;
  try {
    ({ owner } = await ownerFromRequest(req));
  } catch {
    return json({ error: 'unauthorized' }, 401);
  }
  try {
    let token = await loadToken('fitbit', owner) as any;
    if (!token) return json({ connected: false, error: 'reconnect_fitbit' }, 401);
    if (tokenNeedsRefresh(token)) {
      if (!token.refresh_token) {
        await markReconnect(owner);
        return json({ connected: false, error: 'reconnect_fitbit' }, 401);
      }
      token = await refreshed(owner, token);
    }
    const days = new URL(req.url).searchParams.get('history') === 'all' ? 100 : 14;
    let snapshot;
    try {
      snapshot = await fetchFitbitSnapshot(token.access_token, { historyDays: days });
    } catch (error) {
      if ((error as { status?: number }).status === 401 && token.refresh_token) {
        token = await refreshed(owner, token);
        snapshot = await fetchFitbitSnapshot(token.access_token, { historyDays: days });
      } else throw error;
    }
    const saved = await syncRecord('fitbit', owner, { ...snapshot, reconnectRequired: false, provider: 'fitbit' });
    return json({
      connected: true,
      provider: 'fitbit',
      normalized: snapshot.normalized,
      dailyMetrics: snapshot.dailyMetrics,
      dailyRecovery: snapshot.dailyRecovery,
      dailyStrain: snapshot.dailyStrain,
      warnings: snapshot.warnings || [],
      seriesCounts: snapshot.seriesCounts || {},
      historyTruncated: snapshot.historyTruncated,
      modelVersion: SCORE_VERSION,
      syncedAt: snapshot.syncedAt,
      storedDays: Array.isArray(saved.dailyMetrics) ? saved.dailyMetrics.length : 0,
    });
  } catch (error) {
    if (isFitbitReconnect(error)) {
      try { await markReconnect(owner); } catch { /* status still tells the athlete to reconnect */ }
    }
    const response = fitbitErrorResponse(error, 'sync_failed');
    const failures = Array.isArray((error as { failures?: unknown[] })?.failures)
      ? (error as { failures: unknown[] }).failures.filter((item): item is string => typeof item === 'string' && /^[a-z0-9_:-]+$/i.test(item)).slice(0, 12)
      : [];
    const body: { error: string; connected?: boolean; failures?: string[] } = response.body;
    if (failures.length) body.failures = failures;
    console.error('[fitbit-sync]', failures.join(',') || (error as { code?: string })?.code || 'sync_failed');
    return json(body, response.status);
  }
});
