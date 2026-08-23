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
# Conditioning engine bundle (window.HybridEngine) — load-only until adapter
if [[ -f "$SRC_DIR/engine-bundle.js" ]]; then
  cp "$SRC_DIR/engine-bundle.js" "$ROOT/engine-bundle.js"
  cp "$SRC_DIR/engine-bundle.js" "$ROOT/preview-site/engine-bundle.js"
fi
echo "Synced THE-Hybrid-App.html + preview-site + service-worker.js + nutrition + engine-bundle"
