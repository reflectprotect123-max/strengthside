# Stage 3 — Connector audit (Slice 3.1)

Date: 23 Aug 2026. Product: Hybrid HTML athlete app (strengthside).

## Concept2 on hybrid (source of truth)

Live on `https://thehybridengine1.netlify.app`:

| Function | Athlete HTML use |
| --- | --- |
| `concept2-connect` | OAuth start — use `?client=native` → JSON `{ authorizeUrl }` (same contract as WHOOP) |
| `concept2-callback` | Browser redirect handler on hybrid — **do not reimplement**; athlete opens authorize URL only |
| `concept2-sync` | Authenticated sync → `{ connected, normalized[], syncedAt }` |
| `integrations-status` | Already returns `concept2: { connected, lastSyncAt, resultCount, latest }` |
| `integrations-disconnect` | `POST ?provider=concept2` (same as WHOOP) |

Tokens and Logbook OAuth **stay on hybrid** (Netlify blobs + Supabase identity). Athlete site only proxies with `Authorization: Bearer <supabase access_token>`.

### What can live under `apps/mobile/.../netlify/functions`

Thin proxies only (same pattern as WHOOP):

- `concept2-connect.mjs` → `proxyHybrid(..., 'concept2-connect')`
- `concept2-callback.mjs` → proxy (rare; browser flow finishes on hybrid origin)
- `concept2-sync.mjs` → `proxyHybrid(..., 'concept2-sync')`

Do **not** port `_lib/concept2.mjs` or store tokens here — that would fork secrets and break the shared-Supabase account model.

### HTML token / session storage

- Supabase session: `localStorage` via `@supabase/supabase-js` (shared with WHOOP card).
- Concept2 connection flag / last sync: `S.settings.concept2` in app storage (`THE-builder-clean-v1`).
- Imported erg results: applied via `@hybrid/engine` `planConcept2Import` / `applyConcept2Import` into local sessions / `settings.conditioning` — never into strength tasks.

## Echo FTMS

Research starter: hybrid `docs/research/echo-v3-connectivity-bundle/code/starter/typescript/echo-v3-ftms.ts`.

- Port parser + `connectEchoV3` into `echo-ftms.js` (browser IIFE).
- Chrome Android (+ desktop Chrome) Web Bluetooth; iOS Safari → clear unavailable message.
- Calories from Echo are **device-tagged only** — never treat as portable nutrition calories.
- HR strap + Echo may coexist (two status lines).

## Freeze

No Hybrid Strength / `@hybrid/strength-engine` / Library edits.
