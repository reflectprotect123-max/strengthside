#!/usr/bin/env bash
#
# ensure-skills.sh — restore the Claude toolchain this repo depends on.
#
# WHY THIS EXISTS
# ---------------
# The dev container is ephemeral. `~/.claude/skills/` — user scope — dies with
# it, and everything that was ever installed there dies with it too. The repo
# survives. So the durable answer is to keep as much of the toolchain as
# possible INSIDE the repo (vendored, committed, restored by a plain copy) and
# to keep a short, explicit, pinned recipe for the two things that cannot live
# there because they need a real toolchain rather than markdown.
#
# `skills.md` at the repo root is the canonical record of what those things
# are and why. This script is the executable half of it.
#
# WHY VENDORED CONTENT LIVES AT `vendor/…` AND NOT DIRECTLY IN `.claude/…`
# --------------------------------------------------------------------------
# The hybrid repo commits straight to `.claude/skills/` (plus `.claude/agents/`,
# `.claude/commands/`, `.claude/hooks/`), which is simpler and correct when you
# can `git push`. This repo cannot always be reached that way: GitHub's WEB
# uploader silently skips any path beginning with a dot — no error, the files
# just never arrive. This repository already lost its `.gitignore` and its
# whole `.github/workflows/` directory to exactly that, on the upload that
# created it, and nobody noticed until CI never ran.
#
# So the durable copy sits at a VISIBLE path (`vendor/…`) that survives any
# transfer method, and this script materialises the dot-directories locally,
# where dots are not a problem. `.claude/…` is generated and gitignored;
# `vendor/…` is the source of truth.
#
# CONTRACT
# --------
# - Idempotent. A healthy install is never touched, never reinstalled, never
#   overwritten. The second run of this script prints the same lines as the
#   first and changes nothing.
# - One status line per entry, so the output is readable at a glance rather
#   than a wall of package-manager noise.
# - Exit non-zero ONLY on a real failure — something was dead AND could not be
#   brought back. A skipped optional entry is not a failure.
#
# WHAT THIS SCRIPT DELIBERATELY DOES NOT DO
# -----------------------------------------
# - It never runs `graphify install --project`. That command writes PreToolUse
#   hooks into `.claude/settings.json` and appends a section to THIS REPO's
#   CLAUDE.md. Both are repo edits nobody asked for. User scope only.
# - It never installs omniroute. omniroute is not a Claude skill — it is a
#   multi-GB npm AI gateway that routes prompts to third-party providers. That
#   belongs in environment setup with a human deciding, not in a session's
#   restore script. See the "NOT installed by this script" section of
#   `skills.md`.
#
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENDOR="$ROOT/vendor"
USER_SKILLS="${HOME}/.claude/skills"
FAILURES=0

ok()   { printf '  OK      %-28s %s\n' "$1" "$2"; }
fixed(){ printf '  FIXED   %-28s %s\n' "$1" "$2"; }
warn() { printf '  SKIP    %-28s %s\n' "$1" "$2"; }
fail() { printf '  FAIL    %-28s %s\n' "$1" "$2"; FAILURES=$((FAILURES + 1)); }

# ---------------------------------------------------------------------------
# Bucket 1 — VENDORED
#
# Markdown/data-only skills, committed under `vendor/skills/` (plus the
# cavecrew agents and caveman commands under `vendor/agents/` and
# `vendor/commands/`, and the caveman-stats hook source under `vendor/hooks/`).
# These need NO install beyond a copy: Claude Code loads project-scope skills
# straight out of `.claude/…`, and a healthy `.claude/…` entry is never
# touched or overwritten — restore is additive only.
# ---------------------------------------------------------------------------
VENDORED_SKILLS=(
  # superpowers v6.3.0 — 14 skills, cross-referencing, must stay together.
  # Newer than the hybrid repo's v6.2.0 — see skills.md for why that was
  # taken deliberately rather than mirrored.
  brainstorming
  dispatching-parallel-agents
  executing-plans
  finishing-a-development-branch
  receiving-code-review
  requesting-code-review
  subagent-driven-development
  systematic-debugging
  test-driven-development
  using-git-worktrees
  using-superpowers
  verification-before-completion
  writing-plans
  writing-skills
  # caveman family — 7 skills (+ 3 agents + 5 commands below)
  cavecrew
  caveman
  caveman-commit
  caveman-compress
  caveman-help
  caveman-review
  caveman-stats
  # supabase-agent-skills v1.1.0
  supabase
  supabase-postgres-best-practices
  # shipped with the container image (also at /home/claude/.claude/skills/);
  # committed here for the same reason the hybrid repo committed it
  session-start-hook
  # pre-existing in the hybrid repo, carried over unchanged
  frontend-design
  install-skill
  ui-ux-pro-max
)

echo "Vendored skills (committed in this repo — restored from vendor/skills/)"
skills_restored=0 skills_ok=0 skills_failed=0
for name in "${VENDORED_SKILLS[@]}"; do
  src="$VENDOR/skills/$name"
  dest="$USER_SKILLS/$name"
  if [ ! -d "$src" ]; then
    fail "$name" "vendor/skills/$name is missing — nothing to restore"
    skills_failed=$((skills_failed + 1))
    continue
  fi
  if [ -f "$dest/SKILL.md" ]; then
    skills_ok=$((skills_ok + 1))
    continue
  fi
  mkdir -p "$USER_SKILLS"
  if cp -r "$src" "$USER_SKILLS/"; then
    skills_restored=$((skills_restored + 1))
  else
    fail "$name" "cp -r vendor/skills/$name failed"
    skills_failed=$((skills_failed + 1))
  fi
done
ok "skills" "${skills_ok} healthy, ${skills_restored} restored, ${skills_failed} failed ($((skills_ok + skills_restored))/${#VENDORED_SKILLS[@]})"
[ "$skills_failed" -eq 0 ] || FAILURES=$((FAILURES + 1))

# --- cavecrew agents + caveman commands -------------------------------------
CLAUDE_AGENTS="$ROOT/.claude/agents"
CLAUDE_COMMANDS="$ROOT/.claude/commands"

if [ -d "$VENDOR/agents" ] && [ -n "$(ls -A "$VENDOR/agents" 2>/dev/null)" ]; then
  mkdir -p "$CLAUDE_AGENTS"
  copied=0
  for f in "$VENDOR/agents"/*; do
    name="$(basename "$f")"
    if [ ! -f "$CLAUDE_AGENTS/$name" ]; then
      cp "$f" "$CLAUDE_AGENTS/$name" && copied=$((copied + 1))
    fi
  done
  if [ "$copied" -gt 0 ]; then fixed "agents" "restored ${copied} file(s) to .claude/agents/"
  else ok "agents" "3 cavecrew subagents present"; fi
else
  fail "agents" "vendor/agents is missing or empty"
fi

if [ -d "$VENDOR/commands" ] && [ -n "$(ls -A "$VENDOR/commands" 2>/dev/null)" ]; then
  mkdir -p "$CLAUDE_COMMANDS"
  copied=0
  for f in "$VENDOR/commands"/*; do
    name="$(basename "$f")"
    if [ ! -f "$CLAUDE_COMMANDS/$name" ]; then
      cp "$f" "$CLAUDE_COMMANDS/$name" && copied=$((copied + 1))
    fi
  done
  if [ "$copied" -gt 0 ]; then fixed "commands" "restored ${copied} file(s) to .claude/commands/"
  else ok "commands" "5 caveman commands present (.md + .toml each)"; fi
else
  fail "commands" "vendor/commands is missing or empty"
fi

# ---------------------------------------------------------------------------
# Bucket 2 — INSTALLED
#
# These cannot be vendored: they are not markdown, they are toolchains.
# Copying their files into the repo would produce something that looks
# installed and does not work.
# ---------------------------------------------------------------------------
echo
echo "Installed toolchains (ephemeral — reinstalled here when missing)"

# --- graphify v0.9.42 -------------------------------------------------------
GRAPHIFY_VERSION="0.9.42"
if command -v graphify >/dev/null 2>&1; then
  have="$(graphify --version 2>/dev/null | tr -d '\r' | awk '{print $NF}')"
  if [ -d "${USER_SKILLS}/graphify" ]; then
    ok "graphify" "${have:-unknown version} + user-scope SKILL.md"
  else
    if graphify install >/dev/null 2>&1 && [ -d "${USER_SKILLS}/graphify" ]; then
      fixed "graphify" "re-ran 'graphify install' (user scope)"
    else
      fail "graphify" "binary present but 'graphify install' did not restore the skill"
    fi
  fi
elif command -v uv >/dev/null 2>&1; then
  if uv tool install "graphifyy==${GRAPHIFY_VERSION}" >/dev/null 2>&1 \
     && command -v graphify >/dev/null 2>&1 \
     && graphify install >/dev/null 2>&1; then
    fixed "graphify" "uv tool install graphifyy==${GRAPHIFY_VERSION} + graphify install"
  else
    fail "graphify" "uv tool install graphifyy==${GRAPHIFY_VERSION} failed"
  fi
else
  warn "graphify" "uv not on PATH — install uv, then re-run this script"
fi

# --- claude-obsidian v2.1.0 -------------------------------------------------
OBSIDIAN_ROOT="/root/claude-obsidian"
OBSIDIAN_REPO="https://github.com/AgriciDaniel/claude-obsidian"
OBSIDIAN_PIN="1c1bc49"
OBSIDIAN_SKILLS=(autoresearch canvas defuddle obsidian-bases obsidian-markdown save think
                 wiki wiki-cli wiki-fold wiki-ingest wiki-lint wiki-mode wiki-query wiki-retrieve)

obsidian_link() {
  local made=0 s
  for s in "${OBSIDIAN_SKILLS[@]}"; do
    if [ ! -e "${USER_SKILLS}/${s}" ]; then
      rm -f "${USER_SKILLS}/${s}"
      ln -s "${OBSIDIAN_ROOT}/skills/${s}/" "${USER_SKILLS}/${s}" && made=$((made + 1))
    fi
  done
  echo "$made"
}

if [ -d "${OBSIDIAN_ROOT}/scripts" ]; then
  mkdir -p "$USER_SKILLS"
  made="$(obsidian_link)"
  at="$(git -C "$OBSIDIAN_ROOT" rev-parse --short HEAD 2>/dev/null || echo 'no .git')"
  if [ "$made" -gt 0 ]; then
    fixed "claude-obsidian" "relinked ${made} of ${#OBSIDIAN_SKILLS[@]} skills (at ${at})"
  elif [ "$at" = "$OBSIDIAN_PIN" ]; then
    ok "claude-obsidian" "${#OBSIDIAN_SKILLS[@]} symlinks, pinned at ${at}"
  else
    warn "claude-obsidian" "${#OBSIDIAN_SKILLS[@]} symlinks, but HEAD is ${at}, not the pinned ${OBSIDIAN_PIN}"
  fi
elif command -v git >/dev/null 2>&1; then
  if git clone -q "$OBSIDIAN_REPO" "$OBSIDIAN_ROOT" >/dev/null 2>&1 \
     && git -C "$OBSIDIAN_ROOT" checkout -q "$OBSIDIAN_PIN" >/dev/null 2>&1 \
     && [ -d "${OBSIDIAN_ROOT}/scripts" ]; then
    mkdir -p "$USER_SKILLS"
    made="$(obsidian_link)"
    fixed "claude-obsidian" "cloned at ${OBSIDIAN_PIN}, linked ${made} skills"
  else
    fail "claude-obsidian" "clone of ${OBSIDIAN_REPO} at ${OBSIDIAN_PIN} failed — network, auth, or the pin is gone"
  fi
else
  warn "claude-obsidian" "git not on PATH"
fi

# --- caveman-stats hook -----------------------------------------------------
# `caveman-stats`'s SKILL.md is a STUB — the numbers come from
# `caveman-mode-tracker.js` on UserPromptSubmit, which shells out to
# `caveman-stats.js` and injects the block as context. Vendor the skill
# without the hook and it is a command that loads, runs, and reports nothing.
#
# USER scope only (`~/.claude/`). This repo's `.claude/settings.json` is never
# created or touched, and neither is its CLAUDE.md. ONE hook is registered —
# UserPromptSubmit → caveman-mode-tracker.js — never the upstream
# SessionStart/statusline extras. The tracker is inert until a `/caveman*`
# command is seen.
echo
echo "Hooks (user scope — required by a vendored skill that is a stub without them)"
HOOK_SRC="$VENDOR/hooks"
HOOK_DEST="${HOME}/.claude/hooks"
SETTINGS="${HOME}/.claude/settings.json"
HOOK_FILES=(caveman-mode-tracker.js caveman-stats.js caveman-config.js caveman-parse.js)

if ! command -v node >/dev/null 2>&1; then
  warn "caveman-stats hook" "node not on PATH — the hook cannot run, skipping"
elif [ ! -d "$HOOK_SRC" ]; then
  fail "caveman-stats hook" "${HOOK_SRC} is missing from the working tree"
else
  mkdir -p "$HOOK_DEST"
  copied=0
  for f in "${HOOK_FILES[@]}"; do
    if [ ! -f "${HOOK_DEST}/${f}" ] || ! cmp -s "${HOOK_SRC}/${f}" "${HOOK_DEST}/${f}"; then
      cp "${HOOK_SRC}/${f}" "${HOOK_DEST}/${f}" && copied=$((copied + 1))
    fi
  done
  chmod +x "${HOOK_DEST}"/*.js 2>/dev/null || true

  registered="$(node - "$SETTINGS" "${HOOK_DEST}/caveman-mode-tracker.js" <<'NODE' 2>/dev/null || echo error
const fs = require('fs');
const [file, cmdPath] = process.argv.slice(2);
const cmd = `node ${cmdPath}`;
let settings = {};
if (fs.existsSync(file)) {
  try { settings = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { process.stdout.write('unparseable'); process.exit(0); }
}
settings.hooks ??= {};
settings.hooks.UserPromptSubmit ??= [];
const already = settings.hooks.UserPromptSubmit.some((m) =>
  (m?.hooks ?? []).some((h) => typeof h?.command === 'string' && h.command.includes('caveman-mode-tracker.js')));
if (already) { process.stdout.write('present'); process.exit(0); }
settings.hooks.UserPromptSubmit.push({ hooks: [{ type: 'command', command: cmd }] });
fs.mkdirSync(require('path').dirname(file), { recursive: true });
fs.writeFileSync(file, JSON.stringify(settings, null, 2) + '\n');
process.stdout.write('added');
NODE
)"

  case "$registered" in
    present) if [ "$copied" -gt 0 ]; then fixed "caveman-stats hook" "refreshed ${copied} file(s), already registered"
             else ok "caveman-stats hook" "4 files + UserPromptSubmit entry in ${SETTINGS/#$HOME/\~}"; fi ;;
    added)   fixed "caveman-stats hook" "installed ${#HOOK_FILES[@]} files, registered UserPromptSubmit" ;;
    unparseable) fail "caveman-stats hook" "${SETTINGS} is not valid JSON — left untouched, register the hook by hand" ;;
    *)       fail "caveman-stats hook" "could not write ${SETTINGS}" ;;
  esac
fi

echo
if [ "$FAILURES" -gt 0 ]; then
  echo "${FAILURES} entr$( [ "$FAILURES" -eq 1 ] && echo y || echo ies ) could not be restored. See skills.md."
  exit 1
fi
echo "Toolchain complete. Canonical record: skills.md"
