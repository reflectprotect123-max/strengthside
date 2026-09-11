# THE Hybrid System — Strength (strengthside)

**Two products, two repos.** Strength is this tree. Conditioning is `the-engine`.
Nutrition is `nutrition`. Do not fold Engine into `apps/athlete/` or `apps/engine/`.

| Role | Path |
| --- | --- |
| **Brain (logic only)** | `packages/brain/` → bundled to `apps/athlete/brain-bundle.js` |
| **Strength UI** | `apps/athlete/` — kg/reps TRACK logger, `THE-brain-v1` |
| **Engine** | sibling repo `the-engine` — not this tree |
| **Sync / build** | `bash scripts/sync-athlete-app.sh` |
| **Play Strength** | `python3 -m http.server --directory apps/athlete` |
| **Deploy Strength** | `apps/athlete/` → Netlify (`thehybridsystem.netlify.app`) |
| **Android Strength** | `apps/mobile/capacitor/` wraps `apps/athlete/` |

## Coach workspace (separate surface)

The Hybrid athlete app (`index.html` / `THE-Hybrid-App.html`) is **not** this and is not edited. Athletes keep logging there. This page is coach-only: Home feed, roster, library, program/session builders, assign-to-team.

```bash
cd apps/coach
python3 -m http.server 4173
# http://localhost:4173/coach.html
```

Coach demo: `dan@thehybrid.local` / `demo`

Seeded roster (visible on Coach Home, not a login here): team **hybrid S&C**, athlete Dan Veldman, program **Hybrid Strength Base**, one completed session (Dan Veldman, Week 1 Day 1). This is the last good coach suite from `848074a` (parent of the park-coach commit).

## Brains (not a second app)

- **`packages/brain/`** — hub logic (readiness, today’s call, coach context). Zero I/O.
- **`packages/strength-engine/`** — deleted as a product engine; do not restore from history as the brain.
- **`supabase/migrations/`** — owned Postgres tables (shared with the Brain repo). See `CLAUDE.md`.

Operational checkpoint: [`handoff.md`](handoff.md)

## Verify

```bash
pnpm install
pnpm run verify
```
