/**
 * Full recovery posture — pure policy for gates and Coordinator inputs.
 * Training is never blocked; gates only affect autopilot load bumps.
 */
(function (global) {
  'use strict';

  function num(v) {
    var n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  function whoopGate(recoveryScore) {
    var n = num(recoveryScore);
    if (n <= 0) return null;
    if (n >= 67) return 'ok';
    if (n >= 34) return 'caution';
    return 'hold';
  }

  function subjectiveBand(checkin) {
    if (!checkin) return null;
    if (checkin.readinessColor === 'red') return 'minimum';
    if (checkin.readinessColor === 'yellow') return 'control';
    if (checkin.readinessColor === 'green') return 'build';
    return null;
  }

  function gateRank(g) {
    return g === 'hold' ? 3 : g === 'caution' ? 2 : 1;
  }

  function worstGate(a, b) {
    if (!a) return b || 'ok';
    if (!b) return a;
    return gateRank(a) >= gateRank(b) ? a : b;
  }

  function bandFromGate(g, sub) {
    if (!sub && g === 'hold') return 'minimum';
    if (!sub && g === 'caution') return 'control';
    if (sub) return sub;
    return g === 'ok' ? 'build' : g === 'caution' ? 'control' : 'minimum';
  }

  function capacityHint(checkin, gate) {
    if (!checkin) return null;
    var base = 72;
    if (gate === 'ok') base = 85;
    if (gate === 'caution') base = 62;
    if (gate === 'hold') base = 48;
    var sleep = num(checkin.sleepQuality);
    if (sleep > 0 && sleep <= 4) base -= 8;
    var heat = num(checkin.heatLoad);
    if (heat >= 4) base -= 6;
    return Math.max(20, Math.min(100, Math.round(base)));
  }

  function heatLedger(recentCheckins, days) {
    days = days || 7;
    var vals = (recentCheckins || []).filter(function (c) {
      return c && num(c.heatLoad) > 0;
    }).slice(-days).map(function (c) { return num(c.heatLoad); });
    if (!vals.length) return { sum: 0, avg: 0, days: 0, elevated: false };
    var sum = vals.reduce(function (a, b) { return a + b; }, 0);
    var avg = sum / vals.length;
    return { sum: sum, avg: avg, days: vals.length, elevated: avg >= 3.5 };
  }

  function checkinBackgroundLoad(c) {
    if (!c) return 0;
    if (num(c.backgroundLoad) > 0) return num(c.backgroundLoad);
    return num(c.heatLoad) * 2 + num(c.steps) / 2500 + num(c.workStress) * 2 + num(c.mentalStress) * 1.5;
  }

  function sessionTrainingLoad(s) {
    if (!s || s.status !== 'completed') return 0;
    var sum = s.summary || {};
    // Prefer summary.tonnage (always raw kg across v59→v60+) then /50 for delivery ratios.
    // strengthLoad alone is ambiguous: pre-v60 was already /50; post-v60 is raw tonnageKg.
    var tonnage = num(sum.tonnage);
    var strength = tonnage > 0 ? tonnage / 50 : num(sum.strengthLoad);
    var cond = num(sum.conditioningLoad);
    if (strength > 0 || cond > 0) return strength + cond;
    return num(sum.totalLoad);
  }

  function windowLoad(sessions, checkins, startMs, endMs) {
    var training = 0;
    (sessions || []).forEach(function (s) {
      if (!s || s.status !== 'completed') return;
      var t = num(s.completedAt);
      if (t < startMs || t > endMs) return;
      training += sessionTrainingLoad(s);
    });
    var background = 0;
    (checkins || []).forEach(function (c) {
      if (!c || !c.date) return;
      var t = Date.parse(c.date + 'T12:00:00');
      if (t < startMs || t > endMs) return;
      background += checkinBackgroundLoad(c);
    });
    return { training: training, background: background, total: training + background };
  }

  /** Session + background delivery vs rolling weekly budget — pure ledger, no blockers. */
  function deliveryLoadLedger(recentSessions, recentCheckins, opts) {
    opts = opts || {};
    var days = opts.days || 7;
    var allSessions = opts.allSessions || recentSessions || [];
    var allCheckins = opts.allCheckins || recentCheckins || [];
    var endDate = opts.endDate || new Date().toISOString().slice(0, 10);
    var endMs = Date.parse(endDate + 'T23:59:59');
    var startMs = endMs - (days - 1) * 86400000;

    var current = windowLoad(allSessions, allCheckins, startMs, endMs);
    var budgets = [];
    for (var w = 1; w <= 3; w++) {
      var wEnd = endMs - w * days * 86400000;
      var wStart = wEnd - (days - 1) * 86400000;
      var wt = windowLoad(allSessions, allCheckins, wStart, wEnd);
      if (wt.total > 0) budgets.push(wt.total);
    }
    var budget = budgets.length ? budgets.reduce(function (a, b) { return a + b; }, 0) / budgets.length : 0;
    var ratio = budget > 0 ? current.total / budget : 0;
    var sessionCount = (allSessions || []).filter(function (s) {
      return s && s.status === 'completed' && num(s.completedAt) >= startMs && num(s.completedAt) <= endMs;
    }).length;
    var elevated = budget > 0 ? ratio >= 1.2 : current.total >= 12 && sessionCount >= 4;

    return {
      delivered: Math.round(current.total * 10) / 10,
      training: Math.round(current.training * 10) / 10,
      background: Math.round(current.background * 10) / 10,
      budget: Math.round(budget * 10) / 10,
      ratio: Math.round(ratio * 100) / 100,
      days: days,
      sessionCount: sessionCount,
      elevated: elevated,
    };
  }

  /**
   * @param {{ checkin?: object, checkinComplete?: boolean, whoopRecovery?: number, sessionPain?: string, recentCheckins?: object[], recentSessions?: object[], allSessions?: object[], allCheckins?: object[], endDate?: string }} input
   */
  function recoveryPosture(input) {
    input = input || {};
    var reasonCodes = [];
    var checkin = input.checkin || null;
    var whoopRec = input.whoopRecovery != null ? input.whoopRecovery : (checkin && checkin.whoopRecovery);

    if (!input.checkinComplete) {
      return {
        band: 'insufficient_data',
        gate: 'hold',
        capacityHint: null,
        reasonCodes: ['no_checkin_today'],
        domains: {
          subjective: { color: null },
          wearable: whoopRec > 0 ? { recoveryScore: num(whoopRec) } : null,
          sessionPainToday: input.sessionPain || null,
          heatLoad: checkin ? num(checkin.heatLoad) || null : null,
          steps: checkin ? num(checkin.steps) || null : null,
          backgroundLoad: checkin ? checkinBackgroundLoad(checkin) || null : null,
        },
      };
    }

    var sub = subjectiveBand(checkin);
    var whoopG = whoopGate(whoopRec);
    var gate = sub === 'minimum' ? 'hold' : sub === 'control' ? 'caution' : 'ok';
    if (whoopG) {
      if (sub && whoopG !== gate && (whoopG === 'hold' || whoopG === 'caution')) reasonCodes.push('whoop_worst_of');
      gate = worstGate(gate, whoopG);
    }

    if (sub === 'minimum') reasonCodes.push('checkin_minimum');
    else if (sub === 'control') reasonCodes.push('checkin_control');
    else if (sub === 'build') reasonCodes.push('checkin_build');

    if (whoopG === 'hold') reasonCodes.push('whoop_low');
    else if (whoopG === 'caution') reasonCodes.push('whoop_moderate');

    if (input.sessionPain === 'yes') {
      gate = 'hold';
      reasonCodes.push('session_pain_active');
    } else if (input.sessionPain === 'mild') {
      reasonCodes.push('session_pain_mild_advisory');
    }

    if (checkin && checkin.illness === 'yes') {
      reasonCodes.push('illness_flag_active');
    }

    var band = bandFromGate(gate, sub);
    if (!sub && gate === 'hold') band = 'minimum';

    var ledger = heatLedger(input.recentCheckins, 7);
    // Elevated heat softens capacity always; with poor sleep it also downgrades gate.
    if (ledger.elevated) {
      reasonCodes.push('heat_ledger_elevated');
      if (num(checkin && checkin.sleepQuality) > 0 && num(checkin.sleepQuality) <= 4 && gate === 'ok') {
        gate = 'caution';
        band = band === 'build' ? 'control' : band;
      }
    }

    var delivery = deliveryLoadLedger(input.recentSessions, input.recentCheckins, {
      allSessions: input.allSessions,
      allCheckins: input.allCheckins,
      endDate: input.endDate,
      days: 7,
    });
    if (delivery.elevated) {
      reasonCodes.push('delivery_load_elevated');
      if (gate === 'ok') {
        gate = 'caution';
        band = band === 'build' ? 'control' : band;
      }
    }

    var cap = capacityHint(checkin, gate);
    if (ledger.elevated && cap != null) cap = Math.max(20, cap - 8);
    if (delivery.elevated && cap != null) cap = Math.max(20, cap - 10);

    return {
      band: band,
      gate: gate,
      capacityHint: cap,
      reasonCodes: reasonCodes,
      domains: {
        subjective: { color: checkin && checkin.readinessColor },
        wearable: whoopRec > 0 ? { recoveryScore: num(whoopRec) } : null,
        sessionPainToday: input.sessionPain || null,
        heatLoad: checkin ? num(checkin.heatLoad) || null : null,
        steps: checkin ? num(checkin.steps) || null : null,
        backgroundLoad: checkin ? checkinBackgroundLoad(checkin) || null : null,
        heatLedger: ledger,
        deliveryLedger: delivery,
      },
    };
  }

  function recoverySignal(input) {
    var p = recoveryPosture(input);
    return { gate: p.gate, reasonCodes: p.reasonCodes.slice() };
  }

  function blocksProgressionBumps(signal) {
    return signal.gate === 'hold' || signal.gate === 'caution';
  }

  function postureCopy(posture) {
    if (posture.band === 'insufficient_data') return 'Check in to unlock autopilot load bumps.';
    if (posture.gate === 'hold') return 'Minimum day — autopilot loads held.';
    if (posture.gate === 'caution') return 'Control day — train, bumps stay conservative.';
    return '';
  }

  function deliveryLoadCopy(ledger) {
    if (!ledger || !ledger.elevated) return '';
    if (ledger.budget > 0) return 'Heavy delivery week — optional work stays easy.';
    return 'High session count this week — autopilot stays conservative.';
  }

  global.RecoveryEngine = {
    recoveryPosture: recoveryPosture,
    recoverySignal: recoverySignal,
    blocksProgressionBumps: blocksProgressionBumps,
    postureCopy: postureCopy,
    heatLedger: heatLedger,
    deliveryLoadLedger: deliveryLoadLedger,
    deliveryLoadCopy: deliveryLoadCopy,
  };
})(typeof window !== 'undefined' ? window : globalThis);
