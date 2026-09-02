#!/usr/bin/env bash
# Serve preview-site locally and open the Electron coach shell against it.
# Use when Netlify has not deployed yet but you need the latest coach UI.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PREVIEW="$ROOT/apps/mobile/preview-site"
PORT="${HYBRID_COACH_PORT:-8765}"
URL="http://127.0.0.1:${PORT}/coach.html"

bash "$ROOT/apps/mobile/sync-hybrid-html.sh"

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 required to serve preview-site" >&2
  exit 1
fi

if ! curl -sf "$URL" >/dev/null 2>&1; then
  echo "Starting static server on $PORT …"
  python3 -m http.server "$PORT" --directory "$PREVIEW" >/tmp/hybrid-coach-static.log 2>&1 &
  SERVER_PID=$!
  trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT
  for _ in $(seq 1 20); do
    curl -sf "$URL" >/dev/null 2>&1 && break
    sleep 0.25
  done
fi

export HYBRID_COACH_URL="$URL"
echo "Coach URL: $HYBRID_COACH_URL"
cd "$ROOT/apps/desktop"
pnpm start
