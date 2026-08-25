/**
 * Two-channel training load headline — cardio · strength split.
 * See docs/data/training-load-model.md
 */
(function (global) {
  'use strict';

  function num(v) {
    var n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  function sumChannel(sessions, startMs, endMs, key) {
    var total = 0;
    (sessions || []).forEach(function (s) {
      if (!s || s.status !== 'completed') return;
      var t = num(s.completedAt);
      if (t < startMs || t > endMs) return;
      if (key === 'strengthLoad') {
        // Prefer tonnage (scale-stable kg) → /50 display units; avoids mixed v59/v60 history skew.
        var tonnage = num(s.summary && s.summary.tonnage);
        if (tonnage > 0) {
          total += tonnage / 50;
          return;
        }
      }
      total += num(s.summary && s.summary[key]);
    });
    return total;
  }

  function mean(values) {
    if (!values.length) return 0;
    return values.reduce(function (a, b) { return a + b; }, 0) / values.length;
  }

  /** Scale raw channel sum to 0–21 display band vs rolling mean. */
  function normalizeDisplay(raw, rollingMean) {
    if (raw <= 0) return 0;
    if (!rollingMean || rollingMean <= 0) return Math.min(21, Math.round(raw * 10) / 10);
    var ratio = raw / rollingMean;
    return Math.min(21, Math.round(ratio * 10.5 * 10) / 10);
  }

  /**
   * @param {object[]} sessions
   * @param {{ days?: number, now?: number, recoveryGate?: string }} opts
   */
  function computeLoadHeadline(sessions, opts) {
    opts = opts || {};
    var days = Math.max(1, num(opts.days) || 7);
    var now = num(opts.now) || Date.now();
    var windowStart = now - days * 86400000;
    var histStart = now - 28 * 86400000;

    var strength7 = sumChannel(sessions, windowStart, now, 'strengthLoad');
    var cond7 = sumChannel(sessions, windowStart, now, 'conditioningLoad');

    var weeklyStrengths = [];
    var weeklyConds = [];
    for (var w = 0; w < 4; w++) {
      var wEnd = now - w * 7 * 86400000;
      var wStart = wEnd - 7 * 86400000;
      if (wStart < histStart) break;
      weeklyStrengths.push(sumChannel(sessions, wStart, wEnd, 'strengthLoad'));
      weeklyConds.push(sumChannel(sessions, wStart, wEnd, 'conditioningLoad'));
    }

    var sessionCount = (sessions || []).filter(function (s) {
      return s && s.status === 'completed' && num(s.completedAt) >= windowStart;
    }).length;

    if (sessionCount < 1) {
      return {
        headline: null,
        strengthDisplay: null,
        conditioningDisplay: null,
        rawStrength: strength7,
        rawConditioning: cond7,
        reasonCodes: ['insufficient_sessions'],
        recoveryDampened: false,
      };
    }

    var sDisp = normalizeDisplay(strength7, mean(weeklyStrengths));
    var cDisp = normalizeDisplay(cond7, mean(weeklyConds));
    var headline = Math.round((sDisp + cDisp) * 10) / 10;
    var reasonCodes = sessionCount < 3 ? ['building_baseline'] : [];
    var gate = opts.recoveryGate || null;
    var recoveryDampened = gate === 'hold' || gate === 'caution';
    if (recoveryDampened) reasonCodes.push('recovery_dampened');

    return {
      headline: headline,
      strengthDisplay: Math.round(sDisp * 10) / 10,
      conditioningDisplay: Math.round(cDisp * 10) / 10,
      rawStrength: strength7,
      rawConditioning: cond7,
      reasonCodes: reasonCodes,
      recoveryDampened: recoveryDampened,
    };
  }

  function loadHeadlineHtml(result) {
    if (!result || result.headline == null) {
      return '<p class="ath-hint" style="margin-top:8px">Training load · building baseline</p>';
    }
    var line = '<p class="ath-hint" style="margin-top:8px">Training load <b>' + result.headline +
      '</b> · cardio ' + result.conditioningDisplay + ' · strength ' + result.strengthDisplay;
    if (result.recoveryDampened || (result.reasonCodes || []).indexOf('recovery_dampened') >= 0) {
      line += ' · autopilot stays conservative';
    }
    return line + '</p>';
  }

  global.LoadHeadline = {
    computeLoadHeadline: computeLoadHeadline,
    loadHeadlineHtml: loadHeadlineHtml,
  };
})(typeof window !== 'undefined' ? window : globalThis);
