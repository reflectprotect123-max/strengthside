# Splitting Hybrid Strength and Hybrid Engine into their own GitHub repos

This repository (`strengthside`) is the **shared backend** after cutover: twelve-table
Supabase migrations, Netlify WHOOP/Concept2 **proxy** functions, `@hybrid/adaptive`.
Nutrition already lives in a **different repo** — do not restore it here.

Until you create the two product repos, seeds live in this tree:

| Product | Seed | Product stamp |
| --- | --- | --- |
| Hybrid Strength | `apps/hybrid-strength/` | `<meta name="hybrid-product" content="strength" />` |
| Hybrid Engine | `apps/hybrid-engine/` | `<meta name="hybrid-product" content="engine" />` |
| Live mixed athlete (Capgo + thehybridsystem) | `apps/mobile/` | `content="combined"` |

**Do not delete `apps/mobile` in this cut.** Phone and web stay on the mixed app
until each new repo has its own Netlify site + Capgo app. Cutover is a later
decision: stop deploying athlete HTML from this repo, then this repo ships
functions + migrations only.

Refresh the seeds after prototype edits:

```bash
bash scripts/extract-hybrid-apps.sh
```

## Spin-out with `git subtree` (after you create empty GitHub repos)

This environment cannot create GitHub repositories. After you create them (example
names `hybrid-strength` and `hybrid-engine`):

```bash
# from this repo, on a commit that contains the seeds
git subtree split --prefix=apps/hybrid-strength -b split-hybrid-strength
git push git@github.com:<org>/hybrid-strength.git split-hybrid-strength:main

git subtree split --prefix=apps/hybrid-engine -b split-hybrid-engine
git push git@github.com:<org>/hybrid-engine.git split-hybrid-engine:main
```

Then add Capacitor / Play / Capgo app ids **in those repos**. Do not fork
`applicationId` `com.hybrid.athlete` in this cut.

## Storage

Sessions and templates are on-device `localStorage`, not the twelve Postgres
tables. Keys must stay separate:

- combined / live mixed: `THE-builder-clean-v1`
- Hybrid Strength: `THE-hybrid-strength-v1`
- Hybrid Engine: `THE-hybrid-engine-v1`

## Recovery

Dropped from the split products. Combined `apps/mobile` still shows Recovery so
the live app does not go dark before cutover.

## WHOOP / Concept2

Tokens and OAuth stay on `thehybridengine1.netlify.app`. New athlete sites stay
proxy-only (`_hybrid-proxy.mjs`). New OAuth `redirect_uri` hosts wait until
Capacitor is forked per product.
