# Handoff — The Brain (TheStrengthEngine)

> **AUTHORITATIVE CHECKPOINT — 9 September 2026 (The Brain reset).**
> Chat history before this file is disposable. Start here.
>
> Design spec: `docs/superpowers/specs/2026-09-09-the-brain-design.md`
> Engineering rules + twelve-table Supabase contract: `CLAUDE.md`
> Pre-Brain Hybrid HTML was **deleted** — not archived. No restore path in repo.

---

## 0. Read this first

| | |
| --- | --- |
| **Product** | **The Brain** — one shared front page (Strength / Engine / Nutrition rooms as accent switches). Connectors hub + AI coach chat. Training UIs rebuild screen-by-screen. |
| **Hub logic** | `@hybrid/brain` — readiness, brain packet (pure, no I/O) |
| **Engine math** | `@hybrid/adaptive` — kept for later wiring; bundled to `apps/brain-app/adaptive-bundle.js` when needed |
| **Edit athlete app** | `apps/brain-app/` → `bash scripts/sync-brain-app.sh` (runs `pnpm run build:brain`) |
| **Branch** | Feature work ships on `cursor/*-0ae6`; `main` is the dogfood base |
| **Storage** | **`THE-brain-v1`** — hard blank slate; no import from `THE-builder-clean-v*` or `THE-hybrid-*` |
| **Cache** | **`the-brain-v1`** (`BRAIN_BUILD` in `app.js` + SW `CACHE` must match) |
| **Capgo** | `com.hybrid.athlete` — bump on ship after HTML changes |
| **Web** | https://thehybridsystem.netlify.app/ (Netlify deploy root: `apps/brain-app/`) |
| **Companion** | `THE-HYBRID-ENGINE1` = shared-Supabase schema stub; live WHOOP still on that Netlify. Nutrition = separate repo. |

**Ship ritual:** edit `apps/brain-app/` → `bash scripts/sync-brain-app.sh` → `pnpm run verify` → Capgo upload (`dogfood` then set `live`) → bump this handoff + `docs/RELEASE_NOTES.md`.

**Do not revisit (owner lock):** ARC / multi-coach · Expo / second athlete shell · pain/illness product work · restoring deleted pre-Brain Hybrid HTML or split seeds from git history into active paths.

---

## 0.5 Secrets vault (agent recovery)

> **Private repo only.** Prefer Netlify UI for values never pasted in chat.

### Capgo OTA

| Key | Value |
| --- | --- |
| Token | `292f04bd-a0a6-490c-8b7d-03c234eb4915` — rematerialize to gitignored `.capgo` via `bash scripts/rematerialize-capgo-from-vault.sh` |
| App ID | `com.hybrid.athlete` |
| Upload path | `apps/brain-app/` (Capacitor `webDir: ../brain-app`) |
| Ship | `CAPGO_BUNDLE_VERSION=<ver> bash apps/mobile/capacitor/scripts/ship-capgo.sh` |

### OpenRouter (coach LLM)

| Key | Where |
| --- | --- |
| `OPENROUTER_API_KEY` | **Netlify** → site `thehybridsystem` → Environment variables (production). Also **Cursor Cloud environment secrets** for agents. |
| Local dev | Gitignored repo-root `.openrouter` (one line, `sk-or-v1-…`) — never commit. |
| Default model | `openrouter/free` (override with Netlify env `OPENROUTER_MODEL`) |
| Dashboard | https://openrouter.ai/keys |
| Used by | `apps/brain-app/netlify/functions/brain-coach.mjs` |

GitHub push protection blocks OpenRouter keys in tracked files (unlike Capgo token in this vault). Paste the key into Netlify UI — do not commit it to `handoff.md`.

### Supabase · WHOOP · Netlify

- **WHOOP / Concept2:** tokens and OAuth on `thehybridengine1.netlify.app`. Athlete site is **proxy-only** (`apps/brain-app/netlify/functions/_hybrid-proxy.mjs`).
- Athlete Netlify site ID: `thehybridsystem`.

---

## 1. What exists now

### Alive

- **`apps/brain-app/`** — Home + Settings + Coach chat stub; WHOOP connector; Netlify deploy + functions
- **`packages/brain/`** — packet + readiness (vitest colocated)
- **`packages/adaptive/`** — pure cond/lift math (not wired into Brain UI yet)
- **`apps/mobile/capacitor/`** — Android shell (`com.hybrid.athlete`, `webDir: ../brain-app`)
- Shared Supabase **twelve-table data ledger** (RLS + `embed-coaching-note`) — storage only

### Deleted (gone — no recall path in repo)

- Old Hybrid HTML prototype, split seeds, preview-site, and related scripts
- `pnpm run check:no-recall` fails CI if any recall path reappears

### Not built yet (v0.1 gaps)

- Strength / Engine / Nutrition training screens
- Concept2 UI (proxies copied; connector UI later)
- Supabase session sync

---

## 2. What to do next

1. Rebuild training UIs room-by-room on the shared Brain home shell.
2. Wire `@hybrid/adaptive` into Strength/Engine doors when those screens land.
3. Paste `OPENROUTER_API_KEY` into Netlify `thehybridsystem` (see §0.5) before claiming coach works in production.

**Useful checks**

```bash
pnpm run verify
pnpm run check:brain-app
pnpm run check:whoop-ownership
pnpm run check:whoop-deeplink
pnpm run check:no-recall
WHOOP_LIVE_SMOKE=0 node apps/brain-app/checks/whoop-live.smoke.mjs   # skip live hit locally
```

---

## 3. Rules (do not silently reverse)

- **One athlete app:** `apps/brain-app/`. Do not restore `apps/mobile/prototype/` or split seeds into active paths.
- **Blank slate:** `THE-brain-v1` only — never migrate from old Hybrid storage keys.
- WHOOP ownership stays on hybrid1 Netlify; athlete site proxies only (`pnpm run check:whoop-ownership`).
- `@hybrid/brain` and `@hybrid/adaptive` stay **pure** (no I/O in packages).
- Migration filenames on the shared Supabase ledger are sacred — never rename applied migrations.

---

## 4. Branches & ship record

| Ref | Note |
| --- | --- |
| Reset | **The Brain** full product UI delete + archive — branch `cursor/brain-reset-0ae6` |
| Cache | `the-brain-v1` / `THE-brain-v1` |
| Pre-Brain | Last Hybrid cache was `the-hybrid-athlete-blank-v215` — obsolete after reset |

**Next agent:** read this file + `docs/superpowers/specs/2026-09-09-the-brain-design.md` + `CLAUDE.md`. Edit `apps/brain-app/` only for athlete UI.
