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

Real corpus content vs. original design intent (30 August 2026): this
engine was designed around abstract multi-objective arbitration and
uncertainty calibration (see platform_core/arbitration.py, whose mechanics
stay valid and domain-agnostic regardless of what follows). But the actual
acquired evidence for "coordinator" (sources/acquired/*/coordinator/,
600+ sources) turned out to be dominated by something narrower and more
concrete: return-to-play / return-to-sport readiness after injury or
illness (titles matching "return to play"/"return to sport": ~80;
"injury prevention": ~105 - both dwarfing "uncertainty"/"calibration"/
"decision support", each in the single digits). That is a genuine
cross-domain coordination question in its own right - it needs recovery's
input (healed/not), strength's input (capacity restored/not), and pain/
illness status (Constitution section 9: safety flag, never a readiness
penalty) - so it fits this engine's actual role. It is just a narrower,
more concrete first candidate than the original abstract framing assumed.
Treat "when is an athlete ready to return to full training after injury
or illness" as this engine's evidence-backed near-term direction; the
original arbitration/calibration framing remains the longer-term shape of
what a mature coordinator does, not a wrong turn to undo.
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
