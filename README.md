# THE Hybrid System — athlete app (strengthside)

**One product:** the Hybrid HTML athlete app — The Engine + Hybrid Strength.

| Role | Path |
| --- | --- |
| **Edit** | `apps/mobile/prototype/hybrid-app/index.html` (+ `whoop.js`, `service-worker.js`) |
| **Sync** | `bash apps/mobile/sync-hybrid-html.sh` |
| **Play locally** | `apps/mobile/THE-Hybrid-App.html` — see [apps/mobile/PLAY.md](apps/mobile/PLAY.md) |
| **Deploy** | `apps/mobile/preview-site/` → Netlify |
| **Live** | https://papaya-cheesecake-059e06.netlify.app/ |

## Coach workspace (separate surface)

The Hybrid athlete app (`index.html` / `THE-Hybrid-App.html`) is **not** this. Coach login, the results feed, program/session builders, and assign-to-team live in a new page that does not change athlete screens.

```bash
cd apps/mobile/prototype/hybrid-app
python3 -m http.server 4173
# Coach + coaching-loop athlete logger:
#   http://localhost:4173/coach.html
```

Demo password for every account: `demo`

| Role | Email |
| --- | --- |
| Coach (Dan) | `dan@thehybrid.local` |
| Athlete (Dan Veldman) | `veldman@thehybrid.local` |
| Athlete (Alex Chen) | `alex@thehybrid.local` |
| Athlete (Jordan Hale) | `jordan@thehybrid.local` |

Seeded: team **hybrid S&C**, program **Hybrid Strength Base** (weeks × days 1–7), and one completed session on Coach Home (Dan Veldman, Week 1 Day 1).

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

## Athlete product (unchanged)

Athlete UX still lives only in `apps/mobile/prototype/hybrid-app/index.html`. This PR does not edit that file. Expo / ARC prototypes stay gone. The coach workspace is `coach.html` only.
