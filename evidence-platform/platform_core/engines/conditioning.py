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
    # Phase 4: can now load its own active, hash-verified model
    # (runtime_artifacts.system='conditioning') via common.run_generic_engine
    # - same as every other engine with no reviewed rule module yet.
    return common.run_generic_engine(snapshot, SYSTEM, db)
