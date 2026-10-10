#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="$(cd "$ROOT/../../.." && pwd)"
: "${CAPGO_BUNDLE_VERSION:?Set a unique CAPGO_BUNDLE_VERSION}"
: "${CAPGO_TOKEN:?Provide CAPGO_TOKEN through secure environment settings}"
cd "$REPO"
bash scripts/sync-athlete-app.sh
node apps/athlete/checks/capgo-live-update.smoke.mjs
cd "$ROOT"
if [[ ! -x node_modules/.bin/cap ]]; then npm ci --no-fund --no-audit; fi
npx --yes @capgo/cli@8.70.0 bundle upload com.hybrid.strength \
  --path ../../athlete --channel strength-live --bundle "$CAPGO_BUNDLE_VERSION" \
  --min-update-version 1.3.0 --self-assign --fail-on-incompatible
