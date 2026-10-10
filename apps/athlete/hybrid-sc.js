(function (root) {
  const PRODUCT = 'HYBRID STRENGTH';
  const SNAPSHOT_DOMAINS = {
    strength: ['strength_side', 'strength'],
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

  function occupancy(strengthDates) {
    return {
      strength: { ...(strengthDates || {}) },
    };
  }

  function dotsHtml(iso, occ) {
    const map = occ || { strength: {} };
    const bits = [];
    if (map.strength && map.strength[iso]) bits.push('<span class="cal-dot strength"></span>');
    return bits.join('');
  }

  function brandHtml() {
    return `
          <b>HYBRID STRENGTH</b>`;
  }

  function lockerCardHtml() {
    return `
    <div class="card account-compact locker-card">
      <div class="eyebrow">HYBRID STRENGTH</div>
      <p class="stub">Strength training, sessions and progress.</p>
    </div>`;
  }

  function applyOccupancyToState(S, strengthDates) {
    if (!S || typeof S !== 'object') return S;
    S.hybridOccupancy = occupancy(strengthDates);
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
    applyOccupancyToState,
  };

  root.HybridSc = HybridSc;
})(typeof window !== 'undefined' ? window : globalThis);
