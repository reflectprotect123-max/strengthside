> Athlete authoring is retired: `library-ui.js` is now a saved-workout reader and `library.js` retains compilation/reading only. The complete original builder is in the `workout-builder-export` release. See `docs/releases/workout-builder-removal.md`. Older builder descriptions below are historical.

# Current strength app ownership

The athlete runtime is `apps/athlete`. Android and Capgo ship its validated staging output in `apps/mobile/capacitor/www`; they do not maintain another athlete UI. The desktop Coach UI and installer are owned by `reflectprotect123-max/the-adaptivebrain-` (`apps/coach`, `apps/desktop`). The older Hybrid athlete HTML is retained only in `archive/legacy-athlete` for historical regression fixtures. The unused strength-sync adapter stub is archived there too.

## Shared contracts

Edit `apps/shared/training-core.js` and `apps/shared/whoop-common.js`, then run `node scripts/sync-training-core.mjs`. Athlete and coach copies are generated delivery artifacts. CI rejects stale copies. Metric aliases retain compatibility with old coach records; do not rename stored metrics without a migration.

TrainingCore owns metric identifiers, units/input types, effort labels, rep-range parsing and row completion validation. Builder targets are structured min/max values; actual logged reps are one number. Logger and builder use the same numeric editing rules; logger saving a number updates a draft, and explicit set completion validates all selected metrics plus actual effort. Timed holds and carries do not produce an e1RM. The prescribed-effort policy stays in StrengthBrain; the builder has no effort requirement or weight-jump control.

StrengthBrain owns seeding, intra-set changes, e1RM estimation and next-session load decisions. Templates own planned work. An active session keeps its captured exercise targets and calibration when reopened; builder changes apply to future sessions. Session logs own recorded results. StrengthMemory is derived per-set/estimate memory with revisions and tombstones; PlanSync owns templates, calendar assignments and session snapshots. Snapshot merges update derived set memory. Removing a session explicitly tombstones its memory; removing a scheduled template does not erase completed training history. Sync conflicts keep local results and are not silently overwritten.

WHOOP for the athlete uses Supabase `whoop-connect`, `whoop-callback`, `whoop-sync`, `strength-whoop-status` and `strength-whoop-disconnect`. Strength-specific account endpoints do not replace the shared conditioning integrations-status/disconnect handlers. While these endpoints are not deployed, a 404 falls back to the existing authenticated Supabase account routes; authentication/provider failures are not retried through that fallback. All account routes verify JWT identity before deriving storage owner. Coach WHOOP requests use these same authenticated Supabase Edge routes. Coach text/OpenRouter is served by the authenticated `brain-coach` Supabase Edge Function; its provider key is a Supabase function secret. Home and Progress use the same dated observation selector. Legacy frontend integration cache is a compatibility cache and must not overwrite existing dated observations.

## Coach assignments

`CoachAssignments` (`apps/athlete/coach-assignments.js`) reads the signed-in
athlete's published `assigned_session` rows in deterministic pages of 500. It
converts the existing `resolved_snapshot.htmlSession` contract into library
templates and calendar assignments. Sign-in, foreground/resume and opening
Training or Library refresh plans silently. Offline/error responses retain the
cached plan. Only a successful complete pull removes unpublished/rescheduled
assignments. A malformed snapshot rejects the whole refresh.

The adapter preserves rep ranges, per-set reps/AMRAP, tempo, supported metrics
and explicit equipment/load metadata. Canonical exercise IDs survive matching
local seed titles. Multiple Coach workouts on a date form one day template;
the calendar currently stores one workout per day. An existing local assignment
takes precedence, while the received Coach template remains in Library.
Refreshes never rewrite active session snapshots, completed sessions, actual
weights or max histories. Account changes invalidate in-flight requests.

Coach uses the existing authenticated `assigned_session` policies. Publishing
requires the athlete cloud ID and owner/coach authorization. No schema/secret
change is needed; the database still freezes published snapshots. This adapter
does not make Coach's separate `coach_lift_memory` calculator the athlete's
source of strength estimates.

The Windows Coach shell uses Electron's updater and the Adaptive Brain GitHub
`coach-desktop-latest` release feed. A newer installer includes the Coach UI and
prompts for restart after download. Capgo updates the Android athlete bundle;
it does not update Windows. This connection change publishes neither release.

## Releases and verification

Edit `apps/athlete/release.json`, then run `node scripts/generate-strength-release.mjs`. This generates release.js, Android version metadata and the service-worker asset list. `scripts/stage-athlete.mjs` copies runtime files and validates all local index JS/CSS references. The Android APK bundles the athlete UI; Coach packaging and releases run only in the Adaptive Brain repository. Test files and checks are excluded from release staging.

Run `pnpm run verify` and `pnpm run check:browser`. For a locally installed Chromium, set `PLAYWRIGHT_CHROMIUM_PATH` to its executable; otherwise run `pnpm exec playwright install chromium`. Browser tests exercise the current athlete source at phone size in Australia/Sydney time, including scheduling, full training, editing/reload, timer reuse/reset, progression, every numeric metric, completed circuits, deletion and update preservation. The updater transport test is simulated in Chromium; it does not instrument Android or use live athlete WHOOP credentials.

`Strength WHOOP backend` deploys the handlers on main using the existing GitHub Actions secret `SUPABASE_ACCESS_TOKEN`. A missing credential fails visibly; it is not treated as a successful backend release. Frontend tests do not prove production OAuth/WHOOP availability.
