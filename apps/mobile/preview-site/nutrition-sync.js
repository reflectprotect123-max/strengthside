/**
 * Nutrition cloud sync for the Hybrid HTML athlete app.
 *
 * Writes the athlete's NutritionDB slice to athlete_domain_snapshots (domain
 * nutrition) via upsert_athlete_domain_snapshot — same contract as THE-HYBRID-ENGINE1.
 *
 * Requires Supabase auth (shared session with WHOOP / Concept2).
 * LocalStorage remains the offline source of truth; cloud is merged on pull
 * and pushed after local saves when signed in.
 */
(function (global) {
  const WRITER = 'html-athlete-nutrition';
  const DOMAIN = 'nutrition';
  const BASE_KEY = 'hybrid-nutrition-sync-base-v1';

  function core() {
    return global.HybridNutrition && global.HybridNutrition.Core;
  }

  function client() {
    if (global.Whoop && typeof global.Whoop.client === 'function') return global.Whoop.client();
    throw new Error('Supabase client unavailable — sign in first.');
  }

  async function sessionUserId() {
    const { data, error } = await client().auth.getSession();
    if (error) throw error;
    return (data.session && data.session.user && data.session.user.id) || null;
  }

  async function isSignedIn() {
    return !!(await sessionUserId());
  }

  function fp(db) {
    return JSON.stringify(db);
  }

  function emptyDb() {
    const C = core();
    return C ? C.emptyNutritionDB() : { schemaVersion: 1, logEntries: [] };
  }

  function loadBase() {
    try {
      const raw = localStorage.getItem(BASE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function saveBase(base) {
    try {
      if (base) localStorage.setItem(BASE_KEY, JSON.stringify(base));
      else localStorage.removeItem(BASE_KEY);
    } catch (_) {}
  }

  /** @returns {Promise<{revision:number,writer:string,updatedAt:number,snapshot:unknown}|null>} */
  async function pullRemote() {
    const uid = await sessionUserId();
    if (!uid) return null;
    const { data, error } = await client()
      .from('athlete_domain_snapshots')
      .select('schema_version,revision,writer,snapshot,client_updated_at')
      .eq('user_id', uid)
      .eq('domain', DOMAIN)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      schemaVersion: data.schema_version || 1,
      revision: Math.max(0, Number(data.revision) || 0),
      writer: data.writer || 'server',
      updatedAt: data.client_updated_at ? Date.parse(data.client_updated_at) : Date.now(),
      snapshot: data.snapshot,
    };
  }

  /**
   * Push local nutrition DB to Supabase.
   * @returns {Promise<{ok:boolean, reason?:string, revision?:number}>}
   */
  async function pushNutrition(localDb) {
    const C = core();
    if (!C) throw new Error('Nutrition core missing');
    const uid = await sessionUserId();
    if (!uid) return { ok: false, reason: 'auth_required' };

    const base = loadBase();
    const prevRev = base && Number.isFinite(base.revision) ? base.revision : 0;
    const sameAsLastPush = base && base.localFp === fp(localDb);
    const revision = sameAsLastPush ? prevRev : prevRev + 1;
    const now = Date.now();

    const { data: wrote, error } = await client().rpc('upsert_athlete_domain_snapshot', {
      p_domain: DOMAIN,
      p_schema_version: localDb.schemaVersion || C.NUTRITION_SCHEMA_VERSION || 1,
      p_revision: revision,
      p_writer: WRITER,
      p_client_updated_at: new Date(now).toISOString(),
      p_snapshot: localDb,
    });
    if (error) throw error;
    if (wrote === false) return { ok: false, reason: 'stale_revision' };

    saveBase({ revision, updatedAt: now, localFp: fp(localDb) });
    return { ok: true, revision };
  }

  /**
   * Merge remote nutrition slice into local DB when signed in.
   * Falls back to local-only on auth/network errors.
   */
  async function reconcile(localDb) {
    const C = core();
    if (!C || !(await isSignedIn())) return localDb;
    let remote;
    try {
      remote = await pullRemote();
    } catch (_) {
      return localDb;
    }
    if (!remote || remote.snapshot == null) {
      if (fp(localDb) !== fp(emptyDb())) {
        try {
          await pushNutrition(localDb);
        } catch (_) {}
      }
      return localDb;
    }
    let remoteDb;
    try {
      remoteDb = C.sanitizeNutritionDB(remote.snapshot);
    } catch (_) {
      return localDb;
    }
    try {
      const merged = C.mergeNutrition(localDb, remoteDb);
      saveBase({ revision: remote.revision, updatedAt: remote.updatedAt, localFp: fp(merged) });
      return merged;
    } catch (_) {
      return localDb;
    }
  }

  let pushTimer = null;
  function schedulePush(localDb) {
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
      pushNutrition(localDb).catch(() => {});
    }, 800);
  }

  global.NutritionSync = {
    WRITER,
    DOMAIN,
    isSignedIn,
    pullRemote,
    pushNutrition,
    reconcile,
    schedulePush,
  };
})(typeof window !== 'undefined' ? window : globalThis);
