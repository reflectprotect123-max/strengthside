# Claude skills and plugins — the canonical record

**This file is the single record of every Claude skill and plugin this project
depends on. `scripts/ensure-skills.sh` is its executable half.**

## The standing contract

The dev container is ephemeral. `~/.claude/skills/` — user scope — dies with
it, and everything that was ever installed there dies with it. The repo
survives. That asymmetry is the whole reason this file exists, and it
produces one rule:

> **Every session checks this file. Anything dead gets restored.** Run
> `bash scripts/ensure-skills.sh` at the start of a session in a fresh
> container. It is idempotent — a healthy install is never touched — so
> running it when nothing is wrong costs one screen of `OK` lines.

And one obligation on whoever installs the next thing:

> **A skill that is installed but not written down here does not survive.**
> It works until the container is recycled and then it silently is not
> there, and the next session has no way to know it ever was. Add the row in
> the same commit that does the install.

## Why `vendor/…` and not `.claude/…` directly

The hybrid repo (`THE-HYBRID-ENGINE1`, where this inventory was brought over
from) commits straight to `.claude/skills/` (plus `.claude/agents/`,
`.claude/commands/`, `.claude/hooks/`), which is simpler and correct when you
can `git push`. This repo cannot always be reached that way: GitHub's **web
uploader silently skips every path beginning with a dot** — no error, the
files just never arrive. This repository already lost its `.gitignore` and
its whole `.github/workflows/` directory to exactly that, on the upload that
created it, and nobody noticed until CI never ran.

So the durable copy sits at a visible path (`vendor/…`) that survives any
transfer method, and `scripts/ensure-skills.sh` materialises the
dot-directories locally, where dots are not a problem. `.claude/…` is
generated and gitignored; `vendor/…` is the source of truth.

The inventory is split into two buckets, and which bucket something is in is
a statement about what it needs, not about how important it is.

- **VENDORED** — markdown and data only, no toolchain. Copied into
  `vendor/…`, committed, and materialised into `.claude/…` by the script.
- **INSTALLED** — needs a real toolchain and cannot be vendored. Copying its
  files into the repo would produce something that LOOKS installed and does
  not work.

---

## VENDORED — committed to this repo at `vendor/…`

27 skill directories under `vendor/skills/`, plus 3 subagents under
`vendor/agents/` and 5 commands (`.md` + `.toml` each) under
`vendor/commands/`, plus 4 hook source files under `vendor/hooks/`.
`.gitignore` excludes `.claude/skills/`, `.claude/agents/`,
`.claude/commands/` and `.claude/hooks/` — those are the generated copies.

**Verify path for the whole bucket:** the `.claude/…` directory exists in
the working tree and is non-empty. Restore is a plain `cp -r` from
`vendor/…`, run only when the destination is absent — a materialised skill
with local edits is never touched.

### superpowers v6.3.0 — 14 skills

| | |
|---|---|
| **What / why** | The disciplined-workflow family: TDD, systematic debugging, writing and executing plans, subagent-driven development, code review both directions, git worktrees, verification before completion. `CLAUDE.md`'s "Safe workflow" section is this house's version of the same idea; these skills are the general form. |
| **Source** | https://github.com/obra/superpowers |
| **Version** | v6.3.0, commit `b36e082` (12 August 2026) |
| **Install method** | VENDORED at `vendor/skills/`, materialised into `.claude/skills/` by `bash scripts/ensure-skills.sh`. |
| **Verify path** | `vendor/skills/using-superpowers/SKILL.md` (and the 13 siblings), then `.claude/skills/…` after the script runs |
| **Writes outside its own directory** | Nothing at install time. `brainstorming/scripts/start-server.sh` writes session state to `/tmp/brainstorm-*` at runtime, or under `<project>/.superpowers/brainstorm/` when passed `--project-dir`. |
| **Caveats** | The 14 skills cross-reference each other by name; all 14 must stay vendored together. **Newer than the hybrid repo's v6.2.0** (commit `44c9b2d`) — taken deliberately rather than mirrored, because two 6.3.0 changes (SDD controllers no longer stall on non-catastrophic plan conflicts; plans carry a `Spec:` pointer SDD reads at setup) bear directly on how Phase B gets built against a spec that lives in another repository. If the two repos should stay in lockstep, bump the hybrid side to 6.3.0 rather than pinning this one back. |
| **Removal** | `rm -rf .claude/skills/{brainstorming,dispatching-parallel-agents,executing-plans,finishing-a-development-branch,receiving-code-review,requesting-code-review,subagent-driven-development,systematic-debugging,test-driven-development,using-git-worktrees,using-superpowers,verification-before-completion,writing-plans,writing-skills}` |

### caveman — 7 skills + 3 agents + 5 commands

| | |
|---|---|
| **What / why** | Output-token compression. `caveman` is a terse output mode. `cavecrew` delegates to three caveman-style subagents so tool results injected back into the main thread are smaller. `caveman-commit` and `caveman-review` are the same idea aimed at commit messages and PR feedback. |
| **Source** | https://github.com/juliusbrussee/caveman (MIT) |
| **Version** | commit `ec83e5b`, carried over unchanged from the hybrid repo |
| **Install method** | VENDORED at `vendor/skills/`, **plus one hook** — see the hook row below |
| **Verify path** | `vendor/skills/caveman/SKILL.md`, `vendor/agents/cavecrew-{builder,investigator,reviewer}.md`, `vendor/commands/caveman*.{md,toml}`, and for the stats half, a `caveman-mode-tracker.js` entry under `UserPromptSubmit` in `~/.claude/settings.json` |
| **Writes outside its own directory** | Two things. `caveman-compress` overwrites its target file in place at runtime — see caveat. And `scripts/ensure-skills.sh` writes `~/.claude/hooks/` plus one `UserPromptSubmit` entry in `~/.claude/settings.json` — USER scope, never this repo's `.claude/settings.json` and never its CLAUDE.md. |
| **Caveats** | **(1)** `caveman-compress` **overwrites the target file in place** and names `CLAUDE.md` as a use case. Its backup goes OUT OF TREE to `$XDG_DATA_HOME/caveman-compress/backups/`, which dies with the container. Commit before pointing it at anything. **(2)** `compress.py` makes model calls (`ANTHROPIC_API_KEY` via the SDK, else `claude --print`). **(3)** The `caveman-stats` hook is registered — see below. |
| **The `caveman-stats` hook** | Its `SKILL.md` is a STUB: "the model does not need to do anything when this skill fires." The numbers come from `caveman-mode-tracker.js` on `UserPromptSubmit`, which shells out to `caveman-stats.js` and injects the block as context. Four hook files (`caveman-mode-tracker`, `caveman-stats`, `caveman-config`, `caveman-parse`) are committed under `vendor/hooks/`, copied to `~/.claude/hooks/` and registered as one `UserPromptSubmit` entry. **Deliberately NOT installed:** upstream's `caveman-activate.js` SessionStart hook (injects the full caveman ruleset into every session) and its statusline. **The tracker is inert until asked** — it acts only on a `/caveman*` command and only writes `~/.claude/.caveman-active`. Registration merges rather than overwrites and matches on command substring, so a re-run cannot stack a duplicate. |
| **Removal** | `rm -rf .claude/skills/{cavecrew,caveman,caveman-commit,caveman-compress,caveman-help,caveman-review,caveman-stats} .claude/agents/cavecrew-*.md .claude/commands/caveman* .claude/hooks` — then delete the `caveman-mode-tracker.js` entry from `~/.claude/settings.json` and `rm -rf ~/.claude/hooks`. |

### supabase-agent-skills v1.1.0 — 2 skills

| | |
|---|---|
| **What / why** | `supabase` covers the client libraries, auth and CLI; `supabase-postgres-best-practices` is reference material on schema, RLS, indexes and migrations. Directly relevant here — this repo's five migrations and its RLS on all twelve strength tables are exactly this territory, and `CLAUDE.md` forbids touching a migration casually. |
| **Source** | https://github.com/supabase/agent-skills |
| **Version** | v1.1.0, commit `1207767388a0ffb55f21fb4e6988fee96942431d` |
| **Install method** | VENDORED at `vendor/skills/` |
| **Verify path** | `vendor/skills/supabase/SKILL.md`, `vendor/skills/supabase-postgres-best-practices/SKILL.md` |
| **Writes outside its own directory** | Nothing. Zero executable scripts — pure markdown. |
| **Caveats** | None found. |
| **Removal** | `rm -rf .claude/skills/{supabase,supabase-postgres-best-practices}` |

### session-start-hook — 1 skill, shipped with the container image

| | |
|---|---|
| **What / why** | How to write a `SessionStart` hook so a repo can install dependencies and run tests in Claude Code on the web. |
| **Source** | The Claude Code on the web container image, carried over from the hybrid repo's record of it. |
| **Version** | None — the image ships no version for it. |
| **Install method** | VENDORED |
| **Verify path** | `vendor/skills/session-start-hook/SKILL.md` |
| **Writes outside its own directory** | Nothing. One markdown file, no scripts. |
| **Caveats** | No receipt, and none possible — `scripts/ensure-skills.sh` cannot restore it from a source URL, only from the vendored copy like every other entry in this bucket. |
| **Removal** | `rm -rf .claude/skills/session-start-hook` |

### Pre-existing in the hybrid repo — 3 skills

`frontend-design`, `install-skill`, `ui-ux-pro-max` — carried over from the
hybrid repo's own pre-existing bucket. `ui-ux-pro-max` carries a searchable
local database (styles, palettes, font pairings) and is the largest thing in
`vendor/skills/` (~1.9 MB).
Removal: `rm -rf .claude/skills/{frontend-design,install-skill,ui-ux-pro-max}`.

---

## INSTALLED — needs a real toolchain, cannot be vendored

### graphify v0.9.42 — NOT installed here

| | |
|---|---|
| **What / why** | Turns a codebase, docs or papers into a persistent knowledge graph with god nodes and community detection, then answers architecture questions against it. |
| **Source** | https://github.com/Graphify-Labs/graphify — PyPI package name is `graphifyy` |
| **Status here** | **Attempted and refused.** `uv tool install graphifyy==0.9.42` was blocked by this session's permission classifier as an unreviewed global package install. Not retried past that point — a human call, not a technical failure. `scripts/ensure-skills.sh` still carries the install recipe (`uv tool install graphifyy==0.9.42` then `graphify install`, user scope, never `--project`) so a session with the right permissions can complete it; until then this row stays honest about "documented, not present" rather than claiming otherwise. |
| **Verify path** | `command -v graphify` — absent as of this writing. |
| **Why it cannot be vendored** | The skill is a thin wrapper over a Python package that ships two binaries, `graphify` and `graphify-mcp`. Copying `SKILL.md` into the repo would vendor the instructions and none of the program. |

### claude-obsidian v2.1.0 — 15 skills

| | |
|---|---|
| **What / why** | The wiki/vault family: `wiki`, `wiki-ingest`, `wiki-query`, `wiki-retrieve`, `autoresearch`, `save`, `think`, `canvas`, and the Obsidian syntax helpers. Persistent knowledge outside the repo. |
| **Source** | https://github.com/AgriciDaniel/claude-obsidian |
| **Version** | v2.1.0, pinned at commit `1c1bc49` — verified on this machine, `git -C /root/claude-obsidian rev-parse --short HEAD` agrees |
| **Install method** | Full clone to `/root/claude-obsidian` (`PRODUCT_ROOT`, needs the full history because a shallow clone cannot reach an arbitrary pinned SHA), checked out at the pin, then 15 symlinks from `~/.claude/skills/<name>` into `$PRODUCT_ROOT/skills/<name>/` |
| **Verify path** | `/root/claude-obsidian/scripts/` exists, and each of the 15 symlinks resolves |
| **Why it cannot be vendored** | The skills call `$PRODUCT_ROOT/scripts/*.py` — 11 Python scripts including `bm25-index.py`, `rerank.py`, `retrieve.py`, `claude-obsidian.py`. The clone must stay put. |
| **Writes outside its own directory** | The entire `/root/claude-obsidian` tree; vault writes into whatever vault is selected; derived caches under the vault's `.vault-meta`. |
| **Caveats** | `wiki-retrieve`'s reranking can egress to a remote model and requires explicit consent per its own skill rules. |
| **Removal** | `rm -rf /root/claude-obsidian && rm -f ~/.claude/skills/{autoresearch,canvas,defuddle,obsidian-bases,obsidian-markdown,save,think,wiki,wiki-cli,wiki-fold,wiki-ingest,wiki-lint,wiki-mode,wiki-query,wiki-retrieve}` |

---

## NOT installed by this script, and why

### omniroute v3.8.49 — deliberately excluded

**Not brought over, and `scripts/ensure-skills.sh` should not be changed to.**
Per the hybrid repo's own record: not a Claude skill at all — a 3.3 GB npm
AI gateway (`omniroute`) that routes prompts to third-party providers. Not
something a session should pull down as a side effect of "restore the
toolchain," and connecting it is a decision for the repo owner, not a
script.

### `~/.claude/skills/synced/` — platform-managed, not ours

`docx`, `morning`, `pdf`, `pptx`, `skill-creator`, `xlsx` — synced by the
Claude platform, not installed by anyone working in this repo. Recorded here
so a future reader who counts more entries in `~/.claude/skills/` than this
file lists knows why.

---

## Inventory summary

| Bucket | Count | Survives a container recycle? |
|---|---|---|
| VENDORED skills | **27** directories: 14 superpowers + 7 caveman + 2 supabase + 1 session-start-hook + 3 pre-existing | Yes — committed at `vendor/skills/` |
| VENDORED agents / commands | 3 agents, 5 commands (`.md` + `.toml` each) | Yes — committed at `vendor/agents/`, `vendor/commands/` |
| VENDORED hook source | 4 files at `vendor/hooks/` — the `caveman-stats` tracker and its deps | Source yes — committed. The user-scope install of it does not; the script re-does it. |
| INSTALLED | **1 of 2 live** — claude-obsidian yes, graphify no (blocked, see above) | No — `scripts/ensure-skills.sh` attempts to restore both |
| Hooks registered in `~/.claude/settings.json` | **1** — `UserPromptSubmit` → `caveman-mode-tracker.js`. User scope only. | No — the script re-registers it |
| Deliberately excluded | 1 — omniroute | n/a |
| Platform-managed | 6 — `~/.claude/skills/synced/` | Handled by the platform, not by us |

The `VENDORED_SKILLS` array in `scripts/ensure-skills.sh` has 27 entries;
agents and commands are restored as whole directories rather than file by
file.
