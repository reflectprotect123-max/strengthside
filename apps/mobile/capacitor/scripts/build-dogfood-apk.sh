#!/usr/bin/env bash
# Build a debug dogfood APK of the strength-only HTML athlete shell.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="$(cd "$ROOT/../../.." && pwd)"
cd "$REPO"
bash scripts/sync-athlete-app.sh
cd "$ROOT"
if [[ ! -x node_modules/.bin/cap ]]; then
  npm ci --no-fund --no-audit
fi
npx cap sync android
python3 - "$ROOT/android/app/src/main/assets/public" <<'PY'
from pathlib import Path
import shutil, sys
public = Path(sys.argv[1])
for name in ['checks', 'netlify']:
    shutil.rmtree(public / name, ignore_errors=True)
for path in public.rglob('*.test.js'):
    path.unlink()
for name in ['package.json', 'netlify.toml']:
    (public / name).unlink(missing_ok=True)
PY
node "$REPO/apps/athlete/checks/capgo-live-update.smoke.mjs"

if [[ -z "${ANDROID_HOME:-}${ANDROID_SDK_ROOT:-}" ]]; then
  for candidate in "$HOME/Android/Sdk" /opt/android-sdk /usr/lib/android-sdk; do
    if [[ -d "$candidate" ]]; then
      export ANDROID_HOME="$candidate"
      break
    fi
  done
fi
if [[ -z "${ANDROID_HOME:-}" || ! -d "${ANDROID_HOME}" ]]; then
  echo "ANDROID_HOME not set and no SDK found. Install Android SDK, then re-run." >&2
  exit 2
fi
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"

cd "$ROOT/android"
chmod +x ./gradlew
./gradlew assembleDebug --no-daemon

APK="$ROOT/android/app/build/outputs/apk/debug/app-debug.apk"
if [[ ! -f "$APK" ]]; then
  echo "Missing $APK" >&2
  exit 1
fi
NAMED="$ROOT/android/app/build/outputs/apk/debug/Hybrid-Strength-1.2.1.apk"
cp -f "$APK" "$NAMED"
echo "Built: $NAMED"
if [[ -d /opt/cursor/artifacts ]]; then
  cp -f "$NAMED" /opt/cursor/artifacts/Hybrid-Strength-1.2.1.apk
  echo "Copied to /opt/cursor/artifacts/Hybrid-Strength-1.2.1.apk"
fi
