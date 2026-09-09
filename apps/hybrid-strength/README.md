# Hybrid Strength

Product tree for **Hybrid Strength**. Live mixed athlete stays in `apps/mobile`.

| | |
| --- | --- |
| Stamp | `<meta name="hybrid-product" content="strength" />` |
| Storage | `THE-hybrid-strength-v1` |
| Android / Capgo | `com.hybrid.strength` |
| OAuth scheme | `com.hybrid.strength://` |
| Netlify slug | `hybrid-strength` (https://hybrid-strength.netlify.app) |

WHOOP/Concept2 functions here are **proxy-only** → `thehybridengine1.netlify.app`.

```bash
bash scripts/extract-hybrid-apps.sh
PRODUCT=strength bash scripts/build-product-apk.sh
PRODUCT=strength CAPGO_BUNDLE_VERSION=1.0.0 bash scripts/ship-product-capgo.sh
```

Spin-out: `SPLIT.md`.
