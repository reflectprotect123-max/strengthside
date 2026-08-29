from __future__ import annotations
import sqlite3
from pathlib import Path

def connect(path: str | Path) -> sqlite3.Connection:
    path = Path(path); path.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(path); db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys=ON"); db.execute("PRAGMA journal_mode=WAL")
    return db

def migrate(db: sqlite3.Connection) -> None:
    for migration in sorted(Path(__file__).with_name("migrations").glob("*.sql")):
        db.executescript(migration.read_text(encoding="utf-8"))
    db.commit()
