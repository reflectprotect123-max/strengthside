"""Tests for runtime lead-fallback bootstrap."""

from __future__ import annotations

import json
import unittest
from pathlib import Path

from llm_adapters.runtime_bootstrap import (
    build_lead_fallback_kwargs,
    lead_fallback_available,
    load_fallback_envelope,
)
from platform_core.engines import run_all

ROOT = Path(__file__).parents[1]
SNAPSHOT = {"athlete_id": "ATH-RUNTIME-1", "as_of": "2026-08-30T12:00:00Z"}


class RuntimeLeadFallbackTests(unittest.TestCase):
    def test_load_fallback_envelope_has_hash(self):
        envelope = load_fallback_envelope(ROOT / "runtime")
        self.assertEqual(envelope["envelope_id"], "ENVELOPE-MULTI-DOMAIN-1")
        self.assertEqual(len(envelope["envelope_hash"]), 64)
        self.assertIn("bounded_increase", envelope["allowed_action_types"])

    def test_build_kwargs_none_without_providers(self):
        import os

        saved = {k: os.environ.pop(k, None) for k in (
            "OPENROUTER_API_KEY", "BIG_MAC_GEMMA_ENDPOINT", "BIG_MAC_GEMINI_MODEL",
            "BIG_MAC_GEMMA_MODEL", "BIG_MAC_CLOUD_CONSENT_ID",
        )}
        try:
            outputs = run_all(SNAPSHOT)
            kwargs = build_lead_fallback_kwargs(SNAPSHOT, outputs, runtime_root=ROOT / "runtime")
            self.assertIsNone(kwargs)
            self.assertFalse(lead_fallback_available())
        finally:
            for key, val in saved.items():
                if val is not None:
                    os.environ[key] = val

    def test_build_kwargs_with_openrouter_key(self):
        import os

        saved = os.environ.get("OPENROUTER_API_KEY")
        os.environ["OPENROUTER_API_KEY"] = "sk-test-key"
        try:
            outputs = run_all(SNAPSHOT)
            kwargs = build_lead_fallback_kwargs(SNAPSHOT, outputs, runtime_root=ROOT / "runtime")
            self.assertIsNotNone(kwargs)
            self.assertEqual(kwargs["routing_policy"].lead_provider, "gemini")
            self.assertIn("fallback_envelope", kwargs)
            self.assertIn("whole_athlete_state", kwargs)
            self.assertTrue(lead_fallback_available())
        finally:
            if saved is None:
                os.environ.pop("OPENROUTER_API_KEY", None)
            else:
                os.environ["OPENROUTER_API_KEY"] = saved


if __name__ == "__main__":
    unittest.main()
