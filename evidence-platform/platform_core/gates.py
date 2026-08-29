from __future__ import annotations
import json
import hashlib
from datetime import datetime,timezone

APPROVED={"approved","verified"}

def promotion_gate(db,record_type,record_id):
    row=db.execute("SELECT * FROM records WHERE record_type=? AND record_id=?",(record_type,record_id)).fetchone()
    if not row: return {"eligible":False,"blockers":["record_not_found"]}
    payload=json.loads(row["payload_json"]); blockers=[]
    reviews=list(db.execute("SELECT * FROM reviews WHERE record_type=? AND record_id=?",(record_type,record_id)))
    valid=[r for r in reviews if r["outcome"] in APPROVED and r["evidence_snapshot_hash"]==row["content_hash"] and db.execute("SELECT 1 FROM reviewer_registry WHERE reviewer_id=? AND status='active'",(r["reviewer"],)).fetchone()]
    stages={r["stage"] for r in valid}; reviewers={r["reviewer"] for r in valid}
    if "source_verification" not in stages: blockers.append("source_not_verified")
    if "domain_review" not in stages: blockers.append("domain_review_missing")
    if len(reviewers)<2: blockers.append("independent_reviewers_missing")
    if record_type in {"rule","model"}:
        if db.execute("SELECT 1 FROM records WHERE record_type='contradiction' AND status LIKE 'open_%' LIMIT 1").fetchone(): blockers.append("open_contradictions_unresolved")
        owner=payload.get("policy_owner") or payload.get("owner")
        if owner in {None,"","UNASSIGNED"}: blockers.append("owner_missing")
        if payload.get("tests","") in {"","MISSING","[]"}: blockers.append("tests_missing")
    if record_type=="rule":
        if payload.get("inputs","") in {"","UNSPECIFIED"}: blockers.append("input_contract_missing")
        if payload.get("outputs","") in {"","UNSPECIFIED"}: blockers.append("output_contract_missing")
        if not payload.get("evidence_claim_ids"): blockers.append("evidence_links_missing")
    if record_type=="model":
        if not payload.get("version"): blockers.append("version_missing")
        if not payload.get("artifact_hash"): blockers.append("artifact_hash_missing")
    return {"record_type":record_type,"record_id":record_id,"eligible":not blockers,"blockers":blockers}

def research_gate(db):
    counts={r["record_type"]:r["n"] for r in db.execute("SELECT record_type,COUNT(*) n FROM records GROUP BY record_type")}
    pending=db.execute("SELECT COUNT(*) n FROM records WHERE record_type='claim' AND status NOT LIKE '%verified%'").fetchone()["n"]
    rules=[promotion_gate(db,"rule",r["record_id"]) for r in db.execute("SELECT record_id FROM records WHERE record_type='rule'")]
    models=[promotion_gate(db,"model",r["record_id"]) for r in db.execute("SELECT record_id FROM records WHERE record_type='model'")]
    return {"platform_stage":"pre_research_operations_complete","record_counts":counts,"claims_pending_verification":pending,
     "candidate_rules":len(rules),"promotion_eligible_rules":sum(x["eligible"] for x in rules),"registered_models":len(models),
     "active_models":db.execute("SELECT COUNT(*) n FROM records WHERE record_type='model' AND status='active'").fetchone()["n"],
     "research_required_now":True,
     "first_research_gate":"Verify primary sources and domain applicability for a narrow claim set before selecting any threshold, coefficient, rule, policy, or model.",
     "prohibited_until_gate_passes":["activate scientific rules","fit or activate athlete models","choose optimization weights","set safety thresholds","silently apply athlete decisions"],
     "rule_gate_details":rules,"model_gate_details":models}

def research_queue(db,limit=200):
    queue=[]
    latest=db.execute("SELECT import_id FROM imports WHERE status='complete' ORDER BY completed_at DESC LIMIT 1").fetchone()
    for row in db.execute("SELECT quarantine_id,record_type,source_locator,reason_code,details FROM quarantine WHERE import_id=? ORDER BY reason_code,source_locator",(latest["import_id"],)):
        priority=1 if row["reason_code"] in {"source_hash_mismatch","formula_column_shift_detected"} else 2
        queue.append({"priority":priority,"stage":"corpus_integrity","item_type":row["record_type"],"item_id":row["quarantine_id"],"reason":row["reason_code"],"locator":row["source_locator"]})
    for row in db.execute("SELECT record_id,system,status,source_id,source_path,source_line FROM records WHERE record_type='claim' AND status NOT LIKE '%verified%' ORDER BY system,record_id"):
        queue.append({"priority":3,"stage":"primary_source_verification","item_type":"claim","item_id":row["record_id"],"reason":row["status"],"system":row["system"],"source_id":row["source_id"],"locator":f"{row['source_path']}:{row['source_line'] or ''}"})
    for row in db.execute("SELECT record_id,system,status,source_id,source_path,source_line FROM records WHERE record_type='observation' ORDER BY system,record_id"):
        queue.append({"priority":4,"stage":"structured_extraction_review","item_type":"observation","item_id":row["record_id"],"reason":row["status"],"system":row["system"],"source_id":row["source_id"],"locator":f"{row['source_path']}:{row['source_line'] or ''}"})
    for row in db.execute("SELECT record_id,status,title FROM records WHERE record_type='contradiction' AND status NOT LIKE 'resolved%' ORDER BY record_id"):
        queue.append({"priority":5,"stage":"contradiction_adjudication","item_type":"contradiction","item_id":row["record_id"],"reason":row["status"],"title":row["title"]})
    for row in db.execute("SELECT record_id FROM records WHERE record_type='rule' ORDER BY record_id"):
        gate=promotion_gate(db,"rule",row["record_id"]); queue.append({"priority":6,"stage":"rule_promotion","item_type":"rule","item_id":row["record_id"],"reason":",".join(gate["blockers"])})
    return queue[:limit]

def canonical(v): return json.dumps(v,sort_keys=True,separators=(",",":"),ensure_ascii=False)

def attempt_promotion(db,record_type,record_id,to_stage,actor):
    gate=promotion_gate(db,record_type,record_id); row=db.execute("SELECT status,content_hash FROM records WHERE record_type=? AND record_id=?",(record_type,record_id)).fetchone()
    allowed={"claim":{"extracted_untrusted_pending_source_validation":"source_verified","source_verified":"method_appraised","method_appraised":"synthesis_adjudicated","synthesis_adjudicated":"applicability_approved","applicability_approved":"verified_for_use"},
      "rule":{"candidate_not_executable":"evidence_complete","evidence_complete":"policy_owned","policy_owned":"implemented","implemented":"tests_passed","tests_passed":"offline_validated","offline_validated":"shadow","shadow":"active"},
      "model":{"draft":"validated_offline","validated_offline":"shadow","shadow":"limited_release","limited_release":"active"}}
    if row and allowed.get(record_type,{}).get(row["status"])!=to_stage: gate["blockers"].append("invalid_or_skipped_lifecycle_transition"); gate["eligible"]=False
    outcome="approved" if gate["eligible"] else "refused"
    body={"record_type":record_type,"record_id":record_id,"from_stage":row["status"] if row else "missing","to_stage":to_stage,"outcome":outcome,"blockers":gate["blockers"],"evidence_snapshot_hash":row["content_hash"] if row else "","actor":actor}
    event_hash=hashlib.sha256(canonical(body).encode()).hexdigest(); pid="PROMO-"+event_hash[:20].upper(); stamp=datetime.now(timezone.utc).isoformat()
    db.execute("INSERT OR IGNORE INTO promotion_events VALUES(?,?,?,?,?,?,?,?,?,?,?)",(pid,record_type,record_id,body["from_stage"],to_stage,outcome,canonical(gate["blockers"]),body["evidence_snapshot_hash"],actor,stamp,event_hash))
    if outcome=="approved": db.execute("UPDATE records SET status=? WHERE record_type=? AND record_id=?",(to_stage,record_type,record_id))
    db.commit()
    return {"promotion_id":pid,**body,"event_hash":event_hash}
