/** One stored session per assigned workout ("slot"), so two sessions on one day never merge. */
(function (root) {
  const keyOf = (s) => (s && (s.slotKey || s.date)) || '';
  const dateOf = (key) => String(key || '').split('#')[0];
  const hasLogged = (s) => Object.values((s && s.logs) || {}).some((l) => (l.sets || []).some((r) => r && r.logged));
  function find(sessions, key) {
    const all = sessions || {};
    if (all[key]) return all[key];
    // Legacy: before slots, a day's session lived under its date.
    const legacy = all[dateOf(key)];
    return legacy && !legacy.slotKey && key === dateOf(key) ? legacy : null;
  }
  function store(sessions, s) {
    if (!sessions || !s || !s.date) return sessions;
    const key = keyOf(s);
    if (key !== s.date && sessions[s.date] && sessions[s.date].id === s.id) delete sessions[s.date];
    sessions[key] = s;
    return sessions;
  }
  function statusOf(s) {
    if (!s) return 'start';
    return s.phase === 'summary' ? 'done' : 'resume';
  }
  const status = (sessions, key) => statusOf(find(sessions, key));
  const buttonLabel = (st) => ({ start: 'Start Session', resume: 'Resume Session', done: 'View summary' })[st] || 'Start Session';
  function history(sessions) {
    return Object.entries(sessions || {})
      .filter(([, s]) => s && (s.phase === 'summary' || hasLogged(s)))
      .map(([key, s]) => ({ key, session: s, status: statusOf(s) }))
      .sort((a, b) => String(b.session.date || '').localeCompare(String(a.session.date || '')) || (b.session.startedAt || 0) - (a.session.startedAt || 0));
  }
  function discard(state, key) {
    const s = state && state.sessions && state.sessions[key];
    if (!s) return null;
    delete state.sessions[key];
    if (state.session && state.session.id === s.id) { state.session = null; state.loggerOpen = false; }
    return s;
  }
  root.HybridSlots = { keyOf, dateOf, find, store, status, statusOf, buttonLabel, history, discard, hasLogged };
})(typeof window !== 'undefined' ? window : globalThis);
