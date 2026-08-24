/**
 * Concept2 Logbook bridge — OAuth tokens stay on THE-HYBRID-ENGINE1.
 * Same Hybrid Supabase account as WHOOP; this page proxies + imports locally.
 */
(function (global) {
  const SUPABASE_URL = 'https://orysjncrksmdfabpuftd.supabase.co';
  const SUPABASE_ANON =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yeXNqbmNya3NtZGZhYnB1ZnRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0MTE4NzksImV4cCI6MjA5OTk4Nzg3OX0.GTMBfFtH5O6SikzHo75sXGIZoEhmuJ7TvXiACd7T078';
  const ATHLETE_NETLIFY = 'https://thehybridsystem.netlify.app';
  const FN = {
    connect: '/.netlify/functions/concept2-connect',
    sync: '/.netlify/functions/concept2-sync',
    status: '/.netlify/functions/integrations-status',
    disconnect: '/.netlify/functions/integrations-disconnect',
  };
  function resolveProxyBase() {
    try {
      const loc = global.location;
      if (!loc || !loc.hostname) return ATHLETE_NETLIFY;
      const host = String(loc.hostname).toLowerCase();
      if (host === 'thehybridsystem.netlify.app') return '';
      if (loc.protocol === 'file:' || loc.protocol === 'capacitor:') return ATHLETE_NETLIFY;
      if (host === 'localhost' || host === '127.0.0.1') return ATHLETE_NETLIFY;
      if (host.endsWith('.github.io')) return ATHLETE_NETLIFY;
      return ATHLETE_NETLIFY;
    } catch (_) {
      return ATHLETE_NETLIFY;
    }
  }
  function fnUrl(path, query) {
    const q = query ? '?' + new URLSearchParams(query) : '';
    const rel = path + q;
    const base = resolveProxyBase();
    return base ? base.replace(/\/$/, '') + rel : rel;
  }
  let sb = null;
  const ui = { busy: false, message: '' };

  function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]),
    );
  }
  function client() {
    if (sb) return sb;
    if (!global.supabase || !global.supabase.createClient) throw new Error('Supabase SDK failed to load');
    sb = global.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: global.localStorage,
      },
    });
    return sb;
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
    } catch (_) {
      return null;
    }
  }
  async function api(path, opts) {
    opts = opts || {};
    const method = opts.method || 'GET';
    const t = await token();
    if (!t) {
      const e = new Error('Sign in to use Concept2');
      e.code = 'auth_required';
      throw e;
    }
    const url = fnUrl(path, opts.query);
    const res = await fetch(url, {
      method,
      headers: { authorization: 'Bearer ' + t, accept: 'application/json' },
      cache: 'no-store',
    });
    let body = null;
    try {
      body = await res.json();
    } catch (_) {
      body = null;
    }
    if (!res.ok) {
      const e = new Error(
        (body && (body.error || body.message)) || 'Concept2 request failed (' + res.status + ')',
      );
      e.status = res.status;
      e.body = body;
      throw e;
    }
    return body;
  }
  function appState() {
    if (global.S && typeof global.S === 'object') return global.S;
    return null;
  }
  function st() {
    const S = appState() || (global.S = global.S || {});
    S.settings = S.settings || {};
    S.settings.concept2 = S.settings.concept2 || {
      connected: false,
      lastSyncAt: null,
      resultCount: 0,
      email: null,
      lastSummary: '',
    };
    return S.settings.concept2;
  }
  function metaLine() {
    const c = st();
    if (!c.connected) return 'Not connected — Logbook import is optional';
    const when = c.lastSyncAt ? new Date(c.lastSyncAt).toLocaleString() : 'never';
    return 'Connected · ' + (c.resultCount || 0) + ' results cached · synced ' + when;
  }
  function cardHtml() {
    const c = st();
    const busy = ui.busy ? ' disabled' : '';
    const msg = ui.message ? '<div class=meta style="margin-top:8px">' + esc(ui.message) + '</div>' : '';
    if (!c.email) {
      return (
        '<div class=card id=concept2Card><div class=eyebrow>Concept2</div><div class=title>Logbook import</div>' +
        '<div class=meta>Sign in with the same THE Hybrid Engine account (WHOOP card above). Tokens stay on the hybrid backend.</div>' +
        '<div class=meta style="margin-top:8px">After sign-in, reconnect here to authorize Logbook.</div>' +
        msg +
        '</div>'
      );
    }
    const actions = c.connected
      ? '<button class="btn primary" onclick="Concept2.sync()"' +
        busy +
        '>Sync Logbook</button><button class="btn" onclick="Concept2.disconnect()"' +
        busy +
        '>Disconnect</button>'
      : '<button class="btn primary" onclick="Concept2.connect()"' + busy + '>Connect Concept2</button>';
    return (
      '<div class=card id=concept2Card><div class=eyebrow>Concept2</div><div class=title>' +
      (c.connected ? 'Connected' : 'Not connected') +
      '</div>' +
      '<div class=meta>' +
      esc(c.email) +
      '<br>' +
      esc(metaLine()) +
      (c.lastSummary ? '<br>' + esc(c.lastSummary) : '') +
      '</div>' +
      '<div class=btns style="margin-top:12px">' +
      actions +
      '</div>' +
      msg +
      '<div class=meta style="margin-top:10px">Imports become conditioning history only — never overwrites Hybrid Strength.</div></div>'
    );
  }
  function renderPanels() {
    const card = document.getElementById('concept2Card');
    if (card) {
      const wrap = document.createElement('div');
      wrap.innerHTML = cardHtml();
      card.replaceWith(wrap.firstChild);
    }
  }
  async function refreshStatus() {
    const body = await api(FN.status);
    const c2 = (body && body.concept2) || {};
    const c = st();
    c.connected = !!c2.connected;
    c.lastSyncAt = c2.lastSyncAt || c.lastSyncAt;
    c.resultCount = c2.resultCount != null ? c2.resultCount : c.resultCount;
    c.email = await email();
    if (typeof global.save === 'function') global.save();
    return body;
  }
  function refreshVisibleUi() {
    renderPanels();
    const tab = (appState() && appState().tab) || null;
    if (tab === 'settings' && typeof global.settings === 'function') global.settings();
    else if (typeof global.render === 'function') global.render();
  }
  function applyImport(normalized) {
    if (!(global.EngineAdapter && typeof global.EngineAdapter.applyConcept2Results === 'function')) {
      return { attached: 0, enriched: 0, standalone: 0, skipped: 0, summary: 'Engine adapter missing' };
    }
    const S = appState();
    if (!S) return { attached: 0, enriched: 0, standalone: 0, skipped: 0, summary: 'App state missing' };
    const counts = global.EngineAdapter.applyConcept2Results(S, normalized || []);
    if (typeof global.save === 'function') global.save();
    return counts;
  }
  async function sync(opts) {
    opts = opts || {};
    if (ui.busy) return;
    ui.busy = true;
    ui.message = 'Syncing Concept2…';
    renderPanels();
    try {
      const body = await api(FN.sync, opts.backfill ? { query: { backfill: '1' } } : undefined);
      const list = Array.isArray(body && body.normalized) ? body.normalized : [];
      const counts = applyImport(list);
      const c = st();
      c.connected = true;
      c.lastSyncAt = (body && body.syncedAt) || new Date().toISOString();
      c.resultCount = list.length;
      c.lastSummary =
        (global.HybridEngine &&
          global.HybridEngine.Concept2 &&
          global.HybridEngine.Concept2.concept2ImportSummary(counts)) ||
        counts.summary ||
        '';
      if (typeof global.save === 'function') global.save();
      try {
        await refreshStatus();
      } catch (_) {}
      ui.message = c.lastSummary || (list.length ? 'Concept2 synced' : 'Concept2 reached — nothing new');
      ui.busy = false;
      refreshVisibleUi();
    } catch (err) {
      if (err.status === 401) {
        st().connected = false;
        ui.message = 'Concept2 not connected — tap Connect Concept2';
      } else if (err.code === 'auth_required') {
        ui.message = 'Sign in (WHOOP card) to sync Concept2';
      } else {
        ui.message = err.message || 'Concept2 sync failed';
      }
      throw err;
    } finally {
      ui.busy = false;
      renderPanels();
    }
  }
  async function connect() {
    if (ui.busy) return;
    ui.busy = true;
    ui.message = 'Opening Concept2…';
    renderPanels();
    try {
      const body = await api(FN.connect, { query: { client: 'native' } });
      const url = body && typeof body.authorizeUrl === 'string' ? body.authorizeUrl : '';
      if (!/^https:\/\//i.test(url)) throw new Error('Concept2 connect URL missing');
      global.open(url, '_blank', 'noopener');
      ui.message = 'Finish Logbook consent, then tap Sync Logbook';
      const onFocus = async function () {
        global.removeEventListener('focus', onFocus);
        try {
          await refreshStatus();
          if (st().connected) await sync({ backfill: true });
        } catch (err) {
          ui.message = err.message || 'Could not finish Concept2 connect';
          renderPanels();
        }
      };
      global.addEventListener('focus', onFocus);
    } catch (err) {
      ui.message =
        err.code === 'auth_required'
          ? 'Sign in (WHOOP card) before connecting Concept2'
          : err.message || 'Connect failed';
      throw err;
    } finally {
      ui.busy = false;
      renderPanels();
    }
  }
  async function disconnect() {
    if (ui.busy) return;
    if (!global.confirm('Disconnect Concept2 Logbook for this account?')) return;
    ui.busy = true;
    ui.message = 'Disconnecting…';
    renderPanels();
    try {
      await api(FN.disconnect, { method: 'POST', query: { provider: 'concept2' } });
      const c = st();
      c.connected = false;
      c.lastSyncAt = null;
      c.resultCount = 0;
      c.lastSummary = '';
      if (typeof global.save === 'function') global.save();
      ui.message = 'Concept2 disconnected';
    } catch (err) {
      ui.message = err.message || 'Disconnect failed';
    } finally {
      ui.busy = false;
      renderPanels();
    }
  }
  (async function hydrate() {
    try {
      const em = await email();
      if (em) {
        st().email = em;
        if (typeof global.save === 'function') global.save();
      }
    } catch (_) {}
  })();

  global.Concept2 = {
    cardHtml,
    metaLine,
    renderPanels,
    connect,
    sync,
    disconnect,
    refreshStatus,
  };
})(window);
