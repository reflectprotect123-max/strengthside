"""CLI: run the LLM candidate-extraction assistant against real corpus text.

Example:
    python3 -m research.extract_candidates_cli \\
        --question "Does load progression benefit from RIR-based autoregulation?" \\
        --system strength --source-id SRC-XXXX \\
        --excerpt-file /tmp/excerpt.txt \\
        --out research/candidates/strength.json
"""

from __future__ import annotations

import argparse
from pathlib import Path

from .candidate_extraction import extract_candidate, write_candidates

SYSTEMS = ("strength", "conditioning", "nutrition", "recovery", "coordinator")


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--question", required=True)
    parser.add_argument("--system", required=True, choices=SYSTEMS)
    parser.add_argument("--source-id", required=True)
    parser.add_argument("--excerpt-file", required=True)
    parser.add_argument("--model")
    parser.add_argument("--out", default="research/candidates/llm-extracted.json")
    args = parser.parse_args(argv)

    excerpt = Path(args.excerpt_file).read_text(encoding="utf-8")
    kwargs = dict(
        question=args.question, system=args.system, source_id=args.source_id, excerpt=excerpt
    )
    if args.model:
        kwargs["model"] = args.model
    candidate = extract_candidate(**kwargs)
    write_candidates([candidate], Path(args.out))
    print(f"wrote candidate {candidate['candidate_id']} (review_status={candidate['review_status']}) to {args.out}")


if __name__ == "__main__":
    main()
