"""Ties together packet building, prompt rendering, provider calls,
response mapping, and envelope validation for BIG MAC's bounded
lead-fallback path (Phase 2). This is the only place all of it meets.

The dict this returns on success is shaped to plug directly into
receipt_replay.build_receipt/commit_receipt's llm_contribution parameter
and replay_bundle's frozen_llm_context/frozen_llm_response fields - that
hash-binding plumbing already exists and is already tested (defect 4).
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Mapping, Sequence

from ..receipt_replay import ReceiptValidationError, sha256_json
from . import packet_builder
from .envelope import validate_candidate_against_envelope
from .gateway import LLMProvider, call_with_fallback
from .response_builder import PROMPT_INSTRUCTIONS, ResponseMappingError, build_llm_decision_response
from .router import RoutingPolicy


def _render_prompt(packet: Mapping[str, Any]) -> str:
    import json

    return PROMPT_INSTRUCTIONS + "\n\nDecision context (JSON):\n" + json.dumps(packet, sort_keys=True)


def attempt_lead_fallback(
    *,
    decision_id: str,
    athlete_scope_id: str,
    domain_outputs: Mapping[str, Any],
    whole_athlete_state: Mapping[str, Any],
    current_plan: Mapping[str, Any],
    privacy_projection: Mapping[str, Any],
    policy_refs: Sequence[Mapping[str, Any]],
    fallback_envelope: Mapping[str, Any],
    routing_policy: RoutingPolicy,
    lead: LLMProvider,
    backup: LLMProvider | None = None,
    **packet_kwargs: Any,
) -> dict[str, Any]:
    """Attempt one bounded lead-fallback round.

    On success returns {"ok": True, "llm_contribution": ..., "frozen_llm_context": ...,
    "frozen_llm_response": ..., "action_candidate": ...}. On any failure returns
    {"ok": False, "reason_codes": [...]}. The caller (decision.py) treats "ok": False
    exactly like "no model, abstain" - plan unchanged either way, per
    Constitution section 13 ("if fallback fails, plan unchanged").
    """
    now = datetime.now(timezone.utc).isoformat()
    packet_id = "PACKET-" + sha256_json({"decision_id": decision_id, "at": now})[:16].upper()
    packet = packet_builder.build_complete_decision_packet(
        packet_id=packet_id,
        decision_id=decision_id,
        athlete_scope_id=athlete_scope_id,
        created_at=now,
        domain_outputs=domain_outputs,
        whole_athlete_state=whole_athlete_state,
        current_plan=current_plan,
        privacy_projection=privacy_projection,
        policy_refs=policy_refs,
        **packet_kwargs,
    )
    request_id = "REQ-" + packet["packet_hash"][:16].upper()
    request = packet_builder.build_llm_decision_request(
        request_id=request_id,
        lead_provider=routing_policy.lead_provider,
        routing_policy_id=routing_policy.policy_id,
        routing_policy_version=routing_policy.version,
        decision_packet=packet,
        fallback_action_envelope=fallback_envelope,
        requested_at=now,
        backup_provider=routing_policy.backup_provider,
    )

    rendered_prompt = _render_prompt(packet)
    adapter_payload = {"prompt": rendered_prompt, "decision_packet": packet}

    raw_response, provider_failures = call_with_fallback(lead=lead, backup=backup, request=adapter_payload)
    if raw_response is None:
        return {"ok": False, "reason_codes": ["LEAD_FALLBACK_FAILED", *provider_failures]}

    if not isinstance(raw_response, Mapping) or "content" not in raw_response:
        return {"ok": False, "reason_codes": ["LEAD_FALLBACK_RESPONSE_MALFORMED"]}

    answered_provider = routing_policy.lead_provider if not provider_failures else routing_policy.backup_provider
    model_id = raw_response.get("model_id", f"{answered_provider}-unknown-model")
    model_version = raw_response.get("model_version", "unspecified")

    try:
        response = build_llm_decision_response(
            raw_content=raw_response["content"],
            request=request,
            provider=answered_provider,
            model_id=model_id,
            model_version=model_version,
        )
    except (ResponseMappingError, ReceiptValidationError) as exc:
        # Exception TYPE only, never str(exc): validation messages here can
        # echo raw fragments of the model's own output, and this code lands
        # in a receipted, auditable trace - not the place for unreviewed
        # free text (same reasoning as gateway.call_with_fallback).
        return {"ok": False, "reason_codes": [f"LEAD_FALLBACK_RESPONSE_INVALID:{type(exc).__name__}"]}

    violations = validate_candidate_against_envelope(response["proposed_decision"], fallback_envelope)
    if violations:
        return {"ok": False, "reason_codes": ["LEAD_FALLBACK_ENVELOPE_VIOLATION", *violations]}

    # Each of these objects carries its own internal self-identifying hash
    # field (packet_hash, request_hash, response_hash, envelope_hash) - but
    # that field was computed BEFORE it was added to the object, so it is
    # not the hash of the object as it is actually frozen (self-hash field
    # included). The binding hash a receipt checks against the frozen bytes
    # must be computed fresh over the exact object being frozen, not reused
    # from that internal field.
    llm_contribution = {
        "provider": response["provider"],
        "model_id": response["model_id"],
        "model_version": response["model_version"],
        "mode": "lead_fallback",
        "write_authority": "none",
        "silent_user_experience": True,
        "complete_decision_packet_hash": sha256_json(packet),
        "prompt_hash": sha256_json(rendered_prompt),
        "request_hash": sha256_json(request),
        "response_hash": sha256_json(response),
        "fallback_envelope_hash": sha256_json(fallback_envelope),
    }
    return {
        "ok": True,
        "llm_contribution": llm_contribution,
        "frozen_llm_context": {
            "complete_decision_packet": packet,
            "prompt": rendered_prompt,
            "request": request,
            "fallback_envelope": fallback_envelope,
        },
        "frozen_llm_response": response,
        "action_candidate": response["proposed_decision"],
    }
