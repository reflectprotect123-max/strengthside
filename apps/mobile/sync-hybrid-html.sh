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
# Session chrome + logger helpers (no product engines)
for f in adaptive-bundle.js session-chrome.js session-flow.js rest-overlay.js work-overlay.js exercise-history-seed.js exercise-history-seed-apply.js; do
  if [[ -f "$SRC_DIR/$f" ]]; then
    cp "$SRC_DIR/$f" "$ROOT/$f"
    cp "$SRC_DIR/$f" "$ROOT/preview-site/$f"
  fi
done
# Coach: parked page only
for f in coach.html; do
  if [[ -f "$SRC_DIR/$f" ]]; then
    cp "$SRC_DIR/$f" "$ROOT/preview-site/$f"
  fi
done
if [[ -f "$SRC_DIR/coach.html" ]]; then
  cp "$SRC_DIR/coach.html" "$ROOT/coach.html"
fi

# Concept2 + Echo FTMS + native
for f in concept2.js echo-ftms.js native-bridge.js native-ble.js; do
  if [[ -f "$SRC_DIR/$f" ]]; then
    cp "$SRC_DIR/$f" "$ROOT/$f"
    cp "$SRC_DIR/$f" "$ROOT/preview-site/$f"
  fi
done
# Integration Netlify proxies (WHOOP/Concept2 → hybrid1)
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
echo "Synced THE-Hybrid-App.html + preview-site + service-worker.js + session chrome + concept2 + echo"
