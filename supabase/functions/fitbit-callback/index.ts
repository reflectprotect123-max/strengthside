import { nativeAppId, publicOrigin } from '../_shared/auth.ts';
import { methodGuard, preflight, redirect } from '../_shared/http.ts';
import { consumePending, recordOAuthEvent, saveToken, syncRecord } from '../_shared/oauth.ts';
import { exchangeFitbitCode, googleSubject } from '../_shared/fitbit.ts';

function allowedOutcome(outcome: string) {
  return /^[a-z0-9_=&-]+$/i.test(outcome) ? outcome : 'status=error';
}

function nativeDonePage(product: 'engine' | 'strength', outcome: string, requestedAppId?: string): Response {
  const q = allowedOutcome(outcome);
  const appId = nativeAppId(product, requestedAppId);
  const deep = `${appId}://fitbit?${q}`;
  const intent = `intent://fitbit?${q}#Intent;scheme=${appId};package=${appId};end`;
  const label = appId === 'com.hybrid.strength' ? 'Hybrid Strength' : 'The Engine';
  const html = `<!doctype html>
<html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${label}</title>
<meta http-equiv="refresh" content="0;url=${deep}">
</head>
<body style="font-family:system-ui,sans-serif;background:#111;color:#eee;padding:28px;line-height:1.5">
<p>Fitbit finished. Returning to ${label}…</p>
<p><a href="${deep}" style="color:#5ec4b4">Open ${label}</a></p>
<p><a href="${intent}" style="color:#5ec4b4">Open ${label} (Android)</a></p>
<p style="opacity:.7">If the app does not open, switch back and tap Sync Fitbit.</p>
<script>location.replace(${JSON.stringify(deep)});</script>
</body></html>`;
  return new Response(html, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
}

function finish(kind: string, product: 'engine' | 'strength', outcome: string, requestedAppId?: string) {
  if (kind === 'native') return nativeDonePage(product, outcome, requestedAppId);
  return redirect(`${publicOrigin(product)}/?integration=fitbit&${allowedOutcome(outcome)}`, { 'cache-control': 'no-store' });
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
    const providerUserId = await googleSubject(token.access_token);
    await saveToken('fitbit', pending.owner, token, providerUserId);
    await syncRecord('fitbit', pending.owner, { provider: 'fitbit', connectedAt: new Date().toISOString(), providerUserId, reconnectRequired: false });
    await recordOAuthEvent('fitbit', { stage: 'callback', ok: true, error: null, kind, product });
    return finish(kind, product, 'status=connected', requestedAppId);
  } catch (error) {
    console.error('[fitbit-callback]', (error as Error)?.message || error);
    await recordOAuthEvent('fitbit', { stage: 'callback', ok: false, error: 'connection_failed', kind, product });
    return finish(kind, product, 'status=error&message=connection_failed', requestedAppId);
  }
});
