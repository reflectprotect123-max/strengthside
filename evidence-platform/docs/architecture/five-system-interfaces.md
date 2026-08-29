# Five-system interface contract

## Common envelope

Required fields: `event_id`, `athlete_id_hash`, `system`, `event_type`, `occurred_at`, `produced_at`, `schema_version`, `producer_version`, `payload`, `payload_hash`, `source_ids`, `observation_ids`, `quality`, `supersedes_event_id`.

## Domain outputs

- **Strength:** completed set/session observations, exercise identity and load semantics, planned stimulus, performance estimate, local fatigue/context, and constraint proposals.
- **Conditioning:** modality, duration/distance/power/pace/HR observations, intensity classification, planned stress, device/method metadata, and constraint proposals.
- **Nutrition:** intake and logging completeness, body-mass observation/trend, target state, formula version, uncertainty, and non-diagnostic safety review flags.
- **Recovery:** sleep/HR/HRV/soreness observations, structured pain/illness/heat/neurological/cardiopulmonary events, missingness, staleness, and hard/soft constraints.
- **Coordinator:** schedule availability, goal priority, equipment, preferences, conflicts, current plan version, prior decision IDs, and owner-approved policies.

## Compatibility rules

1. Units, denominator and time basis must be compatible before comparison.
2. Population evidence is not an athlete observation and cannot silently become one.
3. A corrected observation supersedes but never deletes its predecessor.
4. Missing is not zero; stale is not current; estimated is not observed.
5. Safety constraints carry precedence and expiry/clearance conditions.
6. Every candidate must identify the exact rules and model versions that produced it.
