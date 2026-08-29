"""Cloud Gemini provider, reached via OpenRouter as transport.

Requires an explicit privacy/consent gate BEFORE any HTTP call is
attempted - refuses to even build a request otherwise (System
Constitution section 12). OpenRouter is used purely as the transport to
reach a Gemini model specifically; this adapter never accepts a non-Gemini
model id, matching the ratified provider list.
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from typing import Any, Mapping

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = "google/gemini-2.5-flash-lite"


class ConsentRequiredError(RuntimeError):
    """Raised when a cloud Gemini call is attempted without a consent record."""


class CloudGeminiProvider:
    def __init__(
        self,
        *,
        model: str = DEFAULT_MODEL,
        model_version: str | None = None,
        api_key: str | None = None,
        timeout: float = 30.0,
    ) -> None:
        if not model.startswith("google/gemini-"):
            raise ValueError("CloudGeminiProvider only accepts a google/gemini-* model id")
        self.model = model
        self.model_version = model_version or model
        self.api_key = api_key or os.environ.get("OPENROUTER_API_KEY")
        self.timeout = timeout

    def generate(self, request: Mapping[str, Any]) -> Mapping[str, Any]:
        """`request` is the adapter-facing payload: {"prompt": str, "decision_packet": dict}."""
        privacy = request.get("decision_packet", {}).get("privacy_projection", {})
        if privacy.get("provider_scope") != "cloud_gemini" or not privacy.get("consent_record_id"):
            raise ConsentRequiredError(
                "cloud Gemini requires privacy_projection.provider_scope='cloud_gemini' "
                "and a non-null consent_record_id - refusing before any HTTP call"
            )
        if not self.api_key:
            raise RuntimeError("OPENROUTER_API_KEY is not set")

        prompt = request["prompt"]
        body = json.dumps(
            {"model": self.model, "messages": [{"role": "user", "content": prompt}]}
        ).encode("utf-8")
        http_request = urllib.request.Request(
            OPENROUTER_URL,
            data=body,
            headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(http_request, timeout=self.timeout) as response:
                raw = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", "replace")
            raise RuntimeError(f"OpenRouter HTTP {exc.code}: {detail}") from exc
        except urllib.error.URLError as exc:
            raise RuntimeError(f"OpenRouter request failed: {exc.reason}") from exc

        try:
            content = raw["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as exc:
            raise RuntimeError(f"OpenRouter response malformed: {exc}") from exc
        return {"content": content, "model_id": self.model, "model_version": self.model_version}
