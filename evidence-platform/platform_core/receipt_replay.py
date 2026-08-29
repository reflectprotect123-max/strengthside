"""Immutable hidden decision receipts, deterministic replay, and tamper checks.

This module records decision execution. It does not decide what an athlete should do.
"""

from __future__ import annotations

import hashlib
import json
import math
import sqlite3
from collections.abc import Callable, Mapping, Sequence
from datetime import datetime, timezone
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


def _require_identifier(value: Any, field: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ReceiptValidationError(f"{field} must be a non-empty string")
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

    for index, original in enumerate(manifest):
        if not isinstance(original, Mapping):
            raise ReceiptValidationError(f"artifact_manifest[{index}] must be an object")
        item = dict(original)
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
    provider = item.get("provider")
    if provider not in LLM_PROVIDERS:
        raise ReceiptValidationError("LLM provider must be gemini or gemma")
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
    created_at = _require_identifier(created_at, "created_at")
    evaluator_id = _require_identifier(evaluator_id, "evaluator_id")
    evaluator_version = _require_identifier(evaluator_version, "evaluator_version")
    if decision_mode not in DECISION_MODES:
        raise ReceiptValidationError(f"invalid decision_mode: {decision_mode}")
    if not _is_sha256(previous_receipt_hash):
        raise ReceiptValidationError("previous_receipt_hash must be SHA-256")
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
        "action": trace["action"],
        "reason_codes": trace["reason_codes"],
        "rationale": trace.get("rationale", []),
        "validator_results": trace["validator_results"],
        "final_decision": trace["final_decision"],
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
    """Atomically append one receipt to an athlete-scoped hash chain."""
    db.execute("BEGIN IMMEDIATE")
    try:
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


def replay_receipt(
    db: sqlite3.Connection,
    receipt_id: str,
    evaluator_registry: Mapping[
        tuple[str, str], Callable[[Mapping[str, Any]], Mapping[str, Any]]
    ],
    *,
    attempted_at: str | None = None,
) -> dict[str, Any]:
    """Load, verify, re-execute, compare, and append a replay-attempt record."""
    row = db.execute(
        "SELECT * FROM decision_receipts_v2 WHERE receipt_id=?", (receipt_id,)
    ).fetchone()
    if not row:
        return {
            "ok": False,
            "receipt_id": receipt_id,
            "failure_codes": ["RECEIPT_NOT_FOUND"],
        }

    attempted_at = attempted_at or datetime.now(timezone.utc).isoformat()
    failures: list[str] = []
    try:
        receipt = json.loads(row["receipt_json"])
        replay_bundle = json.loads(row["replay_bundle_json"])
    except Exception:
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
