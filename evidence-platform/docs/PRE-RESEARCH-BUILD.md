# Pre-research operational build

This release takes THE Hybrid System to the last honest point before scientific research must begin. It converts the static evidence foundation into a local, deterministic evidence-operations platform.

## What is operational

- SQLite storage with foreign keys, WAL mode, indexes and full-text search.
- Idempotent imports from the existing source, metric, observation, formula, claim, contradiction, policy, rule and model registries.
- Exact text, typed, system, status, unit and numeric-range search.
- Claim-to-source lineage with source path, source line and review history.
- Promotion gates for claims, policies, rules and models.
- A five-system decision shell for Strength, Conditioning, Nutrition, Recovery and Coordinator outputs.
- Deterministic receipts and replay verification.
- Safe abstention when no approved model exists.
- Synthetic-only fixtures that prove the plumbing without pretending the science is approved.

## Deliberately not built

No scientific threshold, coefficient, optimization weight, athlete calibration, clinical rule or active model is inferred. Gemini or another LLM may later help extract candidate data, but its output must enter as untrusted records and pass the same gates.

## Quick start

```bash
python3 -m platform_core.cli --db runtime/evidence.db init-db
python3 -m platform_core.cli --db runtime/evidence.db ingest --root .
python3 -m platform_core.cli --db runtime/evidence.db search MacroFactor --type claim
python3 -m platform_core.cli --db runtime/evidence.db lineage claim S-001
python3 -m platform_core.cli --db runtime/evidence.db gate-check rule gate.v3.4of7.1of7
python3 -m platform_core.cli --db runtime/evidence.db research-gate
python3 -m unittest discover -s tests -v
```

The runtime database is generated locally. Registries and immutable source files remain authoritative.
