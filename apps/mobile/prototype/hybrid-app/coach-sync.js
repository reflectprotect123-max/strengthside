/**
 * Athlete-side pull from THE-coach-bridge-v1 (R10).
 * Merges coach-published sessions into athlete calendar state.
 */
(function (global) {
  'use strict';

  var BRIDGE_KEY = 'THE-coach-bridge-v1';
  var status = { lastPullAt: null, lastCount: 0, lastError: '' };

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

  function pull(state, opts) {
    opts = opts || {};
    try {
      var payload = readBridge();
      if (!payload) {
        status.lastPullAt = new Date().toISOString();
        status.lastCount = 0;
        status.lastError = '';
        return { ok: true, merged: 0 };
      }
      var bucket = pickBucket(payload, opts.email || defaultAthleteEmail());
      if (!bucket) {
        status.lastPullAt = new Date().toISOString();
        status.lastCount = 0;
        return { ok: true, merged: 0 };
      }
      var merged = 0;
      (bucket.sessions || []).forEach(function (s) {
        if (mergeSession(state, s)) merged++;
      });
      mergeNutrition(bucket);
      status.lastPullAt = new Date().toISOString();
      status.lastCount = merged;
      status.lastError = '';
      return { ok: true, merged: merged, bucket: bucket };
    } catch (e) {
      status.lastError = String(e.message || e);
      return { ok: false, error: status.lastError };
    }
  }

  function schedulePull(state, opts) {
    if (!state) return;
    var r = pull(state, opts);
    if (r.ok && r.merged && typeof global.save === 'function') {
      global.save('coach-sync-pull');
    }
    return r;
  }

  global.CoachSync = {
    pull: pull,
    schedulePull: schedulePull,
    readBridge: readBridge,
    status: status,
    defaultAthleteEmail: defaultAthleteEmail,
    BRIDGE_KEY: BRIDGE_KEY,
  };
})(typeof window !== 'undefined' ? window : globalThis);
