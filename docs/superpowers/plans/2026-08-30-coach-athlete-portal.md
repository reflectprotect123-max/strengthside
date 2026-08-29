# Coach → Athlete Portal — Implementation Plan

> **For agentic workers:** Implement **one phase at a time** (owner: “1 at a time”). Each phase ends with `pnpm run verify`, sync HTML, walkthrough artifacts, and handoff refresh.
>
> **Goal:** Make coach publish → athlete train → coach see completion feel like **one product**, not two apps plus a Settings button.

**Architecture:** Vanilla HTML on `coach.html` + `index.html`; cloud via existing `CoachCloud` / `CoachSync` → `assigned_session`. No ARC rebuild. `@hybrid/strength-engine` stays pure.

**Tech stack:** `apps/mobile/prototype/hybrid-app/*` → `bash apps/mobile/sync-hybrid-html.sh` → Netlify preview-site → Capgo dogfood when athlete-facing.

---

## Skills map (use on every phase)

| Skill | Role in this plan |
| --- | --- |
| **frontend-design** | One signature per surface; anti-template; subject = *prescription delivery*, not generic SaaS dashboard |
| **ui-ux-pro-max** | A11y, touch ≥44px, toast/sync UX patterns, focus-visible — **discard generic palette suggestions** (clinical blue/green) |
| **brand** | Coach voice = directive + operational; athlete voice = train today; same system name **THE Hybrid System** |
| **design-system** | Primitive → semantic → component tokens for portal chrome (see §Tokens) |
| **ui-styling** | HTML/CSS only — match existing Track Dawn, no shadcn import |
| **walkthrough-artifacts** | Each phase ships one E2E video: coach publish → phone pull → athlete trains |
| **CLAUDE.md / handoff** | Twelve-table contract; no migrations outside `assigned_session` usage already owned; ship ritual |

---

## Product thesis (one sentence)

**The athlete’s calendar is the inbox; the coach’s calendar is the outbox — both must show delivery state in plain language.**

---

## Zero slop (inherits athlete polish plan)

### Banned (never introduce)

| Ban | Why |
| --- | --- |
| Cream `#F4F1EA` + terracotta serif cluster | AI default |
| Near-black + acid green glow | AI default |
| ui-ux-pro-max clinical blue `#0284C7` / health green palette | Fights Track Dawn |
| Purple/indigo gradients, orange fitness energy | Product ban |
| Inter/Roboto as designed face | Generic |
| Emoji icons, badge soup, stat strips | Dashboard slop |
| “Seamless”, “delightful”, “portal experience” marketing copy | Voice slop |
| Full ARC / multi-coach product rebuild | Charter cancelled |
| Decision Hub / LLM on publish path | Owner paused |

### Required materials (Track Dawn + coach copper)

| Token | Value | Portal use |
| --- | --- | --- |
| Deep graphite | `#07090b` | Page bg (athlete + coach) |
| Panel steel | `#12161a` | Cards |
| Bone | `#eef2f4` | Text |
| Copper | `#d4a574` / `#e8c49a` | Coach chrome, prescription CTAs, “From coach” accent |
| Zone teal | `#5ec4b4` | Engine only — not coach portal |
| OK / warn / bad | `#7dba9a` / `#d4a35b` / `#d0897d` | Delivery status |
| Display | Barlow Condensed | Eyebrows, session titles |
| Body | Space Grotesk | UI copy |

### Signature element (spend boldness here only)

**Prescription rail:** A single horizontal status strip — coach side = *Delivered / Pending / Error* per athlete; athlete side = *Coach updated your week* with count. Same component grammar (eyebrow + condensed title + one pill). Everything else quieter.

---

## Brand voice (coach vs athlete)

| Context | Register | Example |
| --- | --- | --- |
| Coach publish success | Operational, active | “Published 3 sessions to Alex. Phone syncs on next open.” |
| Coach publish failure | Specific fix | “Cloud push blocked — link Alex’s Supabase user id on roster.” |
| Athlete new sessions | Direct | “Coach added 2 workouts for this week.” |
| Athlete empty (signed in) | Invitation | “No prescriptions yet. Pull when your coach publishes.” |
| Athlete self-build empty | Unchanged | “Build in Library, then schedule a day.” |
| Errors | No apology | “Sign-in required to pull coach sessions.” |

CTA vocabulary stays consistent: **Publish** (coach) → **Pull** / auto-sync (athlete) → **Start session** (athlete).

---

## Design-system tokens (portal components)

Add semantic aliases (both files — coach already has `:root`; athlete mirrors):

```css
/* Semantic — portal */
--portal-coach-accent: var(--color-copper);
--portal-status-ok: var(--ok);
--portal-status-warn: var(--warn);
--portal-status-bad: var(--bad);

/* Component — prescription chip */
--rx-chip-border: rgba(212,165,116,.35);
--rx-chip-bg: rgba(212,165,116,.06);
--rx-chip-label: "From coach"; /* copy, not CSS content in prod */
```

**Component spec — `rx-status-strip`**

| State | Border | Pill | Copy pattern |
| --- | --- | --- | --- |
| Delivered | ok | `ok` | “Live on athlete calendar” |
| Pending | warn | `warn` | “Publish to send” |
| Error | bad | `bad` | One-line error |
| Athlete new | copper | `ok` | “N new from coach” |

Touch: min-height 44px on actions; `prefers-reduced-motion: reduce` → no fade animation.

---

## Current gaps (baseline)

1. Athlete cannot distinguish coach vs self sessions (`source: 'coach-bridge'` unused in UI).
2. Pull is Settings-only; copy mentions bridge file / same browser.
3. No athlete toast on cloud merge.
4. No coach delivery strip (push errors → console).
5. No completion write-back (`assigned_session.state` stays `published`).
6. Roster: “Link my account” only — no paste UUID.
7. Strength `performed_set` not linked to `cloudAssignedId`.

---

## Phases (ship in order)

### Phase 0 — Plan gate (this doc)

- [ ] Owner confirms scope: prototype portal polish + closed loop, not ARC revival.
- [ ] Confirm dogfood path: real Supabase login on coach + athlete APK same account.

**Proof:** N/A (doc only).

---

### Phase 1 — Athlete prescription visibility (feel the portal exists)

**Skills:** frontend-design (signature strip), ui-ux-pro-max (toast 3–5s auto-dismiss), brand (athlete copy).

**Files**

| File | Change |
| --- | --- |
| `index.html` | Home briefing branches; calendar card badge; Settings coach card rewrite |
| `coach-sync.js` | Return `{ merged, cloudMerged }` for UI; expose `status.lastCloudAt` |
| `coach-cloud.js` | Optional: set status on pull |

**Tasks**

- [ ] **1.1** `isCoachPrescription(session)` helper: `source === 'coach-bridge' \|\| coachSessionId`.
- [ ] **1.2** Calendar `sessionCalendarCard`: copper left border + pill **From coach** when prescription.
- [ ] **1.3** Home `homeBriefingHtml`: if today’s session is prescription → eyebrow **Today’s prescription** + **Start workout**; if signed in + no sessions → **Check for coach updates** primary.
- [ ] **1.4** Settings coach card: title **Coach prescriptions**; show last pull time + counts from `CoachSync.status`; primary **Check for updates** (wraps existing pull); secondary import file de-emphasized.
- [ ] **1.5** Toast/banner on merge: “Coach added N workout(s).” Auto-dismiss 4s; respect reduced motion.
- [ ] **1.6** Copy audit: remove “same browser” as primary path when cloud signed in.

**Tests**

- [ ] Extend or add `coach-portal-athlete.smoke.mjs` (badge helper, status shape).
- [ ] `pnpm run verify`

**Walkthrough artifact**

- [ ] Video: coach publishes → athlete Settings **Check for updates** → Home shows **From coach** → Calendar badge visible.

---

### Phase 2 — Coach delivery strip (trust the outbox)

**Skills:** frontend-design (coach signature strip), brand (operational coach copy), design-system (status tokens).

**Files**

| File | Change |
| --- | --- |
| `coach.html` | Header or rail delivery strip |
| `coach-views.js` | Roster delivery column |
| `coach-cloud.js` | Richer `status` (lastAthlete, lastErrors[]) |

**Tasks**

- [ ] **2.1** Sidebar or header **Delivery** strip: signed in ✓ · last push time · sessions pushed count · error one-liner.
- [ ] **2.2** Roster row: **Cloud linked** / **Needs link** + paste field for Supabase `auth.users` uuid (save to `cloudUserId`).
- [ ] **2.3** Publish chip / Publish all: toast **Published to [name]** or explicit error (RLS / missing id).
- [ ] **2.4** Demote **Demo coach (offline)** visually (secondary, below fold) — real login is default path.
- [ ] **2.5** Link **Open athlete app** in coach sidebar → athlete Netlify URL.

**Tests**

- [ ] `coach-cloud.smoke.mjs` — status fields
- [ ] `coach-v1-e2e.smoke.mjs` still green
- [ ] `pnpm run verify`

**Walkthrough artifact**

- [ ] Video: roster paste/link → publish → delivery strip green → athlete pull (Phase 1 UI).

---

### Phase 3 — Auto-sync on foreground (remove the ritual)

**Skills:** ui-ux-pro-max (background sync UX — no spinner forever), brand (silent success).

**Files**

| File | Change |
| --- | --- |
| `whoop.js` or `index.html` | Hook visibility / app foreground |
| `coach-sync.js` | `schedulePull` debounce; skip if settings tab (scroll fix pattern) |

**Tasks**

- [ ] **3.1** On `visibilitychange` → visible + Supabase signed in → debounced `CoachCloud.pullForAthlete` (30–60s min interval).
- [ ] **3.2** If merged > 0 and not on Settings tab → toast + optional Home refresh.
- [ ] **3.3** Settings shows **Auto-sync on** + last auto pull timestamp.

**Tests**

- [ ] Smoke: schedulePull not called with reason `coach-sync-pull` loop
- [ ] Manual: Capgo APK foreground pull

**Walkthrough artifact**

- [ ] Video: coach publish → athlete backgrounds app → foreground → toast without opening Settings.

---

### Phase 4 — Completion loop (portal closes)

**Skills:** design-system (completed chip state), brand (“Completed on phone”).

**Files**

| File | Change |
| --- | --- |
| `index.html` | `finishSession` hook |
| `coach-cloud.js` | `markCompleted(cloudAssignedId)` |
| `coach-views.js` | Calendar chip reads `status === 'completed'` from local mirror |

**Tasks**

- [ ] **4.1** When athlete completes session with `cloudAssignedId`, PATCH `assigned_session.state = 'completed'` (authenticated athlete policy).
- [ ] **4.2** Coach calendar chip: **Completed** pill when local session or cloud row completed.
- [ ] **4.3** Coach pull on load (read-only): refresh completion states for published rows.
- [ ] **4.4** Unpublish: athlete sees **Withdrawn** on scheduled (not active/completed) prescriptions.

**Constraints**

- Do not thaw `resolved_snapshot` (freeze trigger).
- Active session: unpublish does not delete in-progress work.

**Tests**

- [ ] New smoke: completion patch mocked client
- [ ] `pnpm run verify`

**Walkthrough artifact**

- [ ] Video: athlete completes coach session → coach calendar shows **Completed**.

---

### Phase 5 — Nutrition + strength visibility (optional depth)

**Skills:** brand, ui-ux-pro-max (nutrition hierarchy).

**Tasks**

- [ ] **5.1** Cloud publish nutrition payload in `resolved_snapshot` (same row or documented extension) — athlete `NutritionUI` reads coach override.
- [ ] **5.2** Coach chip shows “Macros published” when nutrition bundle present.
- [ ] **5.3** Future: `performed_set` keyed to `assigned_session.id` for coach summary (needs strength-sync design — **separate migration review**).

**Gate:** Owner sign-off before 5.3 schema touch.

---

## File map

| File | Role |
| --- | --- |
| `apps/mobile/prototype/hybrid-app/index.html` | Athlete portal UX |
| `apps/mobile/prototype/hybrid-app/coach.html` | Coach delivery UX |
| `apps/mobile/prototype/hybrid-app/coach-views.js` | Calendar, roster, chips |
| `apps/mobile/prototype/hybrid-app/coach-sync.js` | Pull + status |
| `apps/mobile/prototype/hybrid-app/coach-cloud.js` | Push, pull, completion |
| `apps/mobile/prototype/hybrid-app/coach-bridge.js` | Local fallback (keep) |
| `apps/mobile/sync-hybrid-html.sh` | Sync to preview-site |
| `checks/` + `*.smoke.mjs` | CI gates |
| `handoff.md` | Ship checkpoint |

---

## Verification matrix

| Check | When |
| --- | --- |
| `pnpm run verify` | Every phase |
| `node apps/mobile/prototype/hybrid-app/coach-v1-e2e.smoke.mjs` | Phases 1–4 |
| `node apps/mobile/prototype/hybrid-app/coach-cloud.smoke.mjs` | Phases 2–4 |
| Capgo dogfood OTA | Athlete-facing phases (1, 3, 4) |
| Walkthrough video | Every phase — coach → phone E2E |

---

## Success criteria (discerning engineer bar)

1. Athlete opens app after coach publish and **sees new work without knowing about bridge files**.
2. Athlete can **identify coach prescriptions** on Home and Calendar at a glance.
3. Coach sees **delivery success or actionable failure** without opening devtools.
4. Coach sees **Completed** after athlete finishes (Phase 4).
5. UI passes slop audit (§Zero slop) and uses Track Dawn tokens only.
6. No new Supabase tables; completion uses existing `assigned_session.state`.

---

## Out of scope (explicit)

- Rebuilding ARC coach product / org management UI
- Decision Hub runtime / LLM prescription
- Push notifications (FCM) — consider after Phase 4
- Multi-coach roster from Supabase (until `coaches_athlete_anywhere` relationships seeded)
- Renaming `@hybrid/strength-engine`

---

## Handoff snippet (update after Phase 1 ships)

```markdown
### Coach → athlete portal
- Prescription badge + pull UX on athlete app (Phase 1)
- Coach delivery strip + roster UUID paste (Phase 2)
- Auto pull on foreground (Phase 3)
- Completion write-back (Phase 4)
- Plan: `docs/superpowers/plans/2026-08-30-coach-athlete-portal.md`
```

---

## Recommended start

**Phase 1 only** — highest feel-per-line-of-code. Stop for owner review before Phase 2.
