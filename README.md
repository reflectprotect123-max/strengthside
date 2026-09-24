# The Engine

One product: the athlete Engine app, plus the conditioning half of adaptive.

| Role | Path |
| --- | --- |
| Adaptive engine | `packages/adaptive/` → `apps/athlete/adaptive-bundle.js` |
| Engine zones | `apps/athlete/brain-kernel.js` |
| App | `apps/athlete/` |
| Android shell | `apps/mobile/capacitor/` wraps `apps/athlete/` |

```bash
pnpm install
pnpm run check:athlete-app
```
