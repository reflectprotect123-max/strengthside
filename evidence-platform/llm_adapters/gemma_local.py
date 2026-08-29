"""Local Gemma provider - HTTP to a same-machine inference server only.

Never leaves the machine, so it needs no privacy/consent gate (System
Constitution section 12: "local Gemma may get full personal packet").
Enforced by refusing any endpoint that isn't localhost/127.0.0.1, not just
documented.
"""

from __future__ import annotations

import json
import urllib.error
import urllib.request
from typing import Any, Mapping

DEFAULT_ENDPOINT = "http://localhost:11434/api/generate"


class LocalGemmaProvider:
    def __init__(
        self,
        *,
        endpoint: str = DEFAULT_ENDPOINT,
        model: str = "gemma3",
        model_version: str = "gemma3",
        timeout: float = 30.0,
    ) -> None:
        if not endpoint.startswith(("http://localhost", "http://127.0.0.1")):
            raise ValueError("LocalGemmaProvider must target localhost - anything else is not 'local'")
        self.endpoint = endpoint
        self.model = model
        self.model_version = model_version
        self.timeout = timeout

    def generate(self, request: Mapping[str, Any]) -> Mapping[str, Any]:
        """`request` is the adapter-facing payload: {"prompt": str, "decision_packet": dict}."""
        prompt = request["prompt"]
        body = json.dumps({"model": self.model, "prompt": prompt, "stream": False}).encode("utf-8")
        http_request = urllib.request.Request(
            self.endpoint, data=body, headers={"Content-Type": "application/json"}, method="POST"
        )
        try:
            with urllib.request.urlopen(http_request, timeout=self.timeout) as response:
                raw = json.loads(response.read().decode("utf-8"))
        except urllib.error.URLError as exc:
            raise RuntimeError(f"local Gemma request failed: {exc}") from exc

        try:
            content = raw["response"]
        except (KeyError, TypeError) as exc:
            raise RuntimeError(f"local Gemma response malformed: {exc}") from exc
        return {"content": content, "model_id": self.model, "model_version": self.model_version}
