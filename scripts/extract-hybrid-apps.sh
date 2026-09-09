#!/usr/bin/env bash
# Copy the live Hybrid HTML prototype into extractable Strength / Engine trees
# and stamp meta name="hybrid-product". Does not replace apps/mobile (live Capgo).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/apps/mobile/prototype/hybrid-app"

copy_runtime() {
  local dest="$1"
  mkdir -p "$dest"
  # Runtime only — smokes stay in this repo's prototype.
  find "$SRC" -maxdepth 1 -type f \( \
      -name '*.js' -o -name '*.html' -o -name '*.json' -o -name '*.toml' \
      -o -name '.netlifyignore' -o -name '*.css' \
    \) ! -name '*.smoke.mjs' -print0 | while IFS= read -r -d '' f; do
    cp -f "$f" "$dest/"
  done
  if [[ -d "$SRC/netlify" ]]; then
    rm -rf "$dest/netlify"
    cp -a "$SRC/netlify" "$dest/netlify"
  fi
  if [[ -d "$SRC/icons" ]]; then
    rm -rf "$dest/icons"
    cp -a "$SRC/icons" "$dest/icons"
  fi
}

stamp_product() {
  local dest="$1"
  local product="$2"
  local title="$3"
  python3 - "$dest/index.html" "$product" "$title" <<'PY'
import pathlib, sys
path, product, title = pathlib.Path(sys.argv[1]), sys.argv[2], sys.argv[3]
text = path.read_text()
old = '<meta name="hybrid-product" content="combined" />'
new = f'<meta name="hybrid-product" content="{product}" />'
if old not in text:
    raise SystemExit(f'{path}: missing combined hybrid-product meta to stamp')
text = text.replace(old, new, 1)
text = text.replace('<title>THE Hybrid System</title>', f'<title>{title}</title>', 1)
path.write_text(text)
PY
  if [[ -f "$dest/manifest.json" ]]; then
    python3 - "$dest/manifest.json" "$title" <<'PY'
import json, pathlib, sys
p = pathlib.Path(sys.argv[1])
title = sys.argv[2]
data = json.loads(p.read_text())
data['name'] = title
data['short_name'] = title.replace('Hybrid ', '')
p.write_text(json.dumps(data, indent=2) + '\n')
PY
  fi
}

copy_runtime "$ROOT/apps/hybrid-strength"
stamp_product "$ROOT/apps/hybrid-strength" strength "Hybrid Strength"
cat > "$ROOT/apps/hybrid-strength/README.md" <<'EOF'
# Hybrid Strength (seed)

Athlete HTML for **lifts only**. Storage key `THE-hybrid-strength-v1`.

This tree is a copy of `apps/mobile/prototype/hybrid-app` with
`<meta name="hybrid-product" content="strength" />`.

**Spin-out:** see `/SPLIT.md`. Do not treat this folder as the live Capgo/Netlify
app — that remains `apps/mobile` until cutover.
EOF

copy_runtime "$ROOT/apps/hybrid-engine"
stamp_product "$ROOT/apps/hybrid-engine" engine "Hybrid Engine"
cat > "$ROOT/apps/hybrid-engine/README.md" <<'EOF'
# Hybrid Engine (seed)

Athlete HTML for **conditioning only**. Storage key `THE-hybrid-engine-v1`.
Recovery is not a product here.

This tree is a copy of `apps/mobile/prototype/hybrid-app` with
`<meta name="hybrid-product" content="engine" />`.

**Spin-out:** see `/SPLIT.md`. Do not treat this folder as the live Capgo/Netlify
app — that remains `apps/mobile` until cutover.
EOF

echo "Extracted apps/hybrid-strength (strength) and apps/hybrid-engine (engine)"
