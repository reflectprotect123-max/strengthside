(function (root) {
  const PRODUCT = 'HYBRID S&C';
  const SNAPSHOT_DOMAINS = {
    strength: ['strength_side', 'strength'],
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

  function occupancy(strengthDates, engineDates) {
    return {
      strength: { ...(strengthDates || {}) },
      engine: { ...(engineDates || {}) },
    };
  }

  function dotsHtml(iso, occ) {
    const map = occ || { strength: {}, engine: {} };
    const bits = [];
    if (map.strength && map.strength[iso]) bits.push('<span class="cal-dot strength"></span>');
    if (map.engine && map.engine[iso]) bits.push('<span class="cal-dot engine"></span>');
    return bits.join('');
  }

  function brandHtml(active) {
    const strengthOn = active === 'strength' ? ' class="on"' : '';
    const engineOn = active === 'engine' ? ' class="on"' : '';
    return `
          <b>HYBRID S&amp;C</b>
          <small class="home-lockers"><span${strengthOn}>Strength</span><i>|</i><span${engineOn}>Engine</span></small>`;
  }

  function lockerCardHtml(active) {
    const sOn = active === 'strength' ? ' primary' : '';
    const eOn = active === 'engine' ? ' primary' : '';
    return `
    <div class="card account-compact locker-card">
      <div class="eyebrow">HYBRID S&amp;C</div>
      <p class="stub">One login. Strength and Engine stay in their own lockers.</p>
      <div class="locker-switch" role="group" aria-label="Locker">
        <button type="button" class="btn${sOn}" aria-pressed="${active === 'strength'}" onclick="switchHybridLocker('strength')">Strength</button>
        <button type="button" class="btn${eOn}" aria-pressed="${active === 'engine'}" onclick="switchHybridLocker('engine')">Engine</button>
      </div>
    </div>`;
  }

  function origins(href) {
    let path = String(href || '');
    try {
      path = new URL(href).pathname;
    } catch (_) {
      /* relative href */
    }
    if (/\/engine(?:\/|$)/.test(path)) {
      return { strength: '../', engine: './' };
    }
    return { strength: './', engine: './engine/' };
  }

  function applyOccupancyToState(S, strengthDates, engineDates) {
    if (!S || typeof S !== 'object') return S;
    S.hybridOccupancy = occupancy(strengthDates, engineDates);
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
