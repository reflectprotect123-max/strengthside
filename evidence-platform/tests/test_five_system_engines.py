"""Phase 1: the five contract-complete engine shells and Whole-Athlete State.

Colocated with the shared contract they exercise (platform_core/engines/),
per the "tests are colocated with the module they mostly exercise" rule this
project inherits from strengthside's own CLAUDE.md - this repo's tests/ is
also the historical dumping ground, so it stays here rather than moving.
"""

from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

import jsonschema

from platform_core.db import connect, migrate
from platform_core.decision import decide
from platform_core.engines import ALLOWED_ACTIONS, DOMAIN_NAMES, EngineInputError, run_all
from platform_core.engines.common import validate_engine_output
from platform_core.whole_athlete_state import ReceiptValidationError, build_whole_athlete_state

ROOT = Path(__file__).parents[1]

REAL_SNAPSHOT = {"athlete_id": "REAL-ATHLETE-1", "as_of": "2026-01-01T00:00:00Z"}
SYNTHETIC_SNAPSHOT = {
    "fixture": "synthetic_test_only",
    "athlete_id": "SYNTHETIC-ATHLETE",
    "as_of": "2026-01-01T00:00:00Z",
    "synthetic_directives": {
        name: {"action": "hold", "confidence": 0.4} for name in DOMAIN_NAMES
    },
}


class FiveSystemEngineTests(unittest.TestCase):
    def test_all_five_engines_abstain_on_real_input(self):
        outputs = run_all(REAL_SNAPSHOT)
        self.assertEqual(set(outputs), set(DOMAIN_NAMES))
        for name, output in outputs.items():
            self.assertEqual(output["system"], name)
            self.assertEqual(output["status"], "inactive_no_approved_model")
            self.assertFalse(output["synthetic_test_only"])
            self.assertEqual(output["proposed_actions"][0]["action"], "abstain")
            self.assertIn("NO_APPROVED_MODEL", output["reason_codes"])
            validate_engine_output(output, name)  # must satisfy the shared contract

    def test_all_five_engines_honor_synthetic_directive(self):
        outputs = run_all(SYNTHETIC_SNAPSHOT)
        for name, output in outputs.items():
            self.assertTrue(output["synthetic_test_only"])
            self.assertEqual(output["proposed_actions"][0]["action"], "hold")
            self.assertIn("SYNTHETIC_TEST_ONLY", output["reason_codes"])

    def test_engine_rejects_invalid_snapshot(self):
        from platform_core.engines import strength
        with self.assertRaises(EngineInputError):
            strength.evaluate({})
        with self.assertRaises(EngineInputError):
            strength.evaluate({"athlete_id": "A", "as_of": "not-a-timestamp"})

    def test_engines_are_independent_of_each_other(self):
        # Each engine only ever sees the snapshot, never another domain's output.
        outputs = run_all(REAL_SNAPSHOT)
        for name in DOMAIN_NAMES:
            other_names = DOMAIN_NAMES - {name}
            for other in other_names:
                self.assertNotIn(other, json.dumps(outputs[name]))

    def test_invalid_action_fails_shared_contract(self):
        bad = dict(run_all(REAL_SNAPSHOT)["strength"])
        bad["proposed_actions"] = [dict(bad["proposed_actions"][0], action="not_a_real_action")]
        with self.assertRaises(EngineInputError):
            validate_engine_output(bad, "strength")
        self.assertNotIn("not_a_real_action", ALLOWED_ACTIONS)


class WholeAthleteStateTests(unittest.TestCase):
    def setUp(self):
        self.schema = json.loads((ROOT / "schemas/athlete-state.schema.json").read_text())

    def test_build_from_real_engine_outputs_matches_schema(self):
        outputs = run_all(REAL_SNAPSHOT)
        state = build_whole_athlete_state(
            outputs,
            snapshot_id="WAS-TEST-REAL",
            observed_at="2026-01-01T00:00:00Z",
            athlete_scope_id=REAL_SNAPSHOT["athlete_id"],
        )
        jsonschema.Draft202012Validator(self.schema).validate(state)
        self.assertEqual(state["data_quality"]["overall"], "low")
        self.assertEqual(set(state["domains"]), set(DOMAIN_NAMES))
        self.assertNotIn(REAL_SNAPSHOT["athlete_id"], json.dumps(state))  # hashed, never raw

    def test_build_from_synthetic_engine_outputs_matches_schema(self):
        outputs = run_all(SYNTHETIC_SNAPSHOT)
        state = build_whole_athlete_state(
            outputs, snapshot_id="WAS-TEST-SYNTH", observed_at="2026-01-01T00:00:00Z"
        )
        jsonschema.Draft202012Validator(self.schema).validate(state)
        self.assertEqual(state["data_quality"]["overall"], "synthetic_test")
        self.assertNotIn("athlete_id_hash", state)  # no athlete_scope_id given

    def test_state_hash_is_content_addressed(self):
        outputs = run_all(REAL_SNAPSHOT)
        first = build_whole_athlete_state(outputs, snapshot_id="WAS-A", observed_at="2026-01-01T00:00:00Z")
        second = build_whole_athlete_state(outputs, snapshot_id="WAS-A", observed_at="2026-01-01T00:00:00Z")
        self.assertEqual(first["state_hash"], second["state_hash"])
        third = build_whole_athlete_state(outputs, snapshot_id="WAS-B", observed_at="2026-01-01T00:00:00Z")
        self.assertNotEqual(first["state_hash"], third["state_hash"])

    def test_rejects_missing_domain(self):
        outputs = run_all(REAL_SNAPSHOT)
        del outputs["coordinator"]
        with self.assertRaises(ReceiptValidationError):
            build_whole_athlete_state(outputs, snapshot_id="WAS-BAD", observed_at="2026-01-01T00:00:00Z")

    def test_hard_constraints_are_aggregated(self):
        outputs = run_all(REAL_SNAPSHOT)
        strength = dict(outputs["strength"])
        strength["constraints"] = [{"level": "hard", "reason_code": "TEST_HARD_LIMIT"}]
        outputs = {**outputs, "strength": strength}
        state = build_whole_athlete_state(outputs, snapshot_id="WAS-C", observed_at="2026-01-01T00:00:00Z")
        self.assertEqual(len(state["hard_constraints"]), 1)
        self.assertEqual(state["hard_constraints"][0]["reason_code"], "TEST_HARD_LIMIT")


class EndToEndFivEngineToDecisionTests(unittest.TestCase):
    """Phase 1 gate: end-to-end synthetic operation without internet or LLM;
    malformed inputs rejected; real inputs abstain (ROADMAP_TO_V1.md)."""

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.connection = connect(Path(self.temp.name) / "evidence.db")
        migrate(self.connection)

    def tearDown(self):
        self.connection.close()
        self.temp.cleanup()

    def test_real_snapshot_through_all_five_engines_abstains(self):
        outputs = run_all(REAL_SNAPSHOT)
        receipt = decide(self.connection, REAL_SNAPSHOT, outputs)
        self.assertEqual(receipt["action"], "abstain")
        self.assertTrue(receipt["silent_apply_allowed"])
        self.assertFalse(receipt["user_facing_explanation_emitted"])

    def test_synthetic_snapshot_through_all_five_engines_holds_with_synthetic_model(self):
        outputs = run_all(SYNTHETIC_SNAPSHOT)
        model = {"model_id": "SYNTH-MODEL", "version": "0.0.1", "synthetic_test_only": True}
        receipt = decide(self.connection, SYNTHETIC_SNAPSHOT, outputs, [model], persist=True)
        self.assertEqual(receipt["action"], "hold")

    def test_malformed_engine_output_is_rejected_end_to_end(self):
        outputs = run_all(REAL_SNAPSHOT)
        malformed = dict(outputs)
        malformed["strength"] = {"not": "an engine output"}
        with self.assertRaises(ValueError):
            decide(self.connection, REAL_SNAPSHOT, malformed)

    def test_cli_simulate_runs_all_five_engines_when_outputs_omitted(self):
        from platform_core.cli import main
        snapshot_path = Path(self.temp.name) / "snapshot.json"
        snapshot_path.write_text(json.dumps(REAL_SNAPSHOT))
        db_path = Path(self.temp.name) / "cli.db"
        import contextlib, io
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            main(["--db", str(db_path), "simulate", "--snapshot", str(snapshot_path)])
        receipt = json.loads(out.getvalue())
        self.assertEqual(receipt["action"], "abstain")


if __name__ == "__main__":
    unittest.main()
