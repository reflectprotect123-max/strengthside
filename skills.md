# Skill toolchain — TheStrengthEngine

The single canonical record of every Claude skill and plugin this repository
depends on. Same rule as `THE-HYBRID-ENGINE1`'s `skills.md`, and for the same
reason: `~/.claude/skills/` is user scope and dies with the container, the repo
does not.

**A skill installed without a row here does not survive. Add the row in the same
commit that does the install.**

**Why `vendor/skills/` and not `.claude/skills/` directly.** The hybrid repo commits
straight to the dot-directory, which is simpler and correct when you can `git push`.
This repo cannot always be reached that way, and GitHub's **web uploader silently
skips every path beginning with a dot** — no error, the files just never arrive.
That is not hypothetical: this repository lost its `.gitignore` and its whole
`.github/workflows/` directory to exactly that, on the upload that created it, and
nobody noticed until CI never ran. So the durable copy sits at a visible path that
survives any transfer method, and `scripts/ensure-skills.sh` materialises the
dot-directory locally, where dots are not a problem. `.claude/skills/` is generated
and gitignored; `vendor/` is the source of truth.

---

### superpowers v6.3.0 — 14 skills

| | |
|---|---|
| **What / why** | The disciplined-workflow family: TDD, systematic debugging, writing and executing plans, subagent-driven development, code review both directions, git worktrees, verification before completion. `CLAUDE.md`'s "Safe workflow" section is this house's version of the same idea; these skills are the general form. **Phase B's plan names `superpowers:subagent-driven-development` as a required sub-skill — without these vendored, that instruction dangles.** |
| **Source** | https://github.com/obra/superpowers |
| **Version** | v6.3.0, commit `b36e082` (12 August 2026) |
| **Install method** | VENDORED at `vendor/skills/`, materialised into `.claude/skills/` by `bash scripts/ensure-skills.sh`. **Run that after a fresh clone.** |
| **Verify path** | `vendor/skills/using-superpowers/SKILL.md` (and the 13 siblings), then `.claude/skills/…` after the script runs |
| **Writes outside its own directory** | Nothing at install time. `brainstorming/scripts/start-server.sh` writes session state to `/tmp/brainstorm-*` at runtime, or under `<project>/.superpowers/brainstorm/` when passed `--project-dir`. **Add that path to `.gitignore` if brainstorming's visual companion is ever used.** |
| **Caveats** | The 14 skills cross-reference each other by name; **all 14 must stay vendored together** or the references dangle. 9 executable files ship with them — 4 belong to brainstorming's optional visual companion (a Node server on 127.0.0.1 with token auth; opt-in, text-only is the default path), 3 are subagent-driven-development's workspace helpers (`task-brief`, `sdd-workspace`, `review-package`), plus `systematic-debugging/find-polluter.sh` and `writing-skills/render-graphs.js`. Re-checked at vendoring: every one resolves paths from its own `SCRIPT_DIR` or the caller's cwd, none reaches into the install location. That is why this family is vendorable at all. |
| **Removal** | `rm -rf .claude/skills/{brainstorming,dispatching-parallel-agents,executing-plans,finishing-a-development-branch,receiving-code-review,requesting-code-review,subagent-driven-development,systematic-debugging,test-driven-development,using-git-worktrees,using-superpowers,verification-before-completion,writing-plans,writing-skills}` |

**Version note.** The hybrid repo carries **v6.2.0** (commit `44c9b2d`). This one is
**v6.3.0**. They will drift, and that is survivable — but two changes in 6.3.0 bear
directly on how Phase B gets built, so the newer one was taken deliberately rather
than mirroring the hybrid copy:

- **SDD controllers no longer stall on plan conflicts.** Non-catastrophic
  ambiguities get a recorded ruling and work continues; only destructive or
  irreversible actions still stop for a human. Upstream reports a donated session
  that sat blocked for almost nine hours on a question the controller could have
  decided.
- **Plans carry a `Spec:` pointer**, and SDD reads the spec at setup — so a plan
  conflict is resolved against the design rather than guessed at. Phase B's plan
  has a source spec living in *another repository*; this is what makes that
  reference usable.

Also in 6.3.0: `finishing-a-development-branch` no longer reaches for
`git worktree remove --force` when a tree holds uncommitted work — it stops, names
the files, and asks. Worth having before anyone runs a worktree here.

**If the two repos should stay in lockstep**, bump the hybrid side to 6.3.0 rather
than pinning this one back — nothing in the release notes is a regression.
