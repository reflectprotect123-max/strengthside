#!/usr/bin/env bash
# Deploy official WHOOP Edge functions to shared project orysjncrksmdfabpuftd.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "deploy-whoop-edge: FAIL — set SUPABASE_ACCESS_TOKEN" >&2
  exit 1
fi

REF="${SUPABASE_PROJECT_REF:-orysjncrksmdfabpuftd}"
npx --yes supabase functions deploy whoop-connect --project-ref "$REF"
npx --yes supabase functions deploy whoop-callback --project-ref "$REF" --no-verify-jwt
npx --yes supabase functions deploy whoop-sync --project-ref "$REF"
npx --yes supabase functions deploy integrations-disconnect --project-ref "$REF"
npx --yes supabase functions deploy integrations-status --project-ref "$REF"
echo "deploy-whoop-edge: done"
