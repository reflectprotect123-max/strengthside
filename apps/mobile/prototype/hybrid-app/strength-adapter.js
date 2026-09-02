/**
 * HTML ↔ @hybrid/strength-engine adapter for silent progression.
 * Depends on window.HybridStrength and window.RecoverySignals.
 */
(function (global) {
  'use strict';

  var ENGINE_VERSION = 'strength-engine-silent-wire-1';

  function hasStrength() {
    var hs = global.HybridStrength;
    return !!(hs && hs.Progression && hs.Exposure && hs.Performed);
  }

  function num(v) {
    var n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  function isoNow() {
    return new Date().toISOString();
  }

  function localId(prefix) {
    return prefix + '-' + Math.random().toString(36).slice(2, 10);
  }

  function ensureStrengthState(state) {
    state.strengthState = state.strengthState || {};
    state.strengthState.workingMaxEvents = state.strengthState.workingMaxEvents || [];
    state.strengthState.prEvents = state.strengthState.prEvents || [];
    state.strengthState.loadHints = state.strengthState.loadHints || {};
    state.strengthState.volumeHints = state.strengthState.volumeHints || {};
    state.meta = state.meta || {};
    state.meta.progressionAudit = state.meta.progressionAudit || [];
    return state.strengthState;
  }

  var REP_PROGRESSION_NAME =
    /(jump|slam|throw|burpee|swing|lateral raise|pushdown|pull[- ]?up|chin[- ]?up|dip|push[- ]?up|nordic|handstand|plank|l[- ]?sit|ab wheel|raise|calf|abduction|carry|row|pulldown|leg press|dumbbell bench|db bench)/;
  var WM_LIFT_EXCLUSIONS =
    /(jump|slam|throw|burpee|swing|lateral raise|curl|pushdown|pull[- ]?up|chin[- ]?up|dip|row|pulldown|carry|plank|l[- ]?sit|calf|abduction|leg press|dumbbell bench|db bench)/;
  var WM_VERTICAL_PRESS =
    /overhead press|shoulder press|strict press|military press|z[- ]?press|landmine press|push press|arnold press/;

  function addedLoadCapableLift(name) {
    var n = String(name || '').toLowerCase();
    return /pull[- ]?up|chin[- ]?up|\bdip\b/.test(n);
  }

  function rowHasAddedLoad(row) {
    return num(row && (row.weight != null ? row.weight : row.load)) > 0;
  }

  /** Weighted pull-up / dip / chin-up: belt kg + reps → WM + load progression. */
  function exerciseUsesAddedLoadMode(state, exerciseId, name, sessionRows) {
    if (!addedLoadCapableLift(name)) return false;
    if (exerciseId && state) {
      var wmEvents = (ensureStrengthState(state).workingMaxEvents || []).filter(function (e) {
        return e.exerciseId === exerciseId;
      });
      if (wmEvents.length) return true;
    }
    if (sessionRows && sessionRows.some(rowHasAddedLoad)) return true;
    if (exerciseId && state) {
      var repHist = exerciseRepSessionHistory(state, exerciseId, 8);
      if (repHist.some(function (r) { return num(r.addedLoadKg) > 0; })) return true;
      var loadHist = exerciseExposureHistory(state, exerciseId, 1);
      if (loadHist.length) return true;
    }
    return false;
  }

  /** True bodyweight rep lifts (pull-up, dip, push-up) — not barbell/dumbbell/cable accessories. */
  function bodyweightRepLift(name, cat, state, exerciseId, sessionRows) {
    if (!repProgressionLift(name, cat, state, exerciseId, sessionRows)) return false;
    var n = String(name || '').toLowerCase();
    return !/(barbell|dumbbell|\bdb\b|cable|machine|ez[- ]?bar|e[- ]?z[- ]?bar|kettlebell|\bkb\b)/.test(n);
  }

  /** Timed holds (plank, wall sit) — time_sec primary, no rep-volume progression. */
  function timedHoldLift(name, cat, ex) {
    ex = ex || {};
    if (Array.isArray(ex.logColumns) && ex.logColumns.some(function (c) { return c.kind === 'time_sec'; })) {
      var load = ex.logColumns.some(function (c) {
        return c.kind === 'weight_kg' || c.kind === 'weight_pct_wm' || c.kind === 'weight_lwp';
      });
      if (!load) return true;
    }
    var n = String(name || '').toLowerCase();
    if (/^plank$|front plank|side plank|copenhagen plank/.test(n)) return true;
    return false;
  }

  /** Bodyweight / rep-only lifts — no working max or kg progression unless added-load mode. */
  function repProgressionLift(name, cat, state, exerciseId, sessionRows, ex) {
    if (timedHoldLift(name, cat, ex)) return false;
    var n = String(name || '').toLowerCase();
    if (!REP_PROGRESSION_NAME.test(n)) return false;
    if (exerciseUsesAddedLoadMode(state, exerciseId, name, sessionRows)) return false;
    return true;
  }

  /** Lifts that anchor % prescriptions and working maxes (barbell + added-load bodyweight). */
  function percentLiftCandidate(name, cat, state, exerciseId, sessionRows) {
    if (exerciseUsesAddedLoadMode(state, exerciseId, name, sessionRows)) return true;
    var n = String(name || '').toLowerCase();
    var c = String(cat || '').toLowerCase();
    if (WM_LIFT_EXCLUSIONS.test(n)) return false;
    if (/bench press/.test(n)) return true;
    if (/squat/.test(n)) return true;
    if (/deadlift/.test(n)) return true;
    if (WM_VERTICAL_PRESS.test(n)) return true;
    if (/\b(clean|snatch|jerk)\b/.test(n)) return true;
    if (c.includes('power') && /\b(clean|snatch|jerk)\b/.test(n)) return true;
    return false;
  }

  function findExerciseMetaInSession(session, exerciseId) {
    var meta = { name: '', category: '' };
    iterStrengthTasks(session).forEach(function (item) {
      var id = item.ex.exerciseId || item.ex.id;
      if (id === exerciseId) {
        meta.name = item.ex.name || meta.name;
        meta.category = item.ex.category || meta.category;
      }
    });
    return meta;
  }

  function sessionRowsForExercise(session, exerciseId) {
    var rows = [];
    if (!session || !exerciseId) return rows;
    iterStrengthTasks(session).forEach(function (item) {
      var eid = item.ex.exerciseId || item.ex.id;
      if (eid === exerciseId) rows = rows.concat(item.ex.rows || []);
    });
    return rows;
  }

  function exerciseRepSessionHistory(state, exerciseId, limit) {
    limit = limit || 8;
    var sessionsById = {};
    (state.sessions || []).forEach(function (s) {
      if (s.id) sessionsById[s.id] = s;
    });
    var performed = performedFromState(state).filter(function (p) {
      return p.exerciseId === exerciseId && p.status === 'completed';
    });
    var bySession = {};
    performed.forEach(function (p) {
      var reps = measurementValue(p, 'reps');
      if (!reps) return;
      var sid = p.assignedSessionId;
      if (!bySession[sid]) bySession[sid] = { sets: [] };
      bySession[sid].sets.push({
        reps: reps,
        loadKg: measurementValue(p, 'load') || 0,
        at: p.performedAt,
      });
    });
    var rows = Object.keys(bySession).map(function (sid) {
      var bucket = bySession[sid];
      var sess = sessionsById[sid] || {};
      var topReps = 0;
      var totalReps = 0;
      bucket.sets.forEach(function (set) {
        topReps = Math.max(topReps, num(set.reps));
        totalReps += num(set.reps);
      });
      var at = sess.completedAt ? new Date(sess.completedAt).toISOString() : bucket.sets[0].at;
      return {
        sessionId: sid,
        sessionName: sess.name || '',
        setCount: bucket.sets.length,
        topReps: topReps,
        avgReps: bucket.sets.length ? Math.round(totalReps / bucket.sets.length) : topReps,
        reps: String(topReps),
        at: at,
        date: String(sess.date || at || '').slice(0, 10),
        addedLoadKg: bucket.sets.some(function (s) { return s.loadKg > 0; })
          ? Math.max.apply(null, bucket.sets.map(function (s) { return s.loadKg; }))
          : 0,
      };
    });
    rows.sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); });
    return rows.slice(0, limit);
  }

  function calibrationForRepExercise(state, exerciseId) {
    var rows = exerciseRepSessionHistory(state, exerciseId, 8);
    var count = rows.length;
    var label = count >= 2
      ? 'Rep model ready'
      : (count > 0 ? 'Building rep model · ' + count + '/2 sessions' : 'No rep history yet');
    return { state: count >= 2 ? 'calibrated' : (count ? 'building' : 'uncalibrated'), count: count, label: label };
  }

  function measurementValue(set, key) {
    return global.HybridStrength.Performed.measurementValue(set, key);
  }

  function iterStrengthTasks(session) {
    var out = [];
    (session.tasks || []).forEach(function (t) {
      if (t.kind === 'strength') out.push({ task: t, ex: t });
      if (t.kind === 'superset') {
        (t.exercises || []).forEach(function (ex) {
          out.push({ task: t, ex: ex });
        });
      }
    });
    return out;
  }

  function trainedExerciseIds(session) {
    var ids = new Set();
    iterStrengthTasks(session).forEach(function (item) {
      if (item.ex.exerciseId) ids.add(item.ex.exerciseId);
    });
    return Array.from(ids);
  }

  function htmlRowToSessionLoadSet(row) {
    var measurements = [];
    var load = num(row.weight);
    var reps = num(row.reps);
    if (load > 0) measurements.push({ metricKey: 'load', value: load });
    if (reps > 0) measurements.push({ metricKey: 'reps', value: reps });
    return { measurements: measurements };
  }

  /** Completed HTML rows → engine sessionLoad.tonnageKg (not tonnage/50). */
  function sessionLoadFromRows(rows) {
    var filtered = (rows || []).filter(function (r) {
      return r.done && r.targetKind !== 'seconds';
    });
    var HS = global.HybridStrength;
    if (HS && HS.Load && HS.Load.sessionLoad) {
      return HS.Load.sessionLoad(filtered.map(htmlRowToSessionLoadSet)).tonnageKg;
    }
    var tonnage = filtered.reduce(function (a, x) {
      return a + num(x.weight) * num(x.reps);
    }, 0);
    if (tonnage > 0) return tonnage;
    // Bodyweight-only (no load logged): engine tonnageKg is 0 when bundle present
    return 0;
  }

  function htmlRowToPerformed(session, task, ex, row) {
    var exerciseId = ex.exerciseId || task.exerciseId;
    var performedAt = new Date(session.completedAt || Date.now()).toISOString();
    var measurements = [];
    var load = num(row.weight);
    var reps = num(row.reps);
    if (load > 0) measurements.push({ metricKey: 'load', value: load });
    if (reps > 0) measurements.push({ metricKey: 'reps', value: reps });
    if (String(row.rir != null ? row.rir : '').trim() !== '') {
      var rir = num(row.rir);
      if (rir >= 0) measurements.push({ metricKey: 'rpe', value: Math.min(10, Math.max(1, 10 - rir)) });
    }
    if (session.sessionPain === 'yes') {
      measurements.push({ metricKey: 'pain', value: 1 });
    }
    return {
      id: row.id,
      assignedSessionId: session.id,
      exerciseId: exerciseId,
      prescribedSetId: row.extra ? null : task.id + '-' + row.n,
      ordinal: row.n,
      status: row.done ? 'completed' : 'skipped',
      performedAt: performedAt,
      clientCreatedAt: performedAt,
      measurements: measurements,
    };
  }

  function performedFromSession(session) {
    var out = [];
    iterStrengthTasks(session).forEach(function (item) {
      (item.ex.rows || []).forEach(function (row) {
        out.push(htmlRowToPerformed(session, item.task, item.ex, row));
      });
    });
    return out;
  }

  function performedFromState(state) {
    var out = [];
    (state.sessions || []).filter(function (s) { return s.status === 'completed'; }).forEach(function (s) {
      out = out.concat(performedFromSession(s));
    });
    return out;
  }

  function roundLoad(loadKg) {
    var inc = 2.5;
    return Math.round(loadKg / inc) * inc;
  }

  function currentAnchorLoad(state, exerciseId, performed) {
    var events = ensureStrengthState(state).workingMaxEvents;
    var wm = global.HybridStrength.WorkingMax.currentWorkingMax(events, isoNow().slice(0, 10));
    if (wm && wm.exerciseId === exerciseId) return wm.valueKg;
    var exposures = global.HybridStrength.Exposure.strengthExposuresFor(exerciseId, performed);
    return global.HybridStrength.Progression.anchorKgFor(exposures);
  }

  function priorPrEvents(performed, excludeSessionId) {
    var best = {};
    performed.forEach(function (p) {
      if (p.assignedSessionId === excludeSessionId || p.status !== 'completed') return;
      var load = measurementValue(p, 'load');
      var reps = measurementValue(p, 'reps');
      if (!load || !reps) return;
      var key = p.exerciseId + ':' + reps;
      if (!best[key] || load > best[key].valueKg) {
        best[key] = {
          exerciseId: p.exerciseId,
          repCount: reps,
          valueKg: load,
          achievedAt: p.performedAt,
          performedSetId: p.id,
        };
      }
    });
    return Object.keys(best).map(function (k) { return best[k]; });
  }

  function sessionHadPerformanceOverride(session, exerciseId, performed, prEvents) {
    var Pr = global.HybridStrength.Pr;
    var Exposure = global.HybridStrength.Exposure;
    var Progression = global.HybridStrength.Progression;
    var historyPrs = priorPrEvents(performed, session.id).concat(
      prEvents.filter(function (e) { return e.exerciseId === exerciseId; })
    );
    var forExercise = performed.filter(function (p) {
      return p.exerciseId === exerciseId && p.assignedSessionId === session.id && p.status === 'completed';
    });
    for (var i = 0; i < forExercise.length; i++) {
      var set = forExercise[i];
      var load = measurementValue(set, 'load');
      var reps = measurementValue(set, 'reps');
      if (load && reps && Pr.detectPr({ exerciseId: exerciseId, reps: reps, loadKg: load }, historyPrs)) {
        return true;
      }
    }
    var exposures = Exposure.strengthExposuresFor(exerciseId, performed);
    var last = exposures.length ? exposures[exposures.length - 1] : null;
    if (!last || last.assignedSessionId !== session.id || last.exposureClass !== 'successful') return false;
    var prior = exposures.filter(function (e) { return e.assignedSessionId !== session.id; });
    var anchor = Progression.anchorKgFor(prior);
    return anchor != null && last.loadKg > anchor;
  }

  function appendAudit(state, entry) {
    var audit = state.meta.progressionAudit;
    audit.push(entry);
    if (audit.length > 200) audit.splice(0, audit.length - 200);
  }

  function applyLoadChange(state, exerciseId, newLoad, source, sessionId, fromSetId) {
    var ss = ensureStrengthState(state);
    var athleteId = state.meta.ownerId || 'local';
    ss.workingMaxEvents.push({
      id: localId('wm'),
      athleteId: athleteId,
      exerciseId: exerciseId,
      valueKg: newLoad,
      source: source,
      formula: null,
      fromSetId: fromSetId || null,
      effectiveAt: isoNow(),
    });
    ss.loadHints[exerciseId] = {
      loadKg: newLoad,
      updatedAt: isoNow(),
      source: source,
    };
  }

  function exerciseNameFor(state, exerciseId) {
    var ex = (state.exercises || []).find(function (e) { return e.id === exerciseId; });
    return (ex && ex.name) || exerciseId || 'Lift';
  }

  var AUDIT_REASONS = {
    three_on_target: 'Three on-target sessions',
    repeated_deterioration: 'Repeated misses — deload',
    mixed_signal: 'Mixed signals — hold',
    insufficient_exposure: 'Still calibrating',
    session_pain_yes: 'Session pain',
    no_checkin_today: 'No check-in today',
    performance_overrides_subjective_gate: 'Beat targets — bump anyway',
    recovery_gate_hold: 'Recovery gate',
    recovery_gate_caution: 'Control day gate',
    checkin_minimum: 'Minimum day',
    checkin_control: 'Control day',
    whoop_low: 'Low WHOOP recovery',
    whoop_moderate: 'Moderate WHOOP',
  };

  function auditReasonText(codes) {
    return (codes || []).map(function (c) {
      if (AUDIT_REASONS[c]) return AUDIT_REASONS[c];
      if (c.indexOf('recovery_gate_') === 0) return 'Recovery gate (' + c.replace('recovery_gate_', '') + ')';
      return c.replace(/_/g, ' ');
    }).join(' · ');
  }

  function recordPrEvents(state, session) {
    if (!hasStrength()) return;
    ensureStrengthState(state);
    var performed = performedFromSession(session);
    var prEvents = state.strengthState.prEvents.slice();
    var history = priorPrEvents(performedFromState(state), session.id).concat(prEvents);
    performed.filter(function (p) { return p.status === 'completed'; }).forEach(function (set) {
      var load = measurementValue(set, 'load');
      var reps = measurementValue(set, 'reps');
      if (!load || !reps) return;
      if (global.HybridStrength.Pr.detectPr({ exerciseId: set.exerciseId, reps: reps, loadKg: load }, history)) {
        var ev = {
          exerciseId: set.exerciseId,
          repCount: reps,
          valueKg: load,
          achievedAt: set.performedAt,
          performedSetId: set.id,
        };
        prEvents.push(ev);
        history.push(ev);
      }
    });
    state.strengthState.prEvents = prEvents;
  }

  function progressSummary(state) {
    if (!hasStrength()) return { ok: false, prs: [], workingMaxes: [], recentAudit: [] };
    ensureStrengthState(state);
    var todayStr = new Date().toISOString().slice(0, 10);
    var prs = (state.strengthState.prEvents || []).slice().sort(function (a, b) {
      return String(b.achievedAt).localeCompare(String(a.achievedAt));
    }).slice(0, 20).map(function (p) {
      return {
        exerciseId: p.exerciseId,
        name: exerciseNameFor(state, p.exerciseId),
        repCount: p.repCount,
        valueKg: p.valueKg,
        achievedAt: p.achievedAt,
      };
    });

    var wmByEx = {};
    (state.strengthState.workingMaxEvents || []).forEach(function (e) {
      if (!wmByEx[e.exerciseId] || e.effectiveAt > wmByEx[e.exerciseId].effectiveAt) wmByEx[e.exerciseId] = e;
    });
    var workingMaxes = Object.keys(wmByEx).map(function (id) {
      return { exerciseId: id, name: exerciseNameFor(state, id), valueKg: wmByEx[id].valueKg, effectiveAt: wmByEx[id].effectiveAt };
    }).sort(function (a, b) { return b.valueKg - a.valueKg; }).slice(0, 8);

    var recentAudit = ((state.meta && state.meta.progressionAudit) || []).slice(-20).reverse().map(function (a) {
      var label = a.action === 'progress' ? '+' + (a.deltaKg != null ? a.deltaKg.toFixed(1) : '?') + ' kg' : a.action;
      return {
        exerciseId: a.exerciseId,
        name: exerciseNameFor(state, a.exerciseId),
        action: a.action,
        label: label,
        at: a.at,
        reasons: auditReasonText(a.reasonCodes),
      };
    });

    return { ok: true, prs: prs, workingMaxes: workingMaxes, recentAudit: recentAudit };
  }

  var PROGRESSION_CONSERVATIVE_RANK = { progress: 0, retest: 1, hold: 2, deload: 3 };

  function mergeAiProgressionAction(engineAction, aiDecision) {
    if (!aiDecision || !aiDecision.action) return { action: engineAction, aiInfluenced: false };
    var engineRank = PROGRESSION_CONSERVATIVE_RANK[engineAction] != null
      ? PROGRESSION_CONSERVATIVE_RANK[engineAction]
      : 2;
    var aiRank = PROGRESSION_CONSERVATIVE_RANK[aiDecision.action] != null
      ? PROGRESSION_CONSERVATIVE_RANK[aiDecision.action]
      : 2;
    if (aiRank > engineRank) {
      return { action: aiDecision.action, aiInfluenced: true };
    }
    return { action: engineAction, aiInfluenced: false };
  }

  var VOLUME_CONSERVATIVE_RANK = { progress: 0, hold: 1, deload: 2 };

  function mergeAiVolumeAction(engine, aiDecision) {
    if (!aiDecision || !aiDecision.action) return { resolved: engine, aiInfluenced: false };
    var engineRank = VOLUME_CONSERVATIVE_RANK[engine.action] != null ? VOLUME_CONSERVATIVE_RANK[engine.action] : 1;
    var aiRank = VOLUME_CONSERVATIVE_RANK[aiDecision.action] != null ? VOLUME_CONSERVATIVE_RANK[aiDecision.action] : 1;
    var out = {
      action: engine.action,
      sets: engine.sets,
      reps: engine.reps,
      reasonCodes: engine.reasonCodes.slice(),
    };
    if (aiRank > engineRank) {
      out.action = aiDecision.action;
      if (aiDecision.sets != null) out.sets = aiDecision.sets;
      if (aiDecision.reps != null) out.reps = aiDecision.reps;
      return { resolved: out, aiInfluenced: true };
    }
    if (aiDecision.sets != null && aiDecision.reps != null && engine.action === 'hold' && aiDecision.action === 'hold') {
      out.sets = aiDecision.sets;
      out.reps = aiDecision.reps;
      return { resolved: out, aiInfluenced: true };
    }
    return { resolved: out, aiInfluenced: false };
  }

  function resolveRepVolumeAction(state, session, exerciseId, recovery) {
    recovery = recovery || { gate: 'ok', reasonCodes: [] };
    var repHist = exerciseRepSessionHistory(state, exerciseId, 5);
    var reasonCodes = [];
    if (session.sessionPain === 'yes') {
      return { action: 'hold', sets: null, reps: null, reasonCodes: ['session_pain_yes'], repHistory: repHist };
    }
    if (recovery.gate === 'hold') {
      return {
        action: 'hold',
        sets: repHist.length ? repHist[0].setCount : 3,
        reps: repHist.length ? repHist[0].reps : '8',
        reasonCodes: ['recovery_gate_hold'].concat(recovery.reasonCodes || []),
        repHistory: repHist,
      };
    }
    if (!repHist.length) {
      return { action: 'hold', sets: 3, reps: '8', reasonCodes: ['rep_baseline'], repHistory: repHist };
    }
    var last = repHist[0];
    var sets = last.setCount || 3;
    var reps = String(last.reps || '8');
    var action = 'hold';
    reasonCodes.push('repeat_last_rep_volume');
    if (repHist.length >= 2 && recovery.gate === 'ok') {
      var prev = repHist[1];
      if (last.topReps >= prev.topReps && last.setCount >= prev.setCount) {
        action = 'progress';
        var range = parseRepRange(reps);
        if (range) {
          reps = String(range.lo) + '-' + String(Math.min(range.hi + 1, range.hi + 2));
        } else {
          reps = String(Math.min(num(reps) + 1, 30));
        }
        reasonCodes.push('rep_progression_deterministic');
      }
    }
    return { action: action, sets: sets, reps: reps, reasonCodes: reasonCodes, repHistory: repHist };
  }

  function applyRepVolumeHint(state, session, exerciseId, resolved, recovery) {
    if (!resolved.sets || !resolved.reps) return false;
    var ss = ensureStrengthState(state);
    ss.volumeHints[exerciseId] = {
      sets: Math.max(1, Math.min(12, num(resolved.sets) || 3)),
      reps: String(resolved.reps),
      updatedAt: isoNow(),
      source: resolved.aiInfluenced ? 'ai_rep_advisory' : 'rep_progression',
      sessionId: session.id,
    };
    appendAudit(state, {
      at: isoNow(),
      sessionId: session.id,
      exerciseId: exerciseId,
      action: resolved.action === 'progress' ? 'rep_progress' : (resolved.action === 'deload' ? 'rep_deload' : 'rep_hold'),
      deltaKg: null,
      nextSets: ss.volumeHints[exerciseId].sets,
      nextReps: ss.volumeHints[exerciseId].reps,
      reasonCodes: resolved.reasonCodes.slice(),
      recoveryGate: recovery.gate,
      sessionPain: session.sessionPain || 'none',
      performanceOverride: false,
      engineVersion: ENGINE_VERSION,
      aiAdvised: !!resolved.aiInfluenced,
    });
    return true;
  }

  function buildRepAiFlashContext(state, session, exerciseId, resolved, recovery) {
    return {
      repHistory: resolved.repHistory || exerciseRepSessionHistory(state, exerciseId, 5),
      exerciseName: exerciseNameFor(state, exerciseId),
      calibration: calibrationForRepExercise(state, exerciseId).state,
      sessionPain: session.sessionPain || 'none',
      recoveryGate: recovery.gate,
      recoveryReasonCodes: recovery.reasonCodes || [],
      deterministic: {
        action: resolved.action,
        sets: resolved.sets,
        reps: resolved.reps,
        reasonCodes: resolved.reasonCodes.slice(),
      },
    };
  }

  function applyRepVolumeProgressionJob(state, session, exerciseId, recovery, useAi) {
    var resolved = resolveRepVolumeAction(state, session, exerciseId, recovery);
    if (!useAi || !global.StrengthAI || !global.StrengthAI.fetchVolumeDecision) {
      applyRepVolumeHint(state, session, exerciseId, resolved, recovery);
      return Promise.resolve({ exerciseId: exerciseId, applied: true });
    }
    var ctx = buildRepAiFlashContext(state, session, exerciseId, resolved, recovery);
    var flash = global.StrengthAI.buildRepFlashCard(state, exerciseId, ctx);
    return global.StrengthAI.fetchVolumeDecision(flash).then(function (ai) {
      var merged = mergeAiVolumeAction(resolved, ai);
      var finalResolved = merged.resolved;
      finalResolved.aiInfluenced = merged.aiInfluenced;
      if (merged.aiInfluenced) {
        finalResolved.reasonCodes.push('llm_rep_volume_advisory');
        (ai.reasonCodes || []).forEach(function (r) {
          var code = String(r || '').trim();
          if (!code) return;
          var tagged = code.indexOf('llm_') === 0 ? code : 'llm_' + code;
          if (finalResolved.reasonCodes.indexOf(tagged) < 0) finalResolved.reasonCodes.push(tagged);
        });
      }
      applyRepVolumeHint(state, session, exerciseId, finalResolved, recovery);
      return { exerciseId: exerciseId, applied: true };
    }).catch(function (err) {
      if (state.settings && state.settings.llmDebug) console.warn('StrengthAI rep volume:', err);
      applyRepVolumeHint(state, session, exerciseId, resolved, recovery);
      return { exerciseId: exerciseId, applied: true };
    });
  }

  function resolveProgressionAction(state, session, exerciseId, opts) {
    opts = opts || {};
    var performed = opts.performed || performedFromState(state);
    var prEvents = opts.prEvents || state.strengthState.prEvents.slice();
    var recovery = opts.recovery;
    var exposures = global.HybridStrength.Exposure.strengthExposuresFor(exerciseId, performed);
    var decision = global.HybridStrength.Progression.decideProgression(exposures, { exerciseId: exerciseId });
    var action = decision.action;
    var reasonCodes = decision.reasonCodes.slice();
    if (opts.bigMacOverride) {
      action = opts.bigMacOverride;
      reasonCodes.push('big_mac_override');
    }
    var performanceOverride = false;

    if (session.sessionPain === 'yes') {
      action = 'hold';
      reasonCodes.push('session_pain_yes');
    } else if (
      action === 'progress' &&
      global.RecoverySignals.blocksProgressionBumps(recovery) &&
      sessionHadPerformanceOverride(session, exerciseId, performed, prEvents)
    ) {
      performanceOverride = true;
      reasonCodes.push('performance_overrides_subjective_gate');
    } else if (
      action === 'progress' &&
      global.RecoverySignals.blocksProgressionBumps(recovery)
    ) {
      action = 'hold';
      reasonCodes = reasonCodes.concat(['recovery_gate_' + recovery.gate]).concat(recovery.reasonCodes);
    }

    return {
      action: action,
      reasonCodes: reasonCodes,
      performanceOverride: performanceOverride,
      decision: decision,
    };
  }

  function applyResolvedProgression(state, session, exerciseId, resolved, recovery, performed) {
    var action = resolved.action;
    var reasonCodes = resolved.reasonCodes.slice();
    var decision = resolved.decision;
    var anchor = currentAnchorLoad(state, exerciseId, performed);
    var deltaKg = decision.deltaKg;
    var deltaPct = decision.deltaPct;

    if (resolved.aiDeltaPct != null && Number.isFinite(resolved.aiDeltaPct)) {
      deltaPct = resolved.aiDeltaPct;
    }

    if (action === 'progress' && anchor != null) {
      var progressed = roundLoad(anchor * (1 + (deltaPct != null ? deltaPct : 0.025)));
      if (progressed > anchor) {
        applyLoadChange(state, exerciseId, progressed, 'auto_estimate', session.id, null);
        deltaKg = progressed - anchor;
      } else {
        action = 'hold';
        reasonCodes.push('progress_rounded_no_change');
      }
    } else if (action === 'deload' && anchor != null) {
      var deloaded = roundLoad(anchor * (1 + (deltaPct != null ? deltaPct : -0.05)));
      if (deloaded < anchor) {
        applyLoadChange(state, exerciseId, deloaded, 'auto_estimate', session.id, null);
        deltaKg = deloaded - anchor;
      } else {
        action = 'hold';
        reasonCodes.push('deload_rounded_no_change');
      }
    }

    appendAudit(state, {
      at: isoNow(),
      sessionId: session.id,
      exerciseId: exerciseId,
      action: action,
      deltaKg: deltaKg,
      reasonCodes: reasonCodes,
      recoveryGate: recovery.gate,
      sessionPain: session.sessionPain || 'none',
      performanceOverride: resolved.performanceOverride,
      engineVersion: ENGINE_VERSION,
      aiAdvised: !!resolved.aiInfluenced,
    });

    return action === 'progress' || action === 'deload';
  }

  function buildAiFlashContext(state, session, exerciseId, resolved, recovery) {
    var performed = performedFromState(state);
    var exposures = global.HybridStrength.Exposure.strengthExposuresFor(exerciseId, performed);
    var cal = calibrationForExercise(state, exerciseId);
    return {
      exposures: exposures,
      exerciseName: exerciseNameFor(state, exerciseId),
      calibration: cal ? cal.state : 'unknown',
      sessionPain: session.sessionPain || 'none',
      recoveryGate: recovery.gate,
      recoveryReasonCodes: recovery.reasonCodes || [],
      performanceOverride: resolved.performanceOverride,
      deterministic: { action: resolved.action, reasonCodes: resolved.reasonCodes.slice() },
    };
  }

  function progressionPrecheck(state, session, opts) {
    opts = opts || {};
    if (!hasStrength()) {
      if (!opts.quiet) console.warn('StrengthAdapter: HybridStrength bundle missing — skip silent apply');
      return { ok: false, result: { applied: 0, skipped: 'no_bundle' } };
    }
    if (!global.RecoverySignals) {
      if (!opts.quiet) console.warn('StrengthAdapter: RecoverySignals missing — skip silent apply');
      return { ok: false, result: { applied: 0, skipped: 'no_recovery' } };
    }
    ensureStrengthState(state);
    var recovery = opts.recoverySignal || global.RecoverySignals.recoverySignal(opts.recoveryInput || {});
    var performed = performedFromState(state);
    var prEvents = state.strengthState.prEvents.slice();
    var exerciseIds = trainedExerciseIds(session);
    return {
      ok: true,
      recovery: recovery,
      performed: performed,
      prEvents: prEvents,
      exerciseIds: exerciseIds,
    };
  }

  /**
   * Apply silent progression for a just-completed session.
   * Mutates state.strengthState and state.meta.progressionAudit; caller saves.
   */
  function applySilentProgression(state, session, opts) {
    opts = opts || {};
    var pre = progressionPrecheck(state, session, opts);
    if (!pre.ok) return pre.result;

    var applied = 0;
    pre.exerciseIds.forEach(function (exerciseId) {
      var meta = findExerciseMetaInSession(session, exerciseId);
      var name = meta.name || exerciseNameFor(state, exerciseId);
      if (repProgressionLift(name, meta.category, state, exerciseId, sessionRowsForExercise(session, exerciseId))) {
        var repResolved = resolveRepVolumeAction(state, session, exerciseId, pre.recovery);
        if (applyRepVolumeHint(state, session, exerciseId, repResolved, pre.recovery)) applied++;
        return;
      }
      var resolved = resolveProgressionAction(state, session, exerciseId, {
        recovery: pre.recovery,
        performed: pre.performed,
        prEvents: pre.prEvents,
        bigMacOverride: opts.bigMacOverride,
      });
      if (applyResolvedProgression(state, session, exerciseId, resolved, pre.recovery, pre.performed)) applied++;
    });

    return { applied: applied, recoveryGate: pre.recovery.gate };
  }

  /**
   * Post-session progression with optional LLM advisory (conservative merge only).
   */
  function applySilentProgressionAsync(state, session, opts) {
    opts = opts || {};
    var pre = progressionPrecheck(state, session, opts);
    if (!pre.ok) return Promise.resolve(pre.result);

    var useAi = !opts.bigMacOverride &&
      global.StrengthAI &&
      global.StrengthAI.llmEnabled &&
      global.StrengthAI.llmEnabled(state) &&
      (global.StrengthAI.fetchProgressionDecision || global.StrengthAI.fetchVolumeDecision);

    if (!useAi) {
      return Promise.resolve(applySilentProgression(state, session, opts));
    }

    var jobs = pre.exerciseIds.map(function (exerciseId) {
      var meta = findExerciseMetaInSession(session, exerciseId);
      var name = meta.name || exerciseNameFor(state, exerciseId);
      if (repProgressionLift(name, meta.category, state, exerciseId, sessionRowsForExercise(session, exerciseId))) {
        return applyRepVolumeProgressionJob(state, session, exerciseId, pre.recovery, useAi);
      }
      var resolved = resolveProgressionAction(state, session, exerciseId, {
        recovery: pre.recovery,
        performed: pre.performed,
        prEvents: pre.prEvents,
        bigMacOverride: opts.bigMacOverride,
      });
      var ctx = buildAiFlashContext(state, session, exerciseId, resolved, pre.recovery);
      var flash = global.StrengthAI.buildFlashCard(state, exerciseId, ctx);
      return global.StrengthAI.fetchProgressionDecision(flash).then(function (ai) {
        var merged = mergeAiProgressionAction(resolved.action, ai);
        if (merged.aiInfluenced) {
          resolved.action = merged.action;
          resolved.aiInfluenced = true;
          resolved.reasonCodes.push('llm_progression_advisory');
          (ai.reasonCodes || []).forEach(function (r) {
            var code = String(r || '').trim();
            if (!code) return;
            var tagged = code.indexOf('llm_') === 0 ? code : 'llm_' + code;
            if (resolved.reasonCodes.indexOf(tagged) < 0) resolved.reasonCodes.push(tagged);
          });
          if (ai.deltaPct != null && (merged.action === 'deload' || merged.action === 'progress')) {
            resolved.aiDeltaPct = ai.deltaPct;
          }
        }
        return { exerciseId: exerciseId, resolved: resolved };
      }).catch(function (err) {
        if (state.settings && state.settings.llmDebug) console.warn('StrengthAI:', err);
        return { exerciseId: exerciseId, resolved: resolved };
      });
    });

    return Promise.all(jobs).then(function (rows) {
      var applied = 0;
      rows.forEach(function (row) {
        if (row.applied) applied++;
        else if (row.resolved && applyResolvedProgression(state, session, row.exerciseId, row.resolved, pre.recovery, pre.performed)) {
          applied++;
        }
      });
      return { applied: applied, recoveryGate: pre.recovery.gate, aiAdvised: true };
    });
  }

  function exerciseExposureHistory(state, exerciseId, limit) {
    limit = limit || 8;
    var sessionsById = {};
    (state.sessions || []).forEach(function (s) {
      if (s.id) sessionsById[s.id] = s;
    });
    var performed = performedFromState(state).filter(function (p) {
      return p.exerciseId === exerciseId && p.status === 'completed';
    });
    var bySession = {};
    performed.forEach(function (p) {
      var loadKg = measurementValue(p, 'load');
      var reps = measurementValue(p, 'reps');
      if (!loadKg) return;
      var sid = p.assignedSessionId;
      if (!bySession[sid]) bySession[sid] = { sessionId: sid, sets: [] };
      bySession[sid].sets.push({ loadKg: loadKg, reps: reps, at: p.performedAt });
    });
    var rows = Object.keys(bySession).map(function (sid) {
      var bucket = bySession[sid];
      var sess = sessionsById[sid] || {};
      var best = null;
      bucket.sets.forEach(function (set) {
        if (!best || set.loadKg > best.loadKg || (set.loadKg === best.loadKg && set.reps > best.reps)) best = set;
      });
      if (!best) return null;
      var at = sess.completedAt ? new Date(sess.completedAt).toISOString() : best.at;
      return {
        sessionId: sid,
        sessionName: sess.name || '',
        loadKg: best.loadKg,
        reps: best.reps,
        setCount: bucket.sets.length,
        at: at,
        date: String(sess.date || at || '').slice(0, 10),
      };
    }).filter(Boolean);
    rows.sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); });
    return rows.slice(0, limit);
  }

  function progressExerciseDetail(state, exerciseId) {
    if (!hasStrength() || !exerciseId) return { ok: false };
    ensureStrengthState(state);
    var ss = state.strengthState;
    var hint = ss.loadHints[exerciseId] || null;
    var wm = (ss.workingMaxEvents || []).filter(function (e) { return e.exerciseId === exerciseId; });
    wm.sort(function (a, b) { return String(b.effectiveAt).localeCompare(String(a.effectiveAt)); });
    return {
      ok: true,
      exerciseId: exerciseId,
      name: exerciseNameFor(state, exerciseId),
      history: exerciseExposureHistory(state, exerciseId, 8),
      loadHint: hint,
      workingMaxKg: wm.length ? wm[0].valueKg : null,
    };
  }

  function workingMaxKgForExercise(state, exerciseId, asOfDate) {
    if (!exerciseId || !global.HybridStrength?.WorkingMax?.currentWorkingMax) return null;
    asOfDate = asOfDate || isoNow().slice(0, 10);
    var events = (ensureStrengthState(state).workingMaxEvents || []).filter(function (e) {
      return e.exerciseId === exerciseId;
    });
    var wm = global.HybridStrength.WorkingMax.currentWorkingMax(events, asOfDate);
    return wm ? wm.valueKg : null;
  }

  function hasWorkingMax(state, exerciseId, asOfDate) {
    return workingMaxKgForExercise(state, exerciseId, asOfDate) != null;
  }

  function missingWorkingMaxExerciseIds(state, exerciseIds, asOfDate) {
    return (exerciseIds || []).filter(function (id) {
      return id && !hasWorkingMax(state, id, asOfDate);
    });
  }

  /**
   * Athlete (or coach) sets the anchor working max for an exercise.
   * Subsequent %WM prescriptions and load hints build from this number.
   */
  function setWorkingMax(state, exerciseId, valueKg, opts) {
    opts = opts || {};
    if (!exerciseId || !hasStrength()) return { ok: false, reason: 'missing' };
    var kg = num(valueKg);
    if (kg <= 0 || kg > 2000) return { ok: false, reason: 'invalid_value' };
    var ss = ensureStrengthState(state);
    var athleteId = (state.meta && state.meta.ownerId) || 'local';
    var source = opts.source || 'athlete_set';
    var effectiveAt = opts.effectiveAt || isoNow();
    ss.workingMaxEvents.push({
      id: localId('wm'),
      athleteId: athleteId,
      exerciseId: exerciseId,
      valueKg: kg,
      source: source,
      formula: null,
      fromSetId: opts.fromSetId || null,
      effectiveAt: effectiveAt,
    });
    if (opts.setLoadHint !== false) {
      var hintKg = kg;
      if (opts.exercise && opts.exercise.loadExpr) {
        var resolved = resolveExerciseLoad(state, opts.exercise, String(effectiveAt).slice(0, 10));
        if (resolved && resolved.loadKg != null) hintKg = resolved.loadKg;
      }
      ss.loadHints[exerciseId] = {
        loadKg: hintKg,
        updatedAt: isoNow(),
        source: source,
      };
    }
    return { ok: true, valueKg: kg, exerciseId: exerciseId };
  }

  function equipmentForExercise(exercise) {
    var eq = exercise && exercise.equipment;
    if (eq && typeof eq === 'object' && (eq.incrementKg != null || eq.rackValuesKg)) return eq;
    // HTML exercises rarely carry Equipment yet — default barbell 2.5 kg so %WM rounds.
    return { id: 'default-barbell-kg', name: 'Barbell (kg)', incrementKg: 2.5, rackValuesKg: null, rounding: 'nearest' };
  }

  function fillBlankRowWeights(ex, loadKg) {
    if (loadKg == null) return;
    var first = (ex.rows || []).find(function (row) { return !row.done && !row.extra; });
    if (first && (first.weight === '' || first.weight == null)) first.weight = loadKg;
  }

  function fillBlankRowReps(ex) {
    (ex.rows || []).forEach(function (row) {
      if (row.done || row.extra) return;
      if (row.reps !== '' && row.reps != null) return;
      var raw = String(row.target || '').trim();
      var m = raw.match(/^(\d+)/);
      if (m) row.reps = m[1];
    });
  }

  function isVolumeDeferred(ex) {
    if (!ex) return false;
    if (ex.autopilotVolume === true) return true;
    if (ex.autopilotVolume === false) return false;
    var noSets = ex.sets == null || ex.sets === '';
    var noReps = ex.reps == null || String(ex.reps).trim() === '';
    return noSets && noReps;
  }

  function rebuildRowsFromPrescription(ex) {
    var count = Math.max(1, num(ex.sets) || 1);
    var raw = String(ex.reps == null ? '' : ex.reps);
    var parts = raw.split(',').map(function (x) { return x.trim(); }).filter(function (x, i, a) { return a.length > 1 || x !== '' || i === 0; });
    if (!parts.length) parts = [''];
    if (parts.length === 1) parts = Array.from({ length: count }, function () { return parts[0]; });
    while (parts.length < count) parts.push(parts[parts.length - 1] || '');
    parts = parts.slice(0, count);
    ex.rows = parts.map(function (target, i) {
      var m = String(target).match(/^(\d+)/);
      return {
        id: 'row_' + Math.random().toString(36).slice(2, 9),
        n: i + 1,
        target: target,
        targetKind: /s(ec(onds?)?)?$/i.test(String(target)) ? 'seconds' : 'reps',
        weight: '',
        reps: m ? m[1] : '',
        prescribedLoad: '',
        done: false,
        extra: false,
      };
    });
  }

  function mergeRecoveryGates(a, b) {
    var rank = { hold: 3, caution: 2, ok: 1 };
    var ra = rank[a] || 1;
    var rb = rank[b] || 1;
    return ra >= rb ? a : b;
  }

  function activeSessionFromState(state) {
    if (!state || !state.active) return null;
    var sessions = state.sessions || [];
    for (var i = 0; i < sessions.length; i++) {
      if (sessions[i] && sessions[i].id === state.active) return sessions[i];
    }
    return null;
  }

  function recoveryGateForAutopilot(state) {
    var gate = 'ok';
    var sess = activeSessionFromState(state);
    if (sess && sess.llmRecoveryGate) gate = mergeRecoveryGates(gate, sess.llmRecoveryGate);
    if (!global.RecoverySignals) return gate;
    try {
      var recovery = global.RecoverySignals.recoverySignal(state, { date: isoNow().slice(0, 10) });
      return mergeRecoveryGates(gate, recovery && recovery.gate ? recovery.gate : 'ok');
    } catch (_e) {
      return gate;
    }
  }

  function applyAutopilotVolumeToExercise(state, ex, sessionCtx) {
    if (!ex || !isVolumeDeferred(ex)) return;
    if (!hasStrength() || !global.HybridStrength.InitialPrescription) return;
    sessionCtx = sessionCtx || {};
    var exerciseId = ex.exerciseId || ex.id;
    var name = ex.name || exerciseNameFor(state, exerciseId);
    var cat = ex.category || '';
    if (repProgressionLift(name, cat, state, exerciseId, ex.rows)) {
      var ss = ensureStrengthState(state);
      var vHint = ss.volumeHints[exerciseId];
      if (vHint && vHint.sets && vHint.reps) {
        ex.sets = Math.max(1, Math.min(12, num(vHint.sets) || 3));
        ex.reps = String(vHint.reps);
        ex.autopilotVolume = true;
        ex.autopilotVolumeReasons = [vHint.source || 'volume_hint'];
        rebuildRowsFromPrescription(ex);
        return;
      }
      var repHist = exerciseRepSessionHistory(state, exerciseId, 1);
      var lastRep = repHist[0] || null;
      var repCal = calibrationForRepExercise(state, exerciseId).state;
      var repDecision = global.HybridStrength.InitialPrescription.decideInitialPrescription({
        coachSets: ex.sets,
        coachReps: ex.reps,
        calibration: repCal,
        lastSession: lastRep ? { setCount: lastRep.setCount, reps: lastRep.reps } : null,
        recoveryGate: sessionCtx.recoveryGate || recoveryGateForAutopilot(state),
        maxSetsForExercise: sessionCtx.maxSetsForExercise,
      });
      ex.sets = repDecision.sets;
      ex.reps = repDecision.reps;
      ex.autopilotVolume = repDecision.autopilotVolume;
      ex.autopilotVolumeReasons = repDecision.reasonCodes;
      rebuildRowsFromPrescription(ex);
      return;
    }
    var history = exerciseId ? exerciseExposureHistory(state, exerciseId, 1) : [];
    var last = history[0] || null;
    var exposures = exerciseId
      ? global.HybridStrength.Exposure.strengthExposuresFor(exerciseId, performedFromState(state))
      : [];
    var cal = global.HybridStrength.Calibration
      ? global.HybridStrength.Calibration.calibrationStateFor(exposures)
      : calibrationStateForExposures(exposures);
    var decision = global.HybridStrength.InitialPrescription.decideInitialPrescription({
      coachSets: ex.sets,
      coachReps: ex.reps,
      calibration: cal,
      lastSession: last ? { setCount: last.setCount || num(ex.sets) || 3, reps: last.reps || 8 } : null,
      recoveryGate: sessionCtx.recoveryGate || recoveryGateForAutopilot(state),
      maxSetsForExercise: sessionCtx.maxSetsForExercise,
    });
    ex.sets = decision.sets;
    ex.reps = decision.reps;
    ex.autopilotVolume = decision.autopilotVolume;
    ex.autopilotVolumeReasons = decision.reasonCodes;
    rebuildRowsFromPrescription(ex);
  }

  function countSessionWorkingSets(tasks) {
    var total = 0;
    (tasks || []).forEach(function (t) {
      if (t.kind === 'strength') total += (t.rows || []).filter(function (r) { return !r.extra; }).length;
      if (t.kind === 'superset') {
        (t.exercises || []).forEach(function (ex) {
          total += (ex.rows || []).filter(function (r) { return !r.extra; }).length;
        });
      }
    });
    return total;
  }

  function applyAutopilotToExercise(state, ex, asOfDate, sessionCtx) {
    applyAutopilotVolumeToExercise(state, ex, sessionCtx);
    applyLoadHintsToExercise(state, ex, asOfDate);
  }

  function applyAutopilotToTasks(state, tasks, asOfDate) {
    var recoveryGate = recoveryGateForAutopilot(state);
    (tasks || []).forEach(function (t) {
      if (t.kind === 'strength') {
        applyAutopilotToExercise(state, t, asOfDate, {
          recoveryGate: recoveryGate,
          maxSetsForExercise: null,
        });
      }
      if (t.kind === 'superset') {
        (t.exercises || []).forEach(function (ex) {
          applyAutopilotToExercise(state, ex, asOfDate, { recoveryGate: recoveryGate });
        });
      }
    });
  }

  function suggestNextSet(state, task, input) {
    if (!hasStrength() || !global.HybridStrength.DecideNextSet) return null;
    input = input || {};
    var equipment = equipmentForExercise(task);
    var repRange = parseRepRange(task.reps || input.prescribedReps);
    var planned = (task.rows || []).filter(function (r) { return !r.extra; });
    return global.HybridStrength.DecideNextSet.decideNextSet({
      performedLoadKg: num(input.performedLoadKg),
      performedReps: num(input.performedReps),
      prescribedReps: num(input.prescribedReps),
      prescribedLoadKg: num(input.prescribedLoadKg),
      difficulty: input.difficulty || 'medium',
      equipment: equipment,
      sessionAnchorKg: num(input.sessionAnchorKg),
      targetRir: targetRirForExercise(task),
      repRangeLo: repRange ? repRange.lo : undefined,
      repRangeHi: repRange ? repRange.hi : undefined,
      ordinal: num(input.ordinal),
      totalOrdinals: planned.length || num(task.sets) || 1,
    });
  }

  function autopilotReadyForExercise(state, exerciseId, minSessions) {
    if (!exerciseId || !hasStrength()) return false;
    var cal = calibrationForExercise(state, exerciseId);
    if (!cal) return false;
    return num(cal.count) >= num(minSessions || 2);
  }

  var DEFAULT_SESSION_PCT_WM = 0.7;

  function loadExprFromLogColumns(ex) {
    if (!ex || !Array.isArray(ex.logColumns)) return null;
    for (var i = 0; i < ex.logColumns.length; i++) {
      var c = ex.logColumns[i];
      if (!c || !c.kind) continue;
      var raw = c.values && c.values.length ? c.values[0] : c.value;
      if (c.kind === 'weight_pct_wm') {
        var pct = Number(String(raw == null ? '' : raw).split(',')[0]);
        if (pct >= 1 && pct <= 100) return { exprKind: 'pct_of_max', exprArg: pct / 100 };
      }
      if (c.kind === 'weight_lwp') {
        var delta = Number(String(raw == null ? '' : raw).split(',')[0]);
        if (!Number.isNaN(delta)) return { exprKind: 'lwp_delta', exprArg: delta };
      }
    }
    return null;
  }

  /**
   * Athlete autopilot lifts often omit loadExpr — infer %WM (or pinned column) before resolve.
   */
  function ensureSessionLoadExpr(state, ex) {
    if (!ex || ex.loadExpr) return;
    var fromCols = loadExprFromLogColumns(ex);
    if (fromCols) {
      ex.loadExpr = fromCols;
      return;
    }
    var exerciseId = ex.exerciseId || ex.id;
    var name = ex.name || '';
    var cat = ex.category || '';
    if (repProgressionLift(name, cat, state, exerciseId, ex.rows)) return;
    if (percentLiftCandidate(name, cat, state, exerciseId, ex.rows)) {
      ex.loadExpr = { exprKind: 'pct_of_max', exprArg: DEFAULT_SESSION_PCT_WM };
    }
  }

  function applyLoadHintsToExercise(state, ex, asOfDate) {
    if (!ex) return;
    var exerciseId = ex.exerciseId || ex.id;
    if (!exerciseId) return;
    ensureSessionLoadExpr(state, ex);
    fillBlankRowReps(ex);
    var name = ex.name || '';
    var cat = ex.category || '';
    if (repProgressionLift(name, cat, state, exerciseId, ex.rows)) return;
    var hint = ensureStrengthState(state).loadHints[exerciseId];
    if (hint && hint.loadKg) {
      fillBlankRowWeights(ex, hint.loadKg);
      return;
    }
    if (ex.loadExpr) {
      var resolved = resolveExerciseLoad(state, ex, asOfDate);
      if (resolved && resolved.loadKg != null) {
        fillBlankRowWeights(ex, resolved.loadKg);
        return;
      }
    }
    var hist = exerciseExposureHistory(state, exerciseId, 1);
    if (hist.length && hist[0].loadKg) fillBlankRowWeights(ex, hist[0].loadKg);
  }

  function applyLoadHintsToTasks(state, tasks, asOfDate) {
    (tasks || []).forEach(function (t) {
      if (t.kind === 'strength') applyLoadHintsToExercise(state, t, asOfDate);
      if (t.kind === 'superset') {
        (t.exercises || []).forEach(function (ex) { applyLoadHintsToExercise(state, ex, asOfDate); });
      }
    });
  }

  /**
   * Resolve prescribed load for an HTML exercise task (%WM etc.) via strength-engine.
   * exercise.loadExpr optional: { exprKind: 'pct_of_max', exprArg: 0.7 }
   */
  function calibrationStateForExposures(exposures) {
    var usable = (exposures || []).filter(function (e) { return e.exposureClass !== 'pain_blocked'; });
    if (!usable.length) return 'uncalibrated';
    return usable.length >= 2 ? 'calibrated' : 'building';
  }

  function calibrationForExercise(state, exerciseId) {
    if (!hasStrength() || !exerciseId) return null;
    var exposures = global.HybridStrength.Exposure.strengthExposuresFor(exerciseId, performedFromState(state));
    var usable = exposures.filter(function (e) { return e.exposureClass !== 'pain_blocked'; });
    var cal = calibrationStateForExposures(exposures);
    var label = cal === 'calibrated'
      ? 'Load model ready'
      : (usable.length > 0 ? 'Building load model · ' + usable.length + '/2 sessions' : 'No history yet');
    return { state: cal, count: usable.length, label: label };
  }

  /**
   * Explain today's prefilled load for logger/builder preview (hint vs %WM vs manual).
   */
  function sessionLoadContext(state, exercise, asOfDate) {
    if (!exercise) return { ok: false };
    var exerciseId = exercise.exerciseId || exercise.id;
    if (!exerciseId) return { ok: false };
    ensureStrengthState(state);
    var name = exercise.name || exerciseNameFor(state, exerciseId);
    var cat = exercise.category || '';
    if (repProgressionLift(name, cat, state, exerciseId, exercise.rows)) {
      var vHint = state.strengthState.volumeHints[exerciseId];
      var repCal = calibrationForRepExercise(state, exerciseId);
      var repHist = exerciseRepSessionHistory(state, exerciseId, 1);
      var headline = vHint
        ? (vHint.sets + ' × ' + vHint.reps + ' · rep autopilot')
        : (repHist.length ? 'Rep autopilot · last ' + repHist[0].topReps + ' reps' : 'Log reps — targets after history');
      return {
        ok: true,
        loadKg: null,
        source: 'rep_autopilot',
        headline: headline,
        detail: bodyweightRepLift(name, cat, state, exerciseId, exercise.rows)
          ? 'Bodyweight — rep targets from history; log reps each set'
          : 'Rep targets from history — log kg and reps each set',
        calibration: repCal,
        repMode: true,
      };
    }
    var hint = state.strengthState.loadHints[exerciseId];
    var resolved = exercise.loadExpr ? resolveExerciseLoad(state, exercise, asOfDate) : null;
    var wmKg = workingMaxKgForExercise(state, exerciseId, asOfDate);
    var pct = exercise.loadExpr && exercise.loadExpr.exprKind === 'pct_of_max'
      ? Math.round(num(exercise.loadExpr.exprArg) * 100)
      : null;

    var loadKg = null;
    var source = 'manual';
    var headline = 'Log weight manually';
    var detail = '';

    if (hint && hint.loadKg && autopilotReadyForExercise(state, exerciseId, 2)) {
      loadKg = hint.loadKg;
      source = hint.source === 'auto_estimate' ? 'progression' : 'hint';
      headline = loadKg + ' kg · progression';
      detail = 'Silent bump from recent on-target sessions';
    }

    if (!exercise.loadExpr && percentLiftCandidate(name, cat, state, exerciseId, exercise.rows)) {
      ensureSessionLoadExpr(state, exercise);
      resolved = exercise.loadExpr ? resolveExerciseLoad(state, exercise, asOfDate) : resolved;
      if (exercise.loadExpr && exercise.loadExpr.exprKind === 'pct_of_max') {
        pct = Math.round(num(exercise.loadExpr.exprArg) * 100);
      }
    }

    if (exercise.loadExpr && resolved && resolved.loadKg != null) {
      var presc = resolved.loadKg;
      var prescLine = (pct != null ? pct + '% working max' : 'Prescription') + (wmKg ? ' · WM ' + wmKg + ' kg' : '');
      if (!loadKg) {
        loadKg = presc;
        source = 'prescription';
        headline = presc + ' kg · ' + (pct != null ? pct + '% WM' : 'prescription');
        detail = prescLine;
      } else if (loadKg !== presc) {
        detail = (detail ? detail + ' · ' : '') + 'Prescription would be ' + presc + ' kg (' + prescLine + ')';
      }
    } else if (exercise.loadExpr && resolved && resolved.unresolvedReason === 'no_working_max') {
      detail = (detail ? detail + ' · ' : '') + 'Add a working max in Progress to resolve ' + (pct != null ? pct + '% WM' : 'prescription');
    }

    if (!loadKg && wmKg) {
      detail = (detail ? detail + ' · ' : '') + 'Working max ' + wmKg + ' kg';
    }

    if (addedLoadCapableLift(name) && exerciseUsesAddedLoadMode(state, exerciseId, name, exercise.rows)) {
      detail = (detail ? detail + ' · ' : '') + 'Added load — WM is belt/plate kg, not bodyweight';
    }

    return {
      ok: true,
      loadKg: loadKg,
      source: source,
      wmKg: wmKg,
      pct: pct,
      headline: headline,
      detail: detail,
      calibration: calibrationForExercise(state, exerciseId),
    };
  }

  function resolveExerciseLoad(state, exercise, asOfDate) {
    if (!hasStrength() || !exercise || !exercise.loadExpr) return null;
    if (!global.HybridStrength.Resolve?.resolveTarget) return null;
    var HS = global.HybridStrength;
    var scheduledDate = asOfDate || isoNow().slice(0, 10);
    var ctx = {
      athleteId: (state.meta && state.meta.ownerId) || 'local',
      scheduledDate: scheduledDate,
      workingMaxAt: function (exId, asOf) {
        return workingMaxKgForExercise(state, exId, asOf || scheduledDate);
      },
      lastPerformedLoad: function (_a, _exId) { return null; },
      bodyweightAt: function (_a, _asOf) { return num(state.profile && state.profile.bodyweight) || null; },
    };
    var fakeEx = {
      id: exercise.exerciseId || exercise.id,
      equipment: equipmentForExercise(exercise),
      referenceMaxExerciseId: null,
    };
    var t = {
      exprKind: exercise.loadExpr.exprKind,
      exprArg: exercise.loadExpr.exprArg,
      literalValue: null,
      rangeLo: null,
      rangeHi: null,
      exprRefExercise: exercise.loadExpr.exprRefExercise || null,
    };
    var r = HS.Resolve.resolveTarget(t, fakeEx, ctx);
    if (r.kind === 'scalar') return { loadKg: r.value, unresolvedReason: null };
    if (r.kind === 'unresolved') return { loadKg: null, unresolvedReason: r.reason };
    return null;
  }

  function targetRirForExercise(exercise) {
    var n = exercise && exercise.targetRir;
    if (n != null && Number.isFinite(Number(n))) return Math.max(0, Math.min(10, Number(n)));
    return 2;
  }

  function parseRepRange(reps) {
    var s = String(reps || '').trim();
    var m = s.match(/^(\d+)\s*[-–]\s*(\d+)$/);
    if (!m) return null;
    var lo = Number(m[1]);
    var hi = Number(m[2]);
    if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi < lo) return null;
    return { lo: lo, hi: hi };
  }

  global.StrengthAdapter = {
    hasStrength: hasStrength,
    ensureStrengthState: ensureStrengthState,
    sessionLoadFromRows: sessionLoadFromRows,
    performedFromSession: performedFromSession,
    applySilentProgression: applySilentProgression,
    applySilentProgressionAsync: applySilentProgressionAsync,
    mergeAiProgressionAction: mergeAiProgressionAction,
    applyLoadHintsToTasks: applyLoadHintsToTasks,
    ensureSessionLoadExpr: ensureSessionLoadExpr,
    applyAutopilotToTasks: applyAutopilotToTasks,
    applyAutopilotVolumeToExercise: applyAutopilotVolumeToExercise,
    isVolumeDeferred: isVolumeDeferred,
    suggestNextSet: suggestNextSet,
    rebuildRowsFromPrescription: rebuildRowsFromPrescription,
    trainedExerciseIds: trainedExerciseIds,
    recordPrEvents: recordPrEvents,
    progressSummary: progressSummary,
    progressExerciseDetail: progressExerciseDetail,
    exerciseExposureHistory: exerciseExposureHistory,
    auditReasonText: auditReasonText,
    exerciseNameFor: exerciseNameFor,
    setWorkingMax: setWorkingMax,
    hasWorkingMax: hasWorkingMax,
    missingWorkingMaxExerciseIds: missingWorkingMaxExerciseIds,
    workingMaxKgForExercise: workingMaxKgForExercise,
    resolveExerciseLoad: resolveExerciseLoad,
    sessionLoadContext: sessionLoadContext,
    calibrationForExercise: calibrationForExercise,
    targetRirForExercise: targetRirForExercise,
    repProgressionLift: repProgressionLift,
    timedHoldLift: timedHoldLift,
    bodyweightRepLift: bodyweightRepLift,
    percentLiftCandidate: percentLiftCandidate,
    addedLoadCapableLift: addedLoadCapableLift,
    exerciseUsesAddedLoadMode: exerciseUsesAddedLoadMode,
    exerciseRepSessionHistory: exerciseRepSessionHistory,
    calibrationForRepExercise: calibrationForRepExercise,
    mergeAiVolumeAction: mergeAiVolumeAction,
    resolveRepVolumeAction: resolveRepVolumeAction,
    parseRepRange: parseRepRange,
    ENGINE_VERSION: ENGINE_VERSION,
  };
})(typeof window !== 'undefined' ? window : globalThis);
