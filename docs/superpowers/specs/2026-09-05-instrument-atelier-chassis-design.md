# Instrument · Atelier · Chassis — Design

**Date:** 2026-09-05  
**Status:** Approved in brainstorm  
**Base:** `main` @ merge of audit PR #177 (`cursor/audit-critical-fixes-0ae6`)  
**Product surface:** Hybrid HTML athlete app only (`apps/mobile/prototype/hybrid-app/index.html` + sync twins)  
**Engine:** `@hybrid/adaptive` only (Open / Next / Close)

---

## 0. Goal

Make the athlete app feel **premium and simple** by structuring it as three rooms, on the **current OLED system**, with **builder = logger 1:1**, and a Chassis that is honest now and sync-ready later.

**Success:** open Home and feel quiet/expensive/obvious; complete one full strength + conditioning dogfood session without hunting or second-guessing sync.

---

## 1. Architecture — three rooms

| Room | Role | Contains |
| --- | --- | --- |
| **Instrument** | Train | Home (OLED dials + small strength/cond overview) + in-session logger + adaptive doors |
| **Atelier** | Workshop | Library + builders; Publish to a chosen day |
| **Chassis** | Basement | Local persistence, adaptive Close memory, honest sync UX, written sync contract |

**Approach:** Soft room boundaries inside the existing Hybrid HTML (CSS/JS sectioning + clear product rules). Not a second app shell.

**Visual:** OLED system as it exists now (true black, white chrome, color in dials). Refine; do not invent a new brand language or revert to brass.

**Adaptive:** Stays pure in `packages/adaptive`. HTML only opens doors (lift Log → Next; cond work RPE → Next; holds → WorkOverlay only).

---

## 2. Instrument

### Home

- WHOOP dials (sleep / recovery / strain) stay.
- **Remove** the readiness check-in from Home.
- Add a **small overview** of today’s / next **strength** and **conditioning** (not a dashboard dump).
- One clear path into today’s session.
- No builder chrome, no sync essays on Home.

### Logger

- **Builder is the source of truth.** Logger must match the builder 1:1 (columns, set shape, labels, density).
- Do not invent a separate “fancy logger” look that drifts from the builder.
- Adaptive Next fills quietly after Log where the adaptive contract already allows.
- Cond: modality-honest targets (watts vs split); no silent watts fallback for rower/ski (audit sealed this).
- Holds/carries: WorkOverlay only.

---

## 3. Atelier

### Library tabs

- **Strength | Engine | Recovery**
- Progress tab is out — Recovery is core hybrid.
- OLED native rows/sections (not restyled generic cards).

### Builders

- Strength builder remains the visual/structural template the logger mirrors.
- Cond builder: watts for bike/echo; split `/500m` for rower/ski.
- Actions: **Save** · **Save as template** · **Publish**
- **Publish** opens a **day-picker sheet** (which calendar day receives the session).

### Boundary

- Building is not training. Live dials do not decorate the workshop.
- Publish lands on Calendar / Home overview; Instrument owns the live session.

---

## 4. Chassis

### Phase H — ship in this work

- Settings / WHOOP copy: sync refreshes WHOOP + Concept2 when linked; sessions/templates stay on device for now (audit copy).
- Adaptive Close memory on-device with stable keys (audit).
- Preserve Capgo / WHOOP ownership checks.

### Phase M — write in this work (no full implement)

- Document the **session + template sync contract**: entities, conflict rules, offline-first, WHOOP proxy ownership boundary.
- Lives in this spec’s companion contract section (or a short linked contract doc created by the plan).

### Phase S — later plan

- Implement the contract after Instrument + Atelier feel right.

---

## 5. Verification (heavy)

Every implementation task must leave **evidence**, not vibes.

### Automated (must stay green)

| Gate | Command / artifact |
| --- | --- |
| Full gate | `pnpm run verify` |
| Adaptive package | `pnpm --filter @hybrid/adaptive test` |
| Adaptive bundle | `pnpm run check:adaptive-bundle` |
| Adaptive logger doors | `pnpm run check:adaptive-logger` |
| Adaptive routes | `pnpm run check:adaptive-routes` |
| HTML twins | `pnpm run check:hybrid-html-sync` |
| WHOOP ownership | `pnpm run check:whoop-ownership` (+ deeplink / proxy / live as in verify) |
| Cache pin | `LOCAL_BUILD` + SW `CACHE` match after every HTML bump |
| New / extended smokes | Home overview presence; Library Recovery tab; Publish day-picker; builder↔logger column parity; honest sync strings |

### Manual dogfood (required before Capgo)

1. Cold open → Home shows dials + strength/cond overview; no readiness check-in.
2. Library → Strength / Engine / Recovery tabs render OLED-native.
3. Build a strength block → logger for that session matches builder columns 1:1.
4. Build rower/ski cond → split field; bike → watts.
5. Publish → day picker → session appears on chosen day.
6. Train strength set → adaptive Next behaves; hold still uses WorkOverlay.
7. Train cond interval → RPE sheet; no catch-up death spiral (audit).
8. Settings → sync copy honest; Sync WHOOP & Concept2 label.
9. Record walkthrough artifacts under `/opt/cursor/artifacts/`.

### Ship ritual

1. Work on branch descended from audit merge (`cursor/audit-critical-fixes-0ae6` / follow-on).
2. Edit HTML → `bash apps/mobile/sync-hybrid-html.sh` → verify.
3. Capgo **only on explicit request**.
4. Bump `handoff.md` + release notes with cache/version together.

---

## 6. File map (expected touch surface)

| Area | Primary paths |
| --- | --- |
| Athlete UI | `apps/mobile/prototype/hybrid-app/index.html` |
| Twins | via `apps/mobile/sync-hybrid-html.sh` → `THE-Hybrid-App.html`, `preview-site/`, SW |
| WHOOP card | `apps/mobile/prototype/hybrid-app/whoop.js` (+ sync) |
| Adaptive | `packages/adaptive/**` (only if contract needs it) |
| Smokes | `apps/mobile/prototype/hybrid-app/*.smoke.mjs` + `package.json` verify list |
| Docs | this spec; sync contract; `handoff.md` |

---

## 7. Decisions log

| Decision | Choice |
| --- | --- |
| Instrument | Home + logger |
| Scope | Full three rooms |
| Chassis | H → M now; S later |
| Success | Feel + clean dogfood session |
| Visual | OLED system as now |
| Build approach | Soft rooms in current HTML (1+2) |
| Home content | Dials + strength/cond overview; drop readiness check-in |
| Library | Strength \| Engine \| Recovery |
| Publish | Day-picker sheet |
| Logger | Matches builder 1:1; builder wins |
| Base branch | Audit #177 merged to `main`; continue from that line |
| Verify | Heavy automated + required manual dogfood |
