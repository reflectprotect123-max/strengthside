#!/usr/bin/env bash
# Ship one split product HTML tree to Capgo. Does not touch com.hybrid.athlete.
#
#   PRODUCT=strength CAPGO_BUNDLE_VERSION=1.0.0 bash scripts/ship-product-capgo.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PRODUCT="${PRODUCT:-}"
VERSION="${CAPGO_BUNDLE_VERSION:-}"
CHANNELS="${CAPGO_CHANNELS:-dogfood,live}"

if [[ "$PRODUCT" != "strength" && "$PRODUCT" != "engine" ]]; then
  echo "ship-product-capgo: set PRODUCT=strength or PRODUCT=engine" >&2
  exit 1
fi
if [[ -z "$VERSION" ]]; then
  echo "ship-product-capgo: set CAPGO_BUNDLE_VERSION" >&2
  exit 1
fi

APP_ID="$(python3 -c "import json; print(json.load(open('$ROOT/scripts/hybrid-products.json'))['$PRODUCT']['appId'])")"
WWW="$ROOT/$(python3 -c "import json; print(json.load(open('$ROOT/scripts/hybrid-products.json'))['$PRODUCT']['dir'])")"
CAP="$WWW/capacitor"

bash "$ROOT/scripts/rematerialize-capgo-from-vault.sh"
if [[ -z "${CAPGO_TOKEN:-}" && -f "$ROOT/.capgo" ]]; then
  CAPGO_TOKEN="$(cat "$ROOT/.capgo")"
fi
if [[ -z "${CAPGO_TOKEN:-}" ]]; then
  echo "ship-product-capgo: FAIL — CAPGO_TOKEN / .capgo missing" >&2
  exit 1
fi
if [[ ! -d "$WWW" || ! -f "$WWW/index.html" ]]; then
  echo "ship-product-capgo: missing $WWW/index.html — run bash scripts/extract-hybrid-apps.sh" >&2
  exit 1
fi

cd "$CAP"
if [[ ! -d node_modules/@capgo/capacitor-updater ]]; then
  npm install --no-fund --no-audit
fi
echo "ship-product-capgo: upload $VERSION → $APP_ID from $WWW channels=$CHANNELS"
npx --yes @capgo/cli@latest bundle upload "$APP_ID" \
  --apikey "$CAPGO_TOKEN" \
  --path "$WWW" \
  --channel "$CHANNELS" \
  --bundle "$VERSION" \
  --comment "ship $PRODUCT $VERSION"

IFS=',' read -ra CH_ARR <<< "$CHANNELS"
for ch in "${CH_ARR[@]}"; do
  ch="$(echo "$ch" | tr -d ' ')"
  [[ -z "$ch" ]] && continue
  echo "ship-product-capgo: pin $ch → $VERSION"
  npx --yes @capgo/cli@latest channel set "$ch" "$APP_ID" \
    --apikey "$CAPGO_TOKEN" \
    --bundle "$VERSION" || true
done

echo "ship-product-capgo: done ($PRODUCT $VERSION)."
