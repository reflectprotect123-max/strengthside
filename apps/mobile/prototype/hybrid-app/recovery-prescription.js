/**
 * Recovery session prescription — % of coach baseline from recovery posture.
 * Progressive bonus rewards consistent recovery work on green weeks.
 * Pure policy; no I/O.
 */
(function (global) {
  'use strict';

  function num(v) {
    var n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  function gateFloorPct(gate) {
    if (gate === 'ok') return 85;
    if (gate === 'caution') return 65;
    return 45;
  }

  /**
   * @param {object} posture RecoveryEngine.recoveryPosture output
   * @param {{ progressBonus?: number }} opts
   * @returns {number} 35–100
   */
  function recoverySessionPct(posture, opts) {
    opts = opts || {};
    if (!posture) return 50;
    if (posture.band === 'insufficient_data') return 40;

    var pct =
      posture.capacityHint != null ? posture.capacityHint : gateFloorPct(posture.gate);

    var ledger = posture.domains && posture.domains.deliveryLedger;
    if (ledger && ledger.elevated) {
      pct = Math.round(pct * (num(ledger.ratio) >= 1.35 ? 0.72 : 0.88));
    }

    if (posture.domains && posture.domains.sessionPainToday === 'yes') {
      pct = Math.min(pct, 40);
    } else if (posture.domains && posture.domains.sessionPainToday === 'mild') {
      pct = Math.round(pct * 0.85);
    }

    pct = Math.min(100, pct + num(opts.progressBonus));
    return Math.max(35, Math.min(100, Math.round(pct)));
  }

  function roundMinutes(mins) {
    mins = Math.round(mins / 5) * 5;
    return Math.max(10, mins);
  }

  /**
   * @param {number} baselineMin Coach-authored 100% dose
   * @param {object} posture
   * @param {{ progressBonus?: number }} opts
   */
  function prescribe(baselineMin, posture, opts) {
    baselineMin = Math.max(10, num(baselineMin) || 30);
    var pct = recoverySessionPct(posture, opts);
    var minutes = roundMinutes((baselineMin * pct) / 100);
    minutes = Math.min(baselineMin, minutes);
    return {
      baselineMin: baselineMin,
      pct: pct,
      minutes: minutes,
      effort: 'easy',
      condFmt: 'steady',
    };
  }

  function copyLine(rx, posture) {
    if (!rx) return '';
    if (posture && posture.band === 'insufficient_data') {
      return (
        'Check in to unlock full recovery dose · ' +
        rx.minutes +
        ' min suggested (' +
        rx.pct +
        '%)'
      );
    }
    if (rx.pct < 100) {
      return (
        rx.baselineMin +
        ' min plan · ' +
        rx.pct +
        '% today → ' +
        rx.minutes +
        ' min easy'
      );
    }
    return rx.minutes + ' min easy · full recovery dose';
  }

  /** +2% per green recovery completion in window, cap +10. */
  function progressBonusFromSessions(sessions, opts) {
    opts = opts || {};
    var days = opts.days || 14;
    var endDate = opts.endDate || new Date().toISOString().slice(0, 10);
    var endMs = Date.parse(endDate + 'T23:59:59');
    var startMs = endMs - (days - 1) * 86400000;
    var count = 0;
    (sessions || []).forEach(function (s) {
      if (!s || s.status !== 'completed') return;
      if (s.templateId !== 'tpl-recovery' && !s.recoverySession) return;
      var t = num(s.completedAt);
      if (t < startMs || t > endMs) return;
      var pct = num(s.summary && s.summary.recoveryPct);
      if (pct >= 70 || pct === 0) count += pct === 0 ? 0 : 1;
    });
    return Math.min(10, count * 2);
  }

  function isRecoveryTask(task) {
    if (!task) return false;
    if (task.recoverySession) return true;
    return String(task.category || '').toLowerCase() === 'recovery';
  }

  function isRecoverySession(session) {
    if (!session) return false;
    if (session.templateId === 'tpl-recovery') return true;
    if (session.recoverySession) return true;
    return (session.blocks || []).some(function (b) {
      return (
        b &&
        b.type === 'conditioning' &&
        (b.recoverySession || String(b.category || '').toLowerCase() === 'recovery')
      );
    });
  }

  global.RecoveryPrescription = {
    recoverySessionPct: recoverySessionPct,
    prescribe: prescribe,
    copyLine: copyLine,
    progressBonusFromSessions: progressBonusFromSessions,
    isRecoveryTask: isRecoveryTask,
    isRecoverySession: isRecoverySession,
  };
})(typeof window !== 'undefined' ? window : globalThis);
