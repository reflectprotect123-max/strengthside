# Execution ledger — adaptive Open/Next/Close

# SDD ledger — plan: docs/superpowers/plans/2026-09-04-adaptive-open-next-close.md

Branch: `cursor/strength-v2-set-by-set-0ae6`
Mode: subagent-driven (option 1) — Phase B HTML wiring done in controller after package tasks
Spec: `docs/superpowers/specs/2026-09-03-engine-three-module-redesign.md`
Plan: `docs/superpowers/plans/2026-09-04-adaptive-open-next-close.md`

Wiring rule: Graphify/Obsidian with **prototype** node ids only. Never edit preview-site twins by hand. `index.html` is not in the graph.

## Graph + orb (sealed doors)

- `apps_mobile_prototype_hybrid_app_work_overlay_startwork` → `tick()` → `completeWork()` — hold clock only. Cond Next must not hang here.
- Obsidian `completeWork().md` / `startWork().md` cite preview-site twins — ignore those paths.
- `apps_mobile_prototype_hybrid_app_session_flow_nextincompletetask` is next **task**, not next set.
- `apps_mobile_prototype_hybrid_app_log_columns_addset` resizes **builder** columns via `resizeSets`. Logger +/− must not call it.

## Rulings

- Ruling: Logger set +/− named `addLoggerSet` / `removeTrailingLoggerSet`, not `addSet` — graph `LogColumns.addSet` is builder-only; calling it from the logger would resize painted volume and short-circuit Next. — Wrong name costs a silent builder/logger cross-wire.
- Ruling: Cond slider lives in `advanceInterval` / `completeConditioning`, not `WorkOverlay.completeWork`. — Graph path is the hold clock; hanging cond there would steal the hold door.
- Ruling: Tasks 10–14 implemented in this session without a fresh implementer subagent per HTML task because they share one inline `index.html` (not in the graph) and one sealed-door list. Spec remains the authority.

## Tasks

| Task | Status | Notes |
| --- | --- | --- |
| 1–9 package + bundle | complete | prior commits on branch |
| 10 lift Next | complete | `7c1a394` |
| 11 Close/Open | complete | `f4965a5` + overwrite `33290ed` |
| 12 cond Next | complete | `33014bd` |
| 13 hold skip | complete | `ddf43c3` |
| 14 sync + v171 | in progress | |
