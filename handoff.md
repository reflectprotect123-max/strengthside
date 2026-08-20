# Handoff — TheStrengthEngine

> **AUTHORITATIVE CHECKPOINT — 20 August 2026. Superpowers v6.3.0 and the full
> hybrid-repo skill/plugin toolchain are now vendored and installed here, per
> `skills.md`. NO UI FEATURES EXIST YET: Phase B (coach authoring) and Phase C
> (mobile logger) are both unstarted — vendoring the toolchain is not
> progress on either. Where this block disagrees with anything below it, this
> one wins.**

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
- **Morpheus-style HR zones**: numeric zone boundaries on the engine's
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

### Plan agreed for the next session

1. **Pull the strength material out of `THE-HYBRID-ENGINE1` into this repo**
   — i.e. finally execute Task 2 of the split (list in that repo at
   `docs/superpowers/plans/2026-08-19-strength-repo-split.md`) plus whatever
   coach-UI scaffolding the prototype's real implementation needs. Needs the
   hybrid repo attached with push access.
2. **Start building the actual phone-side app** — Phase C, the athlete
   logger. Remember the standing trap notes: `apps/mobile` has no test
   script on purpose, and Phase C's first test adds jest-expo AND the script
   in the same commit.

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
