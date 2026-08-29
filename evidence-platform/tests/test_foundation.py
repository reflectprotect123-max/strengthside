from __future__ import annotations
import json, unittest
from pathlib import Path

BASE=Path(__file__).resolve().parents[1]

class FoundationTests(unittest.TestCase):
    def test_no_active_models(self):
        data=json.loads((BASE/"models"/"model-registry.json").read_text())
        self.assertFalse(any(m.get("status")=="active" for m in data.get("models",[])))
    def test_receipt_schema_requires_replay_fields(self):
        data=json.loads((BASE/"schemas"/"decision-receipt.schema.json").read_text())
        for field in ["decision_trace_hash","replay_bundle_hash","artifact_manifest","validator_results","receipt_hash"]:
            self.assertIn(field,data["required"])
    def test_state_has_five_domains(self):
        data=json.loads((BASE/"schemas"/"athlete-state.schema.json").read_text())
        self.assertEqual(set(data["properties"]["domains"]["required"]),{"strength","conditioning","nutrition","recovery","coordinator"})

if __name__=="__main__": unittest.main()
