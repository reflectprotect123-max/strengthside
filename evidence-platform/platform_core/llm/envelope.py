"""FallbackActionEnvelope enforcement - the hard cage around what an LLM
lead-fallback candidate may ever propose (System Constitution section 12,
Shared Data Contract's FallbackActionEnvelope).
"""

from __future__ import annotations

from typing import Any, Mapping

from .contracts import ReceiptValidationError, validate_action_candidate, validate_fallback_action_envelope


def validate_candidate_against_envelope(
    candidate: Mapping[str, Any], envelope: Mapping[str, Any]
) -> list[str]:
    """Return violation codes for a candidate against an envelope.

    Never raises for a legitimately-shaped-but-rejected candidate - only a
    structurally malformed candidate or envelope produces a *_MALFORMED
    code instead of a crash. Re-validates shape defensively even though the
    real gateway flow already validated both before calling this.
    """
    try:
        candidate = validate_action_candidate(candidate)
    except ReceiptValidationError as exc:
        return [f"CANDIDATE_MALFORMED:{exc}"]
    try:
        envelope = validate_fallback_action_envelope(envelope)
    except ReceiptValidationError as exc:
        return [f"ENVELOPE_MALFORMED:{exc}"]

    violations: list[str] = []

    if candidate["action_type"] not in envelope["allowed_action_types"]:
        violations.append("ACTION_TYPE_NOT_IN_ENVELOPE")
    if candidate["target"]["target_type"] not in envelope["allowed_target_types"]:
        violations.append("TARGET_TYPE_NOT_IN_ENVELOPE")

    bounds_by_metric = {b["metric_key"]: b for b in envelope["metric_bounds"]}
    for change in candidate.get("changes", []):
        bound = bounds_by_metric.get(change["metric_key"])
        if bound is None:
            continue  # a metric with no declared bound is not itself a violation
        value = change.get("value")
        if isinstance(value, bool):
            continue
        if isinstance(value, (int, float)):
            if not (bound["minimum"] <= value <= bound["maximum"]):
                violations.append(f"METRIC_OUT_OF_BOUNDS:{change['metric_key']}")
        elif isinstance(value, Mapping):
            lower, upper = value.get("lower"), value.get("upper")
            if lower is not None and lower < bound["minimum"]:
                violations.append(f"METRIC_OUT_OF_BOUNDS:{change['metric_key']}")
            if upper is not None and upper > bound["maximum"]:
                violations.append(f"METRIC_OUT_OF_BOUNDS:{change['metric_key']}")

    # Best-current interpretation of forbidden_combinations: a combination is
    # violated if every id in it appears among this candidate's own id plus
    # its declared support/interference tags. Refine once real envelopes
    # with real forbidden_combinations exist to check this against.
    candidate_ids = {candidate["candidate_id"]} | set(candidate.get("support_tags", [])) | set(candidate.get("interference_tags", []))
    for combo in envelope.get("forbidden_combinations", []):
        if set(combo) <= candidate_ids:
            violations.append(f"FORBIDDEN_COMBINATION:{','.join(sorted(combo))}")

    if candidate.get("authority_mode") == "lead_fallback" and candidate.get("fallback_envelope_id") != envelope["envelope_id"]:
        violations.append("FALLBACK_ENVELOPE_ID_MISMATCH")

    return violations
