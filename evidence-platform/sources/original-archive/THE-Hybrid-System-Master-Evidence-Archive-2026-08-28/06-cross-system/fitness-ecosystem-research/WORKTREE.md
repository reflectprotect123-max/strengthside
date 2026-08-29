# Git work-tree plan

The `worktree/` directory is the human-readable task tree. Git worktrees are the isolated working directories Claude should use when implementing against the real application repository.

## Branch map

| Phase | Branch | Suggested worktree directory | Owner of changes |
|---|---|---|---|
| 00 | `phase/00-baseline-audit` | `../fitness-ecosystem-baseline` | audit report only |
| 01 | `phase/01-contracts-and-sync` | `../fitness-ecosystem-contracts` | shared-core, events, sync boundary |
| 02 | `phase/02-whole-athlete-state` | `../fitness-ecosystem-state` | state inputs, derived state, adapter |
| 03 | `phase/03-package-split` | `../fitness-ecosystem-package-split` | engine packages and storage partition |
| 04 | `phase/04-conditioning-canary` | `../fitness-ecosystem-conditioning` | private conditioning app |
| 05 | `phase/05-strength-migration` | `../fitness-ecosystem-strength` | strength app migration |
| 06 | `phase/06-coordinator-simulation` | `../fitness-ecosystem-coordinator` | planning contracts and historical simulation |
| 07 | `phase/07-production-hardening` | `../fitness-ecosystem-release` | security, migration, release gates |

## Commands

Run these from the parent directory of the target Git repository:

```bash
git worktree add ../fitness-ecosystem-baseline -b phase/00-baseline-audit
cd ../fitness-ecosystem-baseline
claude

git worktree list
git -C ../fitness-ecosystem-baseline status --short
git worktree remove ../fitness-ecosystem-baseline
```

Do not remove a worktree with uncommitted changes. Review `git status`, commit or stash intentionally, and record the decision in the phase handoff first. For Claude-managed worktrees, see the official Claude Code worktree documentation; the project-level `.claude/worktrees/` directory is ignored here because it is local state.

## Conflict ownership

- Contract files and migrations have one owner at a time.
- UI work may proceed in parallel only after the contract version is frozen.
- No phase may rewrite historical fixtures to hide a regression.
- A failed migration rehearsal blocks app-split release even if unit tests pass.
