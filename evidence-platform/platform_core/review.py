from __future__ import annotations
import hashlib,json
from datetime import datetime,timezone

ROLE_FOR_STAGE={"source_verification":"source_reviewer","method_appraisal":"domain_reviewer","synthesis_review":"domain_reviewer","applicability_review":"domain_reviewer","domain_review":"domain_reviewer","policy_review":"policy_owner","runtime_review":"runtime_approver"}
OUTCOMES={stage:({"verified","rejected"} if stage=="source_verification" else {"approved","rejected"}) for stage in ROLE_FOR_STAGE}

def stamp(): return datetime.now(timezone.utc).isoformat()
def canonical(v): return json.dumps(v,sort_keys=True,separators=(",",":"),ensure_ascii=False)

def register_reviewer(db,reviewer_id,role,conflict_declaration):
    if role not in set(ROLE_FOR_STAGE.values()): raise ValueError("Unknown reviewer role")
    if not conflict_declaration.strip(): raise ValueError("Conflict declaration is required")
    db.execute("INSERT OR REPLACE INTO reviewer_registry VALUES(?,?,?,?)",(reviewer_id,role,"active",conflict_declaration)); db.commit()
    return {"reviewer_id":reviewer_id,"role":role,"status":"active"}

def add_review(db,record_type,record_id,stage,outcome,reviewer_id,notes=""):
    if stage not in ROLE_FOR_STAGE or outcome not in OUTCOMES[stage]: raise ValueError("Invalid controlled review stage/outcome")
    reviewer=db.execute("SELECT * FROM reviewer_registry WHERE reviewer_id=? AND status='active'",(reviewer_id,)).fetchone()
    if not reviewer or reviewer["role"]!=ROLE_FOR_STAGE[stage]: raise PermissionError("Reviewer is not active in the required independent role")
    record=db.execute("SELECT content_hash FROM records WHERE record_type=? AND record_id=?",(record_type,record_id)).fetchone()
    if not record: raise KeyError("Record not found")
    body={"record_type":record_type,"record_id":record_id,"stage":stage,"outcome":outcome,"reviewer":reviewer_id,"evidence_snapshot_hash":record["content_hash"]}
    rid="REV-"+hashlib.sha256(canonical(body).encode()).hexdigest()[:20].upper()
    db.execute("INSERT OR REPLACE INTO reviews VALUES(?,?,?,?,?,?,?,?,?)",(rid,record_type,record_id,stage,outcome,reviewer_id,stamp(),notes,record["content_hash"])); db.commit()
    return {"review_id":rid,**body}

def revoke(db,record_type,record_id,actor,reason):
    if not reason.strip(): raise ValueError("Revocation reason required")
    record=db.execute("SELECT content_hash,status FROM records WHERE record_type=? AND record_id=?",(record_type,record_id)).fetchone()
    if not record: raise KeyError("Record not found")
    db.execute("UPDATE records SET status='revoked' WHERE record_type=? AND record_id=?",(record_type,record_id))
    affected=[]
    frontier=[(record_type,record_id)]; seen=set(frontier)
    while frontier:
        kind,rid=frontier.pop(0)
        for edge in db.execute("SELECT from_type,from_id FROM evidence_edges WHERE to_type=? AND to_id=?",(kind,rid)):
            dep=(edge["from_type"],edge["from_id"])
            if dep in seen: continue
            seen.add(dep); frontier.append(dep); affected.append({"record_type":dep[0],"record_id":dep[1]})
            db.execute("UPDATE records SET status='suspended_dependency_revoked' WHERE record_type=? AND record_id=?",dep)
    if record_type in {"source","claim","observation","formula"}: db.execute("UPDATE runtime_artifacts SET status='suspended' WHERE status='active'")
    body={"record_type":record_type,"record_id":record_id,"actor":actor,"reason":reason,"affected":affected,"snapshot_hash":record["content_hash"]}
    event_hash=hashlib.sha256(canonical(body).encode()).hexdigest(); eid="REVOKE-"+event_hash[:20].upper()
    previous=db.execute("SELECT event_hash FROM audit_events ORDER BY sequence DESC LIMIT 1").fetchone(); prev=previous["event_hash"] if previous else "GENESIS"
    db.execute("INSERT INTO audit_events(event_id,event_type,occurred_at,actor,subject_type,subject_id,payload_json,previous_hash,event_hash) VALUES(?,?,?,?,?,?,?,?,?)",(eid,"revocation",stamp(),actor,record_type,record_id,canonical(body),prev,event_hash)); db.commit()
    return {"event_id":eid,"affected":affected,"runtime_artifacts_suspended":record_type in {"source","claim","observation","formula"}}
