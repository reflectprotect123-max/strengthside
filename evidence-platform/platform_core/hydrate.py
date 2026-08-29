from __future__ import annotations
import csv,hashlib,json,re
from pathlib import Path
from .ingest import canonical,digest,now,number

TEXT_EXTENSIONS={".md",".txt",".csv",".json",".yaml",".yml",".py",".ts",".tsx",".js",".html",".xml"}
URL_RE=re.compile(r"https?://[^\s<>\]\[\)\(\"']+")

def hydrate_typed(db,root:Path):
    for row in db.execute("SELECT * FROM records"):
        p=json.loads(row["payload_json"]); kind=row["record_type"]
        if kind=="source": db.execute("INSERT OR REPLACE INTO sources_typed VALUES(?,?,?,?,?,?,?,?,?)",(p["source_id"],p.get("content_id",""),p.get("relative_path",""),p.get("sha256",""),p.get("system",""),p.get("evidence_type",""),p.get("source_quality",""),p.get("review_status",""),p.get("byte_integrity_status","unknown")))
        elif kind=="metric": db.execute("INSERT OR REPLACE INTO metrics_typed VALUES(?,?,?,?,?,?,?,?,?)",(p["metric_id"],p.get("canonical_name",""),p.get("canonical_unit",""),p.get("system",""),p.get("definition",""),p.get("numerator",""),p.get("denominator",""),p.get("time_basis",""),p.get("review_status","")))
        elif kind=="observation": db.execute("INSERT OR REPLACE INTO observations_typed VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",(p["observation_id"],p.get("metric_id",""),p.get("value",""),number(p.get("value")),p.get("unit",""),p.get("numerator",""),p.get("denominator",""),p.get("time_basis",""),p.get("population",""),p.get("sample_size",""),p.get("measurement_method",""),p.get("uncertainty",""),p.get("source_id",""),int(p["source_line"]) if p.get("source_line","").isdigit() else None,p.get("review_status","")))
        elif kind=="claim": db.execute("INSERT OR REPLACE INTO claims_typed VALUES(?,?,?,?,?,?,?,?)",(p["claim_id"],p.get("system",""),p.get("claim_text",""),p.get("claim_type_as_documented",""),p.get("normalized_status",""),p.get("source_id",""),int(p["source_line"]) if p.get("source_line","").isdigit() else None,p.get("review_status","")))
        elif kind=="formula": db.execute("INSERT OR REPLACE INTO formulas_typed VALUES(?,?,?,?,?,?,?,?,?)",(p["formula_id"],p.get("system",""),p.get("status_as_documented",""),p.get("expression",""),p.get("units",""),p.get("source_class_as_documented",""),p.get("source_id",""),int(p["source_line"]) if p.get("source_line","").isdigit() else None,p.get("review_status","")))
        elif kind=="rule": db.execute("INSERT OR REPLACE INTO rules_typed VALUES(?,?,?,?,?,?,?,?,?)",(p["rule_id"],p.get("purpose",""),p.get("inputs",""),p.get("outputs",""),p.get("evidence_claim_ids",""),p.get("policy_owner",""),p.get("tests",""),p.get("status",""),p.get("source_id","")))
    hydrate_citations(db,root); hydrate_chunks(db,root); db.commit()

def source_base(root): return root/"sources/original-archive/THE-Hybrid-System-Master-Evidence-Archive-2026-08-28"
def source_path(root,relative_path):
    path=source_base(root)/relative_path
    if path.is_file(): return path
    path=root/"sources/recovered-nested"/relative_path
    if path.is_file(): return path
    return root/"sources/acquired"/relative_path

def hydrate_chunks(db,root):
    base=source_base(root)
    for source in db.execute("SELECT * FROM sources_typed WHERE byte_integrity_status='verified_bytes'"):
        path=source_path(root,source["relative_path"])
        if path.suffix.lower() not in TEXT_EXTENSIONS or path.stat().st_size>5_000_000: continue
        try: lines=path.read_text(encoding="utf-8").splitlines()
        except UnicodeDecodeError: continue
        for start in range(0,len(lines),40):
            block=lines[start:start+40]
            if not any(x.strip() for x in block): continue
            text="\n".join(block); section=next((x.strip() for x in block if x.lstrip().startswith("#")),"")
            cid="CHUNK-"+digest(f"{source['source_id']}|{start+1}|{text}")[:20].upper()
            db.execute("INSERT OR IGNORE INTO document_chunks VALUES(?,?,?,?,?,?,?,?)",(cid,source["source_id"],source["registered_sha256"],start+1,start+len(block),section,text,digest(text)))

def hydrate_citations(db,root):
    external={}
    with (root/"sources/external-citation-registry.csv").open(newline="",encoding="utf-8-sig") as h:
        for p in csv.DictReader(h):
            external[p["locator"]]=p["external_source_id"]
            db.execute("INSERT OR REPLACE INTO external_citations VALUES(?,?,?,?,?,?,?,?,?,?)",(p["external_source_id"],p["locator"],p["locator_type"],p["verification_status"],p["retrieval_date"],"","","","",""))
    with (root/"sources/primary-source-verification.csv").open(newline="",encoding="utf-8-sig") as h:
        for p in csv.DictReader(h):
            db.execute("""INSERT INTO external_citations VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(external_source_id) DO UPDATE SET
             pmid=excluded.pmid,doi=excluded.doi,title=excluded.title,source_type=excluded.source_type,verification_scope=excluded.verification_scope,
             verification_status=excluded.verification_status,locator=excluded.locator""",(p["external_source_id"],p["url"],"url",p["review_status"],"",p["pmid"],p["doi"],p["title"],p["source_type"],p["verification_scope"]))
            external[p["url"]]=p["external_source_id"]
    base=source_base(root)
    for source in db.execute("SELECT * FROM sources_typed WHERE byte_integrity_status='verified_bytes'"):
        path=source_path(root,source["relative_path"])
        if path.suffix.lower() not in TEXT_EXTENSIONS or path.stat().st_size>5_000_000: continue
        try: lines=path.read_text(encoding="utf-8").splitlines()
        except UnicodeDecodeError: continue
        for line_no,line in enumerate(lines,1):
            for raw in URL_RE.findall(line):
                locator=raw.rstrip(".,;:`")
                ext_id=external.get(locator)
                if not ext_id: continue
                oid="OCC-"+digest(f"{ext_id}|{source['source_id']}|{line_no}|{locator}")[:20].upper()
                classification="technical_or_non_evidence" if "schemas.android.com" in locator else "unclassified_candidate"
                db.execute("INSERT OR IGNORE INTO citation_occurrences VALUES(?,?,?,?,?,?)",(oid,ext_id,source["source_id"],line_no,locator,classification))
