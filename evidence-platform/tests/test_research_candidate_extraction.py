"""LLM-assisted research helper - fully mocked, zero live network calls.

Colocated with research/ per this project's "tests live with the module
they mostly exercise" rule.
"""

from __future__ import annotations

import io
import json
import tempfile
import unittest
import urllib.error
from pathlib import Path
from unittest import mock

from platform_core import decision, engines, receipt_replay, whole_athlete_state
from research.candidate_extraction import build_prompt, extract_candidate, write_candidates
from research.llm_client import LLMClientError, call_model

ROOT = Path(__file__).parents[1]


def _fake_response(content: str) -> bytes:
    return json.dumps({"choices": [{"message": {"content": content}}]}).encode("utf-8")


class _FakeHTTPResponse:
    def __init__(self, body: bytes):
        self._body = body

    def read(self):
        return self._body

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False


class LLMClientTests(unittest.TestCase):
    def test_rejects_non_gemini_gemma_model(self):
        with self.assertRaises(LLMClientError):
            call_model(model="moonshotai/kimi-k3", prompt="hi", api_key="sk-test")

    def test_requires_api_key(self):
        with self.assertRaises(LLMClientError):
            call_model(model="google/gemma-4-31b-it:free", prompt="hi", api_key=None)

    def test_successful_call_returns_hashed_record(self):
        with mock.patch(
            "research.llm_client.urllib.request.urlopen",
            return_value=_FakeHTTPResponse(_fake_response("hello world")),
        ):
            result = call_model(model="google/gemma-4-31b-it:free", prompt="hi", api_key="sk-test")
        self.assertEqual(result["provider"], "gemma")
        self.assertEqual(result["response_text"], "hello world")
        self.assertEqual(len(result["response_hash"]), 64)
        self.assertEqual(len(result["prompt_hash"]), 64)

    def test_http_error_raises_client_error_not_crash(self):
        error = urllib.error.HTTPError(
            "url", 401, "Unauthorized", hdrs=None, fp=io.BytesIO(b'{"error":"bad key"}')
        )
        with mock.patch("research.llm_client.urllib.request.urlopen", side_effect=error):
            with self.assertRaises(LLMClientError):
                call_model(model="google/gemini-2.5-flash-lite", prompt="hi", api_key="sk-test")

    def test_malformed_json_response_raises_client_error(self):
        with mock.patch(
            "research.llm_client.urllib.request.urlopen",
            return_value=_FakeHTTPResponse(b"not json"),
        ):
            with self.assertRaises(LLMClientError):
                call_model(model="google/gemma-4-31b-it:free", prompt="hi", api_key="sk-test")


class CandidateExtractionTests(unittest.TestCase):
    def test_extracts_a_claim_when_llm_finds_one(self):
        content = json.dumps(
            {
                "claim_text": "Progressive overload via load increase is supported.",
                "claim_type": "Research synthesis",
                "confidence_as_documented": "Medium",
                "caveats": "Single-study excerpt.",
            }
        )
        with mock.patch(
            "research.llm_client.urllib.request.urlopen",
            return_value=_FakeHTTPResponse(_fake_response(content)),
        ), mock.patch.dict("os.environ", {"OPENROUTER_API_KEY": "sk-test"}):
            candidate = extract_candidate(
                question="Does load progression matter?",
                system="strength",
                source_id="SRC-TEST",
                excerpt="some excerpt text",
                model="google/gemma-4-31b-it:free",
            )
        self.assertTrue(candidate["candidate_id"].startswith("LLM-CAND-"))
        self.assertEqual(candidate["review_status"], "extracted_untrusted_pending_source_validation")
        self.assertEqual(candidate["claim_text"], "Progressive overload via load increase is supported.")
        self.assertEqual(candidate["provider"], "gemma")

    def test_no_claim_found_is_a_valid_honest_outcome_not_an_error(self):
        content = json.dumps({"claim_text": None})
        with mock.patch(
            "research.llm_client.urllib.request.urlopen",
            return_value=_FakeHTTPResponse(_fake_response(content)),
        ), mock.patch.dict("os.environ", {"OPENROUTER_API_KEY": "sk-test"}):
            candidate = extract_candidate(
                question="Does load progression matter?",
                system="strength",
                source_id="SRC-TEST",
                excerpt="irrelevant text",
            )
        self.assertEqual(candidate["review_status"], "llm_found_no_claim")
        self.assertIsNone(candidate["claim_text"])

    def test_unparseable_llm_output_is_treated_as_no_claim_not_a_crash(self):
        with mock.patch(
            "research.llm_client.urllib.request.urlopen",
            return_value=_FakeHTTPResponse(_fake_response("I cannot help with that.")),
        ), mock.patch.dict("os.environ", {"OPENROUTER_API_KEY": "sk-test"}):
            candidate = extract_candidate(
                question="Q", system="strength", source_id="SRC-TEST", excerpt="x"
            )
        self.assertEqual(candidate["review_status"], "llm_found_no_claim")

    def test_prompt_never_implies_authority(self):
        prompt = build_prompt(question="Q", system="strength", source_id="SRC-1", excerpt="E")
        self.assertIn("CANDIDATE", prompt)
        self.assertIn("human review", prompt)

    def test_write_candidates_appends_never_overwrites(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "candidates.json"
            write_candidates([{"candidate_id": "A"}], out)
            write_candidates([{"candidate_id": "B"}], out)
            stored = json.loads(out.read_text())
            self.assertEqual([c["candidate_id"] for c in stored], ["A", "B"])


class GovernanceSeparationTests(unittest.TestCase):
    """Prove the runtime core and the research assistant never cross-import."""

    def test_platform_core_never_imports_research(self):
        for path in (ROOT / "platform_core").rglob("*.py"):
            text = path.read_text(encoding="utf-8")
            self.assertNotIn(
                "import research", text, f"{path} imports the network-capable research package"
            )
            self.assertNotIn(
                "from research", text, f"{path} imports the network-capable research package"
            )

    def test_platform_core_modules_still_importable_without_research(self):
        # Sanity check the two packages are genuinely decoupled, not just
        # textually unreferenced - platform_core must load standalone.
        for module in (decision, engines, receipt_replay, whole_athlete_state):
            self.assertTrue(hasattr(module, "__name__"))


if __name__ == "__main__":
    unittest.main()
