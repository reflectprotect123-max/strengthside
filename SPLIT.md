# Splitting Hybrid Strength and Hybrid Engine

This repository (`strengthside`) is the **shared backend** after cutover: twelve-table
Supabase migrations, Netlify WHOOP/Concept2 **proxy** functions, `@hybrid/adaptive`.
Nutrition already lives in a **different repo** — do not restore it here.

| Product | Tree | Android / Capgo | Netlify | Storage |
| --- | --- | --- | --- | --- |
| Hybrid Strength | `apps/hybrid-strength/` | `com.hybrid.strength` | slug `hybrid-strength` → https://hybrid-strength.netlify.app | `THE-hybrid-strength-v1` |
| Hybrid Engine | `apps/hybrid-engine/` | `com.hybrid.engine` | slug `hybrid-engine` → https://hybrid-engine.netlify.app | `THE-hybrid-engine-v1` |
| Live mixed (until cutover) | `apps/mobile/` | `com.hybrid.athlete` | `thehybridsystem` | `THE-builder-clean-v1` |

**Do not delete `apps/mobile` until both product sites and APKs are live.** Phone/web stay on the mixed app so they do not go dark.

Refresh HTML + Capacitor forks after prototype edits:

```bash
bash scripts/extract-hybrid-apps.sh
```

## Ship

```bash
# Android debug APKs (needs ANDROID_HOME)
PRODUCT=strength bash scripts/build-product-apk.sh
PRODUCT=engine bash scripts/build-product-apk.sh

# Capgo (needs CAPGO_TOKEN / .capgo). Create Capgo apps first if missing.
PRODUCT=strength CAPGO_BUNDLE_VERSION=1.0.0 bash scripts/ship-product-capgo.sh
PRODUCT=engine CAPGO_BUNDLE_VERSION=1.0.0 bash scripts/ship-product-capgo.sh
```

GitHub Actions: **Deploy Hybrid Strength Netlify**, **Deploy Hybrid Engine Netlify** (skip until `NETLIFY_SITE_ID_STRENGTH` / `NETLIFY_SITE_ID_ENGINE` exist), **Capgo ship products**. Mixed **Capgo ship** / **Deploy athlete Netlify** still target `com.hybrid.athlete` / `thehybridsystem` only.

Best-effort cloud create (no secrets in git):

```bash
bash scripts/provision-product-clouds.sh
```

## Spin-out with `git subtree`

This environment cannot create GitHub repositories (`gh` is read-only). After you create empty repos:

```bash
git subtree split --prefix=apps/hybrid-strength -b split-hybrid-strength
git push git@github.com:<org>/hybrid-strength.git split-hybrid-strength:main

git subtree split --prefix=apps/hybrid-engine -b split-hybrid-engine
git push git@github.com:<org>/hybrid-engine.git split-hybrid-engine:main
```

## WHOOP / Concept2

Tokens and OAuth **callback host** stay `thehybridengine1.netlify.app`. Product sites stay **proxy-only**.

Native connect forwards `appId` (`com.hybrid.strength` / `com.hybrid.engine`) so hybrid1 can return `com.hybrid.strength://` vs `com.hybrid.athlete://`. Until hybrid1 maps those app ids, OAuth return still lands on the mixed scheme — that change is on the hybrid1 repo, not here.

## Recovery / Nutrition

Recovery is dropped from the split products. Combined `apps/mobile` still shows it. Nutrition is not this repo.

## Play Console

Listings and signing keys are account work this agent cannot do. Use `applicationId`s above; do not reuse `com.hybrid.athlete` for the split APKs.
