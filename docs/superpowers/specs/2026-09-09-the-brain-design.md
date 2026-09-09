# The Brain — full reset (2026-09-09)

## Product

One app: **The Brain** — central hub, all connectors, AI coach chat.

- Shared **Home** for Strength / Engine / Nutrition (room accent switch)
- **Connectors:** WHOOP (hybrid1 proxy), Concept2 proxies (wired, UI later)
- **Coach:** `brain-coach` Netlify function → OpenRouter (`OPENROUTER_API_KEY`)
- **Rules:** `@hybrid/brain` (readiness / today’s call); engines plug in later
- **Storage:** `THE-brain-v1` only — no import from `THE-builder-clean-v*`

## Repo layout

| Path | Role |
| --- | --- |
| `apps/brain-app/` | Athlete UI + Netlify deploy root |
| `packages/brain/` | Pure hub logic (packet, readiness, coach context) |
| `apps/mobile/capacitor/` | Android shell → `webDir: ../brain-app` |
| *(deleted)* | Pre-Brain Hybrid HTML removed from repo — not archived |
| `supabase/` | Shared twelve-table ledger (unchanged) |
| `packages/adaptive/` | Engine math (unchanged, wire later) |

## Deleted from active product

- `apps/mobile/prototype/hybrid-app/` (deleted)
- `apps/hybrid-strength/`, `apps/hybrid-engine/`
- `apps/mobile/preview-site/`
- Old verify smokes tied to monolithic index.html

## v0.1 screens

1. Home — room switch, dials, today’s call, coach chat
2. Settings — WHOOP connect / sign-in
3. Room training UIs — stubs until rebuilt screen-by-screen

## Non-goals (v0.1)

- Import old localStorage
- Totem / MCP in app
- LLM writing prescriptions
