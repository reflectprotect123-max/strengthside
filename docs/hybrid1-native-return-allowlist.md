# Hybrid1 native OAuth return allowlist

Live WHOOP/Concept2 still run on **`thehybridengine1.netlify.app`**. Those handlers were deleted from `THE-HYBRID-ENGINE1` git in `85e6996` (schema stub). This repo must not reintroduce real handlers (`pnpm run check:whoop-ownership`).

## What live code does today

Recovered from `85e6996^`:

- `NATIVE_RETURN_URL = 'hybridengine://whoop'` is a **fixed constant**. Comment in `_lib/config.mjs`: never taken from the request (open-redirect with an authorization code in flight).
- `whoop-connect?client=native` returns JSON `{ authorizeUrl, returnUrl }` after a verified Supabase user. `returnUrl` is that constant.
- `savePending` stores `{ owner, kind, sid, createdAt }` — **not** a redirect URL. `whoop-callback` / `concept2-callback` read `pending.kind` and then use the same global constant.
- Concept2 native finish is `${NATIVE_RETURN_URL}?integration=concept2&${outcome}` (same scheme as WHOOP).

Mixed APK therefore registers **both** `com.hybrid.athlete` and `hybridengine`. Product APKs register only their own `applicationId`.

## What to change on hybrid1 Netlify (cannot deploy from this agent)

Canonical mapping lives in `scripts/hybrid1-native-return-allowlist.mjs` (tested). Apply the same function on hybrid1:

1. Import `nativeReturnUrlForAppId` / `sealNativeReturnUrl` (or paste them into `_lib/config.mjs`).
2. `whoop-connect` / `concept2-connect` native path: `const returnUrl = nativeReturnUrlForAppId(event.queryStringParameters?.appId)`.
3. `savePending(..., { ...identity, returnUrl })` — persist the **allowlisted** URL on the pending record.
4. Callbacks: `const returnUrl = sealNativeReturnUrl(pending.returnUrl)` then `result(\`${returnUrl}?${outcome}\`)` (Concept2 keeps `?integration=concept2&`).
5. Do **not** read `returnUrl` / `redirect_uri` from the query string or WHOOP callback params.

Athlete sites already forward `appId` (`com.hybrid.athlete` | `com.hybrid.strength` | `com.hybrid.engine`) on native connect; `_hybrid-proxy.mjs` copies query string to hybrid1.

Until this ships on hybrid1, product APKs will still land on `hybridengine://whoop` unless a pending record is updated. Mixed keeps the `hybridengine` intent-filter so live OAuth does not break.

## Netlify slug note (nutrition-style, with a collision)

Nutrition uses `hybrid-nutrition.netlify.app`. Strength uses `hybrid-strength.netlify.app` (404 / claimable). **`hybrid-engine.netlify.app` is an unrelated live site** (HTTP 200). Engine must use **`hybrid-engine-athlete.netlify.app`**.
