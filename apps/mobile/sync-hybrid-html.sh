#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
SRC_DIR="$ROOT/prototype/hybrid-app"
SRC="$SRC_DIR/index.html"
SW="$SRC_DIR/service-worker.js"
cp "$SRC" "$ROOT/THE-Hybrid-App.html"
cp "$SW" "$ROOT/service-worker.js"
cp "$SRC_DIR/whoop.js" "$ROOT/whoop.js"
cp "$SRC_DIR/whoop.js" "$ROOT/preview-site/whoop.js"
mkdir -p "$ROOT/preview-site"
cp "$SRC" "$ROOT/preview-site/index.html"
cp "$SW" "$ROOT/preview-site/service-worker.js"
# Nutrition (local-first MacroTrack core + engine bundle + UI + cloud sync)
for f in nutrition-bundle.js nutrition-sync.js nutrition-ui.js strength-bundle.js recovery-engine.js recovery-signals.js recovery-prescription.js strength-adapter.js strength-one-set-logger.js cond-interval-autoreg.js coach-ai.js strength-ai.js big-mac-contract.js big-mac-product-engines.js big-mac-decide-shim.js big-mac-bridge.js log-columns.js load-headline.js coordinator-adapter.js strength-sync.js coach-sync.js coach-cloud.js; do
  if [[ -f "$SRC_DIR/$f" ]]; then
    cp "$SRC_DIR/$f" "$ROOT/$f"
    cp "$SRC_DIR/$f" "$ROOT/preview-site/$f"
  fi
done
# Coach workspace (same Netlify origin as athlete — shared Supabase auth storage)
for f in coach.html coach-loop.js coach-nutrition.js coach-bridge.js coach-views.js; do
  if [[ -f "$SRC_DIR/$f" ]]; then
    cp "$SRC_DIR/$f" "$ROOT/preview-site/$f"
  fi
done
# Conditioning engine bundle (window.HybridEngine) + adapter
if [[ -f "$SRC_DIR/engine-bundle.js" ]]; then
  cp "$SRC_DIR/engine-bundle.js" "$ROOT/engine-bundle.js"
  cp "$SRC_DIR/engine-bundle.js" "$ROOT/preview-site/engine-bundle.js"
fi
if [[ -f "$SRC_DIR/engine-adapter.js" ]]; then
  cp "$SRC_DIR/engine-adapter.js" "$ROOT/engine-adapter.js"
  cp "$SRC_DIR/engine-adapter.js" "$ROOT/preview-site/engine-adapter.js"
fi
# Concept2 + Echo FTMS
for f in concept2.js echo-ftms.js native-bridge.js native-ble.js label-scan.js label-scan-live.js food-catalog.js food-catalog-au.json; do
  if [[ -f "$SRC_DIR/$f" ]]; then
    cp "$SRC_DIR/$f" "$ROOT/$f"
    cp "$SRC_DIR/$f" "$ROOT/preview-site/$f"
  fi
done
# Integration Netlify proxies (WHOOP/Concept2 → hybrid1) + off-proxy for nutrition
if [[ -d "$SRC_DIR/netlify/functions" ]]; then
  mkdir -p "$ROOT/preview-site/netlify/functions"
  rm -rf "$ROOT/preview-site/netlify/functions"
  cp -a "$SRC_DIR/netlify/functions" "$ROOT/preview-site/netlify/functions"
fi
if [[ -f "$SRC_DIR/netlify.toml" ]]; then
  cp -f "$SRC_DIR/netlify.toml" "$ROOT/preview-site/netlify.toml"
fi
if [[ -f "$SRC_DIR/package.json" ]]; then
  cp -f "$SRC_DIR/package.json" "$ROOT/preview-site/package.json"
fi
if [[ -f "$SRC_DIR/.netlifyignore" ]]; then
  cp -f "$SRC_DIR/.netlifyignore" "$ROOT/preview-site/.netlifyignore"
fi
echo "Synced THE-Hybrid-App.html + preview-site + service-worker.js + nutrition + engine + concept2 + echo"
