/* Fitbit via Google Health. Fills the same daily check-in fields as WHOOP. */
(function (global) {
  const FN = { connect: 'fitbit-connect', sync: 'fitbit-sync', status: 'fitbit-status', disconnect: 'fitbit-disconnect' };
  const ui = { busy: false, message: '' };
  function appState() { return global.S && typeof global.S === 'object' ? global.S : null; }
  function st() {
    const S = appState();
    if (!S) return { connected: false, reconnect: false };
    S.settings = S.settings || {};
    S.settings.fitbit = S.settings.fitbit || { connected: false, reconnect: false, lastSyncAt: null, sampleDate: null };
    return S.settings.fitbit;
  }
  function finiteNum(v) {
    if (v == null || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  function todayIso() {
    return global.WhoopCommon && global.WhoopCommon.todayIso ? global.WhoopCommon.todayIso() : new Date().toISOString().slice(0, 10);
  }
  function applyNormalized(n, meta) {
    meta = meta || {};
    if (!n || typeof n !== 'object' || typeof global.dailyCheckin !== 'function') return false;
    const sampleDate = String(n.date || meta.sampleDate || todayIso()).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(sampleDate) || sampleDate > todayIso()) return false;
    const c = global.dailyCheckin(sampleDate, true);
    let changed = false;
    const recovery = finiteNum(n.recoveryScore), hrv = finiteNum(n.hrvMs), rhr = finiteNum(n.restingHr);
    const sleepPerf = finiteNum(n.sleepPerformance), strain = finiteNum(n.strain);
    const sleepHours = finiteNum(n.sleepHours), steps = finiteNum(n.steps);
    if (recovery != null && recovery >= 0 && recovery <= 100) { c.whoopRecovery = Math.round(recovery); changed = true; }
    if (hrv != null && hrv > 0) { c.hrv = hrv; changed = true; }
    if (rhr != null && rhr > 0) { c.restingHr = rhr; changed = true; }
    const onSample = (key) => !n.metricDates || n.metricDates[key] == null || n.metricDates[key] === sampleDate;
    if (sleepPerf != null && onSample('sleepPerformance') && sleepPerf >= 0 && sleepPerf <= 100) { c.whoopSleepPerformance = Math.round(sleepPerf); changed = true; }
    if (strain != null && onSample('strain') && strain >= 0 && strain <= 21) { c.whoopStrain = Math.round(strain * 10) / 10; changed = true; }
    if (sleepHours != null && onSample('sleepHours') && sleepHours >= 0 && sleepHours <= 24) { c.sleepHours = Math.round(sleepHours * 100) / 100; changed = true; }
    if (steps != null && onSample('steps') && steps >= 0 && steps <= 2147483647) { c.steps = Math.round(steps); changed = true; }
    if (global.StrengthHome && typeof global.StrengthHome.importHistory === 'function' && appState()) {
      global.StrengthHome.importHistory(appState(), { normalized: n, dailyMetrics: meta.dailyMetrics || [], syncedAt: meta.syncedAt }, todayIso(), 'Fitbit');
    }
    if (changed) {
      c.updatedAt = Date.now();
      c.fitbitSyncedAt = meta.syncedAt || n.capturedAt || new Date().toISOString();
      c.fitbitSampleDate = n.date || null;
      if (typeof global.touchRecord === 'function') global.touchRecord(c, 'daily_checkins');
    }
    const row = st();
    row.connected = true;
    row.reconnect = false;
    row.lastSyncAt = meta.syncedAt || n.capturedAt || new Date().toISOString();
    row.sampleDate = n.date || row.sampleDate || null;
    row.lastNormalized = n;
    if (typeof global.save === 'function') global.save();
    return changed;
  }
  async function api(path, opts) {
    opts = opts || {};
    const Whoop = global.Whoop;
    if (!Whoop || typeof Whoop.token !== 'function' || typeof Whoop.fnUrl !== 'function') {
      const error = new Error('Sign in before connecting Fitbit');
      error.code = 'auth_required';
      throw error;
    }
    const t = await Whoop.token();
    const requestAccount = appState()?.accountId;
    if (!t) { const error = new Error('Sign in before connecting Fitbit'); error.code = 'auth_required'; throw error; }
    const cfg = global.STRENGTH_CONFIG || global.ENGINE_CONFIG || {};
    let res;
    const AC = global.AbortController;
    const controller = AC ? new AC() : null;
    const timer = controller && global.setTimeout ? global.setTimeout(function () { controller.abort(); }, opts.timeoutMs || 25000) : 0;
    try {
      res = await fetch(Whoop.fnUrl(path, opts.query), {
        method: opts.method || 'GET',
        headers: { authorization: 'Bearer ' + t, apikey: cfg.supabaseAnon || '', 'x-hybrid-product': cfg.hybridProduct || 'strength', accept: 'application/json' },
        cache: 'no-store',
        signal: controller ? controller.signal : undefined,
      });
    } catch (err) {
      const timedOut = err && err.name === 'AbortError';
      const error = new Error(timedOut ? 'Fitbit sync timed out — try again' : 'Fitbit service is down — try again in a minute');
      error.cause = err;
      error.code = timedOut ? 'timeout' : 'fitbit_unreachable';
      throw error;
    } finally {
      if (timer) global.clearTimeout(timer);
    }
    if (requestAccount && requestAccount !== appState()?.accountId) throw new Error('Account changed during Fitbit sync');
    let body = null;
    try { body = await res.json(); } catch (_) { body = null; }
    if (body?.error === 'reconnect_fitbit') {
      const row = st();
      row.connected = false;
      row.reconnect = true;
      if (typeof global.save === 'function') global.save();
      const error = new Error('Reconnect Fitbit');
      error.code = 'reconnect_fitbit';
      error.status = res.status;
      throw error;
    }
    if (!res.ok) {
      const failures = body && Array.isArray(body.failures) ? body.failures.filter(function (item) { return typeof item === 'string'; }).slice(0, 8) : [];
      const error = new Error(failures.length ? failures.join(', ') : ((body && body.error) || ('Fitbit request failed (' + res.status + ')')));
      error.status = res.status;
      throw error;
    }
    return body;
  }
  function metaLine() {
    const row = st();
    if (row.reconnect) return 'Reconnect Fitbit — the Google testing login expired';
    if (!row.connected) return 'Fitbit not connected';
    return 'Fitbit connected · sample ' + (row.sampleDate || '—');
  }
  async function openAuthorize(url) {
    const Browser = global.Capacitor?.Plugins?.Browser;
    if (Browser?.open) { await Browser.open({ url }); return; }
    if (global.location) global.location.assign(url);
  }
  async function connect() {
    if (ui.busy) return;
    ui.busy = true;
    ui.message = 'Opening Fitbit…';
    try {
      const body = await api(FN.connect, { query: { client: 'native', appId: 'com.hybrid.strength' } });
      const url = body && typeof body.authorizeUrl === 'string' ? body.authorizeUrl : '';
      if (!/^https:\/\//i.test(url)) throw new Error('Fitbit connect URL missing');
      st().awaitingReturn = true;
      if (typeof global.save === 'function') global.save();
      await openAuthorize(url);
      ui.message = 'Finish Allow in Google, then return here.';
    } catch (err) {
      ui.message = err.code === 'auth_required' ? 'Sign in before connecting Fitbit' : (err.message || 'Connect failed');
      if (global.alert) global.alert(ui.message);
      throw err;
    } finally { ui.busy = false; }
  }
  function paint() {
    if (typeof global.render === 'function') global.render();
  }
  let syncPromise = null;
  function sync(opts) {
    if (syncPromise) return syncPromise;
    syncPromise = performSync(opts).finally(function () { syncPromise = null; });
    return syncPromise;
  }
  async function performSync(opts) {
    opts = opts || {};
    if (!opts.quiet) { ui.message = 'Syncing Fitbit…'; paint(); }
    try {
      const body = await api(FN.sync, { query: opts.full ? { history: 'all' } : {} });
      if (body?.normalized || (body?.dailyMetrics || []).length) applyNormalized(body.normalized || { date: todayIso() }, { syncedAt: body.syncedAt, dailyMetrics: body.dailyMetrics || [] });
      const row = st();
      row.connected = body?.connected !== false;
      row.reconnect = false;
      row.lastSyncAt = body?.syncedAt || new Date().toISOString();
      if (typeof global.save === 'function') global.save();
      ui.message = body?.normalized ? 'Fitbit synced' : 'Fitbit connected · no dated readings yet';
      return body;
    } catch (err) {
      ui.message = err.code === 'reconnect_fitbit'
        ? 'Reconnect Fitbit — the Google testing login expired'
        : (err.message || 'Fitbit sync failed');
      throw err;
    } finally {
      paint();
    }
  }
  async function refreshStatus() {
    const body = await api(FN.status);
    const fitbit = body?.fitbit || {};
    const row = st();
    row.connected = !!fitbit.connected;
    row.reconnect = !!fitbit.reconnect;
    row.lastSyncAt = fitbit.lastSyncAt || row.lastSyncAt;
    row.sampleDate = fitbit.sampleDate || row.sampleDate;
    if (fitbit.normalized) applyNormalized(fitbit.normalized, { syncedAt: fitbit.lastSyncAt });
    if (typeof global.save === 'function') global.save();
    return body;
  }
  async function handleReturn(value) {
    const url = String(value || '');
    if (!url.includes('://fitbit') && !url.includes('integration=fitbit')) return;
    const status = new URL(url.replace(/^[a-z0-9.]+:\/\//i, 'https://return/')).searchParams.get('status');
    if (status === 'denied') { ui.message = 'Fitbit connection cancelled'; st().awaitingReturn = false; return; }
    if (status === 'connected') { ui.message = 'Finishing Fitbit…'; await refreshStatus(); if (st().connected) await sync({ quiet: true }); ui.message = st().connected ? 'Fitbit connected' : 'Reconnect Fitbit'; }
  }
  const App = global.Capacitor?.Plugins?.App;
  if (App?.addListener) App.addListener('appUrlOpen', (data) => handleReturn(data?.url));
  global.Fitbit = { connect, sync, refreshStatus, handleReturn, applyNormalized, uiMessage: () => ui.message || metaLine(), metaLine };
})(typeof window !== 'undefined' ? window : globalThis);
