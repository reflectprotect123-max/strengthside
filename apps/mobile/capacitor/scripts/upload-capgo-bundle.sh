#!/usr/bin/env bash
# Optional: upload the synced Hybrid HTML bundle to Capgo (dogfood channel).
#
# Safe defaults:
# - No CAPGO_TOKEN → exits 0 with a skip message (CI / local builds stay green).
# - Does not change Netlify, bundled APK assets, or product code paths.
# - Capgo autoUpdate stays false in capacitor.config.json until you opt in.
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

if [[ -z "${CAPGO_TOKEN:-}" ]]; then
  echo "upload-capgo-bundle: skip (CAPGO_TOKEN unset). Bundled APK / Netlify unchanged."
  exit 0
fi

cd "$REPO"
bash apps/mobile/sync-hybrid-html.sh
cd "$ROOT"

if [[ ! -x node_modules/.bin/cap ]]; then
  npm install --no-fund --no-audit
fi

ARGS=(bundle upload --channel "$CHANNEL" --path ../preview-site)
if [[ -n "$VERSION" ]]; then
  ARGS+=(--bundle "$VERSION")
fi

echo "upload-capgo-bundle: uploading preview-site → channel=$CHANNEL"
npx --yes @capgo/cli@latest "${ARGS[@]}"
echo "upload-capgo-bundle: done. Enable plugins.CapacitorUpdater.autoUpdate in capacitor.config.json after the Capgo-enabled APK is installed."
