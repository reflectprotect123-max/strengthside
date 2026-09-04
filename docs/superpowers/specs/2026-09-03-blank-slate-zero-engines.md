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

## Resurrection seal (cache v167)

- No engine packages, artifacts, script tags, or SW precache entries.
- `index.html` installs **Proxy no-op stubs** that overwrite every old global — method calls cannot reach real logic even if residual names remain in source.
- Account sync does not pull strength/nutrition/coach engines.
- **Not magic:** git history can restore files; Capgo/Netlify must ship v167 or older client caches can linger until update.

## Next

Design **one** adaptive engine package. Do not revive deleted packages or APIs.
