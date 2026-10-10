# Strength brain v2 design

## Goal and evidence

Build one deterministic strength engine that understands the authored prescription for each set, selects reasonable loads, adjusts from actual performance, and remembers comparable sessions locally and in Supabase. Keep the existing app appearance and metric logging. The [research packet](../../research/strength-brain-evidence-2026-10-11.md) and [short explanation](../../research/strength-brain-evidence-summary-2026-10-11.md) explain the evidence and its limits.

The RTS chart is a starting model, not an individual strength measurement. Effort labels describe intervals. Easy provides directional evidence; it must not manufacture an exact e1RM. Epley and Brzycki are independent simulation comparisons, not additional production estimates to average. Synthetic results cannot prove safety or accuracy for real athletes.

## Global constraints

- Preserve the existing colours, navigation, effort slider, metric logging and shared keypad appearance.
- Do not add builder fields for target effort, smallest weight jump or starting weight.
- Do not publish to Capgo, release an APK, merge a shared branch or deploy live Supabase changes during this implementation.
- Use one canonical implementation per responsibility; athlete and coach distribution copies are generated.
- Support arbitrary positive integer reps and ranges. A one-rep prescription is not a maximum attempt.
- Use two warmups for eligible main lifts; accessories retain the current classification policy. Calibration may continue over multiple sessions.
- A user's actual logged weight always wins. Do not rewrite completed observations when recommendations or references change.
- Holds, carries, assistance and non-weight metrics remain loggable; unsupported prediction never produces e1RM.
- WHOOP, conditioning, LLM assistance, automatic max testing and timed/distance progression are outside this change.
- Reuse the deployed strength_brain_records table and its owner-scoped revision API unless a demonstrated contract limitation requires an additive migration.
- Supabase sync remains local-first, idempotent and account-isolated; no secrets in source or reports.

## 1. Prescriptions and observations

Add canonical `StrengthTargets` in apps/shared/strength-targets.js, following the project's browser-global IIFE convention. `normalize(block)` returns authored targets. `forRow(page,row,index)` resolves an individual target. `working(targets)` excludes warmups. `resolveReference(target,rows)` returns the actual completed first-working-set load or null. `normalize` is deterministic and does not mutate input.

Each target has `{id,purpose,reps,loadRule,toFailure}`. Purpose is `warmup`, `working`, or `amrap`. Reps is `{min,max}` for ordinary sets, null for AMRAP. Load rule is `{kind:'adaptive'}` or `{kind:'first_working_set'}`. Failure is explicitly authored; AMRAP alone does not mean failure. IDs derive from block ID and authored position for legacy prescriptions and remain stable after serialization. Row observation IDs remain distinct UUIDs. Rows link with `targetId`; legacy `purpose:'ramp'` resolves as warmup without destructive migration.

Legacy block setCount/repTarget/repMin/repMax expands to identical ordinary targets. New optional `setTargets` overrides this expansion. At least one ordinary working target must precede first-working-weight AMRAP; never infer AMRAP merely because the row is last. Invalid sequences fail authoring validation with an actionable inline message. All target ranges must retain both endpoints. A rep-range metric controls whether the numeric keypad accepts a hyphen; actual completed reps are integers.

Observations remain existing rows with normalized metadata: targetId, actual reps/kg/cells, purpose, effort, miss/logged/deleted/skipped, ordinal. Add context `{requestedRestSec,elapsedRestSec:null}` rather than treating a chosen rest duration as actual elapsed rest. Store authored targets in session snapshots so subsequent library edits cannot change a running or historical session.

## 2. Equipment and cold starts

Add canonical `StrengthEquipment` with `profile(page)`, `floor(value,page)`, `next(value,page)`, `round(value,current,page,{upCap,downCap})`, and `starter(page)`. Explicit availableLoads takes precedence. Dumbbells use per-hand 1–10 kg by 1 kg, then 12.5,15,17.5,20… in 2.5 kg steps. Manually logging 18 kg does not imply a complete custom rack. Include the current actual load as a hold option even if absent from the ladder.

Keep kg/lb, equipment identity, total/per-hand/single/assistance conventions distinct in history keys. Do not silently halve or double weights. Automatic starter suggestions require supported kg conventions and recognized equipment/exercise patterns. Provisional per-hand kg defaults: lateral raise 2, curl 4, DB bench 5, DB overhead press 4, DB row 6; single goblet squat 6. Barbell starters respect a declared bar/minimum; absent that information leave the suggestion unset rather than invent a 10 kg bar. Unknown machine stacks, assistance or unsupported units remain manual and loggable. Defaults are versioned product assumptions, not researched universal capacities. No related-exercise transfer multiplier.

One equipment step may exceed a percentage cap. Ordinary increases then hold. A coarse downward step is permitted to respond to a miss, stopping at the known minimum; report machine-readable `minimum_reached` if no lower feasible load exists. Never fabricate a load the equipment cannot supply.

## 3. Load calculation and effort

Add canonical `StrengthBrainCore` with `suggest({page,row,nextRow,index,state})`, `estimate(row,page)`, `review(page,rows)`, and `learn(previous,sessionEvidence)`. Keep the existing StrengthBrain browser API as an adapter, avoiding two competing engines.

Load the attributed RTS percentages from a literal versioned table for integer reps 1–12 and RPE 6–10. Select intended effort silently: default Average (approximately RPE7) for ordinary work, Easy for warmups; no automatic maximal prescriptions. Average evidence is broad approximately 3–4 RIR; Hard approximately 1–2 RIR. The chart's point choice is a computation convention, with confidence metadata, not a claim that a slider label precisely measures RPE. Max Effort is near-limit evidence; a missed or incomplete outcome cannot estimate strength.

For supported completed observations, compute today's candidate capacity from actual kg divided by the chart percentage for actual reps and the selected observation convention. Suggest the next target using its own reps and intended effort. Apply one combined delta and one equipment rounding operation, so lowering prescribed reps and Easy feedback do not independently compound increases. Easy/Very Easy produce bounded directional movement rather than a precise e1RM. Planned 10/8/6 and 5/3/1 can increase load; fewer actual reps from a miss cannot. Out-of-chart authored targets retain their true reps and use conservative same-exercise history/current load, with no clamping to 12.

Use an explicit versioned policy for caps, observation blend and session-learning blend. The initial experiment tests up caps 5%,10%,15%; warmup up caps 10%,15%; evidence blend 0.15,0.25; persistent blend 0.10,0.20. Deterministic selection in Task 3 freezes one candidate before integration; failed physiological gates keep the conservative policy and prevent claiming a successful aggressive calibration rule. No automatic 25% equipment jump exception in v2.

Zero reps, miss, Max Effort and an unachievable intended target hold or reduce the next suggestion. `suggest` returns `{kg,target,ruleVersion,reason,confidence}`; unknown load returns null rather than NaN. `estimate` returns a positive scalar or null for compatibility. Do not generate PRs from uncompleted rows.

## 4. Learning and progression

Today's capacity is separate from persistent fresh strength. Only the first ordinary working set of an exposure can initially qualify, and only if completed and supported. If it is Easy, missed or unsupported, do not substitute a later fatigued set for fresh evidence. Later fatigue, a short selected rest, and AMRAP do not lower the fresh baseline. Do not infer an exact rest correction. Persist confidence, exposures, modelVersion, source observation IDs/revisions and a stable prescription signature. Comparable history requires the same exercise/equipment/convention/unit key. Do not impose a promise of calibration after a fixed session count.

Ordinary range progression requires every prescribed ordinary working set to reach its own upper bound at the intended effort or easier, without misses. Completing 3×6 at Average for a 6–8 range holds the next-session weight. Unequal prescriptions compare each row to its own target. Do not add an equipment step twice after incorporating capacity evidence. Earned progression is one suggestion, not an irreversible alteration to actuals. Skipped or deleted ordinary sets prevent a complete earned session.

## 5. AMRAP reference

The builder authors optional final AMRAP at first working weight, automatically carried into logging without asking the athlete to select the rule again. Example ordinary targets 10/8/6 followed by AMRAP references actual set 1, not a warmup or last ramp. Before completing AMRAP, editing set 1 can update its suggestion. After completing AMRAP, edits cannot rewrite its actual load. Missing, skipped or deleted source means unresolved, not zero or a different set. AMRAP performance is stored distinctly and excluded from fresh e1RM until comparable fatigue evidence is designed.

## 6. Memory and sync

Capture immutable authored targets and actual row facts separately from derived session estimates. Derived payloads include modelVersion and source IDs plus revisions or content fingerprints. Edits/deletions must recompute or tombstone affected estimates deterministically, not accumulate extra learning. Reading legacy payloads remains supported; old estimates are recomputed under v2 before trusted use. Keep existing expected_revision conflict handling, tombstones, explicit recreation and account archival. Duplicate captures or network retries cannot increment exposure counts twice. No new table or direct authenticated write permission is necessary for JSON payload metadata.

## 7. Simulation gate

Commit a reproducible simulator that imports the production core, instead of copying its formulas. Simulated physiology remains independent (Epley, Brzycki and perturbed exercise curves). Cover arbitrary fixed/range targets, 5/3/1, 10/8/6, high reps, two warmups and fatigue, noisy and biased effort, equipment minima and coarse steps, day variability, requested/observed rest distinction, supersets, final AMRAP, absence, plateaus and up to 50 exposures. Use separate tuning and holdout seed sets; candidate selection cannot read holdout outcomes.

Mandatory software gates: zero invalid/negative/nonfinite loads, zero cap or equipment violations except documented coarse reductions, zero completed-actual mutation, zero wrong AMRAP references, zero duplicate learning or account leaks. Compare underloading and missed target reps for all equipment/experience strata. Freeze a candidate only if each holdout stratum's miss-rate increase is at most 1 percentage point relative to conservative baseline, while aggregate underloading does not increase. Thresholds are product gates rather than clinical safety evidence. A failed candidate is rejected and documented, not repaired by changing the holdout threshold. Broader simulation disagreement is explicit further-investigation evidence.

## 8. Acceptance and deployment boundary

Unit tests prove contracts and transitions; simulation tests explore assumptions; Playwright exercises real builder→calendar→logger→summary→history plus edit/delete/retry paths; SQL tests prove owner isolation and revision conflicts in a throwaway PostgreSQL database. Run the repository's full verify suite, browser suite and staged athlete asset checks after integration. If Android tooling is present, build and inspect a local debug artifact; distinguish this from actual device testing. No publication is part of these tasks. The completed work should be a reviewable feature branch with an honest validation report and documented unresolved real-athlete uncertainty.
