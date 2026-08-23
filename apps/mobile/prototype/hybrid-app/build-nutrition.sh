#!/usr/bin/env bash
# Rebuild nutrition-bundle.js from nutrition-entry.ts (nutrition-core + nutrition-engine).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
npx --yes esbuild@0.25.0 nutrition-entry.ts \
  --bundle --format=iife --global-name=HybridNutrition \
  --outfile=nutrition-bundle.js --platform=browser --target=es2020
echo "Wrote nutrition-bundle.js ($(wc -c < nutrition-bundle.js) bytes)"
