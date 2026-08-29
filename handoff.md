# Handoff — TheStrengthEngine

> **AUTHORITATIVE CHECKPOINT — 30 August 2026.**
> **Chat may be cleared after this write — treat §0–§4 as the full memory.**
> **Product:** Hybrid HTML athlete app + Capgo/dogfood + Netlify. Coach = prototype only.
> **Companion `THE-HYBRID-ENGINE1`:** shared-Supabase schema stub only — no apps.
> Charter: `docs/superpowers/plans/2026-08-23-mono-athlete-app-charter.md`
> **`CLAUDE.md`** owns engineering rules and the twelve-table Supabase contract.

---

## 0. Read this first

| | |
| --- | --- |
| **Owner** | Five-engine **research** handed to **Claude** (branch below). ChatGPT dropped for research. App AI wiring **paused**. |
| **Edit athlete app** | `apps/mobile/prototype/hybrid-app/index.html` → `bash apps/mobile/sync-hybrid-html.sh` |
| **`main` tip** | **`a1801e1`** (smoke on **`7642cdb`** = PR #92 merge) |
| **Ops / vault PR** | `cursor/capgo-1-0-13-upload-84a0` @ **`c21277a`** — **PR #93** (handoff, secrets, briefing, WIP AI stubs) |
| **Five-engine research** | `claude/big-mac-q7xyqo` @ **`ac3dbae`** — **`evidence-platform/`** — **not merged** · read **`evidence-platform/docs/SESSION-HANDOFF-2026-08-30.md`** |
| **Cache** | **`the-hybrid-athlete-engine-v94`** (`LOCAL_BUILD` + SW `CACHE` together) |
| **Capgo** | **`dogfood` @ `1.0.13`** (uploaded 28 Aug) |
| **Web** | https://thehybridsystem.netlify.app/ |
| **Coach** | https://thehybridsystem.netlify.app/coach.html (prototype) |
| **APK** | https://github.com/reflectprotect123-max/strengthside/releases/tag/dogfood-latest |
| **Lost a token?** | **§0.5 Secrets vault** |
| **Decision Hub context** | `docs/decision-hub-chatgpt-briefing/START-HERE.md` |

**Five engines are wired on `main`.** Do not re-run “finish five-systems” or Phase 2 merge plans.

**Ship ritual:** `pnpm run verify` → sync HTML → bump cache → Capgo upload if dogfood moves → refresh this handoff.

**Do not merge `claude/big-mac-q7xyqo` to `main`** until owner approves. **Do not wire LLM runtime to athlete app** until owner approves post-research.

---

## 0.5 Secrets vault (agent recovery)

> **Private repo only.** **Netlify UI only** = value never pasted in chat.

### Capgo OTA

| Key | Value |
| --- | --- |
| `CAPGO_TOKEN` / repo-root `.capgo` (gitignored) | `292f04bd-a0a6-490c-8b7d-03c234eb4915` |
| App ID | `com.hybrid.athlete` |
| Channel / bundle | `dogfood` / **`1.0.13`** |
| Upload | `CAPGO_BUNDLE_VERSION=1.0.13 bash apps/mobile/capacitor/scripts/upload-capgo-bundle.sh` |

Also store `CAPGO_TOKEN` in **Cursor Cloud environment secrets**.

### OpenRouter

| Key | Value |
| --- | --- |
| `OPENROUTER_API_KEY` | `84ac523e-aae5-49cd-ab45-aa4711736312` |
| Dashboard | https://openrouter.ai/keys |

Research / offline only until owner approves app wiring. Add to Netlify env if using `ai-strength-progression` function on PR #93 branch.

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
| Callback | `https://thehybridsystem.netlify.app/.netlify/functions/whoop-callback` |

### Netlify

| Item | Value |
| --- | --- |
| Athlete site | `thehybridsystem` → `68423862-b052-43af-b482-162b711c8214` |
| Env UI | https://app.netlify.com/sites/thehybridsystem/configuration/env |

### Coach demo (prototype)

| Email | Password |
| --- | --- |
| `dan@thehybrid.local` | `demo` |

---

## 1. What's shipped on `main` (do not redo)

- **One athlete app:** Hybrid HTML — **Home · Library · Calendar · Settings**
- **Five engines wired:** Strength · Conditioning · Nutrition · Recovery (debt row) · Coordinator (silent only)
- **Strength cloud sync v3** · **Recovery debt/repay** · WHOOP + Concept2 · Capgo **`1.0.13`**
- **Verify:** `pnpm run verify` green; `dogfood-debt.smoke.mjs` in CI
- Key merge: **#92** recovery + engine audit

---

## 2. What's open

### A — Product on `main` (ship the app)

- [ ] Phone dogfood proof — Capgo 1.0.13 → strapless cond → recovery session → debt row moves
- [ ] Hybrid week in Library + Calendar + web↔phone sync proof
- [ ] Logger friction pass
- [ ] Merge **PR #93** (handoff + vault onto `main`)

### B — Five-engine research (Claude owns)

**Branch:** `claude/big-mac-q7xyqo` @ **`ac3dbae`**

**Read first:** `evidence-platform/docs/SESSION-HANDOFF-2026-08-30.md`

| Item | State |
| --- | --- |
| `evidence-platform/` | Phases 1–7 built (five shells, receipts, shadow gate) — **not athlete-facing** |
| Research corpus | **2,814** acquired sources (~596/599/587/545/637 per engine) — **all untrusted until human review** |
| Promoted rules / models | **0** — bottleneck = two independent human reviewers (`gates.py`) |
| Coordinator focus | Corrected to **return-to-play** (not abstract arbitration) |
| Tests | 182 pass · `validate_platform.py` → `PASS_PRE_RESEARCH_ONLY` |
| PR to `main` | **None opened** — do not merge without owner |

**ChatGPT:** dropped for five-engine research. **Cursor WIP AI stubs** on PR #93 branch only (`strength-ai.js`, partial adapter) — **paused, not wired**.

### C — Decision Hub (product direction — parked for implementation)

Owner intent (from design chats): five engines → rich data → deterministic or LLM-assisted **automation** (not explanation UI), silent apply, no training blocks. Full context: `docs/decision-hub-chatgpt-briefing/START-HERE.md`.

**Nothing on `main` implements Decision Hub yet.** Implementation waits until Claude research + owner sign-off.

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
| `main` | `a1801e1` | Shipped athlete product |
| `cursor/capgo-1-0-13-upload-84a0` | `c21277a` | **PR #93** — handoff, vault, briefing, WIP AI stubs |
| `claude/big-mac-q7xyqo` | `ac3dbae` | Five-engine evidence platform + research corpus |

```
apps/mobile/prototype/hybrid-app/index.html
apps/mobile/sync-hybrid-html.sh
packages/strength-engine/
evidence-platform/docs/SESSION-HANDOFF-2026-08-30.md
evidence-platform/README.md
docs/decision-hub-chatgpt-briefing/START-HERE.md
CLAUDE.md
```

| PR | Status |
| --- | --- |
| **#93** | Handoff + vault + briefing + WIP AI stubs — merge when owner ready |
| **#91** | Coach UI polish — draft, CI red |

**Next agent on research:** `git fetch origin claude/big-mac-q7xyqo && git checkout claude/big-mac-q7xyqo` → read session handoff → human review / promotion gate work only if owner asks.

**Next agent on product:** checkout `main` or PR #93 branch → §2 checklist.
