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

    def test_incomplete_output_fails_shared_contract_instead_of_crashing_state_builder(self):
        # A caller-built dict missing fields make_output always includes
        # (engine_version, status, ...) must fail validate_engine_output
        # cleanly, not reach build_whole_athlete_state and KeyError there.
        incomplete = {
            "system": "strength",
            "proposed_actions": [{"action": "abstain", "source_system": "strength"}],
            "confidence": 0.0,
        }
        with self.assertRaises(EngineInputError):
            validate_engine_output(incomplete, "strength")

    def test_status_and_synthetic_flag_must_agree(self):
        mismatched = dict(run_all(REAL_SNAPSHOT)["strength"])
        mismatched["synthetic_test_only"] = True  # status still says inactive_no_approved_model
        with self.assertRaises(EngineInputError):
            validate_engine_output(mismatched, "strength")

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


class EndToEndFiveEngineToDecisionTests(unittest.TestCase):
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


class EngineScopedModelTests(unittest.TestCase):
    """Phase 3/4: every engine can load its OWN active, hash-verified model,
    entirely separate from BIG MAC's own pool (runtime_artifacts.system
    IS NULL). No real model exists yet - only the seam is proven here,
    using synthetic-only content, per the Constitution's synthetic-fixture
    allowance. Phase 3 proved this for strength only; Phase 4 generalized
    the seam (common.run_generic_engine) to all five, so these tests are
    parametrized across DOMAIN_NAMES rather than hardcoded to strength.
    """

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.connection = connect(Path(self.temp.name) / "evidence.db")
        migrate(self.connection)

    def tearDown(self):
        self.connection.close()
        self.temp.cleanup()

    def _register_model(self, *, system, artifact_id, payload, trust_origin="human_promoted_verified",
                         llm_tainted=0, deterministic=1, status="active"):
        import hashlib
        model_path = Path(self.temp.name) / f"{artifact_id}.json"
        model_path.write_text(json.dumps(payload))
        artifact_hash = hashlib.sha256(model_path.read_bytes()).hexdigest()
        self.connection.execute(
            "INSERT INTO runtime_artifacts(artifact_id,artifact_type,version,artifact_path,artifact_hash,"
            "trust_origin,llm_tainted,deterministic,status,approval_event_id,rollback_artifact_id,activated_at,system) "
            "VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (artifact_id, "model", "1.0", str(model_path), artifact_hash, trust_origin, llm_tainted,
             deterministic, status, "PROMO-TEST", None, "now", system),
        )
        self.connection.commit()

    @staticmethod
    def _module_for(system):
        from platform_core.engines import conditioning, coordinator, nutrition, recovery, strength
        return {
            "strength": strength, "conditioning": conditioning, "nutrition": nutrition,
            "recovery": recovery, "coordinator": coordinator,
        }[system]

    def test_every_engine_abstains_when_no_model_registered_even_with_db(self):
        for system in DOMAIN_NAMES:
            with self.subTest(system=system):
                output = self._module_for(system).evaluate(REAL_SNAPSHOT, self.connection)
                self.assertEqual(output["proposed_actions"][0]["action"], "abstain")
                self.assertIn("NO_APPROVED_MODEL", output["reason_codes"])

    def test_every_engine_applies_its_own_registered_synthetic_model(self):
        for system in DOMAIN_NAMES:
            with self.subTest(system=system):
                self._register_model(
                    system=system, artifact_id=f"{system.upper()}-TEST-MODEL",
                    payload={"synthetic_test_only": True, "synthetic_directive": {"action": "hold"}, "confidence": 0.5},
                )
                output = self._module_for(system).evaluate(REAL_SNAPSHOT, self.connection)
                self.assertEqual(output["proposed_actions"][0]["action"], "hold")
                self.assertIn("ENGINE_SCOPED_MODEL_APPLIED", output["reason_codes"])
                self.assertTrue(output["synthetic_test_only"])

    def test_every_engine_abstains_honestly_for_a_real_unimplemented_model(self):
        for system in DOMAIN_NAMES:
            with self.subTest(system=system):
                self._register_model(
                    system=system, artifact_id=f"{system.upper()}-REAL-MODEL",
                    payload={"synthetic_test_only": False, "some_future_rule_param": 1},
                )
                output = self._module_for(system).evaluate(REAL_SNAPSHOT, self.connection)
                self.assertEqual(output["proposed_actions"][0]["action"], "abstain")
                self.assertIn("ACTIVE_MODEL_APPLICATION_NOT_YET_IMPLEMENTED", output["reason_codes"])

    def test_every_engine_surfaces_untrusted_artifact_rather_than_silently_ignoring(self):
        for system in DOMAIN_NAMES:
            with self.subTest(system=system):
                self._register_model(
                    system=system, artifact_id=f"{system.upper()}-TAINTED-MODEL",
                    payload={"synthetic_test_only": True, "synthetic_directive": {"action": "hold"}},
                    llm_tainted=1,
                )
                output = self._module_for(system).evaluate(REAL_SNAPSHOT, self.connection)
                self.assertEqual(output["proposed_actions"][0]["action"], "abstain")
                self.assertTrue(any("UNTRUSTED_RUNTIME_ARTIFACT" in code for code in output["reason_codes"]))

    def test_a_model_scoped_to_another_system_never_leaks_into_strength(self):
        from platform_core.engines import strength
        self._register_model(
            system="nutrition", artifact_id="NUTRITION-TEST-MODEL",
            payload={"synthetic_test_only": True, "synthetic_directive": {"action": "hold"}},
        )
        output = strength.evaluate(REAL_SNAPSHOT, self.connection)
        self.assertEqual(output["proposed_actions"][0]["action"], "abstain")
        self.assertIn("NO_APPROVED_MODEL", output["reason_codes"])

    def test_a_strength_scoped_model_never_leaks_into_big_macs_own_pool(self):
        from platform_core.decision import load_runtime_models
        self._register_model(
            system="strength", artifact_id="STRENGTH-ONLY-MODEL",
            payload={"synthetic_test_only": True, "synthetic_directive": {"action": "hold"}},
        )
        models, errors = load_runtime_models(self.connection)
        self.assertEqual(models, [])
        self.assertEqual(errors, [])

    def test_run_all_threads_db_through_to_every_engine_independently(self):
        # Only strength and nutrition get a registered model; conditioning,
        # recovery and coordinator must still abstain independently, proving
        # run_all's db threading is per-system, not all-or-nothing.
        self._register_model(
            system="strength", artifact_id="STRENGTH-RUNALL-MODEL",
            payload={"synthetic_test_only": True, "synthetic_directive": {"action": "hold"}},
        )
        self._register_model(
            system="nutrition", artifact_id="NUTRITION-RUNALL-MODEL",
            payload={"synthetic_test_only": True, "synthetic_directive": {"action": "modify"}},
        )
        outputs = run_all(REAL_SNAPSHOT, self.connection)
        self.assertEqual(outputs["strength"]["proposed_actions"][0]["action"], "hold")
        self.assertEqual(outputs["nutrition"]["proposed_actions"][0]["action"], "modify")
        for system in DOMAIN_NAMES - {"strength", "nutrition"}:
            self.assertEqual(outputs[system]["proposed_actions"][0]["action"], "abstain")
            self.assertIn("NO_APPROVED_MODEL", outputs[system]["reason_codes"])

    def test_load_active_engine_model_rejects_unknown_system(self):
        from platform_core.engines.common import load_active_engine_model
        with self.assertRaises(EngineInputError):
            load_active_engine_model(self.connection, "not_a_real_system")


if __name__ == "__main__":
    unittest.main()
