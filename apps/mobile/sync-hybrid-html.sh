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
# Nutrition (local-first MacroTrack core + engine bundle + UI)
for f in nutrition-bundle.js nutrition-ui.js; do
  if [[ -f "$SRC_DIR/$f" ]]; then
    cp "$SRC_DIR/$f" "$ROOT/$f"
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
for f in concept2.js echo-ftms.js; do
  if [[ -f "$SRC_DIR/$f" ]]; then
    cp "$SRC_DIR/$f" "$ROOT/$f"
    cp "$SRC_DIR/$f" "$ROOT/preview-site/$f"
  fi
done
# Concept2 Netlify proxies (preview-site deploy)
if [[ -d "$SRC_DIR/netlify/functions" ]]; then
  mkdir -p "$ROOT/preview-site/netlify/functions"
  cp -f "$SRC_DIR"/netlify/functions/concept2-*.mjs "$ROOT/preview-site/netlify/functions/" 2>/dev/null || true
  cp -f "$SRC_DIR"/netlify/functions/concept2-*.mjs "$ROOT/prototype/hybrid-app/netlify/functions/" 2>/dev/null || true
fi
echo "Synced THE-Hybrid-App.html + preview-site + service-worker.js + nutrition + engine + concept2 + echo"
