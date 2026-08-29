#!/usr/bin/env bash
set -euo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_dir"

python3 scripts/validate_contracts.py

claude_lines="$(wc -l < CLAUDE.md)"
if [ "$claude_lines" -gt 200 ]; then
  echo "CLAUDE.md must stay under 200 lines (found $claude_lines)" >&2
  exit 1
fi

python3 -m compileall -q scripts
git diff --check

if rg -n --hidden --glob '!.git/**' --glob '!*.pyc' --glob '!scripts/verify.sh' '(sk-[A-Za-z0-9]{20,}|whsec_[A-Za-z0-9]{16,}|SUPABASE_SERVICE_ROLE_KEY=|WHOOP_CLIENT_SECRET=)' .; then
  echo "possible secret pattern found" >&2
  exit 1
fi

for required_file in README.md CLAUDE.md HANDOFF_TO_CLAUDE_CODE.md PROJECT_CONTEXT.md WORKTREE.md docs/SOURCES.md docs/CLAIM_REGISTER.md worktree/BACKLOG.md; do
  test -s "$required_file" || { echo "missing or empty $required_file" >&2; exit 1; }
done

echo "fitness-ecosystem-research verification passed"
