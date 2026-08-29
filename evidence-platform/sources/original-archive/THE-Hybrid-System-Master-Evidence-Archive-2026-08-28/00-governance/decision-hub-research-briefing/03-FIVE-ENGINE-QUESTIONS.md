# Five-engine research questions

These questions define the initial research landscape. ChatGPT should refine them when evidence reveals missing or badly framed questions.

## 1. Strength

### Candidate decisions

- Increase, maintain, or flag a working load after an exercise exposure.
- Adjust volume or intensity within existing product limits.
- Decide when evidence is insufficient and default to maintaining.
- Resolve equipment-specific increments and rounding.

### Research themes

- progression models for resistance training;
- dose-response relationships for volume, intensity, and frequency;
- autoregulation using RPE/RIR and performance outcomes;
- minimum meaningful load increments;
- fatigue, repeated performance failure, and deload concepts;
- concurrent-training interference and scheduling;
- measurement validity for e1RM and session-load proxies;
- sex, age, training status, and exercise-specific applicability.

### Safety boundary

Pain may hold strength autopilot increases, but the system does not diagnose injury and never blocks training.

## 2. Conditioning

### Candidate decisions

- Progress, maintain, or ease conditioning level or prescription.
- Adjust duration, frequency, interval structure, or zone distribution.
- Determine whether observed load is sufficient for adaptation.
- Handle mixed modalities and incomplete heart-rate data.

### Research themes

- aerobic and high-intensity interval dose-response;
- polarized, pyramidal, threshold, and mixed intensity distributions;
- modality transfer and specificity;
- heart-rate zone definitions and limitations;
- internal versus external load;
- progression and recovery between hard sessions;
- concurrent strength-and-endurance programming;
- heat, environment, and measurement reliability.

### Safety boundary

Conditioning is not automatically stopped because pain or illness was logged. Any safety-related research recommendation must be separated from the locked solo-dogfood behavior.

## 3. Nutrition

### Candidate decisions

- Maintain or adjust energy and macronutrient targets within product scope.
- Interpret adherence when days are complete, partial, fasted, or missing.
- Adjust confidence when food logging is sparse or biased.
- Support hybrid training without making medical or diagnostic claims.

### Research themes

- energy availability and training demands;
- protein dose, distribution, and timing;
- carbohydrate periodization for strength and endurance work;
- hydration and electrolyte guidance;
- body-composition change rates;
- dietary measurement error and logging bias;
- recovery nutrition;
- sex-specific and life-stage considerations;
- contraindications and referral boundaries.

### Safety boundary

Nutrition decisions require conservative limits, contraindication handling, and clear exclusion of diagnosis or eating-disorder treatment.

## 4. Recovery

### Candidate decisions

- Produce a recovery posture or capacity estimate.
- Hold a strength increase when the relevant product gate applies.
- Modify confidence based on data completeness.
- Track debt and repayment without pretending to diagnose readiness.

### Research themes

- sleep duration, regularity, and performance;
- acute and accumulated training load;
- subjective wellness and measurement reliability;
- resting heart rate and heart-rate variability limitations;
- soreness, pain, fatigue, and performance trends;
- heat stress and environmental load;
- recovery interventions and evidence quality;
- validity of composite readiness scores.

### Safety boundary

HRV cannot become a pain, injury, or illness gate. Recovery output may inform posture and existing silent-safe actions but never block starting a session.

## 5. Coordinator

Coordinator research is partly sports science and partly decision-system engineering.

### Candidate decisions

- Merge four domain decisions into one `SystemDecision`.
- Resolve conflicts such as Strength proposing progress while Recovery proposes hold.
- Select the appropriate decision cadence.
- Fail safely when inputs are stale, incomplete, contradictory, or low confidence.

### Research themes

- concurrent-training interference and schedule interactions;
- energy availability across training demands;
- multi-objective decision systems;
- deterministic expert systems and decision tables;
- safety invariants and rule precedence;
- confidence and missing-data policies;
- temporal reasoning and stale evidence;
- auditability, versioning, shadow evaluation, and rollback;
- human-factors risks of silent automation.

### Required precedence starting point

Product locks and safety validators outrank domain optimization. A domain cannot write directly into another domain. Coordinator emits intents; adapters apply authorized effects.

