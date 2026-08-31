/**
 * OpenRouter-backed strength progression (server-side key).
 * Validates JSON decisions; never blocks training.
 */
(function (global) {
  'use strict';

  var ALLOWED = { hold: true, progress: true, deload: true, retest: true };
  var ENDPOINT = '/.netlify/functions/ai-strength-progression';
  var TIMEOUT_MS = 12000;

  function validateProgressionDecision(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var action = String(raw.action || '');
    if (!ALLOWED[action]) return null;
    var reasonCodes = Array.isArray(raw.reason_codes)
      ? raw.reason_codes.map(String).slice(0, 16)
      : (Array.isArray(raw.reasonCodes) ? raw.reasonCodes.map(String).slice(0, 16) : []);
    var confidence = Number(raw.confidence);
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) confidence = 0.5;
    var deltaPct = raw.delta_pct != null ? raw.delta_pct : raw.deltaPct;
    if (deltaPct != null) {
      deltaPct = Number(deltaPct);
      if (!Number.isFinite(deltaPct) || deltaPct < -0.15 || deltaPct > 0.1) deltaPct = undefined;
    }
    return {
      action: action,
      reasonCodes: reasonCodes,
      confidence: confidence,
      deltaPct: deltaPct,
      source: 'ai_openrouter',
    };
  }

  function validateVolumeDecision(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var action = String(raw.action || '');
    if (!ALLOWED[action]) return null;
    var reasonCodes = Array.isArray(raw.reason_codes)
      ? raw.reason_codes.map(String).slice(0, 16)
      : (Array.isArray(raw.reasonCodes) ? raw.reasonCodes.map(String).slice(0, 16) : []);
    var confidence = Number(raw.confidence);
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) confidence = 0.5;
    var sets = raw.sets != null ? Number(raw.sets) : null;
    if (sets != null && (!Number.isFinite(sets) || sets < 1 || sets > 12)) sets = null;
    var reps = raw.reps != null ? String(raw.reps).trim().slice(0, 24) : null;
    if (reps && !/^[\d\s\-–,]+$/.test(reps)) reps = null;
    return {
      action: action,
      sets: sets,
      reps: reps,
      reasonCodes: reasonCodes,
      confidence: confidence,
      source: 'ai_openrouter_rep',
    };
  }

  function buildFlashCard(state, exerciseId, ctx) {
    ctx = ctx || {};
    var exposures = ctx.exposures || [];
    var recent = exposures.slice(-5).map(function (e) {
      return {
        at: e.performedAt,
        class: e.exposureClass,
        loadKg: e.loadKg,
        onTarget: !!e.onTarget,
        pain: !!e.painFlagged,
      };
    });
    var deterministic = ctx.deterministic || null;
    return {
      progression_mode: 'load',
      exercise_id: exerciseId,
      exercise_name: ctx.exerciseName || exerciseId,
      calibration: ctx.calibration || 'unknown',
      recent_exposures: recent,
      session_pain: ctx.sessionPain || 'none',
      recovery_gate: ctx.recoveryGate || 'ok',
      recovery_reason_codes: ctx.recoveryReasonCodes || [],
      performance_override: !!ctx.performanceOverride,
      deterministic_action: deterministic ? deterministic.action : null,
      debt_score: ctx.debtScore != null ? ctx.debtScore : undefined,
    };
  }

  function buildRepFlashCard(state, exerciseId, ctx) {
    ctx = ctx || {};
    var repHistory = (ctx.repHistory || []).slice(0, 5).map(function (r) {
      return {
        date: r.date,
        sets: r.setCount,
        top_reps: r.topReps,
        added_load_kg: r.addedLoadKg || 0,
        session: r.sessionName || '',
      };
    });
    var det = ctx.deterministic || {};
    return {
      progression_mode: 'reps',
      exercise_id: exerciseId,
      exercise_name: ctx.exerciseName || exerciseId,
      calibration: ctx.calibration || 'unknown',
      recent_rep_sessions: repHistory,
      session_pain: ctx.sessionPain || 'none',
      recovery_gate: ctx.recoveryGate || 'ok',
      recovery_reason_codes: ctx.recoveryReasonCodes || [],
      deterministic_action: det.action || null,
      deterministic_sets: det.sets != null ? det.sets : null,
      deterministic_reps: det.reps != null ? det.reps : null,
    };
  }

  function fetchWithTimeout(url, options, ms) {
    if (typeof AbortController === 'undefined') {
      return fetch(url, options);
    }
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, ms);
    return fetch(url, Object.assign({}, options, { signal: ctrl.signal }))
      .finally(function () { clearTimeout(timer); });
  }

  function postFlash(flash) {
    return fetchWithTimeout(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ flash: flash }),
    }, TIMEOUT_MS).then(function (res) {
      if (!res.ok) throw new Error('ai_http_' + res.status);
      return res.json();
    });
  }

  function fetchProgressionDecision(flashCard) {
    return postFlash(flashCard).then(function (body) {
      var validated = validateProgressionDecision(body && body.decision ? body.decision : body);
      if (!validated) throw new Error('ai_invalid_decision');
      return validated;
    });
  }

  function fetchVolumeDecision(flashCard) {
    return postFlash(flashCard).then(function (body) {
      var validated = validateVolumeDecision(body && body.decision ? body.decision : body);
      if (!validated) throw new Error('ai_invalid_volume_decision');
      return validated;
    });
  }

  function llmEnabled(state) {
    state = state || {};
    var s = state.settings || {};
    if (s.llmProgression === false) return false;
    return true;
  }

  global.StrengthAI = {
    llmEnabled: llmEnabled,
    validateProgressionDecision: validateProgressionDecision,
    validateVolumeDecision: validateVolumeDecision,
    buildFlashCard: buildFlashCard,
    buildRepFlashCard: buildRepFlashCard,
    fetchProgressionDecision: fetchProgressionDecision,
    fetchVolumeDecision: fetchVolumeDecision,
    ENDPOINT: ENDPOINT,
  };
})(typeof window !== 'undefined' ? window : globalThis);
