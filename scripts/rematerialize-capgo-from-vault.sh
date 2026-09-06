#!/usr/bin/env bash
# Rematerialize gitignored repo-root `.capgo` from handoff.md §0.5 Capgo vault.
#
# Priority:
#   1. CAPGO_TOKEN env (if set) → write .capgo
#   2. existing non-empty .capgo → leave alone
#   3. parse Capgo OTA Token UUID from handoff.md → write .capgo
#
# Cloud agents: run from env `start` (and ship scripts call this before upload).
set -euo pipefail
REPO="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$REPO/.capgo"
HANDOFF="$REPO/handoff.md"

write_token() {
  local token="$1"
  printf '%s\n' "$token" >"$OUT"
  chmod 600 "$OUT"
}

if [[ -n "${CAPGO_TOKEN:-}" ]]; then
  write_token "$CAPGO_TOKEN"
  echo "rematerialize-capgo: wrote .capgo from CAPGO_TOKEN"
  exit 0
fi

if [[ -f "$OUT" && -s "$OUT" ]]; then
  echo "rematerialize-capgo: .capgo already present"
  exit 0
fi

if [[ ! -f "$HANDOFF" ]]; then
  echo "rematerialize-capgo: FAIL — missing $HANDOFF" >&2
  exit 1
fi

TOKEN="$(
  python3 - "$HANDOFF" <<'PY'
import re, sys
path = sys.argv[1]
text = open(path, encoding="utf-8").read()
m = re.search(r"### Capgo OTA\n(.*?)(?:\n### |\n---|\Z)", text, re.S)
if not m:
    sys.stderr.write("rematerialize-capgo: FAIL — no ### Capgo OTA section in handoff\n")
    sys.exit(1)
sec = m.group(1)
tm = re.search(
    r"\|\s*Token\s*\|\s*`([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})`",
    sec,
    re.I,
)
if not tm:
    sys.stderr.write("rematerialize-capgo: FAIL — no Capgo Token UUID in vault table\n")
    sys.exit(1)
print(tm.group(1))
PY
)"

write_token "$TOKEN"
echo "rematerialize-capgo: wrote .capgo from handoff.md vault"
