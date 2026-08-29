# Evidence operations runbook

## Ingest

Run `ingest` after a registry changes. Imports are identified by a manifest hash and are idempotent.

## Search and trace

Use full-text search for discovery, typed filters for exact retrieval and `lineage` before trusting a result. Search rank never changes evidence status.

## Review and promote

Automated or LLM extraction may create candidate records only. Human source verification and domain review are separate stages. Reviews bind to the record hash, so changed evidence invalidates stale approval. A rule needs verified evidence, an owner, input/output contracts and tests. A model additionally needs a version and artifact hash.

## Decide and replay

The decision shell requires all five system outputs. With no approved active model it returns `abstain`. Persisted test decisions contain hashes that expose receipt tampering.

## Shadow-stage promotion gate (added 29 August 2026)

`promotion_gate` now also checks any rule or model record currently sitting in the `shadow` stage: it must carry a `shadow_report` in its payload (shaped like `platform_core/shadow.py::run_shadow_comparison`'s output) that actually passed - at least one case run, zero errored cases, fully deterministic, and (if golden cases were supplied) full agreement with them. These are hard correctness bars, not tunable science thresholds, so there is nothing here for a reviewer to negotiate down; a record that fails one of these has no business leaving shadow regardless of what it claims about athlete physiology. Blocker codes: `SHADOW_REPORT_MALFORMED`, `SHADOW_REPORT_NO_CASES`, `SHADOW_REPORT_HAD_ERRORS`, `SHADOW_REPORT_NONDETERMINISTIC`, `SHADOW_REPORT_GOLDEN_DISAGREEMENT`.

## Cross-system arbitration (platform_core/arbitration.py, added 29 August 2026)

`decide()` now also looks at what the five engines themselves proposed (`domain_outputs[system]["proposed_actions"][0]`), separately from BIG MAC's own model pool. Three outcomes: no engine proposed anything real (today's universal case for real athlete input - unchanged behavior); every engine that proposed something agrees on the same action (`ENGINE_CANDIDATE_APPLIED`, applied only when BIG MAC's own model pool had nothing); or two or more engines propose *different* actions (`MULTI_DOMAIN_CANDIDATE_NO_ARBITRATION_POLICY` - always abstains and requests lead-fallback, never silently picks a side, because doing so needs a reviewed policy that does not exist). `decision_trace.candidate_ledger` now records every domain's own proposal, not only the winning candidate, with `rejection_reason_codes` explaining why each one that did not win was rejected.

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

## LLM-assisted candidate extraction (research/, added 29 August 2026)

`research/` is a separate package OUTSIDE `platform_core` - it makes real network
calls and must never be imported by the runtime core (`platform_core` has its own
test proving it imports no network/LLM library; `research/`'s own tests prove the
reverse - that `platform_core` never imports `research`). Run it with:

```
OPENROUTER_API_KEY=... python3 -m research.extract_candidates_cli \
  --question "..." --system strength --source-id SRC-XXXX \
  --excerpt-file path.txt --out research/candidates/strength.json
```

Only `google/gemini-*` and `google/gemma-*` model IDs are accepted
(`research/llm_client.py::ALLOWED_MODEL_PREFIXES`) - enforced in code, not just
documented, per the ratified Constitution's Gemini/Gemma-only provider list. Output
lands in `research/candidates/` (gitignored, untrusted scratch) - never written to
`claims/claim-registry.csv` or any other trusted registry directly. A human reviews
the staged JSON and manually promotes anything real via the existing
`register-reviewer` / `add-review` / `promote` CLI commands, exactly like any other
machine-extracted candidate.

Known limitation: OpenRouter's free-tier (`:free`) models share a rate-limited pool
across all free users; a 429 there is expected friction, not a bug - the client
raises a clear `LLMClientError`, never a crash or a silent empty result.

## Phase 2: bounded Gemini/Gemma lead-fallback gateway (added 29 August 2026)

`platform_core/llm/` (contracts, packet_builder, envelope, router, gateway,
response_builder, orchestrate) is deterministic - no network imports, its own test
proves it never imports `llm_adapters`. Concrete providers
(`llm_adapters/mock.py`, `gemma_local.py`, `gemini_cloud.py`) live outside
`platform_core` and are injected in, never imported by it.

`decide()` gained an optional `lead_fallback=` kwarg (a dict of
`platform_core.llm.orchestrate.attempt_lead_fallback` kwargs: `routing_policy`,
`lead`, `backup`, `fallback_envelope`, `current_plan`, `privacy_projection`,
`policy_refs`, `whole_athlete_state`, ...). Omitting it keeps every existing
caller's behavior byte-for-byte unchanged. When given, it is consulted **at most
once**, only when the deterministic gate would otherwise abstain with
`NO_DETERMINISTIC_ANSWER`:

1. Build a `CompleteDecisionPacket` + `LLMDecisionRequest` (validated against
   `contracts/THE-HYBRID-SHARED-DATA-CONTRACT-v1.schema.json`, hand-validated -
   `platform_core` stays dependency-free by design, no `jsonschema` at runtime).
2. Call the lead provider, then backup on any failure - a provider exception is
   data, never a crash (`gateway.call_with_fallback` never raises).
3. Map the model's minimal JSON output into a full `ActionCandidate` +
   `LLMDecisionResponse` (`response_builder.py`) - the model is never asked to
   author the structural envelope (provenance, uncertainty objects, `kind`
   constants), only the semantic content.
4. Validate the mapped candidate against the `FallbackActionEnvelope` (bounds,
   allowed action/target types, forbidden combinations).
5. On success: freeze the packet/prompt/request/envelope into
   `replay_bundle["frozen_llm_context"]` and the response into
   `frozen_llm_response`, then re-run the pure evaluator - which now reads the
   frozen response instead of calling anything. **Replay reproduces a
   lead-fallback decision without ever calling a provider again** - this is
   asserted directly in `tests/test_llm_gateway.py`, not just claimed.
6. On any failure at any step (provider down, malformed output, envelope
   violation): the reason codes are recorded and the plan is left unchanged -
   same `abstain` outcome as no model existing at all (Constitution section 13).

Known contract-shape fix worth remembering: the shared contract's `Identifier`
pattern forbids `/`, but real model ids (e.g. OpenRouter's
`google/gemma-4-31b-it:free`) contain one - `response_builder._sanitize_model_id`
maps it onto a valid Identifier rather than either rejecting real model ids or
loosening the contract's own pattern.

Known deliberate gap: `domain_outputs` / `whole_athlete_state` inside
`CompleteDecisionPacket` are checked for presence only, not deep-validated
against this contract's own `DomainOutputSet`/`WholeAthleteState` definitions -
those are a different, richer shape than what Phase 1 actually built
(`engines.common`'s engine-output shape and `schemas/athlete-state.schema.json`).
Reconciling the two is a real, separate piece of work, not silently done here.
