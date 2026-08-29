from __future__ import annotations
import argparse,json
from pathlib import Path
from .db import connect,migrate
from .decision import decide,replay
from .gates import promotion_gate,research_gate,research_queue,attempt_promotion
from .ingest import ingest
from .search import lineage,traverse_lineage,structured_search,text_search,corpus_search
from .review import register_reviewer,add_review,revoke

def emit(v): print(json.dumps(v,indent=2,ensure_ascii=False,sort_keys=True))
def make_parser():
    p=argparse.ArgumentParser(prog="hybrid-evidence",description="THE Hybrid System pre-research operations CLI"); p.add_argument("--db",default="runtime/evidence.db")
    sub=p.add_subparsers(dest="command",required=True); sub.add_parser("init-db")
    sub.add_parser("stats")
    x=sub.add_parser("ingest"); x.add_argument("--root",default=".")
    x=sub.add_parser("search"); x.add_argument("query"); x.add_argument("--type"); x.add_argument("--limit",type=int,default=20)
    x=sub.add_parser("corpus-search"); x.add_argument("query"); x.add_argument("--limit",type=int,default=20)
    x=sub.add_parser("filter"); x.add_argument("--type"); x.add_argument("--system"); x.add_argument("--status"); x.add_argument("--min",type=float); x.add_argument("--max",type=float); x.add_argument("--unit"); x.add_argument("--metric"); x.add_argument("--limit",type=int,default=50)
    x=sub.add_parser("lineage"); x.add_argument("record_type"); x.add_argument("record_id")
    x=sub.add_parser("trace"); x.add_argument("record_type"); x.add_argument("record_id"); x.add_argument("--depth",type=int,default=8)
    x=sub.add_parser("gate-check"); x.add_argument("record_type"); x.add_argument("record_id")
    x=sub.add_parser("promote"); x.add_argument("record_type"); x.add_argument("record_id"); x.add_argument("to_stage"); x.add_argument("--actor",required=True)
    x=sub.add_parser("register-reviewer"); x.add_argument("reviewer_id"); x.add_argument("role"); x.add_argument("--declaration",required=True)
    x=sub.add_parser("add-review"); x.add_argument("record_type"); x.add_argument("record_id"); x.add_argument("stage"); x.add_argument("outcome"); x.add_argument("--reviewer",required=True); x.add_argument("--notes",default="")
    x=sub.add_parser("revoke"); x.add_argument("record_type"); x.add_argument("record_id"); x.add_argument("--actor",required=True); x.add_argument("--reason",required=True)
    sub.add_parser("research-gate")
    x=sub.add_parser("research-queue"); x.add_argument("--limit",type=int,default=200)
    x=sub.add_parser("simulate"); x.add_argument("--snapshot",required=True); x.add_argument("--outputs",required=True); x.add_argument("--synthetic-model"); x.add_argument("--persist",action="store_true")
    x=sub.add_parser("replay"); x.add_argument("receipt_id")
    return p

def main(argv=None):
    a=make_parser().parse_args(argv); db=connect(a.db); migrate(db)
    if a.command=="init-db": emit({"status":"ready","db":str(Path(a.db).resolve())})
    elif a.command=="stats":
        tables=("records","record_versions","quarantine","evidence_edges","document_chunks","external_citations","citation_occurrences","reviews","promotion_events","runtime_artifacts","decision_receipts")
        emit({name:db.execute(f"SELECT COUNT(*) n FROM {name}").fetchone()["n"] for name in tables})
    elif a.command=="ingest": emit(ingest(db,a.root))
    elif a.command=="search": emit(text_search(db,a.query,a.type,a.limit))
    elif a.command=="corpus-search": emit(corpus_search(db,a.query,a.limit))
    elif a.command=="filter": emit(structured_search(db,a.type,a.system,a.status,a.min,a.max,a.unit,a.limit,a.metric))
    elif a.command=="lineage": emit(lineage(db,a.record_type,a.record_id))
    elif a.command=="trace": emit(traverse_lineage(db,a.record_type,a.record_id,a.depth))
    elif a.command=="gate-check": emit(promotion_gate(db,a.record_type,a.record_id))
    elif a.command=="promote": emit(attempt_promotion(db,a.record_type,a.record_id,a.to_stage,a.actor))
    elif a.command=="register-reviewer": emit(register_reviewer(db,a.reviewer_id,a.role,a.declaration))
    elif a.command=="add-review": emit(add_review(db,a.record_type,a.record_id,a.stage,a.outcome,a.reviewer,a.notes))
    elif a.command=="revoke": emit(revoke(db,a.record_type,a.record_id,a.actor,a.reason))
    elif a.command=="research-gate": emit(research_gate(db))
    elif a.command=="research-queue": emit(research_queue(db,a.limit))
    elif a.command=="simulate":
        snapshot=json.loads(Path(a.snapshot).read_text()); outputs=json.loads(Path(a.outputs).read_text())
        models=[json.loads(Path(a.synthetic_model).read_text())] if a.synthetic_model else None
        emit(decide(db,snapshot,outputs,models,a.persist))
    elif a.command=="replay": emit(replay(db,a.receipt_id))
if __name__=="__main__": main()
