"""Shared domain-engine contracts with no scientific thresholds."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Mapping

from ..receipt_replay import sha256_json
from ..runtime_artifacts import load_trusted_model_artifacts


ENGINE_VERSION = "0.1.0"
ALLOWED_ACTIONS = frozenset(
    {"proceed", "maintain", "trim", "modify", "hold", "record_only", "abstain"}
)
DOMAIN_NAMES = frozenset(
    {"strength", "conditioning", "nutrition", "recovery", "coordinator"}
)


class EngineInputError(ValueError):
    """Raised when an engine receives a malformed shared-contract input."""


def validate_snapshot(snapshot: Mapping[str, Any]) -> dict[str, Any]:
    if not isinstance(snapshot, Mapping):
        raise EngineInputError("snapshot must be an object")
    item = dict(snapshot)
    athlete = item.get("athlete_scope_id") or item.get("athlete_id")
    if not isinstance(athlete, str) or not athlete.strip():
        raise EngineInputError("snapshot requires a non-empty athlete identifier")
    occurred_at = item.get("as_of") or item.get("occurred_at")
    if not isinstance(occurred_at, str):
        raise EngineInputError("snapshot requires as_of or occurred_at")
    try:
        datetime.fromisoformat(occurred_at.replace("Z", "+00:00"))
    except ValueError as exc:
        raise EngineInputError("snapshot timestamp must be ISO-8601") from exc
    return item


def synthetic_directive(
    snapshot: Mapping[str, Any], system: str
) -> dict[str, Any] | None:
    """Return a fixture-only directive; never interpret real athlete measurements."""
    if system not in DOMAIN_NAMES:
        raise EngineInputError(f"unknown system: {system}")
    if snapshot.get("fixture") != "synthetic_test_only":
        return None
    directives = snapshot.get("synthetic_directives", {})
    if not isinstance(directives, Mapping):
        raise EngineInputError("synthetic_directives must be an object")
    original = directives.get(system)
    if original is None:
        return None
    if not isinstance(original, Mapping):
        raise EngineInputError(f"synthetic directive for {system} must be an object")
    directive = dict(original)
    action = directive.get("action")
    if action not in ALLOWED_ACTIONS:
        raise EngineInputError(f"invalid synthetic action for {system}: {action}")
    return directive


def make_output(
    *,
    system: str,
    action: str,
    reason_codes: list[str],
    synthetic: bool,
    state_estimate: Mapping[str, Any] | None = None,
    constraints: list[Mapping[str, Any]] | None = None,
    confidence: float = 0.0,
) -> dict[str, Any]:
    if system not in DOMAIN_NAMES:
        raise EngineInputError(f"unknown system: {system}")
    if action not in ALLOWED_ACTIONS:
        raise EngineInputError(f"invalid action: {action}")
    if not isinstance(confidence, (int, float)) or not 0 <= float(confidence) <= 1:
        raise EngineInputError("confidence must be between 0 and 1")
    candidate_body = {
        "system": system,
        "action": action,
        "reason_codes": list(reason_codes),
        "synthetic_test_only": bool(synthetic),
    }
    candidate = {
        "candidate_id": "CAND-" + sha256_json(candidate_body)[:20].upper(),
        "action": action,
        "source_system": system,
        "eligible": action != "abstain",
        "synthetic_test_only": bool(synthetic),
        "reason_codes": list(reason_codes),
    }
    return {
        "system": system,
        "engine_version": ENGINE_VERSION,
        "status": "synthetic_test_only" if synthetic else "inactive_no_approved_model",
        "state_estimate": dict(state_estimate or {}),
        "proposed_actions": [candidate],
        "constraints": [dict(item) for item in (constraints or [])],
        "confidence": float(confidence),
        "evidence_ids": [],
        "model_version": "synthetic-shell-v1" if synthetic else "none",
        "reason_codes": list(reason_codes),
        "synthetic_test_only": bool(synthetic),
    }


def run_generic_engine(snapshot: Mapping[str, Any], system: str, db: Any = None) -> dict[str, Any]:
    """Shared evaluate() body for every engine with no reviewed rule module yet.

    Order: honor a synthetic snapshot directive first (fixture plumbing, never
    real interpretation); then, if `db` is given, check for THIS engine's own
    active, hash-verified model (Phase 3/4's per-system seam); otherwise
    abstain. Identical for all five systems today because none of them has a
    reviewed rule module to apply real content with yet - the moment one
    does, that system's evaluate() stops calling this and gets its own body,
    the way platform_core/engines/strength.py will once strength has a
    promoted rule (see docs/phase3-strength-session-gate-research-brief.md).
    """
    snapshot = validate_snapshot(snapshot)
    directive = synthetic_directive(snapshot, system)
    if directive is not None:
        return make_output(
            system=system,
            action=directive["action"],
            reason_codes=["SYNTHETIC_TEST_ONLY"],
            synthetic=True,
            confidence=float(directive.get("confidence", 0.0)),
        )

    if db is not None:
        model, artifact_errors = load_active_engine_model(db, system)
        if artifact_errors:
            return make_output(
                system=system,
                action="abstain",
                reason_codes=["NO_APPROVED_MODEL", *artifact_errors],
                synthetic=False,
                confidence=0.0,
            )
        if model is not None:
            if model.get("synthetic_test_only"):
                # Proves the seam works mechanically, end to end, using only
                # synthetic content - the same "synthetic fixtures may
                # exercise action plumbing only" allowance synthetic_directive
                # already relies on.
                model_directive = model.get("synthetic_directive", {})
                action = model_directive.get("action", "abstain")
                if action not in ALLOWED_ACTIONS:
                    action = "abstain"
                return make_output(
                    system=system,
                    action=action,
                    reason_codes=["SYNTHETIC_TEST_ONLY", "ENGINE_SCOPED_MODEL_APPLIED"],
                    synthetic=True,
                    confidence=float(model.get("confidence", 0.0)),
                )
            # A real (non-synthetic) model is registered, but this engine has
            # no reviewed rule module to interpret it with yet - abstain
            # honestly rather than guessing what an unreviewed model means.
            return make_output(
                system=system,
                action="abstain",
                reason_codes=["ACTIVE_MODEL_APPLICATION_NOT_YET_IMPLEMENTED"],
                synthetic=False,
                confidence=0.0,
            )

    return make_output(
        system=system,
        action="abstain",
        reason_codes=["NO_APPROVED_MODEL"],
        synthetic=False,
        confidence=0.0,
    )


def load_active_engine_model(db: Any, system: str) -> tuple[dict[str, Any] | None, list[str]]:
    """Load this one engine's own active, hash-verified model, if any.

    Entirely separate from BIG MAC's own model pool
    (runtime_artifacts.system IS NULL) - scoped to runtime_artifacts rows
    whose system column names this engine. Returns (None, []) when no
    active model is registered - the ordinary, current state for every
    engine. Non-empty errors mean an artifact IS registered but failed a
    trust or integrity check (untrusted origin, missing file, hash
    mismatch) - surfaced distinctly rather than silently treated as "no
    model", the same way decision.py's own pool surfaces artifact_errors.
    """
    if system not in DOMAIN_NAMES:
        raise EngineInputError(f"unknown system: {system}")
    models, errors = load_trusted_model_artifacts(db, system=system)
    if errors:
        return None, errors
    return (models[0] if models else None), []


def validate_engine_output(output: Mapping[str, Any], expected_system: str) -> None:
    if not isinstance(output, Mapping):
        raise EngineInputError(f"{expected_system} output must be an object")
    if output.get("system") != expected_system:
        raise EngineInputError(f"{expected_system} output has wrong system identity")
    if not isinstance(output.get("engine_version"), str) or not output["engine_version"].strip():
        raise EngineInputError(f"{expected_system} requires a non-empty engine_version")
    if not isinstance(output.get("model_version"), str) or not output["model_version"].strip():
        raise EngineInputError(f"{expected_system} requires a non-empty model_version")
    if output.get("status") not in {"synthetic_test_only", "inactive_no_approved_model"}:
        raise EngineInputError(f"{expected_system} has an invalid status")
    if not isinstance(output.get("synthetic_test_only"), bool):
        raise EngineInputError(f"{expected_system} requires a boolean synthetic_test_only")
    if (output["status"] == "synthetic_test_only") != output["synthetic_test_only"]:
        raise EngineInputError(f"{expected_system} status/synthetic_test_only disagree")
    if not isinstance(output.get("state_estimate"), Mapping):
        raise EngineInputError(f"{expected_system} requires a state_estimate object")
    if not isinstance(output.get("evidence_ids"), list):
        raise EngineInputError(f"{expected_system} requires an evidence_ids list")
    if not isinstance(output.get("reason_codes"), list) or not all(
        isinstance(code, str) and code.strip() for code in output["reason_codes"]
    ):
        raise EngineInputError(f"{expected_system} requires a list of non-empty reason_codes")
    if not isinstance(output.get("constraints"), list) or not all(
        isinstance(item, Mapping) for item in output["constraints"]
    ):
        raise EngineInputError(f"{expected_system} requires a list of constraint objects")
    actions = output.get("proposed_actions")
    if not isinstance(actions, list) or not actions:
        raise EngineInputError(f"{expected_system} requires proposed_actions")
    for candidate in actions:
        if not isinstance(candidate, Mapping) or candidate.get("action") not in ALLOWED_ACTIONS:
            raise EngineInputError(f"{expected_system} contains an invalid action candidate")
        if candidate.get("source_system") != expected_system:
            raise EngineInputError(f"{expected_system} candidate has wrong source identity")
    confidence = output.get("confidence")
    if (
        not isinstance(confidence, (int, float))
        or isinstance(confidence, bool)
        or not 0 <= float(confidence) <= 1
    ):
        raise EngineInputError(f"{expected_system} confidence is invalid")
