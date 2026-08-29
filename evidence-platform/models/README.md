# Model registry design

The registry stores immutable artifacts for deterministic rules, filters, statistical estimators, constrained optimizers, and validators. LLMs are excluded from runtime model types.

Each model version records identity, semantic version, system, type, input/output schema hashes, rule IDs, parameter-set ID, training/calibration data IDs when applicable, code/artifact hash, validation-report IDs, approval status, effective window, superseded version, rollback notes, and owner.

Allowed lifecycle: `draft -> validated_offline -> shadow -> limited_release -> active -> deprecated -> retired`. A model cannot enter `active` without complete lineage, deterministic replay tests, safety tests, owner approval, and a rollback target. No model in this foundation release is active.
