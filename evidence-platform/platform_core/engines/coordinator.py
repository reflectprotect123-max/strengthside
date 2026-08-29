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
    # `db` accepted for signature parity with the shared run_all(snapshot, db)
    # contract - unused here until this engine gets its own Phase 4 model seam
    # (see platform_core/engines/strength.py for the pattern once it exists).
    del db
    snapshot = common.validate_snapshot(snapshot)
    directive = common.synthetic_directive(snapshot, SYSTEM)
    if directive is not None:
        return common.make_output(
            system=SYSTEM,
            action=directive["action"],
            reason_codes=["SYNTHETIC_TEST_ONLY"],
            synthetic=True,
            confidence=float(directive.get("confidence", 0.0)),
        )
    return common.make_output(
        system=SYSTEM,
        action="abstain",
        reason_codes=["NO_APPROVED_MODEL"],
        synthetic=False,
        confidence=0.0,
    )
