/**
 * Minimal recovery gate for silent strength progression bumps.
 * Training is never blocked — this only gates autopilot load increases.
 */
(function (global) {
  'use strict';

  var GATE_RANK = { ok: 1, caution: 2, hold: 3 };

  function whoopGate(recoveryScore) {
    var n = Number(recoveryScore);
    if (!Number.isFinite(n) || n <= 0) return null;
    if (n >= 67) return 'ok';
    if (n >= 34) return 'caution';
    return 'hold';
  }

  function subjectiveGate(checkin) {
    if (!checkin) return null;
    if (checkin.readinessColor === 'red') return 'hold';
    if (checkin.readinessColor === 'yellow') return 'caution';
    if (checkin.readinessColor === 'green') return 'ok';
    return null;
  }

  function worstGate(a, b) {
    if (!a) return b || 'ok';
    if (!b) return a;
    return GATE_RANK[a] >= GATE_RANK[b] ? a : b;
  }

  /**
   * @param {{ checkin?: object, checkinComplete?: boolean, whoopRecovery?: number }} input
   * @returns {{ gate: 'ok'|'caution'|'hold', reasonCodes: string[] }}
   */
  function recoverySignal(input) {
    input = input || {};
    var reasonCodes = [];

    if (!input.checkinComplete) {
      return { gate: 'hold', reasonCodes: ['no_checkin_today'] };
    }

    var sub = subjectiveGate(input.checkin);
    var whoop = whoopGate(
      input.whoopRecovery != null ? input.whoopRecovery : input.checkin && input.checkin.whoopRecovery
    );
    var gate = sub || 'ok';

    if (whoop) {
      if (sub && whoop !== sub) reasonCodes.push('whoop_worst_of');
      gate = worstGate(gate, whoop);
    }

    if (sub === 'hold') reasonCodes.push('checkin_minimum');
    else if (sub === 'caution') reasonCodes.push('checkin_control');
    else if (sub === 'ok') reasonCodes.push('checkin_build');

    if (whoop === 'hold') reasonCodes.push('whoop_low');
    else if (whoop === 'caution') reasonCodes.push('whoop_moderate');

    return { gate: gate, reasonCodes: reasonCodes };
  }

  function blocksProgressionBumps(signal) {
    return signal.gate === 'hold' || signal.gate === 'caution';
  }

  global.RecoverySignals = {
    recoverySignal: recoverySignal,
    blocksProgressionBumps: blocksProgressionBumps,
    whoopGate: whoopGate,
    subjectiveGate: subjectiveGate,
    worstGate: worstGate,
  };
})(typeof window !== 'undefined' ? window : globalThis);
