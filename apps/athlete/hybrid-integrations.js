(function (global) {
  const STORAGE_KEY = 'HYBRID_SC_integrations_v1';
  const WHOOP_CHECKIN_KEYS = [
    'whoopRecovery', 'hrv', 'restingHr', 'whoopSleepPerformance', 'whoopStrain',
    'whoopSyncedAt', 'whoopSampleDate', 'sleepQuality', 'readinessColor', 'mainLimiter',
    'backgroundLoad', 'recoveryPenalty', 'wearablePenalty', 'updatedAt',
  ];

  let foregroundBound = false;
  let bootSyncPromise = null;

  function readShared() {
    try {
      const raw = global.localStorage && global.localStorage.getItem(STORAGE_KEY);
      if (!raw) return { whoop: null, checkin: {} };
      const parsed = JSON.parse(raw);
      return {
        whoop: parsed && parsed.whoop ? parsed.whoop : null,
        checkin: (parsed && parsed.checkin) || {},
      };
    } catch (_) {
      return { whoop: null, checkin: {} };
    }
  }

  function writeShared(data) {
    if (!global.localStorage) return;
    global.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      whoop: data.whoop || null,
      checkin: data.checkin || {},
    }));
  }

  function sliceCheckin(entry) {
    if (!entry || typeof entry !== 'object') return null;
    const out = {};
    WHOOP_CHECKIN_KEYS.forEach((key) => {
      if (entry[key] != null) out[key] = entry[key];
    });
    return Object.keys(out).length ? out : null;
  }

  function mergeIntoState(S) {
    if (!S || typeof S !== 'object') return S;
    const shared = readShared();
    S.settings = S.settings || {};
    if (shared.whoop) {
      S.settings.whoop = Object.assign(
        { connected: false, lastSyncAt: null, sampleDate: null, email: null },
        S.settings.whoop || {},
        shared.whoop,
      );
    }
    S.checkin = S.checkin || {};
    Object.keys(shared.checkin || {}).forEach((iso) => {
      const slice = shared.checkin[iso];
      if (!slice) return;
      S.checkin[iso] = Object.assign({}, S.checkin[iso] || {}, slice);
    });
    return S;
  }

  function persistWhoop(S, iso) {
    if (!S || typeof S !== 'object') return;
    const shared = readShared();
    shared.whoop = Object.assign({}, shared.whoop || {}, S.settings && S.settings.whoop ? S.settings.whoop : {});
    shared.checkin = shared.checkin || {};
    const slice = sliceCheckin(S.checkin && S.checkin[iso]);
    if (slice) shared.checkin[iso] = Object.assign({}, shared.checkin[iso] || {}, slice);
    writeShared(shared);
  }

  async function syncWhoopFull() {
    const Whoop = global.Whoop;
    if (!Whoop || typeof Whoop.syncAll !== 'function') return;
    try {
      await Whoop.syncAll();
    } catch (_) {
      /* offline / unsigned */
    }
  }

  async function syncPlan() {
    const PlanSync = global.PlanSync;
    if (!PlanSync || typeof PlanSync.syncNow !== 'function') return;
    try {
      await PlanSync.syncNow();
    } catch (_) {
      /* offline / unsigned */
    }
  }

  async function hydrateAuth() {
    const Whoop = global.Whoop;
    if (!Whoop || typeof Whoop.hydrateAuth !== 'function') return;
    try {
      await Whoop.hydrateAuth();
    } catch (_) {
      /* offline / SDK */
    }
  }

  async function bootSync() {
    if (bootSyncPromise) return bootSyncPromise;
    bootSyncPromise = (async () => {
      await hydrateAuth();
      await syncPlan();
      await syncWhoopFull();
    })().finally(() => {
      bootSyncPromise = null;
    });
    return bootSyncPromise;
  }

  function bindForegroundSync() {
    if (foregroundBound) return;
    const cap = global.Capacitor && global.Capacitor.Plugins && global.Capacitor.Plugins.App;
    if (!cap || typeof cap.addListener !== 'function') return;
    foregroundBound = true;
    cap.addListener('appStateChange', function (state) {
      if (!state || !state.isActive) return;
      bootSync();
    });
  }

  global.HybridIntegrations = {
    STORAGE_KEY,
    mergeIntoState,
    persistWhoop,
    bootSync,
    bindForegroundSync,
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
