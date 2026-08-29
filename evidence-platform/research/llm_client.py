"""Minimal OpenRouter client, restricted to the ratified Constitution's
permitted LLM providers (Gemini/Gemma only - System Constitution section 12,
mirrored in code by platform_core.receipt_replay.LLM_PROVIDERS).

Enforced here in code, not just documented: a typo'd or mis-configured
model string can never silently reach an out-of-governance provider.
"""

from __future__ import annotations

import hashlib
import json
import os
import urllib.error
import urllib.request
from typing import Any

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
ALLOWED_MODEL_PREFIXES = ("google/gemini-", "google/gemma-")


class LLMClientError(RuntimeError):
    """Any failure calling the LLM: network, auth, governance, or shape."""


def _require_allowed_model(model: str) -> None:
    if not model.startswith(ALLOWED_MODEL_PREFIXES):
        raise LLMClientError(
            f"model {model!r} is not gemini/gemma - only those two providers "
            "are permitted by the ratified System Constitution section 12"
        )


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def call_model(
    *, model: str, prompt: str, api_key: str | None = None, timeout: float = 30.0
) -> dict[str, Any]:
    """Call one OpenRouter chat completion.

    Raises LLMClientError on any failure (network, auth, non-2xx, malformed
    JSON, non-gemini/gemma model). Never returns a partial or ambiguous
    result - a caller either gets a clean response record or an exception.
    """
    _require_allowed_model(model)
    key = api_key or os.environ.get("OPENROUTER_API_KEY")
    if not key:
        raise LLMClientError("OPENROUTER_API_KEY is not set")

    body = json.dumps(
        {"model": model, "messages": [{"role": "user", "content": prompt}]}
    ).encode("utf-8")
    request = urllib.request.Request(
        OPENROUTER_URL,
        data=body,
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            raw = response.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", "replace")
        raise LLMClientError(f"OpenRouter HTTP {exc.code}: {detail}") from exc
    except urllib.error.URLError as exc:
        raise LLMClientError(f"OpenRouter request failed: {exc.reason}") from exc

    try:
        parsed = json.loads(raw)
        content = parsed["choices"][0]["message"]["content"]
    except (json.JSONDecodeError, KeyError, IndexError, TypeError) as exc:
        raise LLMClientError(f"OpenRouter response malformed: {exc}") from exc

    return {
        "provider": "gemma" if "gemma" in model else "gemini",
        "model": model,
        "prompt": prompt,
        "prompt_hash": sha256_text(prompt),
        "response_text": content,
        "response_hash": sha256_text(content),
        "raw_response_hash": sha256_text(raw),
    }
