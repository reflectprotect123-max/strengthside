PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS imports(import_id TEXT PRIMARY KEY,started_at TEXT NOT NULL,completed_at TEXT,source_root TEXT NOT NULL,manifest_hash TEXT NOT NULL,status TEXT NOT NULL,row_count INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS records(
 record_type TEXT NOT NULL,record_id TEXT NOT NULL,system TEXT,status TEXT,title TEXT,text_content TEXT,
 numeric_value REAL,unit TEXT,source_id TEXT,source_path TEXT,source_line INTEGER,payload_json TEXT NOT NULL,
 content_hash TEXT NOT NULL,imported_at TEXT NOT NULL,PRIMARY KEY(record_type,record_id));
CREATE INDEX IF NOT EXISTS idx_records_type_status ON records(record_type,status);
CREATE INDEX IF NOT EXISTS idx_records_system ON records(system);
CREATE INDEX IF NOT EXISTS idx_records_source ON records(source_id);
CREATE INDEX IF NOT EXISTS idx_records_numeric ON records(record_type,numeric_value,unit);
CREATE VIRTUAL TABLE IF NOT EXISTS records_fts USING fts5(record_type UNINDEXED,record_id UNINDEXED,title,text_content,source_path,content='records',content_rowid='rowid');
CREATE TRIGGER IF NOT EXISTS records_ai AFTER INSERT ON records BEGIN
 INSERT INTO records_fts(rowid,record_type,record_id,title,text_content,source_path) VALUES(new.rowid,new.record_type,new.record_id,new.title,new.text_content,new.source_path);
END;
CREATE TRIGGER IF NOT EXISTS records_ad AFTER DELETE ON records BEGIN
 INSERT INTO records_fts(records_fts,rowid,record_type,record_id,title,text_content,source_path) VALUES('delete',old.rowid,old.record_type,old.record_id,old.title,old.text_content,old.source_path);
END;
CREATE TRIGGER IF NOT EXISTS records_au AFTER UPDATE ON records BEGIN
 INSERT INTO records_fts(records_fts,rowid,record_type,record_id,title,text_content,source_path) VALUES('delete',old.rowid,old.record_type,old.record_id,old.title,old.text_content,old.source_path);
 INSERT INTO records_fts(rowid,record_type,record_id,title,text_content,source_path) VALUES(new.rowid,new.record_type,new.record_id,new.title,new.text_content,new.source_path);
END;
CREATE TABLE IF NOT EXISTS reviews(
 review_id TEXT PRIMARY KEY,record_type TEXT NOT NULL,record_id TEXT NOT NULL,stage TEXT NOT NULL,outcome TEXT NOT NULL,
 reviewer TEXT NOT NULL,reviewed_at TEXT NOT NULL,notes TEXT NOT NULL DEFAULT '',evidence_snapshot_hash TEXT NOT NULL,
 FOREIGN KEY(record_type,record_id) REFERENCES records(record_type,record_id));
CREATE TABLE IF NOT EXISTS audit_events(
 sequence INTEGER PRIMARY KEY AUTOINCREMENT,event_id TEXT UNIQUE NOT NULL,event_type TEXT NOT NULL,occurred_at TEXT NOT NULL,
 actor TEXT NOT NULL,subject_type TEXT NOT NULL,subject_id TEXT NOT NULL,payload_json TEXT NOT NULL,previous_hash TEXT NOT NULL,event_hash TEXT UNIQUE NOT NULL);
CREATE TABLE IF NOT EXISTS decision_receipts(
 receipt_id TEXT PRIMARY KEY,created_at TEXT NOT NULL,snapshot_hash TEXT NOT NULL,model_ids_json TEXT NOT NULL,
 action TEXT NOT NULL,decision_json TEXT NOT NULL,replay_payload_json TEXT NOT NULL,validator_results_json TEXT NOT NULL,
 receipt_hash TEXT UNIQUE NOT NULL);
