# Evidence operations runbook

## Ingest

Run `ingest` after a registry changes. Imports are identified by a manifest hash and are idempotent.

## Search and trace

Use full-text search for discovery, typed filters for exact retrieval and `lineage` before trusting a result. Search rank never changes evidence status.

## Review and promote

Automated or LLM extraction may create candidate records only. Human source verification and domain review are separate stages. Reviews bind to the record hash, so changed evidence invalidates stale approval. A rule needs verified evidence, an owner, input/output contracts and tests. A model additionally needs a version and artifact hash.

## Decide and replay

The decision shell requires all five system outputs. With no approved active model it returns `abstain`. Persisted test decisions contain hashes that expose receipt tampering.

## LLM boundary

Gemini or another LLM may search, classify, summarize and propose structured rows offline. It cannot change active rules, model parameters, safety policy or athlete decisions.
