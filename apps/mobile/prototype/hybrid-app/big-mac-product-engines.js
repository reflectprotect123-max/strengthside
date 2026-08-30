/**
 * Shipped Hybrid product engines → BIG MAC domain outputs.
 * Uses deterministic JS engines (not evidence-platform research corpus).
 * No human promotion gate — these are the athlete app's live decision layer.
 */
(function (global) {
  'use strict';

  var ENGINE_VERSION = '1.0.0-product';
  var MODEL_VERSION = 'hybrid-product-v1';

  function num(v) {
    var n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  function makeOutput(system, action, reasonCodes, stateEstimate, confidence) {
    reasonCodes = reasonCodes || [];
    stateEstimate = stateEstimate || {};
    confidence = confidence == null ? 0.85 : confidence;
    return {
      system: system,
      engine_version: ENGINE_VERSION,
      status: 'inactive_no_approved_model',
      synthetic_test_only: false,
      confidence: confidence,
      model_version: MODEL_VERSION,
      evidence_ids: [],
      reason_codes: reasonCodes.slice(),
      state_estimate: stateEstimate,
      constraints: [],
      proposed_actions: [{
        action: action,
        candidate_id: 'CAND-PRODUCT-' + system.toUpperCase(),
        eligible: action !== 'abstain',
        reason_codes: reasonCodes.slice(),
        source_system: system,
        synthetic_test_only: false,
      }],
    };
  }

  function appState(snapshot) {
    return (snapshot && snapshot.app_state) || {};
  }

  function findSession(state, sessionId) {
    if (!sessionId) return null;
    return (state.sessions || []).find(function (s) { return s && s.id === sessionId; }) || null;
  }

  function mapStrengthAction(decisionAction) {
    if (decisionAction === 'progress') return 'proceed';
    if (decisionAction === 'deload') return 'trim';
    if (decisionAction === 'retest') return 'modify';
    return 'hold';
  }

  function trainedExerciseIds(session) {
    if (!session || !global.StrengthAdapter || !global.StrengthAdapter.trainedExerciseIds) {
      var ids = [];
      (session && session.tasks || []).forEach(function (t) {
        if (t && t.exerciseId) ids.push(t.exerciseId);
      });
      return ids.filter(function (id, i, arr) { return arr.indexOf(id) === i; });
    }
    return global.StrengthAdapter.trainedExerciseIds(session);
  }

  function performedFromState(state) {
    if (global.StrengthAdapter && global.HybridStrength && global.HybridStrength.Performed) {
      ensureStrengthState(state);
      return global.HybridStrength.Performed.performedSetsFromSessions(state.sessions || []);
    }
    return [];
  }

  function ensureStrengthState(state) {
    state.strengthState = state.strengthState || { workingMaxEvents: [], prEvents: [], loadHints: {} };
    state.meta = state.meta || {};
  }

  function evaluateStrength(snapshot) {
    var domain = snapshot.strength_domain || {};
    var state = appState(snapshot);
    var session = findSession(state, domain.session_id);
    if (!session) return makeOutput('strength', 'record_only', ['STRENGTH_NO_SESSION'], {}, 0.5);

    if (session.sessionPain === 'yes') {
      return makeOutput('strength', 'hold', ['session_pain_yes'], { sessionPain: 'yes' });
    }

    if (!global.HybridStrength || !global.HybridStrength.Progression || !global.HybridStrength.Exposure) {
      return makeOutput('strength', 'abstain', ['STRENGTH_BUNDLE_MISSING'], {}, 0);
    }

    ensureStrengthState(state);
    var performed = performedFromState(state);
    var exerciseIds = trainedExerciseIds(session);
    if (!exerciseIds.length) return makeOutput('strength', 'record_only', ['STRENGTH_NO_EXERCISES'], {}, 0.5);

    var actions = [];
    var codes = [];
    exerciseIds.forEach(function (exerciseId) {
      var exposures = global.HybridStrength.Exposure.strengthExposuresFor(exerciseId, performed);
      var decision = global.HybridStrength.Progression.decideProgression(exposures, { exerciseId: exerciseId });
      actions.push(decision.action);
      codes = codes.concat(decision.reasonCodes || []);
    });

    var mapped;
    if (actions.indexOf('deload') >= 0) mapped = 'trim';
    else if (actions.indexOf('progress') >= 0) mapped = 'proceed';
    else if (actions.indexOf('retest') >= 0) mapped = 'modify';
    else mapped = 'hold';

    return makeOutput('strength', mapped, codes.length ? codes : ['mixed_signal'], {
      exerciseCount: exerciseIds.length,
      rawActions: actions,
    });
  }

  function evaluateConditioning(snapshot) {
    var domain = snapshot.conditioning_domain || {};
    var state = appState(snapshot);
    var meta = state.meta || {};
    var last = meta.lastConAdapt;

    if (last && last.delta != null) {
      if (num(last.delta) > 0) return makeOutput('conditioning', 'proceed', ['con_adapt_progress'], { delta: last.delta });
      if (num(last.delta) < 0) return makeOutput('conditioning', 'trim', ['con_adapt_regress'], { delta: last.delta });
      return makeOutput('conditioning', 'maintain', ['con_adapt_hold'], { delta: 0 });
    }

    if (domain.rec && global.HybridEngine && global.HybridEngine.Conditioning && global.HybridEngine.Conditioning.conAdapt) {
      state.settings = state.settings || {};
      var result = global.HybridEngine.Conditioning.conAdapt(domain.rec, state.settings);
      if (num(result.delta) > 0) return makeOutput('conditioning', 'proceed', ['con_adapt_preview_progress'], { delta: result.delta });
      if (num(result.delta) < 0) return makeOutput('conditioning', 'trim', ['con_adapt_preview_regress'], { delta: result.delta });
      return makeOutput('conditioning', 'maintain', ['con_adapt_preview_hold'], { delta: 0 });
    }

    if (domain.sessions_completed > 0) {
      return makeOutput('conditioning', 'record_only', ['conditioning_logged'], {
        sessionsCompleted: domain.sessions_completed,
      }, 0.6);
    }

    return makeOutput('conditioning', 'record_only', ['conditioning_no_adapt_signal'], {}, 0.4);
  }

  function evaluateRecovery(snapshot) {
    var domain = snapshot.recovery_domain || {};
    if (domain.illness === true) {
      return makeOutput('recovery', 'hold', ['illness_flagged'], { illness: true });
    }

    var posture = domain.posture;
    if (!posture && global.RecoveryEngine && global.RecoveryEngine.recoveryPosture && domain.input) {
      posture = global.RecoveryEngine.recoveryPosture(domain.input);
    }
    if (!posture) return makeOutput('recovery', 'record_only', ['recovery_no_posture'], {}, 0.4);

    if (posture.gate === 'hold' || posture.band === 'minimum') {
      return makeOutput('recovery', 'hold', posture.reasonCodes || ['recovery_minimum'], {
        band: posture.band,
        gate: posture.gate,
      });
    }
    if (posture.gate === 'caution' || posture.band === 'control') {
      return makeOutput('recovery', 'maintain', posture.reasonCodes || ['recovery_control'], {
        band: posture.band,
        gate: posture.gate,
      });
    }
    if (posture.band === 'insufficient_data') {
      return makeOutput('recovery', 'record_only', ['recovery_no_checkin'], { band: posture.band }, 0.5);
    }
    return makeOutput('recovery', 'proceed', posture.reasonCodes || ['recovery_build'], {
      band: posture.band,
      gate: posture.gate,
    });
  }

  function evaluateNutrition(snapshot) {
    var domain = snapshot.nutrition_domain || {};
    var daysInWindow = num(domain.days_in_window) || 7;
    var daysLogged = num(domain.days_logged);
    var lowEnergy = !!domain.low_energy_flag;

    if (lowEnergy) {
      return makeOutput('nutrition', 'hold', ['nutrition_low_energy'], { daysLogged: daysLogged });
    }
    if (daysLogged === 0) {
      return makeOutput('nutrition', 'record_only', ['nutrition_none'], { daysInWindow: daysInWindow }, 0.5);
    }
    var pct = daysInWindow > 0 ? daysLogged / daysInWindow : 0;
    if (pct < 0.5) {
      return makeOutput('nutrition', 'maintain', ['nutrition_sparse'], { daysLogged: daysLogged, daysInWindow: daysInWindow });
    }
    if (domain.off_target === true) {
      return makeOutput('nutrition', 'modify', ['nutrition_off_target'], domain.targets || {});
    }
    return makeOutput('nutrition', 'proceed', ['nutrition_logged'], { daysLogged: daysLogged, daysInWindow: daysInWindow });
  }

  function coordinatorKindToAction(kind) {
    if (kind === 'hold') return 'hold';
    if (kind === 'ease') return 'trim';
    if (kind === 'push') return 'proceed';
    if (kind === 'maintain') return 'maintain';
    return 'record_only';
  }

  function evaluateCoordinator(snapshot) {
    var state = appState(snapshot);
    var domain = snapshot.coordinator_domain || {};
    var endDate = domain.end_date || domain.endDate;
    var days = num(domain.days) || 7;

    if (global.CoordinatorAdapter && global.CoordinatorAdapter.planWeek) {
      var receipt = global.CoordinatorAdapter.planWeek(state, endDate, days);
      if (!receipt) return makeOutput('coordinator', 'abstain', ['COORDINATOR_UNAVAILABLE'], {}, 0);

      var silent = (receipt.items || []).filter(function (it) { return it.silentApply; });
      var primary = silent[0] || (receipt.items || [])[0];
      if (!primary) {
        return makeOutput('coordinator', 'record_only', receipt.reasonCodes || ['coordinator_steady'], {
          headline: receipt.headline,
        }, 0.6);
      }
      var action = coordinatorKindToAction(primary.kind);
      return makeOutput('coordinator', action, (receipt.reasonCodes || []).concat([primary.kind]), {
        headline: receipt.headline,
        domain: primary.domain,
        kind: primary.kind,
        message: primary.message,
        itemCount: (receipt.items || []).length,
      });
    }

    return makeOutput('coordinator', 'abstain', ['COORDINATOR_ADAPTER_MISSING'], {}, 0);
  }

  function runAll(snapshot) {
    return {
      strength: evaluateStrength(snapshot),
      conditioning: evaluateConditioning(snapshot),
      nutrition: evaluateNutrition(snapshot),
      recovery: evaluateRecovery(snapshot),
      coordinator: evaluateCoordinator(snapshot),
    };
  }

  global.BigMacProductEngines = {
    ENGINE_VERSION: ENGINE_VERSION,
    MODEL_VERSION: MODEL_VERSION,
    makeOutput: makeOutput,
    evaluateStrength: evaluateStrength,
    evaluateConditioning: evaluateConditioning,
    evaluateNutrition: evaluateNutrition,
    evaluateRecovery: evaluateRecovery,
    evaluateCoordinator: evaluateCoordinator,
    runAll: runAll,
  };
})(typeof window !== 'undefined' ? window : globalThis);
