/**
 * Athlete-side pull from THE-coach-bridge-v1 (local) + assigned_session (cloud).
 * Merges coach-published sessions into athlete calendar state.
 */
(function (global) {
  'use strict';

  var BRIDGE_KEY = 'THE-coach-bridge-v1';
  var status = { lastPullAt: null, lastCount: 0, lastError: '', lastCloud: 0 };

  function readBridge() {
    try {
      var raw = localStorage.getItem(BRIDGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  /** Demo default — Dan Veldman athlete account. */
  function defaultAthleteEmail() {
    return 'veldman@thehybrid.local';
  }

  function pickBucket(payload, email) {
    if (!payload || !payload.athletes) return null;
    email = String(email || defaultAthleteEmail()).toLowerCase();
    return (
      payload.athletes.find(function (a) {
        return String(a.email || '').toLowerCase() === email;
      }) || payload.athletes[0] || null
    );
  }

  function mergeSession(state, incoming) {
    if (!incoming || !incoming.coachSessionId) return false;
    var sessions = state.sessions || (state.sessions = []);
    var idx = sessions.findIndex(function (s) {
      return (
        s.coachSessionId === incoming.coachSessionId ||
        s.id === incoming.id ||
        (s.date === incoming.date &&
          s.templateId === incoming.templateId &&
          s.source === 'coach-bridge')
      );
    });
    if (idx >= 0) {
      var cur = sessions[idx];
      if (cur.status === 'active' || cur.status === 'completed') {
        if (incoming.status === 'completed' && cur.status !== 'completed') {
          sessions[idx] = Object.assign({}, incoming, { id: cur.id, coachSessionId: incoming.coachSessionId });
          return true;
        }
        return false;
      }
      sessions[idx] = Object.assign({}, incoming, { id: cur.id });
      return true;
    }
    sessions.push(incoming);
    return true;
  }

  function mergeNutrition(bucket) {
    if (!bucket || !bucket.nutrition) return;
    try {
      var KEY = 'hybrid-coach-nutrition-bridge-v1';
      localStorage.setItem(KEY, JSON.stringify(bucket.nutrition));
    } catch (_) {}
  }

  function pullLocal(state, opts) {
    opts = opts || {};
    var payload = readBridge();
    if (!payload) return { ok: true, merged: 0 };
    var bucket = pickBucket(payload, opts.email || defaultAthleteEmail());
    if (!bucket) return { ok: true, merged: 0 };
    var merged = 0;
    (bucket.sessions || []).forEach(function (s) {
      if (mergeSession(state, s)) merged++;
    });
    mergeNutrition(bucket);
    return { ok: true, merged: merged, bucket: bucket };
  }

  function pull(state, opts) {
    opts = opts || {};
    try {
      var local = pullLocal(state, opts);
      var merged = local.merged || 0;
      status.lastPullAt = new Date().toISOString();
      status.lastCount = merged;
      status.lastCloud = 0;
      status.lastError = '';
      return { ok: true, merged: merged, bucket: local.bucket };
    } catch (e) {
      status.lastError = String(e.message || e);
      return { ok: false, error: status.lastError };
    }
  }

  async function pullCloud(state) {
    if (!global.CoachCloud || !CoachCloud.pullForAthlete) return { ok: true, merged: 0 };
    try {
      var r = await CoachCloud.pullForAthlete(state);
      status.lastCloud = (r && r.merged) || 0;
      return r;
    } catch (e) {
      status.lastError = String(e.message || e);
      return { ok: false, error: status.lastError, merged: 0 };
    }
  }

  function schedulePull(state, opts) {
    if (!state) return;
    var r = pull(state, opts);
    if (r.ok && r.merged && typeof global.save === 'function') {
      global.save('coach-sync-pull');
    }
    // Cloud pull (async) — APK / signed-in path
    if (global.CoachCloud && CoachCloud.pullForAthlete) {
      pullCloud(state).then(function (cr) {
        if (cr && cr.ok && cr.merged && typeof global.save === 'function') {
          global.save('coach-sync-pull');
          if (typeof global.render === 'function' && !(global.S && global.S.tab === 'settings')) global.render();
        }
      });
    }
    return r;
  }

  function importPayload(payload, state, opts) {
    opts = opts || {};
    try {
      if (!payload || !payload.athletes) return { ok: false, error: 'invalid payload' };
      try {
        localStorage.setItem(BRIDGE_KEY, JSON.stringify(payload));
      } catch (_) {}
      return pull(state, opts);
    } catch (e) {
      return { ok: false, error: String(e.message || e) };
    }
  }

  global.CoachSync = {
    pull: pull,
    pullCloud: pullCloud,
    schedulePull: schedulePull,
    readBridge: readBridge,
    importPayload: importPayload,
    mergeSession: mergeSession,
    status: status,
    defaultAthleteEmail: defaultAthleteEmail,
    BRIDGE_KEY: BRIDGE_KEY,
  };
})(typeof window !== 'undefined' ? window : globalThis);
