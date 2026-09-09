#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ARCHIVE="$ROOT/archive/pre-brain"
mkdir -p "$ARCHIVE"

if [[ -d "$ROOT/apps/mobile/prototype" ]]; then
  rm -rf "$ARCHIVE/mobile-prototype"
  mv "$ROOT/apps/mobile/prototype" "$ARCHIVE/mobile-prototype"
  echo "Archived apps/mobile/prototype → archive/pre-brain/mobile-prototype"
fi

for dir in apps/hybrid-strength apps/hybrid-engine apps/mobile/preview-site; do
  if [[ -d "$ROOT/$dir" ]]; then
    rm -rf "$ROOT/$dir"
    echo "Removed $dir"
  fi
done

# Legacy synced artifacts at apps/mobile root (not capacitor/)
for f in THE-Hybrid-App.html service-worker.js whoop.js concept2.js coach.html; do
  [[ -f "$ROOT/apps/mobile/$f" ]] && rm -f "$ROOT/apps/mobile/$f" && echo "Removed apps/mobile/$f"
done

echo "Pre-brain cleanup done."
