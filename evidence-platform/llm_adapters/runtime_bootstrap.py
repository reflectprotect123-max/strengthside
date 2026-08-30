"""Build lead-fallback kwargs for production decide() calls.

Lives outside platform_core so adapter imports stay governance-clean.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import Any, Mapping

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from platform_core.llm.contracts import ACTION_TYPES
from platform_core.llm.router import RoutingPolicy
from platform_core.receipt_replay import sha256_json
from platform_core.whole_athlete_state import build_whole_athlete_state
from llm_adapters.gemini_cloud import CloudGeminiProvider
from llm_adapters.gemma_local import LocalGemmaProvider

DEFAULT_RUNTIME_ROOT = ROOT / "runtime"


def _plan_ref(plan_id: str = "PLAN-ACTIVE") -> dict[str, Any]:
    return {
        "plan_id": plan_id,
        "plan_version": "1.0",
        "plan_hash": sha256_json({"plan": plan_id}),
    }


def _policy_refs() -> list[dict[str, Any]]:
    body = {"policy_id": "POLICY-SAFETY-BASE", "version": "1.0"}
    return [{**body, "policy_hash": sha256_json(body)}]


def _privacy_projection(*, provider_scope: str, consent_record_id: str | None) -> dict[str, Any]:
    body = {
        "projection_id": "PROJECTION-RUNTIME-1",
        "provider_scope": provider_scope,
        "identifiable_data_allowed": provider_scope != "no_llm",
        "sensitive_data_allowed": False,
        "excluded_field_paths": [],
        "consent_record_id": consent_record_id,
    }
    return {**body, "projection_hash": sha256_json(body)}


def load_fallback_envelope(runtime_root: Path | str | None = None) -> dict[str, Any]:
    root = Path(runtime_root or DEFAULT_RUNTIME_ROOT)
    path = root / "fallback-envelope-default.json"
    if path.is_file():
        body = json.loads(path.read_text(encoding="utf-8"))
    else:
        body = {
            "envelope_id": "ENVELOPE-MULTI-DOMAIN-1",
            "version": "1.0",
            "allowed_action_types": sorted(ACTION_TYPES),
            "allowed_target_types": [
                "exercise",
                "strength_session",
                "conditioning_session",
                "nutrition_target",
                "meal_fuel_target",
                "calendar_slot",
                "plan",
                "context_record",
            ],
            "metric_bounds": [
                {"metric_key": "load_kg", "unit": "kg", "minimum": -10, "maximum": 10},
            ],
            "forbidden_combinations": [],
            "required_validator_ids": ["VALIDATOR-BASELINE"],
            "rollback_policy_id": "ROLLBACK-DEFAULT",
        }
    if "envelope_hash" not in body:
        body = {**body, "envelope_hash": sha256_json(body)}
    return body


def _build_providers() -> tuple[Any | None, Any | None, RoutingPolicy | None]:
    api_key = os.environ.get("OPENROUTER_API_KEY", "").strip()
    gemini_model = os.environ.get("BIG_MAC_GEMINI_MODEL", "google/gemini-2.5-flash-lite")
    gemma_endpoint = os.environ.get("BIG_MAC_GEMMA_ENDPOINT", "").strip()
    gemma_model = os.environ.get("BIG_MAC_GEMMA_MODEL", "gemma3")

    if api_key:
        lead = CloudGeminiProvider(model=gemini_model, api_key=api_key)
        backup = None
        if gemma_endpoint:
            try:
                backup = LocalGemmaProvider(endpoint=gemma_endpoint, model=gemma_model)
            except ValueError:
                backup = None
        policy = RoutingPolicy(
            policy_id="ROUTING-RUNTIME-CLOUD",
            version="1.0",
            lead_provider="gemini",
            backup_provider="gemma" if backup else None,
        )
        return lead, backup, policy

    if gemma_endpoint:
        try:
            lead = LocalGemmaProvider(endpoint=gemma_endpoint, model=gemma_model)
        except ValueError:
            return None, None, None
        policy = RoutingPolicy(
            policy_id="ROUTING-RUNTIME-LOCAL",
            version="1.0",
            lead_provider="gemma",
        )
        return lead, None, policy

    return None, None, None


def build_lead_fallback_kwargs(
    snapshot: Mapping[str, Any],
    domain_outputs: Mapping[str, Any],
    *,
    runtime_root: Path | str | None = None,
) -> dict[str, Any] | None:
    lead, backup, routing_policy = _build_providers()
    if lead is None or routing_policy is None:
        return None

    athlete_id = str(snapshot.get("athlete_scope_id") or snapshot.get("athlete_id") or "UNKNOWN")
    observed_at = str(snapshot.get("as_of") or snapshot.get("occurred_at") or "")
    snapshot_id = "WAS-" + sha256_json({"athlete": athlete_id, "at": observed_at})[:16].upper()

    if routing_policy.lead_provider == "gemini":
        consent_id = os.environ.get("BIG_MAC_CLOUD_CONSENT_ID", "AUTO-CONSENT-PRODUCT")
        privacy = _privacy_projection(provider_scope="cloud_gemini", consent_record_id=consent_id)
    else:
        privacy = _privacy_projection(provider_scope="local_gemma", consent_record_id=None)

    return {
        "fallback_envelope": load_fallback_envelope(runtime_root),
        "routing_policy": routing_policy,
        "lead": lead,
        "backup": backup,
        "whole_athlete_state": build_whole_athlete_state(
            domain_outputs,
            snapshot_id=snapshot_id,
            observed_at=observed_at,
            athlete_scope_id=athlete_id,
        ),
        "current_plan": _plan_ref(),
        "privacy_projection": privacy,
        "policy_refs": _policy_refs(),
    }


def lead_fallback_available() -> bool:
    lead, _, policy = _build_providers()
    return lead is not None and policy is not None
