/**
 * Thin HTML ↔ @hybrid/engine adapter (Slices 1.8–1.10).
 * Depends on window.HybridEngine from engine-bundle.js (load that first).
 */
(function (global) {
  'use strict';

  var ZONE_META = [
    { key: 'recovery', short: 'Rec', name: 'Recovery', color: '#33c4ff' },
    { key: 'aerobic', short: 'Aer', name: 'Aerobic', color: '#3dff9e' },
    { key: 'anaerobic', short: 'An', name: 'Anaerobic', color: '#ffc24d' },
    { key: 'peak', short: 'Peak', name: 'Peak', color: '#ff5b57' },
  ];

  function hasEngine() {
    var eng = global.HybridEngine;
    return !!(eng && eng.Hr && typeof eng.Hr.conZones === 'function');
  }

  /**
   * Map engine conZones (3 bands: low/mod/high) → HTML gauge shape (4 bands).
   * Overload (high) is split into anaerobic + peak for the existing UI.
   *
   * Pass `whoop: { recoveryScore, restingHr?, ... }` for REZONE_PROVISIONAL.
   * Do not invent recovery — omit whoop when the athlete has no real score
   * (HTML `athSaneRecovery` default 71 is display-only, not for zone edges).
   */
  function zonesForProfile(input) {
    var opts = input || {};
    if (!hasEngine()) {
      throw new Error('HybridEngine not loaded');
    }

    var whoop = opts.whoop || null;
    if (!whoop && opts.recovery != null && opts.recoveryKnown) {
      whoop = { recoveryScore: opts.recovery };
      if (opts.restingHr != null) whoop.restingHr = opts.restingHr;
    }

    var z = global.HybridEngine.Hr.conZones({
      profile: {
        maxHr: opts.maxHr,
        restingHr: opts.restingHr,
        age: opts.age,
      },
      whoop: whoop,
    });

    var low = z.list[0];
    var mod = z.list[1];
    var high = z.list[2];

    // Split Overload into anaerobic | peak; keep bands ordered and non-empty.
    var peakSplit = Math.round((high.lo + high.hi) / 2);
    peakSplit = Math.max(high.lo, Math.min(peakSplit, high.hi - 1));

    var recoverHi = low.hi;
    var aerobicHi = mod.hi;
    var anaerobicHi = peakSplit;
    var maxHr = high.hi;

    // HTML exclusivity: next band starts at previous hi + 1 (same as athZonesForReadiness).
    var out = [
      Object.assign({}, ZONE_META[0], { lo: low.lo, hi: recoverHi }),
      Object.assign({}, ZONE_META[1], { lo: recoverHi + 1, hi: aerobicHi }),
      Object.assign({}, ZONE_META[2], { lo: aerobicHi + 1, hi: anaerobicHi }),
      Object.assign({}, ZONE_META[3], { lo: anaerobicHi + 1, hi: maxHr }),
    ];

    for (var i = 0; i < out.length; i++) {
      if (!(out[i].lo < out[i].hi)) {
        out[i].hi = out[i].lo + 1;
      }
    }
    return out;
  }

  var api = {
    hasEngine: hasEngine,
    zonesForProfile: zonesForProfile,
  };

  global.EngineAdapter = api;
  global.HybridEngineAdapter = api;
})(typeof window !== 'undefined' ? window : globalThis);
