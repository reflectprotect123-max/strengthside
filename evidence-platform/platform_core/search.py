from __future__ import annotations
import json

def text_search(db,query,record_type=None,limit=20):
    sql="""SELECT r.record_type,r.record_id,r.system,r.status,r.title,r.source_id,r.source_path,r.source_line,bm25(records_fts) rank
    FROM records_fts JOIN records r ON r.rowid=records_fts.rowid WHERE records_fts MATCH ?"""; params=[query]
    if record_type: sql+=" AND r.record_type=?"; params.append(record_type)
    sql+=" ORDER BY rank LIMIT ?"; params.append(limit)
    return [dict(r) for r in db.execute(sql,params)]

def structured_search(db,record_type=None,system=None,status=None,minimum=None,maximum=None,unit=None,limit=50,metric_id=None):
    if minimum is not None or maximum is not None:
        if record_type!="observation" or not unit or not metric_id:
            raise ValueError("Numeric evidence search requires record_type=observation, metric_id, and unit to prevent incompatible comparisons.")
        clauses=["metric_id=?","unit=?"]; params=[metric_id,unit]
        if minimum is not None: clauses.append("numeric_value>=?"); params.append(minimum)
        if maximum is not None: clauses.append("numeric_value<=?"); params.append(maximum)
        params.append(limit)
        return [dict(r) for r in db.execute("SELECT * FROM observations_typed WHERE "+" AND ".join(clauses)+" ORDER BY numeric_value LIMIT ?",params)]
    clauses=[]; params=[]
    for col,val in (("record_type",record_type),("system",system),("status",status),("unit",unit)):
        if val: clauses.append(f"{col}=?"); params.append(val)
    if minimum is not None: clauses.append("numeric_value>=?"); params.append(minimum)
    if maximum is not None: clauses.append("numeric_value<=?"); params.append(maximum)
    sql="SELECT * FROM records"+(" WHERE "+" AND ".join(clauses) if clauses else "")+" ORDER BY record_type,record_id LIMIT ?"; params.append(limit)
    out=[]
    for row in db.execute(sql,params):
        item=dict(row); item["payload"]=json.loads(item.pop("payload_json")); out.append(item)
    return out

def corpus_search(db,query,limit=20):
    return [dict(r) for r in db.execute("""SELECT c.chunk_id,c.source_id,c.start_line,c.end_line,c.section_hint,bm25(chunks_fts) rank
      FROM chunks_fts JOIN document_chunks c ON c.rowid=chunks_fts.rowid WHERE chunks_fts MATCH ? ORDER BY rank LIMIT ?""",(query,limit))]

def lineage(db,record_type,record_id):
    row=db.execute("SELECT * FROM records WHERE record_type=? AND record_id=?",(record_type,record_id)).fetchone()
    if not row: return None
    item=dict(row); item["payload"]=json.loads(item.pop("payload_json"))
    source=db.execute("SELECT * FROM records WHERE record_type='source' AND record_id=?",(item.get("source_id"),)).fetchone() if item.get("source_id") else None
    item["source_record"]=dict(source) if source else None
    if item["source_record"]: item["source_record"]["payload"]=json.loads(item["source_record"].pop("payload_json"))
    item["reviews"]=[dict(r) for r in db.execute("SELECT * FROM reviews WHERE record_type=? AND record_id=? ORDER BY reviewed_at",(record_type,record_id))]
    item["outgoing_edges"]=[dict(r) for r in db.execute("SELECT * FROM evidence_edges WHERE from_type=? AND from_id=?",(record_type,record_id))]
    item["incoming_edges"]=[dict(r) for r in db.execute("SELECT * FROM evidence_edges WHERE to_type=? AND to_id=?",(record_type,record_id))]
    return item

def traverse_lineage(db,record_type,record_id,max_depth=8):
    queue=[(record_type,record_id,0)]; visited=set(); nodes=[]; edges=[]
    while queue:
        kind,rid,depth=queue.pop(0)
        if (kind,rid) in visited or depth>max_depth: continue
        visited.add((kind,rid)); row=db.execute("SELECT record_type,record_id,status,title,source_path,source_line,content_hash FROM records WHERE record_type=? AND record_id=?",(kind,rid)).fetchone()
        nodes.append(dict(row) if row else {"record_type":kind,"record_id":rid,"missing":True})
        linked=list(db.execute("SELECT * FROM evidence_edges WHERE (from_type=? AND from_id=?) OR (to_type=? AND to_id=?)",(kind,rid,kind,rid)))
        for edge_row in linked:
            e=dict(edge_row)
            if e["edge_id"] not in {x["edge_id"] for x in edges}: edges.append(e)
            other=(e["to_type"],e["to_id"]) if (e["from_type"],e["from_id"])==(kind,rid) else (e["from_type"],e["from_id"])
            queue.append((*other,depth+1))
    return {"root":{"record_type":record_type,"record_id":record_id},"nodes":nodes,"edges":edges,"max_depth":max_depth}
