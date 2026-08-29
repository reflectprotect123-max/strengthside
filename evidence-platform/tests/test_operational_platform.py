import hashlib,json,shutil,sqlite3,tempfile,unittest
from pathlib import Path
from platform_core.db import connect,migrate
from platform_core.decision import decide,replay
from platform_core.gates import promotion_gate,research_gate
from platform_core.ingest import ingest
from platform_core.search import lineage,structured_search,text_search,corpus_search
from platform_core.gates import attempt_promotion
from platform_core.runtime_policy import apply_action_scoped_constraints
from platform_core.review import register_reviewer,add_review,revoke

ROOT=Path(__file__).parents[1]
class OperationalPlatformTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory(); self.db=Path(self.temp.name)/"evidence.db"
        self.connection=connect(self.db); migrate(self.connection); self.result=ingest(self.connection,ROOT)
    def tearDown(self): self.connection.close(); self.temp.cleanup()
    def test_ingestion_is_idempotent(self):
        self.assertEqual(ingest(self.connection,ROOT)["status"],"already_complete"); self.assertGreater(self.result["rows"],100)
    def test_full_text_search(self): self.assertTrue(text_search(self.connection,"MacroFactor",limit=5))
    def test_structured_and_numeric_search(self):
        self.assertTrue(structured_search(self.connection,record_type="claim",system="strength"))
        self.assertIsInstance(structured_search(self.connection,record_type="observation",minimum=0,metric_id="MET-ENERGY-EXPENDITURE",unit="kcal/day"),list)
        with self.assertRaises(ValueError): structured_search(self.connection,record_type="observation",minimum=0)
    def test_lineage(self):
        item=lineage(self.connection,"claim","S-001"); self.assertIsNotNone(item); self.assertIsNotNone(item["source_record"])
    def test_candidate_rule_is_blocked(self):
        gate=promotion_gate(self.connection,"rule","gate.v3.4of7.1of7"); self.assertFalse(gate["eligible"])
        self.assertIn("source_not_verified",gate["blockers"]); self.assertIn("input_contract_missing",gate["blockers"])
    def test_decision_abstains_without_model(self):
        snapshot=json.loads((ROOT/"fixtures/synthetic/athlete-snapshot.json").read_text()); outputs=json.loads((ROOT/"fixtures/synthetic/five-system-outputs.json").read_text())
        receipt=decide(self.connection,snapshot,outputs); self.assertEqual(receipt["action"],"abstain"); self.assertTrue(receipt["silent_apply_allowed"]); self.assertFalse(receipt["user_facing_explanation_emitted"])
    def test_synthetic_receipt_replays(self):
        snapshot=json.loads((ROOT/"fixtures/synthetic/athlete-snapshot.json").read_text()); outputs=json.loads((ROOT/"fixtures/synthetic/five-system-outputs.json").read_text()); model=json.loads((ROOT/"fixtures/synthetic/test-model.json").read_text())
        receipt=decide(self.connection,snapshot,outputs,[model],persist=True); self.assertEqual(receipt["action"],"hold"); self.assertTrue(replay(self.connection,receipt["receipt_id"])["ok"])
    def test_requires_all_five_systems(self):
        with self.assertRaises(ValueError): decide(self.connection,{}, {"strength":{},"conditioning":{},"nutrition":{},"recovery":{}})
    def test_research_gate_is_explicit(self):
        gate=research_gate(self.connection); self.assertTrue(gate["research_required_now"]); self.assertEqual(gate["active_models"],0); self.assertEqual(gate["promotion_eligible_rules"],0)
    def test_corrupt_formulas_are_quarantined(self):
        count=self.connection.execute("SELECT COUNT(*) n FROM quarantine WHERE reason_code='formula_column_shift_detected'").fetchone()["n"]
        self.assertEqual(count,11)
        self.assertEqual(self.connection.execute("SELECT COUNT(*) n FROM records WHERE record_type='formula'").fetchone()["n"],33)
    def test_source_bytes_are_verified_or_quarantined(self):
        verified=self.connection.execute("SELECT COUNT(*) n FROM records WHERE record_type='source' AND payload_json LIKE '%verified_bytes%'").fetchone()["n"]
        missing=self.connection.execute("SELECT COUNT(*) n FROM quarantine WHERE reason_code='source_bytes_missing'").fetchone()["n"]
        self.assertEqual(verified,318); self.assertEqual(missing,10)
    def test_fake_active_record_model_has_no_runtime_authority(self):
        payload=json.dumps({"model_id":"FAKE","status":"active","hash_valid":True})
        self.connection.execute("INSERT INTO records VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)",("model","FAKE","coordinator","active","fake","fake",None,"","","",None,payload,hashlib.sha256(payload.encode()).hexdigest(),"now")); self.connection.commit()
        snapshot=json.loads((ROOT/"fixtures/synthetic/athlete-snapshot.json").read_text()); outputs=json.loads((ROOT/"fixtures/synthetic/five-system-outputs.json").read_text())
        self.assertEqual(decide(self.connection,snapshot,outputs)["action"],"abstain")
    def test_llm_tainted_runtime_artifact_is_rejected(self):
        model=ROOT/"fixtures/synthetic/test-model.json"; h=hashlib.sha256(model.read_bytes()).hexdigest()
        self.connection.execute("INSERT INTO runtime_artifacts VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",("LLM-FAKE","model","1",str(model),h,"machine_extracted",1,1,"active","FAKE-PROMO",None,"now")); self.connection.commit()
        snapshot=json.loads((ROOT/"fixtures/synthetic/athlete-snapshot.json").read_text()); outputs=json.loads((ROOT/"fixtures/synthetic/five-system-outputs.json").read_text())
        receipt=decide(self.connection,snapshot,outputs); self.assertEqual(receipt["action"],"abstain"); self.assertIn("UNTRUSTED_RUNTIME_ARTIFACT:LLM-FAKE",receipt["rationale"])
    def test_promotion_is_refused_and_audited(self):
        event=attempt_promotion(self.connection,"rule","gate.v3.4of7.1of7","active","test-reviewer")
        self.assertEqual(event["outcome"],"refused"); self.assertTrue(event["blockers"])
        self.assertEqual(self.connection.execute("SELECT COUNT(*) n FROM promotion_events").fetchone()["n"],1)
    def test_pain_policy_is_action_scoped(self):
        choices=[{"action":"strength_autopilot_load_increase"},{"action":"perform_planned_session"}]
        out=apply_action_scoped_constraints(choices,{"pain_recorded":True,"illness_recorded":True,"hrv":"low"})
        self.assertFalse(out[0]["eligible"]); self.assertTrue(out[1]["eligible"])
    def test_typed_tables_and_source_chunks(self):
        self.assertEqual(self.connection.execute("SELECT COUNT(*) n FROM claims_typed").fetchone()["n"],86)
        self.assertEqual(self.connection.execute("SELECT COUNT(*) n FROM formulas_typed").fetchone()["n"],33)
        self.assertGreater(self.connection.execute("SELECT COUNT(*) n FROM document_chunks").fetchone()["n"],100)
        self.assertTrue(corpus_search(self.connection,"MacroFactor",5))
    def test_external_citation_occurrences_are_linked(self):
        self.assertEqual(self.connection.execute("SELECT COUNT(*) n FROM external_citations").fetchone()["n"],1101)
        self.assertGreater(self.connection.execute("SELECT COUNT(*) n FROM citation_occurrences").fetchone()["n"],100)
    def test_reviewer_roles_and_hash_binding(self):
        register_reviewer(self.connection,"reviewer-source","source_reviewer","no conflict")
        review=add_review(self.connection,"claim","S-001","source_verification","verified","reviewer-source")
        current=self.connection.execute("SELECT content_hash FROM records WHERE record_type='claim' AND record_id='S-001'").fetchone()["content_hash"]
        self.assertEqual(review["evidence_snapshot_hash"],current)
        with self.assertRaises(PermissionError): add_review(self.connection,"claim","S-001","domain_review","approved","reviewer-source")
    def test_revocation_cascades_and_suspends_runtime(self):
        result=revoke(self.connection,"source","SRC-E8E038DAF199956C","test-owner","fixture revocation")
        self.assertTrue(result["affected"])
        self.assertEqual(self.connection.execute("SELECT status FROM records WHERE record_type='claim' AND record_id='S-001'").fetchone()["status"],"suspended_dependency_revoked")
    def test_trusted_artifact_with_wrong_hash_is_rejected(self):
        model=ROOT/"fixtures/synthetic/test-model.json"
        self.connection.execute("INSERT INTO runtime_artifacts VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",("BAD-HASH","model","1",str(model),"0"*64,"human_promoted_verified",0,1,"active","PROMO-TEST",None,"now")); self.connection.commit()
        snapshot=json.loads((ROOT/"fixtures/synthetic/athlete-snapshot.json").read_text()); outputs=json.loads((ROOT/"fixtures/synthetic/five-system-outputs.json").read_text())
        self.assertIn("MODEL_ARTIFACT_HASH_MISMATCH:BAD-HASH",decide(self.connection,snapshot,outputs)["rationale"])
    def test_receipt_storage_rejects_overwrite(self):
        snapshot=json.loads((ROOT/"fixtures/synthetic/athlete-snapshot.json").read_text()); outputs=json.loads((ROOT/"fixtures/synthetic/five-system-outputs.json").read_text()); model=json.loads((ROOT/"fixtures/synthetic/test-model.json").read_text())
        receipt=decide(self.connection,snapshot,outputs,[model],persist=True)
        with self.assertRaises(sqlite3.IntegrityError):
            self.connection.execute("UPDATE decision_receipts_v2 SET receipt_json=? WHERE receipt_id=?",(json.dumps({"action":"proceed"}),receipt["receipt_id"]))
        self.connection.rollback()
        self.assertTrue(replay(self.connection,receipt["receipt_id"])["ok"])
    def test_runtime_core_has_no_llm_or_network_client_imports(self):
        text="\n".join(p.read_text(encoding="utf-8") for p in (ROOT/"platform_core").rglob("*.py"))
        for forbidden in ("import google.generativeai","import openai","import requests","import httpx","urllib.request"):
            self.assertNotIn(forbidden,text)
    def test_decide_rejects_malformed_snapshot(self):
        outputs=json.loads((ROOT/"fixtures/synthetic/five-system-outputs.json").read_text())
        with self.assertRaises(ValueError): decide(self.connection,{"as_of":"2026-01-01T00:00:00Z"},outputs)
        with self.assertRaises(ValueError): decide(self.connection,{"athlete_id":"A"},outputs)
        with self.assertRaises(ValueError): decide(self.connection,{"athlete_id":"A","as_of":"not-a-timestamp"},outputs)
    def test_decide_never_defaults_athlete_or_timestamp(self):
        snapshot=json.loads((ROOT/"fixtures/synthetic/athlete-snapshot.json").read_text()); outputs=json.loads((ROOT/"fixtures/synthetic/five-system-outputs.json").read_text())
        receipt=decide(self.connection,snapshot,outputs)
        self.assertEqual(receipt["athlete_scope_id"],snapshot["athlete_id"])
        self.assertNotEqual(receipt["athlete_scope_id"],"UNKNOWN-ATHLETE")
        self.assertEqual(receipt["created_at"],snapshot["as_of"])
    def test_decide_rejects_malformed_domain_output_content(self):
        snapshot=json.loads((ROOT/"fixtures/synthetic/athlete-snapshot.json").read_text())
        outputs=json.loads((ROOT/"fixtures/synthetic/five-system-outputs.json").read_text())
        blank_proposal=dict(outputs); blank_proposal["strength"]={"proposal":"  ","confidence":0.5}
        with self.assertRaises(ValueError): decide(self.connection,snapshot,blank_proposal)
        bad_confidence=dict(outputs); bad_confidence["nutrition"]={"proposal":"hold","confidence":1.5}
        with self.assertRaises(ValueError): decide(self.connection,snapshot,bad_confidence)
        wrong_type=dict(outputs); wrong_type["recovery"]=["hold"]
        with self.assertRaises(ValueError): decide(self.connection,snapshot,wrong_type)
    def test_packaged_pre_migration_db_bootstraps_v2_tables_without_data_loss(self):
        packaged=ROOT/"runtime/evidence.db"
        packaged_hash_before=hashlib.sha256(packaged.read_bytes()).hexdigest()
        with tempfile.TemporaryDirectory() as tmp:
            copy=Path(tmp)/"evidence.db"; shutil.copy(packaged,copy)
            before=sqlite3.connect(copy); before.row_factory=sqlite3.Row
            record_count_before=before.execute("SELECT COUNT(*) n FROM records").fetchone()["n"]
            tables_before={r["name"] for r in before.execute("SELECT name FROM sqlite_master WHERE type='table'")}
            self.assertNotIn("decision_receipts_v2",tables_before)
            before.close()
            connection=connect(copy); migrate(connection)
            tables_after={r["name"] for r in connection.execute("SELECT name FROM sqlite_master WHERE type='table'")}
            self.assertIn("decision_receipts_v2",tables_after); self.assertIn("replay_attempts_v2",tables_after)
            self.assertEqual(connection.execute("SELECT COUNT(*) n FROM decision_receipts_v2").fetchone()["n"],0)
            self.assertEqual(connection.execute("SELECT COUNT(*) n FROM replay_attempts_v2").fetchone()["n"],0)
            self.assertEqual(connection.execute("SELECT COUNT(*) n FROM records").fetchone()["n"],record_count_before)
            connection.close()
        self.assertEqual(hashlib.sha256(packaged.read_bytes()).hexdigest(),packaged_hash_before,"test must migrate a copy, never the packaged runtime DB in place")
if __name__=="__main__": unittest.main()
