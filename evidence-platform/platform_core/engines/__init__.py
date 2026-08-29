"""Scientifically inactive domain engines for THE Hybrid System.

The engines in this package exercise contracts and orchestration. They abstain
for real athlete inputs until separately approved domain artifacts exist.
"""

from typing import Any, Mapping

from . import conditioning, coordinator, nutrition, recovery, strength
from .common import ALLOWED_ACTIONS, DOMAIN_NAMES, ENGINE_VERSION, EngineInputError

_MODULES = {
    "strength": strength,
    "conditioning": conditioning,
    "nutrition": nutrition,
    "recovery": recovery,
    "coordinator": coordinator,
}


def run_all(snapshot: Mapping[str, Any], db: Any = None) -> dict[str, dict[str, Any]]:
    """Run all five system engines against one athlete snapshot.

    Every engine validates the same snapshot independently and abstains
    independently - none of the five sees or depends on another's output.
    Cross-system arbitration happens later, in BIG MAC (`platform_core.decision`),
    never here. `db`, when given, lets each engine check for its OWN
    active, hash-verified model (runtime_artifacts.system=<name>) - as of
    Phase 3 only platform_core/engines/strength.py's evaluate() actually
    uses it; the other four accept and ignore it until their own turn.
    """
    return {name: module.evaluate(snapshot, db) for name, module in _MODULES.items()}


__all__ = [
    "ALLOWED_ACTIONS",
    "DOMAIN_NAMES",
    "ENGINE_VERSION",
    "EngineInputError",
    "run_all",
]
