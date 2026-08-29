"""Strength engine - contract-complete shell (Phase 1) with an engine-scoped
model seam (Phase 3, no active model exists yet).

docs/five-system-gap-report.md#Strength: claim/formula registries and test
vectors exist, but independent source verification, calibration, and
prospective validation are still missing, and 0 rules have passed promotion
(docs/PRE-RESEARCH-STATUS.md). `evaluate()` therefore abstains on every real
athlete input unless a hash-verified model is registered specifically for
`strength` (runtime_artifacts.system='strength') - which today, honestly,
never happens. Promoting a real rule needs its own reviewed
platform_core/rules/ module wired in as part of that promotion, not a
generic "interpret arbitrary model JSON" mechanism invented ahead of any
reviewed content to hang it on.
"""

from __future__ import annotations

from typing import Any, Mapping

from . import common

SYSTEM = "strength"


def evaluate(snapshot: Mapping[str, Any], db: Any = None) -> dict[str, Any]:
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

    if db is not None:
        model, artifact_errors = common.load_active_engine_model(db, SYSTEM)
        if artifact_errors:
            return common.make_output(
                system=SYSTEM,
                action="abstain",
                reason_codes=["NO_APPROVED_MODEL", *artifact_errors],
                synthetic=False,
                confidence=0.0,
            )
        if model is not None:
            if model.get("synthetic_test_only"):
                # Proves the seam works mechanically, end to end, using
                # only synthetic content - the same "synthetic fixtures may
                # exercise action plumbing only" allowance the snapshot-level
                # synthetic_directive already relies on.
                model_directive = model.get("synthetic_directive", {})
                action = model_directive.get("action", "abstain")
                if action not in common.ALLOWED_ACTIONS:
                    action = "abstain"
                return common.make_output(
                    system=SYSTEM,
                    action=action,
                    reason_codes=["SYNTHETIC_TEST_ONLY", "ENGINE_SCOPED_MODEL_APPLIED"],
                    synthetic=True,
                    confidence=float(model.get("confidence", 0.0)),
                )
            # A real (non-synthetic) model is registered, but this engine
            # has no reviewed rule module to interpret it with yet -
            # abstain honestly rather than guessing what an unreviewed
            # model's content means.
            return common.make_output(
                system=SYSTEM,
                action="abstain",
                reason_codes=["ACTIVE_MODEL_APPLICATION_NOT_YET_IMPLEMENTED"],
                synthetic=False,
                confidence=0.0,
            )

    return common.make_output(
        system=SYSTEM,
        action="abstain",
        reason_codes=["NO_APPROVED_MODEL"],
        synthetic=False,
        confidence=0.0,
    )
