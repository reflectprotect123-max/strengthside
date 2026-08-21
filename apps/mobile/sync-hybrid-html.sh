#!/usr/bin/env bash
# Keep double-click + preview copies identical after edits.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
SRC="$ROOT/prototype/hybrid-app/index.html"
DST="$ROOT/THE-Hybrid-App.html"
cp "$SRC" "$DST"
echo "Synced → THE-Hybrid-App.html ($(wc -c < "$DST") bytes)"
