"""Shared domain-engine contracts with no scientific thresholds."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Mapping

from ..receipt_replay import sha256_json


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
