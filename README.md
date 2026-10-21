# The app that opens is the Engine

`apps/athlete/index.html` opens `apps/athlete/engine/index.html`. That page is the conditioning app: the 12 methods, live heart-rate workouts, zones, WHOOP, progress, and app updates.

The strength builder, the strength brain, and the unwired evidence-platform brain are no longer in this repository. They were packed into an archive outside git on 21 October 2026. Supabase migrations stayed, because that ledger is already applied. WHOOP and `brain-coach` stayed, because the Engine calls them.

How the Engine keeps its adaptive behavior: [docs/engine-adaptive-brain.md](docs/engine-adaptive-brain.md).

## Run it

```bash
python3 -m http.server --directory apps/athlete
```

Open `http://127.0.0.1:8000/`. The door goes to the Engine.

## Verify

```bash
pnpm install
pnpm run verify:engine
```

`pnpm run verify` also runs the WHOOP and coach function tests, typecheck, migrations, and the Engine browser checks.

## Ship

The Android shell is `apps/mobile/capacitor/`. The version file is `apps/athlete/release.json`. Capgo channel `strength-live`, package `com.hybrid.strength`. Publishing still requires an explicit request.

```bash
bash scripts/sync-athlete-app.sh
```
