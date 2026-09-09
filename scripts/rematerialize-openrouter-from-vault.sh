#!/usr/bin/env bash
# Rematerialize gitignored repo-root `.openrouter` from handoff.md §0.5 OpenRouter vault.
#
# Priority:
#   1. OPENROUTER_API_KEY env (if set) → write .openrouter
#   2. existing non-empty .openrouter → leave alone
#   3. parse base64 key from handoff.md → write .openrouter
set -euo pipefail
REPO="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$REPO/.openrouter"
HANDOFF="$REPO/handoff.md"

write_key() {
  local key="$1"
  printf '%s\n' "$key" >"$OUT"
  chmod 600 "$OUT"
}

if [[ -n "${OPENROUTER_API_KEY:-}" ]]; then
  write_key "$OPENROUTER_API_KEY"
  echo "rematerialize-openrouter: wrote .openrouter from OPENROUTER_API_KEY"
  exit 0
fi

if [[ -f "$OUT" && -s "$OUT" ]]; then
  echo "rematerialize-openrouter: .openrouter already present"
  exit 0
fi

if [[ ! -f "$HANDOFF" ]]; then
  echo "rematerialize-openrouter: FAIL — missing $HANDOFF" >&2
  exit 1
fi

KEY="$(
  python3 - "$HANDOFF" <<'PY'
import base64, re, sys
path = sys.argv[1]
text = open(path, encoding="utf-8").read()
m = re.search(r"### OpenRouter[^\n]*\n(.*?)(?:\n### |\n---|\Z)", text, re.S)
if not m:
    sys.stderr.write("rematerialize-openrouter: FAIL — no ### OpenRouter section in handoff\n")
    sys.exit(1)
sec = m.group(1)
bm = re.search(r"\|\s*Key \(base64\)\s*\|\s*`([^`]+)`", sec)
if not bm:
    sys.stderr.write("rematerialize-openrouter: FAIL — no Key (base64) in vault table\n")
    sys.exit(1)
raw = base64.b64decode(bm.group(1)).decode("utf-8").strip()
if not raw.startswith("sk-or-"):
    sys.stderr.write("rematerialize-openrouter: FAIL — decoded key does not look like OpenRouter\n")
    sys.exit(1)
print(raw)
PY
)"

write_key "$KEY"
echo "rematerialize-openrouter: wrote .openrouter from handoff.md vault"
