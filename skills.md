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

### graphify v0.9.42

| | |
|---|---|
| **What / why** | Turns a codebase, docs or papers into a persistent knowledge graph with god nodes and community detection, then answers architecture questions against it. |
| **Source** | https://github.com/Graphify-Labs/graphify — PyPI package name is `graphifyy` (three y's; the CLI is `graphify`, the package is not) |
| **Version** | v0.9.42 |
| **Install method** | `uv tool install graphifyy==0.9.42` then `graphify install` — **user scope, no `--project`**. First attempt was blocked by this session's permission classifier as an unreviewed global package install; installed on explicit user instruction to proceed. |
| **Verify path** | `command -v graphify` (the BINARY is the real verify path — its `SKILL.md` is nothing but instructions for driving the CLI). Secondary: `~/.claude/skills/graphify/SKILL.md`. |
| **Why it cannot be vendored** | The skill is a thin wrapper over a Python package that ships two binaries, `graphify` and `graphify-mcp`. Copying `SKILL.md` into the repo would vendor the instructions and none of the program. |
| **Writes outside its own directory** | `~/.claude/CLAUDE.md` — 3 lines, skill registration only. `~/.local/bin/{graphify,graphify-mcp}` via uv. Its analysis output goes to `graphify-out/` in whatever project it is pointed at. |
| **Caveats** | **`graphify install --project` must NOT be run.** It registers PreToolUse hooks in `.claude/settings.json` AND appends a section to THIS REPO's `CLAUDE.md` — two repo edits nobody asked for, on the file that is this project's operating contract. User scope only. `scripts/ensure-skills.sh` enforces this by never passing the flag. |
| **Removal** | `rm -rf ~/.claude/skills/graphify ~/.claude/CLAUDE.md && uv tool uninstall graphifyy` |

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
| INSTALLED | **2** — graphify, claude-obsidian | No — `scripts/ensure-skills.sh` restores both |
| Hooks registered in `~/.claude/settings.json` | **1** — `UserPromptSubmit` → `caveman-mode-tracker.js`. User scope only. | No — the script re-registers it |
| Deliberately excluded | 1 — omniroute | n/a |
| Platform-managed | 6 — `~/.claude/skills/synced/` | Handled by the platform, not by us |
| Cursor (see below) | `.cursor/skills/` + Claude Mem hooks | Skills yes if committed; Mem worker/key **no** |

The `VENDORED_SKILLS` array in `scripts/ensure-skills.sh` has 27 entries;
agents and commands are restored as whole directories rather than file by
file.

---

## CURSOR — committed under `.cursor/` (21 August 2026)

Separate from the Claude Code `vendor/` → `.claude/` path above. These are
**Cursor agent skills and hooks**, installed for cloud/desktop Cursor sessions
working this repo. They live at visible repo paths and are committed on
`cursor/mobile-home-screen-2ff0`.

### Cursor skills (`.cursor/skills/`)

| Skill | Source | Notes |
|---|---|---|
| **superpowers (14 skills)** | Vendored at `vendor/skills/`, copied to `.cursor/skills/` | TDD, debugging, brainstorming, writing/executing plans, subagent-driven development, code review, git worktrees, verification. Run `bash scripts/ensure-skills.sh` for Claude Code (`.claude/skills/`). |
| `ui-ux-pro-max` | `npx ui-ux-pro-max-cli init --ai cursor` | Design intelligence + searchable data. Installer also dropped sibling skills: `banner-design`, `brand`, `design`, `design-system`, `slides`, `ui-styling`. |
| `frontend-design` | `npx skills add anthropics/skills --skill frontend-design` | Distinctive UI direction. Also mirrored under `.agents/skills/frontend-design`. |
| `caveman` | `npx skills add juliusbrussee/caveman@caveman` | Terse communication mode. Invoke `/caveman`; off with `stop caveman` / `normal mode`. |
| `mem-search` | `npx skills add thedotmack/claude-mem@mem-search` | Search Claude Mem DB across sessions. |

`skills-lock.json` at repo root records the skills CLI pins for
`frontend-design`, `caveman`, `mem-search`.

### Claude Mem (persistent memory) — INSTALLED, not fully vendored

| | |
|---|---|
| **What / why** | Cross-session memory for Cursor: hooks capture shell/MCP/file edits; worker summarizes; context injects via `.cursor/rules/claude-mem-context.mdc`. |
| **Source** | https://github.com/thedotmack/claude-mem |
| **Built tree** | `/home/ubuntu/claude-mem` (clone + `bun install` + `bun run build`) — **outside the repo**, dies with the machine unless rebuilt. |
| **Committed in repo** | `.cursor/hooks.json` (project hooks pointing at that worker path), `.cursor/rules/claude-mem-context.mdc`, `.cursor/skills/mem-search/`. |
| **User-scope** | `~/.cursor/hooks.json`, settings at `~/.claude-mem/settings.json`. |
| **Provider** | Gemini (`CLAUDE_MEM_PROVIDER=gemini`). API key in `~/.claude-mem/settings.json` only — **never commit the key**. |
| **Worker** | `bun /home/ubuntu/claude-mem/plugin/scripts/worker-service.cjs start` — port 37700. Status: `… worker-service.cjs status`. Viewer often on 37777 when healthy. |
| **Caveats** | Vector search may report `uvx unavailable` until doctor/deps fixed. After container recycle: re-clone/build claude-mem, restore Gemini key, re-run worker; hooks JSON may need path rewrite if Bun/worker paths change. |
| **Removal** | Delete `.cursor/hooks.json`, `.cursor/rules/claude-mem-context.mdc`, stop worker, remove `~/.claude-mem` and `/home/ubuntu/claude-mem`. |

### Inventory addendum (Cursor)

| Bucket | Count | Survives recycle? |
|---|---|---|
| Cursor skills under `.cursor/skills/` | 24 directories (14 superpowers + ui-ux-pro-max suite + frontend-design + caveman + mem-search) | Yes if committed |
| Claude Mem hooks + context rule | project + user hooks | Project yes; user hooks + built tree + API key **no** |

## Rules of thumb

- Prefer the **smallest** skill that covers the job.
- Prefer **repo-local** skills (`.cursor/skills/` or materialised `.claude/skills/`) over global ones when both exist.
- Prefer **explicit** skill invocation over hoping the model “just knows.”
- Prefer **skills that produce artifacts** (code, docs, checklists) over skills that only produce opinions.
- Claude Code path: run `bash scripts/ensure-skills.sh` on a fresh container.
- Cursor path: skills under `.cursor/` travel with git; Claude Mem worker + Gemini key must be rebuilt/restored after recycle.
