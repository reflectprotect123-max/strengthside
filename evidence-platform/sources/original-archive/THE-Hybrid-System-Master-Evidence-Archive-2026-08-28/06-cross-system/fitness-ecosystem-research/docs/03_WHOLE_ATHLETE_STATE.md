# Whole-Athlete State: evidence boundaries and contract

## Purpose

Whole-Athlete State answers: “What context and constraints should specialist engines know about right now, and how reliable is that interpretation?” It does not answer: “What workout should the athlete perform?”

## State vector

```text
observations
  sleep, HRV, resting HR, subjective wellness, life/work load,
  recent training, pain flags, illness flag, schedule, nutrition context
        ↓
normalized evidence with provenance and missingness
        ↓
state derivation (versioned, deterministic, conservative)
        ↓
state snapshot + constraints + reasons + data quality
```

Recommended fields:

```text
overall_capacity: high | moderate | low | unknown
strength_capacity: high | moderate | low | unknown
conditioning_capacity: high | moderate | low | unknown
recovery_debt: none | low | moderate | high | unknown
life_load: low | moderate | high | unknown
sleep_context: adequate | reduced | disrupted | unknown
illness_status: clear | self_reported | return_to_training | clinical_review | unknown
pain_status: clear | reported | hold | clinical_review
time_available_minutes: number | unknown
data_quality: complete | partial | sparse | conflicting | stale
confidence: high | medium | low | none
constraints: []
reason_codes: []
```

The UI may compress this into a calm summary, but the engine must retain the vector and the reasons.

## Wearable policy

WHOOP and other wearables should be stored as provider observations. Persist what the product is authorized to receive and what is needed to audit the derived state:

- provider and provider user ID;
- provider record ID;
- observation date/time and timezone context;
- recovery score, HRV, resting HR, sleep performance/duration/stages, strain, and workout records where authorized;
- capture timestamp and synchronization timestamp;
- measurement/protocol metadata when available;
- normalized value and raw payload hash/retention policy;
- source app/build and schema version.

Do not rename a provider’s `recovery_score` to the app’s `readiness`. Use labels such as “provider recovery observation” and “app-derived training context” so a user can tell what is measured versus estimated.

WHOOP’s official API documents OAuth scopes, recovery/HRV/RHR and sleep data, webhooks, and the limits of its API. The exact data available depends on user authorization and provider terms; the app must handle missing, stale, revoked, and partial integrations.

## HRV boundary

Evidence supports conditional use of HRV-guided training in some endurance contexts, but not a universal strength-training gate or a method to determine pain/tissue integrity. The app should:

- standardize collection where the provider permits it;
- inspect trend and data quality, not a single dramatic value;
- use HRV as one advisory input among several;
- expose “insufficient or conflicting data” rather than manufacture certainty;
- never clear a pain or illness hold based on HRV.

## Sleep, stress, and life load

Sleep loss and psychosocial load can affect performance, perception, and recovery, but individual relationships vary and a single threshold is not a universal prescription. Use them as context and possible modifiers, not automatic rest-day triggers.

Useful inputs include:

- total sleep duration and subjective quality;
- recent disruption/travel/shift-work indicator;
- subjective stress and energy;
- physically demanding work and daily activity;
- recent training load and monotony/variation indicators;
- available time and motivation.

Keep the survey lightweight. A missing check-in is missingness, not a negative score.

## Pain and illness are safety routes

Pain is not just another number in a readiness average. A pain report should include body region, activity/context, severity scale, trajectory, and user-reported red flags only if the product has a safe, reviewed questionnaire. It may produce:

- `held` or `reduced` proposal;
- `blocked` action;
- `needs_clinical_review`;
- an instruction to seek professional care where appropriate.

The app must not diagnose. Pain-monitoring models have evidence in specific rehabilitation contexts such as Achilles tendinopathy, but that does not validate a universal app-wide pain threshold or pain-clearance algorithm.

Illness starts as an explicit user state. A return-to-training workflow should use conservative staged exposure, symptom/status checks, and a human-review route. It should not infer infection, cardiac risk, or treatment from wearable data.

## Data-quality model

```text
coverage = observed required inputs / required inputs
freshness = time since last valid observation
consistency = whether inputs agree enough for the rule
provenance = provider/manual/derived and traceable IDs
confidence = bounded app label derived from the above, not a calibrated probability
```

Do not display “87% recovered” unless a validated model, population, uncertainty interval, and calibration plan exist. Prefer: “moderate context; sleep data missing for 2 nights; no pain hold recorded.”

## State decision table

| Situation | State output | Specialist effect |
|---|---|---|
| good coverage, no hard flags, normal context | advisory context | normal proposal generation |
| sparse/stale wearable data | low-confidence context | avoid aggressive automatic changes; ask only useful input |
| poor sleep/high stress, no pain/illness | soft constraint | reduce optional volume/intensity only within engine rules |
| pain reported | pain constraint | hold/reduce affected patterns; possible clinical-review route |
| red-flag response | hard block/clinical review | no automatic clearance |
| user-declared illness | illness constraint | return-to-training workflow; no diagnosis |
| conflicting provider/manual data | conflict state | preserve both observations; ask or defer |

## Migration rule

During transition, choose observational mode or adapter mode explicitly. A new Home card must not imply that all recommendations already use the same state. Record the mode in configuration and test it.
