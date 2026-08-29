PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS decision_receipts_v2(
 sequence INTEGER PRIMARY KEY AUTOINCREMENT,
 receipt_id TEXT UNIQUE NOT NULL,
 decision_id TEXT UNIQUE NOT NULL,
 athlete_scope_id TEXT NOT NULL,
 created_at TEXT NOT NULL,
 receipt_version TEXT NOT NULL,
 decision_mode TEXT NOT NULL CHECK(decision_mode IN ('deterministic','lead_fallback','advisory','abstention')),
 prior_receipt_id TEXT,
 previous_receipt_hash TEXT NOT NULL,
 rollback_target_receipt_id TEXT,
 receipt_json TEXT NOT NULL,
 replay_bundle_json TEXT NOT NULL,
 decision_trace_hash TEXT NOT NULL,
 replay_bundle_hash TEXT NOT NULL,
 receipt_hash TEXT UNIQUE NOT NULL,
 silent_user_experience INTEGER NOT NULL CHECK(silent_user_experience = 1),
 FOREIGN KEY(prior_receipt_id) REFERENCES decision_receipts_v2(receipt_id),
 FOREIGN KEY(rollback_target_receipt_id) REFERENCES decision_receipts_v2(receipt_id)
);

CREATE INDEX IF NOT EXISTS idx_decision_receipts_v2_athlete_sequence
 ON decision_receipts_v2(athlete_scope_id,sequence);
CREATE INDEX IF NOT EXISTS idx_decision_receipts_v2_decision
 ON decision_receipts_v2(decision_id);

CREATE TRIGGER IF NOT EXISTS decision_receipts_v2_no_update
BEFORE UPDATE ON decision_receipts_v2
BEGIN
 SELECT RAISE(ABORT,'decision_receipts_v2 is append-only');
END;

CREATE TRIGGER IF NOT EXISTS decision_receipts_v2_no_delete
BEFORE DELETE ON decision_receipts_v2
BEGIN
 SELECT RAISE(ABORT,'decision_receipts_v2 is append-only');
END;

CREATE TABLE IF NOT EXISTS replay_attempts_v2(
 sequence INTEGER PRIMARY KEY AUTOINCREMENT,
 replay_id TEXT UNIQUE NOT NULL,
 receipt_id TEXT NOT NULL,
 attempted_at TEXT NOT NULL,
 evaluator_id TEXT NOT NULL,
 evaluator_version TEXT NOT NULL,
 ok INTEGER NOT NULL CHECK(ok IN (0,1)),
 failure_codes_json TEXT NOT NULL,
 expected_receipt_hash TEXT NOT NULL,
 actual_receipt_hash TEXT,
 expected_trace_hash TEXT NOT NULL,
 actual_trace_hash TEXT,
 expected_bundle_hash TEXT NOT NULL,
 actual_bundle_hash TEXT,
 previous_attempt_hash TEXT NOT NULL,
 attempt_hash TEXT UNIQUE NOT NULL,
 FOREIGN KEY(receipt_id) REFERENCES decision_receipts_v2(receipt_id)
);

CREATE INDEX IF NOT EXISTS idx_replay_attempts_v2_receipt_sequence
 ON replay_attempts_v2(receipt_id,sequence);

CREATE TRIGGER IF NOT EXISTS replay_attempts_v2_no_update
BEFORE UPDATE ON replay_attempts_v2
BEGIN
 SELECT RAISE(ABORT,'replay_attempts_v2 is append-only');
END;

CREATE TRIGGER IF NOT EXISTS replay_attempts_v2_no_delete
BEFORE DELETE ON replay_attempts_v2
BEGIN
 SELECT RAISE(ABORT,'replay_attempts_v2 is append-only');
END;
