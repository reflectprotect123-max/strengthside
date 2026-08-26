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

SEED_SRC="${TRAINHEROIC_SEED_FILE:-}"
if [[ -z "$SEED_SRC" && -f "$REPO/THE-trainheroic-import.json" ]]; then
  SEED_SRC="$REPO/THE-trainheroic-import.json"
fi
if [[ -n "$SEED_SRC" && -f "$SEED_SRC" ]]; then
  mkdir -p "$REPO/apps/mobile/preview-site/seeds"
  # Compact JSON (no pretty-print) — half the bytes, same data.
  node -e "
    const fs=require('fs');
    const src=process.argv[1];
    const site=process.argv[2];
    const raw=JSON.parse(fs.readFileSync(src,'utf8'));
    const compact=JSON.stringify(raw);
    fs.mkdirSync(site+'/seeds',{recursive:true});
    fs.writeFileSync(site+'/seeds/trainheroic-import.json', compact);
    const js='window.__TRAINHEROIC_SEED__='+compact+';\\n';
    fs.writeFileSync(site+'/seeds/trainheroic-import.js', js);
    fs.writeFileSync(site+'/trainheroic-import.js', js);
    console.log('upload-capgo-bundle: seed compact', compact.length, 'bytes (+ root + nested .js)');
  " "$SEED_SRC" "$REPO/apps/mobile/preview-site"
fi

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
