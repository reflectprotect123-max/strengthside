PRAGMA foreign_keys = ON;

-- Defect 10: replay attempts against a receipt_id that cannot even be looked
-- up (not found, or its stored JSON is unreadable) must still be recorded.
-- replay_attempts_v2 has a FOREIGN KEY on receipt_id -> decision_receipts_v2,
-- so a genuinely nonexistent receipt_id cannot be inserted there. This table
-- has no such FK: it records the fact an attempt was made and why it could
-- not proceed, independent of whether the receipt row exists.
CREATE TABLE IF NOT EXISTS replay_lookup_failures_v2(
 sequence INTEGER PRIMARY KEY AUTOINCREMENT,
 failure_id TEXT UNIQUE NOT NULL,
 requested_receipt_id TEXT NOT NULL,
 attempted_at TEXT NOT NULL,
 failure_code TEXT NOT NULL,
 previous_failure_hash TEXT NOT NULL,
 failure_hash TEXT UNIQUE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_replay_lookup_failures_v2_receipt
 ON replay_lookup_failures_v2(requested_receipt_id);

CREATE TRIGGER IF NOT EXISTS replay_lookup_failures_v2_no_update
BEFORE UPDATE ON replay_lookup_failures_v2
BEGIN
 SELECT RAISE(ABORT,'replay_lookup_failures_v2 is append-only');
END;

CREATE TRIGGER IF NOT EXISTS replay_lookup_failures_v2_no_delete
BEFORE DELETE ON replay_lookup_failures_v2
BEGIN
 SELECT RAISE(ABORT,'replay_lookup_failures_v2 is append-only');
END;
