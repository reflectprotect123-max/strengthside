# THE Hybrid System — athlete app (strengthside)

**One product:** the Hybrid HTML athlete app — spine (`@hybrid/brain`) + branches (Strength / Engine / Nutrition screens).

| Role | Path |
| --- | --- |
| **Brain (logic only)** | `packages/brain/` → bundled to `apps/athlete/brain-bundle.js` |
| **Edit UI** | `apps/athlete/` (`index.html`, `app.js`, `home.css`) |
| **Sync / build** | `bash scripts/sync-athlete-app.sh` |
| **Play locally** | open `apps/athlete/index.html` or `python3 -m http.server --directory apps/athlete` |
| **Deploy** | `apps/athlete/` → Netlify (`thehybridsystem.netlify.app`) |
| **Android** | `apps/mobile/capacitor/` wraps `apps/athlete/` |

## Brains (not a second app)

- **`packages/brain/`** — hub logic (readiness, today’s call, coach context). Zero I/O.
- **`packages/adaptive/`** — engine math (Open/Next/Close). Bundled to `apps/athlete/adaptive-bundle.js`.
- **`packages/strength-engine/`** — pure lift logic (resolve, e1RM, WM, PR). Wire into screens later.
- **`supabase/migrations/`** — owned Postgres tables (shared with the Brain repo). See `CLAUDE.md`.

Operational checkpoint: [`handoff.md`](handoff.md)

## Verify

```bash
pnpm install
pnpm run verify
```
