"""Offline shadow-mode comparison harness.

docs/scopes/NON-LLM-AI-DESIGN-SCOPE.md section 11: every candidate artifact
follows draft -> validated_offline -> shadow -> limited_release -> active,
and "in shadow mode the model receives the same immutable input snapshot as
the active path but cannot alter the athlete app." There is no athlete app
to alter yet (Phase 7), so this harness covers what's measurable purely
offline, before any real rule exists to run through it: determinism,
coverage/abstention, agreement with golden cases, and disagreement with an
optional baseline. It never applies anything and never touches a database
or network - pure comparison over whatever evaluate functions are handed in.

Note for whoever writes golden cases: this codebase has two different,
unreconciled action vocabularies. `platform_core/engines/common.py`'s
ALLOWED_ACTIONS (7 actions: proceed/maintain/trim/modify/hold/record_only/
abstain) is what the five engines' own evaluate() functions return - it
matches the roadmap's own wording for Phase 3's target question verbatim.
`platform_core/llm/contracts.py`'s ACTION_TYPES (14, more granular:
bounded_increase, change_volume, ...) is the shared data contract's
ActionCandidate vocabulary, used at BIG MAC's cross-system candidate layer
(Phase 2/5). A golden case for an ENGINE's evaluate() must use the first
vocabulary; a golden case for BIG MAC's own candidate ledger uses the
second. Passing the wrong one raises EngineInputError, not a silent
misinterpretation.
"""

from __future__ import annotations

from typing import Any, Callable, Mapping, Sequence

Evaluator = Callable[[Mapping[str, Any]], Mapping[str, Any]]


def run_shadow_comparison(
    *,
    cases: Sequence[Mapping[str, Any]],
    candidate_evaluate: Evaluator,
    baseline_evaluate: Evaluator | None = None,
    expected_key: str = "expected_action",
) -> dict[str, Any]:
    """Run a candidate (and optional baseline) evaluator over golden cases.

    Each case is {"case_id": optional str, "snapshot": ..., <expected_key>:
    optional action string}. A case that raises is recorded as a case-level
    failure, not a harness crash - one bad case never hides results for the
    rest, and a candidate that only fails on edge cases is exactly what
    this exists to surface.
    """
    results: list[dict[str, Any]] = []
    for index, case in enumerate(cases):
        snapshot = case["snapshot"]
        entry: dict[str, Any] = {"case_id": case.get("case_id", f"CASE-{index}")}
        try:
            first = candidate_evaluate(snapshot)
            second = candidate_evaluate(snapshot)
        except Exception as exc:  # noqa: BLE001 - a candidate's own failure is a result, not a harness crash
            entry["error"] = type(exc).__name__
            results.append(entry)
            continue

        entry["deterministic"] = first == second
        action = _extract_action(first)
        entry["action"] = action
        entry["abstained"] = action == "abstain"

        if expected_key in case:
            entry["expected_action"] = case[expected_key]
            entry["matches_expected"] = action == case[expected_key]

        if baseline_evaluate is not None:
            try:
                baseline_result = baseline_evaluate(snapshot)
            except Exception as exc:  # noqa: BLE001
                entry["baseline_error"] = type(exc).__name__
            else:
                baseline_action = _extract_action(baseline_result)
                entry["baseline_action"] = baseline_action
                entry["disagrees_with_baseline"] = baseline_action != action

        results.append(entry)

    evaluated = [r for r in results if "error" not in r]
    with_expected = [r for r in evaluated if "expected_action" in r]
    with_baseline = [r for r in evaluated if "baseline_action" in r]

    return {
        "total_cases": len(results),
        "errored_cases": sum(1 for r in results if "error" in r),
        "evaluated_cases": len(evaluated),
        "determinism_rate": _rate(evaluated, "deterministic"),
        "abstention_rate": _rate(evaluated, "abstained"),
        "golden_case_count": len(with_expected),
        "golden_agreement_rate": _rate(with_expected, "matches_expected"),
        "baseline_comparison_count": len(with_baseline),
        "baseline_disagreement_rate": _rate(with_baseline, "disagrees_with_baseline"),
        "results": results,
    }


def _extract_action(output: Mapping[str, Any]) -> Any:
    """Engine outputs carry the action inside proposed_actions[0]; a plain
    {"action": ...} dict (e.g. a simpler baseline) is accepted directly."""
    actions = output.get("proposed_actions")
    if isinstance(actions, list) and actions:
        return actions[0].get("action")
    return output.get("action")


def _rate(entries: Sequence[Mapping[str, Any]], key: str) -> float | None:
    if not entries:
        return None
    return sum(1 for e in entries if e.get(key)) / len(entries)
