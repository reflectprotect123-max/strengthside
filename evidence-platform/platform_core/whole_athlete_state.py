"""Whole-Athlete State assembly.

Builds the object shaped by schemas/athlete-state.schema.json from the five
engine outputs (platform_core.engines.run_all). This is a state-estimation
layer, not a sixth prescriber: it authenticates and normalizes what the five
systems said, it does not decide anything (ratified System Constitution,
"Whole-Athlete State is a state layer... cannot prescribe independently").
"""

from __future__ import annotations

import hashlib
from typing import Any, Mapping

from .engines.common import DOMAIN_NAMES, EngineInputError, validate_engine_output
from .receipt_replay import ReceiptValidationError, sha256_json


def _domain_quality(engine_output: Mapping[str, Any]) -> str:
    """Map an engine output's status to the schema's quality enum.

    status="synthetic_test_only" -> synthetic_test (fixture-only, never real
    evidence). status="inactive_no_approved_model" -> low (a real snapshot
    with nothing backing it yet is not "medium" or "high" confidence data -
    it is honestly weak). validate_engine_output already guarantees status
    is exactly one of those two values and agrees with synthetic_test_only.
    """
    if engine_output["status"] == "synthetic_test_only":
        return "synthetic_test"
    return "low"


def build_whole_athlete_state(
    domain_outputs: Mapping[str, Mapping[str, Any]],
    *,
    snapshot_id: str,
    observed_at: str,
    athlete_scope_id: str | None = None,
) -> dict[str, Any]:
    """Authenticate and normalize five engine outputs into one athlete-state snapshot.

    Raises ReceiptValidationError if any of the five outputs fails the shared
    engine contract (platform_core.engines.common.validate_engine_output) -
    this is the authentication step the ratified Constitution requires BIG
    MAC to perform before building state from anything the five systems sent.
    """
    if not isinstance(domain_outputs, Mapping):
        raise ReceiptValidationError("domain_outputs must be an object")
    domains: dict[str, Any] = {}
    hard_constraints: list[dict[str, Any]] = []
    for name in DOMAIN_NAMES:
        output = domain_outputs.get(name)
        try:
            validate_engine_output(output, name)
        except EngineInputError as exc:
            raise ReceiptValidationError(f"domain output {name} failed authentication: {exc}") from exc
        domains[name] = {
            "producer_version": output["engine_version"],
            "observed_at": observed_at,
            "quality": _domain_quality(output),
            "payload_hash": sha256_json(output),
            "payload": output,
        }
        for constraint in output.get("constraints", []):
            if isinstance(constraint, Mapping) and constraint.get("level") == "hard":
                hard_constraints.append(dict(constraint))

    qualities = {domains[name]["quality"] for name in DOMAIN_NAMES}
    if qualities == {"synthetic_test"}:
        overall_quality = "synthetic_test"
    elif "synthetic_test" in qualities:
        overall_quality = "low"  # a real+synthetic mix is never trustworthy as a whole
    else:
        overall_quality = "low"  # every real domain here is inactive_no_approved_model today

    body: dict[str, Any] = {
        "snapshot_id": snapshot_id,
        "timestamp": observed_at,
        "domains": domains,
        "data_quality": {"overall": overall_quality, "domains": {n: domains[n]["quality"] for n in DOMAIN_NAMES}},
        "hard_constraints": hard_constraints,
        "uncertainties": [],
    }
    if athlete_scope_id is not None:
        body["athlete_id_hash"] = hashlib.sha256(athlete_scope_id.encode("utf-8")).hexdigest()

    state_hash = sha256_json(body)
    return {**body, "state_hash": state_hash}
