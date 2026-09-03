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
for f in nutrition-bundle.js nutrition-sync.js nutrition-ui.js session-chrome.js session-flow.js rest-overlay.js work-overlay.js log-columns.js exercise-load-profiles.js exercise-search-index.js exercise-search.js exercise-history-seed.js exercise-history-seed-apply.js; do
  if [[ -f "$SRC_DIR/$f" ]]; then
    cp "$SRC_DIR/$f" "$ROOT/$f"
    cp "$SRC_DIR/$f" "$ROOT/preview-site/$f"
  fi
done
# Coach workspace (same Netlify origin as athlete — shared Supabase auth storage)
# Parked 2026-09-03: coach.html is a static park page; remaining coach JS stays on disk but is unreachable.
for f in coach.html; do
  if [[ -f "$SRC_DIR/$f" ]]; then
    cp "$SRC_DIR/$f" "$ROOT/preview-site/$f"
  fi
done
# Park page + bridge stub also at mobile root (Capgo / local open)
if [[ -f "$SRC_DIR/coach.html" ]]; then
  cp "$SRC_DIR/coach.html" "$ROOT/coach.html"
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
