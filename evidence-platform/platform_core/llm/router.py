"""Deterministic provider routing - never LLM-self-selected (System
Constitution section 12: "versioned routing policy picks provider (not
self-selected)").
"""

from __future__ import annotations


class RoutingPolicy:
    """A versioned, explicit lead/backup provider choice.

    Not database-backed yet (Phase 2 first pass) - the caller constructs
    one and its id/version thread into the request/receipt like any other
    versioned artifact. A DB-backed registry mirroring runtime_artifacts is
    a natural follow-up once more than one policy exists in practice.
    """

    def __init__(
        self,
        *,
        policy_id: str,
        version: str,
        lead_provider: str,
        backup_provider: str | None = None,
    ) -> None:
        if lead_provider not in {"gemini", "gemma"}:
            raise ValueError("lead_provider must be gemini or gemma")
        if backup_provider is not None and backup_provider not in {"gemini", "gemma"}:
            raise ValueError("backup_provider must be gemini, gemma, or None")
        if backup_provider == lead_provider:
            raise ValueError("backup_provider must differ from lead_provider")
        self.policy_id = policy_id
        self.version = version
        self.lead_provider = lead_provider
        self.backup_provider = backup_provider
