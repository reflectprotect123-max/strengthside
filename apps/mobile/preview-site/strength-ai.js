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

  function fetchWithTimeout(url, options, ms) {
    if (typeof AbortController === 'undefined') {
      return fetch(url, options);
    }
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, ms);
    return fetch(url, Object.assign({}, options, { signal: ctrl.signal }))
      .finally(function () { clearTimeout(timer); });
  }

  function fetchProgressionDecision(flashCard) {
    return fetchWithTimeout(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ flash: flashCard }),
    }, TIMEOUT_MS).then(function (res) {
      if (!res.ok) throw new Error('ai_http_' + res.status);
      return res.json();
    }).then(function (body) {
      var validated = validateProgressionDecision(body && body.decision ? body.decision : body);
      if (!validated) throw new Error('ai_invalid_decision');
      return validated;
    });
  }

  global.StrengthAI = {
    validateProgressionDecision: validateProgressionDecision,
    buildFlashCard: buildFlashCard,
    fetchProgressionDecision: fetchProgressionDecision,
    ENDPOINT: ENDPOINT,
  };
})(typeof window !== 'undefined' ? window : globalThis);
