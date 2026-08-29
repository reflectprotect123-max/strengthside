"""Concrete LLM provider adapters - deliberately OUTSIDE platform_core.

These do real I/O (network, or a local inference server) and are injected
into platform_core.llm.gateway.call_with_fallback() by the caller;
platform_core itself never imports this package, mirroring the same
separation research/ already established.
"""
