/**
 * Strength cloud sync — athlete_domain_snapshots domain strength.
 * Local-first; mirrors nutrition-sync pattern.
 *
 * Snapshot v3: progression + completed strength sets + calendar sessions + templates
 * so web ↔ phone share schedule and library (same Supabase account).
 */
(function (global) {
  'use strict';

  var WRITER = 'html-athlete-strength';
  var DOMAIN = 'strength';
  var BASE_KEY = 'hybrid-strength-sync-base-v1';
  var STATUS_KEY = 'hybrid-strength-sync-status-v1';
  var SNAPSHOT_VERSION = 3;
  var MAX_COMPLETED_SESSIONS = 60;
  var MAX_TEMPLATES = 100;
  var MAX_PERFORMED = 40;

  var status = { lastSyncAt: null, lastError: '', lastOk: false, busy: false };

  // Persist last sync so Account does not flash "never" after every cold start.
  try {
    var rawStatus = localStorage.getItem(STATUS_KEY);
    if (rawStatus) {
      var s = JSON.parse(rawStatus);
      if (s && typeof s === 'object') {
        if (s.lastSyncAt) status.lastSyncAt = s.lastSyncAt;
        if (typeof s.lastError === 'string') status.lastError = s.lastError;
        if (typeof s.lastOk === 'boolean') status.lastOk = s.lastOk;
      }
    }
  } catch (_) {}

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

  function entityUpdatedAt(rec) {
    if (!rec || typeof rec !== 'object') return 0;
    var meta = rec._meta && rec._meta.updatedAt;
    if (meta != null) {
      var m = Date.parse(String(meta));
      if (Number.isFinite(m)) return m;
    }
    if (rec.completedAt != null) {
      var c = completedAtMs(rec);
      if (c) return c;
    }
    if (rec.updatedAt != null) {
      var n = Number(rec.updatedAt);
      if (Number.isFinite(n) && n > 0) return n;
      var p = Date.parse(String(rec.updatedAt));
      if (Number.isFinite(p)) return p;
    }
    if (rec.createdAt != null) {
      var cn = Number(rec.createdAt);
      if (Number.isFinite(cn) && cn > 0) return cn;
      var cp = Date.parse(String(rec.createdAt));
      if (Number.isFinite(cp)) return cp;
    }
    return 0;
  }

  function stampExportMeta(rec, entity, exportedAt) {
    if (!rec || typeof rec !== 'object') return rec;
    var out = Object.assign({}, rec);
    out._meta = Object.assign({}, rec._meta || {});
    out._meta.entity = out._meta.entity || entity;
    out._meta.localId = out._meta.localId || out.id;
    out._meta.updatedAt = out._meta.updatedAt || exportedAt;
    out._meta.createdAt = out._meta.createdAt || out._meta.updatedAt;
    out._meta.version = num(out._meta.version) || 1;
    return out;
  }

  function isStrengthTask(task) {
    return task && (task.kind === 'strength' || task.kind === 'superset');
  }

  function performedSessionsFromState(state) {
    return (state.sessions || [])
      .filter(function (s) { return s && s.status === 'completed'; })
      .slice(-MAX_PERFORMED)
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

  function calendarSessionsFromState(state, exportedAt) {
    var sessions = state.sessions || [];
    var live = sessions.filter(function (s) {
      return s && s.id && s.status !== 'abandoned';
    });
    var open = live.filter(function (s) {
      return s.status === 'scheduled' || s.status === 'active';
    });
    var done = live
      .filter(function (s) { return s.status === 'completed'; })
      .slice()
      .sort(function (a, b) { return completedAtMs(a) - completedAtMs(b); });
    if (done.length > MAX_COMPLETED_SESSIONS) {
      done = done.slice(done.length - MAX_COMPLETED_SESSIONS);
    }
    var map = {};
    done.concat(open).forEach(function (s) {
      map[s.id] = stampExportMeta(s, 'sessions', exportedAt);
    });
    return Object.keys(map).map(function (k) { return map[k]; });
  }

  function templatesFromState(state, exportedAt) {
    return (state.templates || [])
      .filter(function (t) { return t && t.id; })
      .slice(0, MAX_TEMPLATES)
      .map(function (t) { return stampExportMeta(t, 'templates', exportedAt); });
  }

  function mergeByUpdatedAt(localList, remoteList) {
    var map = {};
    (localList || []).concat(remoteList || []).forEach(function (item) {
      if (!item || !item.id) return;
      var cur = map[item.id];
      if (!cur || entityUpdatedAt(item) >= entityUpdatedAt(cur)) map[item.id] = item;
    });
    return Object.keys(map).map(function (k) { return map[k]; });
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
    if (merged.length > MAX_PERFORMED) merged = merged.slice(merged.length - MAX_PERFORMED);
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

  function applyEntityList(state, key, incoming) {
    if (!incoming || !incoming.length) return;
    state[key] = state[key] || [];
    var byId = {};
    state[key].forEach(function (item, i) {
      if (item && item.id) byId[item.id] = i;
    });
    incoming.forEach(function (remote) {
      if (!remote || !remote.id) return;
      var idx = byId[remote.id];
      if (idx == null) {
        state[key].push(remote);
        byId[remote.id] = state[key].length - 1;
        return;
      }
      var local = state[key][idx];
      if (entityUpdatedAt(remote) > entityUpdatedAt(local)) {
        state[key][idx] = remote;
      }
    });
  }

  function snapshotFromState(state) {
    state = state || {};
    if (global.StrengthAdapter && global.StrengthAdapter.ensureStrengthState) {
      global.StrengthAdapter.ensureStrengthState(state);
    }
    var exportedAt = new Date().toISOString();
    return {
      snapshotVersion: SNAPSHOT_VERSION,
      exportedAt: exportedAt,
      strengthState: state.strengthState || { workingMaxEvents: [], prEvents: [], loadHints: {} },
      progressionAudit: ((state.meta && state.meta.progressionAudit) || []).slice(-200),
      performedSessions: performedSessionsFromState(state),
      calendarSessions: calendarSessionsFromState(state, exportedAt),
      templates: templatesFromState(state, exportedAt),
    };
  }

  function applySnapshot(state, snap) {
    if (!snap) return state;
    state.strengthState = snap.strengthState || state.strengthState || { workingMaxEvents: [], prEvents: [], loadHints: {} };
    state.meta = state.meta || {};
    state.meta.progressionAudit = snap.progressionAudit || state.meta.progressionAudit || [];
    applyEntityList(state, 'sessions', snap.calendarSessions || []);
    applyEntityList(state, 'templates', snap.templates || []);
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
      calendarSessions: mergeByUpdatedAt(localSnap.calendarSessions, remoteSnap.calendarSessions),
      templates: mergeByUpdatedAt(localSnap.templates, remoteSnap.templates),
    };
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

  async function bootstrap() {
    if (!(await isSignedIn()) || !global.S) return;
    try {
      // reconcile mutates S in place — always persist so calendar/templates land on disk
      await reconcile(global.S);
      if (typeof global.save === 'function') global.save('strength-sync-pull');
      if (typeof global.render === 'function' && !(global.S && global.S.active)) {
        try { global.render(); } catch (_) {}
      }
    } catch (_) {}
  }

  global.StrengthSync = {
    WRITER: WRITER,
    DOMAIN: DOMAIN,
    SNAPSHOT_VERSION: SNAPSHOT_VERSION,
    snapshotFromState: snapshotFromState,
    applySnapshot: applySnapshot,
    mergeSnapshots: mergeSnapshots,
    entityUpdatedAt: entityUpdatedAt,
    isSignedIn: isSignedIn,
    pushStrength: pushStrength,
    reconcile: reconcile,
    bootstrap: bootstrap,
    schedulePush: schedulePush,
    getStatus: getStatus,
  };
})(typeof window !== 'undefined' ? window : globalThis);
