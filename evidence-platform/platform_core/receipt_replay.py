"""Immutable hidden decision receipts, deterministic replay, and tamper checks.

This module records decision execution. It does not decide what an athlete should do.
"""

from __future__ import annotations

import hashlib
import json
import math
import re
import sqlite3
from collections.abc import Callable, Mapping, Sequence
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


RECEIPT_VERSION = "2.0"
CANONICALIZATION = "HYBRID-CANONICAL-JSON-v1"
ZERO_HASH = "0" * 64
DECISION_MODES = {"deterministic", "lead_fallback", "advisory", "abstention"}
LLM_PROVIDERS = {"gemini", "gemma"}


class ReceiptValidationError(ValueError):
    """Raised before an invalid receipt or replay bundle can be committed."""


def _validate_json_value(value: Any, path: str = "$") -> None:
    if value is None or isinstance(value, (str, bool, int)):
        return
    if isinstance(value, float):
        if not math.isfinite(value):
            raise ReceiptValidationError(f"non-finite number at {path}")
        return
    if isinstance(value, list):
        for index, item in enumerate(value):
            _validate_json_value(item, f"{path}[{index}]")
        return
    if isinstance(value, dict):
        for key, item in value.items():
            if not isinstance(key, str):
                raise ReceiptValidationError(f"non-string object key at {path}")
            _validate_json_value(item, f"{path}.{key}")
        return
    raise ReceiptValidationError(f"non-JSON value at {path}: {type(value).__name__}")


def canonical_json(value: Any) -> str:
    """Return versioned deterministic JSON for hashing and byte comparisons."""
    _validate_json_value(value)
    return json.dumps(
        value,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
        allow_nan=False,
    )


def sha256_json(value: Any) -> str:
    return hashlib.sha256(canonical_json(value).encode("utf-8")).hexdigest()


def _is_sha256(value: Any) -> bool:
    return (
        isinstance(value, str)
        and len(value) == 64
        and all(character in "0123456789abcdef" for character in value)
    )


def _require_identifier(value: Any, field: str, max_length: int = 256) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ReceiptValidationError(f"{field} must be a non-empty string")
    if len(value) > max_length:
        raise ReceiptValidationError(f"{field} exceeds max length {max_length}")
    return value


def _require_timestamp(value: Any, field: str) -> str:
    if not isinstance(value, str):
        raise ReceiptValidationError(f"{field} must be a date-time string")
    try:
        datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ReceiptValidationError(f"{field} must be a valid ISO-8601 date-time") from exc
    return value


_RECEIPT_ID_PATTERN = re.compile(r"^REC-V2-[A-F0-9]{24}$")


def _require_receipt_id_or_none(value: Any, field: str) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str) or not _RECEIPT_ID_PATTERN.match(value):
        raise ReceiptValidationError(f"{field} must be null or a REC-V2-<24 hex> id")
    return value


def _validate_artifact_manifest(
    manifest: Sequence[Mapping[str, Any]],
    replay_bundle: Mapping[str, Any],
) -> list[dict[str, Any]]:
    normalized: list[dict[str, Any]] = []
    identifiers: set[str] = set()
    frozen_artifacts = replay_bundle.get("frozen_artifacts", {})
    if not isinstance(frozen_artifacts, dict):
        raise ReceiptValidationError("replay_bundle.frozen_artifacts must be an object")

    allowed_artifact_keys = {"artifact_id", "artifact_type", "version", "artifact_hash"}
    for index, original in enumerate(manifest):
        if not isinstance(original, Mapping):
            raise ReceiptValidationError(f"artifact_manifest[{index}] must be an object")
        item = dict(original)
        extra_keys = set(item) - allowed_artifact_keys
        if extra_keys:
            raise ReceiptValidationError(
                f"artifact_manifest[{index}] has unexpected fields: {sorted(extra_keys)}"
            )
        artifact_id = _require_identifier(item.get("artifact_id"), "artifact_id")
        if artifact_id in identifiers:
            raise ReceiptValidationError(f"duplicate artifact_id: {artifact_id}")
        identifiers.add(artifact_id)
        _require_identifier(item.get("artifact_type"), "artifact_type")
        _require_identifier(item.get("version"), "artifact version")
        artifact_hash = item.get("artifact_hash")
        if not _is_sha256(artifact_hash):
            raise ReceiptValidationError(f"invalid artifact_hash for {artifact_id}")
        if artifact_id not in frozen_artifacts:
            raise ReceiptValidationError(f"frozen artifact missing: {artifact_id}")
        if sha256_json(frozen_artifacts[artifact_id]) != artifact_hash:
            raise ReceiptValidationError(f"frozen artifact hash mismatch: {artifact_id}")
        normalized.append(item)
    return normalized


def _validate_llm_contribution(
    mode: str,
    contribution: Mapping[str, Any] | None,
    replay_bundle: Mapping[str, Any],
) -> dict[str, Any] | None:
    if contribution is None:
        if mode == "lead_fallback":
            raise ReceiptValidationError("lead_fallback requires an LLM contribution")
        return None

    item = dict(contribution)
    allowed_keys = {
        "provider",
        "model_id",
        "model_version",
        "mode",
        "write_authority",
        "silent_user_experience",
        "complete_decision_packet_hash",
        "prompt_hash",
        "request_hash",
        "response_hash",
        "fallback_envelope_hash",
    }
    extra_keys = set(item) - allowed_keys
    if extra_keys:
        raise ReceiptValidationError(f"LLM contribution has unexpected fields: {sorted(extra_keys)}")
    provider = item.get("provider")
    if provider not in LLM_PROVIDERS:
        raise ReceiptValidationError("LLM provider must be gemini or gemma")
    _require_identifier(item.get("model_id"), "LLM model_id")
    model_version = item.get("model_version")
    if not isinstance(model_version, str) or not model_version.strip():
        raise ReceiptValidationError("LLM model_version must be a non-empty string")
    contribution_mode = item.get("mode")
    if contribution_mode not in {"advisory", "lead_fallback"}:
        raise ReceiptValidationError("invalid LLM contribution mode")
    if mode == "lead_fallback" and contribution_mode != "lead_fallback":
        raise ReceiptValidationError("lead_fallback receipt requires lead_fallback contribution")
    if item.get("write_authority") != "none":
        raise ReceiptValidationError("LLM contribution must have zero direct write authority")
    if item.get("silent_user_experience") is not True:
        raise ReceiptValidationError("LLM contribution must remain silent")

    required_hashes = (
        "complete_decision_packet_hash",
        "prompt_hash",
        "request_hash",
        "response_hash",
        "fallback_envelope_hash",
    )
    for field in required_hashes:
        if not _is_sha256(item.get(field)):
            raise ReceiptValidationError(f"invalid LLM contribution hash: {field}")

    # Defect 4: response_hash was the only LLM hash ever bound to a frozen
    # object in the replay bundle - complete_decision_packet_hash, prompt_hash,
    # request_hash, and fallback_envelope_hash were checked only for SHA-256
    # *shape*, so any bytes satisfying that shape could sit in a receipt
    # without ever having been the object the hash claims to represent.
    frozen_context = replay_bundle.get("frozen_llm_context")
    if not isinstance(frozen_context, Mapping):
        raise ReceiptValidationError(
            "replay_bundle.frozen_llm_context is required for an LLM contribution"
        )
    frozen_field_map = {
        "complete_decision_packet_hash": "complete_decision_packet",
        "prompt_hash": "prompt",
        "request_hash": "request",
        "fallback_envelope_hash": "fallback_envelope",
    }
    for hash_field, frozen_key in frozen_field_map.items():
        if frozen_key not in frozen_context:
            raise ReceiptValidationError(f"frozen_llm_context missing: {frozen_key}")
        if sha256_json(frozen_context[frozen_key]) != item[hash_field]:
            raise ReceiptValidationError(f"frozen {frozen_key} hash mismatch")

    frozen_response = replay_bundle.get("frozen_llm_response")
    if frozen_response is None:
        raise ReceiptValidationError("frozen LLM response is required")
    if sha256_json(frozen_response) != item["response_hash"]:
        raise ReceiptValidationError("frozen LLM response hash mismatch")
    return item


def build_receipt(
    *,
    decision_id: str,
    athlete_scope_id: str,
    created_at: str,
    decision_mode: str,
    decision_trace: Mapping[str, Any],
    replay_bundle: Mapping[str, Any],
    evaluator_id: str,
    evaluator_version: str,
    artifact_manifest: Sequence[Mapping[str, Any]],
    llm_contribution: Mapping[str, Any] | None = None,
    prior_receipt_id: str | None = None,
    previous_receipt_hash: str = ZERO_HASH,
    rollback_target_receipt_id: str | None = None,
) -> dict[str, Any]:
    """Build a complete content-addressed receipt without persisting it."""
    decision_id = _require_identifier(decision_id, "decision_id")
    athlete_scope_id = _require_identifier(athlete_scope_id, "athlete_scope_id")
    created_at = _require_timestamp(created_at, "created_at")
    evaluator_id = _require_identifier(evaluator_id, "evaluator_id")
    evaluator_version = _require_identifier(evaluator_version, "evaluator_version", max_length=64)
    if decision_mode not in DECISION_MODES:
        raise ReceiptValidationError(f"invalid decision_mode: {decision_mode}")
    if not _is_sha256(previous_receipt_hash):
        raise ReceiptValidationError("previous_receipt_hash must be SHA-256")
    prior_receipt_id = _require_receipt_id_or_none(prior_receipt_id, "prior_receipt_id")
    rollback_target_receipt_id = _require_receipt_id_or_none(
        rollback_target_receipt_id, "rollback_target_receipt_id"
    )
    if prior_receipt_id is None and previous_receipt_hash != ZERO_HASH:
        raise ReceiptValidationError("first receipt must use the zero previous hash")
    if prior_receipt_id is not None and previous_receipt_hash == ZERO_HASH:
        raise ReceiptValidationError("chained receipt cannot use the zero previous hash")

    trace = dict(decision_trace)
    bundle = dict(replay_bundle)
    if not isinstance(bundle.get("inputs"), dict):
        raise ReceiptValidationError("replay_bundle.inputs must be an object")
    artifacts = _validate_artifact_manifest(artifact_manifest, bundle)
    llm = _validate_llm_contribution(decision_mode, llm_contribution, bundle)

    required_trace_fields = {
        "action",
        "candidate_ledger",
        "validator_results",
        "reason_codes",
        "final_decision",
    }
    missing = sorted(required_trace_fields - set(trace))
    if missing:
        raise ReceiptValidationError(
            "decision_trace missing required fields: " + ", ".join(missing)
        )
    if trace.get("silent_apply_allowed") is not True:
        raise ReceiptValidationError("decision trace must permit the silent execution path")
    if trace.get("user_facing_explanation_emitted") not in {None, False}:
        raise ReceiptValidationError("normal decision execution cannot emit an explanation")

    action = trace["action"]
    if not isinstance(action, str) or not 1 <= len(action) <= 128:
        raise ReceiptValidationError("decision_trace.action must be a string of 1-128 chars")

    reason_codes = trace["reason_codes"]
    if not isinstance(reason_codes, list) or not all(
        isinstance(code, str) and 1 <= len(code) <= 256 for code in reason_codes
    ):
        raise ReceiptValidationError("decision_trace.reason_codes must be a list of identifiers")
    if len(set(reason_codes)) != len(reason_codes):
        raise ReceiptValidationError("decision_trace.reason_codes must be unique")

    rationale = trace.get("rationale", [])
    if not isinstance(rationale, list) or not all(isinstance(item, str) for item in rationale):
        raise ReceiptValidationError("decision_trace.rationale must be a list of strings")

    validator_results = trace["validator_results"]
    if not isinstance(validator_results, list) or not validator_results or not all(
        isinstance(item, Mapping) for item in validator_results
    ):
        raise ReceiptValidationError(
            "decision_trace.validator_results must be a non-empty list of objects"
        )

    final_decision = trace["final_decision"]
    if not isinstance(final_decision, Mapping) or not final_decision:
        raise ReceiptValidationError("decision_trace.final_decision must be a non-empty object")

    body = {
        "kind": "decision_receipt",
        "receipt_version": RECEIPT_VERSION,
        "canonicalization": CANONICALIZATION,
        "decision_id": decision_id,
        "athlete_scope_id": athlete_scope_id,
        "created_at": created_at,
        "decision_mode": decision_mode,
        "prior_receipt_id": prior_receipt_id,
        "previous_receipt_hash": previous_receipt_hash,
        "rollback_target_receipt_id": rollback_target_receipt_id,
        "evaluator": {
            "evaluator_id": evaluator_id,
            "evaluator_version": evaluator_version,
        },
        "artifact_manifest": artifacts,
        "llm_contribution": llm,
        "action": action,
        "reason_codes": reason_codes,
        "rationale": rationale,
        "validator_results": validator_results,
        "final_decision": final_decision,
        "silent_apply_allowed": trace.get("silent_apply_allowed", True),
        "decision_trace": trace,
        "decision_trace_hash": sha256_json(trace),
        "replay_bundle_hash": sha256_json(bundle),
        "silent_user_experience": True,
        "user_facing_explanation_emitted": False,
    }
    receipt_hash = sha256_json(body)
    receipt_id = "REC-V2-" + receipt_hash[:24].upper()
    return {**body, "receipt_id": receipt_id, "receipt_hash": receipt_hash}


def verify_receipt_data(
    receipt: Mapping[str, Any],
    replay_bundle: Mapping[str, Any],
    evaluator: Callable[[Mapping[str, Any]], Mapping[str, Any]],
) -> dict[str, Any]:
    """Verify a receipt and re-execute its frozen evaluator input."""
    failures: list[str] = []
    receipt_copy = dict(receipt)
    expected_receipt_hash = receipt_copy.get("receipt_hash")
    expected_trace_hash = receipt_copy.get("decision_trace_hash")
    expected_bundle_hash = receipt_copy.get("replay_bundle_hash")

    body = {
        key: value
        for key, value in receipt_copy.items()
        if key not in {"receipt_id", "receipt_hash"}
    }
    try:
        actual_receipt_hash = sha256_json(body)
    except ReceiptValidationError:
        actual_receipt_hash = None
        failures.append("RECEIPT_NOT_CANONICAL_JSON")
    if actual_receipt_hash != expected_receipt_hash:
        failures.append("RECEIPT_HASH_MISMATCH")
    expected_receipt_id = (
        "REC-V2-" + expected_receipt_hash[:24].upper()
        if _is_sha256(expected_receipt_hash)
        else None
    )
    if receipt_copy.get("receipt_id") != expected_receipt_id:
        failures.append("RECEIPT_ID_MISMATCH")

    try:
        actual_bundle_hash = sha256_json(replay_bundle)
    except ReceiptValidationError:
        actual_bundle_hash = None
        failures.append("REPLAY_BUNDLE_NOT_CANONICAL_JSON")
    if actual_bundle_hash != expected_bundle_hash:
        failures.append("REPLAY_BUNDLE_HASH_MISMATCH")

    frozen_artifacts = replay_bundle.get("frozen_artifacts", {})
    for artifact in receipt_copy.get("artifact_manifest", []):
        artifact_id = artifact.get("artifact_id")
        frozen = frozen_artifacts.get(artifact_id) if isinstance(frozen_artifacts, dict) else None
        if frozen is None:
            failures.append("FROZEN_ARTIFACT_MISSING:" + str(artifact_id))
        elif sha256_json(frozen) != artifact.get("artifact_hash"):
            failures.append("FROZEN_ARTIFACT_HASH_MISMATCH:" + str(artifact_id))

    contribution = receipt_copy.get("llm_contribution")
    if contribution is not None:
        frozen_response = replay_bundle.get("frozen_llm_response")
        if frozen_response is None:
            failures.append("FROZEN_LLM_RESPONSE_MISSING")
        elif sha256_json(frozen_response) != contribution.get("response_hash"):
            failures.append("FROZEN_LLM_RESPONSE_HASH_MISMATCH")
        if contribution.get("write_authority") != "none":
            failures.append("LLM_WRITE_AUTHORITY_INVALID")

    actual_trace: Mapping[str, Any] | None = None
    actual_trace_hash: str | None = None
    try:
        actual_trace = evaluator(replay_bundle)
        actual_trace_hash = sha256_json(actual_trace)
    except Exception:
        failures.append("EVALUATOR_EXECUTION_FAILED")
    if actual_trace_hash != expected_trace_hash:
        failures.append("DECISION_TRACE_HASH_MISMATCH")
    try:
        if actual_trace is not None and canonical_json(actual_trace) != canonical_json(
            receipt_copy.get("decision_trace")
        ):
            failures.append("DECISION_TRACE_BYTES_MISMATCH")
    except ReceiptValidationError:
        failures.append("DECISION_TRACE_NOT_CANONICAL_JSON")

    return {
        "ok": not failures,
        "failure_codes": sorted(set(failures)),
        "expected_receipt_hash": expected_receipt_hash,
        "actual_receipt_hash": actual_receipt_hash,
        "expected_trace_hash": expected_trace_hash,
        "actual_trace_hash": actual_trace_hash,
        "expected_bundle_hash": expected_bundle_hash,
        "actual_bundle_hash": actual_bundle_hash,
    }


def _validate_chain_targets(
    db: sqlite3.Connection,
    athlete_scope_id: str,
    rollback_target_receipt_id: str | None,
) -> tuple[str | None, str]:
    prior = db.execute(
        """
        SELECT receipt_id,receipt_hash
        FROM decision_receipts_v2
        WHERE athlete_scope_id=?
        ORDER BY sequence DESC
        LIMIT 1
        """,
        (athlete_scope_id,),
    ).fetchone()
    prior_receipt_id = prior["receipt_id"] if prior else None
    previous_receipt_hash = prior["receipt_hash"] if prior else ZERO_HASH
    if rollback_target_receipt_id is not None:
        target = db.execute(
            "SELECT receipt_id,athlete_scope_id FROM decision_receipts_v2 WHERE receipt_id=?",
            (rollback_target_receipt_id,),
        ).fetchone()
        if not target:
            raise ReceiptValidationError("rollback target receipt does not exist")
        if target["athlete_scope_id"] != athlete_scope_id:
            raise ReceiptValidationError("rollback target belongs to another athlete scope")
    return prior_receipt_id, previous_receipt_hash


def commit_receipt(
    db: sqlite3.Connection,
    *,
    decision_id: str,
    athlete_scope_id: str,
    created_at: str,
    decision_mode: str,
    decision_trace: Mapping[str, Any],
    replay_bundle: Mapping[str, Any],
    evaluator_id: str,
    evaluator_version: str,
    artifact_manifest: Sequence[Mapping[str, Any]],
    llm_contribution: Mapping[str, Any] | None = None,
    rollback_target_receipt_id: str | None = None,
) -> dict[str, Any]:
    """Atomically append one receipt to an athlete-scoped hash chain.

    Idempotent: retrying with a decision_id that was already committed
    returns the existing receipt unchanged when the requested content is
    identical, instead of raising a bare unique-constraint error. A
    decision_id reused with genuinely different content raises
    ReceiptValidationError rather than a raw sqlite3.IntegrityError.
    """
    db.execute("BEGIN IMMEDIATE")
    try:
        existing_row = db.execute(
            "SELECT receipt_json FROM decision_receipts_v2 WHERE decision_id=?",
            (decision_id,),
        ).fetchone()
        prior_receipt_id, previous_receipt_hash = _validate_chain_targets(
            db, athlete_scope_id, rollback_target_receipt_id
        )
        receipt = build_receipt(
            decision_id=decision_id,
            athlete_scope_id=athlete_scope_id,
            created_at=created_at,
            decision_mode=decision_mode,
            decision_trace=decision_trace,
            replay_bundle=replay_bundle,
            evaluator_id=evaluator_id,
            evaluator_version=evaluator_version,
            artifact_manifest=artifact_manifest,
            llm_contribution=llm_contribution,
            prior_receipt_id=prior_receipt_id,
            previous_receipt_hash=previous_receipt_hash,
            rollback_target_receipt_id=rollback_target_receipt_id,
        )
        if existing_row is not None:
            stored = json.loads(existing_row["receipt_json"])
            chain_position_fields = {
                "receipt_id",
                "receipt_hash",
                "prior_receipt_id",
                "previous_receipt_hash",
            }
            new_content = {
                k: v for k, v in receipt.items() if k not in chain_position_fields
            }
            stored_content = {
                k: v for k, v in stored.items() if k not in chain_position_fields
            }
            if canonical_json(new_content) != canonical_json(stored_content):
                raise ReceiptValidationError(
                    f"decision_id already committed with different content: {decision_id}"
                )
            db.rollback()
            return stored
        db.execute(
            """
            INSERT INTO decision_receipts_v2(
              receipt_id,decision_id,athlete_scope_id,created_at,receipt_version,
              decision_mode,prior_receipt_id,previous_receipt_hash,
              rollback_target_receipt_id,receipt_json,replay_bundle_json,
              decision_trace_hash,replay_bundle_hash,receipt_hash,
              silent_user_experience
            ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """,
            (
                receipt["receipt_id"],
                receipt["decision_id"],
                receipt["athlete_scope_id"],
                receipt["created_at"],
                receipt["receipt_version"],
                receipt["decision_mode"],
                receipt["prior_receipt_id"],
                receipt["previous_receipt_hash"],
                receipt["rollback_target_receipt_id"],
                canonical_json(receipt),
                canonical_json(replay_bundle),
                receipt["decision_trace_hash"],
                receipt["replay_bundle_hash"],
                receipt["receipt_hash"],
                1,
            ),
        )
        db.commit()
        return receipt
    except Exception:
        db.rollback()
        raise


def _record_replay_attempt(
    db: sqlite3.Connection,
    *,
    receipt_id: str,
    attempted_at: str,
    evaluator_id: str,
    evaluator_version: str,
    result: Mapping[str, Any],
) -> dict[str, Any]:
    previous = db.execute(
        """
        SELECT attempt_hash FROM replay_attempts_v2
        WHERE receipt_id=?
        ORDER BY sequence DESC LIMIT 1
        """,
        (receipt_id,),
    ).fetchone()
    previous_attempt_hash = previous["attempt_hash"] if previous else ZERO_HASH
    body = {
        "receipt_id": receipt_id,
        "attempted_at": attempted_at,
        "evaluator_id": evaluator_id,
        "evaluator_version": evaluator_version,
        "ok": bool(result["ok"]),
        "failure_codes": list(result["failure_codes"]),
        "expected_receipt_hash": result.get("expected_receipt_hash"),
        "actual_receipt_hash": result.get("actual_receipt_hash"),
        "expected_trace_hash": result.get("expected_trace_hash"),
        "actual_trace_hash": result.get("actual_trace_hash"),
        "expected_bundle_hash": result.get("expected_bundle_hash"),
        "actual_bundle_hash": result.get("actual_bundle_hash"),
        "previous_attempt_hash": previous_attempt_hash,
    }
    attempt_hash = sha256_json(body)
    replay_id = "RPL-V2-" + attempt_hash[:24].upper()
    db.execute(
        """
        INSERT INTO replay_attempts_v2(
          replay_id,receipt_id,attempted_at,evaluator_id,evaluator_version,ok,
          failure_codes_json,expected_receipt_hash,actual_receipt_hash,
          expected_trace_hash,actual_trace_hash,expected_bundle_hash,
          actual_bundle_hash,previous_attempt_hash,attempt_hash
        ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """,
        (
            replay_id,
            receipt_id,
            attempted_at,
            evaluator_id,
            evaluator_version,
            int(bool(result["ok"])),
            canonical_json(body["failure_codes"]),
            body["expected_receipt_hash"],
            body["actual_receipt_hash"],
            body["expected_trace_hash"],
            body["actual_trace_hash"],
            body["expected_bundle_hash"],
            body["actual_bundle_hash"],
            previous_attempt_hash,
            attempt_hash,
        ),
    )
    return {**body, "replay_id": replay_id, "attempt_hash": attempt_hash}


def _record_replay_lookup_failure(
    db: sqlite3.Connection,
    *,
    requested_receipt_id: str,
    attempted_at: str,
    failure_code: str,
) -> dict[str, Any]:
    """Record a replay attempt that could not even reach a receipt row.

    Distinct from `_record_replay_attempt`: that function requires a real
    row in decision_receipts_v2 (its table has a FOREIGN KEY on receipt_id).
    A receipt_id that does not exist, or whose stored row cannot be
    interpreted, cannot satisfy that constraint - this records the failed
    lookup itself in a separate append-only, hash-chained ledger so no
    replay attempt goes unrecorded.
    """
    previous = db.execute(
        "SELECT failure_hash FROM replay_lookup_failures_v2 ORDER BY sequence DESC LIMIT 1"
    ).fetchone()
    previous_failure_hash = previous["failure_hash"] if previous else ZERO_HASH
    body = {
        "requested_receipt_id": requested_receipt_id,
        "attempted_at": attempted_at,
        "failure_code": failure_code,
        "previous_failure_hash": previous_failure_hash,
    }
    failure_hash = sha256_json(body)
    failure_id = "RLF-V2-" + failure_hash[:24].upper()
    db.execute(
        """
        INSERT INTO replay_lookup_failures_v2(
          failure_id,requested_receipt_id,attempted_at,failure_code,
          previous_failure_hash,failure_hash
        ) VALUES(?,?,?,?,?,?)
        """,
        (
            failure_id,
            requested_receipt_id,
            attempted_at,
            failure_code,
            previous_failure_hash,
            failure_hash,
        ),
    )
    db.commit()
    return {**body, "failure_id": failure_id, "failure_hash": failure_hash}


def _evaluator_artifact_id(evaluator_id: str, evaluator_version: str) -> str:
    return f"EVALUATOR-{evaluator_id}-{evaluator_version}"


def register_evaluator_artifact(
    db: sqlite3.Connection,
    *,
    evaluator_id: str,
    evaluator_version: str,
    module_path: str | Path,
    approval_event_id: str,
) -> dict[str, Any]:
    """Package an evaluator implementation as an immutable, hash-verified artifact.

    Defect 11: replay used to depend entirely on an in-process Python dict
    handed in by the caller - nothing stopped a future caller from silently
    swapping in different code under the same evaluator_id/evaluator_version.
    Once registered here, `replay_receipt` re-hashes the module on every
    replay and fails loudly if the bytes on disk no longer match what this
    evaluator_version was approved against. Registering the exact same
    (id, version, hash) twice is a no-op; registering a different hash under
    an already-registered (id, version) is a hard error - a version is
    immutable, a real code change needs a new evaluator_version.
    """
    module_path = Path(module_path)
    artifact_hash = hashlib.sha256(module_path.read_bytes()).hexdigest()
    artifact_id = _evaluator_artifact_id(evaluator_id, evaluator_version)
    existing = db.execute(
        "SELECT artifact_hash FROM runtime_artifacts WHERE artifact_id=?", (artifact_id,)
    ).fetchone()
    if existing is not None:
        if existing["artifact_hash"] != artifact_hash:
            raise ReceiptValidationError(
                f"evaluator {evaluator_id}@{evaluator_version} is already registered "
                "with different code - bump evaluator_version for a real change"
            )
        return {"artifact_id": artifact_id, "artifact_hash": artifact_hash, "status": "already_registered"}
    db.execute(
        """
        INSERT INTO runtime_artifacts(
          artifact_id,artifact_type,version,artifact_path,artifact_hash,
          trust_origin,llm_tainted,deterministic,status,approval_event_id
        ) VALUES(?,?,?,?,?,?,?,?,?,?)
        """,
        (
            artifact_id,
            "evaluator",
            evaluator_version,
            str(module_path),
            artifact_hash,
            "human_promoted_verified",
            0,
            1,
            "active",
            approval_event_id,
        ),
    )
    db.commit()
    return {"artifact_id": artifact_id, "artifact_hash": artifact_hash, "status": "registered"}


def _check_evaluator_artifact(db: sqlite3.Connection, evaluator_id: str, evaluator_version: str) -> list[str]:
    """Return failure codes if a registered evaluator artifact's bytes have drifted.

    No registration for this (id, version) is not itself a failure: artifact
    registration is opt-in (pre-research posture), so this only adds
    protection once a version has deliberately been packaged.
    """
    row = db.execute(
        "SELECT artifact_path,artifact_hash FROM runtime_artifacts WHERE artifact_id=? AND artifact_type='evaluator' AND status='active'",
        (_evaluator_artifact_id(evaluator_id, evaluator_version),),
    ).fetchone()
    if row is None:
        return []
    try:
        actual_hash = hashlib.sha256(Path(row["artifact_path"]).read_bytes()).hexdigest()
    except OSError:
        return ["EVALUATOR_ARTIFACT_MISSING"]
    if actual_hash != row["artifact_hash"]:
        return ["EVALUATOR_ARTIFACT_TAMPERED"]
    return []


def replay_receipt(
    db: sqlite3.Connection,
    receipt_id: str,
    evaluator_registry: Mapping[
        tuple[str, str], Callable[[Mapping[str, Any]], Mapping[str, Any]]
    ],
    *,
    attempted_at: str | None = None,
) -> dict[str, Any]:
    """Load, verify, re-execute, compare, and append a replay-attempt record.

    Every call is recorded, including a receipt_id that cannot be found or
    whose stored JSON cannot be parsed (defect 10): those go to
    `replay_lookup_failures_v2` since they cannot satisfy the FOREIGN KEY
    that `replay_attempts_v2` requires against a real receipt row.
    """
    attempted_at = attempted_at or datetime.now(timezone.utc).isoformat()
    row = db.execute(
        "SELECT * FROM decision_receipts_v2 WHERE receipt_id=?", (receipt_id,)
    ).fetchone()
    if not row:
        _record_replay_lookup_failure(
            db,
            requested_receipt_id=receipt_id,
            attempted_at=attempted_at,
            failure_code="RECEIPT_NOT_FOUND",
        )
        return {
            "ok": False,
            "receipt_id": receipt_id,
            "failure_codes": ["RECEIPT_NOT_FOUND"],
        }

    failures: list[str] = []
    try:
        receipt = json.loads(row["receipt_json"])
        replay_bundle = json.loads(row["replay_bundle_json"])
    except Exception:
        _record_replay_attempt(
            db,
            receipt_id=receipt_id,
            attempted_at=attempted_at,
            evaluator_id="unavailable",
            evaluator_version="unavailable",
            result={
                "ok": False,
                "failure_codes": ["STORED_JSON_INVALID"],
                "expected_receipt_hash": row["receipt_hash"],
                "actual_receipt_hash": None,
                "expected_trace_hash": row["decision_trace_hash"],
                "actual_trace_hash": None,
                "expected_bundle_hash": row["replay_bundle_hash"],
                "actual_bundle_hash": None,
            },
        )
        return {
            "ok": False,
            "receipt_id": receipt_id,
            "failure_codes": ["STORED_JSON_INVALID"],
        }

    if canonical_json(receipt) != row["receipt_json"]:
        failures.append("STORED_RECEIPT_NOT_CANONICAL")
    if canonical_json(replay_bundle) != row["replay_bundle_json"]:
        failures.append("STORED_REPLAY_BUNDLE_NOT_CANONICAL")
    if receipt.get("receipt_id") != row["receipt_id"]:
        failures.append("ROW_RECEIPT_ID_MISMATCH")
    if receipt.get("receipt_hash") != row["receipt_hash"]:
        failures.append("ROW_RECEIPT_HASH_MISMATCH")
    if receipt.get("replay_bundle_hash") != row["replay_bundle_hash"]:
        failures.append("ROW_BUNDLE_HASH_MISMATCH")
    if receipt.get("decision_trace_hash") != row["decision_trace_hash"]:
        failures.append("ROW_TRACE_HASH_MISMATCH")
    if receipt.get("silent_user_experience") is not True:
        failures.append("SILENT_EXPERIENCE_DISABLED")

    evaluator_key = (
        receipt.get("evaluator", {}).get("evaluator_id"),
        receipt.get("evaluator", {}).get("evaluator_version"),
    )
    evaluator = evaluator_registry.get(evaluator_key)
    if evaluator is None:
        verification = {
            "ok": False,
            "failure_codes": ["EVALUATOR_NOT_AVAILABLE"],
            "expected_receipt_hash": receipt.get("receipt_hash"),
            "actual_receipt_hash": None,
            "expected_trace_hash": receipt.get("decision_trace_hash"),
            "actual_trace_hash": None,
            "expected_bundle_hash": receipt.get("replay_bundle_hash"),
            "actual_bundle_hash": sha256_json(replay_bundle),
        }
    else:
        verification = verify_receipt_data(receipt, replay_bundle, evaluator)
    failures.extend(verification["failure_codes"])
    if evaluator_key[0] is not None and evaluator_key[1] is not None:
        failures.extend(_check_evaluator_artifact(db, evaluator_key[0], evaluator_key[1]))

    prior_receipt_id = receipt.get("prior_receipt_id")
    if prior_receipt_id is None:
        if receipt.get("previous_receipt_hash") != ZERO_HASH:
            failures.append("CHAIN_GENESIS_HASH_INVALID")
    else:
        prior = db.execute(
            "SELECT receipt_hash FROM decision_receipts_v2 WHERE receipt_id=?",
            (prior_receipt_id,),
        ).fetchone()
        if not prior:
            failures.append("CHAIN_PRIOR_RECEIPT_MISSING")
        elif prior["receipt_hash"] != receipt.get("previous_receipt_hash"):
            failures.append("CHAIN_PREVIOUS_HASH_MISMATCH")

    final_result = {
        **verification,
        "ok": not failures,
        "receipt_id": receipt_id,
        "failure_codes": sorted(set(failures)),
    }
    _record_replay_attempt(
        db,
        receipt_id=receipt_id,
        attempted_at=attempted_at,
        evaluator_id=str(evaluator_key[0]),
        evaluator_version=str(evaluator_key[1]),
        result=final_result,
    )
    db.commit()
    return final_result


def verify_receipt_chain(
    db: sqlite3.Connection, athlete_scope_id: str
) -> dict[str, Any]:
    """Verify content hashes and previous-receipt links without re-executing decisions."""
    rows = db.execute(
        """
        SELECT * FROM decision_receipts_v2
        WHERE athlete_scope_id=?
        ORDER BY sequence
        """,
        (athlete_scope_id,),
    ).fetchall()
    failures: list[str] = []
    expected_previous_hash = ZERO_HASH
    expected_prior_id: str | None = None
    for row in rows:
        try:
            receipt = json.loads(row["receipt_json"])
            body = {
                key: value
                for key, value in receipt.items()
                if key not in {"receipt_id", "receipt_hash"}
            }
            actual_hash = sha256_json(body)
        except Exception:
            failures.append("CHAIN_RECEIPT_INVALID_JSON:" + row["receipt_id"])
            continue
        if actual_hash != row["receipt_hash"]:
            failures.append("CHAIN_RECEIPT_HASH_MISMATCH:" + row["receipt_id"])
        expected_receipt_id = "REC-V2-" + actual_hash[:24].upper()
        if receipt.get("receipt_id") != expected_receipt_id:
            failures.append("CHAIN_RECEIPT_ID_MISMATCH:" + row["receipt_id"])
        if receipt.get("receipt_id") != row["receipt_id"]:
            failures.append("CHAIN_ROW_RECEIPT_ID_MISMATCH:" + row["receipt_id"])
        if receipt.get("previous_receipt_hash") != expected_previous_hash:
            failures.append("CHAIN_LINK_HASH_MISMATCH:" + row["receipt_id"])
        if receipt.get("prior_receipt_id") != expected_prior_id:
            failures.append("CHAIN_LINK_ID_MISMATCH:" + row["receipt_id"])
        expected_previous_hash = row["receipt_hash"]
        expected_prior_id = row["receipt_id"]
    return {
        "ok": not failures,
        "athlete_scope_id": athlete_scope_id,
        "receipt_count": len(rows),
        "failure_codes": failures,
        "chain_head_receipt_id": expected_prior_id,
        "chain_head_hash": expected_previous_hash,
    }
