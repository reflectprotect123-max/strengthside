/* WHOOP bridge — official Allow (Apple/Google) + optional Totem-lite steps. */
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
  const NATIVE_APP_ID = 'com.hybrid.athlete';
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
  function capPlugin(name) {
    try {
      return global.Capacitor && global.Capacitor.Plugins && global.Capacitor.Plugins[name];
    } catch (_) { return null; }
  }
  async function edgeRequest(url, method, headers) {
    const CapHttp = capPlugin('CapacitorHttp');
    if (CapHttp && typeof CapHttp.request === 'function') {
      const res = await CapHttp.request({
        url: String(url),
        method: method,
        headers: headers,
        connectTimeout: 30000,
        readTimeout: 30000,
        disableRedirects: true,
      });
      const payload = res && res.data;
      const text = typeof payload === 'string' ? payload : (payload == null ? '' : JSON.stringify(payload));
      const status = Number(res && res.status) || 0;
      let body = null;
      try { body = text ? JSON.parse(text) : null; } catch (_) {
        body = payload && typeof payload === 'object' ? payload : null;
      }
      return { status: status, ok: status >= 200 && status < 300, body: body };
    }
    const res = await fetch(url, { method: method, headers: headers, cache: 'no-store' });
    let body = null;
    try { body = await res.json(); } catch (_) { body = null; }
    return { status: res.status, ok: !!res.ok, body: body };
  }
  async function api(path, opts) {
    opts = opts || {};
    const method = opts.method || 'GET';
    const t = await token();
    if (!t) { const e = new Error('Sign in to sync WHOOP'); e.code = 'auth_required'; throw e; }
    const url = fnUrl(path, opts.query);
    let res;
    try {
      res = await edgeRequest(url, method, {
        authorization: 'Bearer ' + t,
        apikey: SUPABASE_ANON,
        'x-hybrid-product': hybridProduct(),
        accept: 'application/json',
      });
    } catch (err) {
      const e = new Error('WHOOP service is down — try again in a minute');
      e.cause = err;
      e.code = 'whoop_unreachable';
      throw e;
    }
    const body = res.body;
    if (!res.ok) {
      const raw = (body && (body.error || body.message)) || ('WHOOP request failed (' + res.status + ')');
      const boot = res.status === 503 || /failed to start|BOOT_ERROR/i.test(String(raw));
      const friendly = (res.status === 401 || raw === 'unauthorized')
        ? 'Sign in again in HYBRID S&C, then tap Connect WHOOP'
        : (boot ? 'WHOOP Allow is down on the server — not this phone' : raw);
      const e = new Error(friendly);
      e.status = res.status; e.body = body; e.code = boot ? 'whoop_boot' : ''; throw e;
    }
    return body;
  }
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
    if (v == null || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
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
    if (typeof global.save === 'function') global.save();
  }
  function clearIosTokens() {
    const w = st();
    w.ios = null;
    w.iosEmail = null;
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
  async function syncIosSteps() {
    const Ios = iosApi();
    if (!Ios || !hasIosTokens()) return null;
    const sess = await ensureIosAccess();
    return Ios.syncToday({
      accessToken: sess.accessToken,
      installationId: sess.installationId,
    });
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
    w.lastNormalized = Object.assign({}, w.lastNormalized || {}, n);
    if (typeof global.save === 'function') global.save();
    if (global.HybridIntegrations && typeof global.HybridIntegrations.persistWhoop === 'function') {
      const S = appState();
      if (S) global.HybridIntegrations.persistWhoop(S, todayIso());
    }
    return changed;
  }
  function metaLine() {
    const w = st();
    if (!w.connected) return 'Not connected — tap Connect WHOOP';
    const when = w.lastSyncAt ? new Date(w.lastSyncAt).toLocaleString() : 'never';
    return 'Connected · sample ' + (w.sampleDate || '—') + ' · synced ' + when;
  }
  function connectFormHtml() {
    const w = st();
    const prefill = w.iosEmail || w.email || '';
    const mfa = !!ui.mfaSession;
    const busy = ui.busy ? ' disabled' : '';
    const stepsOn = hasIosTokens();
    return '<p class="stub">This is the Android app. Connect WHOOP opens Allow in Chrome on this phone — Apple or Google is fine. Official WHOOP has no steps.</p>' +
      '<div class="whoop-ios-form">' +
      '<p class="stub">' + (stepsOn
        ? 'Steps are on this phone — Sync pulls them too.'
        : 'Steps also run on this Android phone. Use the password that opens the WHOOP app here — not Apple, Google, or HYBRID S&amp;C. A 6-digit text only comes after that password works. Apple or Google never gets a code — tap Connect WHOOP.') + '</p>' +
      '<div class="field"><label for="whoopIosEmail">WHOOP app email</label>' +
      '<input id="whoopIosEmail" type="email" autocomplete="username" placeholder="WHOOP app email" value="' + esc(prefill) + '"' + busy + '></div>' +
      '<div class="field"><label for="whoopIosPassword">WHOOP app password</label>' +
      '<input id="whoopIosPassword" type="password" autocomplete="current-password" placeholder="WHOOP app password"' + busy + '></div>' +
      '<div class="field"><label for="whoopIosMfa">SMS code</label>' +
      '<input id="whoopIosMfa" inputmode="numeric" autocomplete="one-time-code" placeholder="' +
        (mfa ? '6-digit code WHOOP just texted' : 'stays empty until WHOOP texts you') + '"' + busy + '></div>' +
      '</div>';
  }
  async function connectTotem() {
    if (ui.busy) return;
    const Ios = iosApi();
    if (!Ios) {
      ui.message = 'WHOOP client missing — reload the app';
      paint();
      global.alert(ui.message);
      return;
    }
    const em = ((document.getElementById('whoopIosEmail') && document.getElementById('whoopIosEmail').value)
      || st().iosEmail || st().email || '').trim();
    const pw = (document.getElementById('whoopIosPassword') && document.getElementById('whoopIosPassword').value) || '';
    const code = ((document.getElementById('whoopIosMfa') && document.getElementById('whoopIosMfa').value) || '').trim();
    if (!em || (!pw && !ui.mfaSession)) {
      ui.message = 'Enter the WHOOP app email and password to pull steps';
      paint();
      global.alert(ui.message);
      return;
    }
    ui.busy = true;
    ui.message = ui.mfaSession ? 'Verifying WHOOP code…' : 'Pulling steps…';
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
          ui.message = 'Enter the code WHOOP just texted you, then tap Pull steps again';
          ui.busy = false;
          paint();
          return;
        }
        tokens = out;
      }
      ui.mfaSession = null;
      ui.mfaChallenge = null;
      saveIosTokens(tokens, em);
      const n = await syncIosSteps();
      if (n) applyNormalized(n, { syncedAt: n.capturedAt, sampleDate: n.date });
      st().connected = true;
      st().source = 'ios';
      ui.message = 'Steps connected — Home updated on this phone';
      paint();
      refreshVisibleUi();
    } catch (err) {
      ui.message = err.message || 'Totem login failed';
      paint();
      global.alert(ui.message);
      throw err;
    } finally { ui.busy = false; paint(); }
  }
  function hcPlugin() {
    try {
      return global.Capacitor && global.Capacitor.Plugins && global.Capacitor.Plugins.HealthConnectSteps;
    } catch (_) {
      return null;
    }
  }
  function formatHealthConnectPoke(out) {
    if (!out || out.available === false) {
      return (out && out.reason) ? String(out.reason) : 'Health Connect is not on this phone';
    }
    if (!out.granted) return 'Allow Steps (Read) for HYBRID S&C, then tap Poke Health Connect again';
    const today = Number(out.stepsToday) || 0;
    const d3 = Number(out.steps3d) || 0;
    const origins = Array.isArray(out.origins) ? out.origins.map(function (o) {
      const pkg = o && o.packageName ? String(o.packageName) : 'app';
      const n = o && o.count != null ? String(o.count) : '';
      return n ? (pkg + ' ' + n) : pkg;
    }).filter(Boolean).join(', ') : '';
    const whoop = /whoop/i.test(origins);
    if (today > 0) {
      return 'Health Connect today ' + today + (origins ? ' · ' + origins : '') + (whoop ? '' : ' · no WHOOP source yet');
    }
    if (d3 > 0) {
      return 'Health Connect today 0 (WHOOP often lags 1–2 days). Last 3 days ' + d3 + (origins ? ' · ' + origins : '');
    }
    return whoop
      ? 'WHOOP is a Health Connect source, but step counts are still 0'
      : 'Health Connect has no steps — WHOOP write may not be on, or it has not landed yet';
  }
  async function pokeHealthConnect() {
    if (ui.busy) return;
    const native = global.Capacitor && typeof global.Capacitor.isNativePlatform === 'function' && global.Capacitor.isNativePlatform();
    if (!native) {
      ui.message = 'Health Connect poke only runs in the Android install';
      paint();
      global.alert(ui.message);
      return;
    }
    const plugin = hcPlugin();
    if (!plugin || typeof plugin.pokeToday !== 'function') {
      ui.message = 'This APK cannot see Health Connect — install dogfood 1.0.101';
      paint();
      global.alert(ui.message);
      return;
    }
    ui.busy = true;
    ui.message = 'Poking Health Connect…';
    paint();
    try {
      const out = await plugin.pokeToday();
      ui.message = formatHealthConnectPoke(out);
      const today = out && Number(out.stepsToday);
      if (today > 0) {
        applyNormalized({ steps: today, date: todayIso() }, { syncedAt: new Date().toISOString(), sampleDate: todayIso() });
        refreshVisibleUi();
      }
      paint();
    } catch (err) {
      ui.message = err.message || 'Health Connect poke failed';
      paint();
      global.alert(ui.message);
    } finally { ui.busy = false; paint(); }
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
    w.email = await email();
    try {
      const body = await api(FN.status);
      const whoop = (body && body.whoop) || {};
      w.connected = !!whoop.connected || hasIosTokens();
      w.source = whoop.connected ? 'oauth' : (hasIosTokens() ? 'ios' : null);
      w.lastSyncAt = whoop.lastSyncAt || w.lastSyncAt;
      w.sampleDate = whoop.sampleDate || w.sampleDate;
      if (whoop.normalized) applyNormalized(whoop.normalized, { syncedAt: whoop.lastSyncAt, sampleDate: whoop.sampleDate });
      if (typeof global.save === 'function') global.save();
      return body;
    } catch (err) {
      if (hasIosTokens()) {
        w.connected = true;
        w.source = 'ios';
        if (typeof global.save === 'function') global.save();
        return { whoop: w };
      }
      throw err;
    }
  }
  function refreshVisibleUi() {
    renderPanels();
    if (document.getElementById('whoopSleepLine') && typeof global.openAthleteSleepOverview === 'function') {
      global.openAthleteSleepOverview(undefined, { skipWhoopSync: true });
      return;
    }
    const tab = (appState() && appState().tab) || null;
    if (tab === 'settings') return;
    if (typeof global.render === 'function') global.render();
  }
  async function syncOfficial(opts) {
    opts = opts || {};
    const body = await api(FN.sync, opts.backfill ? { query: { backfill: '1' } } : undefined);
    let applied = false;
    if (body && body.normalized) {
      applied = !!applyNormalized(body.normalized, { syncedAt: body.syncedAt, sampleDate: body.normalized.date });
    } else {
      await refreshStatus();
      applied = !!(st().lastNormalized && finiteNum(st().lastNormalized.recoveryScore));
    }
    return { body: body, applied: applied };
  }
  async function sync(opts) {
    opts = opts || {};
    if (ui.busy && !opts.quiet) return;
    if (!opts.quiet) { ui.busy = true; ui.message = 'Syncing WHOOP…'; renderPanels(); }
    try {
      let applied = false;
      let officialOk = false;
      try {
        const out = await syncOfficial(opts);
        applied = !!out.applied;
        officialOk = true;
        st().source = 'oauth';
      } catch (err) {
        if (!hasIosTokens()) throw err;
      }
      try {
        const ios = await syncIosSteps();
        if (ios) {
          applied = !!applyNormalized(ios, { syncedAt: ios.capturedAt, sampleDate: ios.date }) || applied;
          if (!officialOk) st().source = 'ios';
        }
      } catch (_) { /* steps are extra */ }
      if (!opts.quiet) {
        ui.message = applied
          ? 'WHOOP synced — Home sleep / recovery / strain updated'
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
    ui.busy = true; ui.message = 'Opening WHOOP…'; paint();
    try {
      const body = await api(FN.connect, { query: { client: 'native', appId: nativeAppId() } });
      const url = body && typeof body.authorizeUrl === 'string' ? body.authorizeUrl : '';
      if (!/^https:\/\//i.test(url)) throw new Error('WHOOP connect URL missing');
      awaitingWhoopReturn = true;
      await openWhoopAuthorize(url);
      ui.message = 'Finish Allow in WHOOP, then return here. This screen updates when it saves.';
      paint();
      pollWhoopLinked();
    } catch (err) {
      awaitingWhoopReturn = false;
      ui.message = err.code === 'auth_required' ? 'Sign in before connecting WHOOP' : (err.message || 'Connect failed');
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
      try { await api(FN.disconnect, { method: 'POST', query: { provider: 'whoop' } }); } catch (_) {}
      const w = st();
      w.connected = false; w.lastSyncAt = null; w.sampleDate = null; w.lastNormalized = null; w.source = null;
      clearIosTokens();
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
      ui.message = bits.length ? ('Synced: ' + bits.join(' · ')) : '';
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
    st().connected = false;
    clearIosTokens();
    if (typeof global.save === 'function') global.save();
    ui.message = '';
    if (typeof global.setTab === 'function') global.setTab('me');
    else renderPanels();
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
      if (!(await token())) return;
      await refreshStatus();
      if (!st().connected) return;
      await sync({ quiet: true });
    } catch (_) {}
  }
  global.Whoop = {
    cardHtml, metaLine, renderPanels, connectFormHtml, connectTotem, pokeHealthConnect, formatHealthConnectPoke, autoSyncIfPossible, hydrateAuth, syncAuthEmail,
    signIn, signOut, connect, sync, syncAll, disconnect, refreshStatus,
    uiMessage: function () { return ui.message || ''; },
    client, token, email, waitForSupabase, fnUrl, resolveProxyBase
  };
  bindNativeWhoopReturnWhenReady();
})(window);
