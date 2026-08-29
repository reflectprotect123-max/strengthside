"""Cross-system candidate arbitration - BIG MAC's own job, never a single
engine's (ratified System Constitution section 2: "Coordinator is not the
final brain"; BIG MAC is the sole final controller across all five systems).

`platform_core/engines/*.py` each propose exactly one action for their own
domain and never see each other's output (platform_core/engines/__init__.py).
Something has to look at all five proposals together before a decision
reaches an athlete. This module is that "something" - and it is
deliberately narrow: it detects agreement and disagreement between domains
structurally (do the proposed actions match or not), and refuses to invent
a policy for resolving disagreement, because which domain should win a real
conflict is exactly the kind of judgment call this project's own rules
require two independent human reviewers to make (platform_core/gates.py's
promotion_gate) - not something to hardcode here ahead of any reviewed
policy. See platform_core/llm/response_builder.py's note on support_tags/
interference_tags for the same boundary applied to LLM lead-fallback
candidates: computing a real cross-candidate interaction model needs a
reviewed policy this module does not have either, so it is not attempted
here.
"""

from __future__ import annotations

from typing import Any, Mapping

from .engines.common import DOMAIN_NAMES, EngineInputError


def collect_engine_candidates(domain_outputs: Mapping[str, Mapping[str, Any]]) -> list[dict[str, Any]]:
    """Pull each domain's own proposed_actions[0] out of its engine output.

    Only non-abstain candidates are returned - an abstaining domain has
    nothing to arbitrate; every engine emits exactly one abstain outside a
    fixture today (Phase 1-4), so this is ordinarily empty. Raises if a
    domain is missing or malformed the same way validate_engine_output would
    - callers are expected to have already called validate_domain_outputs.
    """
    candidates: list[dict[str, Any]] = []
    for system in DOMAIN_NAMES:
        output = domain_outputs.get(system)
        if not isinstance(output, Mapping):
            raise EngineInputError(f"missing or malformed domain output: {system}")
        actions = output.get("proposed_actions")
        if not isinstance(actions, list) or not actions:
            raise EngineInputError(f"{system} has no proposed_actions to arbitrate")
        candidate = dict(actions[0])
        if candidate.get("action") == "abstain":
            continue
        candidate["domain"] = system
        candidates.append(candidate)
    return candidates


def arbitrate(candidates: list[Mapping[str, Any]]) -> dict[str, Any]:
    """Structural-only arbitration over already-collected engine candidates.

    - No eligible candidates: nothing to arbitrate; caller's existing
      deterministic/lead-fallback logic decides alone, unchanged.
    - Every eligible candidate proposes the SAME action: unanimous. This
      needs no policy to resolve - domains agreeing is not a conflict.
    - Two or more eligible candidates propose DIFFERENT actions: a real
      cross-domain conflict. This function never picks a side; it reports
      conflict=True so the caller treats it exactly like any other
      NO_DETERMINISTIC_ANSWER case (eligible for the same bounded,
      receipted LLM lead-fallback path everything else uses - never a
      silently-invented tie-breaker).
    """
    eligible = [dict(c) for c in candidates]
    if not eligible:
        return {"conflict": False, "unanimous_action": None, "candidates": []}
    actions = {c["action"] for c in eligible}
    if len(actions) > 1:
        return {"conflict": True, "unanimous_action": None, "candidates": eligible}
    return {"conflict": False, "unanimous_action": next(iter(actions)), "candidates": eligible}
