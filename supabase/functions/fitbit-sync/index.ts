import { ownerFromRequest } from '../_shared/auth.ts';
import { json, methodGuard, preflight } from '../_shared/http.ts';
import { loadToken, removeToken, saveToken, setReconnect, syncRecord } from '../_shared/oauth.ts';
import { fetchFitbitSnapshot, fitbitErrorResponse, isFitbitReconnect, mergeFitbitToken, refreshFitbitToken, SCORE_VERSION, tokenNeedsRefresh } from '../_shared/fitbit.ts';

async function refreshed(owner: string, current: any) {
  const next = mergeFitbitToken(current, await refreshFitbitToken(current.refresh_token));
  await saveToken('fitbit', owner, next);
  return next;
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
      dailyMetrics: saved.dailyMetrics,
      dailyRecovery: saved.dailyRecovery,
      dailyStrain: saved.dailyStrain,
      historyTruncated: snapshot.historyTruncated,
      modelVersion: SCORE_VERSION,
      syncedAt: snapshot.syncedAt,
    });
  } catch (error) {
    if (isFitbitReconnect(error)) {
      try { await markReconnect(owner); } catch { /* status still tells the athlete to reconnect */ }
    }
    const response = fitbitErrorResponse(error, 'sync_failed');
    return json(response.body, response.status);
  }
});
