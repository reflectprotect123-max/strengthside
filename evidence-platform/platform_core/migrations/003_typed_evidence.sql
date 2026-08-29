CREATE TABLE IF NOT EXISTS sources_typed(
 source_id TEXT PRIMARY KEY,content_id TEXT NOT NULL,relative_path TEXT NOT NULL,registered_sha256 TEXT NOT NULL,
 system TEXT NOT NULL,evidence_type TEXT NOT NULL,source_quality TEXT NOT NULL,review_status TEXT NOT NULL,
 byte_integrity_status TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS metrics_typed(
 metric_id TEXT PRIMARY KEY,canonical_name TEXT NOT NULL,canonical_unit TEXT NOT NULL,system TEXT NOT NULL,
 definition TEXT NOT NULL,numerator TEXT,denominator TEXT,time_basis TEXT,review_status TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS observations_typed(
 observation_id TEXT PRIMARY KEY,metric_id TEXT NOT NULL,value_text TEXT NOT NULL,numeric_value REAL,unit TEXT NOT NULL,
 numerator TEXT,denominator TEXT,time_basis TEXT,population TEXT,sample_size TEXT,measurement_method TEXT,uncertainty TEXT,
 source_id TEXT NOT NULL,source_line INTEGER,review_status TEXT NOT NULL,
 FOREIGN KEY(metric_id) REFERENCES metrics_typed(metric_id));
CREATE INDEX IF NOT EXISTS idx_obs_compatible ON observations_typed(metric_id,unit,numeric_value);
CREATE TABLE IF NOT EXISTS claims_typed(
 claim_id TEXT PRIMARY KEY,system TEXT NOT NULL,claim_text TEXT NOT NULL,claim_type TEXT NOT NULL,normalized_status TEXT NOT NULL,
 source_id TEXT NOT NULL,source_line INTEGER,review_status TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS formulas_typed(
 formula_id TEXT PRIMARY KEY,system TEXT NOT NULL,status TEXT NOT NULL,expression TEXT NOT NULL,units TEXT NOT NULL,
 source_class TEXT NOT NULL,source_id TEXT NOT NULL,source_line INTEGER,review_status TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS rules_typed(
 rule_id TEXT PRIMARY KEY,purpose TEXT NOT NULL,inputs TEXT NOT NULL,outputs TEXT NOT NULL,evidence_claim_ids TEXT NOT NULL,
 policy_owner TEXT NOT NULL,tests TEXT NOT NULL,status TEXT NOT NULL,source_id TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS record_tombstones(
 tombstone_id TEXT PRIMARY KEY,record_type TEXT NOT NULL,record_id TEXT NOT NULL,last_content_hash TEXT NOT NULL,
 missing_from_import TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS document_chunks(
 chunk_id TEXT PRIMARY KEY,source_id TEXT NOT NULL,source_hash TEXT NOT NULL,start_line INTEGER NOT NULL,end_line INTEGER NOT NULL,
 section_hint TEXT,text_content TEXT NOT NULL,content_hash TEXT NOT NULL,FOREIGN KEY(source_id) REFERENCES sources_typed(source_id));
CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(chunk_id UNINDEXED,source_id UNINDEXED,text_content,content='document_chunks',content_rowid='rowid');
CREATE TRIGGER IF NOT EXISTS chunks_ai AFTER INSERT ON document_chunks BEGIN
 INSERT INTO chunks_fts(rowid,chunk_id,source_id,text_content) VALUES(new.rowid,new.chunk_id,new.source_id,new.text_content);
END;
CREATE TRIGGER IF NOT EXISTS chunks_ad AFTER DELETE ON document_chunks BEGIN
 INSERT INTO chunks_fts(chunks_fts,rowid,chunk_id,source_id,text_content) VALUES('delete',old.rowid,old.chunk_id,old.source_id,old.text_content);
END;
CREATE TABLE IF NOT EXISTS external_citations(
 external_source_id TEXT PRIMARY KEY,locator TEXT NOT NULL,locator_type TEXT NOT NULL,verification_status TEXT NOT NULL,
 retrieval_date TEXT,pmid TEXT,doi TEXT,title TEXT,source_type TEXT,verification_scope TEXT);
CREATE TABLE IF NOT EXISTS citation_occurrences(
 occurrence_id TEXT PRIMARY KEY,external_source_id TEXT NOT NULL,source_id TEXT NOT NULL,source_line INTEGER NOT NULL,
 raw_locator TEXT NOT NULL,classification TEXT NOT NULL,FOREIGN KEY(external_source_id) REFERENCES external_citations(external_source_id));
CREATE INDEX IF NOT EXISTS idx_citations_source ON citation_occurrences(source_id,source_line);
