from __future__ import annotations

import copy
import json
import math
import sqlite3
import tempfile
import unittest
from pathlib import Path

from platform_core.db import connect, migrate
from platform_core.decision import decide, replay
from platform_core.receipt_replay import (
    ReceiptValidationError,
    build_receipt,
    canonical_json,
    commit_receipt,
    replay_receipt,
    sha256_json,
    verify_receipt_chain,
    verify_receipt_data,
)


ROOT = Path(__file__).parents[1]


def trace(action="hold"):
    return {
        "action": action,
        "candidate_ledger": [
            {
                "candidate_id": "candidate:001",
                "action": action,
                "eligible": action != "abstain",
            }
        ],
        "validator_results": [
            {"validator": "fixture", "passed": True, "reason_codes": []}
        ],
        "reason_codes": ["FIXTURE"],
        "rationale": ["FIXTURE"],
        "final_decision": {"action": action, "committed_change": action != "abstain"},
        "silent_apply_allowed": True,
        "silent_user_experience": True,
        "user_facing_explanation_emitted": False,
    }


def bundle(expected_trace=None, llm_response=None):
    return {
        "bundle_version": "2.0",
        "inputs": {"expected_trace": expected_trace or trace()},
        "frozen_artifacts": {},
        "frozen_llm_response": llm_response,
    }


def identity_evaluator(replay_bundle):
    return replay_bundle["inputs"]["expected_trace"]


def contribution(response, write_authority="none"):
    return {
        "provider": "gemma",
        "model_id": "gemma:test",
        "model_version": "test-1",
        "mode": "lead_fallback",
        "write_authority": write_authority,
        "silent_user_experience": True,
        "complete_decision_packet_hash": sha256_json({"packet": "complete"}),
        "prompt_hash": sha256_json({"prompt": "bounded"}),
        "request_hash": sha256_json({"request": "lead_fallback"}),
        "response_hash": sha256_json(response),
        "fallback_envelope_hash": sha256_json({"envelope": "strength-test"}),
    }


class ReceiptReplayTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.connection = connect(Path(self.temp.name) / "evidence.db")
        migrate(self.connection)

    def tearDown(self):
        self.connection.close()
        self.temp.cleanup()

    def test_canonical_json_is_order_independent(self):
        self.assertEqual(
            canonical_json({"b": 2, "a": [3, 1]}),
            canonical_json({"a": [3, 1], "b": 2}),
        )
        self.assertEqual(
            sha256_json({"b": 2, "a": 1}), sha256_json({"a": 1, "b": 2})
        )

    def test_non_finite_number_is_rejected(self):
        for value in (math.nan, math.inf, -math.inf):
            with self.assertRaises(ReceiptValidationError):
                canonical_json({"value": value})

    def test_synthetic_decision_is_hidden_and_replays(self):
        snapshot = json.loads(
            (ROOT / "fixtures/synthetic/athlete-snapshot.json").read_text()
        )
        outputs = json.loads(
            (ROOT / "fixtures/synthetic/five-system-outputs.json").read_text()
        )
        model = json.loads(
            (ROOT / "fixtures/synthetic/test-model.json").read_text()
        )
        receipt = decide(self.connection, snapshot, outputs, [model], persist=True)
        self.assertTrue(receipt["silent_user_experience"])
        self.assertTrue(receipt["silent_apply_allowed"])
        self.assertFalse(receipt["user_facing_explanation_emitted"])
        self.assertTrue(replay(self.connection, receipt["receipt_id"])["ok"])
        attempt_count = self.connection.execute(
            "SELECT COUNT(*) n FROM replay_attempts_v2"
        ).fetchone()["n"]
        self.assertEqual(attempt_count, 1)

    def test_receipt_rows_are_append_only(self):
        first = commit_receipt(
            self.connection,
            decision_id="decision:append-only",
            athlete_scope_id="athlete:001",
            created_at="2026-08-28T00:00:00Z",
            decision_mode="deterministic",
            decision_trace=trace(),
            replay_bundle=bundle(),
            evaluator_id="identity",
            evaluator_version="1.0",
            artifact_manifest=[],
        )
        with self.assertRaises(sqlite3.IntegrityError):
            self.connection.execute(
                "UPDATE decision_receipts_v2 SET receipt_hash=? WHERE receipt_id=?",
                ("0" * 64, first["receipt_id"]),
            )
        self.connection.rollback()
        with self.assertRaises(sqlite3.IntegrityError):
            self.connection.execute(
                "DELETE FROM decision_receipts_v2 WHERE receipt_id=?",
                (first["receipt_id"],),
            )
        self.connection.rollback()

    def test_duplicate_decision_cannot_replace_original(self):
        arguments = {
            "decision_id": "decision:duplicate",
            "athlete_scope_id": "athlete:001",
            "created_at": "2026-08-28T00:00:00Z",
            "decision_mode": "deterministic",
            "decision_trace": trace(),
            "replay_bundle": bundle(),
            "evaluator_id": "identity",
            "evaluator_version": "1.0",
            "artifact_manifest": [],
        }
        first = commit_receipt(self.connection, **arguments)
        # Idempotent: identical retry returns the already-committed receipt
        # instead of raising a unique-constraint error or chaining a second row.
        second = commit_receipt(self.connection, **arguments)
        self.assertEqual(second["receipt_id"], first["receipt_id"])
        self.assertEqual(second["receipt_hash"], first["receipt_hash"])
        row_count = self.connection.execute(
            "SELECT COUNT(*) n FROM decision_receipts_v2 WHERE decision_id=?",
            ("decision:duplicate",),
        ).fetchone()["n"]
        self.assertEqual(row_count, 1)
        stored = self.connection.execute(
            "SELECT receipt_hash FROM decision_receipts_v2 WHERE decision_id=?",
            ("decision:duplicate",),
        ).fetchone()["receipt_hash"]
        self.assertEqual(stored, first["receipt_hash"])

    def test_duplicate_decision_id_with_different_content_is_rejected(self):
        arguments = {
            "decision_id": "decision:duplicate-conflict",
            "athlete_scope_id": "athlete:001",
            "created_at": "2026-08-28T00:00:00Z",
            "decision_mode": "deterministic",
            "decision_trace": trace(),
            "replay_bundle": bundle(),
            "evaluator_id": "identity",
            "evaluator_version": "1.0",
            "artifact_manifest": [],
        }
        commit_receipt(self.connection, **arguments)
        conflicting = dict(arguments, decision_trace=trace("proceed"))
        conflicting["replay_bundle"] = bundle(expected_trace=conflicting["decision_trace"])
        with self.assertRaises(ReceiptValidationError):
            commit_receipt(self.connection, **conflicting)
        row_count = self.connection.execute(
            "SELECT COUNT(*) n FROM decision_receipts_v2 WHERE decision_id=?",
            ("decision:duplicate-conflict",),
        ).fetchone()["n"]
        self.assertEqual(row_count, 1)

    def test_receipt_chain_and_rollback_reference(self):
        first = commit_receipt(
            self.connection,
            decision_id="decision:001",
            athlete_scope_id="athlete:chain",
            created_at="2026-08-28T00:00:00Z",
            decision_mode="deterministic",
            decision_trace=trace("hold"),
            replay_bundle=bundle(trace("hold")),
            evaluator_id="identity",
            evaluator_version="1.0",
            artifact_manifest=[],
        )
        second = commit_receipt(
            self.connection,
            decision_id="decision:002",
            athlete_scope_id="athlete:chain",
            created_at="2026-08-28T00:01:00Z",
            decision_mode="deterministic",
            decision_trace=trace("keep"),
            replay_bundle=bundle(trace("keep")),
            evaluator_id="identity",
            evaluator_version="1.0",
            artifact_manifest=[],
            rollback_target_receipt_id=first["receipt_id"],
        )
        self.assertEqual(second["prior_receipt_id"], first["receipt_id"])
        self.assertEqual(second["previous_receipt_hash"], first["receipt_hash"])
        self.assertEqual(second["rollback_target_receipt_id"], first["receipt_id"])
        chain = verify_receipt_chain(self.connection, "athlete:chain")
        self.assertTrue(chain["ok"])
        self.assertEqual(chain["receipt_count"], 2)

    def test_rollback_cannot_cross_athlete_scope(self):
        first = commit_receipt(
            self.connection,
            decision_id="decision:athlete-one",
            athlete_scope_id="athlete:one",
            created_at="2026-08-28T00:00:00Z",
            decision_mode="deterministic",
            decision_trace=trace(),
            replay_bundle=bundle(),
            evaluator_id="identity",
            evaluator_version="1.0",
            artifact_manifest=[],
        )
        with self.assertRaises(ReceiptValidationError):
            commit_receipt(
                self.connection,
                decision_id="decision:athlete-two",
                athlete_scope_id="athlete:two",
                created_at="2026-08-28T00:01:00Z",
                decision_mode="deterministic",
                decision_trace=trace(),
                replay_bundle=bundle(),
                evaluator_id="identity",
                evaluator_version="1.0",
                artifact_manifest=[],
                rollback_target_receipt_id=first["receipt_id"],
            )

    def test_tampered_receipt_is_detected(self):
        replay_bundle = bundle()
        receipt = build_receipt(
            decision_id="decision:tamper",
            athlete_scope_id="athlete:001",
            created_at="2026-08-28T00:00:00Z",
            decision_mode="deterministic",
            decision_trace=trace(),
            replay_bundle=replay_bundle,
            evaluator_id="identity",
            evaluator_version="1.0",
            artifact_manifest=[],
        )
        tampered = copy.deepcopy(receipt)
        tampered["decision_trace"]["action"] = "bounded_increase"
        result = verify_receipt_data(tampered, replay_bundle, identity_evaluator)
        self.assertFalse(result["ok"])
        self.assertIn("RECEIPT_HASH_MISMATCH", result["failure_codes"])
        self.assertIn("DECISION_TRACE_BYTES_MISMATCH", result["failure_codes"])

    def test_tampered_replay_bundle_is_detected(self):
        replay_bundle = bundle()
        receipt = build_receipt(
            decision_id="decision:bundle-tamper",
            athlete_scope_id="athlete:001",
            created_at="2026-08-28T00:00:00Z",
            decision_mode="deterministic",
            decision_trace=trace(),
            replay_bundle=replay_bundle,
            evaluator_id="identity",
            evaluator_version="1.0",
            artifact_manifest=[],
        )
        tampered_bundle = copy.deepcopy(replay_bundle)
        tampered_bundle["inputs"]["expected_trace"]["action"] = "bounded_increase"
        result = verify_receipt_data(receipt, tampered_bundle, identity_evaluator)
        self.assertFalse(result["ok"])
        self.assertIn("REPLAY_BUNDLE_HASH_MISMATCH", result["failure_codes"])

    def test_lead_fallback_requires_frozen_llm_and_zero_write_authority(self):
        response = {
            "provider": "gemma",
            "mode": "lead_fallback",
            "proposed_action": "hold",
        }
        replay_bundle = bundle(llm_response=response)
        receipt = build_receipt(
            decision_id="decision:llm-fallback",
            athlete_scope_id="athlete:001",
            created_at="2026-08-28T00:00:00Z",
            decision_mode="lead_fallback",
            decision_trace=trace(),
            replay_bundle=replay_bundle,
            evaluator_id="identity",
            evaluator_version="1.0",
            artifact_manifest=[],
            llm_contribution=contribution(response),
        )
        self.assertEqual(receipt["llm_contribution"]["write_authority"], "none")
        self.assertTrue(
            verify_receipt_data(receipt, replay_bundle, identity_evaluator)["ok"]
        )
        with self.assertRaises(ReceiptValidationError):
            build_receipt(
                decision_id="decision:llm-write",
                athlete_scope_id="athlete:001",
                created_at="2026-08-28T00:00:00Z",
                decision_mode="lead_fallback",
                decision_trace=trace(),
                replay_bundle=replay_bundle,
                evaluator_id="identity",
                evaluator_version="1.0",
                artifact_manifest=[],
                llm_contribution=contribution(response, write_authority="direct"),
            )

    def test_frozen_artifact_tampering_is_detected(self):
        artifact = {"coefficient": 1.25}
        replay_bundle = bundle()
        replay_bundle["frozen_artifacts"] = {"model:001": artifact}
        manifest = [
            {
                "artifact_id": "model:001",
                "artifact_type": "model",
                "version": "1.0",
                "artifact_hash": sha256_json(artifact),
            }
        ]
        receipt = build_receipt(
            decision_id="decision:artifact",
            athlete_scope_id="athlete:001",
            created_at="2026-08-28T00:00:00Z",
            decision_mode="deterministic",
            decision_trace=trace(),
            replay_bundle=replay_bundle,
            evaluator_id="identity",
            evaluator_version="1.0",
            artifact_manifest=manifest,
        )
        tampered = copy.deepcopy(replay_bundle)
        tampered["frozen_artifacts"]["model:001"]["coefficient"] = 2.0
        result = verify_receipt_data(receipt, tampered, identity_evaluator)
        self.assertFalse(result["ok"])
        self.assertIn(
            "FROZEN_ARTIFACT_HASH_MISMATCH:model:001", result["failure_codes"]
        )

    def test_missing_evaluator_is_recorded_as_failed_replay(self):
        receipt = commit_receipt(
            self.connection,
            decision_id="decision:missing-evaluator",
            athlete_scope_id="athlete:001",
            created_at="2026-08-28T00:00:00Z",
            decision_mode="deterministic",
            decision_trace=trace(),
            replay_bundle=bundle(),
            evaluator_id="missing",
            evaluator_version="9.9",
            artifact_manifest=[],
        )
        result = replay_receipt(self.connection, receipt["receipt_id"], {})
        self.assertFalse(result["ok"])
        self.assertIn("EVALUATOR_NOT_AVAILABLE", result["failure_codes"])
        stored = self.connection.execute(
            "SELECT ok,failure_codes_json FROM replay_attempts_v2 WHERE receipt_id=?",
            (receipt["receipt_id"],),
        ).fetchone()
        self.assertEqual(stored["ok"], 0)
        self.assertIn("EVALUATOR_NOT_AVAILABLE", stored["failure_codes_json"])

    def test_replay_of_missing_receipt_is_itself_recorded(self):
        result = replay_receipt(self.connection, "REC-V2-DOES-NOT-EXIST-000000", {})
        self.assertFalse(result["ok"])
        self.assertIn("RECEIPT_NOT_FOUND", result["failure_codes"])
        stored = self.connection.execute(
            "SELECT requested_receipt_id,failure_code FROM replay_lookup_failures_v2 WHERE requested_receipt_id=?",
            ("REC-V2-DOES-NOT-EXIST-000000",),
        ).fetchone()
        self.assertIsNotNone(stored)
        self.assertEqual(stored["failure_code"], "RECEIPT_NOT_FOUND")

    def test_replay_of_corrupt_stored_json_is_itself_recorded(self):
        # decision_receipts_v2 is append-only (triggers block UPDATE/DELETE),
        # so simulate on-disk corruption the only way it could actually occur:
        # a row inserted with unparseable JSON, bypassing commit_receipt.
        receipt_id = "REC-V2-CORRUPTJSONROWTEST"
        placeholder_hash = sha256_json({"placeholder": True})
        self.connection.execute(
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
                receipt_id,
                "decision:corrupt-json",
                "athlete:001",
                "2026-08-28T00:00:00Z",
                "2.0",
                "deterministic",
                None,
                "0" * 64,
                None,
                "not-json",
                "{}",
                placeholder_hash,
                placeholder_hash,
                placeholder_hash,
                1,
            ),
        )
        self.connection.commit()
        result = replay_receipt(self.connection, receipt_id, {})
        self.assertFalse(result["ok"])
        self.assertIn("STORED_JSON_INVALID", result["failure_codes"])
        stored = self.connection.execute(
            "SELECT ok,failure_codes_json FROM replay_attempts_v2 WHERE receipt_id=?",
            (receipt_id,),
        ).fetchone()
        self.assertIsNotNone(stored)
        self.assertEqual(stored["ok"], 0)
        self.assertIn("STORED_JSON_INVALID", stored["failure_codes_json"])

    def test_build_receipt_rejects_invalid_created_at(self):
        with self.assertRaises(ReceiptValidationError):
            build_receipt(
                decision_id="decision:bad-timestamp",
                athlete_scope_id="athlete:001",
                created_at="not-a-timestamp",
                decision_mode="deterministic",
                decision_trace=trace(),
                replay_bundle=bundle(),
                evaluator_id="identity",
                evaluator_version="1.0",
                artifact_manifest=[],
            )

    def test_build_receipt_rejects_malformed_prior_receipt_id(self):
        with self.assertRaises(ReceiptValidationError):
            build_receipt(
                decision_id="decision:bad-prior-id",
                athlete_scope_id="athlete:001",
                created_at="2026-08-28T00:00:00Z",
                decision_mode="deterministic",
                decision_trace=trace(),
                replay_bundle=bundle(),
                evaluator_id="identity",
                evaluator_version="1.0",
                artifact_manifest=[],
                prior_receipt_id="not-a-real-receipt-id",
                previous_receipt_hash=sha256_json({"whatever": True}),
            )

    def test_build_receipt_rejects_artifact_with_unexpected_field(self):
        model = {"model_id": "M-1", "version": "1.0"}
        manifest = [
            {
                "artifact_id": "M-1",
                "artifact_type": "model",
                "version": "1.0",
                "artifact_hash": sha256_json(model),
                "trust_origin": "human_promoted_verified",
            }
        ]
        with self.assertRaises(ReceiptValidationError):
            build_receipt(
                decision_id="decision:extra-artifact-field",
                athlete_scope_id="athlete:001",
                created_at="2026-08-28T00:00:00Z",
                decision_mode="deterministic",
                decision_trace=trace(),
                replay_bundle={
                    "bundle_version": "2.0",
                    "inputs": {"expected_trace": trace()},
                    "frozen_artifacts": {"M-1": model},
                    "frozen_llm_response": None,
                },
                evaluator_id="identity",
                evaluator_version="1.0",
                artifact_manifest=manifest,
            )

    def test_build_receipt_rejects_llm_contribution_missing_model_id(self):
        response = {"provider": "gemma", "mode": "lead_fallback", "proposed_action": "hold"}
        bad_contribution = contribution(response)
        del bad_contribution["model_id"]
        with self.assertRaises(ReceiptValidationError):
            build_receipt(
                decision_id="decision:llm-missing-model-id",
                athlete_scope_id="athlete:001",
                created_at="2026-08-28T00:00:00Z",
                decision_mode="lead_fallback",
                decision_trace=trace(),
                replay_bundle=bundle(llm_response=response),
                evaluator_id="identity",
                evaluator_version="1.0",
                artifact_manifest=[],
                llm_contribution=bad_contribution,
            )

    def test_build_receipt_rejects_llm_contribution_unexpected_field(self):
        response = {"provider": "gemma", "mode": "lead_fallback", "proposed_action": "hold"}
        bad_contribution = contribution(response)
        bad_contribution["extra_debug_field"] = "not allowed"
        with self.assertRaises(ReceiptValidationError):
            build_receipt(
                decision_id="decision:llm-extra-field",
                athlete_scope_id="athlete:001",
                created_at="2026-08-28T00:00:00Z",
                decision_mode="lead_fallback",
                decision_trace=trace(),
                replay_bundle=bundle(llm_response=response),
                evaluator_id="identity",
                evaluator_version="1.0",
                artifact_manifest=[],
                llm_contribution=bad_contribution,
            )

    def test_build_receipt_rejects_duplicate_reason_codes(self):
        bad_trace = trace()
        bad_trace["reason_codes"] = ["SAME", "SAME"]
        with self.assertRaises(ReceiptValidationError):
            build_receipt(
                decision_id="decision:dup-reason-codes",
                athlete_scope_id="athlete:001",
                created_at="2026-08-28T00:00:00Z",
                decision_mode="deterministic",
                decision_trace=bad_trace,
                replay_bundle=bundle(expected_trace=bad_trace),
                evaluator_id="identity",
                evaluator_version="1.0",
                artifact_manifest=[],
            )

    def test_build_receipt_rejects_empty_final_decision(self):
        bad_trace = trace()
        bad_trace["final_decision"] = {}
        with self.assertRaises(ReceiptValidationError):
            build_receipt(
                decision_id="decision:empty-final-decision",
                athlete_scope_id="athlete:001",
                created_at="2026-08-28T00:00:00Z",
                decision_mode="deterministic",
                decision_trace=bad_trace,
                replay_bundle=bundle(expected_trace=bad_trace),
                evaluator_id="identity",
                evaluator_version="1.0",
                artifact_manifest=[],
            )


if __name__ == "__main__":
    unittest.main()
