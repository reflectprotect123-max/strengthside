#!/usr/bin/env bash
# Legacy name — The Brain app replaced Hybrid HTML sync.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
bash "$ROOT/scripts/sync-brain-app.sh"
