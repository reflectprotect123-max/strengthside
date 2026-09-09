/**
 * Hybrid1 WHOOP/Concept2 native return mapping.
 *
 * Recovered from THE-HYBRID-ENGINE1 @ 85e6996^ (pre-gut). Live Netlify still
 * runs those functions; git is a schema stub and cannot be the deploy path.
 *
 * The return URL is chosen from this allowlist and stored on the pending OAuth
 * record. It is never taken from the request (open-redirect with an auth code).
 *
 * Paste nativeReturnUrlForAppId into hybrid1 `_lib/config.mjs` + connect/callback.
 * See docs/hybrid1-native-return-allowlist.md.
 */

export const DEFAULT_NATIVE_RETURN_URL = 'hybridengine://whoop';

/** applicationId → native return URL (path is always /whoop; Concept2 adds query). */
export const NATIVE_RETURN_BY_APP_ID = Object.freeze({
  'com.hybrid.athlete': 'com.hybrid.athlete://whoop',
  'com.hybrid.strength': 'com.hybrid.strength://whoop',
  'com.hybrid.engine': 'com.hybrid.engine://whoop',
});

/**
 * @param {unknown} appId query `appId` from native connect
 * @returns {string} allowlisted `scheme://whoop` — never a caller-supplied URL
 */
export function nativeReturnUrlForAppId(appId) {
  const id = typeof appId === 'string' ? appId.trim() : '';
  if (Object.prototype.hasOwnProperty.call(NATIVE_RETURN_BY_APP_ID, id)) {
    return NATIVE_RETURN_BY_APP_ID[id];
  }
  return DEFAULT_NATIVE_RETURN_URL;
}

/**
 * Reject any value that is not already on the allowlist (or the live default).
 * Use this if a pending record is ever hydrated from storage.
 */
export function sealNativeReturnUrl(candidate) {
  const url = typeof candidate === 'string' ? candidate.trim() : '';
  const allowed = new Set([
    DEFAULT_NATIVE_RETURN_URL,
    ...Object.values(NATIVE_RETURN_BY_APP_ID),
  ]);
  return allowed.has(url) ? url : DEFAULT_NATIVE_RETURN_URL;
}
