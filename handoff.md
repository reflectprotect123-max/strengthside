# Handoff — TheStrengthEngine

> **AUTHORITATIVE CHECKPOINT — 9 September 2026 (Brain spine reset).**
> Chat history before this file is disposable. Start here.
>
> **Architecture:** `packages/brain/` = The Brain (pure logic). `apps/athlete/` = athlete UI + Netlify deploy root.
> Old monolithic `prototype/hybrid-app/` is **deleted** — not archived.
>
> Engineering rules + twelve-table Supabase contract: `CLAUDE.md`

---

## 0. Read this first

| | |
| --- | --- |
| **Product** | Hybrid HTML athlete app — Brain hub + Strength / Engine / Nutrition branches (rebuilt screen-by-screen) |
| **The Brain** | `@hybrid/brain` in `packages/brain/` — readiness, today’s call, coach context. **Not HTML.** |
| **Athlete UI** | `apps/athlete/` — edit `index.html`, `app.js`, `home.css` |
| **Build** | `bash scripts/sync-athlete-app.sh` → bundles brain + adaptive into `apps/athlete/` |
| **Coach chat** | In-app sheet → `brain-coach` proxy on athlete Netlify → OpenRouter on Brain owner site |
| **Branch** | Feature work ships on `cursor/*-0ae6`; `main` is the dogfood base |
| **Storage** | **`THE-brain-v1`** only — no import from old `THE-builder-clean-v*` |
| **Capgo** | **`dogfood` + `live`** — bump version on each OTA ship |
| **Ship** | Capgo OTA + dogfood APK only — **Netlify is retired** |
| **One login** | Supabase auth + WHOOP (`u:{userId}`) + plan sync domains `strength_side` / `engine_side` |
| **Brain owner** | **`the-brain`** repo (`reflectprotect123-max/the-brain`) — Netlify `thehybridengine1.netlify.app` + shared Supabase stub |

**Ship ritual:** edit `apps/athlete/` → `bash scripts/sync-athlete-app.sh` → `pnpm run check:athlete-app` → Capgo upload (`CAPGO_BUNDLE_VERSION=<ver> bash apps/mobile/capacitor/scripts/ship-capgo.sh`) → bump this handoff + `docs/RELEASE_NOTES.md`.

**Hosted Supabase (shared):** apply `the-hybrid-engine1` migrations `20260915_*` (or run `scripts/hosted-ecosystem-hybrid-sc-domains.sql` in SQL editor) before plan sync can write `strength_side` / `engine_side`.

**Do not revisit (owner lock):** ARC / multi-coach · Expo / second athlete shell · restoring deleted `prototype/hybrid-app/` · pain/illness product work · old adapter/Big Mac APIs from git history.

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
| Channels | **`dogfood` + `live`** — target **1.0.90** (WHOOP SW bypass + clearer down message) |
| Rematerialize | `bash scripts/rematerialize-capgo-from-vault.sh` |
| Upload dogfood | `CAPGO_CHANNEL=dogfood CAPGO_BUNDLE_VERSION=<ver> bash apps/mobile/capacitor/scripts/upload-capgo-bundle.sh` |
| Ship dogfood + live | `CAPGO_BUNDLE_VERSION=<ver> bash apps/mobile/capacitor/scripts/ship-capgo.sh` (fails hard without token) |
| Point live | from `apps/mobile/capacitor`: `npx @capgo/cli@latest channel set live com.hybrid.athlete --apikey "$CAPGO_TOKEN" --bundle <ver>` |
| CI | Actions → **Capgo ship** workflow (needs repo secret `CAPGO_TOKEN`) |

### OpenRouter (Brain owner site)

| Key | Value |
| --- | --- |
| Key (base64) | `c2stb3ItdjEtNWZkZmIzZGVmNjIwZGViN2Q0YzdhZmI1YmI1NzczNDhlZGM2ZWM1YWE1ZTFjMjE2ZTY2YThlOTQwMjk3ZjA3OAo=` → rematerialize to gitignored `.openrouter` |
| Model | `openrouter/free` (Netlify env `OPENROUTER_MODEL` on **Brain owner site**) |
| Owner site | **thehybridengine1** (Netlify slug; see `docs/brain-repo-rename.md`) — real `brain-coach` + `OPENROUTER_API_KEY` |
| Athlete site | **thehybridsystem** — `brain-coach.mjs` is **proxy-only** (same lane as WHOOP) |
| Rematerialize | `bash scripts/rematerialize-openrouter-from-vault.sh` |
| Push to Netlify | `NETLIFY_AUTH_TOKEN=… node scripts/set-openrouter-netlify.mjs --deploy-coach` |
| CI | `.github/workflows/set-openrouter-netlify.yml` on `main` |

### Supabase · WHOOP · Netlify

Athlete site: **thehybridsystem**. WHOOP + OpenRouter ownership stay on **The Brain repo** Netlify site (`thehybridengine1.netlify.app`); athlete site proxies.

### Coach

Parked. No publish/pull. Demo credentials and desktop shell are frozen until coach park lifts.

---

## 1. What exists on `main` / current tree now

### Alive

- Hybrid HTML shell + **The Engine** (conditioning builder/logger/analytics) + **Recovery** tab
- Session chrome / rest / work overlays
- WHOOP + Concept2 + Echo FTMS + Capgo live update
- Shared Supabase **twelve-table data ledger** (RLS + `embed-coaching-note`) — storage only
- Library starters (**Aerobic Conditioning + Recovery** only; Full Body strength starters removed)
- **`packages/adaptive`** — pure cond Open / Next / Close (vitest colocated). Lift modules deleted.
- **`strengthCutV1` migrate** — nuclear wipe of sessions + strength templates/state on first load after cut

### Legacy assets (kept, not product)

- `exercise-search*.js`, `log-columns.js`, `exercise-load-profiles.js` still loaded by index.html for dead/legacy strength helpers — **not** reachable in Engine/Recovery product paths. Safe to delete in a later cleanup pass once grep confirms zero live references.

### Sync honesty (important)

`Whoop.syncAll` refreshes **WHOOP recovery** and **Concept2 Logbook** when linked. **PlanSync** (`strength_side`) copies Library templates + calendar/logger sessions in the background when signed in — no extra Me chrome. Owner lock: `docs/superpowers/specs/2026-09-11-plan-sync-silent.md`. Device stays source of truth until ack. The Brain can pull the same domain later.

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
2. Cloud journal: Strength Side `PlanSync` (`strength_side`) is live — The Brain consumes that domain later. Do not restore deleted `StrengthSync`.
3. After merging audit fixes: Capgo ship with matching `LOCAL_BUILD` / SW cache / bundle version.

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
| `main` | Blank slate via PR **#161**; Whoop dials OTA at **1.0.60** / blank-v179 |
| Capgo | still **1.0.74** (no OTA this ship) |
| Dogfood APK | rest timer + coach on **+** only (no Chat tab); native coach hits athlete Netlify; cache **the-brain-v9** |
| Engine vs Strength log | Strength **tracks the locked column catalog** in `docs/superpowers/specs/2026-09-11-strength-track-lock.md` (Sets + picker columns + For Completion). Watts/metres on a lift is a Strength column, not The Engine. Engine (later) = splits + Concept2/RPM; the same timer chrome is the **duration** clock for the piece. Do not mix those loggers. |
| Cache | `the-brain-v9` |
| Strength cut | Hybrid Strength removed; `strengthCutV1` nuclear migrate; verify gates `cut-strength-*` smokes |

**Track lock (11 Sep 2026):** Strength log columns frozen — `docs/superpowers/specs/2026-09-11-strength-track-lock.md`. Calendar door: Library template → Add to Calendar (self + date) → Training Start Session.

**Library Sessions (11 Sep 2026):** On-phone builder is live in `apps/athlete/library.js` + `library-ui.js`. Persist on-device. No Capgo unless **IMPORTANT**.
**Next agent:** Library / on-phone builder against that lock. Do not Capgo unless the owner marks **IMPORTANT**.


## New HTML live-HR checkpoint — 3 October 2026

The Android 1.1.1 APK uses `apps/athlete/conditioning/`, built from `source.html`
by `scripts/conditioning/build.mjs`. Its dedicated Capgo channel `engine-html`
now offers bundle **1.1.4**. Older app channels remain unchanged.

The user reported HR and the horseshoe remaining at 47. The central number is
raw Bluetooth HR; synthetic 8-bit/16-bit packets reproduce no 47 ceiling. The
fill remains a linear mapping from the configured Blue lower boundary to max HR;
no physiological values or boundaries were fabricated to increase it.

**STRENGTHSIDE-DESIGNED:** notification liveness now distinguishes live readings
from an idle Bluetooth connection, retries subscriptions after stale readings
with a 15-second cooldown, clears contact-invalid/stale values, and ignores old
native callbacks after unsubscribe/disconnect. The five-minute no-reading
threshold disconnects the monitor while preserving the workout timer.

Validation: native smoke exercises 47–192 bpm, full sweep, stale retry/cooldown,
contact loss/recovery, typed-view offsets and late callbacks after disconnect.
New HTML/WHOOP Home/Capgo smoke checks and repository `verify` passed. The offered
1.1.4 download checksum and HTML/native bytes match the tested files. Actual
WHOOP hardware was unavailable; the reported physical cause is not established.


## Pending Karvonen/settings changes — 3 October 2026

User explicitly requested **no Capgo deployment yet**. The offered bundle remains
1.1.4; local generated HTML contains unpublished automatic zone/settings work.

See `docs/conditioning-zone-settings.md`. Karvonen estimates Blue/Green/Red starts
at 50/70/85% HR reserve, using entered max HR and a WHOOP 28-calendar-day resting-HR
mean (or explicit override). Cutoffs are **STRENGTHSIDE-DESIGNED**. Existing custom
boundaries are preserved until Calculate zones is selected. Settings saves leave
active workout boundaries frozen; explicit in-workout saves record the update.
The existing daily recovery adjustment remains, and settings data tools are folded.

Unit/HTML/Home/native/Capgo smoke checks and repository `verify` pass. This is local
validation, not evidence of publication or a physical WHOOP test. Do not run a
Capgo shipment until the user requests it.


## Pending Settings Onboarding — 3 October 2026

User requested a Settings Onboarding entry that asks questions individually,
closes after completion and becomes greyed out. This is implemented locally;
**no Capgo release**. Dedicated channel remains 1.1.4.

`onboarding-model.js` validates age (18–100), fitness, goal, maximum HR mode and
resting-HR source. Unknown max uses rounded Tanaka `208 − 0.7 × age`, with an
explicit known-max override and versioned provenance. `onboarding.js` presents
one question per dialog page, conditionally asks for missing/manual resting HR,
and reviews the derived baseline before Finish. Existing workouts retain their
zone snapshots. Cancel/Back/Escape work; no boot-time auto-opening.

Completion disables the Onboarding button as Completed; Edit fitness setup is
separate. Profile and completion metadata are included in the existing
`conditioning_settings` plan-sync payload and native/local backup. Unit tests
verify account storage round-trip; no schema or production database changes.
Fitness/goal remain metadata pending defined conditioning/dose rules.

Validation: model/storage tests, browser question/completion/reload/edit/cancel
flow, native HR/WHOOP Home/Capgo smoke and repository verify pass. Browser
screenshots are `/workspace/previews/onboarding-review.png` and
`/workspace/previews/onboarding-completed.png`. Physical phone verification is
pending. Do not publish Capgo without the user's new instruction.


## Published new HTML 1.1.5 — 3 October 2026

User explicitly instructed “capgo it all”, superseding the earlier deployment
hold. Capgo channel `engine-html` now points to **1.1.5** for Android APK 1.1.1.
No native reinstall is needed; the older live/dogfood channels were not targeted.

Includes all pending Karvonen, age-estimated/known maximum, simplified Settings
and opt-in Onboarding work. Fitness/goal answers are stored; undefined fitness
zone offsets and automatic weekly progression were not invented or enabled.

Model/storage/zone tests, browser onboarding/WHOOP/native regression checks and
Capgo smoke passed. A fresh update request offered 1.1.5; downloaded ZIP checksum
and HTML/native bytes match the tested build. The first unqualified update request
returned cached 1.1.4; a cache-busting verification request returned the new bundle.
Artifact: `/workspace/previews/The-Hybrid-Engine-Capgo-1.1.5.zip`.

Phone installation/physical WHOOP validation remains unobserved. User installs
via Settings → Check for updates → Restart now after ending the workout, then
Settings → Onboarding. Prior completion remains available through Edit.
