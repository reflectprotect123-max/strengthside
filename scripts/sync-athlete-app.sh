#!/usr/bin/env bash
# Stage the Engine front door for the Android shell.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
node apps/athlete/checks/engine-door.smoke.mjs
node scripts/stage-athlete.mjs apps/mobile/capacitor/www
echo "Engine app staged at apps/mobile/capacitor/www"
