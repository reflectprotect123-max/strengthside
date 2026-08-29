"""LLM-assisted research helper (Constitution-sanctioned advisory role only).

This package is deliberately OUTSIDE platform_core. platform_core is the
deterministic runtime core and has its own test proving it never imports a
network or LLM client library
(tests/test_operational_platform.py::test_runtime_core_has_no_llm_or_network_client_imports).
Everything in here makes real network calls and must never be imported by
platform_core, in either direction.

What this package is allowed to do, per AI_AND_RESEARCH_ROLES.md /
docs/OPERATIONS-RUNBOOK.md: public research triage, extraction, and
candidate-record drafting. Every output is explicitly untrusted and
requires human source_verification + domain_review
(platform_core.gates.promotion_gate) before it can ever become a usable
claim, rule, or model - nothing here writes to a trusted registry, and
nothing here decides anything.
"""
