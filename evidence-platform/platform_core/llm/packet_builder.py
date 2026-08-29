"""Builds the objects the lead-fallback gateway sends: CompleteDecisionPacket
and LLMDecisionRequest. Every function here either returns something already
validated against contracts.py, or raises - never a partially-built object.
"""

from __future__ import annotations

from typing import Any, Mapping, Sequence

from ..receipt_replay import sha256_json
from . import contracts

DECISION_PACKET_TRIGGER = "no_deterministic_answer"


def build_complete_decision_packet(
    *,
    packet_id: str,
    decision_id: str,
    athlete_scope_id: str,
    created_at: str,
    domain_outputs: Mapping[str, Any],
    whole_athlete_state: Mapping[str, Any],
    current_plan: Mapping[str, Any],
    privacy_projection: Mapping[str, Any],
    policy_refs: Sequence[Mapping[str, Any]],
    prior_plan_refs: Sequence[Mapping[str, Any]] = (),
    goal_priorities: Sequence[Mapping[str, Any]] = (),
    schedule_context: Mapping[str, Any] | None = None,
    candidate_ledger: Sequence[Mapping[str, Any]] = (),
    evidence_summaries: Sequence[Mapping[str, Any]] = (),
    relevant_history_event_ids: Sequence[str] = (),
    recent_outcome_ids: Sequence[str] = (),
    data_cutoff_at: str | None = None,
) -> dict[str, Any]:
    """Build and validate one CompleteDecisionPacket.

    trigger is always "no_deterministic_answer" - this builder exists only
    for Phase 2's one integration point (BIG MAC's gate could not resolve
    deterministically). A packet builder for other triggers
    (scheduled_review, post_session, ...) is a different, later need.
    """
    schedule_context = dict(schedule_context) if schedule_context else {
        "timezone": "UTC", "available_windows": [], "equipment_ids": [], "location_ids": [],
    }
    body = {
        "kind": "complete_decision_packet",
        "packet_id": packet_id,
        "decision_id": decision_id,
        "athlete_scope_id": athlete_scope_id,
        "created_at": created_at,
        "trigger": DECISION_PACKET_TRIGGER,
        "all_information_declaration": "all_decision_relevant_structured_information",
        "domain_outputs": dict(domain_outputs),
        "whole_athlete_state": dict(whole_athlete_state),
        "current_plan": dict(current_plan),
        "prior_plan_refs": [dict(p) for p in prior_plan_refs],
        "goal_priorities": [dict(g) for g in goal_priorities],
        "schedule_context": schedule_context,
        "candidate_ledger": [dict(c) for c in candidate_ledger],
        "evidence_summaries": [dict(e) for e in evidence_summaries],
        "policy_refs": [dict(p) for p in policy_refs],
        "privacy_projection": dict(privacy_projection),
        "relevant_history_event_ids": list(relevant_history_event_ids),
        "recent_outcome_ids": list(recent_outcome_ids),
        "data_cutoff_at": data_cutoff_at,
    }
    packet = {**body, "packet_hash": sha256_json(body)}
    return contracts.validate_complete_decision_packet(packet)


def build_llm_decision_request(
    *,
    request_id: str,
    lead_provider: str,
    routing_policy_id: str,
    routing_policy_version: str,
    decision_packet: Mapping[str, Any],
    fallback_action_envelope: Mapping[str, Any],
    requested_at: str,
    backup_provider: str | None = None,
) -> dict[str, Any]:
    """Build and validate one LLMDecisionRequest for the lead_fallback mode.

    Phase 2 only ever builds lead_fallback requests (advisory mode - asking
    an LLM to nominate alongside an already-successful deterministic answer
    - is not part of this pass; BIG MAC only calls out when it truly could
    not decide).
    """
    body = {
        "kind": "llm_decision_request",
        "request_id": request_id,
        "mode": "lead_fallback",
        "trigger_code": "NO_DETERMINISTIC_ANSWER",
        "lead_provider": lead_provider,
        "backup_provider": backup_provider,
        "routing_policy_id": routing_policy_id,
        "routing_policy_version": routing_policy_version,
        "decision_packet": dict(decision_packet),
        "fallback_action_envelope": dict(fallback_action_envelope),
        "requested_at": requested_at,
    }
    request = {**body, "request_hash": sha256_json(body)}
    return contracts.validate_llm_decision_request(request)
