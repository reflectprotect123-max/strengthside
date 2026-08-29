"""Maps a minimal, LLM-authored decision into a fully schema-compliant
LLMDecisionResponse.

The LLM is never asked to hand-author the full nested ActionCandidate
envelope (provenance, uncertainty objects, kind constants, ...) - that
would mean trusting a small free model to get 15 structural fields right,
and would blur the line the Constitution draws: the LLM supplies semantic
content, code supplies and validates the structural envelope
(Constitution section 12: the LLM "can never edit/overwrite anything...
can't override... the envelope").

Expected minimal JSON from the model (see PROMPT_INSTRUCTIONS):
    {"action_type": "...", "target_domain": "...", "target_type": "...",
     "target_id": "...", "metric_key": "..." (optional), "operation": "..."
     (optional), "value": ... (optional), "unit": "..." (optional),
     "rationale": "...", "confidence": "high|medium|low|unknown"}
"""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from typing import Any, Mapping

from ..receipt_replay import ReceiptValidationError, sha256_json
from . import contracts

PROMPT_INSTRUCTIONS = """Respond with strict JSON only, no prose outside the JSON, in this exact shape:
{"action_type": one of keep|hold_progression|bounded_increase|bounded_decrease|change_volume|change_intensity|change_duration|change_density|change_timing|substitute|reschedule|record_missing_information|record_context_only|abstain,
 "target_domain": one of strength|conditioning|nutrition|recovery|coordinator,
 "target_type": one of exercise|strength_session|conditioning_session|nutrition_target|meal_fuel_target|calendar_slot|plan|context_record,
 "target_id": "<an id from the packet you were given>",
 "metric_key": "<optional, only if action_type changes a metric>",
 "operation": "<optional, one of set|increase_by|decrease_by|multiply_by|move_to|replace_with|no_change>",
 "value": <optional number>,
 "unit": "<optional unit string>",
 "rationale": "<short reason, one or two sentences>",
 "confidence": one of high|medium|low|unknown}
You have no write authority. This will be validated and bounded by a fixed envelope before anything happens."""


class ResponseMappingError(RuntimeError):
    """The LLM's raw output could not be mapped to a valid LLMDecisionResponse.

    Callers treat this exactly like a provider failure: abstain, plan
    unchanged - never invent a fallback decision from unparseable output.
    """


def _sanitize_model_id(raw: str) -> str:
    """Map a real-world model id (e.g. OpenRouter's "google/gemma-4-31b-it:free")
    onto the shared contract's Identifier shape: ^[A-Za-z0-9][A-Za-z0-9._:-]*$,
    length 3-128. "/" is not a valid Identifier character - replaced with "."
    rather than dropped, so the original structure stays legible.

    Different raw ids can sanitize to the same text (e.g. "a/b" and "a.b"
    both become "a.b") - a short hash of the ORIGINAL raw string is
    appended so two different real model ids never collide onto one
    contract identifier, which would otherwise blur receipt auditability.
    """
    sanitized = re.sub(r"[^A-Za-z0-9._:-]", ".", raw).lstrip("._:-") or "model"
    suffix = "-" + sha256_json(raw)[:8]
    sanitized = sanitized[: 128 - len(suffix)] + suffix
    if len(sanitized) < 3:
        sanitized = (sanitized + "-unknown-model")[:128]
    return sanitized


def _extract_json(content: str) -> dict[str, Any]:
    match = re.search(r"\{.*\}", content, re.DOTALL)
    if not match:
        raise ResponseMappingError("no JSON object found in model output")
    try:
        parsed = json.loads(match.group(0))
    except json.JSONDecodeError as exc:
        raise ResponseMappingError(f"model output is not valid JSON: {exc}") from exc
    if not isinstance(parsed, dict):
        raise ResponseMappingError("model output JSON is not an object")
    return parsed


def build_llm_decision_response(
    *,
    raw_content: str,
    request: Mapping[str, Any],
    provider: str,
    model_id: str,
    model_version: str,
) -> dict[str, Any]:
    """Map raw {"content": ...} text from an adapter into a validated LLMDecisionResponse.

    Raises ResponseMappingError for anything unparseable or missing a
    required minimal field - never silently invents a value. Raises
    ReceiptValidationError if the fully-assembled response still fails the
    shared contract (should not happen if this function is correct, but
    the caller must not swallow it either way).
    """
    minimal = _extract_json(raw_content)

    action_type = minimal.get("action_type")
    if action_type not in contracts.ACTION_TYPES:
        raise ResponseMappingError(f"invalid or missing action_type: {action_type!r}")
    for required_field in ("target_domain", "target_type", "target_id"):
        if not minimal.get(required_field):
            raise ResponseMappingError(f"missing required field: {required_field}")

    envelope = request["fallback_action_envelope"]
    envelope_id = envelope["envelope_id"]
    decision_id = request["decision_packet"]["decision_id"]
    responded_at = datetime.now(timezone.utc).isoformat()

    changes = []
    if minimal.get("metric_key") and minimal.get("operation"):
        changes.append({
            "metric_key": minimal["metric_key"],
            "operation": minimal["operation"],
            "value": minimal.get("value", 0),
            "unit": minimal.get("unit", "unit"),
        })

    confidence = minimal.get("confidence", "unknown")
    if confidence not in {"high", "medium", "low", "unknown"}:
        confidence = "unknown"
    uncertainty = {"representation": "categorical", "category": confidence}

    content_hash = sha256_json(minimal)
    candidate_id = "CAND-LLM-" + content_hash[:16].upper()

    candidate = {
        "kind": "action_candidate",
        "candidate_id": candidate_id,
        "source": provider,
        "authority_mode": "lead_fallback",
        "action_type": action_type,
        "target": {
            "domain": minimal["target_domain"],
            "target_type": minimal["target_type"],
            "target_id": minimal["target_id"],
        },
        "changes": changes,
        "preconditions": [],
        "constraints_acknowledged": [],
        "expected_effects": [],
        "resource_demands": [],
        # Deliberately empty: the minimal JSON this maps from (see
        # PROMPT_INSTRUCTIONS) never asks the model for support/interference
        # tags - populating them would mean asking the model to reason about
        # its interaction with OTHER candidates, which is arbitration's job
        # (Phase 5), not a single lead-fallback response's. Concretely, this
        # means envelope.py's forbidden_combinations check can never fire
        # against a real lead-fallback candidate today - it is exercised
        # only by tests that build a candidate with tags directly
        # (tests/test_llm_gateway.py::EnvelopeEnforcementTests).
        "support_tags": [],
        "interference_tags": [],
        "uncertainty": uncertainty,
        "provenance": [{
            "provenance_id": "PROV-LLM-" + content_hash[:16].upper(),
            "record_type": "llm_output",
            "record_hash": content_hash,
        }],
        "expires_at": None,
        "fallback_envelope_id": envelope_id,
    }

    rationale = str(minimal.get("rationale") or "no rationale provided")[:2000]
    response = {
        "kind": "llm_decision_response",
        "response_id": "RESP-LLM-" + content_hash[:16].upper(),
        "request_id": request["request_id"],
        "provider": provider,
        "model_id": _sanitize_model_id(model_id),
        "model_version": model_version,
        "mode": "lead_fallback",
        "write_authority": "none",
        "silent_user_experience": True,
        "proposed_decision": candidate,
        "decision_basis_codes": ["LLM_LEAD_FALLBACK_PROPOSED"],
        "rationale_summary": rationale,
        "uncertainty": uncertainty,
        "alternatives": [],
        "responded_at": responded_at,
    }
    response = {**response, "response_hash": sha256_json(response)}
    return contracts.validate_llm_decision_response(response)
