# Hybrid Engine

Product tree for **Hybrid Engine**. Live mixed athlete stays in `apps/mobile`.

| | |
| --- | --- |
| Stamp | `<meta name="hybrid-product" content="engine" />` |
| Storage | `THE-hybrid-engine-v1` |
| Android / Capgo | `com.hybrid.engine` |
| OAuth scheme | `com.hybrid.engine://` |
| Netlify slug | `hybrid-engine` (https://hybrid-engine.netlify.app) |

WHOOP/Concept2 functions here are **proxy-only** → `thehybridengine1.netlify.app`.

```bash
bash scripts/extract-hybrid-apps.sh
PRODUCT=engine bash scripts/build-product-apk.sh
PRODUCT=engine CAPGO_BUNDLE_VERSION=1.0.0 bash scripts/ship-product-capgo.sh
```

Spin-out: `SPLIT.md`.
