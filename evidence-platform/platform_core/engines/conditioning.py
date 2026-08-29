"""Conditioning engine - contract-complete shell (Phase 1, no active model).

docs/five-system-gap-report.md#Conditioning: modality progression material
and Concept2/Echo data contracts exist, but a canonical conditioning metric
dictionary, dose-response observations, and modality-specific validation are
still missing, and 0 rules have passed promotion
(docs/PRE-RESEARCH-STATUS.md). `evaluate()` therefore abstains on every real
athlete input - it only ever proposes a real action for a snapshot
explicitly marked `synthetic_test_only`, to exercise the shared five-system
contract without pretending any of it is athlete-ready.
"""

from __future__ import annotations

from typing import Any, Mapping

from . import common

SYSTEM = "conditioning"


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
