#!/usr/bin/env bash
# Deploy only the WHOOP history sync function; preserve existing OAuth endpoints.
set -euo pipefail
: "${SUPABASE_ACCESS_TOKEN:?Set SUPABASE_ACCESS_TOKEN securely in the environment}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REF="${SUPABASE_PROJECT_REF:-orysjncrksmdfabpuftd}"
CLI="${SUPABASE_CLI:-supabase}"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
mkdir -p "$STAGE/supabase/functions"
cp -R "$ROOT/supabase/functions/_shared" "$STAGE/supabase/functions/"
cp -R "$ROOT/supabase/functions/whoop-sync" "$STAGE/supabase/functions/"
# The legacy repository config includes a functions.enabled boolean that the
# pinned CLI cannot parse. Use a minimal config for this isolated deployment.
cat > "$STAGE/supabase/config.toml" <<'CONFIG'
project_id = "strengthside-whoop-sync"
[functions.whoop-sync]
verify_jwt = true
CONFIG
cd "$STAGE"
"$CLI" functions deploy whoop-sync --project-ref "$REF" --use-api
