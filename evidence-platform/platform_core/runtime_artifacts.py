"""Shared runtime_artifacts trust-check and loading logic.

Used by decision.py (BIG MAC's own model pool, system IS NULL) and by
individual engines (platform_core/engines/<system>.py, system=<name>) to
load a hash-verified, trust-checked model artifact from the same table
under the same trust rules, without either module importing the other -
decision.py already imports from engines.common, so engines.common
importing decision.py back would be circular. This module is a leaf:
stdlib only.
"""

from __future__ import annotations

import hashlib
import json
import sqlite3
from pathlib import Path
from typing import Any


def load_trusted_model_artifacts(
    db: sqlite3.Connection, *, system: str | None = None
) -> tuple[list[dict[str, Any]], list[str]]:
    """Load active, trust-checked model artifacts.

    system=None loads BIG-MAC-scoped models (system IS NULL) - this is
    decision.load_runtime_models's own pool, unchanged behavior. A
    specific system name loads only that one engine's own scoped models,
    entirely separate from BIG MAC's pool.
    """
    if system is None:
        query = "SELECT * FROM runtime_artifacts WHERE artifact_type='model' AND status='active' AND system IS NULL"
        params: tuple[Any, ...] = ()
    else:
        query = "SELECT * FROM runtime_artifacts WHERE artifact_type='model' AND status='active' AND system=?"
        params = (system,)

    models: list[dict[str, Any]] = []
    errors: list[str] = []
    for row in db.execute(query, params):
        item = dict(row)
        if item["llm_tainted"] or item["trust_origin"] != "human_promoted_verified" or not item["deterministic"]:
            errors.append("UNTRUSTED_RUNTIME_ARTIFACT:" + item["artifact_id"])
            continue
        path = Path(item["artifact_path"])
        if not path.is_file():
            errors.append("MODEL_ARTIFACT_MISSING:" + item["artifact_id"])
            continue
        actual = hashlib.sha256(path.read_bytes()).hexdigest()
        if actual != item["artifact_hash"]:
            errors.append("MODEL_ARTIFACT_HASH_MISMATCH:" + item["artifact_id"])
            continue
        model = json.loads(path.read_text())
        model["model_id"] = item["artifact_id"]
        models.append(model)
    return models, errors
