# THE Hybrid System evidence platform

Release status: **operational pre-research platform - not athlete-decision ready**.

## v0.3 hidden receipt and replay layer

The first post-foundation runtime component is now implemented: an append-only,
athlete-scoped decision ledger with deterministic replay, tamper detection,
rollback references, frozen artifact verification, and frozen Gemini/Gemma
contribution records. Normal operation remains silent and emits no unsolicited
user explanation. Gemini/Gemma has no direct write authority.

No coaching logic has been activated; this milestone records and verifies
decisions but does not decide strength progression.

## v0.2 operational layer

This package now includes a runnable local evidence store, idempotent ingestion, full-text and structured search, lineage, promotion gates, a deterministic five-system decision shell, receipts, replay, and synthetic-only fixtures. Start with `docs/PRE-RESEARCH-BUILD.md` and `docs/WHEN-RESEARCH-BECOMES-REQUIRED.md`.

No scientific rule or model is active. That is the correct state until primary-source verification and domain review begin.

Current measured status is in `docs/PRE-RESEARCH-STATUS.md`. Research work is exposed as a deterministic queue with `python3 -m platform_core.cli --db runtime/evidence.db research-queue`.

The next-program scopes are in `docs/scopes/`: non-LLM AI design, research depth, and the combined AI-to-research crosswalk.

This folder preserves the supplied archive, inventories every extracted file, separates evidence from product policy and executable logic, and defines a traceable non-LLM control-system foundation. It does not modify or wire any application repository, does not build a chatbot, and activates no athlete-decision model.

## Architecture

Strength, Conditioning, Nutrition, Recovery, and Coordinator publish versioned outputs into the **Multi-model adaptive control system**. That higher-level system normalizes data, estimates a vector athlete state, generates deterministic candidates, applies hard safety and feasibility constraints, ranks only feasible candidates using approved model/parameter versions, validates the result, and emits an immutable replayable receipt.

## Traceability chain

`source -> extracted record -> normalized metric -> evidence claim -> synthesis/contradiction -> product policy -> executable rule -> model version -> validator result -> decision -> receipt`

## Folder map

- `docs/`: architecture, gap analysis, lane reviews, roadmap and final report.
- `schemas/`: JSON Schemas for sources, studies, populations, metrics, observations, cells, formulas, claims, contradictions, policies, rules, models, athlete state and receipts.
- `sources/`: original ZIP, unchanged extracted source tree, canonical file registry, and external-citation registry.
- `structured/`: inventory, nested archive inventory, metrics, observations, formulas and gap map.
- `claims/`, `contradictions/`, `policies/`, `rules/`: separated registries.
- `models/`: model-registry design; no active model.
- `validators/`, `tests/`: validation code, fixtures and acceptance criteria.
- `decisions/`: receipt/replay design; no real athlete decisions.
- `releases/`: checksums, validation reports and packaged release.
- `work/`: internal build and QA material, retained for audit.

## Measured corpus baseline

- Extracted files: 328
- Source-file bytes: 12,909,710
- Text lines in directly readable extracted files: 101,719
- External citation registry rows: 1199 (1097 unique locator IDs; duplicate occurrences are preserved)
- Explicit claim rows extracted: 86
- Structured observations created: 19
- Tables detected/estimated: 387
- Canonical metrics defined: 32
- Explicit formula rows extracted: 44
- Open gap categories: 5
- Curated contradiction/qualification records: 15
- Candidate rule rows: 7
- Usable executable rules: **0** (none has complete inputs, outputs, owner, evidence validation, model version and tests)

Counts are deliberately conservative and definitions are documented in `docs/final-status-report.md`. Duplicate archive material is not counted as new evidence.

## Trust boundary

Archive labels such as “final”, “validated”, “high confidence”, or “PubMed” are recorded as source assertions. They are not promoted to verified facts until a reviewer validates the cited source, population, method, result, and schema record. Missing values remain missing.

## Start here

1. Read `docs/final-status-report.md` and `docs/five-system-gap-report.md`.
2. Review `structured/archive-inventory.csv` and `contradictions/exact-duplicates.csv`.
3. Validate records with `validators/validate_platform.py`.
4. Approve owners and evidence before promoting any policy, rule or model.
