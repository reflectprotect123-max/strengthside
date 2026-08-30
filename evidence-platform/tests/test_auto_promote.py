"""Auto-promotion tests for shipped product-engine models."""

from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from platform_core.auto_promote import (
    AUTO_PROMOTED_TRUST_ORIGIN,
    auto_promote_product_engines,
    ensure_auto_promoted,
    is_bootstrapped,
)
from platform_core.db import connect, migrate
from platform_core.decision import decide
from platform_core.engines import run_all
from platform_core.athlete_facing_contract import to_athlete_facing_update
from platform_core.product_engines import run_all as product_run_all
from platform_core.runtime_artifacts import load_trusted_model_artifacts

REAL_SNAPSHOT = {
    "athlete_id": "AUTO-PROMOTE-SMOKE",
    "as_of": "2026-08-30T12:00:00Z",
    "strength_domain": {"session_id": "s1", "session_pain": "none"},
    "conditioning_domain": {"last_delta": 1, "sessions_completed": 2},
    "recovery_domain": {
        "illness": False,
        "posture": {"band": "build", "gate": "ok", "reasonCodes": ["checkin_ok"]},
    },
    "nutrition_domain": {"days_logged": 5, "days_in_window": 7, "low_energy_flag": False},
    "coordinator_domain": {
        "headline": "Steady week",
        "reason_codes": ["coordinator_steady"],
        "items": [{"domain": "strength", "kind": "maintain", "message": "ok", "silentApply": True}],
    },
}


class AutoPromoteTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.connection = connect(Path(self.temp.name) / "evidence.db")
        migrate(self.connection)
        self.artifacts_root = Path(self.temp.name) / "runtime"

    def tearDown(self):
        self.connection.close()
        self.temp.cleanup()

    def test_product_engines_propose_non_abstain(self):
        outputs = product_run_all(REAL_SNAPSHOT)
        for system, output in outputs.items():
            action = output["proposed_actions"][0]["action"]
            self.assertNotEqual(action, "abstain", f"{system} should propose via product engines")
            self.assertFalse(output["synthetic_test_only"])

    def test_auto_promote_registers_five_active_models(self):
        result = auto_promote_product_engines(self.connection, self.artifacts_root)
        self.assertEqual(result["status"], "auto_promoted")
        self.assertTrue(is_bootstrapped(self.connection))
        for system in ("strength", "conditioning", "nutrition", "recovery", "coordinator"):
            models, errors = load_trusted_model_artifacts(self.connection, system=system)
            self.assertEqual(errors, [], system)
            self.assertEqual(len(models), 1, system)
            self.assertTrue(models[0]["product_engine"])

    def test_auto_promoted_models_drive_engine_outputs(self):
        auto_promote_product_engines(self.connection, self.artifacts_root)
        outputs = run_all(REAL_SNAPSHOT, self.connection)
        for system in ("strength", "conditioning", "nutrition", "recovery", "coordinator"):
            proposed = outputs[system]["proposed_actions"][0]
            self.assertNotEqual(proposed["action"], "abstain", system)
            self.assertIn("AUTO_PROMOTED_PRODUCT_ENGINE", outputs[system]["reason_codes"])

    def test_decide_applies_engine_candidate_from_auto_promoted_models(self):
        auto_promote_product_engines(self.connection, self.artifacts_root)
        outputs = run_all(
            {**REAL_SNAPSHOT, "trigger_domain": "strength"},
            self.connection,
        )
        receipt = decide(self.connection, {**REAL_SNAPSHOT, "trigger_domain": "strength"}, outputs)
        self.assertNotEqual(receipt["action"], "abstain")
        facing = to_athlete_facing_update(receipt)
        self.assertTrue(facing["has_update"])

    def test_ensure_auto_promoted_is_idempotent(self):
        first = ensure_auto_promoted(self.connection, self.artifacts_root)
        second = ensure_auto_promoted(self.connection, self.artifacts_root)
        self.assertEqual(first["status"], "auto_promoted")
        self.assertEqual(second["status"], "already_bootstrapped")
        count = self.connection.execute(
            "SELECT COUNT(*) n FROM runtime_artifacts WHERE trust_origin=? AND status='active'",
            (AUTO_PROMOTED_TRUST_ORIGIN,),
        ).fetchone()["n"]
        self.assertEqual(count, 5)

    def test_artifact_files_are_written_and_hash_verified(self):
        result = auto_promote_product_engines(self.connection, self.artifacts_root)
        for item in result["artifacts"]:
            path = Path(item["path"])
            self.assertTrue(path.is_file())
            payload = json.loads(path.read_text(encoding="utf-8"))
            self.assertTrue(payload["product_engine"])
            self.assertEqual(payload["system"], item["system"])
            self.assertTrue(payload["auto_promoted"])


if __name__ == "__main__":
    unittest.main()
