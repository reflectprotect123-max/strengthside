# The Engine

This tree is the athlete Engine app and the conditioning half of adaptive.

- App: `apps/athlete/`
- Adaptive engine: `packages/adaptive/` (open, next, close)
- Engine zones: `apps/athlete/brain-kernel.js`
- Android shell: `apps/mobile/capacitor/`

`pnpm run check:athlete-app` is the athlete gate. `pnpm run verify` is typecheck, package tests, migrations, the adaptive bundle, and the athlete checks.

Do not add a coach app, a strength house, or an evidence archive back into this tree.
