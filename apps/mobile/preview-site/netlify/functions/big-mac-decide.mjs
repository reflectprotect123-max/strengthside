import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { preflight, json, method, safeError } from './_lib/http.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../../../');
const EVIDENCE_DIR = path.join(REPO_ROOT, 'evidence-platform');
const HYBRID_APP = path.join(REPO_ROOT, 'apps/mobile/prototype/hybrid-app');

const DOMAINS = ['strength', 'conditioning', 'nutrition', 'recovery', 'coordinator'];

function abstainOutput(system) {
  return {
    system,
    engine_version: '0.1.0',
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
      candidate_id: `CAND-${system.toUpperCase()}`,
      eligible: false,
      reason_codes: ['NO_APPROVED_MODEL'],
      source_system: system,
      synthetic_test_only: false,
    }],
  };
}

function productOutput(system, action, reasonCodes, stateEstimate = {}, confidence = 0.85) {
  return {
    system,
    engine_version: '1.0.0-product',
    status: 'inactive_no_approved_model',
    synthetic_test_only: false,
    confidence,
    model_version: 'hybrid-product-v1',
    evidence_ids: [],
    reason_codes: reasonCodes,
    state_estimate: stateEstimate,
    constraints: [],
    proposed_actions: [{
      action,
      candidate_id: `CAND-PRODUCT-${system.toUpperCase()}`,
      eligible: action !== 'abstain',
      reason_codes: reasonCodes,
      source_system: system,
      synthetic_test_only: false,
    }],
  };
}

function evaluateProductDomain(snapshot, system) {
  const d = snapshot[`${system}_domain`] || {};
  if (system === 'strength') {
    if (d.session_pain === 'yes') return productOutput('strength', 'hold', ['session_pain_yes']);
    return productOutput('strength', 'record_only', ['STRENGTH_SERVER_SNAPSHOT_ONLY'], {}, 0.5);
  }
  if (system === 'conditioning') {
    if (d.last_delta > 0) return productOutput('conditioning', 'proceed', ['con_adapt_progress'], { delta: d.last_delta });
    if (d.last_delta < 0) return productOutput('conditioning', 'trim', ['con_adapt_regress'], { delta: d.last_delta });
    return productOutput('conditioning', 'maintain', ['con_adapt_hold'], { delta: d.last_delta || 0 });
  }
  if (system === 'recovery') {
    if (d.illness) return productOutput('recovery', 'hold', ['illness_flagged']);
    const gate = d.posture?.gate;
    if (gate === 'hold') return productOutput('recovery', 'hold', ['recovery_minimum'], d.posture || {});
    if (gate === 'caution') return productOutput('recovery', 'maintain', ['recovery_control'], d.posture || {});
    if (d.posture?.band === 'insufficient_data') return productOutput('recovery', 'record_only', ['recovery_no_checkin'], {}, 0.5);
    return productOutput('recovery', 'proceed', ['recovery_build'], d.posture || {});
  }
  if (system === 'nutrition') {
    if (d.low_energy_flag) return productOutput('nutrition', 'hold', ['nutrition_low_energy']);
    if (!d.days_logged) return productOutput('nutrition', 'record_only', ['nutrition_none'], {}, 0.5);
    if (d.off_target) return productOutput('nutrition', 'modify', ['nutrition_off_target']);
    return productOutput('nutrition', 'proceed', ['nutrition_logged'], { daysLogged: d.days_logged });
  }
  if (system === 'coordinator') {
    return productOutput('coordinator', 'record_only', ['coordinator_server_snapshot_only'], {}, 0.5);
  }
  return abstainOutput(system);
}

function runEngines(snapshot) {
  if (snapshot?.product_engines !== false) {
    const out = {};
    for (const name of DOMAINS) out[name] = evaluateProductDomain(snapshot, name);
    return out;
  }
  const out = {};
  const synthetic = snapshot?.fixture === 'synthetic_test_only';
  const directives = snapshot?.synthetic_directives || {};
  for (const name of DOMAINS) {
    if (synthetic && directives[name]) {
      out[name] = {
        ...abstainOutput(name),
        status: 'synthetic_test_only',
        synthetic_test_only: true,
        confidence: 1,
        model_version: 'synthetic',
        reason_codes: ['SYNTHETIC_TEST_ONLY'],
        proposed_actions: [{
          action: directives[name].action,
          candidate_id: `CAND-${name.toUpperCase()}-SYN`,
          eligible: true,
          reason_codes: ['SYNTHETIC_TEST_ONLY'],
          source_system: name,
          synthetic_test_only: true,
        }],
      };
    } else {
      out[name] = abstainOutput(name);
    }
  }
  return out;
}

function primaryCandidate(outputs, domain) {
  const proposed = outputs[domain]?.proposed_actions?.[0];
  if (!proposed || proposed.action === 'abstain' || !proposed.eligible) return null;
  return { domain, action: proposed.action, reason_codes: proposed.reason_codes || [] };
}

function committedForAction(action) {
  return action !== 'abstain' && action !== 'record_only';
}

function decideJsShim(snapshot, domainOutputs) {
  const outputs = domainOutputs || runEngines(snapshot);
  const trigger = snapshot?.trigger_domain;
  const triggerCandidate = trigger ? primaryCandidate(outputs, trigger) : null;
  if (triggerCandidate) {
    return {
      action: triggerCandidate.action,
      reason_codes: [`PRODUCT_ENGINE_${trigger.toUpperCase()}`, ...(triggerCandidate.reason_codes || [])],
      final_decision: { committed_change: committedForAction(triggerCandidate.action) },
      decision_mode: committedForAction(triggerCandidate.action) ? 'deterministic' : 'record_only',
      domain_outputs: outputs,
    };
  }

  const candidates = DOMAINS.map((d) => primaryCandidate(outputs, d)).filter(Boolean);
  const actions = [...new Set(candidates.map((c) => c.action))];
  let action = 'abstain';
  let reasonCodes = snapshot?.product_engines !== false
    ? ['PRODUCT_ENGINES_NO_TRIGGER', 'NO_DETERMINISTIC_ANSWER']
    : ['NO_APPROVED_MODEL', 'NO_DETERMINISTIC_ANSWER', 'LEAD_FALLBACK_NOT_CONNECTED'];
  if (actions.length > 1) {
    reasonCodes = snapshot?.product_engines !== false
      ? ['MULTI_DOMAIN_CANDIDATE_NO_ARBITRATION_POLICY', 'NO_DETERMINISTIC_ANSWER']
      : ['MULTI_DOMAIN_CANDIDATE_NO_ARBITRATION_POLICY', 'NO_DETERMINISTIC_ANSWER', 'LEAD_FALLBACK_NOT_CONNECTED'];
  } else if (actions.length === 1) {
    action = actions[0];
    reasonCodes = snapshot?.product_engines !== false ? ['PRODUCT_ENGINE_UNANIMOUS'] : ['ENGINE_CANDIDATE_APPLIED'];
  }
  return {
    action,
    reason_codes: reasonCodes,
    final_decision: { committed_change: committedForAction(action) },
    decision_mode: committedForAction(action) ? 'deterministic' : 'abstention',
    domain_outputs: outputs,
  };
}

function toAthleteFacingUpdate(receipt) {
  if (!receipt?.final_decision || typeof receipt.final_decision.committed_change !== 'boolean') {
    throw new Error('invalid_receipt');
  }
  if (!receipt.final_decision.committed_change) {
    return { has_update: false, action: null };
  }
  return { has_update: true, action: receipt.action };
}

function decidePython(snapshot) {
  if (snapshot?.product_engines !== false) return null;
  const script = `
import json, sys
from pathlib import Path
sys.path.insert(0, str(Path(${JSON.stringify(EVIDENCE_DIR)})))
from platform_core.db import connect, migrate
from platform_core.decision import decide
from platform_core.engines import run_all
from platform_core.athlete_facing_contract import to_athlete_facing_update

snapshot = json.loads(sys.stdin.read())
db = connect(':memory:')
migrate(db)
outputs = run_all(snapshot, db)
receipt = decide(db, snapshot, outputs)
print(json.dumps({
  'receipt': {
    'action': receipt['action'],
    'reason_codes': receipt.get('reason_codes', []),
    'final_decision': receipt.get('final_decision', {}),
    'decision_mode': receipt.get('decision_mode'),
  },
  'athlete_facing': to_athlete_facing_update(receipt),
  'source': 'python_decide',
}))
`;
  const proc = spawnSync('python3', ['-c', script], {
    cwd: EVIDENCE_DIR,
    input: JSON.stringify(snapshot),
    encoding: 'utf8',
    timeout: 15000,
  });
  if (proc.status !== 0 || !proc.stdout) return null;
  try {
    return JSON.parse(proc.stdout.trim());
  } catch {
    return null;
  }
}

export async function handler(event) {
  const pf = preflight(event);
  if (pf) return pf;
  const badMethod = method(event, ['POST']);
  if (badMethod) return badMethod;

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const snapshot = payload.snapshot;
  if (!snapshot || typeof snapshot !== 'object') {
    return json({ error: 'snapshot_required' }, 400);
  }

  try {
    const pythonResult = decidePython(snapshot);
    if (pythonResult) {
      return json({ ok: true, ...pythonResult });
    }
    const receipt = decideJsShim(snapshot);
    const athleteFacing = toAthleteFacingUpdate(receipt);
    return json({
      ok: true,
      receipt,
      athlete_facing: athleteFacing,
      source: snapshot.product_engines !== false ? 'js_product_shim' : 'js_shim',
    });
  } catch (error) {
    return json({ error: 'big_mac_failed', message: safeError(error) }, 502);
  }
}
