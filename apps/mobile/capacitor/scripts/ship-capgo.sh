#!/usr/bin/env bash
# Publish the new HTML app on its dedicated Capgo channel.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="$(cd "$ROOT/../../.." && pwd)"
VERSION="${CAPGO_BUNDLE_VERSION:?Set a unique CAPGO_BUNDLE_VERSION}"
APP_ID="${CAPGO_APP_ID:-com.hybrid.athlete}"
CHANNEL="${CAPGO_CHANNEL:-engine-html}"
CLI_VERSION="${CAPGO_CLI_VERSION:-8.70.0}"
if [[ -z "${CAPGO_TOKEN:-}" ]]; then
  bash "$REPO/scripts/rematerialize-capgo-from-vault.sh"
  CAPGO_TOKEN="$(cat "$REPO/.capgo")"
fi
: "${CAPGO_TOKEN:?Capgo credentials unavailable}"
cd "$ROOT"
if [[ ! -x node_modules/.bin/cap ]]; then
  npm ci --no-fund --no-audit
fi
cd "$REPO"
node scripts/conditioning/build.mjs
node apps/athlete/checks/capgo-live-update.smoke.mjs
# Package deployable files, excluding source.html and the old app assets.
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
cp "$REPO/apps/athlete/conditioning/index.html" "$STAGE/"
cp "$REPO/apps/athlete/conditioning/native-plugins.js" "$STAGE/"
cd "$ROOT"
npx --yes "@capgo/cli@$CLI_VERSION" bundle upload "$APP_ID" \
  --apikey "$CAPGO_TOKEN" --path "$STAGE" --channel "$CHANNEL" \
  --bundle "$VERSION" --comment "New HTML engine $VERSION" \
  --min-update-version 1.1.1 --self-assign --fail-on-incompatible
npx --yes "@capgo/cli@$CLI_VERSION" channel set "$CHANNEL" "$APP_ID" \
  --apikey "$CAPGO_TOKEN" --bundle "$VERSION" --state normal \
  --self-assign --no-ios --android --no-downgrade \
  --disable-auto-update metadata
echo "Published new HTML $VERSION on $CHANNEL."
