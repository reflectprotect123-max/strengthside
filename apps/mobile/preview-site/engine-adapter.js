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

  /** Engine zone key → HTML Home/gauge band key. */
  var ENGINE_ZONE_TO_HTML = {
    low: 'recovery',
    mod: 'aerobic',
    high: 'anaerobic',
  };

  /** HTML format type field (legacy) for conditioningType. */
  var FORMAT_TYPE = {
    steady: 'easy',
    free: 'easy',
    intervals: 'intervals',
    tempo: 'intervals',
    custom: 'custom',
  };

  function effortMeta(key) {
    if (!hasEngine()) throw new Error('HybridEngine not loaded');
    var efforts = global.HybridEngine.Constants.CON_EFFORTS;
    var e = (efforts && efforts[key]) || efforts.easy;
    var rpe = e.rpe && e.rpe.length ? e.rpe[0] + '–' + e.rpe[1] : '';
    return {
      key: e.key,
      name: e.name,
      zoneKey: ENGINE_ZONE_TO_HTML[e.zone] || 'recovery',
      engineZone: e.zone,
      rpe: rpe,
      cue: e.cue,
    };
  }

  function formatMeta(key) {
    if (!hasEngine()) throw new Error('HybridEngine not loaded');
    var formats = global.HybridEngine.Conditioning.CON_FORMATS;
    var f = (formats && formats[key]) || formats.steady;
    var base = f.base || {};
    return {
      key: f.key,
      name: f.name,
      type: FORMAT_TYPE[f.key] || 'easy',
      rounds: base.rounds,
      workSec: base.work,
      restSec: base.rest,
      minutes: base.minutes,
    };
  }

  /**
   * Fill session/block fields on Start from builder + engine prescription.
   * Builder UI values win for authored minutes/rounds/work/rest; engine
   * conPrescription applies red-day ease (dailyAdj) and stamps level/note.
   */
  function sessionPatchFromBuilder(input) {
    var opts = input || {};
    if (!hasEngine()) throw new Error('HybridEngine not loaded');

    var fmtKey = opts.fmt || 'steady';
    var effort = effortMeta(opts.effort || 'easy');
    var fmt = formatMeta(fmtKey);
    var whoop = opts.whoop || null;
    var rx = global.HybridEngine.Conditioning.conPrescription(fmtKey, {
      whoop: whoop,
      modality: opts.modality,
      settings: opts.settings,
    });

    var zones = opts.zones || [];
    var z =
      zones.find(function (band) {
        return band.key === effort.zoneKey;
      }) ||
      zones[0] ||
      null;

    var mins = Math.max(0, Number(opts.minutes) || 30);
    var rounds = Math.max(1, Number(opts.rounds) || fmt.rounds || 1);
    var workSec = Math.max(0, Number(opts.workSec) || fmt.workSec || 0);
    var restSec = Math.max(
      0,
      opts.restSec != null ? Number(opts.restSec) : fmt.restSec || 0,
    );

    // Red-day ease mirrors engine levers, applied on top of builder numbers.
    if (rx.dailyAdj < 0) {
      if (fmtKey === 'steady') {
        mins = Math.max(10, mins - 5);
      } else if (fmtKey !== 'free') {
        if (rounds > 3) rounds = rounds - 1;
        else restSec = restSec + 10;
      }
    }

    return {
      heading: fmt.name,
      conditioningType: fmt.type,
      modality: opts.modality || 'Run',
      targetDurationMin: mins,
      timeCapMin: mins,
      targetHrZone: z ? z.lo + '–' + z.hi : '',
      effort: effort.key,
      condFmt: fmt.key,
      rounds: rounds,
      workSec: workSec,
      restSec: restSec,
      notes: '',
      condRxLevel: rx.level || 0,
      condRxDailyAdj: rx.dailyAdj || 0,
      condRxNote: rx.note || '',
    };
  }

  /**
   * Banister-style HR-TRIMP (same family as the prior HTML hrTrimp).
   * Max/rest come from HybridEngine.Hr — @hybrid/engine has no separate
   * load export yet (see docs/data/training-load-model.md).
   */
  function hrTrimp(minutes, avgHr, profile, whoop) {
    if (!hasEngine()) throw new Error('HybridEngine not loaded');
    var min = Number(minutes) || 0;
    var avg = Number(avgHr) || 0;
    var max = global.HybridEngine.Hr.conMaxHr(profile || {});
    var rest = global.HybridEngine.Hr.restingHr(profile || {}, whoop || null) || 60;
    if (!min || !avg || avg <= rest) return 0;
    var hrr = Math.max(0, Math.min(1, (avg - rest) / Math.max(1, max - rest)));
    var sex = profile && profile.sex;
    var coef = sex === 'female' ? 1.67 : 1.92;
    return min * hrr * (0.64 * Math.exp(coef * hrr));
  }

  /** Simple cond finish path: score when avg HR is present. */
  function condLoad(input) {
    var opts = input || {};
    var min = Number(opts.minutes) || 0;
    var avg = Number(opts.avgHr) || 0;
    if (avg > 0 && min > 0) {
      return {
        load: hrTrimp(min, avg, opts.profile, opts.whoop),
        method: 'HR-based load',
        confidence: 'high',
        scored: true,
      };
    }
    return {
      load: 0,
      method: 'Conditioning completed — no load score unless average heart rate is logged.',
      confidence: 'unknown',
      scored: false,
    };
  }

  /**
   * Sum HTML zone seconds (recovery/aerobic/anaerobic/peak) for completed
   * conditioning tasks in the last `days` local calendar days ending on `endDate`
   * (YYYY-MM-DD). Pure — sessions injected by caller.
   */
  function weeklyZoneSeconds(sessions, endDate, days) {
    var out = {
      recovery: 0,
      aerobic: 0,
      anaerobic: 0,
      peak: 0,
    };
    var nDays = Math.max(1, Number(days) || 7);
    var end = String(endDate || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(end)) return out;

    var endMs = Date.parse(end + 'T12:00:00');
    if (!Number.isFinite(endMs)) return out;
    var startMs = endMs - (nDays - 1) * 86400000;

    function inWindow(dateStr) {
      if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(String(dateStr))) return false;
      var ms = Date.parse(String(dateStr) + 'T12:00:00');
      return Number.isFinite(ms) && ms >= startMs && ms <= endMs;
    }

    function addZones(zs) {
      if (!zs) return;
      out.recovery += Number(zs.recovery) || 0;
      out.aerobic += Number(zs.aerobic) || 0;
      out.anaerobic += Number(zs.anaerobic) || 0;
      out.peak += Number(zs.peak) || 0;
    }

    (sessions || []).forEach(function (sess) {
      if (!sess || sess.status !== 'completed') return;
      if (!inWindow(sess.date)) return;
      (sess.tasks || []).forEach(function (t) {
        if (!t || t.kind !== 'conditioning') return;
        addZones(t.result && t.result.zoneSeconds);
      });
      // Fallback: summary conditioning cards if tasks empty
      if (!(sess.tasks || []).length && sess.summary && sess.summary.conditioning) {
        (sess.summary.conditioning || []).forEach(function (c) {
          addZones(c && c.result && c.result.zoneSeconds);
        });
      }
    });

    return out;
  }

  var api = {
    hasEngine: hasEngine,
    zonesForProfile: zonesForProfile,
    effortMeta: effortMeta,
    formatMeta: formatMeta,
    sessionPatchFromBuilder: sessionPatchFromBuilder,
    hrTrimp: hrTrimp,
    condLoad: condLoad,
    weeklyZoneSeconds: weeklyZoneSeconds,
  };

  global.EngineAdapter = api;
  global.HybridEngineAdapter = api;
})(typeof window !== 'undefined' ? window : globalThis);
