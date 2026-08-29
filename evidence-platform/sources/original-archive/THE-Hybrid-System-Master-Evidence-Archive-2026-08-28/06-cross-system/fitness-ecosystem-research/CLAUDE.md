# Claude Code operating rules

This repository is a research and implementation handoff for the Fitness Ecosystem. Read this file, `HANDOFF_TO_CLAUDE_CODE.md`, `PROJECT_CONTEXT.md`, and `docs/00_EXECUTIVE_REVIEW.md` before editing code in the target application.

## Mission

Prepare a safe split of the existing fused Hybrid Engine into two independently deployed products:

- Strength owns lifting prescriptions, progression, and strength history.
- Conditioning owns modalities, intervals, cardio progression, and device integrations.
- Shared-core owns identity, goals, schedules, body metrics, safety flags, events, and sync contracts.
- Whole-Athlete State interprets context and emits constraints; it does not prescribe workouts.
- The Coordinator is the canonical planner and resolves specialist proposals.
- Nutrition/MacroTrack is out of scope, but integration events must remain forward-compatible.

## First-session rules

1. Locate the real `the-hybrid-engine1` checkout. This package does not contain that product source.
2. Run a read-only baseline audit before changing source or data.
3. Mark every fact as `verified`, `provided`, `inferred`, or `unknown`.
4. Do not implement the app split until the baseline audit and contract review are approved.
5. Use a Git worktree and a named branch for every phase. Never work directly on the protected base branch.

## Non-negotiable domain rules

- Do not treat a wearable provider score as the app’s medical or physiological truth.
- HRV is advisory context only. It must never be a pain, injury, or tissue-integrity gate.
- Pain, illness, red flags, and clinical-review states are separate from fatigue/readiness.
- Missing data is not zero. Every derived output carries data quality, coverage, confidence, and reason codes.
- Preserve prescription targets separately from logged results.
- Preserve completed history as immutable snapshots; later food/session edits must not silently rewrite historical decisions.
- Specialist engines may propose. Only the Coordinator may publish a cross-modality weekly plan.
- Do not use machine learning or a generic fatigue budget in v1 without a calibration and rollback plan.
- Do not claim the product diagnoses, prevents, or treats disease or injury without regulatory and clinical review.

## Engineering rules

- Prefer pure, deterministic functions with golden fixtures for state and planning logic.
- Keep local storage authoritative for the UI; sync through repositories and an outbox.
- Use server-side ownership, schema versions, idempotency keys, optimistic concurrency, and RLS before public multi-app release.
- Never use a single client-merged JSON blob as the cross-app compatibility boundary.
- Share domain contracts, serialization, migrations, design tokens, and fixtures. Keep platform rendering and native integrations separate.
- Never add secrets to source, fixtures, logs, screenshots, or the ZIP.
- Before changing a contract, update its schema, fixture, migration, tests, source register, and handoff notes in the same change.

## Verification and handoff

Run `./scripts/verify.sh` in this repository. In the target app, run its existing lint, typecheck, unit, integration, native, and E2E commands discovered during the baseline audit. Report exact commands and results; do not claim Android, iOS, BLE, GPS, Supabase, or store validation without running it.

Every handoff must state: goal, current phase, changed files, tests run, failures or blockers, decisions needed, and the next smallest safe task.
