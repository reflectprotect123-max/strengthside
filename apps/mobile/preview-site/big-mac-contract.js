/**
 * JS mirror of evidence-platform/platform_core/athlete_facing_contract.py
 * The only athlete-facing view of a BIG MAC decision receipt.
 */
(function (global) {
  'use strict';

  function AthleteConsumerContractError(message) {
    this.name = 'AthleteConsumerContractError';
    this.message = message || 'invalid receipt';
  }

  function toAthleteFacingUpdate(receipt) {
    if (!receipt || typeof receipt !== 'object') {
      throw new AthleteConsumerContractError('receipt must be an object');
    }
    if (!('action' in receipt)) {
      throw new AthleteConsumerContractError('receipt missing required field: action');
    }
    if (!('final_decision' in receipt)) {
      throw new AthleteConsumerContractError('receipt missing required field: final_decision');
    }
    var finalDecision = receipt.final_decision;
    if (!finalDecision || typeof finalDecision !== 'object' || !('committed_change' in finalDecision)) {
      throw new AthleteConsumerContractError('receipt.final_decision must include committed_change');
    }
    if (typeof finalDecision.committed_change !== 'boolean') {
      throw new AthleteConsumerContractError('receipt.final_decision.committed_change must be a boolean');
    }
    if (!finalDecision.committed_change) {
      return { has_update: false, action: null };
    }
    return { has_update: true, action: receipt.action };
  }

  global.BigMacContract = {
    AthleteConsumerContractError: AthleteConsumerContractError,
    toAthleteFacingUpdate: toAthleteFacingUpdate,
  };
})(typeof window !== 'undefined' ? window : globalThis);
