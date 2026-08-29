from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Mapping

from .receipt_replay import (
    build_receipt,
    canonical_json,
    commit_receipt,
    replay_receipt,
    sha256_json,
)


DOMAINS = ("strength", "conditioning", "nutrition", "recovery", "coordinator")
EVALUATOR_ID = "pre_research_decision_gate"
EVALUATOR_VERSION = "2.0"


def canonical(value: Any) -> str:
    """Compatibility wrapper for callers of the pre-v2 prototype."""
    return canonical_json(value)


def sha(value: Any) -> str:
    """Compatibility wrapper for callers of the pre-v2 prototype."""
    return sha256_json(value)


def load_runtime_models(db):
    models = []
    errors = []
    for row in db.execute(
        "SELECT * FROM runtime_artifacts WHERE artifact_type='model' AND status='active'"
    ):
        item = dict(row)
        if (
            item["llm_tainted"]
            or item["trust_origin"] != "human_promoted_verified"
            or not item["deterministic"]
        ):
            errors.append("UNTRUSTED_RUNTIME_ARTIFACT:" + item["artifact_id"])
            continue
        path = Path(item["artifact_path"])
        if not path.is_file():
            errors.append("MODEL_ARTIFACT_MISSING:" + item["artifact_id"])
            continue
        actual = hashlib.sha256(path.read_bytes()).hexdigest()
        if actual != item["artifact_hash"]:
            errors.append("MODEL_ARTIFACT_HASH_MISMATCH:" + item["artifact_id"])
            continue
        model = json.loads(path.read_text())
        model["model_id"] = item["artifact_id"]
        models.append(model)
    return models, errors


def validate_domain_outputs(domain_outputs):
    problems = []
    for name in DOMAINS:
        value = domain_outputs.get(name)
        if not isinstance(value, dict) or not value:
            problems.append("EMPTY_OR_MISSING_DOMAIN:" + name.upper())
    return problems


def _artifact_manifest(models):
    manifest = []
    frozen_artifacts = {}
    for index, model in enumerate(models):
        model_id = str(model.get("model_id") or f"MODEL-{index:03d}")
        frozen_artifacts[model_id] = model
        manifest.append(
            {
                "artifact_id": model_id,
                "artifact_type": "model",
                "version": str(model.get("version") or "0.0"),
                "artifact_hash": sha256_json(model),
            }
        )
    return manifest, frozen_artifacts


def _evaluate_replay_bundle(bundle: Mapping[str, Any]) -> dict[str, Any]:
    inputs = bundle["inputs"]
    snapshot = inputs["snapshot"]
    domain_outputs = inputs["domain_outputs"]
    models = inputs["models"]
    artifact_errors = inputs["artifact_errors"]

    domain_errors = validate_domain_outputs(domain_outputs)
    if domain_errors:
        raise ValueError("Invalid five-system outputs: " + ", ".join(domain_errors))

    synthetic = bool(models) and all(
        model.get("synthetic_test_only") is True for model in models
    )
    if artifact_errors:
        action = "abstain"
        reasons = list(artifact_errors)
        requires_llm_fallback = False
    elif not models:
        action = "abstain"
        reasons = [
            "NO_APPROVED_MODEL",
            "NO_DETERMINISTIC_ANSWER",
            "LEAD_FALLBACK_NOT_CONNECTED",
        ]
        requires_llm_fallback = True
    elif synthetic:
        action = "hold"
        reasons = ["SYNTHETIC_TEST_ONLY"]
        requires_llm_fallback = False
    else:
        action = "abstain"
        reasons = [
            "RUNTIME_ACTIVATION_NOT_APPROVED",
            "NO_DETERMINISTIC_ANSWER",
            "LEAD_FALLBACK_NOT_CONNECTED",
        ]
        requires_llm_fallback = True

    model_ids = [str(model.get("model_id", "synthetic")) for model in models]
    candidate = {
        "candidate_id": "CAND-" + sha256_json(
            {
                "action": action,
                "snapshot": snapshot,
                "domains": domain_outputs,
                "model_ids": model_ids,
            }
        )[:16].upper(),
        "action": action,
        "source": "big_mac_gate",
        "authority_mode": "deterministic",
        "eligible": action != "abstain",
        "rejection_reason_codes": reasons if action == "abstain" else [],
    }
    validators = [
        {"validator": "five_domain_presence", "passed": True, "reason_codes": []},
        {
            "validator": "runtime_trust_boundary",
            "passed": not artifact_errors,
            "reason_codes": list(artifact_errors),
        },
        {
            "validator": "silent_user_experience",
            "passed": True,
            "reason_codes": [],
        },
        {
            "validator": "llm_direct_write_forbidden",
            "passed": True,
            "reason_codes": [],
        },
    ]
    return {
        "system": "THE Hybrid System",
        "architecture": "big_mac_hybrid_control",
        "action": action,
        "rationale": reasons,
        "reason_codes": reasons,
        "requires_llm_fallback": requires_llm_fallback,
        "snapshot_hash": sha256_json(snapshot),
        "domain_output_hashes": {
            domain: sha256_json(domain_outputs[domain]) for domain in DOMAINS
        },
        "model_ids": model_ids,
        "candidate_ledger": [candidate],
        "validator_results": validators,
        "final_decision": {
            "action": action,
            "source": "big_mac_gate",
            "committed_change": action != "abstain",
            "requires_llm_fallback": requires_llm_fallback,
        },
        "bounded": True,
        "silent_apply_allowed": True,
        "silent_user_experience": True,
        "user_facing_explanation_emitted": False,
    }


def _decision_id(snapshot, domain_outputs, models, artifact_errors):
    digest = sha256_json(
        {
            "snapshot": snapshot,
            "domain_outputs": domain_outputs,
            "models": models,
            "artifact_errors": artifact_errors,
        }
    )
    return "DEC-V2-" + digest[:24].upper()


def decide(db, snapshot, domain_outputs, models=None, persist=False):
    domain_errors = validate_domain_outputs(domain_outputs)
    if domain_errors:
        raise ValueError("Invalid five-system outputs: " + ", ".join(domain_errors))

    artifact_errors = []
    if models is None:
        models, artifact_errors = load_runtime_models(db)
    models = list(models)
    artifact_manifest, frozen_artifacts = _artifact_manifest(models)
    replay_bundle = {
        "bundle_version": "2.0",
        "inputs": {
            "snapshot": snapshot,
            "domain_outputs": domain_outputs,
            "models": models,
            "artifact_errors": artifact_errors,
        },
        "frozen_artifacts": frozen_artifacts,
        "frozen_llm_response": None,
    }
    trace = _evaluate_replay_bundle(replay_bundle)
    decision_mode = "deterministic" if trace["action"] != "abstain" else "abstention"
    created_at = str(
        snapshot.get("as_of")
        or snapshot.get("occurred_at")
        or datetime.now(timezone.utc).isoformat()
    )
    athlete_scope_id = str(
        snapshot.get("athlete_scope_id")
        or snapshot.get("athlete_id")
        or "UNKNOWN-ATHLETE"
    )
    decision_id = _decision_id(snapshot, domain_outputs, models, artifact_errors)

    arguments = {
        "decision_id": decision_id,
        "athlete_scope_id": athlete_scope_id,
        "created_at": created_at,
        "decision_mode": decision_mode,
        "decision_trace": trace,
        "replay_bundle": replay_bundle,
        "evaluator_id": EVALUATOR_ID,
        "evaluator_version": EVALUATOR_VERSION,
        "artifact_manifest": artifact_manifest,
    }
    if persist:
        return commit_receipt(db, **arguments)
    return build_receipt(**arguments)


def replay(db, receipt_id):
    return replay_receipt(
        db,
        receipt_id,
        {(EVALUATOR_ID, EVALUATOR_VERSION): _evaluate_replay_bundle},
    )
