# THE Hybrid System — athlete app (strengthside)

**One product:** the Hybrid HTML athlete app — The Engine + Hybrid Strength.

| Role | Path |
| --- | --- |
| **Edit** | `apps/mobile/prototype/hybrid-app/index.html` (+ `whoop.js`, `service-worker.js`) |
| **Sync** | `bash apps/mobile/sync-hybrid-html.sh` |
| **Play locally** | `apps/mobile/THE-Hybrid-App.html` — see [apps/mobile/PLAY.md](apps/mobile/PLAY.md) |
| **Deploy** | `apps/mobile/preview-site/` → Netlify |
| **Live** | https://papaya-cheesecake-059e06.netlify.app/ |

## Brains (not a second app)

- **`packages/strength-engine/`** — pure lift logic (resolve, e1RM, WM, PR). Zero I/O. Wire into the HTML app later.
- **`supabase/migrations/`** — owned Postgres tables (shared with the hybrid repo). See `CLAUDE.md`.

## Mono-app charter

Keep/kill list, build order, and what we stopped building:
[`docs/superpowers/plans/2026-08-23-mono-athlete-app-charter.md`](docs/superpowers/plans/2026-08-23-mono-athlete-app-charter.md)

Operational checkpoint: [`handoff.md`](handoff.md)

## Verify

```bash
pnpm install
pnpm run verify   # typecheck + test + migrations + engine build
```

## Do not build here

Coach dashboards, ARC prototypes, Expo shells, and parallel athlete apps were removed on purpose. All athlete UX lives in `hybrid-app/`.
