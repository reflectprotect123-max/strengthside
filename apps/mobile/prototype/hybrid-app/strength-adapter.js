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
    state.meta = state.meta || {};
    state.meta.progressionAudit = state.meta.progressionAudit || [];
    return state.strengthState;
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

  /**
   * Apply silent progression for a just-completed session.
   * Mutates state.strengthState and state.meta.progressionAudit; caller saves.
   */
  function applySilentProgression(state, session, opts) {
    opts = opts || {};
    if (!hasStrength()) {
      if (!opts.quiet) console.warn('StrengthAdapter: HybridStrength bundle missing — skip silent apply');
      return { applied: 0, skipped: 'no_bundle' };
    }
    if (!global.RecoverySignals) {
      if (!opts.quiet) console.warn('StrengthAdapter: RecoverySignals missing — skip silent apply');
      return { applied: 0, skipped: 'no_recovery' };
    }

    ensureStrengthState(state);
    var recovery = opts.recoverySignal || global.RecoverySignals.recoverySignal(opts.recoveryInput || {});
    var performed = performedFromState(state);
    var prEvents = state.strengthState.prEvents.slice();
    var exerciseIds = trainedExerciseIds(session);
    var applied = 0;

    exerciseIds.forEach(function (exerciseId) {
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

      var anchor = currentAnchorLoad(state, exerciseId, performed);
      var deltaKg = decision.deltaKg;

      if (action === 'progress' && anchor != null) {
        var progressed = roundLoad(anchor * (1 + (decision.deltaPct || 0.025)));
        if (progressed > anchor) {
          applyLoadChange(state, exerciseId, progressed, 'auto_estimate', session.id, null);
          deltaKg = progressed - anchor;
        } else {
          action = 'hold';
          reasonCodes.push('progress_rounded_no_change');
        }
      } else if (action === 'deload' && anchor != null) {
        var deloaded = roundLoad(anchor * (1 + (decision.deltaPct || -0.05)));
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
        performanceOverride: performanceOverride,
        engineVersion: ENGINE_VERSION,
      });

      if (action === 'progress' || action === 'deload') applied++;
    });

    return { applied: applied, recoveryGate: recovery.gate };
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
    var events = (ensureStrengthState(state).workingMaxEvents || []).filter(function (e) {
      return e.exerciseId === exerciseId;
    });
    var wm = global.HybridStrength.WorkingMax.currentWorkingMax(events, asOfDate);
    return wm ? wm.valueKg : null;
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
      return {
        id: 'row_' + Math.random().toString(36).slice(2, 9),
        n: i + 1,
        target: target,
        targetKind: /s(ec(onds?)?)?$/i.test(String(target)) ? 'seconds' : 'reps',
        weight: '',
        reps: '',
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

  function applyLoadHintsToExercise(state, ex, asOfDate) {
    if (!ex) return;
    var exerciseId = ex.exerciseId || ex.id;
    if (!exerciseId) return;
    var hint = ensureStrengthState(state).loadHints[exerciseId];
    if (hint && hint.loadKg && autopilotReadyForExercise(state, exerciseId, 2)) fillBlankRowWeights(ex, hint.loadKg);
    if (ex.loadExpr) {
      var resolved = resolveExerciseLoad(state, ex, asOfDate);
      if (resolved && resolved.loadKg != null) fillBlankRowWeights(ex, resolved.loadKg);
    }
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
    applyLoadHintsToTasks: applyLoadHintsToTasks,
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
    resolveExerciseLoad: resolveExerciseLoad,
    sessionLoadContext: sessionLoadContext,
    calibrationForExercise: calibrationForExercise,
    targetRirForExercise: targetRirForExercise,
    parseRepRange: parseRepRange,
    ENGINE_VERSION: ENGINE_VERSION,
  };
})(typeof window !== 'undefined' ? window : globalThis);
