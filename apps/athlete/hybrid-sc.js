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
    const lib = root.HybridLibrary ? root.HybridLibrary.ensure(st.library) : (st.library || {});
    const assignments = lib.assignments || {};
    const templates = new Map((lib.templates || []).map(t => [t.id, t]));
    const plans = st.trainingPlans || {};
    // A dot means Training has a scheduled plan. Saved logs belong to history;
    // opening a logger must not keep a deleted template on the calendar.
    const dates = new Set([...Object.keys(assignments), ...Object.keys(plans)]);
    return dateMap([...dates].filter(date => {
      const template = templates.get(assignments[date]);
      const blocks = template ? template.blocks : plans[date]?.blocks;
      return Array.isArray(blocks) && blocks.length > 0;
    }));
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
      <div class="eyebrow">HYBRID S&amp;C</div>
      <p class="stub">One login. Strength and Engine stay in their own lockers.</p>
      <div class="locker-switch" role="group" aria-label="Locker">
        <button type="button" class="btn primary" aria-pressed="true" onclick="switchHybridLocker('strength')">Strength</button>
        <button type="button" class="btn" aria-pressed="false" onclick="switchHybridLocker('engine')">Engine</button>
      </div>
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
