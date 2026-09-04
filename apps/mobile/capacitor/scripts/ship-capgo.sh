#!/usr/bin/env bash
# Ship Hybrid HTML to Capgo dogfood + live. Fails hard without a token.
#
# Usage (repo root):
#   CAPGO_BUNDLE_VERSION=1.0.53 bash apps/mobile/capacitor/scripts/ship-capgo.sh
#
# Token: CAPGO_TOKEN env or repo-root .capgo (gitignored).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="$(cd "$ROOT/../../.." && pwd)"
VERSION="${CAPGO_BUNDLE_VERSION:-}"
APP_ID="${CAPGO_APP_ID:-com.hybrid.athlete}"
CHANNELS="${CAPGO_CHANNELS:-dogfood,live}"

if [[ -z "${CAPGO_TOKEN:-}" && -f "$REPO/.capgo" ]]; then
  CAPGO_TOKEN="$(cat "$REPO/.capgo")"
fi
if [[ -z "${CAPGO_TOKEN:-}" ]]; then
  echo "ship-capgo: FAIL — set CAPGO_TOKEN or create $REPO/.capgo" >&2
  exit 1
fi
if [[ -z "$VERSION" ]]; then
  echo "ship-capgo: FAIL — set CAPGO_BUNDLE_VERSION (e.g. 1.0.53)" >&2
  exit 1
fi

cd "$REPO"
bash apps/mobile/sync-hybrid-html.sh

cd "$ROOT"
if [[ ! -x node_modules/.bin/cap ]]; then
  npm install --no-fund --no-audit
fi

echo "ship-capgo: upload $VERSION → $APP_ID channels=$CHANNELS"
npx --yes @capgo/cli@latest bundle upload "$APP_ID" \
  --apikey "$CAPGO_TOKEN" \
  --path ../preview-site \
  --channel "$CHANNELS" \
  --bundle "$VERSION" \
  --comment "ship $VERSION"

echo "ship-capgo: pin live → $VERSION"
npx --yes @capgo/cli@latest channel set live "$APP_ID" \
  --apikey "$CAPGO_TOKEN" \
  --bundle "$VERSION"

echo "ship-capgo: pin dogfood → $VERSION"
npx --yes @capgo/cli@latest channel set dogfood "$APP_ID" \
  --apikey "$CAPGO_TOKEN" \
  --bundle "$VERSION"

echo "ship-capgo: done ($VERSION on $CHANNELS)."
