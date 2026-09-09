#!/usr/bin/env bash
# Debug APK for Hybrid Strength or Hybrid Engine.
#   PRODUCT=strength bash scripts/build-product-apk.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PRODUCT="${PRODUCT:-}"
if [[ "$PRODUCT" != "strength" && "$PRODUCT" != "engine" ]]; then
  echo "build-product-apk: set PRODUCT=strength or PRODUCT=engine" >&2
  exit 1
fi
APP_ID="$(python3 -c "import json; print(json.load(open('$ROOT/scripts/hybrid-products.json'))['$PRODUCT']['appId'])")"
WWW="$ROOT/$(python3 -c "import json; print(json.load(open('$ROOT/scripts/hybrid-products.json'))['$PRODUCT']['dir'])")"
CAP="$WWW/capacitor"
if [[ ! -d "$CAP/android" ]]; then
  echo "build-product-apk: missing $CAP — run bash scripts/extract-hybrid-apps.sh" >&2
  exit 1
fi
cd "$CAP"
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
  echo "ANDROID_HOME not set and no SDK found." >&2
  exit 2
fi
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"
cd "$CAP/android"
chmod +x ./gradlew
./gradlew assembleDebug --no-daemon
APK="$(find app/build/outputs/apk/debug -name '*.apk' | head -1)"
echo "Built: $APK ($APP_ID)"
if [[ -d /opt/cursor/artifacts && -n "$APK" ]]; then
  cp "$APK" "/opt/cursor/artifacts/${PRODUCT}-dogfood-debug.apk"
  echo "Copied to /opt/cursor/artifacts/${PRODUCT}-dogfood-debug.apk"
fi
