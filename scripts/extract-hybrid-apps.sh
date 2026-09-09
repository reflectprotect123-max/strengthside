#!/usr/bin/env bash
# Copy the live Hybrid HTML prototype into extractable Strength / Engine trees,
# stamp hybrid-product, and fork Capacitor shells. Does not replace apps/mobile.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/apps/mobile/prototype/hybrid-app"

copy_runtime() {
  local dest="$1"
  mkdir -p "$dest"
  find "$SRC" -maxdepth 1 -type f \( \
      -name '*.js' -o -name '*.html' -o -name '*.json' -o -name '*.toml' \
      -o -name '.netlifyignore' -o -name '*.css' \
    \) ! -name '*.smoke.mjs' ! -name 'coach.html' -print0 | while IFS= read -r -d '' f; do
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
  rm -f "$dest/coach.html"
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
copy_runtime "$ROOT/apps/hybrid-engine"
stamp_product "$ROOT/apps/hybrid-engine" engine "Hybrid Engine"

bash "$ROOT/scripts/setup-product-shells.sh"

python3 - "$ROOT" <<'PY'
import json, pathlib, sys
root = pathlib.Path(sys.argv[1])
products = json.loads((root / "scripts/hybrid-products.json").read_text())
for key in ("strength", "engine"):
    meta = products[key]
    dest = root / meta["dir"]
    (dest / "PRODUCT.json").write_text(json.dumps(meta, indent=2) + "\n")
    (dest / "README.md").write_text(f"""# {meta["appName"]}

Product tree for **{meta["appName"]}**. Live mixed athlete stays in `apps/mobile`.

| | |
| --- | --- |
| Stamp | `<meta name="hybrid-product" content="{key}" />` |
| Storage | `{meta["storage"]}` |
| Android / Capgo | `{meta["appId"]}` |
| OAuth scheme | `{meta["appId"]}://` |
| Netlify slug | `{meta["netlifySlug"]}` ({meta["netlifyUrl"]}) |

WHOOP/Concept2 functions here are **proxy-only** → `thehybridengine1.netlify.app`.

```bash
bash scripts/extract-hybrid-apps.sh
PRODUCT={key} bash scripts/build-product-apk.sh
PRODUCT={key} CAPGO_BUNDLE_VERSION=1.0.0 bash scripts/ship-product-capgo.sh
```

Spin-out: `SPLIT.md`.
""")
print("wrote PRODUCT.json + README")
PY

echo "Extracted apps/hybrid-strength and apps/hybrid-engine (HTML + Capacitor)"
