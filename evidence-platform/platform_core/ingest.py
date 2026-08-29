from __future__ import annotations
import csv, hashlib, json
from datetime import datetime, timezone
from pathlib import Path

REGISTRIES={
 "source":"sources/source-registry.csv","metric":"structured/metric-dictionary.csv",
 "observation":"structured/observations.csv","claim":"claims/claim-registry.csv",
 "contradiction":"contradictions/contradiction-registry.csv","policy":"policies/policy-registry.csv",
 "rule":"rules/rule-registry.csv","formula":"structured/formula-registry.csv"}
IDS={"source":"source_id","metric":"metric_id","observation":"observation_id","claim":"claim_id","contradiction":"contradiction_id","policy":"policy_id","rule":"rule_id","formula":"formula_id"}

def now(): return datetime.now(timezone.utc).isoformat()
def canonical(v): return json.dumps(v,sort_keys=True,separators=(",",":"),ensure_ascii=False)
def digest(v): return hashlib.sha256(v.encode()).hexdigest()

def manifest_hash(root: Path):
    items=[f"{rel}:{hashlib.sha256((root/rel).read_bytes()).hexdigest()}" for rel in REGISTRIES.values()]
    model=root/"models/model-registry.json"; items.append(f"models/model-registry.json:{hashlib.sha256(model.read_bytes()).hexdigest()}")
    recovery=root/"sources/recovered-nested/recovery-manifest.json"
    if recovery.exists(): items.append(f"sources/recovered-nested/recovery-manifest.json:{hashlib.sha256(recovery.read_bytes()).hexdigest()}")
    return digest("\n".join(items))

def number(value):
    if value is None or ";" in value or not value.strip(): return None
    try: return float(value)
    except ValueError: return None

def pick(row,*keys): return next((row.get(k,"") for k in keys if row.get(k)),"")

def quarantine(db,import_id,kind,locator,reason,payload,details=""):
    raw=canonical(payload); qid="Q-"+digest("|".join((import_id,kind,locator,reason,raw)))[:20].upper()
    db.execute("INSERT OR IGNORE INTO quarantine VALUES(?,?,?,?,?,?,?,?)",(qid,import_id,kind,locator,reason,details,raw,now()))

def source_integrity(root,row):
    base=root/"sources/original-archive/THE-Hybrid-System-Master-Evidence-Archive-2026-08-28"
    path=base/row.get("relative_path","")
    if not path.is_file(): path=root/"sources/recovered-nested"/row.get("relative_path","")
    if not path.is_file(): path=root/"sources/acquired"/row.get("relative_path","")
    if not path.is_file(): return "source_bytes_missing",str(path)
    actual=hashlib.sha256(path.read_bytes()).hexdigest().upper()
    if actual!=row.get("sha256","").upper(): return "source_hash_mismatch",actual
    return "verified_bytes",actual

def formula_is_shifted(row):
    status=row.get("status_as_documented",""); expression=row.get("expression",""); source_class=row.get("source_class_as_documented","")
    unit_tokens={"reps","load units","kilograms","kg","kcal/day","percent","dimensionless","sets"}
    return expression.lower() in unit_tokens and (any(x in status for x in ("+","−","÷","×","=","max","min")) or len(source_class)>40)

def edge(db,from_type,from_id,to_type,to_id,relationship,locator=""):
    eid="EDGE-"+digest("|".join((from_type,from_id,to_type,to_id,relationship)))[:20].upper()
    db.execute("INSERT OR IGNORE INTO evidence_edges VALUES(?,?,?,?,?,?,?,?)",(eid,from_type,from_id,to_type,to_id,relationship,locator,now()))

def source_rows(root):
    for kind,rel in REGISTRIES.items():
        with (root/rel).open(newline="",encoding="utf-8-sig") as handle:
            for row in csv.DictReader(handle): yield kind,{k:(v or "") for k,v in row.items()}
    registry=json.loads((root/"models/model-registry.json").read_text(encoding="utf-8"))
    for model in registry.get("models",[]): yield "model",{k:(v if isinstance(v,str) else canonical(v)) for k,v in model.items()}

def ingest(db,root):
    root=Path(root).resolve(); manifest=manifest_hash(root); import_id="IMPORT-"+manifest[:16].upper()
    old=db.execute("SELECT status,row_count FROM imports WHERE import_id=?",(import_id,)).fetchone()
    if old and old["status"]=="complete":
        from .hydrate import hydrate_typed
        hydrate_typed(db,root)
        return {"import_id":import_id,"status":"already_complete","rows":old["row_count"]}
    count=0
    try:
      db.execute("BEGIN IMMEDIATE")
      db.execute("INSERT OR REPLACE INTO imports(import_id,started_at,source_root,manifest_hash,status,row_count) VALUES(?,?,?,?,?,0)",(import_id,now(),str(root),manifest,"running"))
      seen=set()
      for kind,row in source_rows(root):
        rid=row.get(IDS.get(kind,"model_id")) or row.get("id")
        locator=pick(row,"source_relative_path","relative_path") or rid or "unknown"
        if not rid:
            quarantine(db,import_id,kind,locator,"missing_record_id",row); continue
        if kind=="formula" and formula_is_shifted(row):
            quarantine(db,import_id,kind,locator,"formula_column_shift_detected",row,"Source row preserved; canonical formula import refused."); continue
        if kind=="source":
            integrity,detail=source_integrity(root,row); row["byte_integrity_status"]=integrity
            if integrity!="verified_bytes": quarantine(db,import_id,kind,locator,integrity,row,detail)
        payload=canonical(row); content=digest(payload); text=" | ".join(v for v in row.values() if isinstance(v,str) and v)
        previous=db.execute("SELECT content_hash,payload_json FROM records WHERE record_type=? AND record_id=?",(kind,rid)).fetchone()
        if previous and previous["content_hash"]!=content:
            db.execute("UPDATE record_versions SET valid_to_import=?,superseded_at=? WHERE record_type=? AND record_id=? AND valid_to_import IS NULL",(import_id,now(),kind,rid))
        version_id="VER-"+digest("|".join((kind,rid,content)))[:20].upper()
        db.execute("INSERT OR IGNORE INTO record_versions VALUES(?,?,?,?,?,?,?,?)",(version_id,kind,rid,content,payload,import_id,None,None))
        db.execute("""INSERT INTO records VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)
         ON CONFLICT(record_type,record_id) DO UPDATE SET system=excluded.system,status=excluded.status,title=excluded.title,
         text_content=excluded.text_content,numeric_value=excluded.numeric_value,unit=excluded.unit,source_id=excluded.source_id,
         source_path=excluded.source_path,source_line=excluded.source_line,payload_json=excluded.payload_json,
         content_hash=excluded.content_hash,imported_at=excluded.imported_at""",
         (kind,rid,pick(row,"system"),pick(row,"review_status","normalized_status","status"),
          pick(row,"claim_text","canonical_name","purpose","statement","relative_path","name"),text,
          number(row.get("value")),pick(row,"unit","canonical_unit"),row.get("source_id",""),
          pick(row,"source_relative_path","relative_path"),int(row["source_line"]) if row.get("source_line","").isdigit() else None,
          payload,content,now()))
        db.execute("INSERT OR REPLACE INTO import_records VALUES(?,?,?,?)",(import_id,kind,rid,content)); seen.add((kind,rid)); count+=1
        if row.get("source_id") and kind!="source": edge(db,kind,rid,"source",row["source_id"],"extracted_from",locator)
        if kind=="rule" and row.get("evidence_claim_ids"):
            for claim_id in filter(None,(x.strip() for x in row["evidence_claim_ids"].replace(";",",").split(","))): edge(db,"rule",rid,"claim",claim_id,"supported_by",locator)
      previous=db.execute("SELECT import_id FROM imports WHERE status='complete' AND import_id<>? ORDER BY completed_at DESC LIMIT 1",(import_id,)).fetchone()
      if previous:
        for stale in db.execute("SELECT record_type,record_id,content_hash FROM import_records WHERE import_id=? AND (record_type,record_id) NOT IN (SELECT record_type,record_id FROM import_records WHERE import_id=?)",(previous["import_id"],import_id)):
            tid="TOMB-"+digest(f"{stale['record_type']}|{stale['record_id']}|{import_id}")[:20].upper()
            db.execute("INSERT OR IGNORE INTO record_tombstones VALUES(?,?,?,?,?,?)",(tid,stale["record_type"],stale["record_id"],stale["content_hash"],import_id,now()))
      from .hydrate import hydrate_typed
      hydrate_typed(db,root)
      db.execute("UPDATE imports SET completed_at=?,status='complete',row_count=? WHERE import_id=?",(now(),count,import_id)); db.commit()
    except Exception:
      db.rollback()
      db.execute("INSERT OR REPLACE INTO imports(import_id,started_at,completed_at,source_root,manifest_hash,status,row_count) VALUES(?,?,?,?,?,'failed',0)",(import_id,now(),now(),str(root),manifest)); db.commit(); raise
    return {"import_id":import_id,"status":"complete","rows":count,"manifest_hash":manifest}
