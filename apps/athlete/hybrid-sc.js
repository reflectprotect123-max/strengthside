(function (root) {
  const PRODUCT = 'The Engine';
  const SNAPSHOT_DOMAINS = {
    engine: ['engine_side', 'conditioning'],
  };

  function dateMap(keys) {
    const out = {};
    (keys || []).forEach((iso) => {
      if (iso) out[iso] = true;
    });
    return out;
  }

  function datesFromState(state) {
    const st = state || {};
    const lib = st.library || {};
    const assignments = lib.assignments && typeof lib.assignments === 'object' ? lib.assignments : {};
    const sessions = st.sessions && typeof st.sessions === 'object' ? st.sessions : {};
    return dateMap([...Object.keys(assignments), ...Object.keys(sessions)]);
  }

  function datesFromSnapshot(snapshot) {
    const snap = snapshot || {};
    const rows = Array.isArray(snap.sessions) ? snap.sessions : [];
    return dateMap(rows.map((row) => row && row.date).filter(Boolean));
  }

  function occupancy(engineDates) {
    return {
      engine: { ...(engineDates || {}) },
    };
  }

  function dotsHtml(iso, occ) {
    const map = occ || { engine: {} };
    if (map.engine && map.engine[iso]) return '<span class="cal-dot engine"></span>';
    return '';
  }

  function brandHtml() {
    return `
          <b>The Engine</b>
          <small class="home-lockers"><span class="on">Conditioning</span></small>`;
  }

  function lockerCardHtml() {
    return '';
  }

  function origins() {
    return { engine: './' };
  }

  function applyOccupancyToState(S, engineDates) {
    if (!S || typeof S !== 'object') return S;
    S.hybridOccupancy = occupancy(engineDates);
    return S;
  }

  const HybridSc = {
    PRODUCT,
    SNAPSHOT_DOMAINS,
    datesFromState,
    datesFromSnapshot,
    occupancy,
    dotsHtml,
    lockerCardHtml,
    brandHtml,
    origins,
    applyOccupancyToState,
  };

  root.HybridSc = HybridSc;
})(typeof window !== 'undefined' ? window : globalThis);
