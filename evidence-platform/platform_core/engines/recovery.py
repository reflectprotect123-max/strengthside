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
