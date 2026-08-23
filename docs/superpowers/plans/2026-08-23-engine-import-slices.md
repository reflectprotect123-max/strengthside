# Engine import — staged slice plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Import APK `@hybrid/engine` into strengthside and wire The Engine dial without touching Hybrid Strength or redesigning screens.

**Architecture:** Full `@hybrid/engine` + `@hybrid/shared-core` as packages; browser bundle; thin adapter into existing HTML. Strength UI/code frozen. Connectors after logger solid.

**Tech Stack:** TypeScript packages, Vitest, esbuild IIFE bundle, existing Hybrid HTML app (`apps/mobile/prototype/hybrid-app/`).

**Spec:** `docs/superpowers/specs/2026-08-23-engine-import-design.md`

## Global Constraints

- Screens stay intact — no Engine UI redesign in Stages 1–2.
- **Hybrid Strength freeze:** do not edit Library / strength log / templates / `@hybrid/strength-engine` consumers.
- Wire only cond/HR/zones/load/concept2 paths from `@hybrid/engine`.
- Never brand The Engine as “Morpheus”.
- `pnpm run verify` must stay green; add package tests to the workspace.
- Bump `LOCAL_BUILD` + SW `CACHE` together when shipping HTML.
- No MacroTrack / foreign-table migrations.
- Stage 4 (APK) does not start until Stage 2 exit criteria pass.

## File map

| Path | Role |
| --- | --- |
| `packages/shared-core/` | Dep of engine (copy from hybrid) |
| `packages/engine/` | APK cond brain (copy from hybrid) |
| `apps/mobile/prototype/hybrid-app/engine-entry.ts` | Browser export surface (cond/HR only) |
| `apps/mobile/prototype/hybrid-app/engine-bundle.js` | IIFE `window.HybridEngine` |
| `apps/mobile/prototype/hybrid-app/engine-adapter.js` | Map HTML state ↔ engine (new) |
| `apps/mobile/prototype/hybrid-app/index.html` | Call adapter; **do not** rewrite strength |
| `apps/mobile/sync-hybrid-html.sh` | Copy new assets |
| `handoff.md` / charter | Checkpoint only after stage exits |

### Explicit freeze list (do not open unless compile-forced)

- Strength task/log/finish paths in `index.html` (`strengthTask`, `toggleSet`, tonnage finish, Full Body A)
- `packages/strength-engine/`
- Nutrition UI (unless engine bundle accidentally breaks script order — fix load order only)

---

# Stage 1 — Brain in the room (usable)

**Exit:** Zones, prescription, and finish load numbers for a steady session come from `@hybrid/engine`. Strength unchanged. Package tests green.

### Slice 1.1 — Copy `@hybrid/shared-core`

- [ ] Copy hybrid `packages/shared-core` → `/workspace/packages/shared-core`
- [ ] `pnpm install`; `pnpm --filter @hybrid/shared-core test` green
- [ ] Commit: `chore: add @hybrid/shared-core for engine dep`

### Slice 1.2 — Copy `@hybrid/engine`

- [ ] Copy hybrid `packages/engine` → `/workspace/packages/engine`
- [ ] Confirm `package.json` name stays `@hybrid/engine`
- [ ] `pnpm install`; fix workspace only if needed
- [ ] Commit: `chore: add @hybrid/engine from hybrid APK`

### Slice 1.3 — Make engine tests green here

- [ ] Run `pnpm --filter @hybrid/engine test`
- [ ] Fix env-only failures (paths, vitest config) — **no math changes**
- [ ] Commit only if fixes required

### Slice 1.4 — Add to `pnpm run verify`

- [ ] Ensure workspace `typecheck`/`test` picks up engine + shared-core (already `-r` — confirm)
- [ ] Run full `pnpm run verify`
- [ ] Commit: `chore: engine packages in verify`

### Slice 1.5 — Cond-only browser entry

- [ ] Create `engine-entry.ts` exporting **only** cond-safe surface, e.g. `Hr`, `Conditioning`, `Concept2`, needed constants/types — not plates/autoreg as HTML API
- [ ] Comment in file: “HTML must not call strength leftovers”
- [ ] Commit: `feat: engine-entry cond surface`

### Slice 1.6 — Build `engine-bundle.js`

- [ ] `build-engine.sh` (esbuild IIFE `globalName: HybridEngine`) mirroring nutrition
- [ ] Commit generated bundle
- [ ] Commit: `feat: engine-bundle for HTML`

### Slice 1.7 — Load scripts without breaking strength

- [ ] Add `<script src="./engine-bundle.js">` (+ adapter later) next to nutrition scripts
- [ ] Headless smoke: Home / Library / strength template still render; `HybridEngine` defined
- [ ] Commit: `feat: load engine-bundle in athlete HTML`

### Slice 1.8 — Adapter skeleton

- [ ] Create `engine-adapter.js` with `EngineUI` or `HybridEngineAdapter` namespace
- [ ] Functions: `zonesForProfile({maxHr, restingHr, recovery})`, `trimp(...)`, stubs returning engine results
- [ ] Unit-smoke in headless: zones array length 4
- [ ] Commit: `feat: engine-adapter skeleton`

### Slice 1.9 — Wire Home zone bands (math only)

- [ ] Replace `athZonesForReadiness` internals to call adapter (keep same return shape the HTML expects)
- [ ] Visual: Home CONDITIONING module unchanged layout
- [ ] Headless: labels SLEEP / CONDITIONING / NUTRITION; zone BPM present
- [ ] Commit: `feat: Home zones from @hybrid/engine`

### Slice 1.10 — Drop demo recovery fiction where engine has real helper

- [ ] If engine exports WHOOP/recovery→zone helpers, use them; else document remaining `athSaneRecovery` default as temporary
- [ ] Do **not** invent a new formula
- [ ] Commit if behavior changes

### Slice 1.11 — Wire builder prescription fields

- [ ] Map `COND_FORMATS` / efforts → engine format/effort enums via adapter
- [ ] Keep builder UI identical; only change how block fields are filled on Start
- [ ] Headless: Start session still opens live log
- [ ] Commit: `feat: builder start uses engine prescription`

### Slice 1.12 — Wire finish load (steady path)

- [ ] Replace `hrTrimp` / `condLoad` with engine equivalents for simple cond complete
- [ ] Finish sheet chrome unchanged
- [ ] Commit: `feat: cond finish load from engine`

### Slice 1.13 — Stage 1 parity check

- [ ] Pick 2–3 golden vectors from engine tests; assert adapter outputs match in a small `engine-adapter` smoke script or vitest
- [ ] Commit: `test: stage1 engine adapter parity`

### Slice 1.14 — Stage 1 handoff bump

- [ ] Bump `LOCAL_BUILD` / SW cache; sync preview; update `handoff.md` Stage 1 done
- [ ] Commit: `chore: engine stage1 ship stamp`

**Stage 1 stop gate:** train one steady BLE or typed-HR session; Strength Full Body A log still works.

---

# Stage 2 — Logger catches up (usable → solid)

**Exit:** Interval/tempo sessions run with work/rest clocks; zone seconds have provenance; Home has weekly zone minutes.

### Slice 2.1 — Inventory gap doc (no code)

- [ ] List what `renderSimpleCondLog` ignores today (interval timers, felt zones)
- [ ] Commit a short note under `docs/superpowers/plans/` or handoff bullet only — optional if this plan is enough

### Slice 2.2 — Persist format on ad-hoc session

- [ ] Ensure `startCondFromBuilder` stores format/rounds/work/rest on the task in a shape adapter can read
- [ ] Commit: `feat: persist cond format on session task`

### Slice 2.3 — Interval work clock UI (existing chrome)

- [ ] Add work/rest countdown into **existing** live log card (minimal controls — no redesign)
- [ ] Commit: `feat: interval work/rest clock in live log`

### Slice 2.4 — Advance rounds

- [ ] On work complete → rest; on rest complete → next round; finish after last
- [ ] Commit: `feat: interval round advancement`

### Slice 2.5 — Tempo path

- [ ] Same runtime for tempo format using engine timing fields
- [ ] Commit: `feat: tempo runtime`

### Slice 2.6 — Zone seconds provenance

- [ ] Tag zone seconds `measured` (BLE) vs `typed` / `none`
- [ ] Do not invent felt-zone credit yet unless engine API is clear
- [ ] Commit: `feat: zone seconds provenance`

### Slice 2.7 — Keep BLE path

- [ ] Confirm `startBleHr` still feeds zone tick; adapter consumes HR samples if engine wants them
- [ ] Commit only if glue changes

### Slice 2.8 — Typed Avg HR fallback unchanged UX

- [ ] iOS / no-BLE path still works; load uses typed avg via engine
- [ ] Commit if needed

### Slice 2.9 — Weekly zone aggregate helper

- [ ] Adapter: sum zone seconds for last 7 local days from completed cond sessions
- [ ] Pure function + small test
- [ ] Commit: `feat: weekly zone aggregate`

### Slice 2.10 — Home weekly dose card (one module addition)

- [ ] Add a quiet weekly line/card under CONDITIONING **or** inside the module — no new nav tab
- [ ] Copy: zone minutes, not fake 0–100 score
- [ ] Commit: `feat: Home weekly zone minutes`

### Slice 2.11 — Finish sheet shows zone split

- [ ] Cond-primary finish lists Rec/Aer/An/Peak minutes when present
- [ ] Commit: `feat: finish zone split`

### Slice 2.12 — Leave/finish prompt still works

- [ ] Regression: leave → pause → 120s prompt unchanged behavior
- [ ] Commit only if broken

### Slice 2.13 — Stage 2 headless + manual checklist

- [ ] Headless: start intervals from builder, advance one round (clock mock)
- [ ] Manual checklist in PR: BLE session + typed session
- [ ] Commit: `test: stage2 logger smoke`

### Slice 2.14 — Stage 2 ship stamp

- [ ] Bump build; handoff “Stage 2 solid”
- [ ] Commit: `chore: engine stage2 ship stamp`

**Stage 2 stop gate:** one real week of training feels honest; Strength still untouched.

---

# Stage 3 — Connectors light (C2 + Echo together)

**Exit:** Optional Concept2 import and Echo FTMS watts on Chrome Android; degrade cleanly elsewhere. No strength edits.

### Slice 3.1 — Audit hybrid Netlify C2 funcs

- [ ] List which `concept2-*.mjs` can live under `apps/mobile/preview-site/netlify` without hybrid auth assumptions
- [ ] Note token storage approach for HTML (local only)

### Slice 3.2 — Port C2 Netlify stubs

- [ ] Add connect/callback/sync functions (copy/adapt)
- [ ] Commit: `feat: concept2 netlify stubs`

### Slice 3.3 — Settings Concept2 card (minimal)

- [ ] Settings section: Connect / Sync — Track Dawn styling, no new tab
- [ ] Commit: `feat: settings Concept2 card`

### Slice 3.4 — Wire `planConcept2Import` / `applyConcept2Import`

- [ ] Use `@hybrid/engine` concept2 helpers; merge into local sessions carefully
- [ ] Never overwrite strength sessions
- [ ] Commit: `feat: concept2 import apply`

### Slice 3.5 — C2 empty/error states

- [ ] Denied OAuth, no results, network fail → clear athlete copy
- [ ] Commit: `fix: concept2 error states`

### Slice 3.6 — Echo FTMS research starter → adapter

- [ ] Port Web Bluetooth FTMS parse from hybrid research starter into `engine-adapter` or `echo-ftms.js`
- [ ] Commit: `feat: echo ftms parser`

### Slice 3.7 — Connect Echo button on live log

- [ ] Only show when `air_bike` / Echo modality selected (or explicit Connect Echo)
- [ ] Chrome Android first; hide/disable with reason on unsupported browsers
- [ ] Commit: `feat: echo connect on live log`

### Slice 3.8 — Stream watts/cadence into log

- [ ] Display live watts; store device id with result (`air_bike` + Echo)
- [ ] Commit: `feat: echo live watts`

### Slice 3.9 — Do not cross-brand calories

- [ ] Guard: never treat Echo cals as portable; follow engine/device rules
- [ ] Commit: `fix: echo device-tagged metrics`

### Slice 3.10 — Dual-connect policy

- [ ] Document: HR strap + Echo can coexist; if conflict, prefer explicit athlete choice
- [ ] Minimal UI: two status lines, not a redesign
- [ ] Commit: `feat: hr+echo status lines`

### Slice 3.11 — Stage 3 degrade matrix

- [ ] iOS Safari: C2 OK if OAuth works; Echo unavailable message
- [ ] Desktop Chrome: both testable
- [ ] Commit: `docs: stage3 connector matrix` (short handoff blurb OK)

### Slice 3.12 — Stage 3 ship stamp

- [ ] Bump build; handoff
- [ ] Commit: `chore: engine stage3 ship stamp`

**Stage 3 stop gate:** you can sync a C2 row **or** ride Echo on Android Chrome once; failures never brick Strength.

---

# Stage 4 — APK shell (later plan)

Do **not** expand here until Stage 2 exit is signed off.

### Slice 4.1–4.10 (placeholders for a future plan only)

- Capacitor (or chosen shell) around `preview-site`
- Bundle IDs, icons, splash
- Native BLE for HR (replace Web Bluetooth on iOS)
- Native FTMS for Echo
- Play internal testing → then store listing
- Update path vs Netlify SW
- Privacy policy / account-or-backup story
- Freeze HTML feature work during first store pass
- Strength regression suite before each store build
- Separate plan file: `docs/superpowers/plans/YYYY-MM-DD-athlete-apk-shell.md`

---

## Anti-regression checklist (every stage PR)

- [ ] Open Library → Full Body A still starts and logs a set
- [ ] Home still shows SLEEP / CONDITIONING / NUTRITION
- [ ] No drive-by edits under strength-only helpers
- [ ] `pnpm run verify` green

## Spec coverage

| Spec item | Slices |
| --- | --- |
| Import full engine + shared-core | 1.1–1.4 |
| Cond-only HTML API | 1.5–1.8 |
| Wire zones / prescription / load | 1.9–1.12 |
| Interval runtime + weekly dose | 2.2–2.11 |
| C2 + Echo light | 3.1–3.10 |
| Strength / screen freeze | Global + every stage gate |
| APK later | Stage 4 placeholders |

## Execution

**Plan complete.** Two options when you want build to start:

1. **Subagent-Driven** — one slice (or small group) per agent, review between  
2. **Inline** — execute Stage 1 slices in this session with checkpoints  

**Which approach — and start at Slice 1.1?**
