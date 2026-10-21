#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="$(cd "$ROOT/../../.." && pwd)"
: "${CAPGO_BUNDLE_VERSION:?Set a unique CAPGO_BUNDLE_VERSION}"
: "${CAPGO_TOKEN:?Provide CAPGO_TOKEN through secure environment settings}"
cd "$REPO"
RELEASE_VERSION="$(node -p "require('./apps/athlete/release.json').version")"
if [[ "$CAPGO_BUNDLE_VERSION" != "$RELEASE_VERSION" ]]; then echo "Capgo version must match release.json ($RELEASE_VERSION)" >&2; exit 1; fi
bash scripts/sync-athlete-app.sh
node apps/athlete/checks/capgo-live-update.smoke.mjs
cd "$ROOT"
if [[ ! -x node_modules/.bin/cap ]]; then npm ci --no-fund --no-audit; fi
npx --yes @capgo/cli@8.70.0 bundle upload com.hybrid.strength \
  --path www --channel strength-live --bundle "$CAPGO_BUNDLE_VERSION" \
  --min-update-version 1.3.0 --self-assign --fail-on-incompatible
