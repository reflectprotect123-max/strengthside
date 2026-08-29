"""Scientifically inactive domain engines for THE Hybrid System.

The engines in this package exercise contracts and orchestration. They abstain
for real athlete inputs until separately approved domain artifacts exist.
"""

from .common import ALLOWED_ACTIONS, ENGINE_VERSION, EngineInputError

__all__ = ["ALLOWED_ACTIONS", "ENGINE_VERSION", "EngineInputError"]
