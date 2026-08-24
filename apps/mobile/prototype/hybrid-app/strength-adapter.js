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

  function applyLoadHintsToExercise(state, ex) {
    if (!ex || !ex.exerciseId) return;
    var hint = ensureStrengthState(state).loadHints[ex.exerciseId];
    if (!hint || !hint.loadKg) return;
    (ex.rows || []).forEach(function (row) {
      if (!row.done && (row.weight === '' || row.weight == null)) row.weight = hint.loadKg;
    });
  }

  function applyLoadHintsToTasks(state, tasks) {
    (tasks || []).forEach(function (t) {
      if (t.kind === 'strength') applyLoadHintsToExercise(state, t);
      if (t.kind === 'superset') (t.exercises || []).forEach(function (ex) { applyLoadHintsToExercise(state, ex); });
    });
  }

  global.StrengthAdapter = {
    hasStrength: hasStrength,
    ensureStrengthState: ensureStrengthState,
    performedFromSession: performedFromSession,
    applySilentProgression: applySilentProgression,
    applyLoadHintsToTasks: applyLoadHintsToTasks,
    trainedExerciseIds: trainedExerciseIds,
    ENGINE_VERSION: ENGINE_VERSION,
  };
})(typeof window !== 'undefined' ? window : globalThis);
