PRAGMA foreign_keys = ON;

-- Phase 3: runtime_artifacts previously had no way to say a model belongs
-- to one specific engine (strength/conditioning/nutrition/recovery/
-- coordinator) rather than to BIG MAC's own top-level gate. NULL means
-- "BIG MAC's own model pool" (today's only case, unchanged); a system
-- name scopes a model to exactly one engine's own evaluate() seam.
ALTER TABLE runtime_artifacts ADD COLUMN system TEXT
 CHECK(system IS NULL OR system IN('strength','conditioning','nutrition','recovery','coordinator'));

CREATE INDEX IF NOT EXISTS idx_runtime_artifacts_system
 ON runtime_artifacts(system,artifact_type,status);
