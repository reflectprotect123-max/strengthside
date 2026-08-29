"""Phase 6: shadow-mode comparison reports gate promotion out of "shadow".

Colocated with platform_core/gates.py::promotion_gate and
platform_core/shadow.py::shadow_report_blockers, per this project's own
"tests/ is the historical dumping ground for this repo's tests, stays here
rather than moving" convention (see tests/test_five_system_engines.py).
"""

from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from platform_core.db import connect, migrate
from platform_core.gates import promotion_gate
from platform_core.review import add_review, register_reviewer
from platform_core.shadow import run_shadow_comparison, shadow_report_blockers

RECORD_ID = "TEST-SHADOW-RULE"
CONTENT_HASH = "TEST-CONTENT-HASH"

PASSING_PAYLOAD_BASE = {
    "policy_owner": "test-owner",
    "tests": "present",
    "inputs": "snapshot",
    "outputs": "action",
    "evidence_claim_ids": ["S-TEST-001"],
}


class ShadowReportBlockersTests(unittest.TestCase):
    def test_missing_report_is_malformed(self):
        self.assertEqual(shadow_report_blockers(None), ["SHADOW_REPORT_MALFORMED"])

    def test_report_missing_required_fields_is_malformed(self):
        self.assertEqual(shadow_report_blockers({"total_cases": 1}), ["SHADOW_REPORT_MALFORMED"])

    def test_zero_cases_blocks_before_anything_else(self):
        report = {
            "total_cases": 0, "errored_cases": 0, "determinism_rate": None,
            "golden_case_count": 0, "golden_agreement_rate": None,
        }
        self.assertEqual(shadow_report_blockers(report), ["SHADOW_REPORT_NO_CASES"])

    def test_errored_cases_block(self):
        report = {
            "total_cases": 2, "errored_cases": 1, "determinism_rate": 1.0,
            "golden_case_count": 0, "golden_agreement_rate": None,
        }
        self.assertIn("SHADOW_REPORT_HAD_ERRORS", shadow_report_blockers(report))

    def test_nondeterminism_blocks(self):
        report = {
            "total_cases": 2, "errored_cases": 0, "determinism_rate": 0.5,
            "golden_case_count": 0, "golden_agreement_rate": None,
        }
        self.assertIn("SHADOW_REPORT_NONDETERMINISTIC", shadow_report_blockers(report))

    def test_golden_disagreement_blocks(self):
        report = {
            "total_cases": 2, "errored_cases": 0, "determinism_rate": 1.0,
            "golden_case_count": 2, "golden_agreement_rate": 0.5,
        }
        self.assertIn("SHADOW_REPORT_GOLDEN_DISAGREEMENT", shadow_report_blockers(report))

    def test_a_real_clean_run_shadow_comparison_report_passes(self):
        cases = [{"snapshot": {"a": 1}, "expected_action": "hold"}, {"snapshot": {"a": 2}, "expected_action": "hold"}]
        report = run_shadow_comparison(cases=cases, candidate_evaluate=lambda s: {"action": "hold"})
        self.assertEqual(shadow_report_blockers(report), [])


class ShadowGatesPromotionTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.connection = connect(Path(self.temp.name) / "evidence.db")
        migrate(self.connection)
        register_reviewer(self.connection, "source-rev-1", "source_reviewer", "none")
        register_reviewer(self.connection, "domain-rev-1", "domain_reviewer", "none")

    def tearDown(self):
        self.connection.close()
        self.temp.cleanup()

    def _put_rule(self, status, payload_extra=None):
        payload = {**PASSING_PAYLOAD_BASE, **(payload_extra or {})}
        self.connection.execute(
            "INSERT OR REPLACE INTO records(record_type,record_id,system,status,title,text_content,"
            "numeric_value,unit,source_id,source_path,source_line,payload_json,content_hash,imported_at) "
            "VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            ("rule", RECORD_ID, "strength", status, "Test Rule", "", None, None, None, None, None,
             json.dumps(payload), CONTENT_HASH, "2026-01-01T00:00:00Z"),
        )
        self.connection.commit()
        add_review(self.connection, "rule", RECORD_ID, "source_verification", "verified", "source-rev-1")
        add_review(self.connection, "rule", RECORD_ID, "domain_review", "approved", "domain-rev-1")

    def test_shadow_stage_rule_without_a_shadow_report_is_blocked(self):
        self._put_rule("shadow")
        gate = promotion_gate(self.connection, "rule", RECORD_ID)
        self.assertFalse(gate["eligible"])
        self.assertIn("SHADOW_REPORT_MALFORMED", gate["blockers"])

    def test_shadow_stage_rule_with_a_failing_shadow_report_is_blocked(self):
        self._put_rule("shadow", {"shadow_report": {
            "total_cases": 3, "errored_cases": 1, "determinism_rate": 1.0,
            "golden_case_count": 0, "golden_agreement_rate": None,
        }})
        gate = promotion_gate(self.connection, "rule", RECORD_ID)
        self.assertFalse(gate["eligible"])
        self.assertIn("SHADOW_REPORT_HAD_ERRORS", gate["blockers"])

    def test_shadow_stage_rule_with_a_passing_shadow_report_is_eligible(self):
        cases = [{"snapshot": {"a": 1}, "expected_action": "hold"}]
        report = run_shadow_comparison(cases=cases, candidate_evaluate=lambda s: {"action": "hold"})
        self._put_rule("shadow", {"shadow_report": report})
        gate = promotion_gate(self.connection, "rule", RECORD_ID)
        self.assertTrue(gate["eligible"], gate["blockers"])

    def test_a_record_not_yet_in_shadow_is_unaffected_by_this_gate(self):
        self._put_rule("policy_owned")  # earlier lifecycle stage, no shadow_report exists yet
        gate = promotion_gate(self.connection, "rule", RECORD_ID)
        self.assertNotIn("SHADOW_REPORT_MALFORMED", gate["blockers"])


if __name__ == "__main__":
    unittest.main()
