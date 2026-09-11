# THE Hybrid System — Strength (strengthside)

**Two products, two repos.** Strength is this tree. Conditioning is
[`Engine-side-`](https://github.com/reflectprotect123-max/Engine-side-).
Nutrition is `nutrition`. Do not fold Engine into `apps/athlete/` or `apps/engine/`.

| Role | Path |
| --- | --- |
| **Brain (logic only)** | `packages/brain/` → bundled to `apps/athlete/brain-bundle.js` |
| **Strength UI** | `apps/athlete/` — kg/reps TRACK logger, `THE-brain-v1` |
| **Engine** | sibling repo [`Engine-side-`](https://github.com/reflectprotect123-max/Engine-side-) — not this tree |
| **Sync / build** | `bash scripts/sync-athlete-app.sh` |
| **Play Strength** | `python3 -m http.server --directory apps/athlete` |
| **Deploy Strength** | `apps/athlete/` → Netlify (`thehybridsystem.netlify.app`) |
| **Android Strength** | `apps/mobile/capacitor/` wraps `apps/athlete/` |

## The Engine — sibling GitHub repo (first push)

Live name is **`reflectprotect123-max/Engine-side-`** (capital `E`, hyphen, **trailing hyphen**). There is no `engineside` repo. Owner created it empty on 2026-09-11. Cursor GitHub App is granted on that repo.

**New Cloud Agent: push Engine there. Do not put Engine HTML or `@hybrid/adaptive` back in this tree.**

1. Confirm the token can write. `gh api installation/repositories --jq '.repositories[].full_name'` must list `reflectprotect123-max/Engine-side-`. If it only lists `strengthside`, this agent cannot push (GitHub App tokens are minted at start).
2. Rebuild a **standalone** Engine git repo. A new VM does not keep `/tmp/engineside`. From this branch, take commit `f29d205` (`apps/engine/` at root + `packages/adaptive/` + `scripts/bundle-adaptive.mjs`). Strengthside removed those paths in `37c1ba5` on purpose.
3. Stamp: `PRODUCT.json` `{ "hybridProduct": "engine", "storage": "THE-hybrid-engine-v1", "androidId": "com.hybrid.engine" }`. No `PlanSync`, no `strength_side`, no `decideNextLift` in `engine.js`. Library CTA is Create Engine session only.
4. `git push -u origin main` to `https://github.com/reflectprotect123-max/Engine-side-.git`. Dest is empty — **no force-push**.
5. Leave strengthside Strength-only (`pnpm run check:athlete-app`, `pnpm run check:no-recall`).

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
