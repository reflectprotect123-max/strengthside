#!/usr/bin/env bash
# Deploy root for Netlify athlete site — The Brain app.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
pnpm run build:brain
echo "Brain app ready at apps/brain-app/"
