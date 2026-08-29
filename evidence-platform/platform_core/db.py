from __future__ import annotations
import sqlite3
from pathlib import Path

def connect(path: str | Path) -> sqlite3.Connection:
    path = Path(path); path.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(path); db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys=ON"); db.execute("PRAGMA journal_mode=WAL")
    return db

def migrate(db: sqlite3.Connection) -> None:
    """Apply every migration file that has not already run against this database.

    Every migration's own SQL must still be internally idempotent (CREATE
    TABLE/INDEX IF NOT EXISTS) - this only stops a file from being
    *re-executed* once it has already applied. That distinction matters for
    a migration whose statements are not idempotent on their own (a bare
    ALTER TABLE ADD COLUMN, which SQLite has no IF NOT EXISTS form for):
    without this tracking, cli.py's main() - which calls migrate() on every
    single invocation - would crash on the second-ever run against any real
    database file.

    Known limitations, both low-probability for this project's actual usage
    (a local file, one CLI invocation or test process at a time) but real:
    Python's sqlite3.executescript() always issues an implicit COMMIT before
    running, so it cannot be wrapped in this function's own explicit
    transaction - two migrate() calls racing concurrently against the same
    file could both pass the "already applied" check for the same migration
    before either records it, and a migration that fails partway through
    leaves whatever DDL already ran permanently committed even though the
    file is not marked applied (a retry re-runs the whole file, which is
    only safe today because every current migration's statements are each
    independently idempotent except migration 006's, which only fails this
    way if it fails AFTER its ALTER TABLE already succeeded once - possible
    in principle, never observed). Fully closing either gap means executing
    each migration statement-by-statement inside a real explicit
    transaction instead of executescript(), which nothing about this
    project's actual single-operator usage has ever required.
    """
    db.execute(
        "CREATE TABLE IF NOT EXISTS schema_migrations("
        "filename TEXT PRIMARY KEY, applied_at TEXT NOT NULL)"
    )
    applied = {row["filename"] for row in db.execute("SELECT filename FROM schema_migrations")}
    for migration in sorted(Path(__file__).with_name("migrations").glob("*.sql")):
        if migration.name in applied:
            continue
        db.executescript(migration.read_text(encoding="utf-8"))
        db.execute(
            "INSERT INTO schema_migrations(filename, applied_at) VALUES(?, datetime('now'))",
            (migration.name,),
        )
    db.commit()
