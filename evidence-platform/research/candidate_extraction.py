"""LLM-assisted candidate claim extraction.

Sanctioned role only (AI_AND_RESEARCH_ROLES.md: "public research
triage/extraction/candidate records"). Output is a staged, explicitly
untrusted candidate - never written to claims/claim-registry.csv directly.
A human reviews and manually merges via the existing
register-reviewer/add-review/promote CLI commands, exactly like every other
machine-extracted candidate in this platform.
"""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .llm_client import call_model

DEFAULT_MODEL = "google/gemma-4-31b-it:free"

PROMPT_TEMPLATE = """You are drafting a CANDIDATE research claim for later human review. \
You are not making a decision and nothing you say will be used without a human \
verifying it against the source.

Research question: {question}

Source excerpt (system: {system}, source_id: {source_id}):
---
{excerpt}
---

Extract ONE specific, falsifiable claim this excerpt supports, if any. Respond with \
strict JSON only, no prose outside the JSON, in this exact shape:
{{"claim_text": "...", "claim_type": "...", "confidence_as_documented": "High|Medium|Low", "caveats": "..."}}
If the excerpt supports no clear claim, respond with {{"claim_text": null}}.
"""


def build_prompt(*, question: str, system: str, source_id: str, excerpt: str) -> str:
    return PROMPT_TEMPLATE.format(
        question=question, system=system, source_id=source_id, excerpt=excerpt
    )


def _parse_candidate_json(response_text: str) -> dict[str, Any] | None:
    match = re.search(r"\{.*\}", response_text, re.DOTALL)
    if not match:
        return None
    try:
        parsed = json.loads(match.group(0))
    except json.JSONDecodeError:
        return None
    if not isinstance(parsed, dict) or not parsed.get("claim_text"):
        return None
    return parsed


def extract_candidate(
    *,
    question: str,
    system: str,
    source_id: str,
    excerpt: str,
    model: str = DEFAULT_MODEL,
) -> dict[str, Any]:
    """Ask the LLM to draft one candidate claim from one source excerpt.

    Never raises for a "no claim found" response - that's a valid, honest
    outcome, recorded as such. Only raises for real infrastructure failures
    (network/auth/malformed response), via llm_client.LLMClientError.
    """
    prompt = build_prompt(question=question, system=system, source_id=source_id, excerpt=excerpt)
    call = call_model(model=model, prompt=prompt)
    parsed = _parse_candidate_json(call["response_text"])
    candidate_id = "LLM-CAND-" + call["response_hash"][:16].upper()
    return {
        "candidate_id": candidate_id,
        "system": system,
        "source_id": source_id,
        "research_question": question,
        "claim_text": parsed["claim_text"] if parsed else None,
        "claim_type_as_documented": parsed.get("claim_type") if parsed else None,
        "confidence_as_documented": parsed.get("confidence_as_documented") if parsed else None,
        "caveats": parsed.get("caveats") if parsed else None,
        "review_status": (
            "extracted_untrusted_pending_source_validation" if parsed else "llm_found_no_claim"
        ),
        "extracted_at": datetime.now(timezone.utc).isoformat(),
        "provider": call["provider"],
        "model": call["model"],
        "prompt_hash": call["prompt_hash"],
        "response_hash": call["response_hash"],
    }


def write_candidates(candidates: list[dict[str, Any]], out_path: Path) -> None:
    """Append candidates to a staging JSON file. Never touches a trusted registry."""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    existing: list[dict[str, Any]] = []
    if out_path.exists():
        existing = json.loads(out_path.read_text(encoding="utf-8"))
    existing.extend(candidates)
    out_path.write_text(json.dumps(existing, indent=2, sort_keys=True) + "\n", encoding="utf-8")
