/* WHOOP bridge — one connection per HYBRID S&C login (Supabase user u:). */
(function (global) {
  function cfg() {
    return global.STRENGTH_CONFIG || global.ENGINE_CONFIG || {};
  }
  function hybridProduct() {
    const c = cfg();
    return c.hybridProduct || 'strength';
  }
  const SUPABASE_URL = cfg().supabaseUrl || 'https://orysjncrksmdfabpuftd.supabase.co';
  const SUPABASE_ANON = cfg().supabaseAnon || '';
  const NATIVE_APP_ID = 'com.hybrid.athlete'; // one Capacitor install for both houses
  function nativeAppId() {
    return NATIVE_APP_ID;
  }
  const FN = {
    connect: 'whoop-connect',
    sync: 'whoop-sync',
    status: 'integrations-status',
    disconnect: 'integrations-disconnect',
    coach: 'brain-coach'
  };
  function functionName(path) {
    return String(path || '').replace(/^\//, '').split('?')[0];
  }
  function resolveProxyBase() {
    return String(cfg().supabaseUrl || SUPABASE_URL).replace(/\/$/, '') + '/functions/v1';
  }
  function fnUrl(path, query) {
    const name = functionName(path);
    const params = Object.assign({ product: hybridProduct() }, query || {});
    const q = '?' + new URLSearchParams(params);
    return resolveProxyBase() + '/' + name + q;
  }
  let sb = null;
  const ui = { busy: false, message: '' };

  function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function waitForSupabase(maxMs) {
    maxMs = maxMs || 8000;
    return new Promise(function (resolve, reject) {
      if (global.supabase && global.supabase.createClient) return resolve();
      const started = Date.now();
      const tick = function () {
        if (global.supabase && global.supabase.createClient) return resolve();
        if (Date.now() - started >= maxMs) {
          return reject(new Error('Supabase SDK failed to load — check your connection and reload'));
        }
        global.setTimeout(tick, 50);
      };
      tick();
    });
  }
  function client() {
    if (sb) return sb;
    if (!global.supabase || !global.supabase.createClient) throw new Error('Supabase SDK failed to load');
    sb = global.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storage: global.localStorage }
    });
    return sb;
  }
  async function syncAuthEmail() {
    try {
      await waitForSupabase();
      const em = await email();
      const w = st();
      if (em && w.email !== em) {
        w.email = em;
        if (typeof global.save === 'function') global.save();
        return true;
      }
      if (!em && w.email) {
        w.email = null;
        w.connected = false;
        w.lastSyncAt = null;
        w.sampleDate = null;
        if (typeof global.save === 'function') global.save();
        return true;
      }
    } catch (_) {}
    return false;
  }
  async function hydrateAuth() {
    const changed = await syncAuthEmail();
    try {
      if (await token()) await refreshStatus();
    } catch (_) { /* not linked yet */ }
    if (typeof global.render === 'function') global.render();
    return changed;
  }
  async function token() {
    const { data, error } = await client().auth.getSession();
    if (error) throw error;
    return (data.session && data.session.access_token) || null;
  }
  async function email() {
    try {
      const { data } = await client().auth.getSession();
      return (data.session && data.session.user && data.session.user.email) || null;
    } catch (_) { return null; }
  }
  async function api(path, opts) {
    opts = opts || {};
    const method = opts.method || 'GET';
    const t = await token();
    if (!t) { const e = new Error('Sign in to sync WHOOP'); e.code = 'auth_required'; throw e; }
    const url = fnUrl(path, opts.query);
    let res;
    try {
      res = await fetch(url, {
        method,
        headers: {
          authorization: 'Bearer ' + t,
          apikey: SUPABASE_ANON,
          'x-hybrid-product': hybridProduct(),
          accept: 'application/json',
        },
        cache: 'no-store'
      });
    } catch (err) {
      const e = new Error('WHOOP service is down — try again in a minute');
      e.cause = err;
      e.code = 'whoop_unreachable';
      throw e;
    }
    let body = null;
    try { body = await res.json(); } catch (_) { body = null; }
    if (!res.ok) {
      const raw = (body && (body.error || body.message)) || ('WHOOP request failed (' + res.status + ')');
      const boot = res.status === 503 || /failed to start|BOOT_ERROR/i.test(String(raw));
      const friendly = (res.status === 401 || raw === 'unauthorized')
        ? 'Sign in again in HYBRID S&C, then tap Connect WHOOP'
        : (boot ? 'WHOOP service is down — try again in a minute' : raw);
      const e = new Error(friendly);
      e.status = res.status; e.body = body; throw e;
    }
    return body;
  }
  // `today` and `S` are let/const in the HTML script, so they are NOT on window.
  // Resolve them explicitly — otherwise applyNormalized silently no-ops and Home
  // keeps the fixture recovery/HRV/RHR values after a "WHOOP synced" toast.
  function todayIso() {
    if (typeof global.today === 'function') return global.today();
    const d = new Date();
    const tz = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tz).toISOString().slice(0, 10);
  }
  function appState() {
    if (global.S && typeof global.S === 'object') return global.S;
    return null;
  }
  function finiteNum(v) {
    // Number(null) === 0 — treat null/'' as missing so we don't write zeros.
    if (v == null || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  // Ephemeral WHOOP UI state before index.html bridges window.S ↔ let S.
  // Never invent a stub on global.S — that orphans Whoop from real app state.
  var whoopFallback = { connected: false, lastSyncAt: null, sampleDate: null, email: null };
  function st() {
    const S = appState();
    if (!S) return whoopFallback;
    S.settings = S.settings || {};
    S.settings.whoop = S.settings.whoop || { connected: false, lastSyncAt: null, sampleDate: null, email: null };
    return S.settings.whoop;
  }
  function iosApi() {
    return global.WhoopIos || null;
  }
  function hasIosTokens() {
    const ios = st().ios;
    return !!(ios && ios.refreshToken);
  }
  function saveIosTokens(tokens, whoopEmail) {
    const w = st();
    const prev = w.ios || {};
    w.ios = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || prev.refreshToken || '',
      idToken: tokens.idToken || prev.idToken || '',
      expiresAt: tokens.expiresAt || 0,
      installationId: prev.installationId || (iosApi() && iosApi().newInstallationId()) || '',
      whoopEmail: whoopEmail || prev.whoopEmail || null,
    };
    w.iosEmail = w.ios.whoopEmail;
    w.connected = true;
    w.source = 'ios';
    if (typeof global.save === 'function') global.save();
    if (global.HybridIntegrations && typeof global.HybridIntegrations.persistWhoop === 'function') {
      const S = appState();
      if (S) global.HybridIntegrations.persistWhoop(S, todayIso());
    }
  }
  function clearIosTokens() {
    const w = st();
    w.ios = null;
    w.connected = false;
    w.lastSyncAt = null;
    w.sampleDate = null;
    w.lastNormalized = null;
    w.source = null;
  }
  async function ensureIosAccess() {
    const Ios = iosApi();
    if (!Ios) throw new Error('WHOOP client missing — reload the app');
    const ios = st().ios;
    if (!ios || !ios.refreshToken) {
      const e = new Error('Connect WHOOP under Me');
      e.code = 'whoop_not_linked';
      throw e;
    }
    if (ios.accessToken && ios.expiresAt && ios.expiresAt - Date.now() > 60 * 1000) return ios;
    const fresh = await Ios.refresh(ios.refreshToken);
    saveIosTokens(fresh, ios.whoopEmail);
    return st().ios;
  }
  async function syncIos(opts) {
    opts = opts || {};
    const Ios = iosApi();
    if (!Ios) throw new Error('WHOOP client missing — reload the app');
    const sess = await ensureIosAccess();
    const n = await Ios.syncToday({
      accessToken: sess.accessToken,
      installationId: sess.installationId,
    });
    const applied = applyNormalized(n, { syncedAt: n.capturedAt, sampleDate: n.date });
    return { applied: !!applied, normalized: n };
  }
  function connectFormHtml() {
    const w = st();
    const prefill = w.iosEmail || '';
    const mfa = !!ui.mfaSession;
    const busy = ui.busy ? ' disabled' : '';
    return '<div class="whoop-ios-form">' +
      '<div class="field"><label for="whoopIosEmail">WHOOP email</label>' +
      '<input id="whoopIosEmail" type="email" autocomplete="username" placeholder="you@email.com" value="' + esc(prefill) + '"' + busy + '></div>' +
      '<div class="field"><label for="whoopIosPassword">WHOOP password</label>' +
      '<input id="whoopIosPassword" type="password" autocomplete="current-password" placeholder="WHOOP password"' + busy + '></div>' +
      (mfa
        ? '<div class="field"><label for="whoopIosMfa">SMS code</label>' +
          '<input id="whoopIosMfa" inputmode="numeric" autocomplete="one-time-code" placeholder="6-digit code"' + busy + '></div>'
        : '') +
      '</div>';
  }
  function applyNormalized(n, meta) {
    meta = meta || {};
    if (!n || typeof n !== 'object') return false;
    if (typeof global.dailyCheckin !== 'function') return false;
    const c = global.dailyCheckin(todayIso(), true);
    let changed = false;
    const recovery = finiteNum(n.recoveryScore), hrv = finiteNum(n.hrvMs), rhr = finiteNum(n.restingHr);
    const sleepPerf = finiteNum(n.sleepPerformance), strain = finiteNum(n.strain);
    if (recovery != null && recovery > 0) { c.whoopRecovery = Math.round(recovery); changed = true; }
    if (hrv != null && hrv > 0) { c.hrv = Math.round(hrv); changed = true; }
    if (rhr != null && rhr > 0) { c.restingHr = Math.round(rhr); changed = true; }
    if (sleepPerf != null && sleepPerf > 0) { c.whoopSleepPerformance = Math.round(sleepPerf); c.sleepQuality = Math.max(1, Math.min(10, Math.round(sleepPerf / 10))); changed = true; }
    if (strain != null && strain > 0) { c.whoopStrain = Math.round(strain * 10) / 10; changed = true; }
    const steps = finiteNum(n.steps);
    if (steps != null && steps > 0) { c.whoopSteps = Math.round(steps); changed = true; }
    if (changed) {
      c.updatedAt = Date.now();
      c.whoopSyncedAt = meta.syncedAt || n.capturedAt || new Date().toISOString();
      c.whoopSampleDate = n.date || meta.sampleDate || null;
      if (typeof global.readinessScore === 'function') {
        const s = global.readinessScore(c);
        Object.assign(c, {
          readinessColor: s.color, mainLimiter: s.reason,
          backgroundLoad: s.backgroundLoad, recoveryPenalty: s.recoveryPenalty, wearablePenalty: s.wearablePenalty
        });
      }
      if (typeof global.touchRecord === 'function') global.touchRecord(c, 'daily_checkins');
    }
    const w = st();
    w.connected = true;
    w.lastSyncAt = meta.syncedAt || n.capturedAt || new Date().toISOString();
    w.sampleDate = n.date || meta.sampleDate || w.sampleDate || null;
    w.lastNormalized = n;
    if (typeof global.save === 'function') global.save();
    if (global.HybridIntegrations && typeof global.HybridIntegrations.persistWhoop === 'function') {
      const S = appState();
      if (S) global.HybridIntegrations.persistWhoop(S, todayIso());
    }
    return changed;
  }
  function metaLine() {
    const w = st();
    if (!w.connected) return 'Not connected — using typed check-in values';
    const when = w.lastSyncAt ? new Date(w.lastSyncAt).toLocaleString() : 'never';
    return 'Connected · sample ' + (w.sampleDate || '—') + ' · synced ' + when;
  }
  function statusChip(label, ok, detail) {
    return '<div class=meta style="margin-top:6px"><b>' + esc(label) + '</b> · ' + esc(ok ? 'OK' : '—') + (detail ? ' · ' + esc(detail) : '') + '</div>';
  }
  function cloudStatusLines() {
    var lines = '';
    var w = st();
    lines += statusChip('WHOOP', !!w.connected, w.connected ? metaLine() : 'not connected');
    return lines;
  }
  function cardHtml() {
    const w = st();
    const busy = ui.busy ? ' disabled' : '';
    const msg = ui.message ? '<p class="stub signin-msg">' + esc(ui.message) + '</p>' : '';
    if (w.email) return '';
    return '<div class="card signin-card" id="whoopCard">' +
      '<div class="field"><label for="whoopEmail">Email</label>' +
      '<input id="whoopEmail" type="email" autocomplete="username" placeholder="you@email.com"></div>' +
      '<div class="field"><label for="whoopPassword">Password</label>' +
      '<input id="whoopPassword" type="password" autocomplete="current-password"></div>' +
      '<div class="account-actions">' +
      '<button type="button" class="btn oled-cta block" onclick="Whoop.signIn()"' + busy + '>Sign in</button>' +
      '</div>' + msg + '</div>';
  }
  function renderPanels() {
    const card = document.getElementById('whoopCard');
    if (!card) return;
    const html = cardHtml();
    if (!html) {
      card.remove();
      return;
    }
    const wrap = document.createElement('div');
    wrap.innerHTML = html;
    card.replaceWith(wrap.firstChild);
    const line = document.getElementById('whoopSleepLine');
    if (line) line.textContent = metaLine();
  }
  async function refreshStatus() {
    const w = st();
    if (hasIosTokens()) {
      w.connected = true;
      w.source = 'ios';
      w.email = await email();
      if (typeof global.save === 'function') global.save();
      return { whoop: w };
    }
    w.connected = false;
    w.email = await email();
    if (typeof global.save === 'function') global.save();
    return { whoop: w };
  }
  function refreshVisibleUi() {
    renderPanels();
    // Sleep overview: rebuild metrics without re-entering auto-sync.
    if (document.getElementById('whoopSleepLine') && typeof global.openAthleteSleepOverview === 'function') {
      global.openAthleteSleepOverview(undefined, { skipWhoopSync: true });
      return;
    }
    const tab = (appState() && appState().tab) || null;
    // Settings: only swap the Account card in place. Calling settings() rebuilds
    // the whole page and shell() scrolls to top — that feels like broken scroll.
    if (tab === 'settings') return;
    if (typeof global.render === 'function') global.render();
  }
  async function sync(opts) {
    opts = opts || {};
    if (ui.busy && !opts.quiet) return;
    if (!opts.quiet) { ui.busy = true; ui.message = 'Syncing WHOOP…'; renderPanels(); }
    try {
      const body = await syncIos({ quiet: true });
      const applied = !!(body && body.applied);
      if (!opts.quiet) {
        ui.message = applied
          ? 'WHOOP synced — Home sleep / recovery / strain / steps updated'
          : 'WHOOP reached but no recovery sample yet';
      }
      try { await refreshStatus(); } catch (_) {}
      if (!opts.quiet) {
        ui.busy = false;
        refreshVisibleUi();
      }
    } catch (err) {
      if (!opts.quiet) ui.message = err.code === 'auth_required' ? 'Sign in to sync WHOOP' : (err.message || 'Sync failed');
      throw err;
    } finally {
      if (!opts.quiet) { ui.busy = false; renderPanels(); }
    }
  }
  let awaitingWhoopReturn = false;
  function paint() {
    renderPanels();
    if (typeof global.render === 'function') global.render();
  }
  async function finishWhoopReturn() {
    ui.message = 'Finishing WHOOP…';
    paint();
    try {
      await refreshStatus();
      if (st().connected) await sync({ quiet: true });
      ui.message = st().connected ? 'WHOOP connected' : 'WHOOP did not finish — tap Connect again';
      if (st().connected) awaitingWhoopReturn = false;
    } catch (err) {
      ui.message = (err && err.message) || 'Could not finish WHOOP connect';
    }
    paint();
  }
  async function pollWhoopLinked() {
    for (let i = 0; i < 45; i += 1) {
      await new Promise(function (resolve) { global.setTimeout(resolve, 2000); });
      if (!awaitingWhoopReturn) return;
      try {
        await refreshStatus();
        if (st().connected) {
          await finishWhoopReturn();
          return;
        }
      } catch (_) {}
    }
  }
  async function connect() {
    if (ui.busy) return;
    const Ios = iosApi();
    if (!Ios) {
      ui.message = 'WHOOP client missing — reload the app';
      paint();
      global.alert(ui.message);
      return;
    }
    const em = ((document.getElementById('whoopIosEmail') && document.getElementById('whoopIosEmail').value) || st().iosEmail || '').trim();
    const pw = (document.getElementById('whoopIosPassword') && document.getElementById('whoopIosPassword').value) || '';
    const code = ((document.getElementById('whoopIosMfa') && document.getElementById('whoopIosMfa').value) || '').trim();
    if (!em || (!pw && !ui.mfaSession)) {
      ui.message = 'Enter your WHOOP email and password';
      paint();
      global.alert(ui.message);
      return;
    }
    ui.busy = true;
    ui.message = ui.mfaSession ? 'Verifying WHOOP code…' : 'Connecting WHOOP…';
    paint();
    try {
      let tokens;
      if (ui.mfaSession && code) {
        tokens = await Ios.verifyMfa({
          email: em,
          session: ui.mfaSession,
          challenge: ui.mfaChallenge || 'SMS_MFA',
          code: code,
        });
      } else {
        const out = await Ios.login({ email: em, password: pw });
        if (out && out.challenge) {
          ui.mfaSession = out.session;
          ui.mfaChallenge = out.challenge;
          ui.message = 'Enter the code WHOOP just texted you, then tap Connect again';
          ui.busy = false;
          paint();
          return;
        }
        tokens = out;
      }
      ui.mfaSession = null;
      ui.mfaChallenge = null;
      saveIosTokens(tokens, em);
      await syncIos({ quiet: true });
      ui.message = 'WHOOP connected';
      paint();
      refreshVisibleUi();
    } catch (err) {
      ui.message = err.message || 'Connect failed';
      paint();
      global.alert(ui.message);
      throw err;
    } finally { ui.busy = false; paint(); }
  }
  async function disconnect() {
    if (ui.busy) return;
    if (!global.confirm('Disconnect WHOOP for this account?')) return;
    ui.busy = true; ui.message = 'Disconnecting…'; renderPanels();
    try {
      clearIosTokens();
      try { await api(FN.disconnect, { method: 'POST', query: { provider: 'whoop' } }); } catch (_) {}
      if (typeof global.save === 'function') global.save();
      if (global.HybridIntegrations && typeof global.HybridIntegrations.persistWhoop === 'function') {
        const S = appState();
        if (S) global.HybridIntegrations.persistWhoop(S, todayIso());
      }
      ui.message = 'WHOOP disconnected';
    } catch (err) { ui.message = err.message || 'Disconnect failed'; }
    finally { ui.busy = false; renderPanels(); }
  }
  async function syncAll() {
    if (ui.busy) return;
    ui.busy = true;
    ui.message = 'Syncing account…';
    renderPanels();
    var bits = [];
    try {
      try {
        await refreshStatus();
        if (hasIosTokens()) {
          ui.message = 'Syncing WHOOP…';
          renderPanels();
          await sync({ quiet: true });
          bits.push('WHOOP');
        } else {
          bits.push('WHOOP (connect under Me)');
        }
      } catch (err) {
        bits.push('WHOOP: ' + ((err && err.message) || 'failed'));
      }

      ui.message = 'Synced: ' + bits.join(' · ');
      ui.busy = false;
      refreshVisibleUi();
    } catch (err) {
      ui.message = (err && err.message) || 'Sync failed';
    } finally {
      ui.busy = false;
      renderPanels();
    }
  }
  async function signIn() {
    const em = ((document.getElementById('whoopEmail') && document.getElementById('whoopEmail').value) || '').trim();
    const pw = (document.getElementById('whoopPassword') && document.getElementById('whoopPassword').value) || '';
    if (!em || !pw) {
      global.alert('Enter the same email + password you use on THE Hybrid Engine');
      return;
    }
    ui.busy = true;
    ui.message = 'Signing in…';
    renderPanels();
    try {
      await waitForSupabase();
      const { data, error } = await client().auth.signInWithPassword({ email: em, password: pw });
      if (error) throw error;
      st().email = (data.user && data.user.email) || em;
      if (typeof global.save === 'function') global.save();
      ui.message = '';
      ui.busy = false;
      if (typeof global.resetBlankSlate === 'function') global.resetBlankSlate(true);
      try { await syncAll(); } catch (_) { /* sync is optional immediately after sign-in */ }
      if (typeof global.setTab === 'function') global.setTab('home');
      else if (typeof global.render === 'function') global.render();
    } catch (err) {
      ui.message = err.message || 'Sign-in failed';
      ui.busy = false;
      renderPanels();
      global.alert(ui.message);
    }
  }
  async function signOut() {
    try { await client().auth.signOut(); } catch (_) {}
    st().email = null;
    clearIosTokens();
    if (typeof global.save === 'function') global.save();
    ui.message = '';
    if (typeof global.setTab === 'function') global.setTab('me');
    else renderPanels();
  }
  function capPlugin(name) {
    try {
      return global.Capacitor && global.Capacitor.Plugins && global.Capacitor.Plugins[name];
    } catch (_) { return null; }
  }
  async function openWhoopAuthorize(url) {
    const Browser = capPlugin('Browser');
    if (Browser && typeof Browser.open === 'function') {
      await Browser.open({ url: url });
      return;
    }
    global.open(url, '_blank', 'noopener');
  }
  let nativeWhoopBound = false;
  function bindNativeWhoopReturn() {
    const App = capPlugin('App');
    if (!App || typeof App.addListener !== 'function' || nativeWhoopBound) return false;
    nativeWhoopBound = true;
    App.addListener('appUrlOpen', async function (data) {
      const u = String((data && data.url) || '');
      if (u.indexOf('whoop') === -1) return;
      const Browser = capPlugin('Browser');
      if (Browser && typeof Browser.close === 'function') {
        try { await Browser.close(); } catch (_) {}
      }
      awaitingWhoopReturn = true;
      await finishWhoopReturn();
    });
    App.addListener('appStateChange', async function (state) {
      if (!state || !state.isActive || !awaitingWhoopReturn) return;
      const Browser = capPlugin('Browser');
      if (Browser && typeof Browser.close === 'function') {
        try { await Browser.close(); } catch (_) {}
      }
      await finishWhoopReturn();
    });
    return true;
  }
  function bindNativeWhoopReturnWhenReady() {
    if (bindNativeWhoopReturn()) return;
    let n = 0;
    const t = global.setInterval(function () {
      n += 1;
      if (bindNativeWhoopReturn() || n > 40) global.clearInterval(t);
    }, 250);
  }
  async function autoSyncIfPossible() {
    try {
      await syncAuthEmail();
      if (!hasIosTokens()) return;
      await sync({ quiet: true });
    } catch (_) {}
  }
  global.Whoop = {
    cardHtml, metaLine, renderPanels, connectFormHtml, autoSyncIfPossible, hydrateAuth, syncAuthEmail,
    signIn, signOut, connect, sync, syncAll, disconnect, refreshStatus,
    uiMessage: function () { return ui.message || ''; },
    client, token, email, waitForSupabase, fnUrl, resolveProxyBase
  };
  bindNativeWhoopReturnWhenReady();
})(window);
