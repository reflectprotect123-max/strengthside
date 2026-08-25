/**
 * Strength progression cloud sync — athlete_domain_snapshots domain strength.
 * Local-first; mirrors nutrition-sync pattern.
 */
(function (global) {
  'use strict';

  var WRITER = 'html-athlete-strength';
  var DOMAIN = 'strength';
  var BASE_KEY = 'hybrid-strength-sync-base-v1';
  var SNAPSHOT_VERSION = 2;

  var status = { lastSyncAt: null, lastError: '', lastOk: false, busy: false };

  function num(v) {
    var n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  function client() {
    if (global.Whoop && typeof global.Whoop.client === 'function') return global.Whoop.client();
    throw new Error('Supabase client unavailable — sign in first.');
  }

  async function sessionUserId() {
    var data = await client().auth.getSession();
    if (data.error) throw data.error;
    return (data.data.session && data.data.session.user && data.data.session.user.id) || null;
  }

  async function isSignedIn() {
    try { return !!(await sessionUserId()); } catch (_) { return false; }
  }

  function loadBase() {
    try {
      var raw = localStorage.getItem(BASE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  }

  function saveBase(base) {
    try {
      if (base) localStorage.setItem(BASE_KEY, JSON.stringify(base));
      else localStorage.removeItem(BASE_KEY);
    } catch (_) {}
  }

  function fp(snapshot) {
    return JSON.stringify(snapshot);
  }

  function completedAtMs(session) {
    var v = session && session.completedAt;
    if (v == null) return 0;
    var n = Number(v);
    return Number.isFinite(n) ? n : Date.parse(String(v)) || 0;
  }

  function isStrengthTask(task) {
    return task && (task.kind === 'strength' || task.kind === 'superset');
  }

  function performedSessionsFromState(state) {
    return (state.sessions || [])
      .filter(function (s) { return s.status === 'completed'; })
      .slice(-40)
      .map(function (s) {
        return {
          id: s.id,
          date: s.date,
          name: s.name,
          completedAt: s.completedAt,
          tasks: (s.tasks || []).filter(isStrengthTask),
        };
      });
  }

  function mergePerformedSessions(localList, remoteList) {
    var map = {};
    (localList || []).concat(remoteList || []).forEach(function (s) {
      if (!s || !s.id) return;
      var cur = map[s.id];
      if (!cur || completedAtMs(s) > completedAtMs(cur)) map[s.id] = s;
    });
    var merged = Object.keys(map).map(function (k) { return map[k]; });
    merged.sort(function (a, b) { return completedAtMs(a) - completedAtMs(b); });
    if (merged.length > 40) merged = merged.slice(merged.length - 40);
    return merged;
  }

  function applyPerformedSessions(state, incoming) {
    if (!incoming || !incoming.length) return;
    state.sessions = state.sessions || [];
    var byId = {};
    state.sessions.forEach(function (s, i) {
      if (s && s.id) byId[s.id] = i;
    });
    incoming.forEach(function (remote) {
      if (!remote || !remote.id) return;
      var idx = byId[remote.id];
      if (idx == null) {
        state.sessions.push(Object.assign({}, remote, { status: 'completed' }));
        byId[remote.id] = state.sessions.length - 1;
        return;
      }
      var local = state.sessions[idx];
      if (!local || local.status !== 'completed') return;
      if (completedAtMs(local) >= completedAtMs(remote)) return;
      var preserved = (local.tasks || []).filter(function (t) { return !isStrengthTask(t); });
      state.sessions[idx] = Object.assign({}, local, {
        date: remote.date != null ? remote.date : local.date,
        name: remote.name != null ? remote.name : local.name,
        completedAt: remote.completedAt,
        status: 'completed',
        tasks: preserved.concat(remote.tasks || []),
      });
    });
  }

  function snapshotFromState(state) {
    state = state || {};
    if (global.StrengthAdapter && global.StrengthAdapter.ensureStrengthState) global.StrengthAdapter.ensureStrengthState(state);
    return {
      snapshotVersion: SNAPSHOT_VERSION,
      exportedAt: new Date().toISOString(),
      strengthState: state.strengthState || { workingMaxEvents: [], prEvents: [], loadHints: {} },
      progressionAudit: ((state.meta && state.meta.progressionAudit) || []).slice(-200),
      performedSessions: performedSessionsFromState(state),
    };
  }

  function applySnapshot(state, snap) {
    if (!snap) return state;
    state.strengthState = snap.strengthState || state.strengthState || { workingMaxEvents: [], prEvents: [], loadHints: {} };
    state.meta = state.meta || {};
    state.meta.progressionAudit = snap.progressionAudit || state.meta.progressionAudit || [];
    applyPerformedSessions(state, snap.performedSessions || []);
    return state;
  }

  function mergeSnapshots(localSnap, remoteSnap) {
    localSnap = localSnap || { strengthState: {}, progressionAudit: [] };
    remoteSnap = remoteSnap || { strengthState: {}, progressionAudit: [] };
    var local = localSnap.strengthState || {};
    var remote = remoteSnap.strengthState || {};

    var wmByEx = {};
    (local.workingMaxEvents || []).concat(remote.workingMaxEvents || []).forEach(function (e) {
      if (!e || !e.exerciseId) return;
      var cur = wmByEx[e.exerciseId];
      if (!cur || String(e.effectiveAt) > String(cur.effectiveAt)) wmByEx[e.exerciseId] = e;
    });

    var prBest = {};
    (local.prEvents || []).concat(remote.prEvents || []).forEach(function (p) {
      if (!p || !p.exerciseId) return;
      var key = p.exerciseId + ':' + p.repCount;
      var cur = prBest[key];
      if (!cur || num(p.valueKg) > num(cur.valueKg)) prBest[key] = p;
    });

    var hints = Object.assign({}, remote.loadHints || {}, local.loadHints || {});
    Object.keys(hints).forEach(function (id) {
      var l = (local.loadHints || {})[id];
      var r = (remote.loadHints || {})[id];
      if (l && r) hints[id] = String(l.updatedAt) >= String(r.updatedAt) ? l : r;
    });

    var auditMap = {};
    (remoteSnap.progressionAudit || []).concat(localSnap.progressionAudit || []).forEach(function (a) {
      if (!a) return;
      var key = String(a.at) + ':' + String(a.exerciseId) + ':' + String(a.action);
      auditMap[key] = a;
    });
    var audit = Object.keys(auditMap).map(function (k) { return auditMap[k]; });
    audit.sort(function (a, b) { return String(a.at).localeCompare(String(b.at)); });
    if (audit.length > 200) audit = audit.slice(audit.length - 200);

    return {
      snapshotVersion: SNAPSHOT_VERSION,
      exportedAt: new Date().toISOString(),
      strengthState: {
        workingMaxEvents: Object.keys(wmByEx).map(function (k) { return wmByEx[k]; }),
        prEvents: Object.keys(prBest).map(function (k) { return prBest[k]; }),
        loadHints: hints,
      },
      progressionAudit: audit,
      performedSessions: mergePerformedSessions(localSnap.performedSessions, remoteSnap.performedSessions),
    };
  }

  function setStatus(patch) {
    Object.assign(status, patch || {});
  }

  function getStatus() {
    return Object.assign({}, status);
  }

  async function pullRemote() {
    var uid = await sessionUserId();
    if (!uid) return null;
    var res = await client()
      .from('athlete_domain_snapshots')
      .select('schema_version,revision,writer,snapshot,client_updated_at')
      .eq('user_id', uid)
      .eq('domain', DOMAIN)
      .maybeSingle();
    if (res.error) throw res.error;
    if (!res.data) return null;
    return {
      revision: res.data.revision,
      writer: res.data.writer,
      updatedAt: Date.parse(res.data.client_updated_at) || Date.now(),
      snapshot: res.data.snapshot,
    };
  }

  async function pushSnapshot(snapshot, revision) {
    var now = Date.now();
    var res = await client().rpc('upsert_athlete_domain_snapshot', {
      p_domain: DOMAIN,
      p_schema_version: SNAPSHOT_VERSION,
      p_revision: revision,
      p_writer: WRITER,
      p_client_updated_at: new Date(now).toISOString(),
      p_snapshot: snapshot,
    });
    if (res.error) throw res.error;
    return { wrote: res.data !== false, revision: revision, now: now };
  }

  async function pushStrength(state) {
    var uid = await sessionUserId();
    if (!uid) return { ok: false, reason: 'auth_required' };

    setStatus({ busy: true, lastError: '' });
    try {
      var snap = snapshotFromState(state);
      var base = loadBase();
      var prevRev = base && Number.isFinite(base.revision) ? base.revision : 0;
      var same = base && base.localFp === fp(snap);
      var revision = same ? prevRev : prevRev + 1;

      var result = await pushSnapshot(snap, revision);
      if (!result.wrote) {
        var remote = await pullRemote();
        if (remote) {
          revision = remote.revision + 1;
          result = await pushSnapshot(snap, revision);
        }
      }
      if (!result.wrote) {
        setStatus({ busy: false, lastOk: false, lastError: 'stale_revision' });
        return { ok: false, reason: 'stale_revision' };
      }
      saveBase({ revision: result.revision, updatedAt: result.now, localFp: fp(snap) });
      setStatus({ busy: false, lastOk: true, lastSyncAt: new Date().toISOString(), lastError: '' });
      return { ok: true, revision: result.revision };
    } catch (e) {
      setStatus({ busy: false, lastOk: false, lastError: (e && e.message) || 'sync failed' });
      throw e;
    }
  }

  async function reconcile(state) {
    if (!(await isSignedIn())) return state;
    setStatus({ busy: true });
    var remote;
    try {
      remote = await pullRemote();
    } catch (e) {
      setStatus({ busy: false, lastError: (e && e.message) || 'pull failed' });
      return state;
    }
    if (!remote || !remote.snapshot) {
      try { await pushStrength(state); } catch (_) {}
      return state;
    }
    var localSnap = snapshotFromState(state);
    var remoteSnap = remote.snapshot;
    var remoteFp = fp(remoteSnap);
    var localFp = fp(localSnap);
    if (remoteFp === localFp) {
      setStatus({ busy: false, lastOk: true, lastSyncAt: new Date().toISOString() });
      saveBase({ revision: remote.revision, updatedAt: remote.updatedAt, localFp: localFp });
      return state;
    }
    var mergedSnap = mergeSnapshots(localSnap, remoteSnap);
    applySnapshot(state, mergedSnap);
    try { await pushStrength(state); } catch (_) {}
    setStatus({ busy: false, lastOk: true, lastSyncAt: new Date().toISOString() });
    return state;
  }

  var pushTimer = null;
  function schedulePush(state) {
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(function () {
      isSignedIn().then(function (ok) {
        if (ok) pushStrength(state || global.S).catch(function () {});
      });
    }, 800);
  }

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function cardHtml() {
    var s = getStatus();
    var last = s.lastSyncAt ? new Date(s.lastSyncAt).toLocaleString() : 'Never';
    var line = s.lastError ? 'Last error: ' + s.lastError : s.lastOk ? 'Cloud sync OK · ' + last : 'Sign in (WHOOP) to sync strength progression. Last: ' + last;
    return '<div class=card><div class=eyebrow>Strength cloud</div><div class=title>Progression sync</div><div class=meta>' + esc(line) + '</div>' +
      '<div class=btns style="margin-top:12px"><button type="button" class="btn small primary" onclick="StrengthSync.syncNow()">Sync now</button></div></div>';
  }

  async function syncNow() {
    if (!(await isSignedIn())) {
      global.alert('Sign in under WHOOP first — strength uses the same Supabase account.');
      return;
    }
    try {
      if (global.S) global.S = await reconcile(global.S);
      if (typeof global.save === 'function') global.save('strength-sync');
      global.alert(getStatus().lastOk ? 'Strength progression synced.' : 'Sync finished: ' + (getStatus().lastError || 'unknown'));
      if (typeof global.settings === 'function') global.settings();
    } catch (e) {
      global.alert((e && e.message) || 'Sync failed');
    }
  }

  async function bootstrap() {
    if (!(await isSignedIn()) || !global.S) return;
    try {
      var merged = await reconcile(global.S);
      if (merged && merged !== global.S) {
        global.S = merged;
        if (typeof global.save === 'function') global.save('strength-sync-pull');
      }
    } catch (_) {}
  }

  global.StrengthSync = {
    WRITER: WRITER,
    DOMAIN: DOMAIN,
    snapshotFromState: snapshotFromState,
    applySnapshot: applySnapshot,
    mergeSnapshots: mergeSnapshots,
    isSignedIn: isSignedIn,
    pushStrength: pushStrength,
    reconcile: reconcile,
    bootstrap: bootstrap,
    schedulePush: schedulePush,
    getStatus: getStatus,
    cardHtml: cardHtml,
    syncNow: syncNow,
  };
})(typeof window !== 'undefined' ? window : globalThis);
