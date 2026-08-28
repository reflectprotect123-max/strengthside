# Training load — two-channel model

Status: **partially implemented in the Hybrid HTML app.** `@hybrid/strength-engine` still does not compute a
training-load score server-side. The athlete app ships two related but distinct figures:

1. **Training load headline** (`load-headline.js`) — 0–21 WHOOP-familiar scale, cardio · strength split,
   normalized against rolling weekly history. Shown on Sleep overview.
2. **Recovery debt** (`recovery-engine.js`) — 0–100 delivery ledger score (sessions + life load − repay).
   Shown on Home Sleep module. Drives autopilot caution; not the same number as the headline.

This document records what each number is based on, so future work inherits the reasoning, not just the mockup.

## The shape: one displayed figure, two computed channels

Training load is displayed as one headline number with a visible split:

```
Training load  13.2
               cardio 9.1 · strength 4.1
```

The split is not decoration. A 13.2 that is mostly cardio and a 13.2 that is mostly strength predict different things about tomorrow: cardiovascular load suppresses
HRV-measured recovery directly, while strength load produces neuromuscular fatigue that
HR-based measures partly miss (Buchheit 2014). Collapsing them into a single opaque
figure is the WHOOP-strain failure mode — heavy lifting barely moves average heart rate,
so an HR-only score rates a maximal squat session like a brisk walk. WHOOP itself had to
bolt on a separate "muscular load" system to compensate.

**Recovery debt** is a separate ledger: rolling 7-day delivered load (logged sessions +
check-in background + WHOOP strain supplement) vs budget, minus recovery-session repay credits.
It answers "have we stacked too much this week?" rather than "how hard was today's workout?"

## Channel 1 — conditioning load

**Formula family:** zone-weighted duration (TRIMP-style) with fallbacks when HR is missing.

**Implemented in** `engine-adapter.js` → `condLoad()`:

1. **HR TRIMP** when average HR is logged — high confidence.
2. **Zone seconds** — recovery/aerobic/anaerobic/peak minutes × zone weights when strap data exists.
3. **Foster session-RPE** — `(RPE / 10) × minutes × 0.8` when RPE or felt is logged.
4. **Prescribed effort** — same Foster scaling using engine effort center RPE (easy/medium/hard).

Strapless sessions therefore still contribute to session `conditioningLoad` and recovery debt.

**Data source:** performed conditioning zone seconds in local session state. Two
provenances, per the existing contract:

- `zsrc:'measured'` — chest-strap HR trace, minutes accrue to zones directly.
- `zsrc:'felt'` — strapless session; end-of-session RPE credits the whole duration to
  one zone. Measured always wins; the `felt` marker must never be dropped.

**Zone boundaries are a daily input, not static config.** If the Morpheus-style
recovery-adjusted zones are adopted (the prototype's "Recovery-Sync"), the same 145 bpm
can land in different zones on different days, so time-in-zone must be computed against
the boundaries that were in force on the day of the session.

## Channel 2 — strength load

**Formula family:** two candidates, both computable from tables this repo already owns
(`performed_set`, `performed_measurement`, `working_max_event`):

1. **Session-RPE (Foster):** `session RPE × session duration`. Validated for resistance
   training specifically; needs no extra hardware; mode-independent, so it lives on the
   same scale as the conditioning channel if both use it.
2. **Relative tonnage:** `Σ sets × reps × (load ÷ working max)`. Raw tonnage overweights
   light work (5×5 @ 60% outscores 5×5 @ 85% × fewer reps); dividing by working max
   restores intensity. Requires a resolvable working max — the same `reference_max`
   chain the prescription resolver already walks.

**Implemented today:** `HybridStrength.Load.sessionLoad` → raw tonnage kg stored on session
summary; headline and delivery ledger divide by 50 for display-scale units.

Session-RPE is the pragmatic default; relative tonnage is the upgrade when working-max
coverage is good. Do not average the two.

**Exclusion rule:** a pain-blocked exposure still happened — its load counts toward
fatigue. Pain-blocking excludes a session from *calibration evidence*, not from *load*.
Those are different questions ("what can they lift" vs "how tired are they") and the
CLAUDE.md safety rule only speaks to the first.

## Normalization

The two channels have different native units. To share one headline scale, normalize
each channel against the athlete's own rolling history (e.g. a 28-day rolling mean, in
the spirit of Morpheus's rolling 10-day HRV baseline) before summing. The headline is
then "load relative to what this athlete has been doing," which is the question a
readiness screen is actually answering. The 0–21 scale in the prototype is cosmetic
WHOOP-familiarity, not a requirement.

`load-headline.js` implements this normalization for the athlete UI. Recovery debt uses
its own 0–100 score from delivery ratio minus repay — do not merge the two displays.

## Background load (life stress)

Check-in background load (steps tiers, work/mental stress, fuel, heat) is computed once in
`recovery-engine.checkinBackgroundLoad()` and shared with `readinessScore()` in the HTML app.
Recovery delivery ledger adds WHOOP strain as supplementary background when logged training
under-counts the day.

## Cross-repo note

This is a cross-repo read: the strength channel comes from this repo's twelve tables,
the conditioning channel from the hybrid repo's. Whichever side computes the combined
figure reads the other's data through a projection — it does **not** grow a migration
against the other repo's tables. (Shared-Supabase contract, both CLAUDE.md files.)

## Evidence

Peer-reviewed, verified:

- Foster et al. (2001). *A new approach to monitoring exercise training.* J Strength
  Cond Res 15(1):109–115. PMID 11708692. — session-RPE validity, mode-independent.
- Day, McGuigan, Brice & Foster (2004). *Monitoring exercise intensity during resistance
  training using the session RPE scale.* J Strength Cond Res 18(2):353–358. — sRPE for
  lifting specifically. See also PMID 15574104, PMID 19255453.
- Impellizzeri, Marcora & Coutts (2019). *Internal and external training load: 15 years
  on.* Int J Sports Physiol Perform 14(2):270–273. — the internal/external framework
  behind keeping the channels distinct.
- Buchheit (2014). *Monitoring training status with HR measures: do all roads lead to
  Rome?* Front Physiol 5:73. — HRV is a cardiac-autonomic marker only; insensitive to
  some neuromuscular fatigue.

Classical methods (books, not PubMed):

- Banister (1991), TRIMP, in *Physiological Testing of the High-Performance Athlete*.
- Edwards (1993), 5-zone summated HR method, *The Heart Rate Monitor Book*.

Company documentation (not peer-reviewed — treat as product precedent, not evidence):

- WHOOP: strain is a 0–21 logarithmic, HR-zone-driven score; "muscular load" added
  separately because strain under-counts lifting.
- Morpheus (Jamieson): 2.5-min morning HRV + resting-HR test against a rolling 10-day
  baseline → daily recovery score → daily re-derived three-zone HR boundaries
  (Recovery/blue ≈ Z1–2, Conditioning/green ≈ Z3–4, Overload/red ≈ Z5) and weekly
  zone-minute targets.

## Known fictions in the prototype

Recorded so nobody mistakes fixture behavior for design:

- The Recovery-Sync shift formula (`round((recovery − 85) / 3)` bpm on every zone
  boundary) is invented for the demo. The *behavior* (zones move with recovery) is
  Morpheus-validated product precedent; the *formula* has no evidential basis.
- Demo fixture screens may still show placeholder 13.2 / 9.1 / 4.1 splits — live app
  computes from logged sessions once enough history exists.
- The 0–21 headline scale is borrowed WHOOP vocabulary.
