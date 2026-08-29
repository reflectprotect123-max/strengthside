"""Locked product-policy constraints; these are not scientific inferences."""

def apply_action_scoped_constraints(candidates,context):
    """Return candidates with policy eligibility annotations, never a medical decision."""
    out=[]
    for original in candidates:
        candidate=dict(original); reasons=[]; action=candidate.get("action")
        if context.get("pain_recorded") and action=="strength_autopilot_load_increase":
            reasons.append("PAIN_HOLDS_STRENGTH_AUTOPILOT_LOAD_INCREASE")
        # Illness is record-only. HRV cannot create or clear pain/injury/illness restrictions.
        candidate["eligible"]=not reasons; candidate["policy_reason_codes"]=reasons; out.append(candidate)
    return out
