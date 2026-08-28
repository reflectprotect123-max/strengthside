/**
 * Thin HTML ↔ @hybrid/engine adapter (Slices 1.8–1.10).
 * Depends on window.HybridEngine from engine-bundle.js (load that first).
 */
(function (global) {
  'use strict';

  // Storage keys stay recovery/aerobic/anaerobic for session zoneSeconds compat.
  // Athlete-facing names are Easy / Medium / Hard (3 arcs — matches engine low/mod/high).
  var ZONE_META = [
    { key: 'recovery', short: 'Easy', name: 'Easy', color: '#33c4ff' },
    { key: 'aerobic', short: 'Med', name: 'Medium', color: '#3dff9e' },
    { key: 'anaerobic', short: 'Hard', name: 'Hard', color: '#ff5b57' },
  ];

  function hasEngine() {
    var eng = global.HybridEngine;
    return !!(eng && eng.Hr && typeof eng.Hr.conZones === 'function');
  }

  /**
   * Map engine conZones (3 bands: low/mod/high) → HTML gauge (Easy/Medium/Hard).
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

    // HTML exclusivity: next band starts at previous hi + 1.
    var out = [
      Object.assign({}, ZONE_META[0], { lo: low.lo, hi: low.hi }),
      Object.assign({}, ZONE_META[1], { lo: low.hi + 1, hi: mod.hi }),
      Object.assign({}, ZONE_META[2], { lo: mod.hi + 1, hi: high.hi }),
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
    var settings = opts.settings || {};
    var rx = global.HybridEngine.Conditioning.conPrescription(fmtKey, {
      whoop: whoop,
      modality: opts.modality,
      settings: settings,
    });

    var zones = opts.zones || [];
    var z =
      zones.find(function (band) {
        return band.key === effort.zoneKey;
      }) ||
      zones[0] ||
      null;

    // Prefer engine level-adjusted params; explicit builder numbers still win when provided.
    var mins;
    if (opts.minutes != null && opts.minutes !== '') {
      mins = Math.max(0, Number(opts.minutes) || 0);
    } else if (rx.minutes != null) {
      mins = Math.max(0, Number(rx.minutes) || 0);
    } else {
      mins = Math.max(0, Number(fmt.minutes) || 30);
    }
    var rounds;
    if (opts.rounds != null && opts.rounds !== '') {
      rounds = Math.max(1, Number(opts.rounds) || 1);
    } else if (rx.rounds != null) {
      rounds = Math.max(1, Number(rx.rounds) || 1);
    } else {
      rounds = Math.max(1, Number(fmt.rounds) || 1);
    }
    var workSec;
    if (opts.workSec != null && opts.workSec !== '') {
      workSec = Math.max(0, Number(opts.workSec) || 0);
    } else if (rx.work != null) {
      workSec = Math.max(0, Number(rx.work) || 0);
    } else {
      workSec = Math.max(0, Number(fmt.workSec) || 0);
    }
    var restSec;
    if (opts.restSec != null && opts.restSec !== '') {
      restSec = Math.max(0, Number(opts.restSec) || 0);
    } else if (rx.rest != null) {
      restSec = Math.max(0, Number(rx.rest) || 0);
    } else {
      restSec = Math.max(0, Number(fmt.restSec) || 0);
    }

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
      targetWatts:
        opts.targetWatts != null && opts.targetWatts !== ''
          ? Math.max(0, Number(opts.targetWatts) || 0) || ''
          : '',
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

  /** Zone-minute weights — TRIMP-ish scale for strapless / felt sessions. */
  var ZONE_LOAD_PER_MIN = {
    recovery: 0.2,
    aerobic: 0.4,
    anaerobic: 0.7,
    peak: 0.9,
  };

  function effortCenterRpe(effortKey) {
    if (hasEngine()) {
      var efforts = global.HybridEngine.Constants.CON_EFFORTS;
      var e = efforts && efforts[effortKey];
      if (e && e.center != null) return Number(e.center) || 6;
    }
    if (effortKey === 'easy') return 3.5;
    if (effortKey === 'hard') return 8.5;
    return 6;
  }

  function fosterSessionLoad(minutes, rpe) {
    var min = Number(minutes) || 0;
    var r = Number(rpe) || 0;
    if (min <= 0 || r <= 0) return 0;
    return Math.round(min * (r / 10) * 0.8 * 10) / 10;
  }

  function zoneSecondsLoad(zoneSeconds, minutes) {
    var zs = zoneSeconds || {};
    var sec =
      (Number(zs.recovery) || 0) +
      (Number(zs.aerobic) || 0) +
      (Number(zs.anaerobic) || 0) +
      (Number(zs.peak) || 0);
    if (sec <= 0 && minutes > 0) return 0;
    if (sec <= 0) return 0;
    var load =
      (Number(zs.recovery) || 0) / 60 * ZONE_LOAD_PER_MIN.recovery +
      (Number(zs.aerobic) || 0) / 60 * ZONE_LOAD_PER_MIN.aerobic +
      (Number(zs.anaerobic) || 0) / 60 * ZONE_LOAD_PER_MIN.anaerobic +
      (Number(zs.peak) || 0) / 60 * ZONE_LOAD_PER_MIN.peak;
    if (load <= 0 && minutes > 0) {
      load = minutes * ZONE_LOAD_PER_MIN.aerobic;
    }
    return Math.round(load * 10) / 10;
  }

  /**
   * Conditioning load — HR TRIMP when avg HR exists; else zone seconds, Foster sRPE,
   * or prescribed effort fallback (strapless sessions still count toward recovery debt).
   */
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
    if (min <= 0) {
      return {
        load: 0,
        method: 'Conditioning completed — duration missing.',
        confidence: 'unknown',
        scored: false,
      };
    }
    var zoneLoad = zoneSecondsLoad(opts.zoneSeconds, min);
    if (zoneLoad > 0) {
      return {
        load: zoneLoad,
        method: 'Zone-time load (no avg HR)',
        confidence: 'medium',
        scored: true,
      };
    }
    var rpe = Number(opts.rpe) || Number(opts.felt) || 0;
    if (rpe > 0) {
      return {
        load: fosterSessionLoad(min, rpe),
        method: 'Session RPE load (Foster)',
        confidence: 'medium',
        scored: true,
      };
    }
    var effortLoad = fosterSessionLoad(min, effortCenterRpe(opts.effort || 'medium'));
    if (effortLoad > 0) {
      return {
        load: effortLoad,
        method: 'Effort-based load (no HR logged)',
        confidence: 'low',
        scored: true,
      };
    }
    return {
      load: 0,
      method: 'Conditioning completed — log duration and RPE or avg HR to score load.',
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

  /** Map HTML modality labels → engine Concept2 modalities. */
  function htmlModalityToEngine(mod) {
    var m = String(mod || '').toLowerCase();
    if (m.indexOf('row') >= 0) return 'row';
    if (m.indexOf('ski') >= 0) return 'ski';
    if (m.indexOf('bike') >= 0 || m.indexOf('echo') >= 0 || m.indexOf('air') >= 0) return 'bike';
    return null;
  }

  /** HTML Home zone seconds → engine CondResult.zsec (low/mod/high). */
  function htmlZonesToEngineZsec(zs) {
    zs = zs || {};
    return {
      low: Number(zs.recovery) || 0,
      mod: Number(zs.aerobic) || 0,
      high: (Number(zs.anaerobic) || 0) + (Number(zs.peak) || 0),
    };
  }

  /**
   * Build CondResult for conAdapt from an HTML conditioning task + app state.
   */
  function condResultFromTask(task, state) {
    if (!task || task.kind !== 'conditioning') return null;
    var result = task.result || {};
    var fmt = task.condFmt || task.fmt || 'steady';
    var whoop = null;
    try {
      if (typeof global.athWhoopSampleForEngine === 'function') whoop = global.athWhoopSampleForEngine();
    } catch (_) {}
    var recScore = null;
    if (whoop && whoop.recoveryScore != null) recScore = Number(whoop.recoveryScore);
    else if (state && state.profile && state.profile.whoopRecovery != null) {
      recScore = Number(state.profile.whoopRecovery);
    }
    return {
      fmt: fmt,
      modality: htmlModalityToEngine(task.modality) || undefined,
      zsec: htmlZonesToEngineZsec(result.zoneSeconds),
      dur: Number(result.duration) || 0,
      rec: Number.isFinite(recScore) ? recScore : null,
      sim: false,
      felt: result.felt != null ? String(result.felt) : undefined,
      effort: task.effort || undefined,
    };
  }

  /**
   * Persist conAdapt progression into state.settings.conProgress (silent).
   */
  function applyConAdapt(state, rec) {
    if (!hasEngine() || !state) return state;
    if (!global.HybridEngine.Conditioning || !global.HybridEngine.Conditioning.conAdapt) return state;
    state.settings = state.settings || {};
    var result = global.HybridEngine.Conditioning.conAdapt(rec, state.settings);
    state.settings.conProgress = result.conProgress;
    state.meta = state.meta || {};
    state.meta.lastConAdapt = {
      delta: result.delta,
      at: new Date().toISOString(),
    };
    return state;
  }

  /**
   * Prefer engine zone bucketing when possible; fall back to HTML band list.
   * Returns HTML zone key (recovery/aerobic/anaerobic — Easy/Medium/Hard).
   */
  function zoneKeyForBpm(bpm, htmlZones) {
    var hr = Number(bpm) || 0;
    if (hasEngine() && global.HybridEngine.Hr && global.HybridEngine.Hr.zoneKeyOf && htmlZones && htmlZones.length >= 3) {
      try {
        var zonesObj = {
          list: [
            { key: 'low', lo: htmlZones[0].lo, hi: htmlZones[0].hi, name: htmlZones[0].name },
            { key: 'mod', lo: htmlZones[1].lo, hi: htmlZones[1].hi, name: htmlZones[1].name },
            { key: 'high', lo: htmlZones[2].lo, hi: htmlZones[2].hi, name: htmlZones[2].name },
          ],
        };
        var eng = global.HybridEngine.Hr.zoneKeyOf(hr, zonesObj);
        return ENGINE_ZONE_TO_HTML[eng] || 'aerobic';
      } catch (_) {}
    }
    if (!htmlZones || !htmlZones.length) return 'aerobic';
    if (hr < htmlZones[0].lo) return htmlZones[0].key;
    for (var i = 0; i < htmlZones.length; i++) {
      if (hr >= htmlZones[i].lo && hr <= htmlZones[i].hi) return htmlZones[i].key;
    }
    return htmlZones[htmlZones.length - 1].key;
  }

  function taskToEngineCondResult(result) {
    if (!result || typeof result !== 'object') return null;
    var out = {};
    if (result.externalId) out.externalId = result.externalId;
    if (result.duration != null) out.dur = Number(result.duration) || 0;
    if (result.deviceDistanceM != null) out.deviceDistanceM = result.deviceDistanceM;
    if (result.device) out.device = result.device;
    if (result.splits) out.splits = result.splits;
    if (result.startedAt) out.startedAt = result.startedAt;
    if (result.avgWatts != null) out.avgWatts = result.avgWatts;
    return Object.keys(out).length ? out : null;
  }

  /**
   * Build a minimal EngineDB view from HTML local state for Concept2 planning.
   * Strength tasks are omitted from blocks — imports never touch them.
   */
  function htmlStateToEngineDb(state) {
    var sessions = (state && state.sessions) || [];
    var settings = (state && state.settings) || {};
    return {
      sessions: sessions.map(function (s) {
        var startedAt =
          s.startedAt ||
          s.completedAt ||
          (s.date ? Date.parse(String(s.date) + 'T12:00:00') : null);
        var blocks = [];
        (s.tasks || []).forEach(function (t) {
          if (!t || t.kind !== 'conditioning') return;
          blocks.push({
            id: t.id,
            kind: 'conditioning',
            modality: htmlModalityToEngine(t.modality),
            condFmt: t.condFmt || 'free',
            condResult: taskToEngineCondResult(t.result),
          });
        });
        (s.blocks || []).forEach(function (b) {
          if (!b || (b.type !== 'conditioning' && b.kind !== 'conditioning')) return;
          if (blocks.some(function (x) {
            return x.id === b.id;
          }))
            return;
          blocks.push({
            id: b.id,
            kind: 'conditioning',
            modality: htmlModalityToEngine(b.modality),
            condFmt: b.condFmt || 'free',
            condResult: b.condResult || null,
          });
        });
        return {
          id: s.id,
          startedAt: Number.isFinite(startedAt) ? startedAt : null,
          updatedAt: s.updatedAt || s.completedAt || null,
          blocks: blocks,
        };
      }),
      settings: settings,
    };
  }

  function newId() {
    return 'c2s-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }

  function modalityLabelFromEngine(mod) {
    if (mod === 'row') return 'Rower';
    if (mod === 'ski') return 'Ski erg';
    if (mod === 'bike') return 'Bike';
    return 'Other';
  }

  /**
   * Plan + apply Concept2 sync results into HTML localStorage state.
   * Never mutates strength tasks. Standalone rows become completed cond sessions.
   */
  function applyConcept2Results(state, results) {
    if (!hasEngine() || !global.HybridEngine.Concept2) {
      throw new Error('HybridEngine.Concept2 not loaded');
    }
    var C2 = global.HybridEngine.Concept2;
    state.settings = state.settings || {};
    var db = htmlStateToEngineDb(state);
    var plan = C2.planConcept2Import(results || [], db);
    var counts = { attached: 0, enriched: 0, standalone: 0, skipped: plan.skipped || 0 };

    (plan.merges || []).forEach(function (m) {
      var sess = (state.sessions || []).find(function (s) {
        return s.id === m.sessionId;
      });
      if (!sess) return;
      // Refuse to touch sessions that are strength-primary without a cond task id match
      var task = (sess.tasks || []).find(function (t) {
        return t && t.id === m.blockId && t.kind === 'conditioning';
      });
      if (!task) return;
      task.result = task.result || {};
      if (m.mode === 'attach') {
        if (task.result.externalId) return;
        Object.assign(task.result, {
          externalId: m.patch.externalId,
          duration: m.patch.dur != null ? Math.round(m.patch.dur) : task.result.duration,
          deviceDistanceM: m.patch.deviceDistanceM,
          device: m.patch.device,
          splits: m.patch.splits,
          startedAt: m.patch.startedAt,
          source: 'concept2',
        });
        task.complete = true;
        counts.attached += 1;
      } else {
        if (task.result.externalId) return;
        if (m.patch.externalId) task.result.externalId = m.patch.externalId;
        if (task.result.deviceDistanceM == null && m.patch.deviceDistanceM != null)
          task.result.deviceDistanceM = m.patch.deviceDistanceM;
        if (!task.result.device && m.patch.device) task.result.device = m.patch.device;
        if (!task.result.splits && m.patch.splits) task.result.splits = m.patch.splits;
        task.result.source = task.result.source || 'concept2-enrich';
        counts.enriched += 1;
      }
    });

    (plan.standalone || []).forEach(function (rec) {
      var dateStr = '';
      if (rec.startedAt) {
        var d = new Date(rec.startedAt);
        if (!isNaN(d.getTime())) {
          dateStr = d.toISOString().slice(0, 10);
        }
      }
      if (!dateStr) dateStr = new Date().toISOString().slice(0, 10);
      var modLabel = modalityLabelFromEngine(rec.modality);
      var sess = {
        id: newId(),
        templateId: 'concept2-import',
        name: 'Concept2 · ' + modLabel,
        date: dateStr,
        status: 'completed',
        completedAt: rec.startedAt || Date.now(),
        startedAt: rec.startedAt || null,
        coachInstructions: '',
        blocks: [],
        tasks: [
          {
            id: newId(),
            kind: 'conditioning',
            heading: 'Concept2 import',
            modality: modLabel,
            condFmt: 'free',
            conditioningType: 'easy',
            complete: true,
            result: {
              duration: rec.dur != null ? Math.round(rec.dur) : 0,
              externalId: rec.externalId,
              deviceDistanceM: rec.deviceDistanceM,
              device: rec.device,
              splits: rec.splits,
              startedAt: rec.startedAt,
              source: 'concept2',
              zsrc: 'none',
            },
          },
        ],
        timer: { elapsed: rec.dur || 0, on: false, last: null },
        notes: '',
        summary: {
          duration: rec.dur || 0,
          sets: 0,
          tonnage: 0,
          strengthLoad: 0,
          conditioningLoad: 0,
          totalLoad: 0,
          conditioning: [],
        },
        source: 'concept2',
      };
      state.sessions = state.sessions || [];
      state.sessions.push(sess);
      counts.standalone += 1;
    });

    // Keep engine-shaped history for future progression readers
    if (plan.standalone && plan.standalone.length && C2.applyConcept2Import) {
      var draft = {
        sessions: [],
        settings: state.settings,
      };
      C2.applyConcept2Import(draft, { merges: [], standalone: plan.standalone, skipped: 0 });
      state.settings = draft.settings;
    }

    counts.summary = C2.concept2ImportSummary(counts);
    return counts;
  }

  /** Echo calories must stay device-scoped — never feed nutrition totals. */
  function tagEchoDeviceMetrics(metrics) {
    var m = metrics || {};
    return {
      device: { manufacturer: 'Rogue', model: 'Echo Bike V3', consoleMetric: 'watts', id: 'echo_ftms' },
      power_w: m.power_w,
      average_power_w: m.average_power_w,
      cadence_rpm: m.cadence_rpm,
      average_cadence_rpm: m.average_cadence_rpm,
      // Device-tagged only — callers must not write these into Nutrition.
      deviceCalories: m.calories_total,
      deviceDistanceM: m.distance_m,
      elapsed_s: m.elapsed_s,
    };
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
    htmlModalityToEngine: htmlModalityToEngine,
    htmlZonesToEngineZsec: htmlZonesToEngineZsec,
    condResultFromTask: condResultFromTask,
    applyConAdapt: applyConAdapt,
    zoneKeyForBpm: zoneKeyForBpm,
    applyConcept2Results: applyConcept2Results,
    tagEchoDeviceMetrics: tagEchoDeviceMetrics,
  };

  global.EngineAdapter = api;
  global.HybridEngineAdapter = api;
})(typeof window !== 'undefined' ? window : globalThis);
