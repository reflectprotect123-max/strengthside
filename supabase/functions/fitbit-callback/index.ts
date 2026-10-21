import { nativeAppId, publicOrigin } from '../_shared/auth.ts';
import { methodGuard, preflight, redirect } from '../_shared/http.ts';
import { consumePending, recordOAuthEvent, saveToken, syncRecord } from '../_shared/oauth.ts';
import { exchangeFitbitCode, fitbitReturnLocation, googleSubject } from '../_shared/fitbit.ts';

function allowedOutcome(outcome: string) {
  return /^[a-z0-9_=&-]+$/i.test(outcome) ? outcome : 'status=error';
}

function finish(kind: string, product: 'engine' | 'strength', outcome: string, requestedAppId?: string) {
  const q = allowedOutcome(outcome);
  if (kind === 'native') {
    return redirect(fitbitReturnLocation(nativeAppId(product, requestedAppId), q), { 'cache-control': 'no-store' });
  }
  return redirect(`${publicOrigin(product)}/?integration=fitbit&${q}`, { 'cache-control': 'no-store' });
}

Deno.serve(async (req) => {
  const options = preflight(req);
  if (options) return options;
  const denied = methodGuard(req, ['GET']);
  if (denied) return denied;
  let kind = 'browser';
  let product: 'engine' | 'strength' = 'engine';
  let requestedAppId: string | undefined;
  try {
    const q = new URL(req.url).searchParams;
    const state = (q.get('state') || '').trim();
    const pending = await consumePending('fitbit', state);
    if (!pending?.codeVerifier) {
      await recordOAuthEvent('fitbit', { stage: 'callback', ok: false, error: 'invalid_oauth_state', hasState: !!state });
      return finish('browser', 'engine', 'status=error&message=invalid_oauth_state');
    }
    kind = pending.kind;
    requestedAppId = pending.appId;
    product = pending.product === 'strength' ? 'strength' : 'engine';
    if (q.get('error')) {
      await recordOAuthEvent('fitbit', { stage: 'callback', ok: false, error: 'denied', kind, product });
      return finish(kind, product, 'status=denied', requestedAppId);
    }
    const code = (q.get('code') || '').trim();
    if (!code) {
      await recordOAuthEvent('fitbit', { stage: 'callback', ok: false, error: 'invalid_oauth_response', kind, product });
      return finish(kind, product, 'status=error&message=invalid_oauth_response', requestedAppId);
    }
    const token = await exchangeFitbitCode(code, pending.codeVerifier);
    const providerUserId = (await googleSubject(token.access_token)) || pending.owner;
    await saveToken('fitbit', pending.owner, token, providerUserId);
    await syncRecord('fitbit', pending.owner, { provider: 'fitbit', connectedAt: new Date().toISOString(), providerUserId, reconnectRequired: false });
    await recordOAuthEvent('fitbit', { stage: 'callback', ok: true, error: null, kind, product });
    return finish(kind, product, 'status=connected', requestedAppId);
  } catch (error) {
    const code = (error as { code?: string })?.code;
    const safe = code && /^[a-z0-9_]+$/i.test(code) ? code : 'connection_failed';
    console.error('[fitbit-callback]', safe);
    await recordOAuthEvent('fitbit', { stage: 'callback', ok: false, error: safe, kind, product });
    return finish(kind, product, `status=error&message=${safe}`, requestedAppId);
  }
});
