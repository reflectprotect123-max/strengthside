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

  /**
   * @param {{ checkin?: object, checkinComplete?: boolean, whoopRecovery?: number, sessionPain?: string, recentCheckins?: object[] }} input
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

    var band = bandFromGate(gate, sub);
    if (!sub && gate === 'hold') band = 'minimum';

    var ledger = heatLedger(input.recentCheckins, 7);
    if (ledger.elevated && num(checkin && checkin.sleepQuality) > 0 && num(checkin.sleepQuality) <= 4) {
      reasonCodes.push('heat_ledger_elevated');
      if (gate === 'ok') {
        gate = 'caution';
        band = band === 'build' ? 'control' : band;
      }
    }

    return {
      band: band,
      gate: gate,
      capacityHint: capacityHint(checkin, gate),
      reasonCodes: reasonCodes,
      domains: {
        subjective: { color: checkin && checkin.readinessColor },
        wearable: whoopRec > 0 ? { recoveryScore: num(whoopRec) } : null,
        sessionPainToday: input.sessionPain || null,
        heatLoad: checkin ? num(checkin.heatLoad) || null : null,
        heatLedger: ledger,
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

  global.RecoveryEngine = {
    recoveryPosture: recoveryPosture,
    recoverySignal: recoverySignal,
    blocksProgressionBumps: blocksProgressionBumps,
    postureCopy: postureCopy,
    heatLedger: heatLedger,
  };
})(typeof window !== 'undefined' ? window : globalThis);
