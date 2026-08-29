# Coordinator v1: proposal reconciliation, not a third training engine

## Purpose

The Coordinator converts specialist proposals into one weekly plan that respects hard safety constraints, user priorities, available time, interference tags, existing commitments, and a bounded set of product rules. It must explain every decision.

## Inputs

```text
sessionProposals[]
athleteStateSnapshot
userGoalsAndPriorityWeights
availabilityAndTimeWindows
existingPlanAndLockedSessions
completedAndMissedHistory
userOverrides
currentDateAndTimezone
contractVersions
```

Each proposal should contain:

- stable `proposal_id` and `engine`;
- `engine_version` and `contract_version`;
- target date/window and duration;
- modality, muscles/regions, energy systems, and interference tags;
- priority class: `mandatory`, `preferred`, `optional`;
- goal contribution and staleness/exposure metadata;
- prerequisites and incompatibilities;
- minimum viable version and safe modifications;
- observed inputs used by the specialist engine;
- explainable proposal reasons.

## Decision order

1. **Hard safety:** pain holds, illness/clinical-review flags, prohibited constraints, invalid data, and user locks.
2. **Hard schedule:** availability, time, already completed/locked sessions, and app ownership.
3. **Product invariants:** session-kind correctness, minimum rest, required weekly structure if explicitly approved.
4. **User goals:** priority weights, competition/event dates, and stated emphasis.
5. **Interference and recovery context:** same-day combinations, local/mechanical limitations, recent exposure, and soft state constraints.
6. **Ranking:** staleness, goal value, proposal priority, and continuity.
7. **Modification/drop:** choose the smallest safe modification; otherwise drop with a reason.

Do not start with a single numeric fatigue budget. If a bounded budget is later introduced, document units, calibration data, uncertainty, and rollback behavior.

## Output

```text
weeklyPlan:
  plan_id
  athlete_id
  week_start
  generated_at
  algorithm_version
  source_state_snapshot_id
  source_proposal_ids[]
  sessions[]
  decisions[]
  unresolved_conflicts[]
  data_quality
  user_override_state
```

Each `decision` contains:

```text
proposal_id
outcome: accepted | modified | deferred | dropped | blocked | needs_input
scheduled_date | null
modification | null
reason_codes[]
explanation
constraints_triggered[]
```

## Interference policy

Concurrent training evidence does not justify a blanket “never combine strength and conditioning” rule. The likely concern is context-specific: explosive strength may be more sensitive to same-session interference, while maximal strength and hypertrophy outcomes often remain compatible. Use tags and priorities:

- `heavy_lower_body`;
- `high_intensity_intervals`;
- `explosive_power`;
- `local_lower_limb_high`;
- `upper_body`;
- `low_intensity_aerobic`;
- `long_duration_endurance`;
- `mechanical_impact_high`.

The Coordinator can prefer separation, sequence low-interference work, or select a minimum viable session. It must expose the reason instead of pretending the rule is a universal physiological law.

## Initial rules to simulate, not silently ship

These are candidate product rules and require approval/fixtures:

- avoid same-day heavy lower-body strength with high-intensity intervals when separation is available;
- if a user has only one short window, preserve the highest-priority goal and reduce the other proposal to a minimum viable version or defer it;
- if a local/mechanical limiter fails while cardiovascular work passes, do not advance the conditioning progression;
- preserve locked/user-selected sessions unless a hard safety flag blocks them;
- protect the core weekly structure, but never override a hard safety constraint;
- missed sessions create a replanning event; they do not automatically create a catch-up double session;
- physical work and daily activity enter the state/context pipeline with modality, duration, intensity, and confidence rather than as an arbitrary “extra fatigue” number.

## Simulation harness

Before UI integration, run the Coordinator against:

- normal 4-session week;
- two proposals on the same day;
- a heavy lower-body/HIIT conflict;
- high life stress with no pain;
- pain hold on a lower-body pattern;
- illness return state;
- missing wearable data;
- old proposal contract version;
- user-locked session;
- missed session and replan;
- offline plan generated from stale state;
- conflicting manual override from both apps.

Golden outputs should include reasons and should be stable across platforms.

## Canonical writer and permissions

The Coordinator is the only writer of the combined plan. Apps may:

- request a proposal refresh;
- display a preview;
- submit a user override;
- mark a session completed or missed through their owned domain.

They may not independently publish a cross-modality plan. Server-side ownership and RLS should enforce this where feasible.
