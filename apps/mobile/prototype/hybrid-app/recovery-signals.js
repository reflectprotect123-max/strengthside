/**
 * Minimal recovery gate for silent strength progression bumps.
 * Delegates policy to RecoveryEngine when loaded.
 */
(function (global) {
  'use strict';

  function recoverySignal(input) {
    if (global.RecoveryEngine && global.RecoveryEngine.recoverySignal) {
      return global.RecoveryEngine.recoverySignal(input);
    }
    // Fallback if recovery-engine.js failed to load
    if (!(input && input.checkinComplete)) {
      return { gate: 'hold', reasonCodes: ['no_checkin_today'] };
    }
    return { gate: 'ok', reasonCodes: ['checkin_build'] };
  }

  function blocksProgressionBumps(signal) {
    if (global.RecoveryEngine && global.RecoveryEngine.blocksProgressionBumps) {
      return global.RecoveryEngine.blocksProgressionBumps(signal);
    }
    return signal.gate === 'hold' || signal.gate === 'caution';
  }

  global.RecoverySignals = {
    recoverySignal: recoverySignal,
    blocksProgressionBumps: blocksProgressionBumps,
  };
})(typeof window !== 'undefined' ? window : globalThis);
