/**
 * Nutrition cloud sync for the Hybrid HTML athlete app.
 *
 * Dual write when signed in:
 *  1. Opaque NutritionDB snapshot → athlete_domain_snapshots (domain nutrition)
 *  2. Live log rows → food_log_entries as quick_add (no catalogue FK required)
 *
 * Same auth session as WHOOP / Concept2. LocalStorage stays offline-first.
 */
(function (global) {
  const WRITER = 'html-athlete-nutrition';
  const DOMAIN = 'nutrition';
  const BASE_KEY = 'hybrid-nutrition-sync-base-v1';
  const ID_MAP_KEY = 'hybrid-nutrition-cloud-ids-v1';
  const STATUS_KEY = 'hybrid-nutrition-sync-status-v1';

  const status = {
    lastSyncAt: null,
    lastError: '',
    lastOk: false,
    busy: false,
  };

  // Persist last sync so Account does not flash "never" after every cold start.
  try {
    const raw = localStorage.getItem(STATUS_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && typeof s === 'object') {
        if (s.lastSyncAt) status.lastSyncAt = s.lastSyncAt;
        if (typeof s.lastError === 'string') status.lastError = s.lastError;
        if (typeof s.lastOk === 'boolean') status.lastOk = s.lastOk;
      }
    }
  } catch (_) {}

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
    try {
      return !!(await sessionUserId());
    } catch {
      return false;
    }
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

  function loadIdMap() {
    try {
      return JSON.parse(localStorage.getItem(ID_MAP_KEY) || '{}') || {};
    } catch {
      return {};
    }
  }

  function saveIdMap(map) {
    try {
      localStorage.setItem(ID_MAP_KEY, JSON.stringify(map));
    } catch (_) {}
  }

  function toUuid(localId) {
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(localId || ''))) {
      return String(localId);
    }
    const map = loadIdMap();
    if (map[localId]) return map[localId];
    const uuid =
      (global.crypto && typeof global.crypto.randomUUID === 'function' && global.crypto.randomUUID()) ||
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    map[localId] = uuid;
    saveIdMap(map);
    return uuid;
  }

  function setStatus(patch) {
    Object.assign(status, patch || {});
    try {
      localStorage.setItem(
        STATUS_KEY,
        JSON.stringify({
          lastSyncAt: status.lastSyncAt,
          lastError: status.lastError,
          lastOk: status.lastOk,
        }),
      );
    } catch (_) {}
  }

  function getStatus() {
    return { ...status };
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
   * Look up a product barcode in the shared Supabase foods catalogue.
   * @returns {Promise<object|null>}
   */
  async function lookupBarcodeCloud(code) {
    const bc = String(code || '').replace(/\D/g, '');
    if (!bc || bc.length < 8) return null;
    if (!(await isSignedIn())) return null;
    const { data, error } = await client()
      .from('foods')
      .select(
        'id,name,brand,barcode,serving_qty,serving_unit,calories,protein_g,carbs_g,fat_g,nutrition_basis_qty,nutrition_basis_unit,serving_size_text,source,external_id,nutrients',
      )
      .eq('barcode', bc)
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    const food = {
      id: 'sb-' + data.id,
      name: data.name,
      brand: data.brand || null,
      barcode: data.barcode || bc,
      servingQty: Number(data.serving_qty) || 100,
      servingUnit: data.serving_unit || 'g',
      calories: Number(data.calories) || 0,
      proteinG: Number(data.protein_g) || 0,
      carbsG: Number(data.carbs_g) || 0,
      fatG: Number(data.fat_g) || 0,
      nutritionBasisQty: Number(data.nutrition_basis_qty) || 100,
      nutritionBasisUnit: data.nutrition_basis_unit || 'g',
      servingSizeText: data.serving_size_text || null,
      source: data.source || 'supabase',
      externalId: data.external_id || data.id,
      nutrients: data.nutrients || {},
      servings: [],
      cachedAt: new Date().toISOString(),
      supabaseFoodId: data.id,
    };
    // Prefer explicit serving→g from serving_size_text when present.
    if (global.HybridNutrition && HybridNutrition.Core && HybridNutrition.Core.enrichFoodServings) {
      const enriched = HybridNutrition.Core.enrichFoodServings(food);
      Object.assign(food, { servings: enriched.servings });
    }
    if (global.FoodCatalogAU && FoodCatalogAU.rememberLive) FoodCatalogAU.rememberLive(food);
    return food;
  }

  function entryToRow(entry, userId) {
    const live = !entry.deletedAt;
    return {
      id: toUuid(entry.id),
      user_id: userId,
      log_date: entry.logDate,
      meal: entry.meal || 'other',
      entry_kind: 'quick_add',
      food_id: null,
      custom_food_id: null,
      recipe_id: null,
      quantity: Number(entry.quantity) > 0 ? Number(entry.quantity) : 1,
      unit: entry.unit || 'serving',
      calories: Number(entry.calories) || 0,
      protein_g: Number(entry.proteinG) || 0,
      carbs_g: Number(entry.carbsG) || 0,
      fat_g: Number(entry.fatG) || 0,
      nutrients: entry.nutrients || {},
      display_name: entry.displayName || 'Food',
      source_snapshot: {
        ...(entry.sourceSnapshot || {}),
        local_id: entry.id,
        entry_kind_local: entry.entryKind || 'food',
        synced_by: WRITER,
      },
      notes: entry.notes || null,
      updated_at: entry.updatedAt || new Date().toISOString(),
      deleted_at: live ? null : entry.deletedAt || new Date().toISOString(),
    };
  }

  async function mirrorLogEntries(localDb) {
    const uid = await sessionUserId();
    if (!uid) return;
    const entries = Array.isArray(localDb.logEntries) ? localDb.logEntries : [];
    if (!entries.length) return;
    const rows = entries.map((e) => entryToRow(e, uid));
    // Upsert in chunks — PostgREST payload limits.
    for (let i = 0; i < rows.length; i += 50) {
      const chunk = rows.slice(i, i + 50);
      const { error } = await client().from('food_log_entries').upsert(chunk, { onConflict: 'id' });
      if (error) throw error;
    }
  }

  async function pushSnapshot(localDb, revision) {
    const C = core();
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
    return { wrote: wrote !== false, revision, now };
  }

  /**
   * Push local nutrition DB to Supabase (snapshot + relational log rows).
   * @returns {Promise<{ok:boolean, reason?:string, revision?:number}>}
   */
  async function pushNutrition(localDb) {
    const C = core();
    if (!C) throw new Error('Nutrition core missing');
    const uid = await sessionUserId();
    if (!uid) return { ok: false, reason: 'auth_required' };

    setStatus({ busy: true, lastError: '' });
    try {
      const base = loadBase();
      let prevRev = base && Number.isFinite(base.revision) ? base.revision : 0;
      const sameAsLastPush = base && base.localFp === fp(localDb);
      let revision = sameAsLastPush ? prevRev : prevRev + 1;

      let result = await pushSnapshot(localDb, revision);
      if (!result.wrote) {
        // Stale — another device ahead. Refresh base and retry once.
        const remote = await pullRemote();
        if (remote) {
          prevRev = remote.revision;
          revision = prevRev + 1;
          result = await pushSnapshot(localDb, revision);
        }
      }
      if (!result.wrote) {
        setStatus({ busy: false, lastOk: false, lastError: 'stale_revision' });
        return { ok: false, reason: 'stale_revision' };
      }

      await mirrorLogEntries(localDb);
      saveBase({ revision: result.revision, updatedAt: result.now, localFp: fp(localDb) });
      setStatus({ busy: false, lastOk: true, lastSyncAt: new Date().toISOString(), lastError: '' });
      return { ok: true, revision: result.revision };
    } catch (e) {
      setStatus({ busy: false, lastOk: false, lastError: (e && e.message) || 'sync failed' });
      throw e;
    }
  }

  /**
   * Merge remote nutrition slice into local DB when signed in.
   */
  async function reconcile(localDb) {
    const C = core();
    if (!C || !(await isSignedIn())) return localDb;
    setStatus({ busy: true });
    let remote;
    try {
      remote = await pullRemote();
    } catch (e) {
      setStatus({ busy: false, lastError: (e && e.message) || 'pull failed' });
      return localDb;
    }
    if (!remote || remote.snapshot == null) {
      if (fp(localDb) !== fp(emptyDb())) {
        try {
          await pushNutrition(localDb);
        } catch (_) {}
      } else {
        setStatus({ busy: false });
      }
      return localDb;
    }
    let remoteDb;
    try {
      remoteDb = C.sanitizeNutritionDB(remote.snapshot);
    } catch (_) {
      setStatus({ busy: false, lastError: 'bad remote snapshot' });
      return localDb;
    }
    try {
      const merged = C.mergeNutrition(localDb, remoteDb);
      saveBase({ revision: remote.revision, updatedAt: remote.updatedAt, localFp: fp(merged) });
      // Push merge if local had anything remote didn't.
      if (fp(merged) !== fp(remoteDb)) {
        try {
          await pushNutrition(merged);
        } catch (_) {}
      } else {
        setStatus({
          busy: false,
          lastOk: true,
          lastSyncAt: new Date().toISOString(),
          lastError: '',
        });
      }
      return merged;
    } catch (_) {
      setStatus({ busy: false, lastError: 'schema mismatch' });
      return localDb;
    }
  }

  let pushTimer = null;
  function schedulePush(localDb) {
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
      isSignedIn()
        .then((ok) => (ok ? pushNutrition(localDb) : null))
        .catch(() => {});
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
    lookupBarcodeCloud,
    getStatus,
  };
})(typeof window !== 'undefined' ? window : globalThis);
