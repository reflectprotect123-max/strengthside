"""Phase 2: BIG MAC's bounded Gemini/Gemma lead-fallback gateway.

Zero live network calls anywhere in this file - MockProvider only.
Colocated with platform_core/llm/ and llm_adapters/, the modules it exercises.
"""

from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from platform_core.db import connect, migrate
from platform_core.decision import decide, replay
from platform_core.engines import run_all
from platform_core.llm import contracts, envelope, gateway, packet_builder
from platform_core.llm.orchestrate import attempt_lead_fallback
from platform_core.llm.response_builder import ResponseMappingError, build_llm_decision_response
from platform_core.llm.router import RoutingPolicy
from platform_core.receipt_replay import ReceiptValidationError, sha256_json
from platform_core.whole_athlete_state import build_whole_athlete_state
from llm_adapters.mock import MockProvider

ROOT = Path(__file__).parents[1]
REAL_SNAPSHOT = {"athlete_id": "REAL-ATHLETE-1", "as_of": "2026-01-01T00:00:00Z"}


def _plan_ref(plan_id="PLAN-1"):
    return {"plan_id": plan_id, "plan_version": "1.0", "plan_hash": sha256_json({"plan": plan_id})}


def _policy_refs():
    return [{"policy_id": "POLICY-SAFETY-BASE", "version": "1.0", "policy_hash": sha256_json({"p": 1})}]


def _privacy_projection(*, provider_scope="local_gemma", consent_record_id=None):
    body = {
        "projection_id": "PROJECTION-1",
        "provider_scope": provider_scope,
        "identifiable_data_allowed": provider_scope != "no_llm",
        "sensitive_data_allowed": False,
        "excluded_field_paths": [],
        "consent_record_id": consent_record_id,
    }
    return {**body, "projection_hash": sha256_json(body)}


def _envelope():
    body = {
        "envelope_id": "ENVELOPE-STRENGTH-1",
        "version": "1.0",
        "allowed_action_types": ["bounded_increase", "hold_progression", "abstain"],
        "allowed_target_types": ["strength_session"],
        "metric_bounds": [{"metric_key": "load_kg", "unit": "kg", "minimum": 0, "maximum": 5}],
        "forbidden_combinations": [],
        "required_validator_ids": ["VALIDATOR-BASELINE"],
        "rollback_policy_id": "ROLLBACK-DEFAULT",
    }
    return {**body, "envelope_hash": sha256_json(body)}


def _packet_kwargs():
    domain_outputs = run_all(REAL_SNAPSHOT)
    whole_state = build_whole_athlete_state(
        domain_outputs, snapshot_id="WAS-TEST", observed_at="2026-01-01T00:00:00Z"
    )
    return {
        "domain_outputs": domain_outputs,
        "whole_athlete_state": whole_state,
        "current_plan": _plan_ref(),
        "privacy_projection": _privacy_projection(),
        "policy_refs": _policy_refs(),
    }


def _minimal_llm_json(action_type="bounded_increase", **overrides):
    body = {
        "action_type": action_type,
        "target_domain": "strength",
        "target_type": "strength_session",
        "target_id": "SESSION-TODAY",
        "metric_key": "load_kg",
        "operation": "increase_by",
        "value": 2.5,
        "unit": "kg",
        "rationale": "Evidence supports a small load increase given recent recovery.",
        "confidence": "medium",
    }
    body.update(overrides)
    return json.dumps(body)


class ContractValidatorTests(unittest.TestCase):
    def test_valid_envelope_and_privacy_projection_round_trip(self):
        contracts.validate_fallback_action_envelope(_envelope())
        contracts.validate_privacy_projection(_privacy_projection())

    def test_privacy_projection_rejects_bad_provider_scope(self):
        bad = dict(_privacy_projection())
        bad["provider_scope"] = "public_internet"
        with self.assertRaises(ReceiptValidationError):
            contracts.validate_privacy_projection(bad)

    def test_complete_decision_packet_round_trips(self):
        packet = packet_builder.build_complete_decision_packet(
            packet_id="PACKET-TEST-1",
            decision_id="DEC-TEST-1",
            athlete_scope_id="ATHLETE-1",
            created_at="2026-01-01T00:00:00Z",
            **_packet_kwargs(),
        )
        self.assertEqual(packet["trigger"], "no_deterministic_answer")
        self.assertEqual(len(packet["packet_hash"]), 64)

    def test_llm_decision_request_requires_matching_trigger(self):
        packet = packet_builder.build_complete_decision_packet(
            packet_id="PACKET-TEST-2", decision_id="DEC-TEST-2", athlete_scope_id="ATHLETE-1",
            created_at="2026-01-01T00:00:00Z", **_packet_kwargs(),
        )
        request = packet_builder.build_llm_decision_request(
            request_id="REQ-TEST-1", lead_provider="gemma", routing_policy_id="POLICY-1",
            routing_policy_version="1.0", decision_packet=packet, fallback_action_envelope=_envelope(),
            requested_at="2026-01-01T00:00:01Z",
        )
        self.assertEqual(request["trigger_code"], "NO_DETERMINISTIC_ANSWER")


class EnvelopeEnforcementTests(unittest.TestCase):
    def _candidate(self, **overrides):
        body = {
            "kind": "action_candidate", "candidate_id": "CAND-1", "source": "gemma",
            "authority_mode": "lead_fallback", "action_type": "bounded_increase",
            "target": {"domain": "strength", "target_type": "strength_session", "target_id": "S-1"},
            "changes": [{"metric_key": "load_kg", "operation": "increase_by", "value": 2.5, "unit": "kg"}],
            "preconditions": [], "constraints_acknowledged": [], "expected_effects": [],
            "resource_demands": [], "support_tags": [], "interference_tags": [],
            "uncertainty": {"representation": "none_declared"},
            "provenance": [{"provenance_id": "PROV-1", "record_type": "llm_output", "record_hash": sha256_json({"x": 1})}],
            "expires_at": None, "fallback_envelope_id": "ENVELOPE-STRENGTH-1",
        }
        body.update(overrides)
        return body

    def test_clean_candidate_has_no_violations(self):
        self.assertEqual(envelope.validate_candidate_against_envelope(self._candidate(), _envelope()), [])

    def test_action_type_outside_envelope_is_rejected(self):
        candidate = self._candidate(action_type="substitute")
        violations = envelope.validate_candidate_against_envelope(candidate, _envelope())
        self.assertIn("ACTION_TYPE_NOT_IN_ENVELOPE", violations)

    def test_target_type_outside_envelope_is_rejected(self):
        candidate = self._candidate(target={"domain": "strength", "target_type": "plan", "target_id": "P-1"})
        violations = envelope.validate_candidate_against_envelope(candidate, _envelope())
        self.assertIn("TARGET_TYPE_NOT_IN_ENVELOPE", violations)

    def test_metric_out_of_bounds_is_rejected(self):
        candidate = self._candidate(changes=[{"metric_key": "load_kg", "operation": "increase_by", "value": 999, "unit": "kg"}])
        violations = envelope.validate_candidate_against_envelope(candidate, _envelope())
        self.assertIn("METRIC_OUT_OF_BOUNDS:load_kg", violations)

    def test_envelope_id_mismatch_is_rejected(self):
        candidate = self._candidate(fallback_envelope_id="SOME-OTHER-ENVELOPE")
        violations = envelope.validate_candidate_against_envelope(candidate, _envelope())
        self.assertIn("FALLBACK_ENVELOPE_ID_MISMATCH", violations)

    def test_malformed_candidate_reported_not_crashed(self):
        violations = envelope.validate_candidate_against_envelope({"not": "a candidate"}, _envelope())
        self.assertTrue(any(v.startswith("CANDIDATE_MALFORMED") for v in violations))


class GatewayFailoverTests(unittest.TestCase):
    def test_lead_success_never_touches_backup(self):
        calls = []
        lead = MockProvider(respond=lambda r: calls.append("lead") or {"content": "ok"})
        backup = MockProvider(respond=lambda r: calls.append("backup") or {"content": "unused"})
        response, failures = gateway.call_with_fallback(lead=lead, backup=backup, request={})
        self.assertEqual(response, {"content": "ok"})
        self.assertEqual(failures, [])
        self.assertEqual(calls, ["lead"])

    def test_lead_fails_backup_succeeds(self):
        lead = MockProvider(raises=RuntimeError("lead down"))
        backup = MockProvider(response={"content": "backup answered"})
        response, failures = gateway.call_with_fallback(lead=lead, backup=backup, request={})
        self.assertEqual(response, {"content": "backup answered"})
        self.assertEqual(len(failures), 1)
        self.assertTrue(failures[0].startswith("LEAD_PROVIDER_FAILED"))

    def test_both_fail_returns_none_never_raises(self):
        lead = MockProvider(raises=RuntimeError("lead down"))
        backup = MockProvider(raises=RuntimeError("backup down"))
        response, failures = gateway.call_with_fallback(lead=lead, backup=backup, request={})
        self.assertIsNone(response)
        self.assertEqual(len(failures), 2)

    def test_no_backup_configured_and_lead_fails(self):
        lead = MockProvider(raises=RuntimeError("lead down"))
        response, failures = gateway.call_with_fallback(lead=lead, backup=None, request={})
        self.assertIsNone(response)
        self.assertEqual(len(failures), 1)


class ResponseBuilderTests(unittest.TestCase):
    def _request(self):
        packet = packet_builder.build_complete_decision_packet(
            packet_id="PACKET-RB-1", decision_id="DEC-RB-1", athlete_scope_id="ATHLETE-1",
            created_at="2026-01-01T00:00:00Z", **_packet_kwargs(),
        )
        return packet_builder.build_llm_decision_request(
            request_id="REQ-RB-1", lead_provider="gemma", routing_policy_id="POLICY-1",
            routing_policy_version="1.0", decision_packet=packet, fallback_action_envelope=_envelope(),
            requested_at="2026-01-01T00:00:01Z",
        )

    def test_valid_minimal_json_maps_to_full_response(self):
        response = build_llm_decision_response(
            raw_content=_minimal_llm_json(), request=self._request(),
            provider="gemma", model_id="google/gemma-4-31b-it:free", model_version="4-31b",
        )
        self.assertEqual(response["proposed_decision"]["action_type"], "bounded_increase")
        self.assertEqual(response["proposed_decision"]["authority_mode"], "lead_fallback")
        self.assertEqual(response["write_authority"], "none")
        self.assertTrue(response["silent_user_experience"])

    def test_abstain_action_maps_cleanly_without_changes(self):
        response = build_llm_decision_response(
            raw_content=_minimal_llm_json(action_type="abstain", metric_key=None, operation=None),
            request=self._request(), provider="gemma", model_id="m", model_version="1",
        )
        self.assertEqual(response["proposed_decision"]["action_type"], "abstain")
        self.assertEqual(response["proposed_decision"]["changes"], [])

    def test_invalid_action_type_raises_mapping_error_not_crash(self):
        with self.assertRaises(ResponseMappingError):
            build_llm_decision_response(
                raw_content=_minimal_llm_json(action_type="give_them_steroids"),
                request=self._request(), provider="gemma", model_id="m", model_version="1",
            )

    def test_unparseable_output_raises_mapping_error(self):
        with self.assertRaises(ResponseMappingError):
            build_llm_decision_response(
                raw_content="I'm not going to give you JSON today.",
                request=self._request(), provider="gemma", model_id="m", model_version="1",
            )

    def test_missing_target_id_raises_mapping_error(self):
        body = json.loads(_minimal_llm_json())
        del body["target_id"]
        with self.assertRaises(ResponseMappingError):
            build_llm_decision_response(
                raw_content=json.dumps(body), request=self._request(),
                provider="gemma", model_id="m", model_version="1",
            )


class OrchestrationTests(unittest.TestCase):
    def _routing_policy(self, backup=None):
        return RoutingPolicy(policy_id="ROUTING-DEFAULT", version="1.0", lead_provider="gemma", backup_provider=backup)

    def test_successful_round_trip(self):
        lead = MockProvider(response={"content": _minimal_llm_json(), "model_id": "gemma-test", "model_version": "1.0"})
        result = attempt_lead_fallback(
            decision_id="DEC-ORCH-1", athlete_scope_id="ATHLETE-1",
            fallback_envelope=_envelope(), routing_policy=self._routing_policy(), lead=lead,
            **_packet_kwargs(),
        )
        self.assertTrue(result["ok"])
        self.assertEqual(result["llm_contribution"]["provider"], "gemma")
        self.assertEqual(result["llm_contribution"]["write_authority"], "none")
        self.assertEqual(result["action_candidate"]["action_type"], "bounded_increase")

    def test_both_providers_down_is_a_clean_failure(self):
        lead = MockProvider(raises=RuntimeError("down"))
        backup = MockProvider(raises=RuntimeError("also down"))
        result = attempt_lead_fallback(
            decision_id="DEC-ORCH-2", athlete_scope_id="ATHLETE-1",
            fallback_envelope=_envelope(), routing_policy=self._routing_policy(backup="gemini"),
            lead=lead, backup=backup, **_packet_kwargs(),
        )
        self.assertFalse(result["ok"])
        self.assertIn("LEAD_FALLBACK_FAILED", result["reason_codes"])

    def test_envelope_violation_is_a_clean_failure_not_silently_applied(self):
        # The model proposes a load increase far outside the envelope's bound (max 5kg).
        lead = MockProvider(response={"content": _minimal_llm_json(value=999)})
        result = attempt_lead_fallback(
            decision_id="DEC-ORCH-3", athlete_scope_id="ATHLETE-1",
            fallback_envelope=_envelope(), routing_policy=self._routing_policy(), lead=lead,
            **_packet_kwargs(),
        )
        self.assertFalse(result["ok"])
        self.assertIn("LEAD_FALLBACK_ENVELOPE_VIOLATION", result["reason_codes"])
        self.assertTrue(any("METRIC_OUT_OF_BOUNDS" in code for code in result["reason_codes"]))

    def test_garbage_model_output_is_a_clean_failure(self):
        lead = MockProvider(response={"content": "not json at all"})
        result = attempt_lead_fallback(
            decision_id="DEC-ORCH-4", athlete_scope_id="ATHLETE-1",
            fallback_envelope=_envelope(), routing_policy=self._routing_policy(), lead=lead,
            **_packet_kwargs(),
        )
        self.assertFalse(result["ok"])
        self.assertTrue(any("LEAD_FALLBACK_RESPONSE_INVALID" in code for code in result["reason_codes"]))


class DecisionIntegrationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.connection = connect(Path(self.temp.name) / "evidence.db")
        migrate(self.connection)

    def tearDown(self):
        self.connection.close()
        self.temp.cleanup()

    def _lead_fallback_kwargs(self, lead):
        return {
            "fallback_envelope": _envelope(),
            "routing_policy": RoutingPolicy(policy_id="ROUTING-DEFAULT", version="1.0", lead_provider="gemma"),
            "lead": lead,
            "whole_athlete_state": build_whole_athlete_state(
                run_all({"athlete_id": "REAL-ATHLETE-1", "as_of": "2026-01-01T00:00:00Z"}),
                snapshot_id="WAS-DECIDE-TEST", observed_at="2026-01-01T00:00:00Z",
            ),
            "current_plan": _plan_ref(),
            "privacy_projection": _privacy_projection(),
            "policy_refs": _policy_refs(),
        }

    def test_decide_without_lead_fallback_param_is_unchanged(self):
        snapshot = json.loads((ROOT / "fixtures/synthetic/athlete-snapshot.json").read_text())
        outputs = json.loads((ROOT / "fixtures/synthetic/five-system-outputs.json").read_text())
        receipt = decide(self.connection, snapshot, outputs)
        self.assertEqual(receipt["action"], "abstain")
        self.assertEqual(receipt["decision_mode"], "abstention")
        self.assertIsNone(receipt["llm_contribution"])

    def test_decide_with_successful_lead_fallback_produces_lead_fallback_receipt(self):
        outputs = run_all(REAL_SNAPSHOT)
        lead = MockProvider(response={"content": _minimal_llm_json()})
        receipt = decide(
            self.connection, REAL_SNAPSHOT, outputs, persist=True,
            lead_fallback=self._lead_fallback_kwargs(lead),
        )
        self.assertEqual(receipt["decision_mode"], "lead_fallback")
        self.assertEqual(receipt["action"], "bounded_increase")
        self.assertIsNotNone(receipt["llm_contribution"])
        self.assertTrue(receipt["silent_apply_allowed"])
        self.assertFalse(receipt["user_facing_explanation_emitted"])

    def test_replay_reproduces_lead_fallback_decision_without_calling_any_provider(self):
        outputs = run_all(REAL_SNAPSHOT)
        call_count = {"n": 0}

        def _respond(request):
            call_count["n"] += 1
            return {"content": _minimal_llm_json()}

        lead = MockProvider(respond=_respond)
        receipt = decide(
            self.connection, REAL_SNAPSHOT, outputs, persist=True,
            lead_fallback=self._lead_fallback_kwargs(lead),
        )
        self.assertEqual(call_count["n"], 1)
        result = replay(self.connection, receipt["receipt_id"])
        self.assertTrue(result["ok"], result.get("failure_codes"))
        self.assertEqual(call_count["n"], 1)  # replay never called the provider again

    def test_decide_with_failed_lead_fallback_still_abstains_safely(self):
        outputs = run_all(REAL_SNAPSHOT)
        lead = MockProvider(raises=RuntimeError("provider unavailable"))
        receipt = decide(
            self.connection, REAL_SNAPSHOT, outputs,
            lead_fallback=self._lead_fallback_kwargs(lead),
        )
        self.assertEqual(receipt["action"], "abstain")
        self.assertEqual(receipt["decision_mode"], "abstention")
        self.assertIsNone(receipt["llm_contribution"])
        self.assertIn("LEAD_FALLBACK_FAILED", receipt["reason_codes"])

    def test_decide_with_envelope_violating_lead_fallback_still_abstains_safely(self):
        outputs = run_all(REAL_SNAPSHOT)
        lead = MockProvider(response={"content": _minimal_llm_json(value=999)})
        receipt = decide(
            self.connection, REAL_SNAPSHOT, outputs,
            lead_fallback=self._lead_fallback_kwargs(lead),
        )
        self.assertEqual(receipt["action"], "abstain")
        self.assertIsNone(receipt["llm_contribution"])

    def test_decide_never_calls_lead_fallback_when_a_model_already_answers(self):
        outputs = run_all(REAL_SNAPSHOT)
        model = {"model_id": "SYNTH-MODEL", "version": "0.0.1", "synthetic_test_only": True}
        calls = []
        lead = MockProvider(respond=lambda r: calls.append(1) or {"content": _minimal_llm_json()})
        receipt = decide(
            self.connection, REAL_SNAPSHOT, outputs, [model],
            lead_fallback=self._lead_fallback_kwargs(lead),
        )
        self.assertEqual(receipt["action"], "hold")  # synthetic model already resolved it
        self.assertEqual(calls, [])  # gateway never consulted


class GovernanceSeparationTests(unittest.TestCase):
    def test_platform_core_llm_never_imports_llm_adapters(self):
        for path in (ROOT / "platform_core" / "llm").rglob("*.py"):
            text = path.read_text(encoding="utf-8")
            for statement in ("import llm_adapters", "from llm_adapters"):
                self.assertNotIn(statement, text, f"{path} imports the network-capable llm_adapters package")

    def test_llm_adapters_only_accept_gemini_gemma(self):
        from llm_adapters.gemini_cloud import CloudGeminiProvider
        with self.assertRaises(ValueError):
            CloudGeminiProvider(model="moonshotai/kimi-k3")

    def test_local_gemma_adapter_refuses_non_localhost_endpoint(self):
        from llm_adapters.gemma_local import LocalGemmaProvider
        with self.assertRaises(ValueError):
            LocalGemmaProvider(endpoint="http://example.com/generate")

    def test_cloud_gemini_refuses_without_consent_before_any_network_call(self):
        from llm_adapters.gemini_cloud import CloudGeminiProvider, ConsentRequiredError
        provider = CloudGeminiProvider(api_key="sk-test")
        request = {"prompt": "x", "decision_packet": {"privacy_projection": _privacy_projection(provider_scope="cloud_gemini", consent_record_id=None)}}
        with self.assertRaises(ConsentRequiredError):
            provider.generate(request)


if __name__ == "__main__":
    unittest.main()
