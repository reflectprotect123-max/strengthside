#!/usr/bin/env bash
#
# ensure-skills.sh — restore the Claude toolchain this repo depends on.
#
# WHY THIS EXISTS
# ---------------
# Same reason as THE-HYBRID-ENGINE1's copy: the dev container is ephemeral.
# `~/.claude/skills/` is user scope and dies with it. The repo survives. So the
# toolchain lives INSIDE the repo and is restored by running this.
#
# WHY THE SKILLS LIVE IN `vendor/skills/` AND NOT DIRECTLY IN `.claude/skills/`
# ----------------------------------------------------------------------------
# The hybrid repo commits them straight to `.claude/skills/`, which is simpler
# and is the better arrangement when you can push with git.
#
# This repo cannot always be reached that way. GitHub's WEB uploader silently
# skips any path beginning with a dot — no error, no warning, the files just
# do not arrive. That is not hypothetical: this repository lost its `.gitignore`
# and its entire `.github/workflows/` directory to exactly that, on the upload
# that created it, and nobody found out until CI never ran.
#
# So the durable copy sits at a VISIBLE path that survives every transfer
# method, and this script materialises the dot-directory locally, where dots
# are not a problem. `.claude/skills/` is generated and gitignored; `vendor/`
# is the source of truth.
#
# CONTRACT
# --------
# - Idempotent. A healthy install is never touched or overwritten. The second
#   run prints the same lines as the first and changes nothing.
# - One status line per skill, readable at a glance.
# - Exit non-zero ONLY on a real failure.
#
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/vendor/skills"
DEST="$ROOT/.claude/skills"

[ -d "$SRC" ] || { echo "FAIL  vendor/skills is missing — nothing to restore."; exit 1; }

mkdir -p "$DEST"
fail=0 restored=0 ok=0

for dir in "$SRC"/*/; do
  name="$(basename "$dir")"
  if [ -f "$DEST/$name/SKILL.md" ]; then
    printf '  ok       %s\n' "$name"; ok=$((ok+1)); continue
  fi
  if cp -r "$dir" "$DEST/"; then
    printf '  restored %s\n' "$name"; restored=$((restored+1))
  else
    printf '  FAIL     %s\n' "$name"; fail=$((fail+1))
  fi
done

# The 14 cross-reference each other by name; a partial restore dangles those
# references silently, which is worse than an empty directory.
count=$(find "$DEST" -maxdepth 2 -name SKILL.md | wc -l | tr -d ' ')
expected=$(find "$SRC" -maxdepth 2 -name SKILL.md | wc -l | tr -d ' ')
if [ "$count" != "$expected" ]; then
  echo "FAIL  expected $expected skills, found $count. They cross-reference by name — a partial set dangles."
  fail=$((fail+1))
fi

echo "  ---      $ok healthy, $restored restored, $fail failed  ($count skills)"
[ "$fail" -eq 0 ] || exit 1
