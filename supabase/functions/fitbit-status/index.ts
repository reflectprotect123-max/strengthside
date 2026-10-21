import { ownerFromRequest } from '../_shared/auth.ts';
import { json, methodGuard, preflight } from '../_shared/http.ts';
import { loadData, loadToken } from '../_shared/oauth.ts';

Deno.serve(async (req) => {
  const early = preflight(req) || methodGuard(req, ['GET']);
  if (early) return early;
  try {
    const { owner } = await ownerFromRequest(req);
    const [token, data] = await Promise.all([loadToken('fitbit', owner), loadData('fitbit', owner)]);
    return json({
      fitbit: {
        connected: !!token && data?.reconnectRequired !== true,
        reconnect: data?.reconnectRequired === true,
        lastSyncAt: data?.syncedAt || null,
        sampleDate: data?.normalized?.date || null,
        normalized: data?.normalized || null,
      },
    });
  } catch (error) {
    return json({ error: 'status_failed' }, (error as Error & { status?: number }).status || 500);
  }
});
