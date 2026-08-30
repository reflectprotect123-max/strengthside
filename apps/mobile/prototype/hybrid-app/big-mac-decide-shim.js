/**
 * Deterministic BIG MAC decide shim.
 * - product_engines snapshots → shipped Hybrid JS engines (no human review)
 * - synthetic_test_only → fixture plumbing
 * - otherwise → abstain (matches evidence-platform with 0 promoted models)
 */
(function (global) {
  'use strict';

  var DOMAINS = ['strength', 'conditioning', 'nutrition', 'recovery', 'coordinator'];
  var ENGINE_VERSION = '0.1.0';

  function abstainOutput(system) {
    return {
      system: system,
      engine_version: ENGINE_VERSION,
      status: 'inactive_no_approved_model',
      synthetic_test_only: false,
      confidence: 0,
      model_version: 'none',
      evidence_ids: [],
      reason_codes: ['NO_APPROVED_MODEL'],
      state_estimate: {},
      constraints: [],
      proposed_actions: [{
        action: 'abstain',
        candidate_id: 'CAND-' + system.toUpperCase(),
        eligible: false,
        reason_codes: ['NO_APPROVED_MODEL'],
        source_system: system,
        synthetic_test_only: false,
      }],
    };
  }

  function syntheticOutput(system, directive) {
    var action = directive.action;
    return {
      system: system,
      engine_version: ENGINE_VERSION,
      status: 'synthetic_test_only',
      synthetic_test_only: true,
      confidence: 1,
      model_version: 'synthetic',
      evidence_ids: [],
      reason_codes: ['SYNTHETIC_TEST_ONLY'],
      state_estimate: {},
      constraints: [],
      proposed_actions: [{
        action: action,
        candidate_id: 'CAND-' + system.toUpperCase() + '-SYN',
        eligible: true,
        reason_codes: ['SYNTHETIC_TEST_ONLY'],
        source_system: system,
        synthetic_test_only: true,
      }],
    };
  }

  function usesProductEngines(snapshot) {
    return !!(snapshot && snapshot.product_engines !== false &&
      global.BigMacProductEngines && global.BigMacProductEngines.runAll);
  }

  function runEngines(snapshot) {
    if (usesProductEngines(snapshot)) {
      return global.BigMacProductEngines.runAll(snapshot);
    }
    var out = {};
    var directives = snapshot && snapshot.synthetic_directives;
    var synthetic = snapshot && snapshot.fixture === 'synthetic_test_only';
    DOMAINS.forEach(function (name) {
      if (synthetic && directives && directives[name]) {
        out[name] = syntheticOutput(name, directives[name]);
      } else {
        out[name] = abstainOutput(name);
      }
    });
    return out;
  }

  function primaryCandidate(domainOutputs, domain) {
    var output = domainOutputs[domain];
    var proposed = output && output.proposed_actions && output.proposed_actions[0];
    if (!proposed || proposed.action === 'abstain' || !proposed.eligible) return null;
    return { domain: domain, action: proposed.action, reason_codes: proposed.reason_codes || [] };
  }

  function collectEngineCandidates(domainOutputs) {
    var candidates = [];
    DOMAINS.forEach(function (domain) {
      var c = primaryCandidate(domainOutputs, domain);
      if (c) candidates.push(c);
    });
    return candidates;
  }

  function arbitrate(candidates) {
    if (!candidates.length) {
      return { conflict: false, unanimous_action: null, candidates: candidates };
    }
    var actions = candidates.map(function (c) { return c.action; });
    var unique = actions.filter(function (a, i) { return actions.indexOf(a) === i; });
    if (unique.length === 1) {
      return { conflict: false, unanimous_action: unique[0], candidates: candidates };
    }
    return { conflict: true, unanimous_action: null, candidates: candidates };
  }

  function committedForAction(action) {
    return action !== 'abstain' && action !== 'record_only';
  }

  function decideShim(snapshot, domainOutputs) {
    domainOutputs = domainOutputs || runEngines(snapshot);
    var trigger = snapshot && snapshot.trigger_domain;
    var triggerCandidate = trigger ? primaryCandidate(domainOutputs, trigger) : null;

    if (triggerCandidate) {
      return {
        action: triggerCandidate.action,
        reason_codes: ['PRODUCT_ENGINE_' + trigger.toUpperCase()].concat(triggerCandidate.reason_codes || []),
        final_decision: { committed_change: committedForAction(triggerCandidate.action) },
        decision_mode: committedForAction(triggerCandidate.action) ? 'deterministic' : 'record_only',
        domain_outputs: domainOutputs,
      };
    }

    var action = 'abstain';
    var reasons = usesProductEngines(snapshot)
      ? ['PRODUCT_ENGINES_NO_TRIGGER', 'NO_DETERMINISTIC_ANSWER']
      : ['NO_APPROVED_MODEL', 'NO_DETERMINISTIC_ANSWER', 'LEAD_FALLBACK_NOT_CONNECTED'];
    var arbitration = arbitrate(collectEngineCandidates(domainOutputs));

    if (arbitration.conflict) {
      reasons = usesProductEngines(snapshot)
        ? ['MULTI_DOMAIN_CANDIDATE_NO_ARBITRATION_POLICY', 'NO_DETERMINISTIC_ANSWER']
        : ['MULTI_DOMAIN_CANDIDATE_NO_ARBITRATION_POLICY', 'NO_DETERMINISTIC_ANSWER', 'LEAD_FALLBACK_NOT_CONNECTED'];
    } else if (arbitration.unanimous_action) {
      action = arbitration.unanimous_action;
      reasons = usesProductEngines(snapshot) ? ['PRODUCT_ENGINE_UNANIMOUS'] : ['ENGINE_CANDIDATE_APPLIED'];
    }

    return {
      action: action,
      reason_codes: reasons,
      final_decision: { committed_change: committedForAction(action) },
      decision_mode: committedForAction(action) ? 'deterministic' : 'abstention',
      domain_outputs: domainOutputs,
    };
  }

  global.BigMacDecideShim = {
    DOMAINS: DOMAINS,
    runEngines: runEngines,
    decideShim: decideShim,
    usesProductEngines: usesProductEngines,
  };
})(typeof window !== 'undefined' ? window : globalThis);
