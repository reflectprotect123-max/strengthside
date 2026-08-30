from __future__ import annotations

from typing import Any, Mapping

from .arbitration import arbitrate, collect_engine_candidates
from .engines.common import EngineInputError, validate_engine_output, validate_snapshot
from .llm.orchestrate import attempt_lead_fallback
from .receipt_replay import (
    build_receipt,
    canonical_json,
    commit_receipt,
    replay_receipt,
    sha256_json,
)
from .runtime_artifacts import load_trusted_model_artifacts


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
    """BIG MAC's own model pool (runtime_artifacts.system IS NULL) - kept as
    a thin wrapper for backward compatibility; the real logic is shared
    with per-engine model loading in runtime_artifacts.py so the two never
    drift apart.
    """
    return load_trusted_model_artifacts(db, system=None)


def validate_domain_outputs(domain_outputs):
    """Reject malformed five-system output shapes, not just missing keys.

    This is the shared-contract enforcement point the gate relies on: each
    domain output must satisfy the same contract
    platform_core/engines/<system>.py produces
    (engines.common.validate_engine_output) - the one shared output shape
    for all five systems (Phase 1). A domain output that is present but
    structurally wrong must fail here rather than reach a decision receipt.
    """
    if not isinstance(domain_outputs, Mapping):
        return ["DOMAIN_OUTPUTS_NOT_AN_OBJECT"]
    problems = []
    for name in DOMAINS:
        value = domain_outputs.get(name)
        try:
            validate_engine_output(value, name)
        except EngineInputError as exc:
            problems.append(f"INVALID_DOMAIN_OUTPUT:{name.upper()}:{exc}")
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

    # Phase 5: what did the five systems themselves propose? Entirely
    # separate from the models pool above (BIG MAC's own artifact pool,
    # runtime_artifacts.system IS NULL) - this looks at each engine's own
    # proposed_actions[0] (runtime_artifacts.system=<name>, Phase 3/4's
    # per-engine seam). A real cross-domain conflict is never silently
    # resolved here - see platform_core/arbitration.py's own docstring for
    # why picking a side needs a reviewed policy this gate does not have.
    domain_candidates = collect_engine_candidates(domain_outputs)
    candidate_arbitration = arbitrate(domain_candidates)
    trigger_domain = snapshot.get("trigger_domain")
    trigger_applied = False
    if isinstance(trigger_domain, str) and trigger_domain:
        for candidate in domain_candidates:
            if candidate.get("domain") == trigger_domain:
                action = candidate["action"]
                reasons = [f"PRODUCT_ENGINE_{trigger_domain.upper()}"] + list(
                    candidate.get("reason_codes", [])
                )
                requires_llm_fallback = False
                trigger_applied = True
                break
    if not trigger_applied and candidate_arbitration["conflict"]:
        # Deliberately unconditional, unlike the unanimous branch below: the
        # models pool has no visibility into what the five engines proposed
        # and never reasoned about a cross-domain conflict, so it can never
        # be trusted to have "already resolved" one it never saw - a real
        # disagreement between domains overrides even a models-pool "hold",
        # synthetic or not (see test_conflict_overrides_a_synthetic_hold).
        action = "abstain"
        reasons = [
            "MULTI_DOMAIN_CANDIDATE_NO_ARBITRATION_POLICY",
            "NO_DETERMINISTIC_ANSWER",
            "LEAD_FALLBACK_NOT_CONNECTED",
        ]
        requires_llm_fallback = True
    elif not trigger_applied and candidate_arbitration["unanimous_action"] is not None and action == "abstain":
        # The models pool alone had nothing (or nothing approved), but every
        # engine that proposed anything agreed on the same action - apply it
        # rather than abstain when there is nothing left to disagree about.
        action = candidate_arbitration["unanimous_action"]
        reasons = ["ENGINE_CANDIDATE_APPLIED"] + sorted(
            {
                code
                for candidate in candidate_arbitration["candidates"]
                for code in candidate.get("reason_codes", [])
            }
        )
        requires_llm_fallback = False

    # Phase 2: a frozen, already-validated lead-fallback response overrides
    # a deterministic abstain. This block reads only what is already frozen
    # in the bundle - no network call happens here, ever, so replay
    # reproduces this exact branch from the same bundle with no provider
    # call. The response was independently validated (contract + envelope)
    # before ever being frozen into the bundle (platform_core/llm/orchestrate.py);
    # this trusts that frozen, hash-chained artifact, the same way the
    # deterministic path trusts a hash-verified model artifact.
    llm_applied = False
    frozen_llm_response = bundle.get("frozen_llm_response")
    if requires_llm_fallback and frozen_llm_response and frozen_llm_response.get("mode") == "lead_fallback":
        proposed = frozen_llm_response["proposed_decision"]
        action = proposed["action_type"]
        reasons = list(frozen_llm_response.get("decision_basis_codes", [])) + ["LEAD_FALLBACK_APPLIED"]
        requires_llm_fallback = False
        llm_applied = True

    model_ids = [str(model.get("model_id", "synthetic")) for model in models]
    if llm_applied:
        candidate = {
            "candidate_id": frozen_llm_response["proposed_decision"]["candidate_id"],
            "action": action,
            "source": frozen_llm_response["provider"],
            "authority_mode": "lead_fallback",
            "eligible": action != "abstain",
            "rejection_reason_codes": [],
        }
    else:
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
    # Phase 5: record every domain's own proposal in the ledger, not just the
    # winning candidate - eligible=True/rejection_reason_codes=[] only for
    # the ones that agree with the final action; the rest are marked
    # rejected, distinctly, for why (a real conflict, or simply superseded
    # by a stronger BIG MAC-level answer that did not need engine consensus).
    domain_ledger_entries = []
    for domain_candidate in candidate_arbitration["candidates"]:
        matches_final = domain_candidate["action"] == action
        domain_ledger_entries.append(
            {
                "candidate_id": domain_candidate.get("candidate_id", f"CAND-{domain_candidate['domain'].upper()}"),
                "action": domain_candidate["action"],
                "source": f"engine:{domain_candidate['domain']}",
                "authority_mode": "engine_proposed",
                "eligible": matches_final,
                "rejection_reason_codes": (
                    []
                    if matches_final
                    else (
                        ["MULTI_DOMAIN_CANDIDATE_NO_ARBITRATION_POLICY"]
                        if candidate_arbitration["conflict"]
                        else ["SUPERSEDED_BY_BIG_MAC_MODEL"]
                    )
                ),
            }
        )

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
        "llm_applied": llm_applied,
        "snapshot_hash": sha256_json(snapshot),
        "domain_output_hashes": {
            domain: sha256_json(domain_outputs[domain]) for domain in DOMAINS
        },
        "model_ids": model_ids,
        "candidate_ledger": domain_ledger_entries + [candidate],
        "validator_results": validators,
        "final_decision": {
            "action": action,
            "source": candidate["source"],
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


def decide(db, snapshot, domain_outputs, models=None, persist=False, *, lead_fallback=None):
    """Evaluate one decision. `lead_fallback`, if given, is a dict of kwargs
    for platform_core.llm.orchestrate.attempt_lead_fallback (routing_policy,
    lead, backup, fallback_envelope, current_plan, privacy_projection,
    policy_refs, whole_athlete_state, ...). It is consulted at most once,
    only when the deterministic pass would otherwise abstain with
    NO_DETERMINISTIC_ANSWER, and only its frozen result (success or
    failure) ever reaches the trace - omit it entirely to keep the
    deterministic-only behavior every existing caller already depends on.
    """
    try:
        snapshot = validate_snapshot(snapshot)
    except EngineInputError as exc:
        raise ValueError(f"Invalid snapshot: {exc}") from exc
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
    llm_contribution = None

    if lead_fallback is not None and trace["requires_llm_fallback"]:
        decision_id_for_fallback = _decision_id(snapshot, domain_outputs, models, artifact_errors)
        athlete_scope_id_for_fallback = str(
            snapshot.get("athlete_scope_id") or snapshot.get("athlete_id")
        )
        result = attempt_lead_fallback(
            decision_id=decision_id_for_fallback,
            athlete_scope_id=athlete_scope_id_for_fallback,
            domain_outputs=domain_outputs,
            **lead_fallback,
        )
        if result["ok"]:
            replay_bundle["frozen_llm_response"] = result["frozen_llm_response"]
            replay_bundle["frozen_llm_context"] = result["frozen_llm_context"]
            trace = _evaluate_replay_bundle(replay_bundle)
            llm_contribution = result["llm_contribution"]
        else:
            trace["reason_codes"] = trace["reason_codes"] + result["reason_codes"]
            trace["rationale"] = trace["rationale"] + result["reason_codes"]

    decision_mode = (
        "lead_fallback" if trace.get("llm_applied")
        else "deterministic" if trace["action"] != "abstain"
        else "abstention"
    )
    # validate_snapshot already guaranteed one of each pair is a non-empty,
    # ISO-8601-valid string; no silent defaulting to "now"/"UNKNOWN-ATHLETE".
    created_at = str(snapshot.get("as_of") or snapshot.get("occurred_at"))
    athlete_scope_id = str(
        snapshot.get("athlete_scope_id") or snapshot.get("athlete_id")
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
        "llm_contribution": llm_contribution,
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
