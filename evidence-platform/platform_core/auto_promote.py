"""Auto-promotion for shipped Hybrid product-engine models.

Bypasses the human reviewer gate for deterministic product-engine artifacts.
Research corpus sources remain subject to promotion_gate — this path only
registers the five shipped JS engine mirrors as runtime-eligible models.
"""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .product_engines import DOMAINS, ENGINE_VERSION, MODEL_VERSION

AUTO_PROMOTED_TRUST_ORIGIN = "auto_promoted_product"
TRUSTED_ORIGINS = frozenset({"human_promoted_verified", AUTO_PROMOTED_TRUST_ORIGIN})


def _canonical(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def _stamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def product_engine_model_payload(system: str) -> dict[str, Any]:
    return {
        "product_engine": True,
        "system": system,
        "engine_version": ENGINE_VERSION,
        "model_version": MODEL_VERSION,
        "auto_promoted": True,
        "promotion_mode": "product_engine",
        "synthetic_test_only": False,
        "confidence": 0.85,
    }


def ensure_auto_reviewers(db) -> None:
    """Register system auto-reviewers used for auto-promotion audit trail."""
    reviewers = [
        ("auto-source-reviewer", "source_reviewer", "Automated product-engine promotion — no human conflict."),
        ("auto-domain-reviewer", "domain_reviewer", "Automated product-engine promotion — no human conflict."),
    ]
    for reviewer_id, role, declaration in reviewers:
        db.execute(
            "INSERT OR REPLACE INTO reviewer_registry VALUES(?,?,?,?)",
            (reviewer_id, role, "active", declaration),
        )
    db.commit()


def _artifact_paths(root: Path) -> dict[str, Path]:
    model_dir = root / "product-engine-models"
    model_dir.mkdir(parents=True, exist_ok=True)
    return {system: model_dir / f"{system}.json" for system in DOMAINS}


def write_product_engine_artifacts(root: Path) -> dict[str, Path]:
    paths = _artifact_paths(root)
    for system, path in paths.items():
        payload = product_engine_model_payload(system)
        path.write_text(_canonical(payload) + "\n", encoding="utf-8")
    return paths


def register_runtime_artifact(db, *, system: str, artifact_path: Path, artifact_id: str | None = None) -> str:
    artifact_id = artifact_id or f"PRODUCT-{system.upper()}-V1"
    payload = json.loads(artifact_path.read_text(encoding="utf-8"))
    artifact_hash = hashlib.sha256(artifact_path.read_bytes()).hexdigest()
    db.execute(
        "INSERT OR REPLACE INTO runtime_artifacts("
        "artifact_id,artifact_type,version,artifact_path,artifact_hash,"
        "trust_origin,llm_tainted,deterministic,status,approval_event_id,rollback_artifact_id,activated_at,system"
        ") VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",
        (
            artifact_id,
            "model",
            MODEL_VERSION,
            str(artifact_path.resolve()),
            artifact_hash,
            AUTO_PROMOTED_TRUST_ORIGIN,
            0,
            1,
            "active",
            "AUTO-PROMOTE-PRODUCT",
            None,
            _stamp(),
            system,
        ),
    )
    db.commit()
    return artifact_id


def auto_promote_product_engines(db, artifacts_root: Path | str) -> dict[str, Any]:
    """Write + register all five product-engine models. Idempotent."""
    root = Path(artifacts_root)
    ensure_auto_reviewers(db)
    paths = write_product_engine_artifacts(root)
    registered = []
    for system, path in paths.items():
        artifact_id = register_runtime_artifact(db, system=system, artifact_path=path)
        registered.append({"system": system, "artifact_id": artifact_id, "path": str(path)})
    return {
        "status": "auto_promoted",
        "trust_origin": AUTO_PROMOTED_TRUST_ORIGIN,
        "systems": list(DOMAINS),
        "artifacts": registered,
        "promoted_at": _stamp(),
    }


def is_bootstrapped(db) -> bool:
    row = db.execute(
        "SELECT COUNT(*) n FROM runtime_artifacts "
        "WHERE status='active' AND trust_origin=? AND system IS NOT NULL",
        (AUTO_PROMOTED_TRUST_ORIGIN,),
    ).fetchone()
    return bool(row and row["n"] >= len(DOMAINS))


def ensure_auto_promoted(db, artifacts_root: Path | str) -> dict[str, Any]:
    if is_bootstrapped(db):
        return {"status": "already_bootstrapped", "trust_origin": AUTO_PROMOTED_TRUST_ORIGIN}
    return auto_promote_product_engines(db, artifacts_root)
