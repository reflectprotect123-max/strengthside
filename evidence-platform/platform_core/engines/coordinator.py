"""Coordinator engine - contract-complete shell (Phase 1, no active model).

docs/five-system-gap-report.md#Coordinator: architecture concepts and
candidate boundaries exist, but owned arbitration policies, exact interface
versions, a feasible-set definition, objective functions, and validation
data are all still missing, and 0 rules have passed promotion
(docs/PRE-RESEARCH-STATUS.md). `evaluate()` therefore abstains on every real
athlete input - it only ever proposes a real action for a snapshot
explicitly marked `synthetic_test_only`, to exercise the shared five-system
contract without pretending any of it is athlete-ready.

Coordinator is one peer system among five here, same as the ratified System
Constitution requires (section 2: "Coordinator is not the final brain").
Cross-system arbitration is BIG MAC's job (`platform_core.decision`), not
this module's.
"""

from __future__ import annotations

from typing import Any, Mapping

from . import common

SYSTEM = "coordinator"


def evaluate(snapshot: Mapping[str, Any], db: Any = None) -> dict[str, Any]:
    # Phase 4: can now load its own active, hash-verified model
    # (runtime_artifacts.system='coordinator') via common.run_generic_engine -
    # same as every other engine with no reviewed rule module yet. Still one
    # peer among five; cross-system arbitration stays BIG MAC's job.
    return common.run_generic_engine(snapshot, SYSTEM, db)
