# Strength online learning: integration design

Status: proposed implementation design; no runtime changes or deployments in this documentation change.
Baseline inspected: `origin/main` at `1c5789a339918bf10a131d4112316b444146f7d1` (15 October 2026). Refresh main and inspect subsequent changes before execution. An open branch is not evidence that its behavior is present on main.

## 1. Outcome and boundaries

Keep our builder, logger, slider, suggested difficulty, calendar and rest interaction. Replace the conflicting strength estimates with one deterministic, replayable decision path. Start with a dependable default; gradually personalize only when the athlete supplies enough comparable evidence. The engine owns intended difficulty and equipment increments; the athlete still overrides and logs actual performance.

Conditioning, WHOOP ingestion, readiness models, LLMs, exercise catalogue redesign and max-effort testing are outside this project. Existing conditioning code must not be changed as a side effect. No new athlete settings, flags or effort entry boxes. Internal shadow evaluation and release controls are allowed.

**Global constraints (copy into implementation plan):**

- Runtime: Node >=20.19; package manager pnpm 10.33.0; preserve the frozen lockfile unless a reviewed dependency change is necessary.
- Edit canonical shared calculations under `apps/shared`; generate athlete/coach copies using `scripts/sync-training-core.mjs`.
- Preserve the current appearance and selected logging metrics; add no athlete-facing AI settings or target-effort fields.
- Conditioning and WHOOP adaptation remain outside this change.
- Never rewrite logged actuals when generating a recommendation.
- No hosted migration, main merge, APK publication or Capgo deployment during this planning task.
- An eventual release requires all mandatory gates in the test matrix; unrun gates remain blocked, not passed.

## 2. Why integration needs more than the winning formula

Current files have overlapping responsibilities:

| Area | Present code | Required change |
|---|---|---|
| Pure rules | `apps/shared/strength-brain-core.js` | One guarded policy consuming canonical load and replay state |
| Targets and equipment | `strength-targets.js`, `strength-equipment.js` under `apps/shared` | Preserve targets; separate displayed plates from physical load |
| Seeding and next set | `apps/athlete/strength-brain.js` | Consume the same replay state used for estimates and learning |
| Persistence | `apps/athlete/strength-memory.js` | Facts authoritative; derived state disposable and replayable |
| Actual interaction | `apps/athlete/logger.js`, `library.js`, `library-ui.js`, `session.js` | Preserve authored targets, actuals, keypad and rest behavior |
| Cloud memory | `public.strength_brain_records`, `sync_strength_brain_records(jsonb)` | Extend the existing revisioned record lane, not a second independent memory system |

Known integration hazards in this baseline: plates-only barbell values share a `total` history key with older total-load records; e1RM maths can omit bar mass; null/blank can become zero; populated `nextRow.kg` changes the rep-transition branch; a warmup-derived floor can override later Hard feedback; the adapter's three-session average differs from memory replay's learning blend. Fix these before scoring the new learner. Changing a browser expectation from 20 to 0 does not fix the underlying unit issue.

## 3. Canonical evidence and units

Keep original row values and payloads. Add a versioned normalized envelope inside the existing record payload; preserve compatibility fields for older installed clients:

```ts
type NormalizedLoad = {
  version: 3;
  rawValue: number;
  rawUnit: 'kg' | 'lb';
  convention: 'barbell_total' | 'barbell_plates' | 'per_hand' | 'single' | 'added_bodyweight';
  externalKg: number; // total bar+plates for barbells; ONE dumbbell for per_hand
  barKg: number | null;
  provenance: 'explicit' | 'known_legacy_version' | 'ambiguous_legacy';
  eligible: boolean;
};
```

Use exactly 0.45359237 kg/lb at normalization, never at each replay. A 0 plates input on a known 20 kg bar normalizes to 20 physical kg. A historical explicitly total 60 kg remains 60 physical kg. Two 20 kg dumbbells remain a per-hand value of 20, not a silently doubled training history. Suggested values convert back to the current keypad convention and retain the existing “empty bar” label.

Do not infer old convention from magnitude, title or date alone. Map only demonstrated producer versions; ambiguous legacy rows remain available in history but are excluded from automatic learning. Preserve the original record ID and source revision. Local normalization may be derived without uploading a mass rewrite. Produce counts and a dry-run report before any persisted backfill.

Weighted dips/chins: retain added belt weight (including zero) as logged. Do not estimate system-load e1RM without trustworthy contemporaneous body mass and an explicitly validated movement model. First-set-last still resolves to actual external weight. Unsupported adaptation falls back to conservative existing progression/manual logging; never blank these metrics or fabricate body mass.

## 4. Context and targets

A learning context is a canonical tuple serialized as JSON: athlete ID, canonical exercise ID, equipment ID, normalized load convention and normalized tempo. It is not a duplicated exercise-library entry. Unit conversion happens before context grouping. Tempo `33x1`, `3-3-X-1` normalize to `3-3-X-1`; `20X1` normalizes to `2-0-X-1`. Unknown tempo is its own context, not assumed normal tempo. Accept four delimited phases including multi-digit seconds; compact syntax accepts exactly four single-character phases. Do not assign X a fixed duration or apply Gemini's universal tempo multiplier.

Same-tempo history informs starting load and shape. Other tempos may provide only a conservative provisional starter, never trusted curve observations; in v1 use equipment starter when exact-context evidence is absent, keeping the existing two-ramp calibration. Slower tempo cannot inherit an aggressive suggestion merely because the exercise ID matches.

Targets remain authored and immutable: fixed reps, any rep range, arbitrary per-set sequences, and AMRAP. Supported numeric curve domain is 1–12 actual reps and effective reps 1–15. Outside this domain preserve the target and use bounded directional progression; do not clamp authored reps into the chart. Three sets of 6–8 completed at 6/Average do not earn next-session weight progression; all ordinary sets reaching their upper target with acceptable effort can earn it.

## 5. Three separate adaptive timescales

1. **Today:** the latest usable working performance adjusts upcoming weights. Two ramp sets provide provisional daily calibration; subsequent working evidence supersedes them. No permanent warmup minimum can defeat Hard/missed feedback.
2. **Starting strength scale:** completed-session first working performance updates a bounded seed for the next comparable session. Easy is directional evidence here, so low starting weights can improve even when they cannot identify an accurate curve.
3. **Personal rep curve:** learn slowly from eligible first ordinary working sets of completed sessions. Changing this curve is not equivalent to changing the athlete's measured 1RM.

Average and Hard slider bins use approximate RIR representatives 3 and 1 for the initial candidate, with noisy/interval sensitivity tests. Very Easy/Easy are directional only. Max Effort and Did Not Complete trigger conservative handling and do not fit the personal curve. A single prescribed rep remains an ordinary target; it does not authorize a max test. AMRAP and warmups never fit the slow curve.

First-set-last references the first **logged ordinary working set**. Prior to logging AMRAP it tracks an edited source; once AMRAP is logged its actual weight is immutable even if its source later changes. No recommendations rewrite completed sets.

## 6. Maths and candidate learning policy

Use an original small JS implementation of the published equation, with attribution to the inspected MIT STMr reference. Do not import an R runtime or code from copyleft apps into our runtime.

```text
k0 = 0.0333 / 1.0333
fraction(n,k) = 1 / (1 + k * (n - 1))
projectedLoad = observedPhysicalLoad
                * fraction(targetReps + targetRir, k)
                / fraction(actualReps + representativeObservedRir, k)
```

This default gives the same load ratios as the original Epley equation; its scale parameter is anchored at one effective rep. Any UI e1RM remains explicitly estimated. Do not describe it as a known true maximum.

Candidate slow fit: last 24 eligible first-set observations, at least 8 observations, at least 3 distinct effective-rep values and span at least 4. Minimize squared residuals over k in [0.01,0.08], solving strength scale analytically at each k; use a deterministic bounded search with 32 iterations. Shrink fitted k toward k0 by `min(0.85,max(0,(n-6)/(n+6)))`; change k by at most 0.002 per accepted observation. Identical effective reps cannot identify both scale and shape; keep default until diversity is present. These constants are experimental defaults, subject to the preregistered holdout gates, not physiological truths.

Persist raw set facts; rebuild this state from the latest nondeleted revisions sorted by session start, session ID, then ordinal/record ID. Rebuild after edits, deleted sessions, tempo changes or imported older records. The prototype's 128-ID seen list is not a production deduplication design. Raw record identity and revision determine evidence membership. Same facts in another delivery order must produce the same state. An unfinished session can affect today's suggestion but cannot contribute to slow fitting. Snapshot session completion in record payloads and invalidate derived summaries on reopen.

A fixed k-update limit does not bound weight changes. Apply equipment-aware guards after projection. For unchanged rep targets, upward feedback is at most one available step AND 5% of current physical load, except at the minimum where one step is allowed to escape zero/empty-bar deadlock. If no permitted step exists, hold. Reductions normally cap at 10%, but a coarse equipment grid can require the next lower step; allow that safer reduction. A planned rep transition is projected once; allow at most 10% physical-load increase AND one step above the prior planned weight for that next target. If no prior plan exists, use the current physical weight as the anchor. Hard never forces an increase merely to honor a warmup floor. Miss/max takes precedence over planned rep increases. Values remain finite, nonnegative and feasible. A manually entered off-grid actual stays untouched; subsequent suggestions return to a feasible grid.

Rest-aware modeling is a separate candidate experiment, not bundled with the curve without evidence. Record existing rest context; evaluate short-rest subgroups; keep conservative reduction if fatigue evidence conflicts with projection. Do not change timer UX.

## 7. One memory and cloud contract

`strength_brain_records` remains the durable fact ledger. Add normalization/model metadata inside payloads and version the derived cache. No server-side personal-model table is necessary in v1. Cache stores context, algorithm version, canonical evidence fingerprint and derived state; rebuilding must reproduce it. Session-estimate records are disposable summaries, never new training evidence. Avoid learning twice from a set and its summary.

Reuse per-owner outbox and optimistic revisions. Do not let a late ack clear a newer local edit. Persist pending facts before acknowledging UI completion. Offline reload, native backup and logout/login preserve owner separation. For conflicts, retain both local pending intent and authoritative remote revision; do not silently overwrite either or invent blended actuals. Temporarily use the default curve for the affected context while a conflict is unresolved; preserve manual workout logging and existing sync-status behavior.

Existing RPC uses owner identity and a transaction lock. Keep batch validation atomic and its old-client response compatible. Only add SQL if local database tests demonstrate a necessary schema/RPC change; use a CLI-generated migration, never edit applied migrations. Require ownership tests with real authenticated users; mock IO alone does not prove RLS. No athlete-supplied ownership field or service key in browser/APK.

## 8. Evidence and rollout

Read [evidence](../../research/strength-online-learning/evidence.md) and [test gates](../../research/strength-online-learning/test-matrix.md). Existing simulations support a candidate, not deployment readiness. Synthetic established-history scores: default 63.86%, fitted 67.31%, bounded online 66.62% target hit. Personalization adds about 2.77 percentage points over default in that protocol; it does not explain the whole improvement over the old app. Acquisition experiments use a different seed/calibration protocol and are not comparable absolute scores.

Implementation must first repair the baseline and run both policies through the same real adapter/state boundary. Use sealed chronological holdouts, paired uncertainty and subgroup gates; keep adverse scenarios, not only wins. Historical TrainHeroic data with absent effort cannot validate effort accuracy; no invented labels or public raw health exports.

Rollout: default path repaired and tested → online candidate in internal shadow → signed staging APK/device tests → evidence reviewed → separately authorized release. Shadow never controls the displayed weight. Failure, corrupt state or unsupported context selects default/conservative behavior while retaining facts. Rollback reverts policy selection and discards derived caches, not athlete records. Capgo is not part of this planning deliverable.
