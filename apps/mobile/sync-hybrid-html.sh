#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
SRC="$ROOT/prototype/hybrid-app/index.html"
SW="$ROOT/prototype/hybrid-app/service-worker.js"
cp "$SRC" "$ROOT/THE-Hybrid-App.html"
cp "$SW" "$ROOT/service-worker.js"
mkdir -p "$ROOT/preview-site"
cp "$SRC" "$ROOT/preview-site/index.html"
cp "$SW" "$ROOT/preview-site/service-worker.js"
echo "Synced THE-Hybrid-App.html + preview-site + service-worker.js"
