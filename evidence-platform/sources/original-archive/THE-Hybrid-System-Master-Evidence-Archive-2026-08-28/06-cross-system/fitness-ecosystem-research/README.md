# Fitness Ecosystem — Research and Claude Code Handoff

Status: deep-research handoff and implementation work tree. **Implementation is not approved by this package alone.**

This repository turns the provided Fitness Ecosystem build plan into an evidence-led, Claude Code–ready delivery package for:

- a separately deployed Strength app;
- a separately deployed Conditioning app;
- a shared, versioned athlete-data and integration contract;
- a Whole-Athlete State engine for context and constraints; and
- a future Coordinator that reconciles specialist proposals into one weekly plan.

The Nutrition/MacroTrack product remains a separate effort and is intentionally out of implementation scope here. Its future integration events are specified so that the split does not create another migration later.

## Start here

Read these in order:

1. [`CLAUDE.md`](CLAUDE.md) — operating rules for Claude Code.
2. [`HANDOFF_TO_CLAUDE_CODE.md`](HANDOFF_TO_CLAUDE_CODE.md) — the first-session brief and exact starting prompt.
3. [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) — supplied context, confidence labels, and non-negotiable product boundaries.
4. [`docs/00_EXECUTIVE_REVIEW.md`](docs/00_EXECUTIVE_REVIEW.md) — the research conclusion and redlines.
5. [`docs/09_BUILD_ROADMAP.md`](docs/09_BUILD_ROADMAP.md) — dependency-aware implementation sequence.
6. [`worktree/BACKLOG.md`](worktree/BACKLOG.md) — implementation work tree and exit criteria.
7. [`docs/SOURCES.md`](docs/SOURCES.md) — primary sources and evidence register.

Do not start by asking Claude to “build the two apps.” Start with the baseline audit in `worktree/00-baseline-audit` against the real `the-hybrid-engine1` checkout.

## Core conclusion

The destination is sound: two specialised engines and two separately deployed products can make domain decisions clearer. The original plan is not safe to implement unchanged because the current single JSONB blob and client-side merge rules are not a sufficient compatibility boundary for independently released apps.

The revised foundation is:

```text
local-first app databases
        │
        ├── Strength domain repository ───────┐
        ├── Conditioning domain repository ──┤
        ├── Shared-core repository ──────────┤── server contract
        └── integration-event outbox ────────┘
                                                │
                              versioned snapshots + append-only integration events
                                                │
                    Whole-Athlete State ──> specialist proposals ──> Coordinator plan
```

Keep the domain engines pure and deterministic where possible. Keep safety flags, pain, illness, and clinical-review states separate from ordinary fatigue. Treat wearable scores as provider observations, not as medical truth or the app’s own “readiness.”

## What is in this repository

| Area | Contents |
|---|---|
| Research | Architecture, sync, physiology, concurrent training, wearables, privacy, security, regulation, and Claude Code workflow review |
| Contracts | Versioned JSON Schemas and fixtures for events, snapshots, proposals, and plans |
| Work tree | Baseline audit through production hardening, each with dependencies and exit gates |
| Claude handoff | Root operating rules, agents, skills, plugin/MCP installation guide, first-session prompt |
| Verification | Offline checks for JSON, contract shape, documentation hygiene, and reproducible packaging |

## Quick verification

From the repository root:

```bash
./scripts/verify.sh
```

This package is documentation/contracts-first, so the verification script does not pretend to compile the absent product source. Once Claude has the real application checkout, add its existing test commands to the baseline report and preserve this package’s contract tests as a required gate.

## Claude Code installation

Install Claude Code using Anthropic’s official instructions, then launch it from this repository:

```bash
cd /path/to/fitness-ecosystem-research
claude
```

Official installation and authentication details are in [`docs/08_PLUGIN_AND_CLAUDE_CODE_SETUP.md`](docs/08_PLUGIN_AND_CLAUDE_CODE_SETUP.md). Do not put API keys, Supabase service-role keys, WHOOP client secrets, Sentry tokens, or production database URLs in this repository.

## Work-tree workflow

This repository contains a task tree in `worktree/`. For isolated Git work, create real Git worktrees from the repository’s parent directory:

```bash
git worktree add ../fitness-ecosystem-baseline -b phase/00-baseline-audit
git worktree add ../fitness-ecosystem-contracts -b phase/01-contracts-and-sync
git worktree list
```

Only one worktree should own a shared migration or contract at a time. See [`WORKTREE.md`](WORKTREE.md) and [`worktree/BACKLOG.md`](worktree/BACKLOG.md).

## Important boundary

This package is a researched architecture and delivery handoff, not medical advice and not a claim of parity with any commercial product. It deliberately rejects hidden readiness logic, unsupported injury prediction, universal deload thresholds, and unbounded AI-generated training decisions.

The first implementation approval should be for the contracts and migration rehearsal only. Public app-splitting approval comes later, after old-version compatibility, offline conflict, security, and recovery-path tests pass.
