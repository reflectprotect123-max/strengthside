# Evidence operations runbook

## Ingest

Run `ingest` after a registry changes. Imports are identified by a manifest hash and are idempotent.

## Search and trace

Use full-text search for discovery, typed filters for exact retrieval and `lineage` before trusting a result. Search rank never changes evidence status.

## Review and promote

Automated or LLM extraction may create candidate records only. Human source verification and domain review are separate stages. Reviews bind to the record hash, so changed evidence invalidates stale approval. A rule needs verified evidence, an owner, input/output contracts and tests. A model additionally needs a version and artifact hash.

## Decide and replay

The decision shell requires all five system outputs. With no approved active model it returns `abstain`. Persisted test decisions contain hashes that expose receipt tampering.

## Legacy receipt ledger (decision_receipts vs decision_receipts_v2)

`decision_receipts` (migration 001) is **frozen**: no code in `platform_core` writes to
it any more (`test_operational_platform.py::test_legacy_decision_receipts_table_is_never_written_to`
enforces this by scanning the source). It is kept only because a packaged runtime
database may still carry pre-v0.3 rows, and `hybrid-evidence stats` reports its count
for audit visibility. `decision_receipts_v2` (migration 004) is the only table
`commit_receipt` ever writes to. There is no automatic migration of old rows into v2:
the v1 schema has no `receipt_version`, `decision_mode`, hash chain, or LLM-contribution
fields to populate, so a mechanical conversion would either invent data or leave those
fields null in a schema that requires them - both worse than leaving old rows exactly
as they were recorded. If a v1 row is ever needed for an audit, read it directly from
`decision_receipts`; it is never a candidate for `replay_receipt`, which only
understands the v2 shape.

## LLM boundary

Gemini or another LLM may search, classify, summarize and propose structured rows offline. It cannot change active rules, model parameters, safety policy or athlete decisions.
