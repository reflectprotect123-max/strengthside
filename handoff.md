# Handoff — TheStrengthEngine

> **AUTHORITATIVE CHECKPOINT — 28 August 2026 (owner away).**
> **Chat may be cleared after this write — treat §0–§4 as the full memory.**
> **Product:** Hybrid HTML athlete app + Capgo/dogfood + Netlify. Coach = prototype only.
> **Companion `THE-HYBRID-ENGINE1`:** shared-Supabase schema stub only — no apps.
> Charter: `docs/superpowers/plans/2026-08-23-mono-athlete-app-charter.md`
> **`CLAUDE.md`** owns engineering rules and the twelve-table Supabase contract.

---

## 0. Read this first

| | |
| --- | --- |
| **Owner** | **Away for a while** — no product direction changes; do not start Decision Hub implementation until owner returns with a signed spec. |
| **Edit** | `apps/mobile/prototype/hybrid-app/index.html` → `bash apps/mobile/sync-hybrid-html.sh` |
| **`main` tip** | **`7642cdb`** (PR #92 + smoke **`a1801e1`**) |
| **Handoff branch** | `cursor/capgo-1-0-13-upload-84a0` @ **`895653d`** — Capgo 1.0.13 upload, secrets vault, Decision Hub briefing (**PR #93**) |
| **Cache** | **`the-hybrid-athlete-engine-v94`** (`LOCAL_BUILD` + SW `CACHE` together) |
| **Capgo** | **`dogfood` @ `1.0.13`** (uploaded 28 Aug) |
| **Web** | https://thehybridsystem.netlify.app/ |
| **Coach** | https://thehybridsystem.netlify.app/coach.html (prototype) |
| **APK** | https://github.com/reflectprotect123-max/strengthside/releases/tag/dogfood-latest |
| **Lost a token?** | **§0.5 Secrets vault** |
| **Decision Hub design chat** | `docs/decision-hub-chatgpt-briefing/START-HERE.md` · zip: `decision-hub-chatgpt-briefing.zip` |

**Five engines are wired on `main`.** Do not re-run “finish five-systems” or Phase 2 merge plans.

**Ship ritual:** `pnpm run verify` → sync HTML → bump cache → Capgo upload if dogfood moves → refresh this handoff (`git rev-parse --short HEAD`).

**Parked (do not start unless owner says):** Coordinator rename · pain/illness **stop** consumer · Expo / second athlete shell · Play Store / iOS store.

**Decision Hub:** unparked for **design only** — see **§2 Decision Hub**. Owner may refine externally (ChatGPT); **no code** until owner approves.

---

## 0.5 Secrets vault (agent recovery)

> **Private repo only.** Values recovered from agent chats + CI (28 Aug). **Netlify UI only** = value never pasted in chat — read from dashboard.

### Capgo OTA

| Key | Value |
| --- | --- |
| `CAPGO_TOKEN` / repo-root `.capgo` (gitignored) | `292f04bd-a0a6-490c-8b7d-03c234eb4915` |
| App ID | `com.hybrid.athlete` |
| Channel / bundle | `dogfood` / **`1.0.13`** |
| Upload | `CAPGO_BUNDLE_VERSION=1.0.13 bash apps/mobile/capacitor/scripts/upload-capgo-bundle.sh` |

Also store `CAPGO_TOKEN` in **Cursor Cloud environment secrets**.

### Supabase (shared hosted)

| Key | Value |
| --- | --- |
| Project ref | `orysjncrksmdfabpuftd` |
| `SUPABASE_URL` | `https://orysjncrksmdfabpuftd.supabase.co` |
| Region | `ap-southeast-2` |
| `SUPABASE_ANON_KEY` (public — in git) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yeXNqbmNya3NtZGZhYnB1ZnRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0MTE4NzksImV4cCI6MjA5OTk4Nzg3OX0.GTMBfFtH5O6SikzHo75sXGIZoEhmuJ7TvXiACd7T078` |

**Dashboard only:** `SUPABASE_SERVICE_ROLE_KEY` · `SUPABASE_ACCESS_TOKEN` (`sbp_…`) · `SUPABASE_DB_PASSWORD` · `VOYAGE_API_KEY` · `EMBED_WEBHOOK_SECRET`

GitHub secrets: https://github.com/reflectprotect123-max/strengthside/settings/secrets/actions

### WHOOP

| Key | Value |
| --- | --- |
| `WHOOP_CLIENT_ID` | `bbce411c-cbd1-446d-8663-709acf923cd8` |
| `WHOOP_CLIENT_SECRET` | Netlify UI only |
| Callback | `https://thehybridsystem.netlify.app/.netlify/functions/whoop-callback` |
| Webhook | `https://thehybridsystem.netlify.app/.netlify/functions/whoop-webhook` |
| Native return | `com.hybrid.athlete://whoop` |

### Concept2

| Key | Value |
| --- | --- |
| `CONCEPT2_CLIENT_ID` / `CONCEPT2_CLIENT_SECRET` | Netlify UI only |
| Callback | `https://thehybridsystem.netlify.app/.netlify/functions/concept2-callback` |

### Netlify

| Item | Value |
| --- | --- |
| Athlete site | `thehybridsystem` → https://thehybridsystem.netlify.app/ |
| Site ID (`thehybridsystem`) | `68423862-b052-43af-b482-162b711c8214` |
| Site ID (`thehybridengine1`, env clone source) | `31f93df6-ea71-440f-a6af-55bb5367a237` |
| `NETLIFY_AUTH_TOKEN` | GitHub secret — https://app.netlify.com/user/applications#personal-access-tokens |
| Site env UI | https://app.netlify.com/sites/thehybridsystem/configuration/env |

Production env keys present (27 Aug clone): `APP_BASE_URL`, `APP_SESSION_SECRET`, `WHOOP_*`, `CONCEPT2_*`, `SUPABASE_URL` (+ legacy `HYBRID_SITE`, `VITE_COACH_*`). Re-clone: `.github/workflows/copy-netlify-env-from-hybrid1.yml`

### GitHub Actions secret names

`NETLIFY_AUTH_TOKEN` · `NETLIFY_SITE_ID` · `HYBRID1_NETLIFY_SITE_ID` · `SUPABASE_ACCESS_TOKEN` · `SUPABASE_DB_PASSWORD` · `SUPABASE_DB_REGION` · `SUPABASE_SERVICE_ROLE_KEY`

### Coach demo (prototype — not prod auth)

| Email | Password |
| --- | --- |
| `dan@thehybrid.local` | `demo` |
| `veldman@`, `alex@`, `jordan@` `@thehybrid.local` | `demo` |

---

## 1. What's shipped (done — do not redo)

### Product surface

- **One athlete app:** Hybrid HTML (`index.html` + adapters). Nav: **Home · Library · Calendar · Settings**.
- **Five engines wired:** Strength · Conditioning · Nutrition · Recovery (debt row on Home) · Coordinator (silent only).
- **Strength cloud sync v3:** calendar + templates + progression; merge by `_meta.updatedAt`; same Supabase account syncs web ↔ phone. Spec: `docs/superpowers/specs/2026-08-24-strength-cloud-sync-design.md`.
- **Recovery:** delivery ledger, debt/repay, recovery sessions in cond logger, WHOOP strain background, gate overlay copy.
- **Integrations:** WHOOP + Concept2 Netlify functions on athlete site; native BLE HR/Echo on dogfood APK; Capgo OTA on `dogfood`.
- **Coach:** `coach.html` prototype — Supabase sign-in + offline demo; LogColumns builder twin (#92).
- **Verify:** `pnpm run verify` green; `dogfood-debt.smoke.mjs` in CI.

### Key merges on `main`

| PR | What |
| --- | --- |
| #59 | Full athlete shell UI polish |
| #58 | Bidirectional web↔phone sync (snapshot v3) |
| #92 | Recovery debt/repay, engine audit, coach LogColumns |
| #87–#90 | WHOOP pipeline hardening, settings scroll, coach sign-in, Netlify deploy |
| Earlier | Five-systems wiring, TrainHeroic import, builder/logger alignment, Capgo wiring, hybrid repo split |

### Deploy artifacts (28 Aug)

| Artifact | State |
| --- | --- |
| Netlify | Deploys from `main` (`.github/workflows/deploy-athlete-netlify.yml`) |
| Dogfood APK | **v94** @ `7642cdb` via CI |
| Capgo | **`1.0.13`** uploaded to `dogfood` |
| Cache stamp | **`the-hybrid-athlete-engine-v94`** |

---

## 2. What's open (do this next)

> **Owner away:** prefer bugfixes, verify green, and §2 checklist items that need no product calls. Do **not** implement Decision Hub (§2 below) without owner sign-off.

### Checklist (product — resume when owner returns)

- [ ] **Phone dogfood proof** — Settings → Update (Capgo 1.0.13); strapless cond → recovery session → **debt row moves** on Home
- [ ] **Hybrid week in Library + Calendar** — encode concurrent strength + conditioning templates; place on calendar; prove web↔phone sync
- [ ] **Logger friction** — fewer taps, clearer rest/next, sane mid-block exit after a real phone session
- [ ] **Merge PR #93** — handoff + secrets vault + Decision Hub briefing onto `main`
- [ ] **Handoff stamp** — refresh §0 tip/cache/PRs after each ship

### Optional / lower priority

- **PR #91** — coach UI polish (draft, CI red) — finish or close
- **Pain/illness stop** — flags exist; nothing consumes them unless product decides

### Decision Hub (design track — **not approved for build**)

Owner unparked this for architecture discussion (28 Aug). **Design only until owner returns.**

| Locked intent | Detail |
| --- | --- |
| **Purpose** | **Automation** — silent decisions applied through existing adapters. **Not** explanation, chat, or weekly AI brief. |
| **No LLM** | No GPT/Claude/embeddings for decisions. Deterministic **rule engine / expert system**. |
| **Five engines** | Strength · Conditioning · Nutrition · Recovery · Coordinator — each feeds a **rich athlete snapshot** (not today’s thin 7-day Coordinator receipts). |
| **Static libraries** | Versioned playbooks per engine (rules, tables, examples) — built once, interpreted each run. |
| **Five interpreters** | Per-engine pipeline: static lib + snapshot → typed **domain decision** (JSON). |
| **System output** | Coordinator layer merges five domain decisions → **`SystemDecision`** → validators → silent apply. |
| **Pure engine package** | `@hybrid/strength-engine` stays zero I/O; interpreters live in adapters / new modules. |
| **Phase F** | `coaching_note` / embed infra exists; **optional** for v1 — notes may be compiled into static rules manually. |

**Suggested build order (when approved):** (1) snapshot schemas + exporters, (2) Strength interpreter + static lib, (3) Recovery → Cond → Nutrition, (4) Coordinator merge, (5) deepen static libs.

**Briefing for external design chat:** `docs/decision-hub-chatgpt-briefing/` (also `decision-hub-chatgpt-briefing.zip` on PR #93 branch).

**Do not:** add LLM calls, athlete-facing AI UI, weekly Coordinator peek, training blocks, or re-litigate five-systems wiring.

### Dogfood proof commands

```bash
node apps/mobile/prototype/hybrid-app/dogfood-debt.smoke.mjs
pnpm run verify
```

---

## 3. Rules (do not silently reverse)

### Naming

| Engine | Athlete name | Visible? |
| --- | --- | --- |
| Strength | Hybrid Strength | Yes — Library / log / Progress |
| Conditioning | The Engine | Yes — Home / HR log |
| Nutrition | Nutrition | Yes — Home daily log |
| Recovery | — | Debt row on Home only |
| Coordinator | — | Invisible (no weekly peek) |

- **The Engine** = conditioning (never “Morpheus” in athlete UI).
- CSS `mph-*` = legacy; do not reintroduce two-dial-only framing.

### Product locks

- Everyday Readiness / SZN lifts **retired** · Guide / block-help **off**
- Coach / ARC / Expo as parallel products **cancelled**
- **Silent apply** for progression + Coordinator — no accept/decline UI
- **Soft volume** — never block save
- Training never blocked; pain Yes holds **strength bumps** only
- Illness = record-only (no auto-stop)
- Do not use HRV as pain/injury/illness gate
- `@hybrid/strength-engine` stays **pure** (zero I/O)
- Pain/illness flags raised; **nothing stops training** (inherited gap)

### Easy traps

- `NutritionUI.openWeeklyReview` = nutrition check-in (keep). Coordinator weekly peek stays **gone**.
- `coordinator.smoke.mjs` pins `completedAt` — do not revert to `Date.now()`.
- Stamp `_meta.updatedAt` on `makeSession` / `saveTemplate` for sync merge.
- Recovery **debt row** is the only Recovery dial — no second recovery product surface.
- iOS Safari: no Web Bluetooth — typed Avg HR or native BLE on APK.
- Local migrations check needs OS pgvector — known gap, not a defect.

### Conditioning logger (unchanged)

- HR: Web Bluetooth (Chrome Android/desktop) or native BLE on APK
- Start/Pause → Complete → zone summary; Back → Home pauses BLE, 120s watch

---

## 4. Paths & PRs

```
apps/mobile/prototype/hybrid-app/index.html
apps/mobile/prototype/hybrid-app/strength-sync.js
apps/mobile/prototype/hybrid-app/recovery-engine.js
apps/mobile/prototype/hybrid-app/whoop.js
apps/mobile/prototype/hybrid-app/service-worker.js
apps/mobile/sync-hybrid-html.sh
apps/mobile/capacitor/scripts/upload-capgo-bundle.sh
packages/strength-engine/
docs/decision-hub-chatgpt-briefing/START-HERE.md
CLAUDE.md
```

| PR | Status |
| --- | --- |
| **#93** | Handoff + secrets vault + Capgo 1.0.13 proof + Decision Hub briefing — merge when owner back |
| **#91** | Coach UI polish — draft, CI red |

Closed draft PRs (#2–#14, #32, #41, #56, …) are obsolete vs tip unless `git log main..branch` shows unique salvage.

**Storage:** `localStorage` `THE-builder-clean-v1` + nutrition DB · cloud via StrengthSync snapshot v3 · Postgres: twelve owned tables per `CLAUDE.md`.
