"""Strength engine - contract-complete shell (Phase 1, no active model).

docs/five-system-gap-report.md#Strength: claim/formula registries and test
vectors exist, but independent source verification, calibration, and
prospective validation are still missing, and 0 rules have passed promotion
(docs/PRE-RESEARCH-STATUS.md). `evaluate()` therefore abstains on every real
athlete input - it only ever proposes a real action for a snapshot
explicitly marked `synthetic_test_only`, to exercise the shared five-system
contract without pretending any of it is athlete-ready.
"""

from __future__ import annotations

from typing import Any, Mapping

from . import common

SYSTEM = "strength"


def evaluate(snapshot: Mapping[str, Any]) -> dict[str, Any]:
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
