/* WHOOP bridge — one connection per Hybrid Strength login (Supabase user u:). */
(function (global) {
  function cfg() {
    return global.STRENGTH_CONFIG || {};
  }
  function hybridProduct() {
    const c = cfg();
    return c.hybridProduct || 'strength';
  }
  const SUPABASE_URL = cfg().supabaseUrl || 'https://orysjncrksmdfabpuftd.supabase.co';
  const SUPABASE_ANON = cfg().supabaseAnon || '';
  const NATIVE_APP_ID = 'com.hybrid.strength';
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
    if(name === 'brain-coach') return String(cfg().coachProxyOrigin).replace(/\/$/, '') + '/.netlify/functions/' + name + q;
    return resolveProxyBase() + '/' + name + q;
  }
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
  const client = global.WhoopCommon.clientFactory(()=>({url:SUPABASE_URL,key:SUPABASE_ANON}));

  async function syncAuthEmail() {
    try {
      await waitForSupabase();
      const { data } = await client().auth.getSession();
      if (data.session?.user && global.StrengthMemory) await global.StrengthMemory.bind(data.session.user.id);
      const em = data.session?.user?.email || null;
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
    if (launchReturnUrl) await handleWhoopReturn(launchReturnUrl);
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
    const { data } = await client().auth.getSession();
    const user = data.session?.user;
    if (user && global.StrengthMemory) await global.StrengthMemory.bind(user.id);
    const t = data.session?.access_token;
    const requestAccount = user?.id || appState()?.accountId;
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
    if (requestAccount && requestAccount !== appState()?.accountId) throw new Error('Account changed during WHOOP sync');
    let body = null;
    try { body = await res.json(); } catch (_) { body = null; }
    if (requestAccount && requestAccount !== appState()?.accountId) throw new Error('Account changed during WHOOP sync');
    if (!res.ok) {
      const raw = (body && (body.error || body.message)) || ('WHOOP request failed (' + res.status + ')');
      const boot = res.status === 503 || /failed to start|BOOT_ERROR/i.test(String(raw));
      const friendly = (res.status === 401 || raw === 'unauthorized')
        ? 'Sign in again in Hybrid Strength, then tap Connect WHOOP'
        : (boot ? 'WHOOP service is down — try again in a minute' : raw);
      const e = new Error(friendly);
      e.status = res.status; e.body = body; throw e;
    }
    return body;
  }
  // `today` and `S` are let/const in the HTML script, so they are NOT on window.
  // Resolve them explicitly — otherwise applyNormalized silently no-ops and Home
  // keeps the fixture recovery/HRV/RHR values after a "WHOOP synced" toast.
  const todayIso = global.WhoopCommon.todayIso;

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
  function applyNormalized(n, meta) {
    meta = meta || {};
    if (!n || typeof n !== 'object') return false;
    if (typeof global.dailyCheckin !== 'function') return false;
    const sampleDate=String(n.date || meta.sampleDate || todayIso()).slice(0,10);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(sampleDate)||sampleDate>todayIso()) return false;
    const c = global.dailyCheckin(sampleDate, true);
    let changed = false;
    const recovery = finiteNum(n.recoveryScore), hrv = finiteNum(n.hrvMs), rhr = finiteNum(n.restingHr);
    const sleepPerf = finiteNum(n.sleepPerformance), strain = finiteNum(n.strain);
    if (recovery != null && recovery >= 0 && recovery <= 100) { c.whoopRecovery = Math.round(recovery); changed = true; }
    if (hrv != null && hrv > 0) { c.hrv = hrv; changed = true; }
    if (rhr != null && rhr > 0) { c.restingHr = rhr; changed = true; }
    if (sleepPerf != null && sleepPerf >= 0 && sleepPerf <= 100 && (!global.StrengthHome || n.metricDates?.sleepPerformance === sampleDate)) { c.whoopSleepPerformance = Math.round(sleepPerf); changed = true; }
    if (strain != null && strain >= 0 && strain <= 21 && (!global.StrengthHome || n.metricDates?.strain === sampleDate)) { c.whoopStrain = Math.round(strain * 10) / 10; changed = true; }
    if (global.StrengthHome && appState()) {
      changed = !!global.StrengthHome.importHistory(appState(), { normalized: n, syncedAt: meta.syncedAt }, todayIso()) || changed;
    }
    if (changed) {
      c.updatedAt = Date.now();
      c.whoopSyncedAt = meta.syncedAt || n.capturedAt || new Date().toISOString();
      c.whoopSampleDate = n.date || meta.sampleDate || null;
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
      if (S) global.HybridIntegrations.persistWhoop(S, sampleDate);
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
    for (const id of ['whoopHomeStatus', 'whoopAccountStatus']) {
      const line = document.getElementById(id);
      if (line) line.textContent = ui.message || metaLine();
    }
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
  async function refreshStatus(){return global.WhoopCommon.refreshStatus({api,route:FN.status,state:st,apply:applyNormalized,email});}

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
  let syncPromise = null;
  let lastAutoAttempt = 0;
  function sync(opts) {
    opts = opts || {};
    if (syncPromise) return syncPromise;
    syncPromise = performSync(opts).finally(function () { syncPromise = null; });
    return syncPromise;
  }
  async function performSync(opts) {
    if (!opts.quiet) { ui.busy = true; ui.message = 'Syncing WHOOP…'; renderPanels(); }
    try {
      const query = { backfill: '1', history: opts.full ? 'all' : 'recent' };
      const body = await api(FN.sync, { query });
      let applied = false;
      if (body?.normalized) applied = !!applyNormalized(body.normalized, { syncedAt: body.syncedAt, sampleDate: body.normalized.date });
      const state = appState();
      const count = state && global.StrengthHome ? global.StrengthHome.importHistory(state, body || {}, todayIso()) : 0;
      if (state && global.HybridIntegrations) {
        for (const row of state.whoopHistory || []) global.HybridIntegrations.persistWhoop(state, row.date);
      }
      const w = st();
      w.connected = body?.connected !== false;
      w.lastSyncAt = body?.syncedAt || new Date().toISOString();
      if (typeof global.save === 'function') global.save();
      ui.message = count || applied ? 'WHOOP synced · recovery, sleep and dated readings updated' : 'WHOOP connected · no dated readings available yet';
      if (body?.historyTruncated) ui.message += ' · Older history reached the server limit';
      if (typeof global.render === 'function') global.render();
      return body;
    } catch (err) {
      ui.message = err.code === 'auth_required' ? 'Sign in to sync WHOOP' : (err.message || 'Sync failed; saved readings kept');
      renderPanels();
      throw err;
    } finally {
      if (!opts.quiet) ui.busy = false;
      renderPanels();
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
      if (st().connected) { awaitingWhoopReturn = false; st().awaitingReturn = false; if (typeof global.save === 'function') global.save(); }
    } catch (err) {
      ui.message = (err && err.message) || 'Could not finish WHOOP connect';
    }
    paint();
  }
  async function connect() {
    if (ui.busy) return;
    ui.busy = true; ui.message = 'Opening WHOOP…'; paint();
    try {
      const body = await api(FN.connect, { query: { client: 'native', appId: nativeAppId() } });
      const url = body && typeof body.authorizeUrl === 'string' ? body.authorizeUrl : '';
      if (!/^https:\/\//i.test(url)) throw new Error('WHOOP connect URL missing');
      awaitingWhoopReturn = true;
      st().awaitingReturn = true;
      if (typeof global.save === 'function') global.save();
      await openWhoopAuthorize(url);
      ui.message = 'Finish Allow in WHOOP, then return here. This screen updates when it saves.';
      paint();

    } catch (err) {
      awaitingWhoopReturn = false;
      ui.message = err.code === 'auth_required' ? 'Sign in before connecting WHOOP' : (err.message || 'Connect failed');
      paint();
      global.alert(ui.message);
      throw err;
    } finally { ui.busy = false; paint(); }
  }
  async function disconnect(){return global.WhoopCommon.disconnect({ui,api,route:FN.disconnect,state:st,paint:renderPanels});}

  async function syncAll() {
    if (ui.busy) return;
    ui.busy = true;
    ui.message = 'Syncing account…';
    renderPanels();
    var bits = [];
    try {
      try {
        await refreshStatus();
        if (st().connected) {
          ui.message = 'Syncing WHOOP…';
          renderPanels();
          await sync({ quiet: true });
          bits.push('WHOOP');
        } else {
          bits.push('WHOOP (sign-in only — connect when ready)');
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
      global.alert('Enter the same email + password you use in Hybrid Strength');
      return;
    }
    ui.busy = true;
    ui.message = 'Signing in…';
    renderPanels();
    try {
      await waitForSupabase();
      const { data, error } = await client().auth.signInWithPassword({ email: em, password: pw });
      if (error) throw error;
      if (global.StrengthMemory && data.user) await global.StrengthMemory.bind(data.user.id);
      st().email = (data.user && data.user.email) || em;
      if (typeof global.save === 'function') global.save();
      ui.message = '';
      ui.busy = false;
      // Signing in must preserve completed sets and pending offline writes.
      if (global.StrengthMemory) global.StrengthMemory.schedule(0);
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
    st().connected = false;
    st().lastSyncAt = null;
    st().sampleDate = null;
    st().lastNormalized = null;
    if (typeof global.save === 'function') global.save();
    if (typeof global.signOutStrengthAccount === 'function') global.signOutStrengthAccount();
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
  let launchReturnUrl = null;
  async function handleWhoopReturn(value) {
    let url;try{url=new URL(String(value||''));}catch{return;}
    if(url.protocol!=='com.hybrid.strength:'||url.hostname!=='whoop')return;
    if(!appState()){launchReturnUrl=value;return;}
    launchReturnUrl=null;
    const Browser=capPlugin('Browser');if(Browser?.close)try{await Browser.close();}catch{}
    const status=url.searchParams.get('status');
    if(status==='denied'||status==='error'){
      awaitingWhoopReturn=false;st().awaitingReturn=false;
      ui.message=status==='denied'?'WHOOP connection cancelled':'WHOOP connection failed. Please try again.';
      if(typeof global.save==='function')global.save();paint();return;
    }
    if(status!=='connected')return;
    awaitingWhoopReturn=true;await finishWhoopReturn();
  }
  let nativeWhoopBound = false;
  function bindNativeWhoopReturn() {
    const App = capPlugin('App');
    if (!App || typeof App.addListener !== 'function' || nativeWhoopBound) return false;
    nativeWhoopBound = true;
    App.addListener('appUrlOpen', data => handleWhoopReturn(data?.url));
    if(typeof App.getLaunchUrl==='function') App.getLaunchUrl().then(data=>{launchReturnUrl=data?.url||null;if(appState())handleWhoopReturn(launchReturnUrl);}).catch(()=>{});
    App.addListener('appStateChange', async function (state) {
      if (!state?.isActive || !(awaitingWhoopReturn || st().awaitingReturn)) return;
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
    if (syncPromise || Date.now() - lastAutoAttempt < 5 * 60000) return;
    lastAutoAttempt = Date.now();
    try {
      await syncAuthEmail();
      if (!(await token())) return;
      await refreshStatus();
      if (!st().connected) return;
      await sync({ quiet: true });
    } catch (_) { renderPanels(); }
  }
  global.Whoop = {
    cardHtml, metaLine, renderPanels, autoSyncIfPossible, hydrateAuth, syncAuthEmail,
    signIn, signOut, connect, sync, syncAll, disconnect, refreshStatus,
    uiMessage: function () { return ui.message || ''; },
    client, token, email, waitForSupabase, fnUrl, resolveProxyBase, handleWhoopReturn
  };
  bindNativeWhoopReturnWhenReady();
})(window);
