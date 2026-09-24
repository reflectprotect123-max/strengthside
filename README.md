# The Engine

One product: the athlete Engine app, plus the adaptive brain.

| Role | Path |
| --- | --- |
| Adaptive brain | `packages/adaptive/` → `apps/athlete/adaptive-bundle.js` |
| Daily packet | `packages/brain/` → `apps/athlete/brain-bundle.js` |
| App | `apps/athlete/` |
| Android shell | `apps/mobile/capacitor/` wraps `apps/athlete/` |

```bash
pnpm install
pnpm run check:athlete-app
```
