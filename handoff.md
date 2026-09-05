# Handoff — TheStrengthEngine

> **AUTHORITATIVE CHECKPOINT — 4 September 2026 (blank slate shipped).**
> Chat history before this file is disposable. Start here.
>
> Spec: `docs/superpowers/specs/2026-09-03-blank-slate-zero-engines.md`
> Engine (Open / Next / Close): `docs/superpowers/specs/2026-09-03-engine-three-module-redesign.md`
> Engineering rules + twelve-table Supabase contract: `CLAUDE.md`

---

## 0. Read this first

| | |
| --- | --- |
| **Product** | Hybrid HTML athlete app only — Home · Library (dumb templates) · Calendar · Settings · manual logger |
| **Engines** | **`@hybrid/adaptive` only** (Open / Next / Close). Deleted engines stay dead — do not revive strength-engine, Big Mac, adapters. |
| **Next brain** | `@hybrid/adaptive` — living spec `2026-09-03-engine-three-module-redesign.md`. HTML doors: lift Log → `decideNextLift`; cond work slider → `decideNextCond`; holds → WorkOverlay only. |
| **Coach** | Parked static page only (`coach.html`) — no S&C publish/pull |
| **Edit athlete app** | `apps/mobile/prototype/hybrid-app/index.html` → `bash apps/mobile/sync-hybrid-html.sh` |
| **Branch** | `main` @ merge of blank-slate PR #161 |
| **Cache** | **`the-hybrid-athlete-blank-v174`** (`LOCAL_BUILD` + SW `CACHE` must match) |
| **Capgo** | **`dogfood` + `live` @ `1.0.55`** (cache blank-v174) |
| **Web** | https://thehybridsystem.netlify.app/ (auto-deployed from `main`) |
| **Companion** | `THE-HYBRID-ENGINE1` = shared-Supabase schema stub only — no apps |

**Ship ritual:** edit HTML → `bash apps/mobile/sync-hybrid-html.sh` → `pnpm run verify` → Capgo upload (`dogfood` then set `live`) → bump this handoff + `docs/RELEASE_NOTES.md`.

**Phone:** Settings → Check for updates → expect **1.0.55** (cache **blank-v174**).

**Do not revisit (owner lock):** ARC / multi-coach · Expo / second athlete shell · pain/illness product work · restoring deleted engine packages or old adapter/Big Mac/nutrition APIs from git history.

---

## 0.5 Secrets vault (agent recovery)

> **Private repo only.** Prefer Netlify UI for values never pasted in chat.

### Capgo OTA

| Key | Value |
| --- | --- |
| Token | repo-root `.capgo` (gitignored) or `CAPGO_TOKEN` |
| App ID | `com.hybrid.athlete` |
| Channels | **`dogfood` + `live`** both @ **`1.0.55`** |
| Upload dogfood | `CAPGO_CHANNEL=dogfood CAPGO_BUNDLE_VERSION=1.0.55 bash apps/mobile/capacitor/scripts/upload-capgo-bundle.sh` |
| Ship dogfood + live | `CAPGO_BUNDLE_VERSION=1.0.55 bash apps/mobile/capacitor/scripts/ship-capgo.sh` (fails hard without token) |
| Point live | from `apps/mobile/capacitor`: `npx @capgo/cli@latest channel set live com.hybrid.athlete --apikey "$CAPGO_TOKEN" --bundle 1.0.55` |
| CI | Actions → **Capgo ship** workflow (needs repo secret `CAPGO_TOKEN`) |

### OpenRouter · Supabase · WHOOP · Netlify

Unchanged. Athlete site: **thehybridsystem**. WHOOP ownership stays on hybrid1 Netlify; athlete site proxies.

### Coach

Parked. No publish/pull. Demo credentials and desktop shell are frozen until coach park lifts.

---

## 1. What exists on `main` now

### Alive

- Hybrid HTML shell + classic manual strength logger (kg × reps × RIR) + conditioning log chrome
- Session chrome / rest / work overlays
- Exercise search + load-profile **column UI** (metadata only — not an engine)
- WHOOP + Concept2 + Echo FTMS + Capgo live update
- Shared Supabase **twelve-table data ledger** (RLS + `embed-coaching-note`) — storage only
- Library starters (Full Body A, Aerobic, Recovery) as dumb templates
- `openVolume` field (was `autopilotVolume`) — open vs pinned sets×reps; no brain behind it

### Gone for good (do not restore)

| Layer | Deleted |
| --- | --- |
| Packages | `packages/` is **empty** — no `strength-engine`, `engine`, `shared-core`, `nutrition-engine`, `nutrition-core` |
| Athlete S&C wiring | adapters, bundles, Big Mac, one-set logger, cond autoreg, recovery trio, coordinator, strength AI/sync |
| Nutrition | UI, sync, food catalog, label scan |
| Netlify decide | `big-mac-decide`, `ai-strength-progression`, `ai-coach-intent` |
| Coach S&C | source + stubs; static park page only |
| Identifiers | Proxy stubs removed; no `StrengthAdapter` / `EngineAdapter` / `BigMacBridge` / `CoachSync` / `Autopilot` globals in live source |

`migrateOpenFields` on load renames legacy `autopilotVolume` → `openVolume` then deletes the old key.

### Evidence-platform

`evidence-platform/` is a separate Python governance tree — **not wired** to the athlete app. Do not treat it as a product engine.

---

## 2. What to do next

1. **Review the living engine spec** — `docs/superpowers/specs/2026-09-03-engine-three-module-redesign.md`.
2. After spec approval: implementation plan, then `@hybrid/adaptive`. Do not copy deleted module shapes.
3. Ignore old dogfood backlog rows that assumed coach publish, Big Mac hooks, or five engines — those tracks are closed.

**Useful checks**

```bash
pnpm run verify
pnpm run check:hybrid-html-sync
node apps/mobile/prototype/hybrid-app/blank-slate-wm.smoke.mjs
node apps/mobile/prototype/hybrid-app/autopilot-policy.smoke.mjs   # name-ban + openVolume shape
```

---

## 3. Rules (do not silently reverse)

- **Zero product engines** until the new adaptive package lands under a deliberate design.
- **Do not** recreate Expo / Home / PWA / coach portal / ARC.
- **Do not** move pain/illness into a specialist engine; flags stay unclassified product-wise.
- Strength decision logic, when it returns, stays **pure** (no I/O in the package).
- Migration filenames on the shared Supabase ledger are sacred — never rename applied migrations.
- Neither this repo nor the hybrid stub writes migrations against the other's tables.

---

## 4. Branches & ship record

| Ref | Note |
| --- | --- |
| `main` | Blank slate merged via PR **#161** (2026-09-04) |
| Capgo | **1.0.55** on `dogfood` + `live` |
| Netlify | Deploy athlete Netlify workflow **success** on merge commit |
| Dogfood APK | Workflow **success** on merge commit |
| Cache | `the-hybrid-athlete-blank-v174` |

**Next agent:** read this file + the blank-slate spec + the three-module engine spec + `CLAUDE.md`. Do not implement the package until that spec is approved and a plan exists.
