#!/usr/bin/env bash
# Optional: upload the synced Hybrid HTML bundle to Capgo (dogfood channel).
#
# Safe defaults:
# - No CAPGO_TOKEN → try repo-root .capgo, else exit 0 with skip message.
# - Does not change Netlify or HTML source paths.
#
# Usage (from repo root):
#   export CAPGO_TOKEN=...          # Capgo API key (never commit)
#   bash apps/mobile/capacitor/scripts/upload-capgo-bundle.sh
#   # optional: CAPGO_CHANNEL=dogfood  CAPGO_BUNDLE_VERSION=1.0.1
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="$(cd "$ROOT/../../.." && pwd)"
CHANNEL="${CAPGO_CHANNEL:-dogfood}"
VERSION="${CAPGO_BUNDLE_VERSION:-}"

if [[ -z "${CAPGO_TOKEN:-}" && -f "$REPO/.capgo" ]]; then
  CAPGO_TOKEN="$(cat "$REPO/.capgo")"
fi

if [[ -z "${CAPGO_TOKEN:-}" ]]; then
  echo "upload-capgo-bundle: skip (CAPGO_TOKEN unset and no $REPO/.capgo). Bundled APK / Netlify unchanged."
  exit 0
fi

cd "$REPO"
bash apps/mobile/sync-hybrid-html.sh

cd "$ROOT"

if [[ ! -x node_modules/.bin/cap ]]; then
  npm install --no-fund --no-audit
fi

echo "upload-capgo-bundle: uploading preview-site → channel=$CHANNEL"
npx --yes @capgo/cli@latest bundle upload com.hybrid.athlete \
  --apikey "$CAPGO_TOKEN" \
  --path ../preview-site \
  --channel "$CHANNEL" \
  ${VERSION:+--bundle "$VERSION"} \
  ${VERSION:+--comment "bundle $VERSION"}
echo "upload-capgo-bundle: done."
