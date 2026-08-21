#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
SRC="$ROOT/prototype/hybrid-app/index.html"
cp "$SRC" "$ROOT/THE-Hybrid-App.html"
mkdir -p "$ROOT/preview-site"
cp "$SRC" "$ROOT/preview-site/index.html"
echo "Synced THE-Hybrid-App.html + preview-site/index.html"
