"""Phase 5: cross-system candidate arbitration.

Colocated with platform_core/arbitration.py per this project's own
"tests/ is the historical dumping ground for this repo's tests, stays here
rather than moving" convention (see tests/test_five_system_engines.py).
"""

from __future__ import annotations

import unittest

from platform_core.arbitration import arbitrate, collect_engine_candidates
from platform_core.engines.common import DOMAIN_NAMES, EngineInputError, make_output


def _output(system: str, action: str) -> dict:
    return make_output(system=system, action=action, reason_codes=[f"{action.upper()}_TEST"], synthetic=True)


class CollectEngineCandidatesTests(unittest.TestCase):
    def test_all_abstain_yields_no_candidates(self):
        outputs = {system: _output(system, "abstain") for system in DOMAIN_NAMES}
        self.assertEqual(collect_engine_candidates(outputs), [])

    def test_one_non_abstain_is_collected_with_its_domain(self):
        outputs = {system: _output(system, "abstain") for system in DOMAIN_NAMES}
        outputs["strength"] = _output("strength", "hold")
        candidates = collect_engine_candidates(outputs)
        self.assertEqual(len(candidates), 1)
        self.assertEqual(candidates[0]["domain"], "strength")
        self.assertEqual(candidates[0]["action"], "hold")

    def test_missing_domain_raises_rather_than_silently_skipping(self):
        outputs = {system: _output(system, "abstain") for system in DOMAIN_NAMES}
        del outputs["nutrition"]
        with self.assertRaises(EngineInputError):
            collect_engine_candidates(outputs)


class ArbitrateTests(unittest.TestCase):
    def test_no_candidates_is_not_a_conflict(self):
        result = arbitrate([])
        self.assertFalse(result["conflict"])
        self.assertIsNone(result["unanimous_action"])

    def test_single_candidate_is_unanimous(self):
        result = arbitrate([{"action": "hold", "domain": "strength"}])
        self.assertFalse(result["conflict"])
        self.assertEqual(result["unanimous_action"], "hold")

    def test_matching_candidates_across_domains_are_unanimous_not_conflicting(self):
        candidates = [
            {"action": "hold", "domain": "strength"},
            {"action": "hold", "domain": "nutrition"},
        ]
        result = arbitrate(candidates)
        self.assertFalse(result["conflict"])
        self.assertEqual(result["unanimous_action"], "hold")

    def test_differing_candidates_across_domains_conflict(self):
        candidates = [
            {"action": "hold", "domain": "strength"},
            {"action": "trim", "domain": "recovery"},
        ]
        result = arbitrate(candidates)
        self.assertTrue(result["conflict"])
        self.assertIsNone(result["unanimous_action"])

    def test_arbitrate_never_mutates_its_input(self):
        candidates = [{"action": "hold", "domain": "strength"}]
        original = dict(candidates[0])
        arbitrate(candidates)
        self.assertEqual(candidates[0], original)


if __name__ == "__main__":
    unittest.main()
