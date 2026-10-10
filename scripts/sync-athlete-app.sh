#!/usr/bin/env bash
# Build bundles and stage the athlete HTML app (strength repo deploy root).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
pnpm run check:shared-contracts
pnpm run build
node scripts/stage-athlete.mjs apps/mobile/capacitor/www
echo "Athlete app ready at apps/athlete/"
