# Handoff — TheStrengthEngine

> **AUTHORITATIVE CHECKPOINT — 30 August 2026.**
> **Chat may be cleared after this write — treat §0–§4 as the full memory.**
> **Product:** Hybrid HTML athlete app + Capgo/dogfood + Netlify. Coach = same URL; **real path** = Supabase sign-in + cloud publish → athlete pull.
> **Companion `THE-HYBRID-ENGINE1`:** shared-Supabase schema stub only — no apps.
> Charter: `docs/superpowers/plans/2026-08-23-mono-athlete-app-charter.md`
> **`CLAUDE.md`** owns engineering rules and the twelve-table Supabase contract.

---

## 0. Read this first

| | |
| --- | --- |
| **Owner** | Five-engine **research** merged to `main`. ChatGPT dropped for research. App AI wiring **paused**. |
| **Edit athlete app** | `apps/mobile/prototype/hybrid-app/index.html` → `bash apps/mobile/sync-hybrid-html.sh` |
| **`main` tip** | **`e9746cc`** (#99 ecosystem polish + calendar UX — 30 Aug) |
| **Open PR** | **None** — #99 merged 30 Aug |
| **Five-engine research** | **Merged to `main` at `1a249a4`** — `evidence-platform/` — read **`evidence-platform/docs/SESSION-HANDOFF-2026-08-30.md`** |
| **Cache** | **`the-hybrid-athlete-engine-v99`** (`LOCAL_BUILD` + SW `CACHE` together) |
| **Capgo** | **`dogfood` @ `1.0.16`** on channel — **upload `1.0.17`** after merge to ship **v99** bundle |
| **Web** | https://thehybridsystem.netlify.app/ |
| **Coach** | https://thehybridsystem.netlify.app/coach.html — **real:** Supabase sign-in → roster link athlete UUID → Publish; **demo:** `dan@thehybrid.local` / `demo` (offline only) |
| **APK** | https://github.com/reflectprotect123-max/strengthside/releases/tag/dogfood-latest |
| **Lost a token?** | **§0.5 Secrets vault** |
| **Decision Hub context** | `docs/decision-hub-chatgpt-briefing/START-HERE.md` |

**Five engines are wired on `main`.** Do not re-run “finish five-systems” or Phase 2 merge plans.

**Ship ritual:** `pnpm run verify` → sync HTML → bump cache → Capgo upload if dogfood moves → refresh this handoff.

**`claude/big-mac-q7xyqo` merged to `main` at `1a249a4`, owner-approved 30 Aug** — clean merge, zero conflicts, `apps/`/`packages/`/`supabase/` untouched. **Do not wire LLM runtime to athlete app** until owner approves post-research — merging the research corpus is not that approval.

---

## 0.5 Secrets vault (agent recovery)

> **Private repo only.** **Netlify UI only** = value never pasted in chat.

### Capgo OTA

| Key | Value |
| --- | --- |
| `CAPGO_TOKEN` / repo-root `.capgo` (gitignored) | `292f04bd-a0a6-490c-8b7d-03c234eb4915` |
| App ID | `com.hybrid.athlete` |
| Channel / bundle | `dogfood` / **`1.0.16`** (upload **`1.0.17`** for v99 cache) |
| Upload | `CAPGO_BUNDLE_VERSION=1.0.17 bash apps/mobile/capacitor/scripts/upload-capgo-bundle.sh` |

Also store `CAPGO_TOKEN` in **Cursor Cloud environment secrets**.

### OpenRouter

| Key | Value |
| --- | --- |
| `OPENROUTER_API_KEY` | `84ac523e-aae5-49cd-ab45-aa4711736312` |
| Dashboard | https://openrouter.ai/keys |

Research / offline only until owner approves app wiring. Add to Netlify env if using `ai-strength-progression` function.

### Supabase (shared hosted)

| Key | Value |
| --- | --- |
| Project ref | `orysjncrksmdfabpuftd` |
| `SUPABASE_URL` | `https://orysjncrksmdfabpuftd.supabase.co` |
| Region | `ap-southeast-2` |
| `SUPABASE_ANON_KEY` (public — in git) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yeXNqbmNya3NtZGZhYnB1ZnRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0MTE4NzksImV4cCI6MjA5OTk4Nzg3OX0.GTMBfFtH5O6SikzHo75sXGIZoEhmuJ7TvXiACd7T078` |

**Dashboard only:** `SUPABASE_SERVICE_ROLE_KEY` · `SUPABASE_ACCESS_TOKEN` · `SUPABASE_DB_PASSWORD` · `VOYAGE_API_KEY` · `EMBED_WEBHOOK_SECRET`

### WHOOP

| Key | Value |
| --- | --- |
| `WHOOP_CLIENT_ID` | `bbce411c-cbd1-446d-8663-709acf923cd8` |
| `WHOOP_CLIENT_SECRET` | Netlify UI only |
| Callback | https://thehybridsystem.netlify.app/.netlify/functions/whoop-callback |

### Netlify

| Item | Value |
| --- | --- |
| Athlete site | `thehybridsystem` → `68423862-b052-43af-b482-162b711c8214` |
| Env UI | https://app.netlify.com/sites/thehybridsystem/configuration/env |

### Coach access

| Mode | How |
| --- | --- |
| **Real (cloud)** | Supabase sign-in on coach.html → paste athlete `auth.users` uuid on roster → **Publish** → athlete **Check for updates** or foreground auto-sync |
| **Demo (offline)** | `dan@thehybrid.local` / `demo` — local bridge only, no `assigned_session` |

---

## 1. What's shipped on `main` (do not redo)

- **One athlete app:** Hybrid HTML — **Home · Library · Calendar · Settings**
- **Five engines wired:** Strength · Conditioning · Nutrition · Recovery (debt row) · Coordinator (silent only)
- **Strength cloud sync v3** · **Recovery debt/repay** · WHOOP + Concept2 · Capgo **`1.0.16`** on dogfood (upload **`1.0.17`** for v99)
- **Verify:** `pnpm run verify` green; `dogfood-debt.smoke.mjs` + **`coach-portal-athlete`** + **`coach-block-types`** in CI
- Key merges: **#98** calendar + block types · **#97** coach → athlete portal · **#96** Settings scroll · **#93** vault · **#92** recovery · **#91** coach polish
- **Evidence platform:** merged at **`1a249a4`** (2,814 acquired sources, 0 promoted)
- **Coach → athlete portal (#97):** From-coach badges · Settings pull/auto-sync · delivery strip · completion write-back · nutrition in cloud snapshot · strength builder hidden when coach rx exists · **`coach-portal-athlete.smoke.mjs`**
- **Coach calendar + blocks (#98):** strength / conditioning / recovery end-to-end · calendar UX polish · demo seed = **Dan Veldman only** (Alex/Jordan removed)
- **Ecosystem polish (#99):** coach Mon–Sun calendar grid · publish revert on cloud fail · coach toasts · athlete strength builder when signed in (Settings toggle) · import backup · portal toasts · friendly session status labels · cache **v99**

---

## 2. What's open

### A — Product on `main` (ship the app)

- [ ] Phone dogfood proof — Capgo **1.0.17** (v99) → coach publish → athlete pull → complete → coach **Completed** chip
- [ ] Phone dogfood proof — strapless cond → recovery session → debt row moves
- [ ] Hybrid week in Library + Calendar + web↔phone sync proof
- [ ] Logger friction pass

### B — Five-engine research — **merged to `main`**

**Merged** at `1a249a4` (was `claude/big-mac-q7xyqo` @ `ac3dbae`, direct merge, no PR — owner said "merge")

**Read first:** `evidence-platform/docs/SESSION-HANDOFF-2026-08-30.md`

| Item | State |
| --- | --- |
| `evidence-platform/` | Phases 1–7 built (five shells, receipts, shadow gate) — **not athlete-facing** — now on `main` |
| Research corpus | **2,814** acquired sources (~596/599/587/545/637 per engine) — **all untrusted until human review** |
| Promoted rules / models | **0** — bottleneck = two independent human reviewers (`gates.py`) |
| Coordinator focus | Corrected to **return-to-play** (not abstract arbitration) |
| Tests | 182 pass · `validate_platform.py` → `PASS_PRE_RESEARCH_ONLY` |
| Merge to `main` | **Done, 30 Aug** — clean, no conflicts, `apps/`/`packages/`/`supabase/` untouched |

**ChatGPT:** dropped for five-engine research. **Cursor WIP AI stubs** (`strength-ai.js`, partial adapter, `ai-strength-progression.mjs`) — **paused, not wired**.

### C — Decision Hub (product direction — parked for implementation)

Owner intent (from design chats): five engines → rich data → deterministic or LLM-assisted **automation** (not explanation UI), silent apply, no training blocks. Full context: `docs/decision-hub-chatgpt-briefing/START-HERE.md`.

**Nothing on `main` implements Decision Hub yet.** Implementation waits until owner sign-off post-research.

### Dogfood smoke

```bash
node apps/mobile/prototype/hybrid-app/dogfood-debt.smoke.mjs
pnpm run verify
```

---

## 3. Rules (do not silently reverse)

| Engine | Athlete name | Visible? |
| --- | --- | --- |
| Strength | Hybrid Strength | Yes |
| Conditioning | The Engine | Yes |
| Nutrition | Nutrition | Yes |
| Recovery | — | Debt row only |
| Coordinator | — | Invisible (no weekly peek) |

- **Silent apply** · **never block training** · pain Yes → **strength holds only**
- Illness record-only · no HRV as pain gate · `@hybrid/strength-engine` **pure** (zero I/O)
- Coach / ARC / Expo **cancelled**

---

## 4. Branches & PRs

| Branch | Tip | Purpose |
| --- | --- | --- |
| `main` | `9f2ca43` | Athlete product + evidence-platform + coach portal + calendar/blocks |
| `claude/big-mac-q7xyqo` | merged | Five-engine evidence platform — history only |

```
apps/mobile/prototype/hybrid-app/index.html
apps/mobile/sync-hybrid-html.sh
packages/strength-engine/
evidence-platform/docs/SESSION-HANDOFF-2026-08-30.md
evidence-platform/README.md
docs/decision-hub-chatgpt-briefing/START-HERE.md
CLAUDE.md
```

**Next agent on research:** already on `main` — read `evidence-platform/docs/SESSION-HANDOFF-2026-08-30.md` → human review / promotion gate work only if owner asks.

**Next agent on product:** checkout `main` → §2 checklist.
