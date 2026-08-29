"""Deterministic, offline provider - the only adapter tests or CI ever
exercise. No network, no randomness.
"""

from __future__ import annotations

from typing import Any, Callable, Mapping


class MockProvider:
    """Either replays a canned response, calls a supplied function of the
    request, or raises a supplied exception - exactly one of the three."""

    def __init__(
        self,
        response: Mapping[str, Any] | None = None,
        *,
        respond: Callable[[Mapping[str, Any]], Mapping[str, Any]] | None = None,
        raises: Exception | None = None,
    ) -> None:
        if sum(x is not None for x in (response, respond, raises)) != 1:
            raise ValueError("MockProvider needs exactly one of response, respond, raises")
        self._response = response
        self._respond = respond
        self._raises = raises

    def generate(self, request: Mapping[str, Any]) -> Mapping[str, Any]:
        """`request` here is the adapter-facing payload: {"prompt": str, "decision_packet": dict}."""
        if self._raises is not None:
            raise self._raises
        if self._respond is not None:
            return self._respond(request)
        return dict(self._response)
