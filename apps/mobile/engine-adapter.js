/**
 * Thin HTML ↔ @hybrid/engine adapter (Slice 1.8 skeleton).
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
   * `recovery` is accepted for later slices; ignored for band edges here
   * (engine shift needs whoop context — do not reintroduce HTML Recovery-Sync).
   */
  function zonesForProfile(input) {
    var opts = input || {};
    if (!hasEngine()) {
      throw new Error('HybridEngine not loaded');
    }

    var z = global.HybridEngine.Hr.conZones({
      profile: {
        maxHr: opts.maxHr,
        restingHr: opts.restingHr,
        age: opts.age,
      },
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
