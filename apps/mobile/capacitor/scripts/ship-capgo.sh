#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
: "${CAPGO_TOKEN:?Provide CAPGO_TOKEN through secure environment settings}"
: "${CAPGO_BUNDLE_VERSION:?Set a unique bundle version}"
npx --yes @capgo/cli@8.70.0 bundle upload com.hybrid.strength \
  --path web --channel strength-live --bundle "$CAPGO_BUNDLE_VERSION" \
  --min-update-version 1.2.4 --self-assign --fail-on-incompatible
