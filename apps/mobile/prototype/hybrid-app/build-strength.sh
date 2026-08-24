#!/usr/bin/env bash
# Rebuild strength-bundle.js from strength-entry.ts (@hybrid/strength-engine volume surface).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
npx --yes esbuild@0.25.0 strength-entry.ts \
  --bundle --format=iife --global-name=HybridStrength \
  --outfile=strength-bundle.js --platform=browser --target=es2020
echo "Wrote strength-bundle.js ($(wc -c < strength-bundle.js) bytes)"
