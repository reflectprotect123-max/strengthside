import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { preflight, json, method, safeError } from './_lib/http.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../../../');
const EVIDENCE_DIR = path.join(REPO_ROOT, 'evidence-platform');

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

function runEngines(snapshot) {
  const domains = ['strength', 'conditioning', 'nutrition', 'recovery', 'coordinator'];
  const out = {};
  const synthetic = snapshot?.fixture === 'synthetic_test_only';
  const directives = snapshot?.synthetic_directives || {};
  for (const name of domains) {
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

function decideJsShim(snapshot, domainOutputs) {
  const outputs = domainOutputs || runEngines(snapshot);
  const candidates = [];
  for (const domain of Object.keys(outputs)) {
    const proposed = outputs[domain]?.proposed_actions?.[0];
    if (!proposed || proposed.action === 'abstain' || !proposed.eligible) continue;
    candidates.push({ domain, action: proposed.action });
  }
  let action = 'abstain';
  let reasonCodes = ['NO_APPROVED_MODEL', 'NO_DETERMINISTIC_ANSWER', 'LEAD_FALLBACK_NOT_CONNECTED'];
  const actions = [...new Set(candidates.map((c) => c.action))];
  if (actions.length > 1) {
    reasonCodes = ['MULTI_DOMAIN_CANDIDATE_NO_ARBITRATION_POLICY', 'NO_DETERMINISTIC_ANSWER', 'LEAD_FALLBACK_NOT_CONNECTED'];
  } else if (actions.length === 1) {
    action = actions[0];
    reasonCodes = ['ENGINE_CANDIDATE_APPLIED'];
  }
  return {
    action,
    reason_codes: reasonCodes,
    final_decision: { committed_change: action !== 'abstain' },
    decision_mode: action !== 'abstain' ? 'deterministic' : 'abstention',
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
      source: 'js_shim',
    });
  } catch (error) {
    return json({ error: 'big_mac_failed', message: safeError(error) }, 502);
  }
}
