from __future__ import annotations

import csv
import hashlib
import io
import json
import os
import re
import shutil
import zipfile
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path


BASE = Path(__file__).resolve().parents[1]
ARCHIVE_ROOT = BASE / "sources" / "original-archive" / "THE-Hybrid-System-Master-Evidence-Archive-2026-08-28"
LONG_ARCHIVE_ROOT = Path("\\\\?\\" + str(ARCHIVE_ROOT)) if os.name == "nt" else ARCHIVE_ROOT
GENERATED_AT = "2026-08-29T00:00:00+10:00"

TEXT_EXTENSIONS = {
    ".md", ".txt", ".json", ".jsonl", ".yaml", ".yml", ".csv", ".tsv",
    ".py", ".kt", ".kts", ".mjs", ".ts", ".html", ".xml", ".sql", ".sh",
    ".properties", ".gitignore", ".mmd", ".svg",
}


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def stable_id(prefix: str, value: str, length: int = 16) -> str:
    return f"{prefix}-{hashlib.sha256(value.encode('utf-8')).hexdigest()[:length].upper()}"


def read_text(path: Path) -> str:
    if path.suffix.lower() not in TEXT_EXTENSIONS:
        return ""
    try:
        return path.read_text(encoding="utf-8-sig")
    except UnicodeDecodeError:
        try:
            return path.read_text(encoding="cp1252")
        except Exception:
            return ""
    except OSError:
        return ""


def system_for(rel: str) -> str:
    top = rel.replace("\\", "/").split("/", 1)[0]
    return {
        "00-governance": "governance",
        "01-strength": "strength",
        "02-conditioning": "conditioning",
        "03-nutrition": "nutrition",
        "04-recovery": "recovery",
        "05-coordinator": "coordinator",
        "06-cross-system": "cross-system",
        "07-repo-research": "repository-research",
        "08-visual-assets": "visual-assets",
        "09-original-archives": "historical-archives",
    }.get(top, "unclassified")


def evidence_type(path: Path, rel: str, text: str) -> str:
    n = path.name.lower()
    rp = rel.lower()
    ext = path.suffix.lower()
    if ext == ".zip":
        return "archive_bundle"
    if ext in {".png", ".svg", ".html"} and "visual" in rp:
        return "visual_asset"
    if "schema" in n or ext == ".sql":
        return "schema_or_data_contract"
    if "test" in rp or "fixture" in rp:
        return "test_or_fixture"
    if ext in {".py", ".kt", ".kts", ".mjs", ".ts", ".sh", ".properties"}:
        return "software_or_build_artifact"
    if "source_reg" in n or "source-register" in n or "source register" in text[:1000].lower():
        return "source_registry"
    if "claim" in n:
        return "claim_registry"
    if "formula" in n:
        return "formula_registry"
    if any(x in n for x in ("handoff", "briefing", "operating-prompt", "claude")):
        return "ai_handoff_or_working_note"
    if any(x in n for x in ("research", "evidence", "pubmed", "review", "dossier", "synthesis")):
        return "research_synthesis_or_evidence_pack"
    if any(x in n for x in ("design", "spec", "plan", "roadmap", "requirements", "architecture")):
        return "product_or_system_design"
    if ext in {".csv", ".json", ".jsonl", ".yaml", ".yml"}:
        return "structured_data"
    return "documentation_or_other"


def classify_research(e_type: str, text: str) -> tuple[str, str]:
    lower = text.lower()
    if e_type in {"research_synthesis_or_evidence_pack", "claim_registry", "formula_registry", "source_registry"}:
        if "pubmed" in lower or "pmid" in lower or "doi.org" in lower:
            return "candidate_evidence_unverified", "mixed_secondary_with_primary_citations"
        return "candidate_evidence_unverified", "secondary_or_unknown"
    if e_type in {"software_or_build_artifact", "test_or_fixture", "schema_or_data_contract", "visual_asset"}:
        return "not_scientific_research", "not_applicable"
    if e_type == "archive_bundle":
        return "historical_container_unassessed", "unknown"
    return "context_or_design_not_validated", "not_evidence_by_itself"


def structured_value(e_type: str, path: Path, text: str) -> str:
    if path.suffix.lower() in {".csv", ".json", ".jsonl", ".yaml", ".yml", ".sql"}:
        return "high"
    if e_type in {"claim_registry", "formula_registry", "source_registry", "schema_or_data_contract"}:
        return "high"
    if text.count("|") >= 20 or re.search(r"(?i)\b(formula|threshold|coefficient|%|kg|kcal|bpm|hrv|rpe|rir)\b", text):
        return "medium"
    return "low"


def implementation_relevance(e_type: str) -> str:
    if e_type in {"schema_or_data_contract", "formula_registry", "claim_registry", "structured_data", "test_or_fixture"}:
        return "high_candidate_not_authorized"
    if e_type in {"product_or_system_design", "research_synthesis_or_evidence_pack", "source_registry"}:
        return "medium_requires_review"
    if e_type == "software_or_build_artifact":
        return "reference_only_do_not_wire"
    return "low_or_contextual"


def count_markdown_tables(text: str) -> int:
    return len(re.findall(r"(?m)^\s*\|?\s*:?-{3,}:?\s*\|", text))


def table_rows(path: Path, id_pattern: str | None = None):
    text = read_text(path)
    for lineno, line in enumerate(text.splitlines(), 1):
        if not line.lstrip().startswith("|"):
            continue
        cells = [c.strip().strip("`") for c in line.strip().strip("|").split("|")]
        if not cells or all(re.fullmatch(r":?-+:?", c or "-") for c in cells):
            continue
        if id_pattern and not re.fullmatch(id_pattern, cells[0]):
            continue
        yield lineno, cells


def write_csv(path: Path, rows: list[dict], fields: list[str] | None = None):
    path.parent.mkdir(parents=True, exist_ok=True)
    if fields is None:
        fields = list(rows[0].keys()) if rows else []
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)


def write_json(path: Path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def md_link(path: str) -> str:
    return path.replace("\\", "/").replace(" ", "%20")


def schema(title: str, required: list[str], properties: dict, description: str) -> dict:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": f"https://thehybridsystem.example/schemas/{title.lower().replace(' ', '-')}.schema.json",
        "title": title,
        "description": description,
        "type": "object",
        "additionalProperties": False,
        "required": required,
        "properties": properties,
    }


STR = {"type": "string", "minLength": 1}
NULL_STR = {"type": ["string", "null"]}
NUM_NULL = {"type": ["number", "null"]}
INT_NULL = {"type": ["integer", "null"], "minimum": 0}
STR_ARR = {"type": "array", "items": {"type": "string"}, "uniqueItems": True}


def generate_schemas():
    location = {
        "type": "object", "additionalProperties": False,
        "required": ["source_id", "relative_path", "line_start", "line_end"],
        "properties": {
            "source_id": STR, "relative_path": STR,
            "line_start": INT_NULL, "line_end": INT_NULL,
            "page": INT_NULL, "section": NULL_STR, "table": NULL_STR,
            "row": NULL_STR, "column": NULL_STR, "quote_hash": NULL_STR,
        },
    }
    schemas = {
        "source-record.schema.json": schema("Source Record", ["source_id", "relative_path", "sha256", "system", "review_status"], {
            "source_id": STR, "relative_path": STR, "sha256": {"type": "string", "pattern": "^[A-Fa-f0-9]{64}$"},
            "system": STR, "evidence_type": STR, "title": NULL_STR, "authors": STR_ARR,
            "publication_date": NULL_STR, "retrieval_date": NULL_STR, "url": NULL_STR,
            "doi": NULL_STR, "pmid": NULL_STR, "source_quality": STR,
            "review_status": STR, "license": NULL_STR, "notes": NULL_STR,
        }, "Immutable file/source identity and review metadata."),
        "study.schema.json": schema("Study", ["study_id", "source_ids", "design", "review_status"], {
            "study_id": STR, "source_ids": STR_ARR, "design": STR, "registration": NULL_STR,
            "population_ids": STR_ARR, "interventions": STR_ARR, "comparators": STR_ARR,
            "duration": NULL_STR, "outcomes": STR_ARR, "risk_of_bias": NULL_STR,
            "limitations": STR_ARR, "review_status": STR,
        }, "Scientific study metadata separate from claims and product policy."),
        "population.schema.json": schema("Population", ["population_id", "description"], {
            "population_id": STR, "description": STR, "sample_size": INT_NULL, "age": NULL_STR,
            "sex": NULL_STR, "training_status": NULL_STR, "health_status": NULL_STR,
            "sport": NULL_STR, "inclusion": STR_ARR, "exclusion": STR_ARR,
        }, "Population applicability and comparison metadata."),
        "metric.schema.json": schema("Metric", ["metric_id", "canonical_name", "value_type", "canonical_unit"], {
            "metric_id": STR, "canonical_name": STR, "aliases": STR_ARR, "definition": STR,
            "value_type": STR, "canonical_unit": {"type": ["string", "null"]},
            "numerator": NULL_STR, "denominator": NULL_STR, "time_basis": NULL_STR,
            "valid_range": {"type": ["object", "null"]}, "measurement_methods": STR_ARR,
            "system": STR, "review_status": STR,
        }, "Canonical metric semantics and units."),
        "observation.schema.json": schema("Observation", ["observation_id", "metric_id", "value", "unit", "provenance", "review_status"], {
            "observation_id": STR, "metric_id": STR, "canonical_metric_name": STR,
            "value": {"type": ["number", "string", "null"]}, "unit": {"type": ["string", "null"]},
            "numerator": NUM_NULL, "denominator": NUM_NULL, "time_basis": NULL_STR,
            "population_id": NULL_STR, "sample_size": INT_NULL, "age": NULL_STR, "sex": NULL_STR,
            "training_status": NULL_STR, "intervention": NULL_STR, "comparator": NULL_STR,
            "duration": NULL_STR, "measurement_method": NULL_STR, "uncertainty": NULL_STR,
            "provenance": location, "transformation_history": {"type": "array", "items": {"type": "object"}},
            "confidence": STR, "review_status": STR,
        }, "A source-bound numerical or categorical observation; null means undocumented."),
        "table-cell.schema.json": schema("Table Cell", ["cell_id", "source_id", "table", "row", "column", "raw_value"], {
            "cell_id": STR, "source_id": STR, "table": STR, "row": STR, "column": STR,
            "raw_value": {"type": ["string", "number", "null"]}, "parsed_value": {"type": ["string", "number", "null"]},
            "unit": NULL_STR, "observation_id": NULL_STR, "line": INT_NULL, "review_status": STR,
        }, "Cell-level provenance for extracted tables."),
        "formula.schema.json": schema("Formula", ["formula_id", "expression", "status", "source_class", "provenance"], {
            "formula_id": STR, "expression": STR, "inputs": STR_ARR, "outputs": STR_ARR,
            "units": NULL_STR, "parameters": {"type": "array", "items": {"type": "object"}},
            "status": STR, "source_class": STR, "assumptions": STR_ARR,
            "provenance": location, "tests": STR_ARR, "version": STR,
        }, "Versioned formula without invented coefficients."),
        "claim.schema.json": schema("Claim", ["claim_id", "claim_text", "claim_type", "status", "provenance"], {
            "claim_id": STR, "claim_text": STR, "claim_type": STR, "system": STR,
            "evidence_source_ids": STR_ARR, "observation_ids": STR_ARR, "status": STR,
            "confidence": NULL_STR, "population_scope": NULL_STR, "limitations": STR_ARR,
            "provenance": location, "reviewed_by": NULL_STR, "review_date": NULL_STR,
        }, "Atomic claim with evidence and review status."),
        "contradiction.schema.json": schema("Contradiction", ["contradiction_id", "left", "right", "status"], {
            "contradiction_id": STR, "left": STR, "right": STR, "relationship": {"enum": ["contradicts", "qualifies", "duplicates", "extends", "terminology_conflict"]},
            "source_ids": STR_ARR, "analysis": STR, "resolution": NULL_STR, "status": STR, "owner": NULL_STR,
        }, "Tracked contradiction, qualification, duplication, extension, or terminology conflict."),
        "policy.schema.json": schema("Policy", ["policy_id", "purpose", "status", "owner"], {
            "policy_id": STR, "purpose": STR, "statement": STR, "system": STR,
            "claim_ids": STR_ARR, "owner": STR, "status": STR, "effective_from": NULL_STR,
            "supersedes": NULL_STR, "review_due": NULL_STR,
        }, "Human-owned product or governance policy."),
        "rule.schema.json": schema("Rule", ["rule_id", "purpose", "inputs", "outputs", "status"], {
            "rule_id": STR, "purpose": STR, "inputs": STR_ARR, "outputs": STR_ARR,
            "formula_id": NULL_STR, "formula": NULL_STR, "evidence_claim_ids": STR_ARR,
            "policy_id": NULL_STR, "policy_owner": NULL_STR, "model_version": NULL_STR,
            "tests": STR_ARR, "confidence": STR, "unresolved_assumptions": STR_ARR,
            "status": STR, "safety_class": STR,
        }, "Deterministic executable-rule contract with evidence and policy lineage."),
        "model-version.schema.json": schema("Model Version", ["model_id", "version", "model_type", "status", "artifact_hash"], {
            "model_id": STR, "version": STR, "model_type": STR, "system": STR,
            "input_schema": STR, "output_schema": STR, "rule_ids": STR_ARR,
            "parameter_set_id": NULL_STR, "training_data_ids": STR_ARR, "validation_report_ids": STR_ARR,
            "artifact_hash": STR, "status": STR, "created_at": STR, "supersedes": NULL_STR,
        }, "Immutable deterministic/statistical non-LLM model version metadata."),
        "decision-receipt.schema.json": schema("Decision Receipt", ["decision_id", "timestamp", "athlete_state_hash", "model_versions", "validator_results", "final_decision", "receipt_hash"], {
            "decision_id": STR, "timestamp": STR, "athlete_id_hash": STR, "input_event_ids": STR_ARR,
            "source_ids": STR_ARR, "observation_ids": STR_ARR, "claim_ids": STR_ARR,
            "policy_ids": STR_ARR, "rule_ids": STR_ARR, "athlete_state_hash": STR,
            "model_versions": STR_ARR, "candidate_decisions": {"type": "array", "items": {"type": "object"}},
            "constraints": {"type": "array", "items": {"type": "object"}},
            "validator_results": {"type": "array", "items": {"type": "object"}},
            "final_decision": {"type": "object"}, "reason_codes": STR_ARR,
            "random_seed": {"type": ["integer", "null"]}, "receipt_hash": STR,
        }, "Replayable immutable decision lineage."),
        "athlete-state.schema.json": schema("Athlete State", ["snapshot_id", "timestamp", "domains", "data_quality", "state_hash"], {
            "snapshot_id": STR, "timestamp": STR, "athlete_id_hash": STR,
            "domains": {"type": "object", "required": ["strength", "conditioning", "nutrition", "recovery", "coordinator"], "properties": {k: {"type": "object"} for k in ["strength", "conditioning", "nutrition", "recovery", "coordinator"]}, "additionalProperties": False},
            "data_quality": {"type": "object"}, "hard_constraints": {"type": "array", "items": {"type": "object"}},
            "uncertainties": {"type": "array", "items": {"type": "object"}}, "state_hash": STR,
        }, "Single time-stamped athlete-state snapshot assembled from five systems."),
    }
    for name, obj in schemas.items():
        write_json(BASE / "schemas" / name, obj)
    write_json(BASE / "schemas" / "schema-catalog.json", {
        "generated_at": GENERATED_AT,
        "draft": "2020-12",
        "schemas": [{"name": n, "sha256": sha256_file(BASE / "schemas" / n)} for n in sorted(schemas)],
    })


def inventory():
    files = []
    for dirpath, _, filenames in os.walk(str(LONG_ARCHIVE_ROOT)):
        files.extend(Path(dirpath) / name for name in filenames)
    files.sort(key=lambda p: p.as_posix().lower())
    hashes = {p: sha256_file(p) for p in files}
    hash_groups = defaultdict(list)
    for p, h in hashes.items():
        hash_groups[h].append(p)
    rows = []
    url_set = set()
    pmid_set = set()
    line_total = 0
    table_total = 0
    formula_mentions = 0
    for p in files:
        rel = p.relative_to(LONG_ARCHIVE_ROOT).as_posix()
        text = read_text(p)
        lines = text.count("\n") + (1 if text else 0)
        line_total += lines
        url_set.update(re.findall(r"https?://[^\s)>\]}|]+", text))
        pmid_set.update(re.findall(r"(?i)\bPMID\s*[: ]\s*(\d{6,9})\b", text))
        tables = count_markdown_tables(text) if p.suffix.lower() == ".md" else (1 if p.suffix.lower() in {".csv", ".tsv"} else 0)
        if p.suffix.lower() == ".html":
            tables += len(re.findall(r"(?i)<table\b", text))
        table_total += tables
        formula_mentions += len(re.findall(r"(?i)\bformula\b|`[^`]*(?:=|×|÷)[^`]*`", text))
        e_type = evidence_type(p, rel, text)
        r_status, quality = classify_research(e_type, text)
        duplicate_paths = [x.relative_to(LONG_ARCHIVE_ROOT).as_posix() for x in hash_groups[hashes[p]] if x != p]
        if duplicate_paths:
            version_status = "exact_duplicate"
        elif system_for(rel) == "historical-archives":
            version_status = "historical_archive"
        elif re.search(r"(?i)(old|legacy|handoff|archive|v0)", rel):
            version_status = "possibly_stale_review_required"
        else:
            version_status = "currentness_unresolved"
        rows.append({
            "file_id": stable_id("FILE", rel),
            "source_id": stable_id("SRC", rel + "|" + hashes[p]),
            "content_id": stable_id("CONTENT", hashes[p]),
            "relative_path": rel,
            "system": system_for(rel),
            "extension": p.suffix.lower() or "[none]",
            "bytes": p.stat().st_size,
            "sha256": hashes[p].upper(),
            "line_count": lines,
            "evidence_type": e_type,
            "research_status": r_status,
            "source_quality": quality,
            "version_duplicate_status": version_status,
            "duplicate_of_paths": " | ".join(duplicate_paths),
            "structured_data_value": structured_value(e_type, p, text),
            "implementation_relevance": implementation_relevance(e_type),
            "table_count_estimate": tables,
            "review_status": "machine_classified_needs_human_review",
        })
    write_csv(BASE / "structured" / "archive-inventory.csv", rows)
    write_json(BASE / "structured" / "archive-inventory.json", {"generated_at": GENERATED_AT, "records": rows})
    dup_rows = []
    for h, ps in sorted(hash_groups.items()):
        if len(ps) > 1:
            gid = stable_id("DUP", h)
            for p in ps:
                dup_rows.append({"duplicate_group_id": gid, "sha256": h.upper(), "relative_path": p.relative_to(LONG_ARCHIVE_ROOT).as_posix(), "group_size": len(ps)})
    write_csv(BASE / "contradictions" / "exact-duplicates.csv", dup_rows, ["duplicate_group_id", "sha256", "relative_path", "group_size"])

    nested = []
    row_by_path = {r["relative_path"]: r for r in rows}
    outer_paths_by_hash = defaultdict(list)
    for p, h in hashes.items():
        outer_paths_by_hash[h].append(p.relative_to(LONG_ARCHIVE_ROOT).as_posix())

    def inspect_zip(zf: zipfile.ZipFile, container_source_id: str, container_rel: str, prefix: str = "", depth: int = 1):
        for info in zf.infolist():
            if info.is_dir():
                continue
            virtual_path = f"{prefix}!{info.filename}" if prefix else info.filename
            try:
                data = zf.read(info)
                entry_hash = hashlib.sha256(data).hexdigest()
                status = "content_hashed_not_executed"
            except Exception as exc:
                data = b""; entry_hash = ""; status = f"read_error:{type(exc).__name__}"
            nested.append({
                "container_source_id": container_source_id,
                "container_relative_path": container_rel,
                "entry_path": virtual_path,
                "archive_depth": depth,
                "uncompressed_bytes": info.file_size,
                "compressed_bytes": info.compress_size,
                "crc32": f"{info.CRC:08X}",
                "sha256": entry_hash.upper(),
                "outer_exact_match_paths": " | ".join(sorted(outer_paths_by_hash.get(entry_hash, []))),
                "inspection_status": status,
            })
            if data and info.filename.lower().endswith(".zip") and depth < 5:
                try:
                    with zipfile.ZipFile(io.BytesIO(data)) as inner:
                        inspect_zip(inner, container_source_id, container_rel, virtual_path, depth + 1)
                except zipfile.BadZipFile:
                    nested.append({"container_source_id": container_source_id, "container_relative_path": container_rel, "entry_path": virtual_path + "![BAD_ZIP]", "archive_depth": depth + 1, "uncompressed_bytes": 0, "compressed_bytes": 0, "crc32": "", "sha256": "", "outer_exact_match_paths": "", "inspection_status": "invalid_nested_zip"})
    for p in files:
        if p.suffix.lower() != ".zip":
            continue
        try:
            with zipfile.ZipFile(p) as z:
                container_rel = p.relative_to(LONG_ARCHIVE_ROOT).as_posix()
                inspect_zip(z, row_by_path[container_rel]["source_id"], container_rel)
        except zipfile.BadZipFile:
            nested.append({"container_source_id": row_by_path[p.relative_to(LONG_ARCHIVE_ROOT).as_posix()]["source_id"], "container_relative_path": p.relative_to(LONG_ARCHIVE_ROOT).as_posix(), "entry_path": "[BAD_ZIP]", "archive_depth": 1, "uncompressed_bytes": 0, "compressed_bytes": 0, "crc32": "", "sha256": "", "outer_exact_match_paths": "", "inspection_status": "invalid_zip"})
    write_csv(BASE / "structured" / "nested-archive-inventory.csv", nested, ["container_source_id", "container_relative_path", "entry_path", "archive_depth", "uncompressed_bytes", "compressed_bytes", "crc32", "sha256", "outer_exact_match_paths", "inspection_status"])

    source_rows = [{
        "source_id": r["source_id"], "content_id": r["content_id"], "relative_path": r["relative_path"], "sha256": r["sha256"],
        "system": r["system"], "evidence_type": r["evidence_type"], "source_quality": r["source_quality"],
        "review_status": r["review_status"], "duplicate_status": r["version_duplicate_status"],
    } for r in rows]
    write_csv(BASE / "sources" / "source-registry.csv", source_rows)
    write_json(BASE / "sources" / "source-registry.json", {"registry_version": "0.1.0", "generated_at": GENERATED_AT, "sources": source_rows})

    ext_rows = []
    for url in sorted(url_set):
        clean = url.rstrip(".,;:'\"")
        ext_rows.append({"external_source_id": stable_id("EXT", clean), "locator": clean, "locator_type": "url", "verification_status": "cited_in_corpus_not_independently_verified", "retrieval_date": ""})
    write_csv(BASE / "sources" / "external-citation-registry.csv", ext_rows)
    return rows, dup_rows, nested, {"line_total": line_total, "table_total": table_total, "formula_mentions": formula_mentions, "unique_urls": len(ext_rows), "unique_pmids": len(pmid_set)}


def extract_claims_and_formulas(inventory_rows):
    inv_by_path = {r["relative_path"]: r for r in inventory_rows}
    claim_files = [
        ("01-strength/THE_Hybrid_Strength_Claim_Matrix.md", r"S-\d+"),
        ("03-nutrition/MacroFactor_Hybrid_Engine_Claim_Matrix.md", r"N-\d+"),
        ("06-cross-system/fitness-ecosystem-research/docs/CLAIM_REGISTER.md", r"CR-\d+"),
    ]
    claims = []
    for rel, pattern in claim_files:
        p = ARCHIVE_ROOT / rel
        if not p.exists():
            continue
        sid = inv_by_path[rel]["source_id"]
        for lineno, cells in table_rows(p, pattern):
            claim_id = cells[0]
            claim_text = cells[1] if len(cells) > 1 else ""
            class_or_grade = cells[2] if len(cells) > 2 else ""
            confidence = cells[3] if len(cells) > 3 else ""
            decision = cells[4] if len(cells) > 4 else ""
            boundary = cells[5] if len(cells) > 5 else ""
            status = "unsupported_or_rejected_claim" if re.search(r"(?i)rejected|unverified|private unknown|unknown", " ".join(cells)) else "scientific_or_product_claim_unverified"
            claims.append({
                "claim_id": claim_id,
                "system": system_for(rel),
                "claim_text": claim_text,
                "claim_type_as_documented": class_or_grade,
                "confidence_as_documented": confidence,
                "implementation_or_status_as_documented": decision,
                "source_boundary_as_documented": boundary,
                "normalized_status": status,
                "source_id": sid,
                "source_relative_path": rel,
                "source_line": lineno,
                "review_status": "extracted_untrusted_pending_source_validation",
            })
    write_csv(BASE / "claims" / "claim-registry.csv", claims)
    write_json(BASE / "claims" / "claim-graph.json", {
        "graph_version": "0.1.0",
        "nodes": [{"id": c["claim_id"], "type": "claim", "status": c["normalized_status"], "source_id": c["source_id"]} for c in claims],
        "edges": [],
        "note": "Only explicit source-document claims were loaded. Relationships require human adjudication; curated relationships are in contradictions/contradiction-registry.csv.",
    })

    formula_files = [
        ("01-strength/THE_Hybrid_Strength_Formula_Registry.md", r"[A-Za-z][A-Za-z0-9_.-]*\.v\d+(?:\.\d+)*"),
        ("03-nutrition/MacroFactor_Hybrid_Engine_Formula_Registry.md", r"[A-Za-z][A-Za-z0-9_.-]*\.v\d+(?:\.\d+)*"),
    ]
    formulas = []
    for rel, pattern in formula_files:
        p = ARCHIVE_ROOT / rel
        if not p.exists():
            continue
        sid = inv_by_path[rel]["source_id"]
        for lineno, cells in table_rows(p, pattern):
            if len(cells) < 5:
                continue
            formulas.append({
                "formula_id": cells[0], "system": system_for(rel), "status_as_documented": cells[1],
                "expression": cells[2], "units": cells[3], "source_class_as_documented": cells[4],
                "implementation_note": cells[5] if len(cells) > 5 else "", "source_id": sid,
                "source_relative_path": rel, "source_line": lineno,
                "review_status": "extracted_untrusted_pending_formula_and_source_validation",
            })
    write_csv(BASE / "structured" / "formula-registry.csv", formulas)
    write_json(BASE / "structured" / "formula-registry.json", {"registry_version": "0.1.0", "formulas": formulas})

    rule_files = [
        ("03-nutrition/MacroFactor_Hybrid_Engine_Formula_Registry.md", r"[A-Za-z][A-Za-z0-9_.-]+"),
    ]
    rules = []
    for rel, pattern in rule_files:
        p = ARCHIVE_ROOT / rel
        sid = inv_by_path[rel]["source_id"]
        in_rules = False
        for lineno, line in enumerate(read_text(p).splitlines(), 1):
            if line.startswith("## Operating rules"):
                in_rules = True
                continue
            if in_rules and line.startswith("## "):
                break
            if in_rules and line.lstrip().startswith("|"):
                cells = [c.strip().strip("`") for c in line.strip().strip("|").split("|")]
                if len(cells) >= 3 and re.fullmatch(pattern, cells[0]) and cells[0] != "Rule ID":
                    rules.append({
                        "rule_id": cells[0], "purpose": cells[1], "inputs": "UNSPECIFIED", "outputs": "UNSPECIFIED",
                        "formula_id": "", "evidence_claim_ids": "", "policy_owner": "UNASSIGNED",
                        "model_version": "", "tests": "MISSING", "confidence": "not_assessed",
                        "unresolved_assumptions": "Source validation; input/output contract; policy ownership",
                        "status": "candidate_not_executable", "source_id": sid, "source_relative_path": rel, "source_line": lineno,
                    })
    write_csv(BASE / "rules" / "rule-registry.csv", rules)
    return claims, formulas, rules


def curated_registries(inventory_rows, formulas):
    metrics = [
        ("MET-UNMAPPED", "Unmapped formula parameter", "[source-defined]", "cross-system", "Temporary quarantine metric for extracted formula constants whose canonical metric mapping requires human review."),
        ("MET-BODY-MASS", "Body mass", "kg", "nutrition,recovery", "Measured body mass at a timestamp; raw and trend values are separate metrics."),
        ("MET-BODY-MASS-TREND", "Body mass trend", "kg", "nutrition", "Filtered body mass estimate; filter and parameters must be versioned."),
        ("MET-WEEKLY-MASS-CHANGE", "Weekly body mass change", "kg/week", "nutrition", "Change in trend body mass per seven days."),
        ("MET-WEEKLY-MASS-CHANGE-PCT", "Weekly body mass change rate", "%/week", "nutrition", "Weekly change divided by an explicit reference mass."),
        ("MET-ENERGY-INTAKE", "Energy intake", "kcal/day", "nutrition", "Documented food-energy intake; missing, partial, and confirmed zero are distinct."),
        ("MET-ENERGY-EXPENDITURE", "Estimated energy expenditure", "kcal/day", "nutrition", "Model estimate, not direct calorimetry unless method says so."),
        ("MET-BMR", "Basal metabolic rate estimate", "kcal/day", "nutrition", "Equation-derived BMR with equation ID and inputs."),
        ("MET-PROTEIN-INTAKE", "Protein intake", "g/day", "nutrition", "Daily protein intake with source and completeness."),
        ("MET-ENERGY-AVAILABILITY", "Energy availability proxy", "kcal/kg FFM/day", "nutrition,recovery", "Proxy requiring intake, exercise expenditure and fat-free mass; not a diagnosis."),
        ("MET-LOAD", "External load", "kg", "strength", "Exercise load with equipment and unilateral/bilateral semantics."),
        ("MET-REPETITIONS", "Repetitions", "count/set", "strength", "Completed or prescribed repetitions per set."),
        ("MET-RIR", "Repetitions in reserve", "repetitions", "strength", "Subjective effort estimate with confidence/calibration."),
        ("MET-RPE", "Rating of perceived exertion", "score", "strength,conditioning", "Scale-specific perceived exertion; scale must be recorded."),
        ("MET-VOLUME-LOAD", "Volume load", "kg-repetitions", "strength", "Document-specific load x repetitions aggregation; limitations retained."),
        ("MET-SETS-PER-MUSCLE-WEEK", "Weekly sets per muscle", "sets/week", "strength", "Direct and indirect set accounting must be separate/versioned."),
        ("MET-E1RM", "Estimated one-repetition maximum", "kg", "strength", "Equation-derived estimate with exercise and formula ID."),
        ("MET-DURATION", "Session duration", "seconds", "conditioning,strength", "Elapsed or active duration; basis must be explicit."),
        ("MET-DISTANCE", "Distance", "metres", "conditioning", "Measured or device-estimated distance with modality and device."),
        ("MET-PACE", "Pace", "seconds/metre", "conditioning", "Time per distance; display units are transformations."),
        ("MET-SPEED", "Speed", "metres/second", "conditioning", "Distance per time."),
        ("MET-POWER", "Power", "watts", "conditioning", "Device-reported or estimated power with device/calibration."),
        ("MET-HEART-RATE", "Heart rate", "beats/minute", "conditioning,recovery", "Heart rate with sampling and device metadata."),
        ("MET-HRV", "Heart-rate variability", "milliseconds", "recovery", "Protocol-specific HRV metric; statistic and acquisition conditions required."),
        ("MET-RHR", "Resting heart rate", "beats/minute", "recovery", "Resting heart rate under recorded protocol."),
        ("MET-SLEEP-DURATION", "Sleep duration", "hours/night", "recovery", "Device or self-report sleep duration with measurement method."),
        ("MET-SORENESS", "Soreness rating", "score", "recovery", "Scale-specific self-report soreness; body region required when relevant."),
        ("MET-PAIN", "Pain event", "categorical", "recovery,coordinator", "Structured event, not a single readiness scalar or diagnosis."),
        ("MET-READINESS", "Readiness construct", "score", "recovery,coordinator", "Model output only; components, uncertainty, version and missingness required."),
        ("MET-ACUTE-LOAD", "Acute training load", "arbitrary-unit", "coordinator", "Window and load definition required; not an injury-risk threshold by itself."),
        ("MET-CHRONIC-LOAD", "Chronic training load", "arbitrary-unit", "coordinator", "Window and load definition required."),
        ("MET-DATA-QUALITY", "Data quality score", "score", "coordinator", "Versioned completeness/reliability score with explicit components."),
    ]
    metric_rows = [{"metric_id": a, "canonical_name": b, "canonical_unit": c, "system": d, "definition": e, "numerator": "", "denominator": "", "time_basis": "", "review_status": "provisional_dictionary_entry"} for a,b,c,d,e in metrics]
    write_csv(BASE / "structured" / "metric-dictionary.csv", metric_rows)
    write_json(BASE / "structured" / "metric-dictionary.json", {"registry_version": "0.1.0", "metrics": metric_rows})

    observations = []
    metric_map = {
        "kcal/day": "MET-ENERGY-EXPENDITURE", "kcal/week": "MET-ENERGY-INTAKE", "kg/week": "MET-WEEKLY-MASS-CHANGE",
        "%/week": "MET-WEEKLY-MASS-CHANGE-PCT", "kg": "MET-BODY-MASS", "g/day": "MET-PROTEIN-INTAKE",
        "kcal/g": "MET-ENERGY-INTAKE", "kcal/kg FFM/day": "MET-ENERGY-AVAILABILITY",
    }
    for f in formulas:
        nums = re.findall(r"(?<![A-Za-z])[-+]?\d+(?:\.\d+)?", f["expression"])
        if not nums:
            continue
        metric_id = metric_map.get(f["units"], "MET-UNMAPPED")
        observations.append({
            "observation_id": stable_id("OBS", f["formula_id"] + f["expression"]),
            "metric_id": metric_id, "canonical_metric_name": next((m[1] for m in metrics if m[0] == metric_id), "Unmapped formula parameter"),
            "value": ";".join(nums), "unit": f["units"], "numerator": "", "denominator": "", "time_basis": "",
            "population": "NOT_DOCUMENTED_IN_FORMULA_ROW", "sample_size": "", "age": "", "sex": "", "training_status": "",
            "intervention": "", "comparator": "", "duration": "", "measurement_method": "formula_registry_extraction",
            "uncertainty": "Formula row may contain multiple constants; source validation required",
            "source_id": f["source_id"], "source_relative_path": f["source_relative_path"], "source_line": f["source_line"],
            "table": "Formula table", "row": f["formula_id"], "column": "Definition", "transformation_history": "regex_numeric_token_extraction_v1",
            "confidence": "unassessed", "review_status": "structured_observation_unverified",
        })
    write_csv(BASE / "structured" / "observations.csv", observations)

    contradictions = [
        ("CON-001", "The product is named THE Hybrid System.", "Many archived artifacts call it Hybrid Engine.", "terminology_conflict", "Resolve only in new platform material; preserve source filenames and quoted titles unchanged.", "resolved_for_new_outputs"),
        ("CON-002", "Some documents label their material validated, final, or high confidence.", "No independent corpus-wide source verification or schema validation accompanied those labels.", "qualifies", "Treat labels as document assertions, not review results.", "open_validation"),
        ("CON-003", "Inherited +2.5% progression and -5% reduction are described as project defaults.", "The strength claim matrix explicitly says they are project facts, not science.", "qualifies", "Keep as inactive policy candidates until owned, tested, and validated.", "open_policy"),
        ("CON-004", "A single readiness score is attractive for coordination.", "Corpus safety claims say pain, illness, missingness, fatigue and performance must not collapse into one override scalar.", "contradicts", "Use a vector state plus hard-constraint precedence; optional score cannot clear safety states.", "architecture_resolution"),
        ("CON-005", "Fixed readiness threshold can block heavy lifting.", "Cross-system claim CR-018 rejects a universal threshold as unsupported.", "contradicts", "No universal threshold in executable rules.", "rejected"),
        ("CON-006", "Two missed sessions implies deload.", "Cross-system claim CR-017 rejects this as a validated universal rule.", "contradicts", "Treat missed sessions as context only.", "rejected"),
        ("CON-007", "7700 kcal/kg can provide transparent target arithmetic.", "Nutrition registry labels symmetric 7700 conversion as HYBRID_INFERENCE/prototype rather than validated physiology for all contexts.", "qualifies", "Retain only as an explicitly versioned approximation; not active clinical logic.", "open_validation"),
        ("CON-008", "ACWR can be represented from acute/chronic load.", "Strength claim S-043 says universal ACWR injury-risk thresholds are unreliable.", "qualifies", "Retain contextual histories; do not create a danger threshold.", "architecture_resolution"),
        ("CON-009", "Product pages document observable competitor behavior.", "They do not scientifically validate THE Hybrid System or reveal private coefficients.", "qualifies", "Classify as product precedent only.", "architecture_resolution"),
        ("CON-010", "Exact duplicate files appear in different system folders and historical packs.", "Path context differs even when bytes are identical.", "duplicates", "Use one canonical content hash while preserving every occurrence.", "resolved_by_hash_registry"),
        ("CON-011", "Nutrition formula registry documents an update gate of at least 4 valid nutrition days and 1 valid weight day in 7.", "The archived adaptive_engine.py applies a 6-of-7 adherence condition across two weeks for a different adjustment path.", "contradicts", "Do not merge these into one rule; specify purpose, horizon and evidence before implementation.", "open_rule_conflict"),
        ("CON-012", "Nutrition protein targets are expressed on a fat-free-mass basis in the formula registry.", "Other nutrition material and prototype code use body-mass bases in places.", "contradicts", "Require explicit metric basis and population policy; no silent conversion.", "open_metric_semantics"),
        ("CON-013", "The archived governance decision-receipt schema requires an `engine` property.", "Its defined properties use `system`, so conforming instances cannot satisfy the required field under additionalProperties=false.", "contradicts", "New canonical schema uses explicit model/system lineage; archived schema remains preserved and flagged invalid for adoption.", "resolved_in_new_schema"),
        ("CON-014", "The target architecture has five domain systems feeding control.", "Existing cross-system proposal contracts cover Strength and Conditioning but not complete Nutrition, Recovery and Coordinator proposal payloads.", "qualifies", "Treat current contracts as partial and use the new five-system interface design as a schema-design starting point only.", "open_interface_gap"),
        ("CON-015", "Archived Coach Brain material proposes LLM-style runtime coaching behavior.", "The governing requirement restricts LLMs to untrusted offline assistance and requires deterministic non-LLM runtime decisions.", "contradicts", "Exclude LLM Coach Brain behavior from runtime model registry and executable rules.", "rejected_for_runtime"),
    ]
    con_rows = [{"contradiction_id":a,"left":b,"right":c,"relationship":d,"analysis_or_resolution":e,"status":f,"source_ids":"","owner":"UNASSIGNED"} for a,b,c,d,e,f in contradictions]
    write_csv(BASE / "contradictions" / "contradiction-registry.csv", con_rows)
    write_json(BASE / "contradictions" / "contradiction-registry.json", {"registry_version": "0.1.0", "records": con_rows})

    policies = [
        ("POL-GOV-001", "Preserve original source material unchanged.", "governance", "platform-owner", "active"),
        ("POL-GOV-002", "LLM extraction and summarisation remain untrusted until source and schema validation.", "governance", "platform-owner", "active"),
        ("POL-GOV-003", "Runtime athlete decisions use deterministic, versioned, testable non-LLM models.", "coordinator", "model-risk-owner", "active"),
        ("POL-GOV-004", "No application repository is modified or wired by this evidence-platform release.", "governance", "platform-owner", "active"),
        ("POL-SAFE-001", "Safety hard stops and insufficient-data states take precedence over optimisation scores.", "coordinator", "clinical-safety-owner-unassigned", "draft_requires_owner"),
        ("POL-TRACE-001", "Every decision receipt retains complete source-to-decision lineage and immutable model versions.", "coordinator", "model-risk-owner", "active"),
    ]
    pol_rows = [{"policy_id":a,"statement":b,"system":c,"owner":d,"status":e,"evidence_claim_ids":"","review_due":""} for a,b,c,d,e in policies]
    write_csv(BASE / "policies" / "policy-registry.csv", pol_rows)
    write_json(BASE / "policies" / "policy-registry.json", {"registry_version": "0.1.0", "policies": pol_rows})
    return metric_rows, observations, con_rows, pol_rows


def write_architecture_docs(counts):
    (BASE / "docs" / "architecture").mkdir(parents=True, exist_ok=True)
    (BASE / "models").mkdir(parents=True, exist_ok=True)
    (BASE / "decisions").mkdir(parents=True, exist_ok=True)
    (BASE / "validators").mkdir(parents=True, exist_ok=True)
    (BASE / "tests" / "fixtures").mkdir(parents=True, exist_ok=True)
    architecture = """# Multi-model adaptive control system design

Status: **design foundation, not production-ready**.

## Boundary

Strength, Conditioning, Nutrition, Recovery, and Coordinator publish versioned domain outputs. The Multi-model adaptive control system consumes those outputs, creates a time-indexed athlete-state snapshot, generates bounded candidates, applies hard and soft constraints, ranks feasible candidates, validates the selected result, and emits an immutable decision receipt. No LLM participates in runtime state estimation, constraint enforcement, ranking, or final selection.

## Deterministic flow

1. **Ingest** signed/versioned domain envelopes; reject schema or version mismatches.
2. **Normalize** units, denominators, time bases, athlete identity hash, and observation time.
3. **Assess data quality** per feature: observed/estimated/missing/stale, measurement method, uncertainty, and provenance.
4. **Estimate state** as a vector, never a single safety-clearing readiness number.
5. **Generate candidates** from approved rule/model versions only.
6. **Apply hard constraints** in priority order: emergency/clinical boundary, pain/illness holds, invalid provenance, incompatible units, unavailable equipment/time, and explicit athlete/coach constraints.
7. **Score feasible candidates** using declared objectives and parameter sets. Unknown coefficients remain absent, not guessed.
8. **Cross-system arbitration** resolves resource conflicts and records support/interference tags.
9. **Validate** the winner against schema, safety, lineage, and model-version gates.
10. **Emit** recommendation plus immutable receipt; replay uses identical normalized inputs, rule/model artifacts, parameter set, and deterministic seed when applicable.

## Athlete-state vector

The snapshot contains domain sub-states plus quality and uncertainty:

- Strength: exercise-specific performance history, exposure, load semantics, fatigue evidence, target phase.
- Conditioning: modality, intensity distribution, load, device quality, recent performance, planned stress.
- Nutrition: intake completeness, mass trend, target direction, estimated expenditure, macro/fuelling context.
- Recovery: sleep, HR/HRV protocol outputs, soreness, structured pain/illness events, subjective context.
- Coordinator: schedule, priorities, equipment, time, conflicts, policy constraints, previous decisions.

Every field is tagged `observed`, `derived`, `estimated`, `missing`, or `stale`, with timestamp, method, uncertainty, and lineage IDs.

## Optimisation contract

The optimizer solves a constrained selection problem over a finite candidate set. Objectives can include expected goal progress, adherence feasibility, monotony control, and plan stability. Hard constraints must never be converted into tradeable penalty weights. Soft-objective weights and all model parameters require owned versioned parameter sets and validation reports; this release intentionally supplies no invented coefficients.

## Cross-system support and interference

| Producer | Supports | Can constrain/interfere | Required coordinator signal |
|---|---|---|---|
| Strength | neuromuscular/skill stimulus | lower-body fatigue, soreness, time | muscle/movement load, priority, recovery cost |
| Conditioning | aerobic/anaerobic capacity | modality-specific concurrent load | modality, intensity, duration, lower-body stress |
| Nutrition | substrate, energy and recovery support | low/uncertain intake, goal-rate conflict | completeness, target, uncertainty, safety flags |
| Recovery | context for tolerance | pain/illness/sleep constraints | structured events, quality, expiry, precedence |
| Coordinator | scheduling and priorities | plan instability or unresolved conflicts | constraints, conflicts, chosen trade-offs |

## Interfaces

All domain outputs use an event envelope with `event_id`, `athlete_id_hash`, `occurred_at`, `produced_at`, `system`, `schema_version`, `model_version`, `payload_hash`, `provenance_ids`, and payload. Cross-system messages are append-only; corrections supersede earlier events rather than mutating history.

## Safety and abstention

The control system must abstain when required inputs, provenance, compatible units, approved model versions, or a feasible safe candidate are missing. Abstention is a valid decision with reason codes and a receipt.
"""
    (BASE / "docs" / "architecture" / "multi-model-adaptive-control-system.md").write_text(architecture, encoding="utf-8")

    interfaces = """# Five-system interface contract

## Common envelope

Required fields: `event_id`, `athlete_id_hash`, `system`, `event_type`, `occurred_at`, `produced_at`, `schema_version`, `producer_version`, `payload`, `payload_hash`, `source_ids`, `observation_ids`, `quality`, `supersedes_event_id`.

## Domain outputs

- **Strength:** completed set/session observations, exercise identity and load semantics, planned stimulus, performance estimate, local fatigue/context, and constraint proposals.
- **Conditioning:** modality, duration/distance/power/pace/HR observations, intensity classification, planned stress, device/method metadata, and constraint proposals.
- **Nutrition:** intake and logging completeness, body-mass observation/trend, target state, formula version, uncertainty, and non-diagnostic safety review flags.
- **Recovery:** sleep/HR/HRV/soreness observations, structured pain/illness/heat/neurological/cardiopulmonary events, missingness, staleness, and hard/soft constraints.
- **Coordinator:** schedule availability, goal priority, equipment, preferences, conflicts, current plan version, prior decision IDs, and owner-approved policies.

## Compatibility rules

1. Units, denominator and time basis must be compatible before comparison.
2. Population evidence is not an athlete observation and cannot silently become one.
3. A corrected observation supersedes but never deletes its predecessor.
4. Missing is not zero; stale is not current; estimated is not observed.
5. Safety constraints carry precedence and expiry/clearance conditions.
6. Every candidate must identify the exact rules and model versions that produced it.
"""
    (BASE / "docs" / "architecture" / "five-system-interfaces.md").write_text(interfaces, encoding="utf-8")

    model_doc = """# Model registry design

The registry stores immutable artifacts for deterministic rules, filters, statistical estimators, constrained optimizers, and validators. LLMs are excluded from runtime model types.

Each model version records identity, semantic version, system, type, input/output schema hashes, rule IDs, parameter-set ID, training/calibration data IDs when applicable, code/artifact hash, validation-report IDs, approval status, effective window, superseded version, rollback notes, and owner.

Allowed lifecycle: `draft -> validated_offline -> shadow -> limited_release -> active -> deprecated -> retired`. A model cannot enter `active` without complete lineage, deterministic replay tests, safety tests, owner approval, and a rollback target. No model in this foundation release is active.
"""
    (BASE / "models" / "README.md").write_text(model_doc, encoding="utf-8")
    write_json(BASE / "models" / "model-registry.json", {"registry_version": "0.1.0", "status": "design_only", "models": [], "note": "No model coefficients or production approvals were inferred from the archive."})

    receipt_doc = """# Decision receipts and replay

A receipt is append-only and content-addressed. It records normalized inputs and their hashes, athlete-state hash, sources, observations, claims, policies, rules, exact model versions and parameter sets, candidate decisions, constraints, validator results, selected decision, reason codes, abstention state, deterministic seed (if any), software environment, and receipt hash.

Replay succeeds only when every referenced immutable artifact is available and recomputation produces the same normalized state, candidate set, validation results, decision, and receipt hash. Differences produce a replay-failure record; they never overwrite the original receipt.

No real athlete decision is included in this release. `decision-receipt.schema.json` is the normative structure.
"""
    (BASE / "decisions" / "README.md").write_text(receipt_doc, encoding="utf-8")

    validation_md = """# Validation tests and acceptance criteria

## Required gates

| Test | Acceptance criterion |
|---|---|
| Contradictory evidence | Linked contradiction is unresolved or an owned resolution is referenced; silent winner selection fails. |
| Missing values | Required value missing causes explicit `insufficient_data` or schema failure; never coerced to zero. |
| Incompatible units | No comparison or arithmetic without an approved lossless/versioned conversion. |
| Different denominators | Records remain non-comparable until denominator semantics match. |
| Different populations | Synthesis retains population strata or an explicit applicability judgment. |
| Stale rules | Expired/review-overdue rule cannot execute. |
| Invalid model versions | Unknown, hash-mismatched, deprecated-without-override, or unapproved version fails closed. |
| Unsafe decisions | Any hard safety constraint blocks the candidate regardless of soft score. |
| Incomplete provenance | Missing source-to-rule lineage blocks release and receipt finalization. |
| Conflicting recommendations | Coordinator records conflict, priority policy, rejected candidates, and reason codes. |
| Replay | Same inputs/artifacts produce identical state, decision and receipt hash. |

## Foundation acceptance

All JSON parses; JSON Schemas have valid JSON structure; all CSV rows match their header width; YAML parses where a parser is available; Markdown indexes contain no broken relative links; source copies match the supplied archive hash; every registry ID is unique; references resolve; no model is marked active; no claim extracted from the archive is marked independently verified without a validation record.
"""
    (BASE / "tests" / "ACCEPTANCE-CRITERIA.md").write_text(validation_md, encoding="utf-8")

    roadmap = """# Research roadmap toward a 5-15 million-line evidence corpus

The target is a storage/coverage ambition, not a quality metric. Expansion must be gated by evidence value, licensing, provenance completeness, and review capacity.

1. **Foundation (current release):** inventory and hash the corpus; freeze schemas; triage explicit claims/formulas; assign owners and rejection rules.
2. **Primary-source acquisition:** resolve the highest-risk clinical/safety, nutrition, concurrent-training, load-management and measurement-validity gaps using PubMed and official primary sources. Store lawful source metadata or files with digests and exact locations.
3. **Structured extraction:** dual-review high-value tables and numeric outcomes; preserve population, method, uncertainty and transformations; compute inter-review agreement.
4. **Synthesis:** preregister comparison rules, stratify populations and methods, maintain contradiction graphs, and prohibit unsupported pooling.
5. **Policy translation:** owners approve explicit trade-offs; policies never masquerade as scientific findings.
6. **Rule/model validation:** implement only versioned deterministic candidates; test offline, shadow and limited-release stages; retain rollback and replay.
7. **Scale controls:** line-count and record-count dashboards remain secondary to verified-observation yield, unresolved contradiction rate, provenance completeness, and validator pass rate.

Milestones should be defined by verified records (for example, validated observations and adjudicated claims), not by raw lines alone. Large PDFs, duplicate archives and generated prose must not inflate progress.
"""
    (BASE / "docs" / "research-roadmap.md").write_text(roadmap, encoding="utf-8")


def write_gap_report():
    rows = [
        ("Strength", "Explicit claim and formula registries; test vectors; exercise metadata; research syntheses", "Several PubMed-linked claims and transparent candidate formulas", "Independent source verification; population/method extraction; calibration and prospective validation", "Private competitor estimators and coefficients", "Load progression, RIR accuracy, volume-response, deload, concurrent training, safety boundaries"),
        ("Conditioning", "Modality progression material; Concept2/Echo data contracts; source registries; integration notes", "Device/API evidence and progression trees are mixed with implementation packs", "Canonical conditioning metric dictionary; dose-response observations; modality-specific validation", "Vendor algorithms, device firmware behavior, proprietary scoring", "Intensity distribution, progression/regression, device validity, hybrid interference by modality/population"),
        ("Nutrition", "Formula and claim registries; PubMed-linked review; AUSNUT/OFF provenance notes; tests and prototypes", "Transparent equations and logging-state rules, many marked inference/prototype", "Equation population bounds; uncertainty calibration; athlete-specific prospective validation; clinical safety ownership", "MacroFactor production algorithm and coefficients", "Energy expenditure estimation, weight-trend filters, protein/energy availability, missing/partial logging semantics"),
        ("Recovery", "Five large AI-authored handoff/audit/synthesis documents", "Broad topic coverage but weak structured provenance and no canonical registry", "Primary studies, measurement protocols, reliability, clinical boundaries, structured observations and rules", "Wearable vendor scores/coefficients and individual baselines not in archive", "HRV/HR/sleep validity, illness/pain pathways, return-to-training, wearable missingness and uncertainty"),
        ("Coordinator", "Three coordinator/onboarding/model-spec documents plus cross-system contracts", "Architecture concepts and candidate boundaries", "Owned arbitration policies, exact interface versions, feasible-set definition, objective functions and validation data", "Production priorities, proprietary optimization weights, real athlete conflict data", "Concurrent-training interaction, safety precedence, multi-objective optimization, abstention and replay"),
    ]
    write_csv(BASE / "structured" / "five-system-gap-map.csv", [{"system":a,"what_we_have":b,"partial":c,"missing":d,"proprietary_or_unrecoverable":e,"requires_primary_source_research":f,"status":"open_research_gap"} for a,b,c,d,e,f in rows])
    md = "# Five-system research gap report\n\nAll entries are corpus assessments, not claims of scientific validity.\n\n" + "\n".join([f"## {a}\n\n- **Have:** {b}\n- **Partial:** {c}\n- **Missing:** {d}\n- **Proprietary/unrecoverable:** {e}\n- **Primary-source research:** {f}\n" for a,b,c,d,e,f in rows])
    (BASE / "docs" / "five-system-gap-report.md").write_text(md, encoding="utf-8")
    return rows


def write_readme_and_final(counts):
    readme = f"""# THE Hybrid System evidence platform

Release status: **foundation only - not production-ready**.

This folder preserves the supplied archive, inventories every extracted file, separates evidence from product policy and executable logic, and defines a traceable non-LLM control-system foundation. It does not modify or wire any application repository, does not build a chatbot, and activates no athlete-decision model.

## Architecture

Strength, Conditioning, Nutrition, Recovery, and Coordinator publish versioned outputs into the **Multi-model adaptive control system**. That higher-level system normalizes data, estimates a vector athlete state, generates deterministic candidates, applies hard safety and feasibility constraints, ranks only feasible candidates using approved model/parameter versions, validates the result, and emits an immutable replayable receipt.

## Traceability chain

`source -> extracted record -> normalized metric -> evidence claim -> synthesis/contradiction -> product policy -> executable rule -> model version -> validator result -> decision -> receipt`

## Folder map

- `docs/`: architecture, gap analysis, lane reviews, roadmap and final report.
- `schemas/`: JSON Schemas for sources, studies, populations, metrics, observations, cells, formulas, claims, contradictions, policies, rules, models, athlete state and receipts.
- `sources/`: original ZIP, unchanged extracted source tree, canonical file registry, and external-citation registry.
- `structured/`: inventory, nested archive inventory, metrics, observations, formulas and gap map.
- `claims/`, `contradictions/`, `policies/`, `rules/`: separated registries.
- `models/`: model-registry design; no active model.
- `validators/`, `tests/`: validation code, fixtures and acceptance criteria.
- `decisions/`: receipt/replay design; no real athlete decisions.
- `releases/`: checksums, validation reports and packaged release.
- `work/`: internal build and QA material, retained for audit.

## Measured corpus baseline

- Extracted files: {counts['files']}
- Source-file bytes: {counts['bytes']:,}
- Text lines in directly readable extracted files: {counts['lines']:,}
- Unique external citation locators found: {counts['external_sources']}
- Explicit claim rows extracted: {counts['claims']}
- Structured observations created: {counts['observations']}
- Tables detected/estimated: {counts['tables']}
- Canonical metrics defined: {counts['metrics']}
- Explicit formula rows extracted: {counts['formulas']}
- Open gap categories: {counts['gaps']}
- Curated contradiction/qualification records: {counts['contradictions']}
- Candidate rule rows: {counts['rules']}
- Usable executable rules: **0** (none has complete inputs, outputs, owner, evidence validation, model version and tests)

Counts are deliberately conservative and definitions are documented in `docs/final-status-report.md`. Duplicate archive material is not counted as new evidence.

## Trust boundary

Archive labels such as “final”, “validated”, “high confidence”, or “PubMed” are recorded as source assertions. They are not promoted to verified facts until a reviewer validates the cited source, population, method, result, and schema record. Missing values remain missing.

## Start here

1. Read `docs/final-status-report.md` and `docs/five-system-gap-report.md`.
2. Review `structured/archive-inventory.csv` and `contradictions/exact-duplicates.csv`.
3. Validate records with `validators/validate_platform.py`.
4. Approve owners and evidence before promoting any policy, rule or model.
"""
    (BASE / "README.md").write_text(readme, encoding="utf-8")

    final = f"""# Final status report

## Complete in this foundation release

- Preserved the supplied ZIP and extracted source tree without altering source files.
- Inventoried {counts['files']} extracted files with SHA-256 identities, classifications and exact-duplicate links.
- Inventoried {counts['nested_entries']} files inside nested ZIP containers as metadata; no archived code was executed.
- Created source, external-citation, metric, observation, formula, claim, contradiction, policy and candidate-rule registries.
- Created requested schemas plus athlete-state and schema-catalog schemas.
- Designed five-system interfaces, vector state estimation, constrained decision selection, model lifecycle, receipts and replay.
- Added validation gates and acceptance criteria; release validation results are stored in `releases/`.

## Incomplete

- Corpus-wide source-by-source scientific verification and risk-of-bias assessment.
- Full numeric extraction from every table and narrative value.
- Population/study records for every cited paper.
- Human adjudication of every duplicate, contradiction, stale version and claim relationship.
- Owned product policies, executable rule contracts, calibrated coefficients and approved model versions.
- Prospective or retrospective athlete validation.

## Uncertain

- Whether “current” or “final” filenames are authoritative; no single version manifest governs the archive.
- Accuracy of AI-authored research syntheses and handoffs until citations are checked.
- Applicability of group-level studies to a specific athlete.
- Measurement validity and firmware/API behavior for devices represented in the archive.

## Unsupported or rejected

- Calling the product “the Hybrid Engine” in new material.
- Treating competitor behavior as scientific validation or inferring private coefficients.
- Universal readiness thresholds, “two missed sessions means deload”, universal ACWR danger thresholds, or a single score that overrides pain/illness/missing data.
- Any claim that this foundation is production-ready.

## Count definitions

- **Files:** extracted filesystem files in the outer archive, excluding generated platform files.
- **Sources:** file sources are counted separately from unique external citation locators.
- **Claims:** rows with explicit IDs in three existing claim registries; they remain untrusted.
- **Observations:** numeric tokens extracted from explicit formula definitions with exact row provenance; multiple constants in one formula remain grouped and unverified.
- **Tables:** Markdown table separators plus CSV/TSV and HTML table estimates; this is a structural count, not verified evidence tables.
- **Metrics:** provisional canonical dictionary entries created in this release.
- **Formulas:** explicit formula-registry rows, not formula mentions in prose/code.
- **Gaps:** five system-level gap-map rows.
- **Contradictions:** curated contradictions/qualifications plus a separate exact-duplicate registry.
- **Usable rules:** only fully specified, evidenced, owned, versioned and tested rules count; current result is zero.

## Production readiness

**Not production-ready.** The correct next gate is human evidence review and policy ownership, followed by deterministic implementation and offline/shadow validation in application repositories under a separate authorized project.
"""
    (BASE / "docs" / "final-status-report.md").write_text(final, encoding="utf-8")


def write_validator():
    validator = r'''from __future__ import annotations
import csv, hashlib, json, re, sys
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
errors=[]; warnings=[]; checked={"json":0,"yaml":0,"csv":0,"markdown_indexes":0}

for p in BASE.rglob("*.json"):
    if "sources/original-archive" in p.as_posix() or "/work/" in p.as_posix(): continue
    try: json.loads(p.read_text(encoding="utf-8-sig")); checked["json"]+=1
    except Exception as e: errors.append(f"JSON {p.relative_to(BASE)}: {e}")

try:
    import yaml
except Exception:
    yaml=None
for p in list(BASE.rglob("*.yaml"))+list(BASE.rglob("*.yml")):
    if "sources/original-archive" in p.as_posix() or "/work/" in p.as_posix(): continue
    if yaml:
        try: yaml.safe_load(p.read_text(encoding="utf-8-sig")); checked["yaml"]+=1
        except Exception as e: errors.append(f"YAML {p.relative_to(BASE)}: {e}")
    else: warnings.append("YAML parser unavailable; no generated YAML currently requires validation")

for p in BASE.rglob("*.csv"):
    if "sources/original-archive" in p.as_posix() or "/work/" in p.as_posix(): continue
    try:
        with p.open(newline="",encoding="utf-8-sig") as f:
            rows=list(csv.reader(f))
        if not rows: errors.append(f"CSV {p.relative_to(BASE)}: empty")
        elif any(len(r)!=len(rows[0]) for r in rows[1:]): errors.append(f"CSV {p.relative_to(BASE)}: row width mismatch")
        else: checked["csv"]+=1
    except Exception as e: errors.append(f"CSV {p.relative_to(BASE)}: {e}")

for p in [BASE/"README.md", BASE/"docs"/"final-status-report.md", BASE/"docs"/"five-system-gap-report.md"]:
    if not p.exists(): errors.append(f"Missing Markdown index: {p.relative_to(BASE)}"); continue
    text=p.read_text(encoding="utf-8")
    if "Hybrid Engine" in text and p.name=="README.md": warnings.append("README contains quoted historical terminology; confirm context")
    for target in re.findall(r"`([^`]+\.(?:md|csv|json))`",text):
        q=BASE/target
        if not q.exists(): errors.append(f"Broken index target {target} in {p.relative_to(BASE)}")
    checked["markdown_indexes"]+=1

src_zip=BASE/"sources"/"THE-Hybrid-System-EVERYTHING-MASTER-ARCHIVE-2026-08-28.zip"
if not src_zip.exists(): errors.append("Preserved source ZIP missing")
else:
    h=hashlib.sha256(src_zip.read_bytes()).hexdigest().upper()
    if h!="DB4BA09A0E352BB400F50BFF40CA3E06BAF72611CDA0E99C5494470425BBC03E": errors.append("Preserved ZIP hash mismatch")

for rel,key in [("sources/source-registry.csv","source_id"),("claims/claim-registry.csv","claim_id"),("structured/metric-dictionary.csv","metric_id"),("structured/formula-registry.csv","formula_id")]:
    p=BASE/rel
    with p.open(newline="",encoding="utf-8-sig") as f: rows=list(csv.DictReader(f))
    vals=[r[key] for r in rows]
    if len(vals)!=len(set(vals)): errors.append(f"Duplicate IDs in {rel}:{key}")

models=json.loads((BASE/"models"/"model-registry.json").read_text(encoding="utf-8"))
if any(m.get("status")=="active" for m in models.get("models",[])): errors.append("Active model exists in foundation release")

report={"status":"PASS" if not errors else "FAIL","checked":checked,"errors":errors,"warnings":sorted(set(warnings))}
out=BASE/"releases"/"validation-report.json"; out.parent.mkdir(parents=True,exist_ok=True); out.write_text(json.dumps(report,indent=2)+"\n",encoding="utf-8")
print(json.dumps(report,indent=2)); sys.exit(1 if errors else 0)
'''
    (BASE / "validators" / "validate_platform.py").write_text(validator, encoding="utf-8")

    tests = r'''from __future__ import annotations
import json, unittest
from pathlib import Path

BASE=Path(__file__).resolve().parents[1]

class FoundationTests(unittest.TestCase):
    def test_no_active_models(self):
        data=json.loads((BASE/"models"/"model-registry.json").read_text())
        self.assertFalse(any(m.get("status")=="active" for m in data.get("models",[])))
    def test_receipt_schema_requires_replay_fields(self):
        data=json.loads((BASE/"schemas"/"decision-receipt.schema.json").read_text())
        for field in ["athlete_state_hash","model_versions","validator_results","receipt_hash"]:
            self.assertIn(field,data["required"])
    def test_state_has_five_domains(self):
        data=json.loads((BASE/"schemas"/"athlete-state.schema.json").read_text())
        self.assertEqual(set(data["properties"]["domains"]["required"]),{"strength","conditioning","nutrition","recovery","coordinator"})

if __name__=="__main__": unittest.main()
'''
    (BASE / "tests" / "test_foundation.py").write_text(tests, encoding="utf-8")


def manifest_and_counts(counts):
    excluded = {BASE / "releases" / "manifest.sha256", BASE / "releases" / "release-summary.json"}
    files = [p for p in BASE.rglob("*") if p.is_file() and p not in excluded and "sources/original-archive" not in p.as_posix() and "/work/qa-" not in p.as_posix() and "/work/validation-deps/" not in p.as_posix()]
    lines=[]
    for p in sorted(files):
        lines.append(f"{sha256_file(p).upper()}  {p.relative_to(BASE).as_posix()}")
    (BASE/"releases"/"manifest.sha256").write_text("\n".join(lines)+"\n",encoding="utf-8")
    write_json(BASE/"releases"/"release-summary.json", {"release":"0.1.0-foundation","generated_at":GENERATED_AT,"status":"not_production_ready","counts":counts,"manifest_entries":len(lines)})


def main():
    generate_schemas()
    inv, dups, nested, raw = inventory()
    claims, formulas, rules = extract_claims_and_formulas(inv)
    metrics, observations, contradictions, policies = curated_registries(inv, formulas)
    gaps = write_gap_report()
    counts = {
        "files": len(inv), "bytes": sum(int(r["bytes"]) for r in inv), "lines": raw["line_total"],
        "external_sources": raw["unique_urls"], "claims": len(claims), "observations": len(observations),
        "tables": raw["table_total"], "metrics": len(metrics), "formulas": len(formulas), "gaps": len(gaps),
        "contradictions": len(contradictions), "exact_duplicate_occurrences": len(dups), "rules": len(rules),
        "usable_rules": 0, "nested_entries": len(nested),
    }
    write_architecture_docs(counts)
    write_readme_and_final(counts)
    # Validator is maintained as a hand-reviewed release gate; do not regenerate it here.
    manifest_and_counts(counts)
    print(json.dumps(counts, indent=2))


if __name__ == "__main__":
    main()
