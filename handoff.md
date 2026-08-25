# Handoff — TheStrengthEngine

> **AUTHORITATIVE CHECKPOINT — 25 August 2026 (Phase 1 Strength shipped).**
> **Chat may be cleared after this write — treat this block as the full memory.**
> **Five engines (locked):** Strength · Conditioning (The Engine) · Nutrition ·
> Recovery · Coordinator. Not two dials. Visible logging only; Recovery and
> Coordinator stay invisible brains.
> **Mono-app bet locked:** Hybrid HTML athlete app is the whole product.
> Do **not** build Coach / ARC / Expo as parallel products.
> Charter: `docs/superpowers/plans/2026-08-23-mono-athlete-app-charter.md`
> Where this block disagrees with anything below it, **this one wins.**

## 0. Read this first (next agent / next chat)

1. Product = **one** HTML app: `apps/mobile/prototype/hybrid-app/index.html`
2. Ship cache = **`the-hybrid-athlete-engine-v60`** (`LOCAL_BUILD` + SW `CACHE`
   bumped together on this branch).
3. **Phase 1 Strength shipped** on `cursor/five-engines-strength-e9c2` (**PR #43**):
   - `%WM` resolve on session start (builder field + `resolveExerciseLoad`)
   - Engine e1RM on finish (Brzycki + RIR→effective reps)
   - `sessionLoad` tonnage kg — **no** tonnage/50 stub
   - Completed set rows in strength sync snapshot
   - Progress history grouped by session
4. **Brains still silent:** Recovery + Coordinator invisible — no Recovery dial;
   Coordinator weekly peek (`openWeeklyReview` in `index.html`) **still present**
   until Phase 5. **Keep** `NutritionUI.openWeeklyReview` (MacroFactor adaptive
   check-in — different thing).
5. **Next build:** Phase 2 Nutrition (day-status → adaptive check-in) per
   `docs/superpowers/plans/2026-08-24-five-systems-complete.md` — **not yet coded**.
6. Do **not** revive Everyday Readiness, Expo, Coach/ARC, recipes/charts UI.
7. `coordinator.smoke.mjs` pins `completedAt` to `2026-08-24T12:00:00` (commit
   `c45d333`) so the fixture week does not depend on `Date.now()`.
8. After code: `pnpm run verify`; `bash apps/mobile/sync-hybrid-html.sh`; bump
   `LOCAL_BUILD` + SW `CACHE` together.

---

## 1. Current project state

Repo: `reflectprotect123-max/strengthside` (strength half of THE Hybrid
System; **same Supabase** as the hybrid repo). **Ship branch: `main`**
(`4c3cc4d` — five-engine docs via PR #42; polish + coach scrub **v59** at
`03153e4`). Feature work branches off `main`. Do **not** treat old
`cursor/engine-stage*` / Expo stacks as tip.

**Live athlete deploy (Netlify):** https://thehybridsystem.netlify.app/  
(Old `papaya-cheesecake-059e06.netlify.app` is dead.)  
Workflow: `.github/workflows/deploy-athlete-netlify.yml`

**Dogfood APK:**  
https://github.com/reflectprotect123-max/strengthside/releases/tag/dogfood-latest  
CI: `.github/workflows/dogfood-apk.yml` on `main` when `apps/mobile/**` changes.  
Athletes tap **Update** in Settings for service-worker cache.

| Role | Path |
| --- | --- |
| **Edit this** | `apps/mobile/prototype/hybrid-app/index.html` (+ adapters/bundles below) |
| Then sync | `bash apps/mobile/sync-hybrid-html.sh` |
| Synced copies | `apps/mobile/THE-Hybrid-App.html`, `apps/mobile/preview-site/` |
| Cap dogfood | `apps/mobile/capacitor/` |
| Cache / Update | **`the-hybrid-athlete-engine-v60`** |
| Shell stamp | `ATHLETE_SHELL_VERSION=athlete-hybrid-strength-v10-2026-08-23` |

Storage: local-first `localStorage` key `THE-builder-clean-v1` (+ nutrition DB).  
Owned Postgres: exactly **twelve** tables (`metric` … `coaching_note`) +
`embed-coaching-note`. Never migrate hybrid-owned tables (`CLAUDE.md`).

### Five systems — engines exist; wiring incomplete

| # | System | Package / module | In app today |
| --- | --- | --- | --- |
| 1 | **Strength** | `@hybrid/strength-engine` (~120 tests) | **Phase 1 complete (v60):** `%WM` resolve on start, engine e1RM + `sessionLoad` tonnage kg, set-row sync snapshot, Progress grouped by session |
| 2 | **Conditioning (The Engine)** | `@hybrid/engine` (~270 tests) | Zones, builder, BLE HR, weekly zone line, TRIMP finish, Concept2/Echo light — **`conAdapt` / `conProgLevel` not wired** on finish |
| 3 | **Nutrition** | `nutrition-core` + `nutrition-engine` (~161+175) | Daily log, barcode/label, weekly adaptive check-in, sync — day-status → adaptive path incomplete; **recipes/charts out of next scope** by owner lock |
| 4 | **Recovery** | `recovery-engine.js` (pure, not its own npm package) | Gates strength autopilot bumps; posture for Coordinator — **must stay invisible** (no Recovery dial / capacity chrome) |
| 5 | **Coordinator** | `packages/strength-engine/src/coordinator.ts` + `coordinator-adapter.js` | Silent weekly brain — athlete **“This week” peek still present**; Phase 5 must **remove** it |

**Visible dials:** The Engine (teal) + Hybrid Strength (copper) + Sleep/check-in + Nutrition + Calendar/Settings.  
**Invisible brains:** Recovery + Coordinator decisions (+ silent strength/cond progression).

### Athlete shell today

Bottom nav: **Home · Library · Calendar · Settings** (Coach Tools **removed**).

- **Home:** Sleep + Conditioning + Nutrition; briefing polish (v58).
- **Library:** Hybrid Strength — Full Body A, build/edit, Progress.
- **Calendar:** week strip + schedule / preview / resume (+ schedule today).
- **Settings:** Update, WHOOP, Concept2, Nutrition/Strength sync, HR, Export, strength schedule.
- **Coach/ARC athlete copy:** scrubbed **v59** → Session note, Lift cue, Workout builder, Add notes. Storage keys `coachNote` / `coachInstructions` **kept**. CSS `.liftcue` / `.bulletlist`.

### Engine import Stages 1–4 (conditioning)

| Stage | Status |
| --- | --- |
| 1 Brain (`@hybrid/engine`) | ✅ shipped |
| 2 Logger (weekly zones, finish split, provenance, intervals) | ✅ shipped |
| 3 Connectors (Concept2 + Echo, Chrome Android/desktop) | ✅ light shipped |
| 4 APK / store / iOS native BLE | 🟡 dogfood APK exists; **not** Play Store / iOS BLE — **out of** five-systems scope |

### Hybrid athlete roadmap Phases 1–12 — **shipped on `main`**

Specs under `docs/superpowers/specs/2026-08-24-*.md`.  
Plan: `docs/superpowers/plans/2026-08-24-hybrid-athlete-slices.md`.  
PRs **#35–#37** family: volume budget, silent wire, Progress, load headline, strength sync, engine weekly honesty, recovery engine, Coordinator, gap closure, recovery v2, delivery ledger, illness record-only, schedule today.

### UI polish — **shipped on `main`**

Plan: `docs/superpowers/plans/2026-08-23-athlete-ui-ux-full-polish.md`

| PR | What | Cache |
| --- | --- | --- |
| #38 | Tokens, tap/focus floor, Library copper | v57 |
| #39/#40 | Home/Engine/Calendar/Settings + coach scrub | **v59** |

Optional leftover: polish Task 8 final slop audit (not blocking five-systems).

### Naming (locked)

THE Hybrid System is **five engines**:

| Engine | Athlete name | Visibility |
| --- | --- | --- |
| Strength | Hybrid Strength | Visible (Library / log / Progress) |
| Conditioning | The Engine | Visible (Home / HR log) |
| Nutrition | Nutrition | Visible (Home daily log) |
| Recovery | — | **Invisible** (gates only; no dial) |
| Coordinator | — | **Invisible** (silent apply; no weekly peek) |

- **The Engine** = conditioning (never Morpheus in athlete UI).
- **Hybrid Strength** = lifts / WM / PRs / progression.
- CSS `mph-*` = legacy Engine classes. Do not reintroduce two-dial-only framing.

### Hard product locks (do not silently reverse)

- Everyday Readiness / SZN lifts **retired** (`purge*` on load).
- Guide / block-help **off**.
- Coach / ARC product / Expo / second athlete shell **cancelled**.
- **Silent apply** for progression + Coordinator — no accept/decline autopilot UI.
- **Soft volume** — never block save / clamp sets.
- **Training never blocked**; pain Yes holds **strength bumps** only.
- Illness = **record-only** (no auto-stop). Auto-coach deleted; restore = new decision.
- Do not use HRV as pain/injury/illness gate.
- `@hybrid/strength-engine` stays **pure** (zero I/O).
- Shared-Supabase contract in `CLAUDE.md`.

---

## 2. What shipped this evening (do not redo)

- Hybrid athlete arc + Phases 1–12 on `main`
- UI polish + **coach/ARC scrub v59** (`main` `03153e4`, PRs #38–#40)
- Engines already tested in packages — gap is **HTML wiring**
- Five-engine spec + plan + handoff on **`main`** via **PR #42** (supersedes draft PR #41)

Useful command: `pnpm run verify`

---

## 3. Active gaps / known limits

**Addressed by five-systems plan (Phase 2+ not coded yet):** see §0 and the plan file.

**Especially easy to forget:**

- `index.html` `openWeeklyReview` = **Coordinator** peek (hide in Phase 5).  
  `NutritionUI.openWeeklyReview` = **nutrition check-in** (keep).
- `coordinator.smoke.mjs` pins `completedAt` (`c45d333`) — do not revert to `Date.now()`.
- Cond `conAdapt` exists in `engine-bundle.js` but finish path does not persist `conProgress`.
- Recovery must remain **UI-less**.

**Platform limits (not defects to delete):**

- iOS Safari: no Web Bluetooth HR — typed Avg HR fallback.
- Local migrations check fails without OS pgvector — do not remove extension.
- Stage 4 store / iOS native BLE out of five-systems scope.

---

## 4. Precise next steps (after chat clear)

1. Read **§0–§4** + `CLAUDE.md`.
2. Merge **PR #43** (`cursor/five-engines-strength-e9c2`) when green; then branch for Phase 2.
3. Execute plan from **Task N1** onward (Nutrition day-status → adaptive check-in).
4. Never add recipes/charts, Recovery dial, Coordinator weekly peek (until Phase 5), Coach/Expo/ER.
5. Each HTML ship: sync + cache bump + refresh this handoff stamp.
6. Optional later: polish Task 8 slop audit; phone dogfood proof; Stage 4 store/iOS.

### Critical paths

```
docs/superpowers/specs/2026-08-24-five-systems-complete-design.md
docs/superpowers/plans/2026-08-24-five-systems-complete.md
apps/mobile/prototype/hybrid-app/strength-entry.ts
apps/mobile/prototype/hybrid-app/strength-adapter.js
apps/mobile/prototype/hybrid-app/strength-sync.js
apps/mobile/prototype/hybrid-app/load-headline.js
apps/mobile/prototype/hybrid-app/engine-adapter.js
apps/mobile/prototype/hybrid-app/recovery-engine.js
apps/mobile/prototype/hybrid-app/coordinator-adapter.js
apps/mobile/prototype/hybrid-app/nutrition-ui.js
apps/mobile/prototype/hybrid-app/index.html
apps/mobile/prototype/hybrid-app/service-worker.js
```

### Branches / PRs

| Item | Notes |
| --- | --- |
| **`main` @ 03153e4** | Ship tip; cache **v59** |
| **PR #41** | Spec + plan — **start here** |
| Old open PRs (#2–#14, #32, …) | Expo/engine-stage/docs noise — ignore unless owner says otherwise |

### How Conditioning works (still true)

- Connect strap = Web Bluetooth `heart_rate` (Chrome Android/desktop; not iOS Safari).
- Start/Pause = session clock; Complete → cond summary (minutes/avg/max/load + zone split).
- Back → Home, pause BLE, 120s “finished?” watch.

### Twin instruments (still true)

The Engine (teal) + Hybrid Strength (copper); Track Dawn tokens; polish plan anti-slop list still applies.

---

> **History below this line is superseded for “where are we / what next.”**
> Keep for archaeology only. Do not follow “next session” bullets that say
> Expo, `home.html`, v43c, or Phase B/C as the active plan.

## 21 August 2026 — mobile Home first draft + Cursor tooling

Branch: `cursor/mobile-home-screen-2ff0` (PR against `main`). Working style:
screenshot → 1:1 mobile screen → iterate page by page. Preview via Expo web
at `:8081`.

### What shipped in the app

- **`apps/mobile/src/HomeScreen.tsx`** replaces the METRICS placeholder.
  Shell kept from the TrainHeroic-style screenshot (header ALL ATHLETES,
  LATEST, bottom nav). Card interior cleared.
- **SLEEP** module: three WHOOP-style rings (Recovery / Strain / Sleep).
  Tap opens ARC-style readiness overview (brass gauge, readiness band,
  HRV / RHR / Sleep / Strain trend cards).
- **CONDITIONING** module under Sleep: Engine four-zone bar
  (Rec / Aer / An / Peak). BPM ceilings from `zonesForReadiness(recovery)` —
  higher recovery lifts ceilings. Tap opens the simple Cond logger: half-gauge
  plus Start, which connects a Bluetooth HR strap (`heart_rate` GATT) and
  drives live bpm. Complete stores avg/max from the stream. Web Bluetooth only
  (Chrome Android/desktop; not iOS Safari). Avg HR can still be typed.
- **NUTRITION** module under Conditioning: FBB-style card — macro rings
  (P/C/F), TODAY label, kcal left, horizontal P/C/F bars. Sample:
  2,529 kcal left, 0/164g · 0/225g · 0/70g.
- Single session card dated **Thursday, August 20, 2026** (Wednesday card
  removed). Fixture data only — no Supabase wiring yet.
- Tests: `apps/mobile/src/HomeScreen.test.tsx` (jest-expo). Web preview deps
  added (`react-dom`, `react-native-web`, `react-native-svg`,
  `@expo/vector-icons`).

### What was installed for the agent

See **`skills.md`** (Cursor / Claude Mem sections added this session). Short
list:

- `.cursor/skills/` — ui-ux-pro-max (+ bundled design skills),
  frontend-design, caveman, mem-search
- Claude Mem — built at `/home/ubuntu/claude-mem`, hooks in
  `.cursor/hooks.json` + user `~/.cursor/hooks.json`, worker can run with
  Gemini. API key lives only in `~/.claude-mem/settings.json` (never commit).

### Still not done

- Phase B coach authoring UI
- Phase C full logger (session state machine, set logging, offline sync)
- Real athlete data / Supabase client on mobile
- Suggested-swaps / points-of-performance schema decisions
- Preview PNGs under `/workspace/expo-*.png` are local artifacts, not
  committed

### Static HTML snapshot (no Expo)

Open **`apps/mobile/prototype/home.html`** in a browser. Interactive phone
mock of Sleep / Conditioning / Nutrition + readiness overlays; PNG captures
under `apps/mobile/prototype/shots/`. RN `HomeScreen.tsx` remains source of
truth — this HTML is the shareable freeze of where the UI was on 21 Aug.

### Hybrid PWA shell (Home drop-in)

**`apps/mobile/prototype/pwa/`** — early packaging experiment (Home-only).

**`apps/mobile/prototype/hybrid-app/`** — **the real drop-in**: uploaded Hybrid
Logger/Builder `index.html` with Sleep / Conditioning / Nutrition injected at
the top of Home. Tap **Sleep** → top tabs **Check-in | Overview** (check-in
lives here, not in bottom nav). Full-app chrome polish + design tokens in
`design-system/the-hybrid-system/`. Serve with `python3 -m http.server 4173`
from that folder.

### Next session — start here

1. Read this checkpoint + `skills.md` Cursor section.
2. Open `apps/mobile/prototype/home.html` for a no-install look, or
   `pnpm install` then `pnpm --filter @hybrid/strength-mobile start` (Expo)
   to keep iterating the real screen.
3. Continue page-by-page from the next athlete screenshot, or wire Home
   fixtures to `assigned_session` / performed data when ready.
4. If Claude Mem worker dead after recycle: rebuild/start from
   `/home/ubuntu/claude-mem` (or re-clone), restore Gemini key into
   `~/.claude-mem/settings.json`, `bun plugin/scripts/worker-service.cjs start`.

---

> Older checkpoint (20 August) kept below for history. Superseded on UI
> status: mobile Home UI **does** exist now as a draft on the feature
> branch; Phase B and full Phase C logger remain unstarted.


## 20 August 2026 — toolchain vendored, one bug found and fixed

Starting point was the `20-august-handoff-pack.zip` produced in a prior Cowork
session (cloud sandbox, no push credentials — see that pack's own
`START-HERE.md` for what it covers: the Phase B plan, the design-conflict
blocker, the TrainHeroic research, and `arc-prototype.html`). Of that pack's
three "do these first" items, only the first was done this session; the other
two are cross-repo and still open — see below.

- **Vendored superpowers v6.3.0** (14 skills) from the pack's
  `superpowers-bundle/` to `vendor/skills/`, added `scripts/ensure-skills.sh`
  and `skills.md`, and added `.claude/skills/` to `.gitignore`. This satisfies
  the Phase B plan's `superpowers:subagent-driven-development` requirement,
  which had no vendored skill to resolve against before this.
- **Went further and matched the hybrid repo's full toolchain**, on explicit
  instruction: vendored caveman (7 skills + 3 cavecrew agents + 5 commands),
  supabase-agent-skills (2 skills), session-start-hook, and the three
  pre-existing skills (frontend-design, install-skill, ui-ux-pro-max) — 27
  vendored skill directories total, all committed under `vendor/skills/`
  (plus `vendor/agents/`, `vendor/commands/`, `vendor/hooks/`). Installed the
  two toolchains that cannot be vendored: **graphify v0.9.42** (`uv tool
  install graphifyy==0.9.42` then `graphify install`, user scope — the first
  attempt was blocked by this session's permission classifier as an
  unreviewed global install; completed on explicit instruction to proceed)
  and **claude-obsidian v2.1.0** (15 skills, cloned and pinned at `1c1bc49`).
  `skills.md` is the canonical record for all of it, split into VENDORED /
  INSTALLED / deliberately-excluded (omniroute) / platform-managed buckets,
  matching the hybrid repo's own inventory structure.
- **Found and fixed a real bug in `ensure-skills.sh` before trusting it.**
  The VENDORED bucket's restore loop reused the `USER_SKILLS` variable
  (`~/.claude/skills`, correctly reserved for the two INSTALLED toolchains)
  instead of the repo's own `.claude/skills`. The first run silently wrote
  all 27 vendored skills into user scope, duplicating what an earlier manual
  restore had already placed correctly at project scope — exactly the kind
  of check-that-doesn't-fail-right this repo's CLAUDE.md warns about, just
  in a setup script rather than a CI gate. Split the destinations
  (`CLAUDE_SKILLS` for vendored, `USER_SKILLS` for graphify/claude-obsidian),
  removed the 27 mis-placed user-scope copies by hand, and verified two
  consecutive runs report identical `27 healthy, 0 restored, 0 failed`
  output. **Do not trust a restore script's first green run** — this is why.
- **Reviewed `arc-prototype.html` from the pack** (published as an Artifact,
  not committed to this repo — it is a design reference per the pack's own
  `START-HERE.md`, not a starting codebase). Found and fixed one bug in the
  copy under review: below 900px width its nav rail collapsed from a left
  sidebar into a horizontal top bar, which is wrong inside a narrow preview
  panel. Fixed in the reviewed copy; **not yet ported back into this repo**,
  because the prototype itself isn't tracked here.

### Still open from the handoff pack

The pack's other two "do first" items are untouched, and both need
`THE-HYBRID-ENGINE1` attached with push access (this session only has read
access to it, added ad hoc to pull `skills.md` for comparison):

1. **Task 2 — excise strength from `THE-HYBRID-ENGINE1`.** Full list at
   `docs/superpowers/plans/2026-08-19-strength-repo-split.md` in that repo.
   Unblocked (this tree is live and pushed) but not started.
2. **Correct the stale checkpoint in the hybrid repo's own `handoff.md`.** It
   still reports two security holes as open that were fixed here on
   19 August (`c5701d3`, `0dde66f`) — see the pack's `START-HERE.md` for the
   exact wording to correct.

Also still open: the design-conflict blocker (`phase-b-design-conflicts.md`
in the pack) and the two schema decisions flagged below (suggested swaps,
points of performance) — neither was touched this session.

## 20 August 2026, later session — prototype matured, load model documented

The ARC coach-site prototype advanced a long way this session. It still lives
**outside this repo** as a design reference (published as a Claude Artifact;
the working file is an upload, not a tracked source file), so none of this is
Phase B implementation — it is the design those phases will implement.

What the prototype now demonstrates, in the order it was built:

- **Readiness screen** rebuilt WHOOP-style: three ring dials (Sleep /
  Recovery / Strain), metric rows with 7-day averages, insight card, weekly
  band-colored bars, sparklines.
- **Calendar-first session authoring** for Strength AND Conditioning: each
  pillar's "Build session" tab lands on a full-month calendar of its own
  sessions; hovering an empty day offers "+ Build session" / "+ Add from
  library"; the builder opens as an animated modal over the calendar,
  day-aware, closable by ×/backdrop/Escape. One shared `sessionCalendar(kind)`
  renders both so they cannot drift.
- **Conditioning builder mirrored to the strength anatomy**: per-round
  prescription table over the same 12-metric registry, separate column state
  per pillar, steady collapsing to one row. The minutes/distance inputs were
  replaced by duration/distance columns.
- **A premium visual pass** (lighting model with brass edge-lit glass
  surfaces, Archivo display face, glow on rings and CTAs), then a round-trip
  through Google Stitch: its good ideas were merged back deliberately (modal
  entrance animation, focus states everywhere, micro-interactions, scored
  pills) and its regressions rejected — Stitch had silently gutted the
  readiness screen, builder sidebars, Library, and deep-linking. The Stitch
  fork is preserved as its own separate Artifact for comparison.
- **Engine HR zones**: numeric zone boundaries on the engine's
  easy/medium/hard efforts (presented as blue/green/red with bpm ranges), a
  Recovery-Sync toggle that genuinely shifts every boundary from the day's
  recovery score, and the same zone system unified into the conditioning
  overview's time-in-zone card. **The shift formula is invented fixture
  logic** — flagged as such in the doc below.
- **Training load shown as a split** — `13.2 · cardio 9.1 / strength 4.1` —
  because one opaque number is the WHOOP failure mode for lifting.

**Committed to this repo** (`3d7c233`): `docs/data/training-load-model.md` —
the design doc behind that load figure. Two channels (TRIMP-style
zone-weighted duration for conditioning; session-RPE or relative tonnage for
strength), per-athlete normalization, the pain-blocked-counts-toward-load
rule, the cross-repo read constraint, verified citations (Foster 2001, Day
2004, Impellizzeri 2019, Buchheit 2014), and an explicit list of which
prototype numbers are fictions. **Design doc only — nothing computes this.**

### Plan agreed for the next session — BOTH DONE, see 21 August below

1. ~~Pull the strength material out of `THE-HYBRID-ENGINE1`~~ — done and
   merged to that repo's `main` (`bd34ec3`), see the Task 2 section below.
2. ~~Start the phone app~~ — plan written
   (`docs/superpowers/plans/2026-08-21-strength-phase-c-mobile-logger.md`);
   the BUILD path changed, see the 21 August section below.

## 21 August 2026 — split completed and merged; Phase C plan written; UI first-draft goes external

Morning session, continuing the 20 August plan. Three things happened, then
an owner decision changed how Phase C's UI gets built.

**1. Task 2 executed AND merged.** The excision branch was reviewed and
fast-forwarded into the hybrid repo's `main` (`34dfab4..bd34ec3`). The split
is finished on both sides: strength exists only in this repository, the
hybrid apps can never render it again (`Block` lost its strength member;
`sanitizeDB` there now filters strength-shaped blocks like legacy data), and
both repos' CLAUDE.md files carry the shared-Supabase contract. Before
deletion, a completeness audit pulled every only-in-hybrid strength asset
here (`c39cd79`) — see the Task 2 section below for the list.

**2. Phase C is planned, not started.**
`docs/superpowers/plans/2026-08-21-strength-phase-c-mobile-logger.md` is a
full nine-task, TDD, fixture-first plan. Its architecture decisions hold
REGARDLESS of who writes the UI (see 3): pure reducer owning all session
state, every action durably persisted before render (the kill test is Task
5), a `SessionRepository` seam with fixture data until Phase B publishes
real sessions, `labelFor` in the engine, jest-expo + test script added in
one commit (the standing trap note). Supabase sync/auth and the non-rest
timers are explicitly deferred WITH reasons, in the plan.

**3. Owner decision — the UI first-draft is being built EXTERNALLY.** The
owner is having Grok generate the mobile UI from 1:1 screenshots (the ARC
prototype's screens), and the collaboration continues from whatever that
produces. For whoever picks this up:

- **Treat the external drop the way this project treated the Stitch
  round-trip on 20 August**: audit it against what exists before merging
  anything. Stitch produced genuinely good ideas AND silently gutted
  working screens; assume the same mix. Diff, list what it adds and what it
  breaks, merge deliberately.
- **The plan's contracts are the review checklist.** Screenshot-driven
  codegen produces LOOK, not architecture: expect hardcoded fixture text
  where the engine should be called, component state where the durable
  reducer should be, and no offline story. Whatever the UI looks like, it
  lands on the plan's skeleton: reducer + persistence (Tasks 4–5), the
  repository seam (Task 3), engine calls for every number (`resolveTarget`,
  `roundLoadToEquipment`, `labelFor`, `detectPr` — never re-derived in a
  component), and the jest harness FIRST (Task 1) so the drop can be put
  under test as it is integrated.
- **The trap note still binds**: `apps/mobile` has no test script on
  purpose; the first test adds jest-expo AND the script in the same commit.
  An external drop does not get to skip that — it is the commit that makes
  the drop reviewable.
- The ARC prototype (the screenshot source) is the published Artifact from
  the 20 August design sessions; its latest state includes the 3-dial
  readiness screen, calendar-first builders, and Recovery-Sync zones. It is
  a COACH-site design — the phone logger has no 1:1 screen in it beyond the
  session/prescription patterns, so expect Grok's output to be an
  interpretation, not a copy.

## What this is

The strength half of THE Hybrid System, split out of
`reflectprotect123-max/THE-HYBRID-ENGINE1` on 19 August 2026 per
`docs/superpowers/plans/2026-08-19-strength-repo-split.md` in that repository.
Same Supabase project, separate repo, own web and mobile apps.

`pnpm run verify` is green: **4 workspace projects typecheck, 123 tests pass**
(111 engine · 10 edge function · 2 web), migrations apply, web builds.

## What came across, and from where

Copied byte-identical from hybrid `34dfab4` (verified with `diff -r`):

- `packages/strength-engine` — the whole package, 33 source files. Metric
  registry, exercise/equipment, prescription resolution, load rounding, e1RM,
  working-max events, PR detection, exposure classification, calibration,
  progression, query text.
- `supabase/migrations` — the five strength migrations, unchanged. They are
  already applied-or-pending against the shared project and **renaming an
  applied migration breaks the shared ledger**.
- `supabase/functions/embed-coaching-note` — whole, with its workspace config.

Git history stayed in the hybrid repo, the same way every deletion there kept
its history rather than carrying it.

### Four deviations from "copied verbatim"

Each is a real dependency the split plan's file list missed. Each was found by
running the tree, not reading it.

1. **`scripts/gen-metric-registry.mjs` came too.** `metric.test.ts` shells out to
   it at repo root to prove `metric.ts` has not drifted from the migration seed.
   Without it that test fails `MODULE_NOT_FOUND`, which reads like a broken test
   rather than a missing file.
2. **The `@hybrid/shared-core` dependency was dropped.** `strength-engine`
   declared it in `package.json` and imported **nothing** from it — zero
   references in any source file. A `workspace:*` dependency on a package that
   does not exist here fails install. The package was already standalone.
3. **`supabase/functions/tsconfig.json` gained `lib: ["ES2022", "DOM"]`.**
   `tsconfig.base` is ES2022 only, so `fetch` and `Response` were unresolved —
   7 errors.
4. **`packages/strength-engine` gained `@types/node`**, for `import.meta.url`.

## What was built new here

- **`apps/web`** — Vite + React + react-router + supabase-js. One route
  (`/bench`), the brass palette copied from the hybrid repo's
  `packages/design` `strengthBrand`, and a Supabase client that returns `null`
  rather than throwing when the env is unset, so a fresh clone shows a named
  "not configured" state instead of a white screen. The screen renders the
  engine's `METRICS` registry — deliberately, as the cheapest proof the
  workspace link is real. If the package link breaks the screen goes blank
  instead of lying.
- **`apps/mobile`** — minimal Expo SDK 54 scaffold (RN 0.81 / React 19, matching
  the hybrid repo so a shared React major holds if these ever meet again). One
  placeholder screen, same METRICS-reading trick. **No test script**, on
  purpose — see below.
- **`checks/migrations-apply.mjs` + `checks/sql/strength-prelude.sql`** — a
  strength-scoped port. The hybrid original is ~2100 lines because it also
  proves the ecosystem RPCs, the MacroTrack catalogue and roster erasure; none
  of that is this repo's. The prelude stubs what this repo does **not** own
  (`auth.uid()`, the three Supabase roles and grants, and
  `public.coaches_athlete_anywhere(uuid)` from hybrid's
  `20260813_arc_roster_invites_and_names.sql`), each stub naming its real owner.
- **`CLAUDE.md`** — the carried-over rules plus the shared-Supabase contract.
- **`.github/workflows/ci.yml`** — installs pgvector, runs the same set as
  `pnpm run verify`, and fails if `KNOWN ENVIRONMENT GAP` appears in the
  migrations output (in CI the extension IS installed, so the marker means the
  install broke).

### Three defects found while assembling, worth not re-introducing

1. **`ON_ERROR_STOP=1` is load-bearing in the migrations check.** It was dropped
   during the port. Without it `psql` exits 0 even when every statement in a
   file errored, so the check printed `PASS — applies
   20260819_phase_f_knowledge_base.sql` for a migration that created nothing.
   Caught only because pgvector was genuinely absent and the run still went
   green — the precise "a check that cannot fail" shape CLAUDE.md warns about.
   **The hybrid repo has always had it; this was a porting error, not a bug
   there.**
2. **Multi-line SQL cannot cross `su -c`.** A newline inside a statement arrives
   at the server as a literal `\n` and dies with a syntax error pointing at a
   backslash nobody wrote. Every statement is collapsed with `oneLine()` before
   it goes near psql. Do not re-wrap for readability.
3. **A metric's key and its canonical unit can be the same string** (`rpe`), so
   a testing-library text query matches two cells and fails for a reason that
   has nothing to do with the screen. `apps/web`'s test queries by
   `data-metric-key` instead.

## Deliberate omissions — read before "fixing" these

- **`apps/mobile` has no `test` script.** There is no suite yet. The
  alternative was `jest --passWithNoTests`, which CLAUDE.md bans: it makes "a
  test that stops being collected does not fail, it silently disappears"
  permanently true of that package. An absent script is visibly absent; a
  passing empty suite is not. **Phase C's first test adds jest-expo AND the
  script in the same commit.**
- **`@hybrid/strength-engine` was not renamed.** Renaming it would have touched
  every import in a tree that had just been proven green. A rename is a change
  to make deliberately, not as a side effect of moving house.
- **`apps/web`'s vite config is minimal.** The hybrid original carries a PWA
  manifest, a three-way product switch and a pile of CSP-driven build settings.
  None of it is earned by a bench with one screen. Add a setting when something
  needs it, with the reason.

## Open runtime notes

- **`embed-coaching-note` deploy step.** Deploy with `--no-verify-jwt` **and**
  set the `EMBED_WEBHOOK_SECRET` function secret. A deploy that forgets the
  secret rejects every call — by design (`_auth.ts` returns 500 rather than
  failing open), but it looks like an outage if you do not know.
- **pgvector is a known environment gap locally**, never in CI. Do not "fix" it
  by removing the extension.
- **`coaches_athlete_anywhere`'s signature is a cross-repo contract.** If the
  hybrid repo changes its argument or return type, this repo's RLS breaks in
  production and the only warning is `checks/migrations-apply.mjs` going red.
  There is no automated guard — the shared database will not tell you.

## What is next

> Superseded in part by the "Plan agreed for the next session" above: Task 2
> excision + Phase C phone app are the immediate next moves. Phase B remains
> the larger arc and everything below still applies to it.

**Phase B — coach authoring UI** (Slices 12–14 of the rebuild spec, which lives
in the hybrid repo at `docs/superpowers/specs/2026-08-17-strength-rebuild-
design.md`). No implementation plan written yet. Design input informed by a
TrainHeroic teardown exists as `strength-phase-b-coach-authoring-DRAFT.md`,
produced outside this repo; it maps the teardown's findings onto Slices 12–14
and flags two schema decisions that want answering **before** writing-plans
locks the `Exercise` entity:

1. **Suggested swaps** — add `suggestedSwapIds: string[]` (max 3)? There is no
   field for it today.
2. **Points of performance** — its own field, or reuse `Exercise.cues`?

Both are cheap now and a migration later.

**Phase C — mobile logger** (Slices 18–25). Not scoped. Nothing in the
TrainHeroic research covers the athlete app — every athlete-side claim in that
material rests on official support documentation, never on an observed screen.

## Task 2 of the split — EXECUTED 21 August 2026, awaiting merge

The excision is done on the hybrid repo's `claude/strength-excision` branch
(commit `bd34ec3`, 94 files, −5,677 lines), full verify + 18/18 browser
shots green there. It is a BRANCH, deliberately — the owner merges it to
`main`, the plan's "on main" step, when ready.

Before deleting anything, a completeness audit confirmed this repo carries
everything: the engine/migrations/function are byte-identical (two documented
config divergences only), and the material that existed ONLY in the hybrid
repo was pulled here first (`c39cd79`): the strength specs and plans, the
strength-adaptive-engine-v2 research with the 120-exercise library, the
TrainHeroic build package (`docs/design/trainheroic-build-package/`), and the
old logger's parity harness as reference (`docs/reference/parity-harness/`).

Two notes from the excision worth keeping:
- The hybrid repo's `checks/web-touch.mjs` fails at the split commit
  `34dfab4` too — it walks an exercise-library picker `BlockEditor.tsx` no
  longer renders. Pre-existing there, not caused by the excision, reported
  in the excision commit message.
- The hybrid handoff's stale security-holes claim (the pack's open item 2)
  was corrected in the same commit — both items were fixed 19 August
  (`c5701d3` / `0dde66f`) and the fixes live in this repo now.
