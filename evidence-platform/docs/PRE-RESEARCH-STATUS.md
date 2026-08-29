# Pre-research completion status

## Outcome

The engineering foundation is operational up to the first scientific promotion gate. It does not activate athlete-facing intelligence.

## Measured import

- 526 canonical records imported into the local store.
- 295 loose source files matched their registered SHA-256 bytes.
- 23 additional registry entries were recovered byte-exactly from preserved nested ZIPs, with a recovery manifest and unchanged originals.
- 318 of 328 source entries now have verified bytes; the remaining 10 unresolved nested paths are quarantined.
- 11 column-shifted formula rows were quarantined; 33 structurally aligned formula rows remain unverified candidates.
- 86 claims await primary-source verification.
- 19 observations await structured extraction review.
- 1,199 external-citation rows resolve to 1,097 unique locator IDs; four primary-verification records bring the searchable external-source table to 1,101 records.
- 2,625 immutable text chunks are indexed from byte-verified source files.
- 3,063 external-citation occurrences are linked to exact source IDs and line numbers.
- 145 evidence edges support bidirectional lineage traversal.
- 15 contradiction/qualification records remain available for adjudication.
- 7 rule candidates all fail promotion.
- 0 models are registered or active.

## Runtime posture

- A caller cannot activate a model by supplying `status: active` or `hash_valid: true`.
- Runtime reads only separately promoted runtime artifacts and independently hashes their files.
- LLM-tainted, machine-extracted, non-deterministic, missing or hash-mismatched artifacts are rejected.
- All five system outputs must be present and non-empty.
- With no approved model, the only output is `abstain` with `NO_APPROVED_MODEL`.
- Synthetic decisions create deterministic receipts and replay byte-equivalently.
- Pain holds only Strength autopilot load increases; illness remains record-only; HRV cannot create or clear pain restrictions.

## Verification

- 49 unit and adversarial tests pass, including the hidden receipt/replay core.
- The existing platform validator passes syntax, registry, link and source-byte checks.
- Full portable JSON Schema instance validation is not bundled; critical runtime constraints are therefore enforced in executable code and adversarial tests. This remaining tooling limitation is not a scientific research blocker, but must be solved before a production release.

## Exact handoff point

Run `python3 -m platform_core.cli --db runtime/evidence.db research-queue`. The first queue stages are corpus-integrity repair and primary-source verification. The first attempt to mark a claim verified is where actual research begins.
