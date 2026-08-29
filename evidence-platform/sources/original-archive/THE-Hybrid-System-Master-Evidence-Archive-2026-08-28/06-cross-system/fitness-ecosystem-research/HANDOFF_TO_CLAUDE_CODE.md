# Handoff to Claude Code

## First-session brief

You are taking over a research-led split of a fused fitness app into two independently deployed products. The current source repository is not included in this handoff archive; locate the real checkout before making implementation changes.

The product owner’s destination is:

```text
Strength app          Conditioning app
     │                       │
     └──── shared-core ──────┘
                 │
        Whole-Athlete State
                 │
           Coordinator plan
                 │
        future Nutrition events
```

The first deliverable is not a split app. It is an evidence-backed baseline and contract proposal that can be approved or rejected with small, reversible changes.

## Paste this prompt into Claude Code

```text
Read CLAUDE.md, HANDOFF_TO_CLAUDE_CODE.md, PROJECT_CONTEXT.md, docs/00_EXECUTIVE_REVIEW.md, docs/01_ARCHITECTURE_DECISIONS.md, docs/02_SYNC_AND_DATA_CONTRACT.md, and worktree/00-baseline-audit/README.md.

Find the real the-hybrid-engine1 repository. Do not assume its path from the handoff. Work in a new Git worktree on phase/00-baseline-audit. Perform a read-only audit first.

Inventory:
- package managers, workspace graph, app entry points, scripts, CI, deploys, EAS/store identifiers, deep links, native permissions;
- every read/write path for Supabase app_state and client merge/sanitize logic;
- all sources and persistence paths for WHOOP recovery, HRV, sleep, resting HR, strain, and workout data;
- Workout, session, result, pain, injury, readiness, settings, calendar, history, and balance models;
- current cross-modality analytics and whether any code actually prescribes schedules;
- current tests, fixtures, migrations, production compatibility risks, and missing coverage.

Produce worktree/00-baseline-audit/BASELINE_AUDIT.md with measured facts, file paths, evidence labels (verified/provided/inferred/unknown), a dependency graph, and a list of contradictions between this handoff and source. Do not refactor or change product behavior. Run the existing validation commands you discover and report exact results.

Stop for approval if the audit reveals a different auth/data model, a public contract that cannot be migrated safely, or a regulatory/clinical claim already present in product copy.
```

## Required handoff format after every phase

```text
Goal:
Current phase and branch:
Verified facts:
Changed files:
Contracts/migrations changed:
Tests and exact commands:
Failures, blockers, or unverified areas:
Decisions needed from product owner:
Smallest safe next task:
Rollback/migration note:
```

## What this package recommends

1. Freeze ownership boundaries and product invariants.
2. Replace the single cross-app JSON blob as the compatibility boundary with versioned domain-owned server contracts while retaining local-first app databases.
3. Persist complete wearable observations and build one state adapter.
4. Extract pure shared-core, Strength, and Conditioning packages.
5. Build Conditioning as a private canary, not an immediate public release.
6. Rehearse old/new app compatibility and reinstall/offline scenarios.
7. Build the Coordinator simulation harness from historical fixtures.
8. Migrate Strength and only then consider a public second-app release.

## Hard stop conditions

Stop and report rather than guessing if:

- a migration could delete or overwrite user data;
- the two apps cannot share an auth identity safely;
- old clients can write fields that new clients cannot preserve;
- a wearable signal is being used as an injury/pain decision;
- a feature makes diagnosis, prognosis, or treatment claims;
- the proposed Coordinator has no canonical writer;
- a test passes only because a historical fixture was weakened.
