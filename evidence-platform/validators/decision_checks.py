from __future__ import annotations


def validate_candidate(context: dict) -> list[str]:
    """Legacy structural test helper; it is never runtime authorization."""
    errors: list[str] = []
    if context.get("mode") != "structural_test_only":
        errors.append("legacy_validator_not_runtime_authority")
    required = ["inputs", "rule", "model", "candidate", "provenance"]
    for key in required:
        if key not in context or context[key] in (None, "", [], {}):
            errors.append(f"missing_required:{key}")

    if context.get("contradiction", {}).get("status") == "unresolved":
        errors.append("unresolved_contradictory_evidence")

    left = context.get("comparison", {}).get("left", {})
    right = context.get("comparison", {}).get("right", {})
    if left and right:
        if left.get("unit") != right.get("unit") and not context.get("comparison", {}).get("approved_conversion"):
            errors.append("incompatible_units")
        if left.get("denominator") != right.get("denominator"):
            errors.append("different_denominators")
        if left.get("population_id") != right.get("population_id") and not context.get("comparison", {}).get("applicability_review_id"):
            errors.append("different_populations_unreviewed")

    rule = context.get("rule", {})
    if rule and (rule.get("status") != "active" or rule.get("stale") is True):
        errors.append("stale_or_inactive_rule")

    model = context.get("model", {})
    if model and (model.get("status") != "active" or not model.get("hash_valid", False)):
        errors.append("invalid_model_version")

    for constraint in context.get("hard_safety_constraints", []):
        blocked_actions=constraint.get("blocked_actions", [])
        if context.get("candidate", {}).get("action") in blocked_actions:
            errors.append("unsafe_candidate_blocked")

    provenance = context.get("provenance", {})
    if provenance and not all(provenance.get(k) for k in ("source_ids", "claim_ids", "policy_ids", "rule_ids")):
        errors.append("incomplete_provenance")

    recs = context.get("system_recommendations", [])
    if len({r.get("action") for r in recs if r.get("action")}) > 1 and not context.get("conflict_resolution"):
        errors.append("conflicting_system_recommendations")
    return sorted(set(errors))
