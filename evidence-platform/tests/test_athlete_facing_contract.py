"""Phase 7: the one narrow view of a decision receipt an athlete-facing
consumer may ever see (platform_core/athlete_facing_contract.py).

Colocated with the module it tests, per this project's own "tests/ is the
historical dumping ground for this repo's tests, stays here rather than
moving" convention (see tests/test_five_system_engines.py).
"""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from platform_core.athlete_facing_contract import (
    AthleteConsumerContractError,
    to_athlete_facing_update,
)
from platform_core.db import connect, migrate
from platform_core.decision import decide
from platform_core.engines import run_all

REAL_SNAPSHOT = {"athlete_id": "REAL-ATHLETE-1", "as_of": "2026-01-01T00:00:00Z"}
ALLOWED_KEYS = {"has_update", "action"}


class MalformedInputTests(unittest.TestCase):
    def test_non_mapping_is_rejected(self):
        with self.assertRaises(AthleteConsumerContractError):
            to_athlete_facing_update("not a receipt")

    def test_missing_action_is_rejected(self):
        with self.assertRaises(AthleteConsumerContractError):
            to_athlete_facing_update({"final_decision": {"committed_change": False}})

    def test_missing_final_decision_is_rejected(self):
        with self.assertRaises(AthleteConsumerContractError):
            to_athlete_facing_update({"action": "hold"})

    def test_final_decision_without_committed_change_is_rejected(self):
        with self.assertRaises(AthleteConsumerContractError):
            to_athlete_facing_update({"action": "hold", "final_decision": {}})

    def test_non_bool_committed_change_is_rejected_not_truthiness_tested(self):
        # bool("false") is True in Python - a truthiness check here would
        # silently misread this as "has an update".
        for bad_value in ("false", "0", 0, 1, {}, [], None):
            with self.subTest(committed_change=bad_value):
                with self.assertRaises(AthleteConsumerContractError):
                    to_athlete_facing_update({"action": "hold", "final_decision": {"committed_change": bad_value}})


class MinimalFixtureTests(unittest.TestCase):
    def test_no_committed_change_yields_no_update(self):
        result = to_athlete_facing_update(
            {"action": "abstain", "final_decision": {"committed_change": False}}
        )
        self.assertEqual(result, {"has_update": False, "action": None})
        self.assertEqual(set(result), ALLOWED_KEYS)

    def test_committed_change_yields_the_action(self):
        result = to_athlete_facing_update(
            {"action": "hold", "final_decision": {"committed_change": True}}
        )
        self.assertEqual(result, {"has_update": True, "action": "hold"})
        self.assertEqual(set(result), ALLOWED_KEYS)


class RealReceiptTests(unittest.TestCase):
    """Exercises the boundary against real receipts from decide(), not just
    hand-built fixtures - proving internal fields never leak through."""

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.connection = connect(Path(self.temp.name) / "evidence.db")
        migrate(self.connection)

    def tearDown(self):
        self.connection.close()
        self.temp.cleanup()

    def test_real_abstaining_receipt_yields_no_update(self):
        outputs = run_all(REAL_SNAPSHOT)
        receipt = decide(self.connection, REAL_SNAPSHOT, outputs)
        self.assertEqual(receipt["action"], "abstain")  # sanity: this is really an abstain
        result = to_athlete_facing_update(receipt)
        self.assertEqual(result, {"has_update": False, "action": None})

    def test_real_engine_candidate_receipt_exposes_only_the_action(self):
        snapshot = {
            "fixture": "synthetic_test_only",
            "athlete_id": "PHASE7-CONTRACT",
            "as_of": "2026-01-01T00:00:00Z",
            "synthetic_directives": {"strength": {"action": "trim"}},
        }
        outputs = run_all(snapshot)
        receipt = decide(self.connection, snapshot, outputs)
        self.assertIn("ENGINE_CANDIDATE_APPLIED", receipt["reason_codes"])  # sanity on the fixture

        result = to_athlete_facing_update(receipt)
        self.assertEqual(result, {"has_update": True, "action": "trim"})
        self.assertEqual(set(result), ALLOWED_KEYS)
        # The whole point: nothing from the receipt's own audit trail leaks through.
        for leaked_field in ("reason_codes", "candidate_ledger", "decision_trace", "receipt_hash", "model_ids"):
            self.assertNotIn(leaked_field, result)


if __name__ == "__main__":
    unittest.main()
