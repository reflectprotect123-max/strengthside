# Research bundle index

## User-facing entry points

| File | Why read it |
|---|---|
| [`README.md`](README.md) | package purpose, quick start, boundaries |
| [`CLAUDE.md`](CLAUDE.md) | persistent Claude Code rules |
| [`HANDOFF_TO_CLAUDE_CODE.md`](HANDOFF_TO_CLAUDE_CODE.md) | first-session prompt and handoff format |
| [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) | supplied facts versus unknowns |
| [`WORKTREE.md`](WORKTREE.md) | Git worktree branches and ownership |

## Research

| File | Focus |
|---|---|
| [`docs/00_EXECUTIVE_REVIEW.md`](docs/00_EXECUTIVE_REVIEW.md) | decision summary and redlines |
| [`docs/01_ARCHITECTURE_DECISIONS.md`](docs/01_ARCHITECTURE_DECISIONS.md) | ADRs and alternatives |
| [`docs/02_SYNC_AND_DATA_CONTRACT.md`](docs/02_SYNC_AND_DATA_CONTRACT.md) | local-first, server boundary, versioning |
| [`docs/03_WHOLE_ATHLETE_STATE.md`](docs/03_WHOLE_ATHLETE_STATE.md) | recovery/life stress/wearable/pain boundary |
| [`docs/04_COORDINATOR_SPEC.md`](docs/04_COORDINATOR_SPEC.md) | proposal reconciliation and reasons |
| [`docs/05_APP_SPLIT_MIGRATION.md`](docs/05_APP_SPLIT_MIGRATION.md) | separate-app migration |
| [`docs/06_SECURITY_PRIVACY_REGULATORY.md`](docs/06_SECURITY_PRIVACY_REGULATORY.md) | security, Australian privacy/TGA |
| [`docs/07_TEST_AND_RELEASE_GATES.md`](docs/07_TEST_AND_RELEASE_GATES.md) | validation and release gates |
| [`docs/08_PLUGIN_AND_CLAUDE_CODE_SETUP.md`](docs/08_PLUGIN_AND_CLAUDE_CODE_SETUP.md) | install/use Claude Code extensions |
| [`docs/09_BUILD_ROADMAP.md`](docs/09_BUILD_ROADMAP.md) | dependency-aware sequencing |
| [`docs/10_OPEN_DECISIONS.md`](docs/10_OPEN_DECISIONS.md) | explicit product-owner decisions |
| [`docs/SOURCES.md`](docs/SOURCES.md) | source links and research register |
| [`docs/CLAIM_REGISTER.md`](docs/CLAIM_REGISTER.md) | evidence grade and implementation status |

## Implementation

| Area | Entry |
|---|---|
| Schemas | [`contracts/README.md`](contracts/README.md) |
| Fixtures | [`fixtures/`](fixtures/) |
| Work tree | [`worktree/BACKLOG.md`](worktree/BACKLOG.md) and [`worktree/CHECKLIST.md`](worktree/CHECKLIST.md) |
| Local agents | [`.claude/agents/`](.claude/agents/) |
| Local skills | [`.claude/skills/`](.claude/skills/) |
| Verification | [`scripts/verify.sh`](scripts/verify.sh) |

## Source context limitation

The actual `the-hybrid-engine1` source was not available while this package was created. All source-specific claims in `PROJECT_CONTEXT.md` are therefore labeled `provided` and must be verified in Phase 00.
