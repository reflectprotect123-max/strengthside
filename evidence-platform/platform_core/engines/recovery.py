"""Recovery engine - contract-complete shell (Phase 1, no active model).

docs/five-system-gap-report.md#Recovery: this is the weakest-provenance lane
- five large AI-authored documents with no canonical registry, no primary
studies, no measurement-reliability data, and 0 rules have passed promotion
(docs/PRE-RESEARCH-STATUS.md). `evaluate()` therefore abstains on every real
athlete input - it only ever proposes a real action for a snapshot
explicitly marked `synthetic_test_only`, to exercise the shared five-system
contract without pretending any of it is athlete-ready.

Binding product policy (see the ratified System Constitution, section 9,
also carried in strengthside's own CLAUDE.md): pain and illness are safety
flags, never readiness penalties, and HRV can never create, remove, or
override a pain/injury/illness restriction. This engine does not implement
that policy - BIG MAC's `runtime_policy.apply_action_scoped_constraints`
does - but no future real logic added here may reintroduce an HRV gate or
a universal readiness score.
"""

from __future__ import annotations

from typing import Any, Mapping

from . import common

SYSTEM = "recovery"


def evaluate(snapshot: Mapping[str, Any], db: Any = None) -> dict[str, Any]:
    # Phase 4: can now load its own active, hash-verified model
    # (runtime_artifacts.system='recovery') via common.run_generic_engine -
    # same as every other engine with no reviewed rule module yet. A future
    # real model still cannot reintroduce an HRV gate or readiness score
    # (see this module's docstring); run_generic_engine only ever applies a
    # model's action through the synthetic-only seam until one is reviewed.
    return common.run_generic_engine(snapshot, SYSTEM, db)
