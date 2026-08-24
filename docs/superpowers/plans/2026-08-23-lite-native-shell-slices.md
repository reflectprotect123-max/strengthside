# Plan — Lite native shell + Track Dawn punch + label scan

> Spec: `docs/superpowers/specs/2026-08-23-lite-native-shell-design.md`  
> Base: `cursor/engine-stage3-4920` (v42). Ship stamp target: **v43**.  
> Edit root: `apps/mobile/prototype/hybrid-app/` → `bash apps/mobile/sync-hybrid-html.sh`.

## Slice 0 — Branch + docs

- [ ] Branch `cursor/lite-native-shell-4920` from stage3
- [ ] Land design + this plan

## Slice 1 — Capacitor Android scaffold

- [ ] `apps/mobile/capacitor/` with Cap 6/7, `webDir` → `../preview-site`
- [ ] `npx cap add android`; gitignore build outputs as needed
- [ ] Scripts: `sync-hybrid-html.sh` then `cap sync`; `scripts/build-dogfood-apk.sh`
- [ ] README: how to produce the dogfood APK
- [ ] Commit: `feat: Capacitor Android shell for Hybrid HTML`

## Slice 2 — Wake lock for training

- [ ] Extract / extend wake helpers so **session active** (simple cond log OR strength `train`) acquires lock; leave/finish releases
- [ ] Cap KeepAwake when native; Screen Wake Lock when web
- [ ] Keep existing BLE-HR acquire path; unify release on pagehide / background
- [ ] Commit: `feat: wake lock for Engine and Strength sessions`

## Slice 3 — Label scan v1

- [ ] `label-scan.js` (+ optional Cap OCR plugin wrapper): photo → lines/text → `HybridNutrition.Core.parseLabel*`
- [ ] Nutrition UI: **Scan label** on day view / custom food; confirm sheet; fail soft
- [ ] Wire into sync script + index.html
- [ ] Commit: `feat: nutrition label scan confirm flow`

## Slice 4 — Medium Track Dawn polish

- [ ] Token / brand punch in sticky top; twin sticky grammar; safe-area / focus floor if gaps remain
- [ ] Light pass Home · Engine · Strength chrome · Settings — **no** engine math / strength-engine edits
- [ ] Slop audit (ban Inter / purple / glow / emoji chrome)
- [ ] Commit: `Polish: medium Track Dawn punch (v43)`

## Slice 5 — Ship

- [ ] `LOCAL_BUILD` + SW cache → `the-hybrid-athlete-engine-v43`
- [ ] Sync, handoff stamp, `pnpm run verify`
- [ ] PR + dogfood notes

## Regression gates

1. Do not edit `packages/strength-engine` decision logic.  
2. Do not remove web BLE HR path.  
3. Label scan never invents macros (`isEmptyLabel` → manual).  
4. Echo calories still never feed nutrition totals.
