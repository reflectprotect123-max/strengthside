#!/usr/bin/env bash
# Rebuild engine-bundle.js from engine-entry.ts (@hybrid/engine cond surface).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
npx --yes esbuild@0.25.0 engine-entry.ts \
  --bundle --format=iife --global-name=HybridEngine \
  --outfile=engine-bundle.js --platform=browser --target=es2020
echo "Wrote engine-bundle.js ($(wc -c < engine-bundle.js) bytes)"
