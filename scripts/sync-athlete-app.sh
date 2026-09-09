#!/usr/bin/env bash
# Build bundles and stage the athlete HTML app (strength repo deploy root).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
pnpm run build
echo "Athlete app ready at apps/athlete/"
