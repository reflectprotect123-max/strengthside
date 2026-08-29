"""Provider-neutral LLM gateway.

Orchestrates lead/backup calls and never imports a concrete adapter or a
network library itself - adapters live in the sibling llm_adapters/
package (repo root, outside platform_core) and are injected by the
caller. Failure is data, not an exception past this layer: "if fallback
fails, plan unchanged" (System Constitution section 13) is enforced
structurally here, not by convention.
"""

from __future__ import annotations

from typing import Any, Mapping, Protocol


class LLMProvider(Protocol):
    def generate(self, request: Mapping[str, Any]) -> Mapping[str, Any]:
        """Return a raw provider response, or raise any exception on failure."""
        ...


def call_with_fallback(
    *, lead: LLMProvider, backup: LLMProvider | None, request: Mapping[str, Any]
) -> tuple[Mapping[str, Any] | None, list[str]]:
    """Try lead, then backup on any failure. Never raises.

    Returns (raw_response_or_None, failure_codes). A None response with
    failure_codes means: leave the plan unchanged.
    """
    failures: list[str] = []
    for name, provider in (("lead", lead), ("backup", backup)):
        if provider is None:
            continue
        try:
            return provider.generate(request), failures
        except Exception as exc:  # noqa: BLE001 - any provider failure is data here, never a crash
            failures.append(f"{name.upper()}_PROVIDER_FAILED:{type(exc).__name__}:{exc}")
    return None, failures
