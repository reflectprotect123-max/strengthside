# Handoff — TheStrengthEngine

> **AUTHORITATIVE CHECKPOINT — 6 September 2026 (Capgo 1.0.61 OTA).**
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
| **Next brain** | `@hybrid/adaptive` in `packages/adaptive` — living spec `2026-09-03-engine-three-module-redesign.md`. HTML doors: lift Log → `decideNextLift`; cond work slider → `decideNextCond`; holds → WorkOverlay only. Bundled to `apps/mobile/prototype/hybrid-app/adaptive-bundle.js` as `HybridAdaptive`. |
| **Coach** | Parked static page only (`coach.html`) — no S&C publish/pull |
| **Edit athlete app** | `apps/mobile/prototype/hybrid-app/index.html` → `bash apps/mobile/sync-hybrid-html.sh` |
| **Branch** | Feature work ships on `cursor/*-0ae6`; `main` is the dogfood base |
| **Cache** | **`the-hybrid-athlete-blank-v190`** (`LOCAL_BUILD` + SW `CACHE` must match) |
| **Capgo** | **`dogfood` + `live` @ `1.0.61`** (blank-v190) |
| **Web** | https://thehybridsystem.netlify.app/ (auto-deployed from `main`) |
| **Companion** | `THE-HYBRID-ENGINE1` = shared-Supabase schema stub only — no apps |

**Ship ritual:** edit HTML → `bash apps/mobile/sync-hybrid-html.sh` → `pnpm run verify` → Capgo upload (`dogfood` then set `live`) → bump this handoff + `docs/RELEASE_NOTES.md`.

**Phone:** Settings → Check for updates → expect **1.0.61** / blank-v190.

**Do not revisit (owner lock):** ARC / multi-coach · Expo / second athlete shell · pain/illness product work · restoring deleted engine packages or old adapter/Big Mac/nutrition APIs from git history.

---

## 0.5 Secrets vault (agent recovery)

> **Private repo only.** Prefer Netlify UI for values never pasted in chat.
>
> **New agent boot:** Capgo token lives in this vault table. Rematerialize gitignored `.capgo` with
> `bash scripts/rematerialize-capgo-from-vault.sh` (env `start` + ship scripts do this automatically).

### Capgo OTA

| Key | Value |
| --- | --- |
| Token | `292f04bd-a0a6-490c-8b7d-03c234eb4915` — **source of truth** in this table → rematerialize to gitignored `.capgo` (or `CAPGO_TOKEN`) |
| App ID | `com.hybrid.athlete` |
| Channels | **`dogfood` + `live`** both @ **`1.0.61`** (blank-v190) |
| Rematerialize | `bash scripts/rematerialize-capgo-from-vault.sh` |
| Upload dogfood | `CAPGO_CHANNEL=dogfood CAPGO_BUNDLE_VERSION=<ver> bash apps/mobile/capacitor/scripts/upload-capgo-bundle.sh` |
| Ship dogfood + live | `CAPGO_BUNDLE_VERSION=<ver> bash apps/mobile/capacitor/scripts/ship-capgo.sh` (fails hard without token) |
| Point live | from `apps/mobile/capacitor`: `npx @capgo/cli@latest channel set live com.hybrid.athlete --apikey "$CAPGO_TOKEN" --bundle <ver>` |
| CI | Actions → **Capgo ship** workflow (needs repo secret `CAPGO_TOKEN`) |

### OpenRouter · Supabase · WHOOP · Netlify

Unchanged. Athlete site: **thehybridsystem**. WHOOP ownership stays on hybrid1 Netlify; athlete site proxies.

### Coach

Parked. No publish/pull. Demo credentials and desktop shell are frozen until coach park lifts.

---

## 1. What exists on `main` / current tree now

### Alive

- Hybrid HTML shell + classic manual strength logger (kg × reps × RIR) + conditioning log chrome
- Session chrome / rest / work overlays
- Exercise search + load-profile **column UI** (metadata only — not an engine)
- WHOOP + Concept2 + Echo FTMS + Capgo live update
- Shared Supabase **twelve-table data ledger** (RLS + `embed-coaching-note`) — storage only
- Library starters (Full Body A, Aerobic, Recovery) as dumb templates
- `openVolume` field (was `autopilotVolume`) — open vs pinned sets×reps; brain is `@hybrid/adaptive` Open/Next/Close only
- **`packages/adaptive`** — pure Open / Next / Close for lift + cond (vitest colocated). This is the only product engine.

### Sync honesty (important)

`Whoop.syncAll` refreshes **WHOOP recovery** and **Concept2 Logbook** when linked. It does **not** sync calendar sessions or Library templates. Training state is **localStorage** on device (plus local recovery snapshot). Settings + WHOOP card copy must stay honest about that until Phase S implements the written contract: `docs/superpowers/specs/2026-09-05-session-template-sync-contract.md`.

### Gone for good (do not restore)

| Layer | Deleted |
| --- | --- |
| Old packages | No `strength-engine`, `engine`, `shared-core`, `nutrition-engine`, `nutrition-core` — those stay deleted. **`packages/adaptive` is the exception and is live.** |
| Athlete S&C wiring | adapters, Big Mac, one-set logger, cond autoreg, recovery trio, coordinator, strength AI/cloud sync |
| Nutrition | UI, sync, food catalog, label scan |
| Netlify decide | `big-mac-decide`, `ai-strength-progression`, `ai-coach-intent` |
| Coach S&C | source + stubs; static park page only |
| Identifiers | Proxy stubs removed; no `StrengthAdapter` / `EngineAdapter` / `BigMacBridge` / `CoachSync` / `Autopilot` globals in live source |

`migrateOpenFields` on load renames legacy `autopilotVolume` → `openVolume` then deletes the old key.

### Evidence-platform

`evidence-platform/` is a separate Python governance tree — **not wired** to the athlete app. Do not treat it as a product engine.

---

## 2. What to do next

1. Keep `@hybrid/adaptive` pure; HTML is the only athlete UI surface.
2. Cloud journal / session+template sync: contract is written (Phase M); **implement in Phase S** per `docs/superpowers/specs/2026-09-05-session-template-sync-contract.md` — not a drive-by restore of deleted sync code.
3. Capgo **1.0.61** shipped 6 Sep 2026 (dogfood + live, blank-v190). Next OTA: bump cache + bundle together.

**Useful checks**

```bash
pnpm run verify
pnpm run check:hybrid-html-sync
pnpm run check:adaptive-bundle
pnpm run check:adaptive-logger
pnpm run check:adaptive-routes
node apps/mobile/prototype/hybrid-app/blank-slate-wm.smoke.mjs
node apps/mobile/prototype/hybrid-app/autopilot-policy.smoke.mjs   # name-ban + openVolume shape
```

---

## 3. Rules (do not silently reverse)

- **One product engine:** `@hybrid/adaptive`. Do not revive deleted engines or invent a second brain.
- **Do not** recreate Expo / Home / PWA / coach portal / ARC.
- **Do not** move pain/illness into a specialist engine; flags stay unclassified product-wise.
- Adaptive decision logic stays **pure** (no I/O in the package).
- Migration filenames on the shared Supabase ledger are sacred — never rename applied migrations.
- Neither this repo nor the hybrid stub writes migrations against the other's tables.
- Cache pins: bump `LOCAL_BUILD` and SW `CACHE` together; Capgo version is a separate ship step.

---

## 4. Branches & ship record

| Ref | Note |
| --- | --- |
| `main` | Merged Cond adaptive + OLED + suggest-close + Capgo vault; OTA **1.0.61** / blank-v190 |
| Capgo | **1.0.61** on `dogfood` + `live` |
| Cache | `the-hybrid-athlete-blank-v190` |
| Recent product | Cond Actual/RPE→Next · Threshold · rpm Open/Close · Pace anchors · Engine Analytics · OLED Home/Library |

**Next agent:** read this file + `CLAUDE.md` + the adaptive living spec. Prefer fixing HTML doors and `@hybrid/adaptive` contracts over restoring deleted packages. Nutrition stays in `archive/` only.
