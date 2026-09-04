# Blank slate — zero product engines (2026-09-03)

## Decision

Delete **every** product engine and its wiring. One adaptive intelligent engine
will be written from scratch later. Until then: athlete shell + manual log +
integrations only.

## Deleted

| Layer | Gone |
|---|---|
| Packages | `strength-engine`, `engine`, `shared-core`, `nutrition-engine`, `nutrition-core` |
| Athlete S&C | adapters, bundles, Big Mac, cond/recovery/coordinator, one-set logger, sync/AI |
| Athlete nutrition | `nutrition-bundle` / UI / sync, food catalog, label scan |
| Netlify decide | `big-mac-decide`, `ai-strength-progression`, `ai-coach-intent` |
| Coach S&C | source + stubs; `coach.html` = parked page only |

## Kept (not engines)

- Hybrid HTML shell: Home · Library (dumb templates) · Calendar · Settings
- Manual strength set logger + conditioning log chrome
- Session chrome / rest / work overlays
- Exercise search + load-profile **columns** (UI metadata only)
- WHOOP / Concept2 / Echo FTMS / Capgo (data + device integrations)
- Shared Supabase **data** tables (twelve-table contract) — ledger only

## Resurrection seal (cache v168 / Capgo 1.0.52)

- No engine packages, artifacts, script tags, or SW precache entries.
- Proxy stubs **removed**; old global **names scrubbed** from live source (`openVolume` replaces `autopilotVolume`).
- Account sync is WHOOP + Concept2 only (no strength/nutrition/coach engine pulls).
- Shipped: Capgo **`dogfood` + `live` @ 1.0.52**; Netlify athlete site from `main`.
- **Not magic:** git history can restore files; devices on older Capgo bundles need Settings → Check for updates.

## Next

Strength V2 (set-by-set) is specified in
`docs/superpowers/specs/2026-09-04-strength-v2-set-by-set-design.md`.
Do not revive deleted packages or APIs. Do not implement until that spec
is approved and an implementation plan exists.
