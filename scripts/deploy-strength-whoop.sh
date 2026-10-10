#!/usr/bin/env bash
# Deploy shared WHOOP data and explicit native return targets, keeping other functions intact.
set -euo pipefail
: "${SUPABASE_ACCESS_TOKEN:?Set SUPABASE_ACCESS_TOKEN securely in the environment}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REF="${SUPABASE_PROJECT_REF:-orysjncrksmdfabpuftd}"
CLI="${SUPABASE_CLI:-supabase}"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
mkdir -p "$STAGE/supabase/functions"
cp -R "$ROOT/supabase/functions/_shared" "$STAGE/supabase/functions/"
for name in whoop-sync whoop-connect whoop-callback strength-whoop-status strength-whoop-disconnect; do cp -R "$ROOT/supabase/functions/$name" "$STAGE/supabase/functions/"; done
cat > "$STAGE/supabase/config.toml" <<'CONFIG'
project_id = "strength-shared-whoop"
[functions.whoop-sync]
verify_jwt = true
[functions.whoop-connect]
verify_jwt = true
# These routes verify ES256/legacy user tokens with getUser in the handler.
[functions.strength-whoop-status]
verify_jwt = false
[functions.strength-whoop-disconnect]
verify_jwt = false
[functions.whoop-callback]
verify_jwt = false
CONFIG
cd "$STAGE"
# Publish callback before the client begins using the new return target.
read -r -a TARGETS <<< "${STRENGTH_WHOOP_TARGETS:-strength-whoop-status strength-whoop-disconnect whoop-callback whoop-connect whoop-sync}"
for name in "${TARGETS[@]}"; do
  case "$name" in strength-whoop-status|strength-whoop-disconnect|whoop-callback|whoop-connect|whoop-sync) ;; *) echo "Unsupported WHOOP deployment target" >&2; exit 1 ;; esac
  "$CLI" functions deploy "$name" --project-ref "$REF" --use-api
done
