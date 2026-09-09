# Three products, three repos — locked design

**Date:** 9 September 2026  
**Status:** Locked in chat (human: Strength + Engine in different repos; Nutrition already elsewhere; Recovery dropped; this repo = shared backend only)

## Products

| Product | Git | What it is |
| --- | --- | --- |
| **Hybrid Strength** | New repo (seed: `apps/hybrid-strength/` in this tree until spin-out) | Lifts only |
| **Hybrid Engine** | New repo (seed: `apps/hybrid-engine/`) | Conditioning only |
| **Nutrition** | Existing separate repo — **out of scope here** | Food product; do not import or restore deleted nutrition packages into this tree |
| **This repo (`strengthside`)** | Shared backend | Supabase twelve-table migrations, Netlify WHOOP/Concept2 **proxy** functions, `@hybrid/adaptive` publish, evidence-platform. **Stops being the athlete UI source of truth** after cutover |

**Recovery** is out of all three products. Do not seed or show Recovery templates in the split apps.

## Shared backend (same Netlify + Supabase)

- **Postgres:** unchanged contract. This repo still owns the twelve strength tables. Hybrid stub owns the rest (including nutrition tables). Neither app writes migrations against the other's tables.
- **WHOOP / Concept2:** tokens and OAuth stay on `thehybridengine1.netlify.app`. Athlete Netlify sites stay **proxy-only**. New app ids get their own `redirect_uri` / deeplink **when Capacitor is forked** — not in the HTML seed.
- **Athlete session/template state** today is **device `localStorage`**, not those twelve tables. Split apps use **separate storage keys** so they never clobber each other. A shared cloud calendar is a later contract, not this cut.

## This repo until GitHub spin-out

This environment cannot create the two GitHub repos. Until you create them:

1. `apps/hybrid-strength/` and `apps/hybrid-engine/` are the extractable athlete trees.
2. `apps/mobile/` mixed Hybrid HTML remains the live Capgo/Netlify athlete until you cut over (so phone/web do not go dark).
3. `scripts/extract-hybrid-apps.sh` copies `apps/mobile/prototype/hybrid-app` into those trees and stamps `meta name="hybrid-product"`.

Cutover (later): stop deploying athlete HTML from this repo; each new repo ships its own Netlify site + Capgo app; this repo ships functions + migrations only.

## Product stamp

Each extract's `index.html` has:

```html
<meta name="hybrid-product" content="strength" />
<!-- or content="engine" -->
```

Runtime: `HYBRID_PRODUCT` is `strength` | `engine` | `combined`. Combined is the current mixed app (Recovery still present until mixed UI is retired).

## Out of this cut (still manual)

- Creating GitHub repositories / Play Console listings (this agent cannot)
- Mapping `appId` → native return scheme on **hybrid1** WHOOP/Concept2 OAuth
- Deleting `apps/mobile` athlete HTML (after both product sites + APKs are live)

Capacitor `applicationId`s, Netlify slugs, Capgo ship scripts, and proxy-only product trees **are in this cut**.
