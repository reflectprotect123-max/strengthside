"""Python mirror of apps/mobile/prototype/hybrid-app/big-mac-product-engines.js.

Evaluates athlete snapshots using the shipped Hybrid product decision layer.
Used by auto-promoted runtime artifacts — not the unreviewed research corpus.
"""

from __future__ import annotations

from typing import Any, Mapping

ENGINE_VERSION = "1.0.0-product"
MODEL_VERSION = "hybrid-product-v1"
DOMAINS = ("strength", "conditioning", "nutrition", "recovery", "coordinator")


def _num(value: Any) -> float:
    try:
        n = float(value)
    except (TypeError, ValueError):
        return 0.0
    return n if n == n else 0.0  # NaN guard


def make_output(
    system: str,
    action: str,
    reason_codes: list[str],
    state_estimate: Mapping[str, Any] | None = None,
    confidence: float = 0.85,
) -> dict[str, Any]:
    reason_codes = list(reason_codes)
    state_estimate = dict(state_estimate or {})
    return {
        "system": system,
        "engine_version": ENGINE_VERSION,
        "status": "inactive_no_approved_model",
        "synthetic_test_only": False,
        "confidence": confidence,
        "model_version": MODEL_VERSION,
        "evidence_ids": [],
        "reason_codes": reason_codes,
        "state_estimate": state_estimate,
        "constraints": [],
        "proposed_actions": [{
            "action": action,
            "candidate_id": f"CAND-PRODUCT-{system.upper()}",
            "eligible": action != "abstain",
            "reason_codes": reason_codes,
            "source_system": system,
            "synthetic_test_only": False,
        }],
    }


def evaluate_strength(snapshot: Mapping[str, Any]) -> dict[str, Any]:
    domain = snapshot.get("strength_domain") or {}
    if domain.get("session_pain") == "yes":
        return make_output("strength", "hold", ["session_pain_yes"], {"sessionPain": "yes"})
    audit = domain.get("recent_audit") or []
    if audit:
        actions = [entry.get("action") for entry in audit if isinstance(entry, Mapping)]
        if "deload" in actions:
            return make_output("strength", "trim", ["progression_deload"], {"auditActions": actions})
        if "progress" in actions:
            return make_output("strength", "proceed", ["progression_progress"], {"auditActions": actions})
        if "retest" in actions:
            return make_output("strength", "modify", ["progression_retest"], {"auditActions": actions})
        if actions:
            return make_output("strength", "hold", ["progression_hold"], {"auditActions": actions})
    if domain.get("session_id"):
        return make_output("strength", "record_only", ["STRENGTH_SESSION_LOGGED"], {}, 0.5)
    return make_output("strength", "record_only", ["STRENGTH_NO_SIGNAL"], {}, 0.4)


def evaluate_conditioning(snapshot: Mapping[str, Any]) -> dict[str, Any]:
    domain = snapshot.get("conditioning_domain") or {}
    last_delta = domain.get("last_delta")
    if last_delta is not None:
        delta = _num(last_delta)
        if delta > 0:
            return make_output("conditioning", "proceed", ["con_adapt_progress"], {"delta": delta})
        if delta < 0:
            return make_output("conditioning", "trim", ["con_adapt_regress"], {"delta": delta})
        return make_output("conditioning", "maintain", ["con_adapt_hold"], {"delta": 0})
    if _num(domain.get("sessions_completed")) > 0:
        return make_output(
            "conditioning",
            "record_only",
            ["conditioning_logged"],
            {"sessionsCompleted": domain.get("sessions_completed")},
            0.6,
        )
    return make_output("conditioning", "record_only", ["conditioning_no_adapt_signal"], {}, 0.4)


def evaluate_recovery(snapshot: Mapping[str, Any]) -> dict[str, Any]:
    domain = snapshot.get("recovery_domain") or {}
    if domain.get("illness") is True:
        return make_output("recovery", "hold", ["illness_flagged"], {"illness": True})
    posture = domain.get("posture") or {}
    gate = posture.get("gate")
    band = posture.get("band")
    reason_codes = list(posture.get("reasonCodes") or posture.get("reason_codes") or [])
    if gate == "hold" or band == "minimum":
        return make_output("recovery", "hold", reason_codes or ["recovery_minimum"], posture)
    if gate == "caution" or band == "control":
        return make_output("recovery", "maintain", reason_codes or ["recovery_control"], posture)
    if band == "insufficient_data":
        return make_output("recovery", "record_only", ["recovery_no_checkin"], posture, 0.5)
    if posture:
        return make_output("recovery", "proceed", reason_codes or ["recovery_build"], posture)
    return make_output("recovery", "record_only", ["recovery_no_posture"], {}, 0.4)


def evaluate_nutrition(snapshot: Mapping[str, Any]) -> dict[str, Any]:
    domain = snapshot.get("nutrition_domain") or {}
    days_in_window = int(_num(domain.get("days_in_window")) or 7)
    days_logged = int(_num(domain.get("days_logged")))
    if domain.get("low_energy_flag"):
        return make_output("nutrition", "hold", ["nutrition_low_energy"], {"daysLogged": days_logged})
    if days_logged == 0:
        return make_output("nutrition", "record_only", ["nutrition_none"], {"daysInWindow": days_in_window}, 0.5)
    pct = days_logged / days_in_window if days_in_window else 0
    if domain.get("off_target"):
        return make_output("nutrition", "modify", ["nutrition_off_target"], domain.get("targets") or {})
    if pct < 0.5:
        return make_output(
            "nutrition",
            "maintain",
            ["nutrition_sparse"],
            {"daysLogged": days_logged, "daysInWindow": days_in_window},
        )
    return make_output(
        "nutrition",
        "proceed",
        ["nutrition_logged"],
        {"daysLogged": days_logged, "daysInWindow": days_in_window},
    )


def _coordinator_kind_to_action(kind: str) -> str:
    return {
        "hold": "hold",
        "ease": "trim",
        "push": "proceed",
        "maintain": "maintain",
    }.get(kind, "record_only")


def evaluate_coordinator(snapshot: Mapping[str, Any]) -> dict[str, Any]:
    domain = snapshot.get("coordinator_domain") or {}
    items = domain.get("items") or []
    silent = [item for item in items if isinstance(item, Mapping) and item.get("silentApply")]
    primary = silent[0] if silent else (items[0] if items else None)
    if not primary:
        headline = domain.get("headline") or "Steady week"
        return make_output(
            "coordinator",
            "record_only",
            list(domain.get("reason_codes") or ["coordinator_steady"]),
            {"headline": headline},
            0.6,
        )
    action = _coordinator_kind_to_action(str(primary.get("kind") or ""))
    reason_codes = list(domain.get("reason_codes") or []) + [str(primary.get("kind") or "")]
    return make_output(
        "coordinator",
        action,
        reason_codes,
        {
            "headline": domain.get("headline"),
            "domain": primary.get("domain"),
            "kind": primary.get("kind"),
            "message": primary.get("message"),
            "itemCount": len(items),
        },
    )


_EVALUATORS = {
    "strength": evaluate_strength,
    "conditioning": evaluate_conditioning,
    "nutrition": evaluate_nutrition,
    "recovery": evaluate_recovery,
    "coordinator": evaluate_coordinator,
}


def evaluate_domain(system: str, snapshot: Mapping[str, Any]) -> dict[str, Any]:
    if system not in _EVALUATORS:
        raise ValueError(f"unknown system: {system}")
    return _EVALUATORS[system](snapshot)


def run_all(snapshot: Mapping[str, Any]) -> dict[str, dict[str, Any]]:
    return {name: evaluate_domain(name, snapshot) for name in DOMAINS}
