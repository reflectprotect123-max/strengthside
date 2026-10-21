import { ownerFromRequest } from '../_shared/auth.ts';
import { json, methodGuard, preflight } from '../_shared/http.ts';
import { loadToken, removeToken } from '../_shared/oauth.ts';
import { fitbitErrorResponse, revokeFitbitToken } from '../_shared/fitbit.ts';

Deno.serve(async (req) => {
  const early = preflight(req) || methodGuard(req, ['POST']);
  if (early) return early;
  try {
    const { owner } = await ownerFromRequest(req);
    const token = await loadToken('fitbit', owner);
    if (token) {
      try { await revokeFitbitToken(token); } catch { /* local disconnect still proceeds */ }
    }
    await removeToken('fitbit', owner);
    return json({ ok: true, provider: 'fitbit' });
  } catch (error) {
    const response = fitbitErrorResponse(error, 'disconnect_failed');
    return json(response.body, response.status);
  }
});
