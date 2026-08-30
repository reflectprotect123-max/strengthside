# THE Hybrid Coach — Windows desktop shell

Thin Electron wrapper around the **live** coach workspace at
`https://thehybridsystem.netlify.app/coach.html`.

## OTA model

| Layer | Updates how |
| --- | --- |
| Coach UI (HTML/JS) | Netlify deploy on `main` — same as browser |
| This `.exe` | Reinstall when Electron shell changes (rare) |

Press **Ctrl+R** (or Coach → Reload coach) to pull the latest Netlify coach after a deploy.

## Local dev

```bash
cd apps/desktop
pnpm install
pnpm start
```

Override URL: `HYBRID_COACH_URL=https://thehybridsystem.netlify.app/coach.html pnpm start`

## Build Windows installer (on Windows)

```bash
pnpm run dist
```

Output: `apps/desktop/dist/THE-Hybrid-Coach-Setup-1.0.0.exe`

Or dispatch **Build coach desktop** in GitHub Actions (Windows runner).

## What this does NOT do

- Does not bundle or fork coach HTML — zero changes to `coach.html` / `coach-*.js`
- Does not replace Netlify or Capgo athlete OTA
- Does not code-sign (SmartScreen “unknown publisher” until a cert is added)
