"""The one narrow view of a decision receipt a future athlete-facing consumer
is allowed to see.

Ratified System Constitution: BIG MAC executes silently and keeps a hidden
receipt - the athlete never sees reason codes, the candidate ledger,
evaluator internals, model ids, or a receipt's own audit hashes. Those exist
so a human reviewer can reconstruct and verify a decision later
(platform_core.decision.replay), never for an app screen.

Nothing outside evidence-platform calls this yet. strengthside's CLAUDE.md
is explicit that this package "does not import from, depend on, or get
imported by anything under apps/, packages/, or supabase/" and "has never
been wired to this repo's Supabase project or the athlete app" - that stays
true here too; this module has zero I/O and zero knowledge of any real
app's data model. What it gives instead is the one seam a future
integration would need: rather than a later wiring effort reaching into
decision_trace/candidate_ledger/receipt internals directly (and inventing
its own, unreviewed idea of what's safe to expose), it has one narrow,
already-tested function to call. Building the seam now, before the wiring
it serves exists, is the same shape as this project's own promotion
lifecycle: prove a boundary correct before anything crosses it.
"""

from __future__ import annotations

from typing import Any, Mapping


class AthleteConsumerContractError(ValueError):
    """Raised when a value claiming to be a decision receipt is not one."""


def to_athlete_facing_update(receipt: Mapping[str, Any]) -> dict[str, Any]:
    """Reduce a full decision receipt to the only two facts an athlete-facing
    consumer may ever see: whether there is an update to silently apply, and
    which action it is.

    Deliberately does not re-check silent_apply_allowed or
    user_facing_explanation_emitted - platform_core.receipt_replay.build_receipt
    already guarantees every receipt that exists has silent_apply_allowed is
    True and user_facing_explanation_emitted is not True (a receipt violating
    either never gets built at all), so this is not this boundary's job to
    re-verify. What IS this boundary's job: confirming the untrusted value
    handed in is actually receipt-shaped before trusting anything on it.
    """
    if not isinstance(receipt, Mapping):
        raise AthleteConsumerContractError("receipt must be an object")
    for field in ("action", "final_decision"):
        if field not in receipt:
            raise AthleteConsumerContractError(f"receipt missing required field: {field}")
    final_decision = receipt["final_decision"]
    if not isinstance(final_decision, Mapping) or "committed_change" not in final_decision:
        raise AthleteConsumerContractError("receipt.final_decision must include committed_change")
    committed_change = final_decision["committed_change"]
    if not isinstance(committed_change, bool):
        # bool("false") is True and bool(0) is False but bool("0") is also
        # True - a truthiness check here would silently misread a tampered
        # or hand-constructed non-bool value. This is exactly the boundary
        # this module exists to be strict at, so reject it outright instead
        # of guessing what a non-bool committed_change was supposed to mean.
        raise AthleteConsumerContractError("receipt.final_decision.committed_change must be a boolean")

    if not committed_change:
        return {"has_update": False, "action": None}
    return {"has_update": True, "action": receipt["action"]}
