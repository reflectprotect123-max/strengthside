#!/usr/bin/env bash
# Build a debug dogfood APK of the Hybrid HTML athlete shell.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="$(cd "$ROOT/../../.." && pwd)"
cd "$REPO"
bash apps/mobile/sync-hybrid-html.sh
cd "$ROOT"
if [[ ! -x node_modules/.bin/cap ]]; then
  npm install --no-fund --no-audit
fi
npx cap sync android

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

APK="$(find app/build/outputs/apk/debug -name '*.apk' | head -1)"
echo "Built: $APK"
if [[ -d /opt/cursor/artifacts && -n "$APK" ]]; then
  cp "$APK" /opt/cursor/artifacts/the-hybrid-athlete-dogfood-debug.apk
  echo "Copied to /opt/cursor/artifacts/the-hybrid-athlete-dogfood-debug.apk"
fi
