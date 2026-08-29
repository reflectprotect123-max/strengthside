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

  /** Steps tier load — shared with readinessScore in index.html. */
  function stepsLoad(steps) {
    steps = num(steps);
    if (!steps) return 0;
    if (steps < 8000) return 5;
    if (steps < 13000) return 10;
    if (steps < 18000) return 20;
    if (steps < 25000) return 30;
    return 40;
  }

  function fuelPenalty(v) {
    return v === 'poor' ? 10 : v === 'good' ? -5 : 0;
  }

  function heatPenalty(v) {
    v = num(v);
    return v >= 5 ? 15 : v === 4 ? 10 : v === 3 ? 5 : 0;
  }

  /** Daily life-load from check-in — always recomputed (never reads stored backgroundLoad). */
  function checkinBackgroundLoad(c) {
    if (!c) return 0;
    var work = num(c.workStress) || num(c.workDifficulty);
    return (
      stepsLoad(c.steps) +
      work * 3 +
      num(c.mentalStress) * 3 +
      fuelPenalty(c.fuel) +
      heatPenalty(c.heatLoad)
    );
  }

  /**
   * WHOOP strain (0–21) as supplementary background load — captures unlogged
   * cardiovascular day load without double-counting logged sessions.
   * Light band tops ~9; moderate ~10–13; high 14+.
   */
  function whoopStrainBackgroundLoad(strain, dayTrainingLoad) {
    strain = num(strain);
    if (strain <= 0) return 0;
    dayTrainingLoad = num(dayTrainingLoad);
    var lightExcess = Math.max(0, strain - 8);
    if (lightExcess <= 0) return 0;
    if (dayTrainingLoad <= 0) {
      return Math.round(lightExcess * 0.3 * 10) / 10;
    }
    var heavyExcess = Math.max(0, strain - 12);
    return Math.round(heavyExcess * 0.15 * 10) / 10;
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
    var trainingByDate = {};
    (sessions || []).forEach(function (s) {
      if (!s || s.status !== 'completed') return;
      var t = num(s.completedAt);
      if (t < startMs || t > endMs) return;
      var load = sessionTrainingLoad(s);
      training += load;
      var day = s.date || new Date(t).toISOString().slice(0, 10);
      trainingByDate[day] = (trainingByDate[day] || 0) + load;
    });
    var background = 0;
    (checkins || []).forEach(function (c) {
      if (!c || !c.date) return;
      var t = Date.parse(c.date + 'T12:00:00');
      if (t < startMs || t > endMs) return;
      var dayTrain = trainingByDate[c.date] || 0;
      background +=
        checkinBackgroundLoad(c) + whoopStrainBackgroundLoad(c.whoopStrain, dayTrain);
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

  /** Sum recovery repay credits in a time window (same units as delivery ledger). */
  function sumRecoveryRepay(sessions, startMs, endMs) {
    var repay = 0;
    (sessions || []).forEach(function (s) {
      if (!s || s.status !== 'completed') return;
      var t = num(s.completedAt);
      if (t < startMs || t > endMs) return;
      repay += num(s.summary && s.summary.recoveryRepayLoad);
    });
    return Math.round(repay * 10) / 10;
  }

  /**
   * Repay load from a completed recovery session — easy minutes pay down delivery debt.
   * @param {{ duration?: number }} summary session summary
   * @param {{ result?: { duration?: number, zoneSeconds?: object } }} task conditioning task
   */
  function recoveryRepayFromSession(summary, task) {
    summary = summary || {};
    task = task || {};
    var r = task.result || {};
    var mins = num(r.duration) / 60;
    if (mins <= 0) mins = num(summary.duration) / 60;
    if (mins <= 0) return 0;
    var zones = r.zoneSeconds || {};
    var easyMin = (num(zones.recovery) + num(zones.aerobic) * 0.5) / 60;
    var base = Math.max(mins, easyMin);
    // ~0.6 delivery units per easy minute; 15 min → ~9 repay (net paydown vs cond load).
    return Math.round(base * 0.6 * 10) / 10;
  }

  function recoveryRepayEstimateMinutes(minutes) {
    minutes = Math.max(0, num(minutes));
    return Math.round(minutes * 0.6 * 10) / 10;
  }

  /**
   * Recovery debt score 0–100 (0 = fresh, 100 = deep debt) from ledger minus repay credits.
   */
  function recoveryDebtScore(ledger, repayTotal) {
    ledger = ledger || {};
    repayTotal = num(repayTotal);
    var delivered = num(ledger.delivered);
    var budget = num(ledger.budget);
    var netDelivered = Math.max(0, delivered - repayTotal);
    var grossRatio = num(ledger.ratio);
    if (budget <= 0 && !grossRatio) {
      grossRatio = ledger.elevated ? 1.25 : 0.95;
    }
    var netRatio = budget > 0 ? netDelivered / budget : Math.max(0, grossRatio - repayTotal / Math.max(delivered, 1));
    var score;
    if (budget > 0) {
      score = Math.round(Math.max(0, Math.min(100, ((netRatio - 0.85) / 0.75) * 100)));
    } else if (netDelivered <= 0 && !ledger.elevated) {
      score = 0;
    } else if (ledger.elevated) {
      score = Math.max(40, 72 - Math.round(repayTotal * 3));
    } else {
      score = Math.max(0, Math.min(55, Math.round(netDelivered * 2.2) - Math.round(repayTotal * 2)));
    }
    var elevated = budget > 0 ? netRatio >= 1.2 : netDelivered >= 10 && num(ledger.sessionCount) >= 4;
    return {
      score: score,
      grossRatio: Math.round(grossRatio * 100) / 100,
      netRatio: Math.round(netRatio * 100) / 100,
      repay: repayTotal,
      netDelivered: Math.round(netDelivered * 10) / 10,
      delivered: delivered,
      budget: budget,
      elevated: elevated,
    };
  }

  function recoveryDebtCopy(debt, opts) {
    opts = opts || {};
    debt = debt || {};
    if (debt.score <= 15) return 'Recovery debt low — full dose available when readiness allows.';
    if (debt.score <= 40) return 'Recovery debt moderate — easy work still helps.';
    if (opts.repayEstimate > 0) {
      return (
        'Recovery debt ' +
        debt.score +
        ' · ~' +
        opts.repayEstimate +
        ' repay from ' +
        opts.minutes +
        ' min easy'
      );
    }
    return 'Recovery debt ' + debt.score + ' · easy sessions repay delivery load.';
  }

  /** Posture + ledger + rolling repay → debt score for Home and session copy. */
  function recoveryDebtSnapshot(input) {
    input = input || {};
    var posture = recoveryPosture(input);
    var ledger = posture.domains && posture.domains.deliveryLedger;
    if (!ledger) {
      return { posture: posture, debt: { score: 0, repay: 0, netRatio: 0, grossRatio: 0, elevated: false } };
    }
    var days = ledger.days || 7;
    var endMs = Date.parse((input.endDate || new Date().toISOString().slice(0, 10)) + 'T23:59:59');
    var startMs = endMs - (days - 1) * 86400000;
    var repay = sumRecoveryRepay(input.allSessions || input.recentSessions || [], startMs, endMs);
    var debt = recoveryDebtScore(ledger, repay);
    return { posture: posture, ledger: ledger, debt: debt, repay: repay };
  }

  global.RecoveryEngine = {
    recoveryPosture: recoveryPosture,
    recoverySignal: recoverySignal,
    blocksProgressionBumps: blocksProgressionBumps,
    postureCopy: postureCopy,
    heatLedger: heatLedger,
    stepsLoad: stepsLoad,
    fuelPenalty: fuelPenalty,
    heatPenalty: heatPenalty,
    checkinBackgroundLoad: checkinBackgroundLoad,
    deliveryLoadLedger: deliveryLoadLedger,
    deliveryLoadCopy: deliveryLoadCopy,
    whoopStrainBackgroundLoad: whoopStrainBackgroundLoad,
    sumRecoveryRepay: sumRecoveryRepay,
    recoveryRepayFromSession: recoveryRepayFromSession,
    recoveryRepayEstimateMinutes: recoveryRepayEstimateMinutes,
    recoveryDebtScore: recoveryDebtScore,
    recoveryDebtCopy: recoveryDebtCopy,
    recoveryDebtSnapshot: recoveryDebtSnapshot,
  };
})(typeof window !== 'undefined' ? window : globalThis);
