/**
 * The Brain owner site — formerly THE-HYBRID-ENGINE1 / hybrid1.
 *
 * GitHub repo target name: reflectprotect123-max/the-brain
 * (rename THE-HYBRID-ENGINE1 → the-brain when org settings allow)
 *
 * Netlify site slug/URL unchanged until OAuth redirect cutover:
 *   thehybridengine1.netlify.app
 */
export const BRAIN_REPO = 'reflectprotect123-max/the-brain';
export const LEGACY_BRAIN_REPO = 'reflectprotect123-max/THE-HYBRID-ENGINE1';

export const BRAIN_OWNER_ORIGIN = 'https://thehybridengine1.netlify.app';
export const BRAIN_OWNER_HOST = 'thehybridengine1.netlify.app';
export const BRAIN_OWNER_NETLIFY_NAME = 'thehybridengine1';

export const ATHLETE_ORIGIN = 'https://thehybridsystem.netlify.app';
export const ATHLETE_NETLIFY_NAME = 'thehybridsystem';

/** Resolve Brain owner site id from Netlify listSites payload. */
export function resolveBrainOwnerSiteId(sites) {
  const rows = Array.isArray(sites) ? sites : [];
  return (
    rows.find((r) => r.name === BRAIN_OWNER_NETLIFY_NAME)?.id ||
    rows.find((r) => new RegExp(BRAIN_OWNER_NETLIFY_NAME, 'i').test(r.ssl_url || r.url || ''))?.id ||
    rows.find((r) => r.name === 'thehybridengine1')?.id ||
    ''
  );
}

/** Resolve athlete site id from Netlify listSites payload. */
export function resolveAthleteSiteId(sites) {
  const rows = Array.isArray(sites) ? sites : [];
  return (
    rows.find((r) => r.name === ATHLETE_NETLIFY_NAME)?.id ||
    rows.find((r) => new RegExp(ATHLETE_NETLIFY_NAME, 'i').test(r.ssl_url || r.url || ''))?.id ||
    ''
  );
}
