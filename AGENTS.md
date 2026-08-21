# AGENTS.md

Read `CLAUDE.md` (operating contract, shared-Supabase table ownership) and
`handoff.md` (project history / current state) first. This file only adds
Cloud-agent runtime notes on top of those.

## Cursor Cloud specific instructions

This is a pnpm workspace (Node 22, `pnpm@10.33.0`, both preinstalled). The VM
startup/update script runs `pnpm install`, so dependencies are already refreshed
when you start. Standard commands live in the root `package.json` scripts and
each package's `package.json`; don't duplicate them here.

### Verifying the repo

- `pnpm run verify` is the full gate: `typecheck` + `test` + `check:migrations` +
  `build` (same set CI runs). Green means 4 projects typecheck and ~127 tests
  pass (engine 111 / edge 10 / web 2 / mobile 4).
- There is **no separate lint step** — `typecheck` (`tsc --noEmit` per package) is
  the static check. Don't invent an eslint command.
- `check:migrations` (`checks/migrations-apply.mjs`) needs a local Postgres:
  `initdb` must be on one of `/usr/lib/postgresql/16/bin`,
  `/usr/lib/postgresql/15/bin`, `/usr/local/bin`, plus the `pgvector` extension.
  These are **system packages** (`postgresql` + `postgresql-<ver>-pgvector`), part
  of the base VM image, not the update script. If they're missing the check
  prints `SKIP` and exits 0 (so `verify` still passes but proves nothing); if
  Postgres is present but pgvector is not, it prints `KNOWN ENVIRONMENT GAP` and
  still exits 0 — see `CLAUDE.md`'s pgvector note. The check builds and destroys
  its own throwaway cluster in `/tmp`; it never touches the shared project.

### Running the apps (dev mode)

- **Web** (`apps/web`, `@hybrid/strength-web`): `pnpm --filter @hybrid/strength-web dev`
  — Vite on `http://localhost:5173`, single route `/bench` (any other path
  redirects there). It renders the engine's `METRICS` registry as the proof the
  workspace link is live. Supabase is unset by default, so the page shows
  "not configured" — that's intentional, not a failure (set `VITE_SUPABASE_URL`
  and `VITE_SUPABASE_ANON_KEY` to wire it).
- **Mobile** (`apps/mobile`, `@hybrid/strength-mobile`): for a browser preview run
  `pnpm --filter @hybrid/strength-mobile exec expo start --web --port 8081`
  (Expo web on `http://localhost:8081`). Note the package's `start` script is
  `expo start --dev-client`, which targets a **native** dev client, not web — use
  the explicit `--web` command above for a no-device preview. On Expo web, a
  Metro HMR reconnect briefly flashes a black screen with the white Expo logo;
  that is the dev splash re-mounting, not a crash.

### Product priority — ARC coach is the spine

- **`ARC.dc.html`** (and companion `Coach App.dc.html`) is the **coach-side ARC
  workspace** — Command Center, Readiness brass gauge, Conditioning, Library,
  Session Builder, Analytics. Treat it as the visual + product source of truth.
  Do **not** restyle, simplify, or "improve" it casually; a lot of iteration is
  already sunk there. Athlete/mobile work should **align to ARC**, not the other
  way around.
- Athlete **mobile** (`apps/mobile`, including `prototype/live-conditioning.html`)
  is a **slow / parallel build**. Home + live Conditioning demos are exploratory;
  they must not overwrite or redefine coach ARC patterns (especially the brass
  readiness gauge / readiness overview).
- When in doubt: preserve ARC intact; extend athlete surfaces to match it.

### Edge function

`supabase/functions/embed-coaching-note` is Deno at runtime but is typechecked
and unit-tested through the workspace (vitest). Deploy caveats
(`--no-verify-jwt` + `EMBED_WEBHOOK_SECRET`) are in `handoff.md` under
"Open runtime notes"; don't deploy from a Cloud agent without approval.
