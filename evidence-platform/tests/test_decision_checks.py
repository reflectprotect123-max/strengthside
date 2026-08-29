from __future__ import annotations
import sys, unittest
from pathlib import Path

BASE=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(BASE))
from validators.decision_checks import validate_candidate


def valid_context():
    return {
        "mode":"structural_test_only",
        "inputs":{"x":1},
        "rule":{"status":"active","stale":False},
        "model":{"status":"active","hash_valid":True},
        "candidate":{"action":"hold"},
        "provenance":{"source_ids":["s"],"claim_ids":["c"],"policy_ids":["p"],"rule_ids":["r"]},
        "comparison":{"left":{"unit":"kg","denominator":"set","population_id":"p1"},"right":{"unit":"kg","denominator":"set","population_id":"p1"}},
        "hard_safety_constraints":[],
        "system_recommendations":[{"system":"strength","action":"hold"},{"system":"recovery","action":"hold"}],
    }


class DecisionValidationTests(unittest.TestCase):
    def test_valid_candidate(self): self.assertEqual(validate_candidate(valid_context()),[])
    def test_contradictory_evidence(self):
        c=valid_context(); c["contradiction"]={"status":"unresolved"}; self.assertIn("unresolved_contradictory_evidence",validate_candidate(c))
    def test_missing_values(self):
        c=valid_context(); c.pop("inputs"); self.assertIn("missing_required:inputs",validate_candidate(c))
    def test_incompatible_units(self):
        c=valid_context(); c["comparison"]["right"]["unit"]="lb"; self.assertIn("incompatible_units",validate_candidate(c))
    def test_different_denominators(self):
        c=valid_context(); c["comparison"]["right"]["denominator"]="session"; self.assertIn("different_denominators",validate_candidate(c))
    def test_different_populations(self):
        c=valid_context(); c["comparison"]["right"]["population_id"]="p2"; self.assertIn("different_populations_unreviewed",validate_candidate(c))
    def test_stale_rules(self):
        c=valid_context(); c["rule"]["stale"]=True; self.assertIn("stale_or_inactive_rule",validate_candidate(c))
    def test_invalid_model_versions(self):
        c=valid_context(); c["model"]["hash_valid"]=False; self.assertIn("invalid_model_version",validate_candidate(c))
    def test_unsafe_decisions(self):
        c=valid_context(); c["hard_safety_constraints"]=[{"code":"pain_hold","blocked_actions":["hold"]}]; self.assertIn("unsafe_candidate_blocked",validate_candidate(c))
    def test_incomplete_provenance(self):
        c=valid_context(); c["provenance"]["claim_ids"]=[]; self.assertIn("incomplete_provenance",validate_candidate(c))
    def test_conflicting_system_recommendations(self):
        c=valid_context(); c["system_recommendations"][1]["action"]="progress"; self.assertIn("conflicting_system_recommendations",validate_candidate(c))
    def test_self_declared_runtime_authority_is_rejected(self):
        c=valid_context(); c.pop("mode"); self.assertIn("legacy_validator_not_runtime_authority",validate_candidate(c))


if __name__=="__main__": unittest.main()
