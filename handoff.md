# Handoff — TheStrengthEngine

> **AUTHORITATIVE CHECKPOINT — 2 September 2026.**
> **Chat may be cleared after this write — treat §0–§4 as the full memory.**
> **Product:** Hybrid HTML athlete app + Capgo/dogfood + Netlify. Coach = same URL; **real path** = Supabase sign-in + cloud publish → athlete pull.
> **Companion `THE-HYBRID-ENGINE1`:** shared-Supabase schema stub only — no apps.
> Charter: `docs/superpowers/plans/2026-08-23-mono-athlete-app-charter.md`
> **`CLAUDE.md`** owns engineering rules and the twelve-table Supabase contract.

---

## 0. Read this first

| | |
| --- | --- |
| **Edit athlete app** | `apps/mobile/prototype/hybrid-app/index.html` → `bash apps/mobile/sync-hybrid-html.sh` |
| **`main` tip** | **`9e93e65`** (#139 builder rest/recap previews + merged superset cards — cache v147) |
| **Open PR** | — |
| **Cache** | **`the-hybrid-athlete-engine-v147`** (`LOCAL_BUILD` + SW `CACHE` together) |
| **Capgo** | **`dogfood` @ `1.0.44`** (builder rest/recap previews + merged superset cards; cache v147) — **uploaded** |
| **Web** | https://thehybridsystem.netlify.app/ |
| **Coach** | https://thehybridsystem.netlify.app/coach.html |
| **Coach Windows** | https://github.com/reflectprotect123-max/strengthside/releases/tag/coach-desktop-latest |
| **Athlete APK** | https://github.com/reflectprotect123-max/strengthside/releases/tag/dogfood-latest |
| **OpenRouter** | Live on **thehybridsystem** Netlify (`ai-strength-progression`, `big-mac-decide` JS shim) |
| **Decision Hub** | Parked — `docs/decision-hub-chatgpt-briefing/START-HERE.md` |

**Ship ritual:** `pnpm run verify` → sync HTML → Capgo upload if bundle moves → refresh this handoff.

**Do not revisit (owner lock — Sep 2026):** ARC / multi-coach · Expo / second athlete shell · **pain / illness** (classification may remain in code; **no agent work** — consumption, stops, gates, or new UI). Pain/illness product work is **grokbot**'s lane; treat as **out of scope** here.

**Owner lock — Sep 2026 (ops):** **Coach parked** — no coach portal / desktop / publish-loop work unless owner asks. **No deploys** (Capgo, Netlify, coach `.exe`, migrations) until owner explicitly says ship.

**Recent merges (#147–#149):** builder rest preview hidden · builder name edit + calibration slider · **metric-aware logger program (M1–M8, cache v157)** — 1–3 builder metric columns, library defaults on pick, dynamic logger hero, work timer for holds, load+time/carry flows, timed-hold progression fix, L/R sideMode.

**Metric logger (branch `cursor/metric-logger-slice-plan-84a0`, build `the-hybrid-athlete-engine-v157`):** Builder chrome frozen at v153 layout; athletes prescribe load/reps/time/distance via dropdowns; logger mirrors columns; plank gets work timer → slider → rest; farmer walk 3-col; Capgo OTA pending owner ship.

---

## 0.5 Secrets vault (agent recovery)

> **Private repo only.** **Netlify UI only** = value never pasted in chat.

### Capgo OTA

| Key | Value |
| --- | --- |
| `CAPGO_TOKEN` / repo-root `.capgo` (gitignored) | see vault |
| App ID | `com.hybrid.athlete` |
| Channel / bundle | `dogfood` / **`1.0.44`** |
| Upload | `CAPGO_BUNDLE_VERSION=1.0.30 bash apps/mobile/capacitor/scripts/upload-capgo-bundle.sh` |

### OpenRouter · Supabase · WHOOP · Netlify

Unchanged — see prior vault entries. Athlete site: **thehybridsystem**. OpenRouter on Netlify (not hybrid1).

### Coach access

| Mode | How |
| --- | --- |
| **Real (cloud)** | Supabase sign-in on coach.html → roster athlete UUID → **Publish** → athlete pull |
| **Demo (offline)** | `dan@thehybrid.local` / `demo` — local bridge only |
| **Windows shell** | Install from **coach-desktop-latest** release; UI OTA via Netlify reload |

---

## 1. What's shipped on `main` (do not redo)

- **Athlete app:** Hybrid HTML — Home · Library · Calendar · Settings
- **Five product engines + BIG MAC hooks** (strength, conditioning, nutrition, recovery, coordinator)
- **Coach portal:** cloud publish, calendar, session builder (delete blocks, superset B1/B2, drag-drop, reps forward-fill)
- **Coach desktop:** Electron shell + GitHub-release shell OTA
- **Recovery debt/repay** · WHOOP + Concept2 · OpenRouter on Netlify
- **Verify green** — incl. `coach-v1-e2e`, `big-mac-bridge`, `coach-desktop`, `dogfood-debt.smoke.mjs`

---

## 2. Twenty-item backlog (1 → 20)

Status: **done** · **code done / owner proof** · **open** · **parked**

| # | Item | Status | Notes |
| --- | --- | --- | --- |
| 1 | Upload Capgo bundle (v99 cache) | **done** | **1.0.31** on dogfood (31 Aug, cache v125 — dead-code purge + coach file import removed). Phone: Settings → Check for updates. |
| 2 | Phone: coach Publish → athlete pull | **owner proof** | Sign in both apps (same Supabase). Coach roster → link athlete UUID → Publish chip. Athlete foreground or Check for updates. |
| 3 | Phone: complete → coach **Completed** chip | **owner proof** | After #2: log session on phone → coach calendar chip shows Completed. |
| 4 | Phone: strapless cond → recovery → debt row | **owner proof** | `node apps/mobile/prototype/hybrid-app/dogfood-debt.smoke.mjs` passes in CI; real phone still needed. |
| 5 | Phone: hybrid week Library + Calendar | **owner proof** | Assign hybrid program; confirm week visible on phone Library/Calendar. |
| 6 | Phone: web ↔ phone sync after publish | **owner proof** | Change on coach web → athlete phone picks up without reinstall. |
| 7 | Coach `.exe` smoke on Windows | **owner proof** | Install from coach-desktop-latest; sign-in, publish, Ctrl+R, shell OTA check. |
| 8 | Code-sign coach `.exe` | **open** | Needs code-signing cert; SmartScreen warning until then. |
| 9 | Coach logger friction pass | **done** | Debounced persist, rest twin sync (#112). |
| 10 | Coach chip kebab dismiss | **done** | Click-outside + Escape; chip/cell menus mutual close (#112). |
| 11 | Program grid swap edge cases | **done** | Occupied cells accept paste; move swaps templates (#112). |
| 12 | Athlete logger friction pass | **done** | MAX targets, zero rest, rest menu, superset columns (#112). |
| 13 | BIG MAC five hooks on phone | **owner proof** | CI: `check:big-mac-bridge`; confirm receipts on device after sessions. |
| 14 | Pain/illness flags | **out of scope** | No agent planning or implementation. Grokbot owns. Legacy `pain_blocked` exposure class in strength-engine may stay; do not extend. |
| 15 | Refresh handoff | **done** | This write. |
| 16 | Release notes habit (Capgo + desktop) | **done** | `docs/RELEASE_NOTES.md` — bump row when shipping. |
| 17 | Permanent links in README/handoff | **done** | coach-desktop-latest + dogfood-latest in §0. |
| 18 | LLM lead-fallback in athlete app | **parked** | Owner approval required (Constitution step 5). |
| 19 | Decision Hub implementation | **parked** | Owner sign-off post-research. |
| 20 | Research corpus → promoted rules | **parked** | 2,814 sources; `gates.py` needs two human reviewers per promotion. |

### Phone proof script (items 2–6)

1. Install/open dogfood APK (or Capgo-updated shell).
2. Pull **1.0.19** (Settings → Check for updates).
3. Coach: Supabase sign-in → Athletes → paste athlete UUID → assign + **Publish**.
4. Athlete: pull → start session → complete all tasks → finish.
5. Coach: calendar → **Completed** chip on that session.
6. Repeat: strapless conditioning → recovery prescription → debt row on athlete Home.
7. Hybrid week: coach program grid → assign → verify Library/Calendar on phone matches web.

### Automated checks (before phone)

```bash
pnpm run verify
node apps/mobile/prototype/hybrid-app/dogfood-proof-prep.smoke.mjs
node apps/mobile/prototype/hybrid-app/dogfood-debt.smoke.mjs
node apps/mobile/prototype/hybrid-app/coach-v1-e2e.smoke.mjs
```

---

## 3. Rules (do not silently reverse)

| Engine | Athlete name | Visible? |
| --- | --- | --- |
| Strength | Hybrid Strength | Yes |
| Conditioning | The Engine | Yes |
| Nutrition | Nutrition | Yes |
| Recovery | — | Debt row only |
| Coordinator | — | Invisible |

- **Silent apply** · **never block training** (solo dogfood) · `@hybrid/strength-engine` **pure**
- **Out of scope for agents:** ARC / multi-coach · Expo / second athlete shell · pain / illness (grokbot)
- **Cancelled product tracks:** Coach bench revival · ARC analytics · Expo / PWA athlete shell

---

## 4. Branches & PRs

| Branch | Tip | Purpose |
| --- | --- | --- |
| `main` | `41153b9` | Athlete + coach + evidence-platform |

**Next agent on product:** §2 table — prioritize **owner proof** rows 2–7 on a real phone.

**Next agent on research:** `evidence-platform/docs/SESSION-HANDOFF-2026-08-30.md` — only if owner asks.
