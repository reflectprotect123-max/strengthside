"""Hand-validators for the LLM-gateway objects in
contracts/THE-HYBRID-SHARED-DATA-CONTRACT-v1.schema.json:
CompleteDecisionPacket, FallbackActionEnvelope, LLMDecisionRequest,
LLMDecisionResponse, ActionCandidate, and their nested shapes.

No jsonschema dependency here - platform_core stays dependency-free by
design (pyproject.toml: dependencies = []). Hand validation mirrors the
schema exactly, the same pattern platform_core/receipt_replay.py already
uses for the decision-receipt schema.

Known, deliberate simplification: this contract's own DomainOutputSet and
WholeAthleteState definitions are richer than what Phase 1 actually built
(platform_core/engines/common.py's engine-output shape and
platform_core/whole_athlete_state.py's schemas/athlete-state.schema.json
shape are both real, tested, and DIFFERENT from this contract's nested
defs for the same names). Reconciling those is its own follow-up, not
silently done here - validate_complete_decision_packet only requires
domain_outputs/whole_athlete_state to be present, non-empty objects,
matching what Phase 1 actually produces.
"""

from __future__ import annotations

import re
from datetime import datetime
from typing import Any, Mapping

from ..receipt_replay import ReceiptValidationError, _is_sha256, sha256_json

__all__ = [
    "ReceiptValidationError",
    "validate_uncertainty",
    "validate_provenance_ref",
    "validate_action_target",
    "validate_metric_change",
    "validate_expected_effect",
    "validate_resource_demand",
    "validate_action_candidate",
    "validate_fallback_metric_bound",
    "validate_fallback_action_envelope",
    "validate_privacy_projection",
    "validate_goal_priority",
    "validate_schedule_context",
    "validate_plan_ref",
    "validate_evidence_summary_ref",
    "validate_policy_ref",
    "validate_complete_decision_packet",
    "validate_llm_decision_request",
    "validate_llm_decision_response",
]

_IDENTIFIER_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]*$")
_VERSION_PATTERN = re.compile(r"^[0-9]+\.[0-9]+(?:\.[0-9]+)?(?:[-+][A-Za-z0-9.-]+)?$")

ACTION_TYPES = {
    "keep", "hold_progression", "bounded_increase", "bounded_decrease",
    "change_volume", "change_intensity", "change_duration", "change_density",
    "change_timing", "substitute", "reschedule", "record_missing_information",
    "record_context_only", "abstain",
}
TARGET_TYPES = {
    "exercise", "strength_session", "conditioning_session", "nutrition_target",
    "meal_fuel_target", "calendar_slot", "plan", "context_record",
}
PRODUCER_NAMES = {
    "strength", "conditioning", "nutrition", "recovery", "coordinator", "big_mac",
    "gemini", "gemma", "adapter", "human",
}
SYSTEM_NAMES = {"strength", "conditioning", "nutrition", "recovery", "coordinator"}
AUTHORITY_MODES = {"deterministic", "advisory", "lead_fallback", "human_authored"}
UNCERTAINTY_REPRESENTATIONS = {
    "none_declared", "point_with_error", "interval", "distribution", "categorical", "unknown",
}
UNCERTAINTY_SOURCES = {
    "measurement", "missingness", "state", "parameter", "model", "applicability",
    "distribution_shift", "decision_ambiguity",
}
PROVENANCE_RECORD_TYPES = {
    "source_event", "transformation", "rule", "model", "parameter_set", "policy",
    "evidence_summary", "human_input", "llm_input", "llm_output",
}
METRIC_OPERATIONS = {"set", "increase_by", "decrease_by", "multiply_by", "move_to", "replace_with", "no_change"}
EFFECT_DIRECTIONS = {"increase", "decrease", "maintain", "unknown"}
TIME_HORIZONS = {"set", "session", "day", "week", "phase", "long_term"}
RESOURCE_DIRECTIONS = {"consumes", "preserves", "restores", "unknown"}
MAGNITUDE_CLASSES = {"none", "low", "moderate", "high", "unknown"}
PACKET_TRIGGERS = {
    "scheduled_review", "domain_event", "post_session", "plan_change",
    "manual_recompute", "no_deterministic_answer",
}
PROVIDERS = {"gemini", "gemma"}


def _id(value: Any, field: str) -> str:
    if not isinstance(value, str) or not (3 <= len(value) <= 128) or not _IDENTIFIER_PATTERN.match(value):
        raise ReceiptValidationError(f"{field} is not a valid contract Identifier")
    return value


def _version(value: Any, field: str) -> str:
    if not isinstance(value, str) or not (1 <= len(value) <= 64) or not _VERSION_PATTERN.match(value):
        raise ReceiptValidationError(f"{field} is not a valid contract Version")
    return value


def _sha(value: Any, field: str) -> str:
    if not _is_sha256(value):
        raise ReceiptValidationError(f"{field} must be a SHA-256 hex string")
    return value


def _timestamp(value: Any, field: str) -> str:
    if not isinstance(value, str):
        raise ReceiptValidationError(f"{field} must be a date-time string")
    try:
        datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ReceiptValidationError(f"{field} must be a valid ISO-8601 date-time") from exc
    return value


def _enum(value: Any, allowed: set, field: str) -> Any:
    if value not in allowed:
        raise ReceiptValidationError(f"{field} must be one of {sorted(allowed)}, got {value!r}")
    return value


def _obj(value: Any, field: str) -> Mapping[str, Any]:
    if not isinstance(value, Mapping):
        raise ReceiptValidationError(f"{field} must be an object")
    return value


def _extra_keys(value: Mapping[str, Any], allowed: set, field: str) -> None:
    extra = set(value) - allowed
    if extra:
        raise ReceiptValidationError(f"{field} has unexpected fields: {sorted(extra)}")


def _unique_id_list(value: Any, field: str) -> list:
    if not isinstance(value, list) or len(set(value)) != len(value):
        raise ReceiptValidationError(f"{field} must be a list of unique identifiers")
    for item in value:
        _id(item, f"{field}[]")
    return list(value)


def validate_uncertainty(value: Any, field: str = "uncertainty") -> dict:
    value = _obj(value, field)
    allowed = {"representation", "standard_error", "lower", "upper", "level", "distribution_name", "category", "sources"}
    _extra_keys(value, allowed, field)
    _enum(value.get("representation"), UNCERTAINTY_REPRESENTATIONS, f"{field}.representation")
    if "sources" in value:
        sources = value["sources"]
        if not isinstance(sources, list) or len(set(sources)) != len(sources) or not all(s in UNCERTAINTY_SOURCES for s in sources):
            raise ReceiptValidationError(f"{field}.sources invalid")
    return dict(value)


def validate_provenance_ref(value: Any, field: str = "provenance") -> dict:
    value = _obj(value, field)
    allowed = {"provenance_id", "record_type", "record_hash", "version"}
    _extra_keys(value, allowed, field)
    _id(value.get("provenance_id"), f"{field}.provenance_id")
    _enum(value.get("record_type"), PROVENANCE_RECORD_TYPES, f"{field}.record_type")
    _sha(value.get("record_hash"), f"{field}.record_hash")
    if value.get("version") is not None:
        _version(value["version"], f"{field}.version")
    return dict(value)


def validate_action_target(value: Any, field: str = "target") -> dict:
    value = _obj(value, field)
    allowed = {"domain", "target_type", "target_id", "effective_at"}
    _extra_keys(value, allowed, field)
    _enum(value.get("domain"), SYSTEM_NAMES, f"{field}.domain")
    _enum(value.get("target_type"), TARGET_TYPES, f"{field}.target_type")
    _id(value.get("target_id"), f"{field}.target_id")
    if value.get("effective_at") is not None:
        _timestamp(value["effective_at"], f"{field}.effective_at")
    return dict(value)


def _validate_scalar_or_range(value: Any, field: str) -> Any:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value
    if isinstance(value, str):
        if len(value) > 512:
            raise ReceiptValidationError(f"{field} string too long")
        return value
    if isinstance(value, Mapping):
        _extra_keys(value, {"lower", "upper"}, field)
        if {"lower", "upper"} - set(value):
            raise ReceiptValidationError(f"{field} range requires lower and upper")
        for k in ("lower", "upper"):
            if not isinstance(value[k], (int, float)) or isinstance(value[k], bool):
                raise ReceiptValidationError(f"{field}.{k} must be a number")
        return dict(value)
    raise ReceiptValidationError(f"{field} is not a valid ScalarOrRange")


def validate_metric_change(value: Any, field: str = "changes[]") -> dict:
    value = _obj(value, field)
    allowed = {"metric_key", "operation", "value", "unit", "bound_id"}
    _extra_keys(value, allowed, field)
    _id(value.get("metric_key"), f"{field}.metric_key")
    _enum(value.get("operation"), METRIC_OPERATIONS, f"{field}.operation")
    if "value" in value:
        _validate_scalar_or_range(value["value"], f"{field}.value")
    unit = value.get("unit")
    if not isinstance(unit, str) or not (1 <= len(unit) <= 64):
        raise ReceiptValidationError(f"{field}.unit invalid")
    if value.get("bound_id") is not None:
        _id(value["bound_id"], f"{field}.bound_id")
    return dict(value)


def validate_expected_effect(value: Any, field: str = "expected_effects[]") -> dict:
    value = _obj(value, field)
    allowed = {"effect_key", "direction", "time_horizon", "uncertainty"}
    _extra_keys(value, allowed, field)
    _id(value.get("effect_key"), f"{field}.effect_key")
    _enum(value.get("direction"), EFFECT_DIRECTIONS, f"{field}.direction")
    _enum(value.get("time_horizon"), TIME_HORIZONS, f"{field}.time_horizon")
    validate_uncertainty(value.get("uncertainty"), f"{field}.uncertainty")
    return dict(value)


def validate_resource_demand(value: Any, field: str = "resource_demands[]") -> dict:
    value = _obj(value, field)
    allowed = {"resource_key", "direction", "magnitude_class"}
    _extra_keys(value, allowed, field)
    _id(value.get("resource_key"), f"{field}.resource_key")
    _enum(value.get("direction"), RESOURCE_DIRECTIONS, f"{field}.direction")
    _enum(value.get("magnitude_class"), MAGNITUDE_CLASSES, f"{field}.magnitude_class")
    return dict(value)


def validate_action_candidate(value: Any, field: str = "action_candidate") -> dict:
    value = _obj(value, field)
    allowed = {
        "kind", "candidate_id", "source", "authority_mode", "action_type", "target", "changes",
        "preconditions", "constraints_acknowledged", "expected_effects", "resource_demands",
        "support_tags", "interference_tags", "rule_ids", "model_version_ids", "parameter_set_ids",
        "fallback_envelope_id", "decision_basis_codes", "uncertainty", "provenance", "expires_at",
    }
    _extra_keys(value, allowed, field)
    if value.get("kind") != "action_candidate":
        raise ReceiptValidationError(f"{field}.kind must be 'action_candidate'")
    _id(value.get("candidate_id"), f"{field}.candidate_id")
    _enum(value.get("source"), PRODUCER_NAMES, f"{field}.source")
    authority_mode = _enum(value.get("authority_mode"), AUTHORITY_MODES, f"{field}.authority_mode")
    _enum(value.get("action_type"), ACTION_TYPES, f"{field}.action_type")
    validate_action_target(value.get("target"), f"{field}.target")
    for item in value.get("changes", []):
        validate_metric_change(item, f"{field}.changes[]")
    for key in (
        "preconditions", "constraints_acknowledged", "support_tags", "interference_tags",
        "rule_ids", "model_version_ids", "parameter_set_ids", "decision_basis_codes",
    ):
        if key in value:
            _unique_id_list(value[key], f"{field}.{key}")
    for item in value.get("expected_effects", []):
        validate_expected_effect(item, f"{field}.expected_effects[]")
    for item in value.get("resource_demands", []):
        validate_resource_demand(item, f"{field}.resource_demands[]")
    validate_uncertainty(value.get("uncertainty"), f"{field}.uncertainty")
    provenance = value.get("provenance")
    if not isinstance(provenance, list) or not provenance:
        raise ReceiptValidationError(f"{field}.provenance must be a non-empty list")
    for item in provenance:
        validate_provenance_ref(item, f"{field}.provenance[]")
    if value.get("expires_at") is not None:
        _timestamp(value["expires_at"], f"{field}.expires_at")
    fallback_envelope_id = value.get("fallback_envelope_id")
    if fallback_envelope_id is not None:
        _id(fallback_envelope_id, f"{field}.fallback_envelope_id")
    if authority_mode == "lead_fallback":
        if fallback_envelope_id is None:
            raise ReceiptValidationError(f"{field}: lead_fallback requires fallback_envelope_id")
        if value.get("source") not in PROVIDERS:
            raise ReceiptValidationError(f"{field}: lead_fallback source must be gemini or gemma")
    return dict(value)


def validate_fallback_metric_bound(value: Any, field: str = "metric_bounds[]") -> dict:
    value = _obj(value, field)
    _extra_keys(value, {"metric_key", "unit", "minimum", "maximum"}, field)
    _id(value.get("metric_key"), f"{field}.metric_key")
    unit = value.get("unit")
    if not isinstance(unit, str) or not (1 <= len(unit) <= 64):
        raise ReceiptValidationError(f"{field}.unit invalid")
    for k in ("minimum", "maximum"):
        if not isinstance(value.get(k), (int, float)) or isinstance(value.get(k), bool):
            raise ReceiptValidationError(f"{field}.{k} must be a number")
    if value["minimum"] > value["maximum"]:
        raise ReceiptValidationError(f"{field}: minimum must be <= maximum")
    return dict(value)


def validate_fallback_action_envelope(value: Any, field: str = "fallback_action_envelope") -> dict:
    value = _obj(value, field)
    allowed = {
        "envelope_id", "version", "allowed_action_types", "allowed_target_types",
        "metric_bounds", "forbidden_combinations", "required_validator_ids",
        "rollback_policy_id", "envelope_hash",
    }
    _extra_keys(value, allowed, field)
    _id(value.get("envelope_id"), f"{field}.envelope_id")
    _version(value.get("version"), f"{field}.version")

    action_types = value.get("allowed_action_types")
    if not isinstance(action_types, list) or not action_types or len(set(action_types)) != len(action_types) or not all(a in ACTION_TYPES for a in action_types):
        raise ReceiptValidationError(f"{field}.allowed_action_types invalid")
    target_types = value.get("allowed_target_types")
    if not isinstance(target_types, list) or not target_types or len(set(target_types)) != len(target_types) or not all(t in TARGET_TYPES for t in target_types):
        raise ReceiptValidationError(f"{field}.allowed_target_types invalid")

    for item in value.get("metric_bounds", []):
        validate_fallback_metric_bound(item, f"{field}.metric_bounds[]")

    for combo in value.get("forbidden_combinations", []):
        if not isinstance(combo, list) or len(combo) < 2 or len(set(combo)) != len(combo):
            raise ReceiptValidationError(f"{field}.forbidden_combinations entry invalid")
        for item in combo:
            _id(item, f"{field}.forbidden_combinations[]")

    validator_ids = value.get("required_validator_ids")
    if not isinstance(validator_ids, list) or not validator_ids or len(set(validator_ids)) != len(validator_ids):
        raise ReceiptValidationError(f"{field}.required_validator_ids invalid")
    for item in validator_ids:
        _id(item, f"{field}.required_validator_ids[]")

    _id(value.get("rollback_policy_id"), f"{field}.rollback_policy_id")
    _sha(value.get("envelope_hash"), f"{field}.envelope_hash")
    return dict(value)


def validate_privacy_projection(value: Any, field: str = "privacy_projection") -> dict:
    value = _obj(value, field)
    allowed = {
        "projection_id", "provider_scope", "identifiable_data_allowed", "sensitive_data_allowed",
        "excluded_field_paths", "consent_record_id", "projection_hash",
    }
    _extra_keys(value, allowed, field)
    _id(value.get("projection_id"), f"{field}.projection_id")
    _enum(value.get("provider_scope"), {"local_gemma", "cloud_gemini", "no_llm"}, f"{field}.provider_scope")
    for k in ("identifiable_data_allowed", "sensitive_data_allowed"):
        if not isinstance(value.get(k), bool):
            raise ReceiptValidationError(f"{field}.{k} must be boolean")
    paths = value.get("excluded_field_paths", [])
    if not isinstance(paths, list) or len(set(paths)) != len(paths) or not all(isinstance(p, str) and 1 <= len(p) <= 256 for p in paths):
        raise ReceiptValidationError(f"{field}.excluded_field_paths invalid")
    if value.get("consent_record_id") is not None:
        _id(value["consent_record_id"], f"{field}.consent_record_id")
    _sha(value.get("projection_hash"), f"{field}.projection_hash")
    return dict(value)


def validate_goal_priority(value: Any, field: str = "goal_priorities[]") -> dict:
    value = _obj(value, field)
    _extra_keys(value, {"goal_id", "rank", "locked"}, field)
    _id(value.get("goal_id"), f"{field}.goal_id")
    rank = value.get("rank")
    if not isinstance(rank, int) or isinstance(rank, bool) or rank < 1:
        raise ReceiptValidationError(f"{field}.rank must be an integer >= 1")
    if not isinstance(value.get("locked"), bool):
        raise ReceiptValidationError(f"{field}.locked must be boolean")
    return dict(value)


def validate_schedule_context(value: Any, field: str = "schedule_context") -> dict:
    value = _obj(value, field)
    _extra_keys(value, {"timezone", "available_windows", "equipment_ids", "location_ids"}, field)
    tz = value.get("timezone")
    if not isinstance(tz, str) or not (1 <= len(tz) <= 64):
        raise ReceiptValidationError(f"{field}.timezone invalid")
    for window in value.get("available_windows", []):
        window = _obj(window, f"{field}.available_windows[]")
        _extra_keys(window, {"start", "end"}, f"{field}.available_windows[]")
        _timestamp(window.get("start"), f"{field}.available_windows[].start")
        _timestamp(window.get("end"), f"{field}.available_windows[].end")
    for key in ("equipment_ids", "location_ids"):
        if key in value:
            _unique_id_list(value[key], f"{field}.{key}")
    return dict(value)


def validate_plan_ref(value: Any, field: str = "plan_ref") -> dict:
    value = _obj(value, field)
    _extra_keys(value, {"plan_id", "plan_version", "plan_hash"}, field)
    _id(value.get("plan_id"), f"{field}.plan_id")
    _version(value.get("plan_version"), f"{field}.plan_version")
    _sha(value.get("plan_hash"), f"{field}.plan_hash")
    return dict(value)


def validate_evidence_summary_ref(value: Any, field: str = "evidence_summaries[]") -> dict:
    value = _obj(value, field)
    _extra_keys(value, {"summary_id", "version", "summary_hash", "applicability_status"}, field)
    _id(value.get("summary_id"), f"{field}.summary_id")
    _version(value.get("version"), f"{field}.version")
    _sha(value.get("summary_hash"), f"{field}.summary_hash")
    _enum(value.get("applicability_status"), {"applicable", "partially_applicable", "not_applicable", "uncertain"}, f"{field}.applicability_status")
    return dict(value)


def validate_policy_ref(value: Any, field: str = "policy_refs[]") -> dict:
    value = _obj(value, field)
    _extra_keys(value, {"policy_id", "version", "policy_hash"}, field)
    _id(value.get("policy_id"), f"{field}.policy_id")
    _version(value.get("version"), f"{field}.version")
    _sha(value.get("policy_hash"), f"{field}.policy_hash")
    return dict(value)


def validate_complete_decision_packet(value: Any, field: str = "decision_packet") -> dict:
    value = _obj(value, field)
    allowed = {
        "kind", "packet_id", "decision_id", "athlete_scope_id", "created_at", "trigger",
        "all_information_declaration", "domain_outputs", "whole_athlete_state", "current_plan",
        "prior_plan_refs", "goal_priorities", "schedule_context", "candidate_ledger",
        "evidence_summaries", "policy_refs", "privacy_projection", "relevant_history_event_ids",
        "recent_outcome_ids", "data_cutoff_at", "packet_hash",
    }
    _extra_keys(value, allowed, field)
    if value.get("kind") != "complete_decision_packet":
        raise ReceiptValidationError(f"{field}.kind must be 'complete_decision_packet'")
    _id(value.get("packet_id"), f"{field}.packet_id")
    _id(value.get("decision_id"), f"{field}.decision_id")
    _id(value.get("athlete_scope_id"), f"{field}.athlete_scope_id")
    _timestamp(value.get("created_at"), f"{field}.created_at")
    _enum(value.get("trigger"), PACKET_TRIGGERS, f"{field}.trigger")
    if value.get("all_information_declaration") != "all_decision_relevant_structured_information":
        raise ReceiptValidationError(f"{field}.all_information_declaration must be the fixed constant")

    # See module docstring: domain_outputs / whole_athlete_state are checked
    # for presence only, not against this contract's own (different, not yet
    # reconciled) DomainOutputSet/WholeAthleteState defs.
    if not isinstance(value.get("domain_outputs"), Mapping) or not value["domain_outputs"]:
        raise ReceiptValidationError(f"{field}.domain_outputs must be a non-empty object")
    if not isinstance(value.get("whole_athlete_state"), Mapping) or not value["whole_athlete_state"]:
        raise ReceiptValidationError(f"{field}.whole_athlete_state must be a non-empty object")

    validate_plan_ref(value.get("current_plan"), f"{field}.current_plan")
    for item in value.get("prior_plan_refs", []):
        validate_plan_ref(item, f"{field}.prior_plan_refs[]")
    for item in value.get("goal_priorities", []):
        validate_goal_priority(item, f"{field}.goal_priorities[]")
    validate_schedule_context(value.get("schedule_context"), f"{field}.schedule_context")
    for item in value.get("candidate_ledger", []):
        validate_action_candidate(item, f"{field}.candidate_ledger[]")
    for item in value.get("evidence_summaries", []):
        validate_evidence_summary_ref(item, f"{field}.evidence_summaries[]")

    policy_refs = value.get("policy_refs")
    if not isinstance(policy_refs, list) or not policy_refs:
        raise ReceiptValidationError(f"{field}.policy_refs must be a non-empty list")
    for item in policy_refs:
        validate_policy_ref(item, f"{field}.policy_refs[]")

    validate_privacy_projection(value.get("privacy_projection"), f"{field}.privacy_projection")

    for key in ("relevant_history_event_ids", "recent_outcome_ids"):
        if key in value:
            _unique_id_list(value[key], f"{field}.{key}")

    if value.get("data_cutoff_at") is not None:
        _timestamp(value["data_cutoff_at"], f"{field}.data_cutoff_at")

    _sha(value.get("packet_hash"), f"{field}.packet_hash")
    return dict(value)


def validate_llm_decision_request(value: Any, field: str = "llm_decision_request") -> dict:
    value = _obj(value, field)
    allowed = {
        "kind", "request_id", "mode", "trigger_code", "lead_provider", "backup_provider",
        "routing_policy_id", "routing_policy_version", "decision_packet",
        "fallback_action_envelope", "requested_at", "request_hash",
    }
    _extra_keys(value, allowed, field)
    if value.get("kind") != "llm_decision_request":
        raise ReceiptValidationError(f"{field}.kind must be 'llm_decision_request'")
    _id(value.get("request_id"), f"{field}.request_id")
    mode = _enum(value.get("mode"), {"advisory", "lead_fallback"}, f"{field}.mode")
    _enum(value.get("lead_provider"), PROVIDERS, f"{field}.lead_provider")
    backup = value.get("backup_provider")
    if backup is not None and backup not in PROVIDERS:
        raise ReceiptValidationError(f"{field}.backup_provider invalid")
    _id(value.get("routing_policy_id"), f"{field}.routing_policy_id")
    _version(value.get("routing_policy_version"), f"{field}.routing_policy_version")
    packet = validate_complete_decision_packet(value.get("decision_packet"), f"{field}.decision_packet")
    validate_fallback_action_envelope(value.get("fallback_action_envelope"), f"{field}.fallback_action_envelope")
    _timestamp(value.get("requested_at"), f"{field}.requested_at")
    _sha(value.get("request_hash"), f"{field}.request_hash")
    if mode == "lead_fallback":
        if value.get("trigger_code") != "NO_DETERMINISTIC_ANSWER":
            raise ReceiptValidationError(f"{field}: lead_fallback requires trigger_code=NO_DETERMINISTIC_ANSWER")
        if packet.get("trigger") != "no_deterministic_answer":
            raise ReceiptValidationError(f"{field}: lead_fallback requires decision_packet.trigger=no_deterministic_answer")
    return dict(value)


def validate_llm_decision_response(value: Any, field: str = "llm_decision_response") -> dict:
    value = _obj(value, field)
    allowed = {
        "kind", "response_id", "request_id", "provider", "model_id", "model_version", "mode",
        "write_authority", "silent_user_experience", "proposed_decision", "decision_basis_codes",
        "rationale_summary", "uncertainty", "alternatives", "responded_at", "response_hash",
    }
    _extra_keys(value, allowed, field)
    if value.get("kind") != "llm_decision_response":
        raise ReceiptValidationError(f"{field}.kind must be 'llm_decision_response'")
    _id(value.get("response_id"), f"{field}.response_id")
    _id(value.get("request_id"), f"{field}.request_id")
    _enum(value.get("provider"), PROVIDERS, f"{field}.provider")
    _id(value.get("model_id"), f"{field}.model_id")
    model_version = value.get("model_version")
    if not isinstance(model_version, str) or not (1 <= len(model_version) <= 128):
        raise ReceiptValidationError(f"{field}.model_version invalid")
    mode = _enum(value.get("mode"), {"advisory", "lead_fallback"}, f"{field}.mode")
    if value.get("write_authority") != "none":
        raise ReceiptValidationError(f"{field}.write_authority must be 'none'")
    if value.get("silent_user_experience") is not True:
        raise ReceiptValidationError(f"{field}.silent_user_experience must be true")
    proposed = validate_action_candidate(value.get("proposed_decision"), f"{field}.proposed_decision")
    basis_codes = value.get("decision_basis_codes")
    if not isinstance(basis_codes, list) or not basis_codes:
        raise ReceiptValidationError(f"{field}.decision_basis_codes must be a non-empty list")
    _unique_id_list(basis_codes, f"{field}.decision_basis_codes")
    rationale = value.get("rationale_summary")
    if not isinstance(rationale, str) or not (1 <= len(rationale) <= 2000):
        raise ReceiptValidationError(f"{field}.rationale_summary invalid")
    validate_uncertainty(value.get("uncertainty"), f"{field}.uncertainty")
    alternatives = value.get("alternatives", [])
    if not isinstance(alternatives, list) or len(alternatives) > 10:
        raise ReceiptValidationError(f"{field}.alternatives invalid")
    for item in alternatives:
        validate_action_candidate(item, f"{field}.alternatives[]")
    _timestamp(value.get("responded_at"), f"{field}.responded_at")
    _sha(value.get("response_hash"), f"{field}.response_hash")
    if mode == "lead_fallback":
        if proposed.get("authority_mode") != "lead_fallback":
            raise ReceiptValidationError(f"{field}: lead_fallback mode requires proposed_decision.authority_mode=lead_fallback")
        if proposed.get("source") not in PROVIDERS:
            raise ReceiptValidationError(f"{field}: lead_fallback mode requires proposed_decision.source in gemini/gemma")
    return dict(value)
