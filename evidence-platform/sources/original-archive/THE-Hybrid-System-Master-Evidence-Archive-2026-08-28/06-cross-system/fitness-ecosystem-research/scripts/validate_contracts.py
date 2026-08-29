#!/usr/bin/env python3
"""Small dependency-free checks for the research handoff contracts."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read_json(path: Path) -> object:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:  # pragma: no cover - command-line error path
        raise SystemExit(f"invalid JSON: {path}: {exc}") from exc


def main() -> int:
    contract_dir = ROOT / "contracts"
    fixture_dir = ROOT / "fixtures"
    schemas = sorted(contract_dir.glob("*.schema.json"))
    if not schemas:
        raise SystemExit("no contract schemas found")

    for path in schemas:
        doc = read_json(path)
        if not isinstance(doc, dict):
            raise SystemExit(f"schema must be an object: {path}")
        for key in ("$schema", "$id", "title", "type", "required", "properties"):
            if key not in doc:
                raise SystemExit(f"schema missing {key}: {path}")
        if doc["type"] != "object" or not isinstance(doc["required"], list):
            raise SystemExit(f"schema has unexpected top-level shape: {path}")
        properties = doc["properties"]
        if any(field not in properties for field in doc["required"]):
            raise SystemExit(f"schema required field is not declared: {path}")

    for path in sorted(contract_dir.glob("*.json")) + sorted(fixture_dir.glob("*.json")):
        read_json(path)

    manifest = read_json(contract_dir / "shared-core-contract.json")
    if manifest.get("status") != "proposal":
        raise SystemExit("shared-core contract must remain a proposal until baseline approval")
    invariants = set(manifest.get("non_negotiable_invariants", []))
    required_invariants = {
        "missing-is-not-zero",
        "provider-observation-is-not-app-derived-state",
        "hrv-never-clears-pain-or-illness-hold",
        "only-coordinator-publishes-combined-plan",
    }
    if not required_invariants <= invariants:
        raise SystemExit("shared-core contract lost a non-negotiable invariant")

    print(f"validated {len(schemas)} schemas and JSON fixtures")
    return 0


if __name__ == "__main__":
    sys.exit(main())
