#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
: "${CLOUDFLARE_API_TOKEN:?Add the token in secure environment settings}"
: "${CLOUDFLARE_ACCOUNT_ID:?Set the Cloudflare account ID}"
export NODE_USE_ENV_PROXY="${NODE_USE_ENV_PROXY:-1}"
export WRANGLER_SEND_METRICS=false
node scripts/build.mjs
node scripts/check.mjs
node scripts/ensure-pages-project.mjs
npx --yes wrangler@4.147.0 pages deploy public --project-name hybrid-engine-web --branch main
