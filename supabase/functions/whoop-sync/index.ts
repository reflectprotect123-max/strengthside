import { fetchPersonalSteps } from '../_shared/whoop-steps.ts';
import { ownerFromRequest } from '../_shared/auth.ts';
import { json, methodGuard, preflight } from '../_shared/http.ts';
import { loadToken, saveToken, syncRecord } from '../_shared/oauth.ts';
import { fetchWhoopSnapshot, isWhoopUnauthorized, mergeWhoopToken, refreshWhoopToken, tokenNeedsRefresh, whoopErrorResponse } from '../_shared/whoop.ts';

async function tokenSavedByAnotherSync(owner: string, currentToken: any) {
  try {
    const latest = await loadToken('whoop', owner) as any;
    return latest?.access_token && latest.access_token !== currentToken?.access_token ? latest : null;
  } catch {
    return null;
  }
}

async function refreshWithoutDiscardingRotation(owner: string, currentToken: any) {
  const alreadyRefreshed = await tokenSavedByAnotherSync(owner, currentToken);
  if (alreadyRefreshed && !tokenNeedsRefresh(alreadyRefreshed)) return alreadyRefreshed;
  try {
    const refreshed = await refreshWhoopToken(currentToken.refresh_token);
    const nextToken = mergeWhoopToken(currentToken, refreshed);
    await saveToken('whoop', owner, nextToken);
    return nextToken;
  } catch (error) {
    const savedByAnotherSync = await tokenSavedByAnotherSync(owner, currentToken);
    if (savedByAnotherSync) return savedByAnotherSync;
    throw error;
  }
}

async function fetchSnapshotForOwner(owner: string, initialToken: any, historyDays: number, allHistory = false) {
  let token = initialToken;
  if (tokenNeedsRefresh(token) && token.refresh_token) token = await refreshWithoutDiscardingRotation(owner, token);
  try {
    return { token, snapshot: await fetchWhoopSnapshot(token.access_token, { historyDays, allHistory }) };
  } catch (error) {
    if (!isWhoopUnauthorized(error) || !token.refresh_token) throw error;
    token = await refreshWithoutDiscardingRotation(owner, token);
    return { token, snapshot: await fetchWhoopSnapshot(token.access_token, { historyDays, allHistory }) };
  }
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
    const token = await loadToken('whoop', owner);
    if (!token) return json({ connected: false }, 401);
    const params = new URL(req.url).searchParams;
    const backfill = params.get('backfill') === '1';
    const allHistory = params.get('history') === 'all';
    const historyDays = backfill ? 100 : 10;
    const { snapshot, token: activeToken } = await fetchSnapshotForOwner(owner, token, historyDays, allHistory);
    // Optional steps never replace or prevent the official physiological sync.
    let endDate=new Date().toISOString().slice(0,10);
    try{endDate=new Intl.DateTimeFormat('en-CA',{timeZone:Deno.env.get('WHOOP_STEPS_TIMEZONE')||'UTC',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}catch{/* Invalid optional timezone must not break official sync. */}
    const steps = await fetchPersonalSteps(owner, endDate, activeToken.access_token);
    const byDate = new Map<string, any>(snapshot.dailyMetrics.map((r: any) => [r.date, r]));
    for(const row of steps.rows) {
      const prior=byDate.get(row.date)||{};
      byDate.set(row.date,{...prior,...row,sources:{...prior.sources,...row.sources}});
    }
    snapshot.dailyMetrics=[...byDate.values()].sort((a,b)=>a.date.localeCompare(b.date));
    const saved = await syncRecord('whoop', owner, snapshot);
    return json({
      connected: true,
      provider: 'whoop',
      normalized: snapshot.normalized,
      dailyStrain: snapshot.dailyStrain,
      dailyRecovery: saved.dailyRecovery,
      dailyMetrics: saved.dailyMetrics,
      historyTruncated: snapshot.historyTruncated,
      modelVersion: 'whoop-history-v2',
      stepsStatus: steps.status,
      syncedAt: snapshot.syncedAt,
    });
  } catch (error) {
    const response = whoopErrorResponse(error, 'sync_failed');
    return json(response.body, response.status);
  }
});
