# Hidden decision receipt and replay core v2

Status: **operational engineering core; no coaching model is activated**.

Every BIG MAC result—deterministic action, Gemini/Gemma lead-fallback action,
hold, or abstention—must create a hidden receipt. Normal athlete use shows no
prompt, notification, or unsolicited explanation.

## Guarantees

- Receipts are append-only. SQLite triggers reject update and delete.
- Each athlete's receipts form a SHA-256 chain.
- The decision trace and complete replay bundle have independent hashes.
- Frozen model/rule artifacts are rehashed during replay.
- A Gemini/Gemma response is frozen and rehashed; replay never calls the model.
- An LLM contribution must declare write authority as none.
- Lead-fallback receipts require a Gemini/Gemma contribution and fallback-envelope hash.
- Every replay attempt is itself append-only and hash-chained.
- Rollback points at an earlier receipt; it never rewrites history.
- A failed replay records exact failure codes.

## Flow

1. Freeze decision inputs, artifacts, and any LLM response.
2. Execute the versioned evaluator.
3. Store the complete candidate and validator trace.
4. Hash the trace and replay bundle independently.
5. Link the receipt to the prior athlete receipt.
6. Commit one immutable row.
7. Replay with the exact evaluator version and frozen bundle.
8. Compare canonical bytes and hashes.
9. Append the replay result.

The canonical JSON format is HYBRID-CANONICAL-JSON-v1. It uses UTF-8 JSON,
sorted object keys, compact separators, and rejects non-finite numbers and
non-JSON values. It is deliberately versioned and does not claim full RFC 8785
compatibility.

Normative schema: schemas/decision-receipt.schema.json.

Implementation:

- platform_core/receipt_replay.py
- platform_core/migrations/004_receipt_replay_v2.sql
- tests/test_receipt_replay.py
