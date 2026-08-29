"""Offline shadow-mode comparison harness (Phase 3 groundwork).

Colocated with platform_core/shadow.py.
"""

from __future__ import annotations

import unittest

from platform_core.shadow import run_shadow_comparison


def _snapshot(case_action: str, athlete_id: str = "A-1") -> dict:
    return {
        "fixture": "synthetic_test_only",
        "athlete_id": athlete_id,
        "as_of": "2026-01-01T00:00:00Z",
        "synthetic_directives": {"strength": {"action": case_action}},
    }


def _engine_style(action: str, confidence: float = 0.5) -> dict:
    return {"proposed_actions": [{"action": action}], "confidence": confidence}


class ShadowComparisonTests(unittest.TestCase):
    def test_deterministic_pure_function_reports_full_determinism(self):
        def evaluate(snapshot):
            return _engine_style(snapshot["synthetic_directives"]["strength"]["action"])

        cases = [{"snapshot": _snapshot("hold")}, {"snapshot": _snapshot("maintain")}]
        report = run_shadow_comparison(cases=cases, candidate_evaluate=evaluate)
        self.assertEqual(report["determinism_rate"], 1.0)
        self.assertEqual(report["evaluated_cases"], 2)
        self.assertEqual(report["errored_cases"], 0)

    def test_nondeterministic_function_is_caught(self):
        calls = {"n": 0}

        def flaky(snapshot):
            calls["n"] += 1
            return _engine_style("hold" if calls["n"] % 2 else "maintain")

        report = run_shadow_comparison(cases=[{"snapshot": _snapshot("hold")}], candidate_evaluate=flaky)
        self.assertEqual(report["determinism_rate"], 0.0)

    def test_abstention_rate_is_measured(self):
        def evaluate(snapshot):
            return _engine_style("abstain")

        report = run_shadow_comparison(cases=[{"snapshot": _snapshot("hold")}] * 4, candidate_evaluate=evaluate)
        self.assertEqual(report["abstention_rate"], 1.0)

    def test_golden_case_agreement_is_measured(self):
        def evaluate(snapshot):
            return _engine_style(snapshot["synthetic_directives"]["strength"]["action"])

        cases = [
            {"snapshot": _snapshot("hold"), "expected_action": "hold"},
            {"snapshot": _snapshot("maintain"), "expected_action": "hold"},  # deliberately wrong
        ]
        report = run_shadow_comparison(cases=cases, candidate_evaluate=evaluate)
        self.assertEqual(report["golden_case_count"], 2)
        self.assertEqual(report["golden_agreement_rate"], 0.5)

    def test_baseline_disagreement_is_measured(self):
        def candidate(snapshot):
            return _engine_style("bounded_increase" if snapshot["athlete_id"] == "A-1" else "hold")

        def baseline(snapshot):
            return _engine_style("hold")

        cases = [{"snapshot": _snapshot("hold", athlete_id="A-1")}, {"snapshot": _snapshot("hold", athlete_id="A-2")}]
        report = run_shadow_comparison(cases=cases, candidate_evaluate=candidate, baseline_evaluate=baseline)
        self.assertEqual(report["baseline_comparison_count"], 2)
        self.assertEqual(report["baseline_disagreement_rate"], 0.5)

    def test_one_bad_case_does_not_hide_the_rest(self):
        def evaluate(snapshot):
            if snapshot["athlete_id"] == "BAD":
                raise RuntimeError("boom")
            return _engine_style("hold")

        cases = [{"snapshot": _snapshot("hold", athlete_id="BAD")}, {"snapshot": _snapshot("hold", athlete_id="OK")}]
        report = run_shadow_comparison(cases=cases, candidate_evaluate=evaluate)
        self.assertEqual(report["total_cases"], 2)
        self.assertEqual(report["errored_cases"], 1)
        self.assertEqual(report["evaluated_cases"], 1)
        self.assertEqual(report["results"][0]["error"], "RuntimeError")

    def test_real_strength_engine_is_deterministic_through_the_harness(self):
        # "modify" here, not the shared contract's 14-action ActionCandidate
        # vocabulary (bounded_increase, etc) - engines/common.py's own
        # ALLOWED_ACTIONS is the 7-action set the roadmap names verbatim
        # ("progress, maintain, trim, modify, hold, record only, abstain"),
        # a deliberately different, coarser layer than BIG MAC's own
        # candidate-level action_type. See platform_core/shadow.py's note.
        from platform_core.engines import strength
        cases = [{"snapshot": _snapshot("hold")}, {"snapshot": _snapshot("modify")}]
        report = run_shadow_comparison(cases=cases, candidate_evaluate=strength.evaluate)
        self.assertEqual(report["determinism_rate"], 1.0)
        self.assertEqual(report["errored_cases"], 0)

    def test_empty_case_set_reports_none_rates_not_crash(self):
        report = run_shadow_comparison(cases=[], candidate_evaluate=lambda s: _engine_style("hold"))
        self.assertEqual(report["total_cases"], 0)
        self.assertIsNone(report["determinism_rate"])
        self.assertIsNone(report["golden_agreement_rate"])


if __name__ == "__main__":
    unittest.main()
