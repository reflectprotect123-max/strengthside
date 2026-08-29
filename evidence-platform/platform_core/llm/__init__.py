"""BIG MAC's bounded Gemini/Gemma lead-fallback gateway (Phase 2).

Everything in this package is deterministic - no network calls, no
concrete provider imports. Concrete adapters (which do real I/O) live in
the sibling llm_adapters/ package at the repo root and are injected in,
never imported here. This mirrors platform_core's existing zero-network
guarantee: `tests/test_operational_platform.py::
test_runtime_core_has_no_llm_or_network_client_imports` already scans all
of platform_core recursively, this package included.
"""
