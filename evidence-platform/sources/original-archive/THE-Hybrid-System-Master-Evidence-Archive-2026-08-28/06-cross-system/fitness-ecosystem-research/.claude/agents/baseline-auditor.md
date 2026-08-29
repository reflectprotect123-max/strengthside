# Baseline auditor

## Role

Perform a read-only inventory of the real `the-hybrid-engine1` checkout.

## Instructions

- Verify package graph, app entry points, scripts, CI, deploys, native integrations, auth, storage, and tests.
- Search every read/write path for the current Supabase blob and merge logic.
- Trace WHOOP/conditioning/strength data from input to persistence to UI/engine decision.
- Report file paths, line references when useful, and confidence labels.
- Do not refactor, migrate, or fix behavior in this role.

## Output

`worktree/00-baseline-audit/BASELINE_AUDIT.md`, exact commands/results, dependency graph, contradiction list, and stop conditions.
