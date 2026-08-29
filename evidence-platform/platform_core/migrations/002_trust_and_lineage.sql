CREATE TABLE IF NOT EXISTS record_versions(
 version_id TEXT PRIMARY KEY,record_type TEXT NOT NULL,record_id TEXT NOT NULL,content_hash TEXT NOT NULL,
 payload_json TEXT NOT NULL,valid_from_import TEXT NOT NULL,valid_to_import TEXT,superseded_at TEXT);
CREATE INDEX IF NOT EXISTS idx_versions_record ON record_versions(record_type,record_id,valid_to_import);
CREATE TABLE IF NOT EXISTS import_records(
 import_id TEXT NOT NULL,record_type TEXT NOT NULL,record_id TEXT NOT NULL,content_hash TEXT NOT NULL,
 PRIMARY KEY(import_id,record_type,record_id),FOREIGN KEY(import_id) REFERENCES imports(import_id));
CREATE TABLE IF NOT EXISTS quarantine(
 quarantine_id TEXT PRIMARY KEY,import_id TEXT NOT NULL,record_type TEXT NOT NULL,source_locator TEXT NOT NULL,
 reason_code TEXT NOT NULL,details TEXT NOT NULL,payload_json TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS evidence_edges(
 edge_id TEXT PRIMARY KEY,from_type TEXT NOT NULL,from_id TEXT NOT NULL,to_type TEXT NOT NULL,to_id TEXT NOT NULL,
 relationship TEXT NOT NULL,source_locator TEXT,created_at TEXT NOT NULL,
 UNIQUE(from_type,from_id,to_type,to_id,relationship));
CREATE INDEX IF NOT EXISTS idx_edges_from ON evidence_edges(from_type,from_id);
CREATE INDEX IF NOT EXISTS idx_edges_to ON evidence_edges(to_type,to_id);
CREATE TABLE IF NOT EXISTS reviewer_registry(
 reviewer_id TEXT PRIMARY KEY,role TEXT NOT NULL,status TEXT NOT NULL,conflict_declaration TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS promotion_events(
 promotion_id TEXT PRIMARY KEY,record_type TEXT NOT NULL,record_id TEXT NOT NULL,from_stage TEXT NOT NULL,to_stage TEXT NOT NULL,
 outcome TEXT NOT NULL,blockers_json TEXT NOT NULL,evidence_snapshot_hash TEXT NOT NULL,actor TEXT NOT NULL,occurred_at TEXT NOT NULL,event_hash TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS runtime_artifacts(
 artifact_id TEXT PRIMARY KEY,artifact_type TEXT NOT NULL,version TEXT NOT NULL,artifact_path TEXT NOT NULL,
 artifact_hash TEXT NOT NULL,trust_origin TEXT NOT NULL,llm_tainted INTEGER NOT NULL CHECK(llm_tainted IN(0,1)),
 deterministic INTEGER NOT NULL CHECK(deterministic IN(0,1)),status TEXT NOT NULL,approval_event_id TEXT NOT NULL,
 rollback_artifact_id TEXT,activated_at TEXT);
CREATE VIEW IF NOT EXISTS raw_candidates AS SELECT * FROM records;
CREATE VIEW IF NOT EXISTS reviewed_evidence AS
 SELECT r.* FROM records r WHERE EXISTS(
  SELECT 1 FROM reviews v WHERE v.record_type=r.record_type AND v.record_id=r.record_id
  AND v.stage='source_verification' AND v.outcome='verified' AND v.evidence_snapshot_hash=r.content_hash);
CREATE VIEW IF NOT EXISTS runtime_eligible_evidence AS
 SELECT r.* FROM reviewed_evidence r WHERE EXISTS(
  SELECT 1 FROM reviews v WHERE v.record_type=r.record_type AND v.record_id=r.record_id
  AND v.stage='domain_review' AND v.outcome='approved' AND v.evidence_snapshot_hash=r.content_hash);
