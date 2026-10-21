import { nativeAppId, ownerFromRequest, publicOrigin } from '../_shared/auth.ts';
import { json, methodGuard, preflight, redirect } from '../_shared/http.ts';
import { newState, recordOAuthEvent, savePending } from '../_shared/oauth.ts';
import { createFitbitAuthUrl, FITBIT_STATE_LENGTH, FitbitError, newVerifier } from '../_shared/fitbit.ts';

Deno.serve(async (req) => {
  const options = preflight(req);
  if (options) return options;
  const denied = methodGuard(req, ['GET']);
  if (denied) return denied;
  const url = new URL(req.url);
  const native = url.searchParams.get('client') === 'native';
  const product = (url.searchParams.get('product') === 'strength' ? 'strength' : 'engine') as 'engine' | 'strength';
  try {
    const identity = await ownerFromRequest(req);
    const state = newState(FITBIT_STATE_LENGTH);
    const verifier = newVerifier();
    const location = await createFitbitAuthUrl(state, verifier);
    await savePending('fitbit', state, {
      owner: identity.owner,
      kind: native ? 'native' : 'browser',
      sid: native ? null : 'web',
      product: identity.product,
      appId: nativeAppId(identity.product, url.searchParams.get('appId') || undefined),
      codeVerifier: verifier,
    });
    await recordOAuthEvent('fitbit', { stage: 'connect', ok: true, native, product: identity.product, error: null });
    if (native) {
      const appId = nativeAppId(identity.product, url.searchParams.get('appId') || undefined);
      return json({ authorizeUrl: location, returnUrl: `${appId}://fitbit` }, 200, { 'cache-control': 'no-store' });
    }
    return redirect(location, { 'cache-control': 'no-store' });
  } catch (error) {
    console.error('[fitbit-connect]', (error as Error)?.message || error);
    const status = (error as FitbitError)?.code === 'configuration_error' ? 500 : ((error as { status?: number }).status || 500);
    if (native) return json({ error: status === 401 ? 'unauthorized' : 'connection_unavailable' }, status, { 'cache-control': 'no-store' });
    return redirect(`${publicOrigin(product)}/?integration=fitbit&status=error&message=connection_unavailable`, { 'cache-control': 'no-store' });
  }
});
