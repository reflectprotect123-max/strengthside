# THE Hybrid System — The Brain

**One product:** The Brain athlete app — shared home, connectors hub, AI coach chat.

| Role | Path |
| --- | --- |
| **Edit** | `apps/brain-app/` (`index.html`, `app.js`, `brain.css`) |
| **Sync** | `bash scripts/sync-brain-app.sh` |
| **Play locally** | `cd apps/brain-app && python3 -m http.server 8765` |
| **Deploy** | `apps/brain-app/` → Netlify (`thehybridsystem.netlify.app`) |
| **Android** | `apps/mobile/capacitor/` → Capgo `com.hybrid.athlete` |

## Brains (pure packages)

- **`packages/brain/`** — hub packet + readiness (pure, no I/O)
- **`packages/adaptive/`** — engine math (pure, wire into Brain UI later)
- **`supabase/migrations/`** — owned Postgres tables (shared with hybrid repo). See `CLAUDE.md`.

## Verify

```bash
pnpm install
pnpm run verify
```

See `handoff.md` for ship ritual and secrets vault.
