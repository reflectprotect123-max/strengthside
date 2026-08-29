# Claude handoff extension: recovery, progressions, regressions, and calm sophistication

**Date:** 8 August 2026  
**Purpose:** additive, research-only evidence and product-design extension for the coaching-platform handoff  
**Scope:** recovery methods, readiness interpretation, progression/regression logic, and a sophisticated coaching product that remains visually simple  
**Constraint:** no application code is proposed here. This is a research, decision-policy, and product-specification document.

## Research-only scope and merge contract

This document is additive. Preserve and continue to use the existing handoffs:

1. [claude-week-in-review-research-handoff-2026-08-08.md](sandbox:/workspace/scratch/9db1c7f8a75a/claude-week-in-review-research-handoff-2026-08-08.md)
2. [claude-athlete-onboarding-and-checkins-build-brief-2026-08-06.md](sandbox:/workspace/scratch/9db1c7f8a75a/claude-athlete-onboarding-and-checkins-build-brief-2026-08-06.md)
3. [coaching-platform-research-bundle-2026-08-06.md](sandbox:/workspace/scratch/9db1c7f8a75a/coaching-platform-research-bundle-2026-08-06.md)

The new extension adds evidence and design policy; it does not replace those files or narrow their previous requirements. A downstream builder should read the three existing handoffs first, then this extension, and resolve conflicts in favor of the latest explicit coach/product decision.

### Handoff directives

- Keep the coordinator/final-authority model from the prior handoffs.
- Treat Auto-Coach as a bounded assistant: it may observe, summarize, propose, and execute only explicitly permitted low-risk actions.
- Keep health, pain, medication, supplement, and return-to-sport decisions behind appropriate human or clinical review.
- Do not present a proprietary readiness score as a diagnosis, injury prediction, or physiological truth.
- Preserve uncertainty and missingness. `Unknown` is not the same as `Good`.
- Separate a reduction in soreness from restored performance, adaptation, and reduced injury risk.
- Make every intervention reversible, attributable, and understandable to the athlete and coach.
- Research evidence may shape product defaults, but coach policy and athlete context determine whether an intervention is enabled.

## Evidence tags used throughout

- **[OBSERVED]** — directly reported in a cited study, review, consensus statement, or product observation.
- **[INFERRED]** — a reasonable implementation implication derived from the evidence, but not itself tested as a product rule.
- **[SPECULATION]** — a product hypothesis that requires validation; never present it as established science.
- **[SAFETY]** — a boundary, screening requirement, or stop condition.
- **[GAP]** — evidence is limited, mixed, indirect, or not generalisable to the intended population.
- **[RECOMMENDATION]** — the proposed product behavior, subject to coach policy and medical review.

Evidence grades in this handoff:

| Grade | Meaning for product decisions |
|---|---|
| High / relatively consistent | Multiple controlled studies or authoritative consensus with reasonably relevant populations. Safe to use as a foundational default, while still individualising. |
| Moderate / conditional | Direction is useful but populations, protocols, or outcomes vary. Appropriate for a coach-approved recommendation with context. |
| Low / mixed | Small, heterogeneous, indirect, or inconsistent evidence. Offer as optional, preference-led support; avoid strong claims. |
| Insufficient | No dependable conclusion for the desired outcome. Do not automate as a performance or injury intervention. |

## High-Level Overview

### The central product decision

Build a **Recovery & Adaptation System**, not a “recovery score.” The system should answer five separate questions:

1. Is there a safety or symptom reason to pause, modify, or escalate?
2. Is the athlete likely able to execute the intended training stimulus today?
3. If yes, what is the smallest useful adjustment to preserve the session’s intent?
4. Which recovery support is foundational, and which is merely optional comfort or context management?
5. What did the athlete actually experience over the next 24–72 hours?

**[OBSERVED]** Across recovery literature, sleep, energy availability, appropriate carbohydrate/protein intake, and context-matched hydration are more foundational than most passive modalities. Massage, compression, immersion, stretching, and active recovery often change soreness or perceived fatigue more reliably than they restore objective performance. The 2018 meta-review by Dupuy et al. is a useful high-level map of this distinction: [PubMed 29755363](https://pubmed.ncbi.nlm.nih.gov/29755363/) and [DOI 10.3389/fphys.2018.00403](https://doi.org/10.3389/fphys.2018.00403).

**[INFERRED]** The app should not rank every intervention on one axis. It should display the expected outcome type next to the recommendation: “may reduce soreness,” “may support today’s performance,” “supports sleep/downshift,” or “no dependable evidence for injury prevention.”

### The evidence boundary in one view

| Question | What the app may responsibly say | What it should not say |
|---|---|---|
| Soreness | “This may make the next 24–48 hours feel better.” | “Your muscles have recovered.” |
| Fatigue | “Your reported fatigue is elevated relative to your baseline.” | “Your central nervous system is fatigued” from one score. |
| Performance | “Your last set/velocity/RPE suggests the planned load may be too ambitious today.” | “You are fully recovered” from a wearable or green score. |
| Readiness | “Your current inputs support / do not support the planned intent with moderate confidence.” | “Readiness is 83%” as a physiological fact. |
| Injury risk | “Pain, symptom trajectory, or load mismatch warrants review.” | “This intervention prevents injury.” |
| Adaptation | “Use this modality when the short-term performance benefit outweighs the adaptation trade-off.” | “Cold exposure always speeds recovery” or “heat builds recovery.” |

### Recommended strategic posture

- Make the back end sophisticated through typed observations, baselines, trends, uncertainty, policies, permissions, receipts, and evaluation.
- Make the front end simple through one primary action, progressive disclosure, small context chips, calm typography, and a visible “why.”
- Make Auto-Coach conservative by default. A low-risk suggestion can be automatic; a high-consequence change should be proposed or coach-approved.
- Prefer a small number of high-value check-ins over a dashboard full of low-validity metrics.
- Evaluate recommendations against actual outcomes, not against user compliance alone.

### Unvalidated product hypotheses

These are deliberately marked as **[SPECULATION]**. They are promising design hypotheses, not findings from the recovery literature:

- **[SPECULATION]** A Today screen limited to one primary decision, three supporting facts, and three optional tools will improve athlete comprehension and reduce decision fatigue compared with a metric-heavy dashboard.
- **[SPECULATION]** Showing an intervention receipt with an expiry and undo control will increase trust and make athletes more willing to correct a bad recommendation.
- **[SPECULATION]** Showing a context-specific readiness statement with confidence will reduce overreliance on a single readiness score.
- **[SPECULATION]** A coach queue prioritised by safety, uncertainty, and key-session impact will save more time than a roster-wide recovery ranking.
- **[SPECULATION]** A small, preference-personalised recovery toolkit will produce better sustained use than exposing every modality to every athlete.
- **[SPECULATION]** Asking one targeted follow-up after a contradiction will preserve more data quality than requiring a full daily questionnaire.

Validate these hypotheses in shadow mode and usability testing. Do not convert them into product promises until the outcome measures support them.

## Deep Dive Analysis

## 1. Outcome taxonomy: never collapse these into one score

The product needs separate fields and separate language for the following outcomes:

| Outcome | Operational meaning | Typical measurement | Main trap |
|---|---|---|---|
| Performance recovery | Ability to execute the intended task at the planned quality, load, speed, power, or pace | Completed reps, velocity loss, RPE/RIR, pace/power, technical quality, test result | A person can feel sore and still perform; or feel fine and perform poorly. |
| Soreness / DOMS | Subjective discomfort after unfamiliar or damaging work | Local 0–10 rating, movement discomfort, 24/48/72-hour trajectory | Soreness is not a reliable proxy for adaptation or readiness. |
| Fatigue | Perceived or observed reduction in capacity, energy, motivation, or alertness | Short self-report, RPE drift, performance mismatch, sleep, stress | Device-derived fatigue is often overinterpreted. |
| Readiness | A context-specific estimate of ability to complete a defined session intent | Multivariate within-athlete pattern relative to baseline | There is no universally valid threshold or single definitive marker. |
| Injury risk | A probabilistic and clinically complex risk state involving symptoms, load, exposure, health, and context | Coach/clinician assessment, symptom trajectory, exposure context | A recovery modality or readiness score cannot establish or exclude injury risk. |
| Adaptation | Long-term response to training, nutrition, sleep, and recovery choices | Repeated performance, body composition, capacity, skill, health | Short-term comfort can conflict with long-term training adaptation. |

**[OBSERVED]** Halson’s review concluded that no single fatigue marker is definitive and that monitoring should be individualised and practically interpretable: [PubMed 25200666](https://pubmed.ncbi.nlm.nih.gov/25200666/). Saw et al. similarly support subjective measures as useful, but not as a single unquestionable truth: [PubMed 26423706](https://pubmed.ncbi.nlm.nih.gov/26423706/).

**[INFERRED]** Store and show these as distinct observations. The app’s copy should say “soreness is high; performance signal is stable” rather than “recovery is low.”

## 2. Recovery-method evidence matrix

The table is deliberately conservative. “Auto-Coach may recommend” refers to a coach-configurable policy and an athlete who has opted into the relevant method. It does not mean that every athlete should receive the recommendation.

| Method | Most defensible outcome | Population / modality | Practical dose or timing | Evidence | Auto-Coach status |
|---|---|---|---|---|---|
| Sleep duration and quality | Supports cognition, mood, and performance; injury association is mixed | Athletes and physically active adults; most modalities | Protect a sufficient personal sleep opportunity; stabilise schedule; use sleep extension when needed; do not impose one universal target | Moderate-to-high for performance/cognition; mixed for injury | **Auto-eligible as a low-risk opportunity prompt**, coach review for persistent problems |
| Naps | Can restore alertness and some physical/cognitive performance after short sleep or high load | Athletes / physically active adults; daytime nap studies | Short nap when time-limited; longer opportunity when sleep-deprived and schedule permits; buffer for sleep inertia | Moderate but heterogeneous | **Conditional auto** with timing and sleep-inertia controls |
| Adequate energy availability | Supports recovery, endocrine, bone, immune, and training function; low availability can be harmful | Particularly relevant to high-volume athletes, weight-sensitive sports, and under-fuelled athletes | Coach/dietitian-authored energy and fuelling plan; do not infer or diagnose from weight alone | Moderate-to-high for risk concept; individual thresholds complex | **Coach/dietitian-only for targets; auto may remind, not diagnose** |
| Protein | Supports repair and long-term adaptation; acute soreness/performance effects inconsistent | Resistance, mixed-sport, and endurance athletes | Distribute adequate daily protein; post-session intake can be convenient, not magical | Moderate for adaptation; low-to-mixed for acute recovery | **Auto-eligible only for existing targets and preferences** |
| Carbohydrate | Helps glycogen restoration and repeated-session performance when turnaround is short | Endurance, team-sport, high-volume or twice-daily training | Prioritise after glycogen-depleting work when next hard session is soon; dose depends on body mass and turnaround | Moderate / context-dependent | **Auto-eligible as a coach-authored fuelling reminder** |
| Hydration and electrolytes | Supports thermoregulation and performance when losses are meaningful; sodium improves retention in rehydration contexts | Hot/long sessions, heavy sweaters, repeated sessions, athletes with known sweat data | Individualise from conditions, body-mass change, thirst, urine, and prior tolerance; avoid forced drinking | Moderate; strong caution against both under- and over-replacement | **Conditional auto**; no universal electrolyte prescription |
| Active recovery | May modestly improve perceived recovery or some short-term performance; lactate clearance is not the goal | Mostly trained adults after hard sessions | About 6–10 minutes low-intensity movement is a reasonable trial; keep it easy | Low-to-moderate, heterogeneous | **Auto-eligible as optional, never mandatory** |
| Mobility / stretching | Helps range of motion or movement comfort; little evidence for DOMS or performance recovery as a standalone tool | Athletes; static and dynamic protocols vary | Use task-specific, comfortable mobility; dynamic work in warm-up; avoid painful stretching | Low for recovery; moderate for task-specific ROM | **Auto-eligible for an explicit mobility goal; not as a recovery cure** |
| Massage | Small DOMS/flexibility benefit; no dependable strength, sprint, endurance, or fatigue improvement | Athletes / physically active adults; sports massage varies | Athlete preference; post-event or next-day comfort; no universally optimal dose | Low-to-moderate for soreness; low for performance | **Optional / preference-led** |
| Foam rolling | Short-term ROM and small soreness/performance-decrement effects | Recreationally active and trained adults; protocols vary | Brief, comfortable bouts; no consensus optimal program | Low-to-moderate for short-term ROM/comfort | **Optional / preference-led** |
| Compression | Small improvements in some strength recovery and soreness outcomes | Mixed trained populations; garment pressure and timing vary | Correct fit, comfort, and context; commonly used post-training or during travel | Low-to-moderate; protocol uncertain | **Conditional optional** |
| Cold-water immersion / cryotherapy | Can reduce soreness and sometimes help short-turnaround performance; may blunt some resistance-training adaptations | Athletes; stronger case for tournament/competition turnaround than routine hypertrophy | Common research protocols are roughly 10–15 minutes in cool/cold water, but no universal optimum | Moderate for soreness; conditional for performance; adaptation trade-off | **Conditional, coach-approved; not routine after every strength session** |
| Heat / sauna | May support heat acclimation and endurance capacity; relaxation benefit plausible; not a generic muscle-repair tool | Endurance athletes and healthy adults; passive heat protocols vary | Heat-acclimation blocks are repeated and structured; recovery use should be brief, hydrated, and tolerated | Moderate for selected heat-acclimation outcomes; mixed for general recovery | **Conditional and context-specific** |
| Contrast therapy | May help soreness or perceived recovery versus passive rest; no clear universal superiority | Athletes; hot/cold sequence varies substantially | Protocols are heterogeneous; do not claim an optimal sequence | Low-to-moderate; heterogeneous | **Conditional optional** |
| Breathwork / relaxation | Can reduce stress and improve downshift, autonomic measures, or sleep-related experience; performance effects indirect | Athletes and stressed adults; breathing/mindfulness protocols vary | 2–10 minutes of comfortable slow breathing or relaxation; stop if dizzy or distressed | Low-to-moderate for stress; low for direct performance | **Auto-eligible as a low-risk optional downshift** |
| Rest days / reduced load | Reduces exposure and allows recovery; the best amount depends on training stress and athlete context | All populations; failure, eccentric work, and high volume increase need | Planned rest or reduced-load days; use taper/deload logic when warranted | Moderate conceptually; specific schedule evidence varies | **Auto-eligible only within coach-authored boundaries** |
| Psychological stress management | High stress can impair recovery experience and may moderate performance recovery | Athletes under life, academic, work, or competitive stress | Measure briefly; reduce training demand or add support when persistent and functionally relevant | Moderate for association; intervention-to-performance evidence limited | **Auto may surface and support; escalation is human-led** |

## 3. Detailed recovery-method evidence and implementation guidance

### 3.1 Sleep duration, quality, and naps

**Verdict:** Foundational. Treat sleep as a high-priority context signal and a practical behaviour opportunity, not as a pass/fail readiness gate.

**[OBSERVED] Outcomes**

- Sleep loss is commonly associated with poorer sport-specific performance, cognition, mood, and perceived recovery, although physiological and repeated-sprint findings are not uniform. Fullagar et al.: [PubMed 25315456](https://pubmed.ncbi.nlm.nih.gov/25315456/) and [DOI 10.1007/s40279-014-0260-0](https://doi.org/10.1007/s40279-014-0260-0).
- Athlete sleep consensus guidance notes that habitual short sleep and poor sleep quality are common, while the effects of partial restriction vary by person and task. Walsh et al.: [PubMed 33144349](https://pubmed.ncbi.nlm.nih.gov/33144349/) and [DOI 10.1136/bjsports-2020-102025](https://doi.org/10.1136/bjsports-2020-102025).
- Sleep extension can improve some performance outcomes in athletes, but protocols and responses vary. Sleep-extension review: [PubMed 33352457](https://pubmed.ncbi.nlm.nih.gov/33352457/); basketball sleep-extension study: [PubMed 21731144](https://pubmed.ncbi.nlm.nih.gov/21731144/).
- A nap may improve alertness, physical performance, and cognition after insufficient sleep or high demand. Souabni et al.: [PubMed 34043185](https://pubmed.ncbi.nlm.nih.gov/34043185/). Longer opportunities around 90 minutes were often favourable in the included studies, but heterogeneity and sleep inertia matter.
- Evidence that poor sleep independently predicts injury is mixed. A systematic review found limited support for an independent effect in adult athletes: [PubMed 33560506](https://pubmed.ncbi.nlm.nih.gov/33560506/). A later prospective running cohort found lower sleep quality associated with running-related injury, but the observational result is not a universal threshold: [PubMed 41239840](https://pubmed.ncbi.nlm.nih.gov/41239840/).

**Population and modality:** Athlete and physically active populations; sport-specific performance, strength, endurance, cognition, and sleep-extension or nap interventions. Wearable sleep estimates should be treated as an additional signal rather than a ground truth.

**Dose and timing:**

- **[INFERRED]** Ask about personal sleep opportunity, quality, awakenings, timing, and perceived restoration. Do not apply a universal “under 7 hours equals unsafe” rule.
- Protect a realistic sleep window and regularity around important sessions. Avoid giving the athlete a long sleep-hygiene checklist on a hard-training day; select the one or two most actionable barriers.
- Use a short nap when the athlete has a narrow window and needs alertness; provide a wake-up buffer. Use a longer nap opportunity only when the schedule allows and the athlete tolerates it.
- If the athlete reports persistent insomnia, loud snoring, excessive daytime sleepiness, or repeated unexplained fatigue, the app should recommend professional assessment rather than escalating sleep tips indefinitely.

**Evidence strength:** Moderate-to-high for the general performance/cognition importance of adequate sleep; moderate and individualised for sleep extension and naps; mixed and insufficient for injury prediction from sleep alone.

**Contraindications and safety:**

- **[SAFETY]** Do not use a sleep score to override pain, neurological symptoms, chest symptoms, acute illness, or clinician restrictions.
- A nap can create sleep inertia or impair night sleep. Offer a timing choice and a “skip if it disrupts tonight” option.
- Avoid diagnosing sleep disorders. Persistent symptoms require a clinician or sleep professional.

**Auto-Coach recommendation:**

- **May recommend:** a sleep opportunity prompt, a wind-down option, a short nap option, or a coach-authored schedule adjustment.
- **May not claim:** that sleep data proves recovery, predicts injury, or guarantees performance.
- **Recommended UI language:** “Sleep was shorter than your recent baseline. If you have time, a short nap or lower-intensity start may help today’s session feel more manageable.”

**Implementation implications:** Store both duration and quality; show the baseline and trend; record whether the athlete used a nap and whether it helped alertness or harmed night sleep. Do not make the app punish athletes for sleep they cannot control.

### 3.2 Nutrition: energy availability, protein, carbohydrate, and fuelling

**Verdict:** Foundational and coach/dietitian governed. The product should help an athlete execute an existing fuelling plan and notice patterns; it should not diagnose low energy availability or prescribe a universal diet.

**[OBSERVED] Energy availability**

- Low energy availability can impair recovery, muscle function, endocrine and bone health, immune function, and training response; the clinical picture is broader than body weight. Logue et al.: [PubMed 32245088](https://pubmed.ncbi.nlm.nih.gov/32245088/).
- The IOC REDs consensus frames health and performance consequences as a complex, sex- and context-inclusive syndrome requiring multidisciplinary assessment: [PubMed 37752011](https://pubmed.ncbi.nlm.nih.gov/37752011/). Earlier athletics guidance: [PubMed 30632422](https://pubmed.ncbi.nlm.nih.gov/30632422/) and [DOI 10.1123/ijsnem.2018-0201](https://doi.org/10.1123/ijsnem.2018-0201).

**[OBSERVED] Protein**

- Protein supplementation supports strength and hypertrophy over a prolonged resistance-training programme, but that does not establish that a post-session shake acutely restores performance. Morton et al.: [PubMed 28698222](https://pubmed.ncbi.nlm.nih.gov/28698222/).
- A meta-analysis focused on resistance-exercise muscle damage found that protein can influence some recovery markers, but acute soreness and performance responses are not a dependable “more protein equals recovered” relationship. Pearson et al.: [PubMed 36513777](https://pubmed.ncbi.nlm.nih.gov/36513777/). Earlier review: [PubMed 24435468](https://pubmed.ncbi.nlm.nih.gov/24435468/).
- Co-ingesting protein and carbohydrate may be more useful for some endurance-performance contexts than pushing protein alone. Zhao et al.: [PubMed 39628467](https://pubmed.ncbi.nlm.nih.gov/39628467/).

**[OBSERVED] Carbohydrate**

- Rapid glycogen restoration matters most when the next demanding session is soon. A review discusses approximately 1.2 g/kg/hour as a context-dependent rapid-replenishment target, not a universal daily prescription: [PubMed 33973552](https://pubmed.ncbi.nlm.nih.gov/33973552/).
- Carbohydrate with or without protein can support glycogen restoration after strenuous consecutive exercise; protocol, total intake, and turnaround time matter: [PubMed 33507402](https://pubmed.ncbi.nlm.nih.gov/33507402/). A strength-focused review found that carbohydrate benefits are most plausible after glycogen depletion or frequent sessions, rather than as a blanket strength rule: [PubMed 35215506](https://pubmed.ncbi.nlm.nih.gov/35215506/).

**Population and modality:** Resistance, endurance, team-sport, weight-sensitive, and high-volume athletes. Evidence is most actionable when training is long, glycogen-demanding, repeated within 24 hours, or paired with a known fuelling constraint.

**Dose and timing:**

- **[INFERRED]** The product should begin with athlete-specific targets authored by the coach, sports dietitian, or clinician. It can remind, log, and reflect adherence without inventing targets.
- If the next hard session is soon, surface carbohydrate and fluid timing as the primary recovery context. If the next session is not soon, reduce urgency and avoid making a single meal carry too much explanatory weight.
- Encourage adequate daily protein distributed across meals according to the athlete’s established plan; do not imply that exact timing is more important than total intake and energy adequacy.
- Prompt for a post-training meal only when the athlete has opted into fuelling support or the coach has configured it.

**Evidence strength:** Moderate-to-high for avoiding chronic under-fuelling and supporting repeated high-demand training; moderate for protein’s long-term adaptation role; moderate and context-dependent for rapid carbohydrate restoration; low-to-mixed for acute soreness relief.

**Contraindications and safety:**

- **[SAFETY]** Do not infer an eating disorder, RED-S, or energy deficiency from a single missed meal, weight change, or body-composition metric.
- Do not prescribe calorie deficits, weight loss, supplements, or macronutrient changes without the appropriate professional and athlete consent.
- Ask about allergies, intolerances, cultural/religious constraints, medical diets, diabetes, gastrointestinal problems, and disordered-eating history.
- Persistent fatigue, recurrent illness, menstrual disruption, bone stress symptoms, or unexplained performance decline should produce a human escalation, not a more aggressive fuelling algorithm.

**Auto-Coach recommendation:**

- **May recommend:** “Your coach’s plan calls for a recovery meal,” “your next hard session is within 24 hours,” or “bring your usual carbohydrate/fluid option.”
- **May not:** diagnose low energy availability, calculate a clinical RED-S state, or prescribe a new diet automatically.
- **Preferred control:** a coach-authored fuelling library with replaceable, culturally appropriate options and a clear “not relevant today” response.

**Implementation implications:** Model energy/fuelling as context and support, not morality. Use neutral copy (“fuel availability may be a constraint”) rather than “you failed recovery.” Keep nutrition data private and permissioned. For adherence, measure whether the athlete had access and capacity to follow the plan, not only whether they checked a box.

### 3.3 Hydration and electrolytes

**Verdict:** Individualise to sweat loss, heat, duration, body mass, thirst, and turnaround. Avoid both dehydration minimisation and forced drinking.

**[OBSERVED]** The ACSM position stand describes avoiding excessive body-mass loss and excessive electrolyte change, while recognising individual variation: [PubMed 17277604](https://pubmed.ncbi.nlm.nih.gov/17277604/). The NATA position statement emphasises that both under-replacement and over-replacement can harm performance and increase hyponatraemia risk: [PubMed 28985128](https://pubmed.ncbi.nlm.nih.gov/28985128/).

**[OBSERVED]** In a post-exercise rehydration trial, oral rehydration solution with sodium and carbohydrate and a sports drink retained more fluid than water after approximately 2.6% body-mass loss, but the study was small and does not justify a universal drink prescription: [PubMed 38004153](https://pubmed.ncbi.nlm.nih.gov/38004153/). Sodium also improved fluid retention in earlier controlled work: [PubMed 8549573](https://pubmed.ncbi.nlm.nih.gov/8549573/).

**Population and modality:** Especially relevant to long or hot sessions, high sweat-rate athletes, repeated same-day exposure, and competition travel. Less relevant to a short, cool, low-sweat session.

**Dose and timing:**

- **[INFERRED]** Start with thirst, session duration, conditions, previous body-mass change, and known sweat data. Let the plan specify approximate ranges rather than a universal volume.
- If rapid rehydration is needed and sodium loss is known or likely, the coach/dietitian may configure a sodium-containing option. The app should not auto-select sodium doses for an athlete with unknown medical history.
- Prompt the athlete to bring fluid before a long/hot session and to replace a coach-authored amount afterward when needed.
- Use body-mass change as a trend/context input, not as a daily moral score.

**Evidence strength:** Moderate for matching fluid replacement to meaningful losses and conditions; moderate for sodium improving retention in specific rehydration protocols; insufficient for universal electrolyte dosing.

**Contraindications and safety:**

- **[SAFETY]** Avoid “drink as much as possible” language because exercise-associated hyponatremia is a real risk. Relevant consensus material: [PubMed 28316971](https://pubmed.ncbi.nlm.nih.gov/28316971/) and [PubMed 32097926](https://pubmed.ncbi.nlm.nih.gov/32097926/).
- Flag kidney disease, heart failure, hypertension, fluid restriction, endocrine disease, relevant medication, pregnancy, or clinician-directed sodium/fluid restrictions for human review.
- Confusion, severe headache, vomiting, collapse, chest symptoms, or altered consciousness are emergency signals, not hydration-app prompts.

**Auto-Coach recommendation:**

- **May recommend:** context prompts such as “hot and long session: bring your usual fluid plan,” or “your coach’s rehydration protocol is due.”
- **May not:** issue a universal “drink X litres” instruction, diagnose dehydration, or prescribe sodium without a configured plan.

**Implementation implications:** Add a session-context layer: temperature, humidity, duration, indoor/outdoor, equipment, sweat-rate estimate, and previous tolerance. Display “hydration confidence: low / medium / high” based on data completeness rather than pretending precision.

### 3.4 Active recovery

**Verdict:** A low-risk optional tool for movement, mood, and perceived recovery; not a required method to “flush lactate.”

**[OBSERVED]** A systematic review of active recovery found 26 articles and 471 participants. Short bouts around 6–10 minutes showed consistently positive findings in some performance outcomes, but intensity recommendations were inconclusive, evidence quality was weak, and psychological outcomes were often positive. Lactate clearance was not a reliable endpoint: [PubMed 29742750](https://pubmed.ncbi.nlm.nih.gov/29742750/) and [DOI 10.1519/JSC.0000000000002589](https://doi.org/10.1519/JSC.0000000000002589).

**Population and modality:** Mostly trained and physically active adults after demanding training; low-intensity cycling, walking, or sport-specific movement.

**Dose and timing:**

- Trial 6–10 minutes at genuinely easy effort after training or later that day.
- Keep intensity below the athlete’s normal training threshold; the purpose is movement and downshift.
- Stop or regress if the athlete reports increased pain, heaviness, or fatigue.

**Evidence strength:** Low-to-moderate for perceived recovery and selected short-term outcomes; low for lactate-based claims or injury prevention.

**Contraindications and safety:** Acute injury, worsening pain, systemic illness, dizziness, or a coach/clinician rest order. Do not use “active recovery” to pressure an exhausted athlete into extra exercise.

**Auto-Coach recommendation:** **Auto-eligible as an optional suggestion** when the athlete reports that easy movement usually helps and there is no pain or safety flag. It should offer “walk, easy cycle, or skip” rather than a required prescription.

**Implementation implications:** Track whether the athlete perceived benefit. A method that helps one athlete and worsens another should remain preference-personalised.

### 3.5 Mobility and stretching

**Verdict:** Use for a defined range-of-motion or movement-comfort objective, not as a generic DOMS cure.

**[OBSERVED]** A systematic review of post-exercise stretching found no meaningful standalone improvement in recovery outcomes such as soreness, strength, or performance: [PubMed 34025459](https://pubmed.ncbi.nlm.nih.gov/34025459/). A large review found that stretching reduced peak soreness by only a very small amount on average: [PubMed 21735398](https://pubmed.ncbi.nlm.nih.gov/21735398/). Acute stretching can change flexibility and has generally small or inconsequential effects on subsequent performance; dynamic activity is useful in warm-ups: [PubMed 26642915](https://pubmed.ncbi.nlm.nih.gov/26642915/).

**Population and modality:** Athletes across strength, endurance, field, and skill sports; static, dynamic, active, and task-specific mobility protocols are not interchangeable.

**Dose and timing:**

- Use comfortable, non-threatening range for a known restriction or skill requirement.
- Prefer dynamic movement in preparation; use static work where it serves the athlete’s mobility plan, not as a ritual after every session.
- Do not chase pain, intense sensation, or extreme range as evidence of effectiveness.

**Evidence strength:** Low for recovery; moderate for task-specific range-of-motion changes; no evidence that painful stretching prevents injury in a general population.

**Contraindications and safety:** Acute tissue injury, unstable joint, neurological symptoms, unexplained severe pain, post-surgical restriction, or clinician-specific range limits. The app must never encourage stretching into sharp pain, numbness, or radiating symptoms.

**Auto-Coach recommendation:** **Auto-eligible only when tied to an explicit movement goal** already defined by the coach or clinician. Do not label it “recovery required.”

**Implementation implications:** Show the intended function (“ankle range for tomorrow’s squat”) instead of a generic “mobility session.” Record pre/post comfort and task performance, not only minutes completed.

### 3.6 Massage and foam rolling

**Verdict:** Optional comfort and short-term movement tools. Useful when the athlete likes them; not a dependable route to restoring strength or preventing injury.

**[OBSERVED] Massage**

- A systematic review/meta-analysis of 29 studies and 1,012 participants found no evidence that sports massage improves strength, jump, sprint, endurance, or fatigue; small improvements were seen for flexibility and DOMS: [PubMed 32426160](https://pubmed.ncbi.nlm.nih.gov/32426160/) and [DOI 10.1136/bmjsem-2019-000614](https://doi.org/10.1136/bmjsem-2019-000614).
- The broader evidence synthesis found massage among the more useful techniques for perceived DOMS and fatigue, but this is not equivalent to performance recovery: [PubMed 29755363](https://pubmed.ncbi.nlm.nih.gov/29755363/).

**[OBSERVED] Foam rolling**

- Meta-analysis suggests small short-term benefits for flexibility, soreness, and some performance decrements, with no clear consensus on the optimal protocol: [PubMed 31024339](https://pubmed.ncbi.nlm.nih.gov/31024339/) and [DOI 10.3389/fphys.2019.00376](https://doi.org/10.3389/fphys.2019.00376).
- A systematic review found increased short-term ROM without meaningful performance impairment and possible DOMS attenuation: [PubMed 26618062](https://pubmed.ncbi.nlm.nih.gov/26618062/).

**Population and modality:** Recreationally active and trained adults; therapist-delivered massage and self-administered rolling differ in dose and control.

**Dose and timing:**

- Keep brief and comfortable. A short bout before movement may be used for ROM; after training or the next day may be used for comfort.
- No product default should state that a particular pressure, roller, or duration “breaks up adhesions.”
- Let the athlete choose an area and stop if symptoms worsen.

**Evidence strength:** Low-to-moderate for soreness and short-term flexibility; low for objective performance and injury prevention.

**Contraindications and safety:** Avoid aggressive pressure over acute injury, swelling, bruising, skin infection, open wounds, suspected thrombosis, bony injury, unexplained neurological symptoms, or areas restricted by a clinician. A user with vascular or bleeding risk needs professional guidance.

**Auto-Coach recommendation:** **Preference-led optional suggestion.** “Would light rolling usually help you move more comfortably?” is acceptable. “You need to roll because your recovery is poor” is not.

**Implementation implications:** Capture “comfort improved / unchanged / worse,” not an unsupported tissue-mechanics claim. Keep massage/rolling in an optional toolkit, not the core recovery score.

### 3.7 Compression garments

**Verdict:** A modest, context-dependent optional tool; fit and comfort are more important than a universal pressure number.

**[OBSERVED]** A meta-analysis of 23 studies found a small overall benefit, with greater strength-recovery effects at some early and later time points, particularly after resistance exercise; optimal pressure and training-status effects remained unclear: [PubMed 28434152](https://pubmed.ncbi.nlm.nih.gov/28434152/) and [DOI 10.1007/s40279-017-0728-9](https://doi.org/10.1007/s40279-017-0728-9). An RCT comparing contrast water and compression found no clear hierarchy over passive recovery and mainly transient soreness effects: [PubMed 18580411](https://pubmed.ncbi.nlm.nih.gov/18580411/).

**Population and modality:** Mixed trained populations; sleeves, socks, and full garments; pressure, fit, duration, and timing vary.

**Dose and timing:** Use the athlete’s known, comfortable garment according to coach/medical guidance, commonly after training or during travel. Avoid turning “longer” into “better.”

**Evidence strength:** Low-to-moderate for small recovery/soreness effects; low for performance or injury reduction.

**Contraindications and safety:** Poor fit, numbness, colour change, skin damage, pain, suspected vascular disease, or clinician-directed restrictions. Do not recommend compression as treatment for undiagnosed swelling.

**Auto-Coach recommendation:** **Conditional optional.** It may remind an athlete to pack or use an already approved garment; it should not choose compression pressure or diagnose a circulation problem.

**Implementation implications:** Add a comfort/safety check and a “remove if uncomfortable” instruction. The intervention receipt should state the expected outcome as “possible soreness/comfort support,” not “improved circulation” unless a qualified clinical context is explicitly configured.

### 3.8 Cold-water immersion and cryotherapy

**Verdict:** Useful as a targeted short-turnaround tool, especially when immediate soreness relief or next-day performance matters more than maximising a resistance-training adaptation signal. Do not make it a default after every strength or hypertrophy session.

**[OBSERVED]** Meta-analytic evidence in trained athletes suggests small performance benefits from cold-water immersion, with effects influenced by modality, immersion area, timing, and time since exercise; whole-body protocols and endurance/sprint contexts may respond differently from strength work: [PubMed 23434565](https://pubmed.ncbi.nlm.nih.gov/23434565/). Other reviews find reduced DOMS versus passive recovery but heterogeneous protocols: [PubMed 22336838](https://pubmed.ncbi.nlm.nih.gov/22336838/) and [PubMed 36527593](https://pubmed.ncbi.nlm.nih.gov/36527593/).

**[OBSERVED] Adaptation trade-off**

- Regular immediate post-resistance CWI can attenuate some molecular signalling and satellite-cell responses compared with active recovery: [PubMed 26174323](https://pubmed.ncbi.nlm.nih.gov/26174323/) and [PubMed 31513450](https://pubmed.ncbi.nlm.nih.gov/31513450/).
- A meta-analysis reported attenuated strength gains when CWI was used after resistance exercise, particularly in males: [PubMed 35068365](https://pubmed.ncbi.nlm.nih.gov/35068365/).
- This does not mean “cold is bad.” It means the product must identify the current goal: tournament turnaround, comfort, heat management, or long-term hypertrophy.

**Population and modality:** Competitive and trained athletes; strongest product use cases are congested competition, hot conditions, or a deliberate short-term soreness/performance objective. Generalisation to injured, medically complex, adolescent, or untrained populations is limited.

**Dose and timing:** Common research protocols are approximately 10–15 minutes in 10–15°C water, but studies vary and no universal optimum is established. Treat this as a familiar protocol range, not an app prescription.

**Evidence strength:** Moderate for DOMS reduction; conditional/moderate for short-term performance; moderate concern for repeated immediate use after resistance training; insufficient for injury prevention.

**Contraindications and safety:**

- **[SAFETY]** Screen for cardiovascular disease, uncontrolled hypertension, arrhythmia, syncope, cold intolerance/Raynaud-type symptoms, impaired sensation, pregnancy, acute illness, and clinician restrictions.
- Stop for chest pain, dizziness, severe numbness, confusion, or uncontrollable shivering. Do not enter cold water alone.
- The app should link to local emergency guidance and defer to a clinician when medical status is unknown.

**Auto-Coach recommendation:** **Conditional / proposal-only.** The app may say: “You have a short turnaround and have previously tolerated CWI; this is an optional soreness/performance tool. It may not be ideal after a hypertrophy-focused session.” It should require athlete confirmation and coach policy before adding it to the plan.

**Implementation implications:** The recommendation must display the trade-off in the same view. A “cold” button without goal context is unsafe product design.

### 3.9 Heat and sauna

**Verdict:** A context-specific endurance and heat-acclimation tool, plus a possible relaxation tool; not a generic post-lift recovery intervention.

**[OBSERVED]** In a very small crossover study of six male distance runners, repeated post-exercise sauna exposure over about three weeks improved a run-to-exhaustion outcome and increased plasma volume; the sample and endurance-specific design limit generalisation: [PubMed 16877041](https://pubmed.ncbi.nlm.nih.gov/16877041/). A later study examined intermittent sauna exposure and heat-acclimation/exercise-capacity outcomes: [PubMed 33211153](https://pubmed.ncbi.nlm.nih.gov/33211153/) and full text at [PMC7862510](https://pmc.ncbi.nlm.nih.gov/articles/PMC7862510/).

**[OBSERVED]** Sauna is generally tolerated by many healthy adults and some people with stable cardiovascular disease when used sensibly, but dehydration, hypotension, arrhythmia, alcohol, and overheating are relevant risks: [PubMed 31102597](https://pubmed.ncbi.nlm.nih.gov/31102597/) and [DOI 10.1016/j.pcad.2019.05.001](https://doi.org/10.1016/j.pcad.2019.05.001). Recent passive-heating meta-analysis results were mixed for pooled cardiometabolic outcomes: [PubMed 41049507](https://pubmed.ncbi.nlm.nih.gov/41049507/).

**Population and modality:** Mainly endurance athletes and healthy adults; protocols include sauna, hot-water immersion, and passive heat with very different thermal loads.

**Dose and timing:**

- A heat-acclimation block should be coach-authored and repeated with gradual exposure, not generated from a single hot day.
- A relaxation-oriented sauna suggestion should include hydration, time, temperature, and exit criteria, and it should not follow significant dehydration or illness.
- There is no evidence basis for an Auto-Coach to prescribe “more sauna” as a universal recovery answer.

**Evidence strength:** Moderate for selected heat-acclimation/endurance adaptations; low-to-mixed for general recovery and passive-health claims; insufficient for injury reduction.

**Contraindications and safety:** Fever/illness, dehydration, heat intolerance, uncontrolled cardiovascular disease or blood pressure, alcohol, pregnancy, relevant medications, history of syncope, or clinician restriction. Never use heat to “sweat out” weight or illness.

**Auto-Coach recommendation:** **Conditional and context-specific.** Allow a coach-authored heat-acclimation protocol or optional relaxation prompt with screening. Do not auto-prescribe heat after a dehydrating session.

**Implementation implications:** Pair heat exposure with the environment and hydration context. The app should ask “what is the goal?” before recommending it: acclimation, relaxation, or something else.

### 3.10 Contrast therapy

**Verdict:** A preference-led, short-term soreness/perceived-recovery option with heterogeneous protocols and no clear universal superiority.

**[OBSERVED]** A systematic review of contrast water therapy after exercise-induced muscle damage found possible benefit over passive recovery for some outcomes, but studies and protocols were heterogeneous: [PubMed 23626806](https://pubmed.ncbi.nlm.nih.gov/23626806/) and [PMC3633882](https://pmc.ncbi.nlm.nih.gov/articles/PMC3633882/). An RCT comparing contrast water and compression did not establish a clear hierarchy and found mostly transient soreness effects: [PubMed 18580411](https://pubmed.ncbi.nlm.nih.gov/18580411/).

**Population and modality:** Athletes and physically active adults; sequences, temperatures, immersion depth, total duration, and comparison groups vary greatly.

**Dose and timing:** Common practice varies between alternating short cold and warm periods for roughly 6–15 minutes. This is a practice range, not an evidence-derived optimum. Do not imply that one sequence is clinically established.

**Evidence strength:** Low-to-moderate for soreness/perceived recovery; low for objective performance and injury prevention; uncertain for adaptation trade-offs.

**Contraindications and safety:** Combine the cold and heat screens. Avoid when medical status, blood-pressure response, cold tolerance, or pregnancy-related restrictions are unknown. Stop for dizziness, chest symptoms, severe numbness, or unusual distress.

**Auto-Coach recommendation:** **Conditional optional, proposal-only.** Require an athlete preference, prior tolerance, coach policy, and a clear short-term goal.

**Implementation implications:** The intervention card should explain that contrast may change how the athlete feels more reliably than it changes performance. Avoid making it the default “advanced recovery” feature.

### 3.11 Breathwork, relaxation, and downshift

**Verdict:** A low-cost, low-risk optional support for stress and downshift when kept gentle and non-clinical; direct performance claims should remain modest.

**[OBSERVED]** Meditation and mindfulness evidence supports small-to-moderate improvements in anxiety, depression, and pain in some populations, with low or mixed evidence for stress and quality-of-life superiority over active treatments: [PubMed 24395196](https://pubmed.ncbi.nlm.nih.gov/24395196/). Mindfulness interventions show physiological stress changes in meta-analysis: [PubMed 28863392](https://pubmed.ncbi.nlm.nih.gov/28863392/). Slow breathing reviews report autonomic and stress-related effects, but protocols and endpoints vary: [PubMed 35623448](https://pubmed.ncbi.nlm.nih.gov/35623448/) and [PubMed 36871835](https://pubmed.ncbi.nlm.nih.gov/36871835/). Athlete-focused mindfulness evidence is emerging: [PubMed 38939219](https://pubmed.ncbi.nlm.nih.gov/38939219/).

**Population and modality:** Athletes and stressed adults; slow breathing, guided relaxation, mindfulness, body scans, and pre-sleep downshift differ and should not be represented as interchangeable clinical treatments.

**Dose and timing:** Offer 2–10 minutes of comfortable breathing or relaxation after training, before sleep, or before a stressful event. Avoid breath holds, hyperventilation, or intense protocols by default.

**Evidence strength:** Low-to-moderate for perceived stress and autonomic/downshift measures; low for direct performance recovery; insufficient for treating anxiety, trauma, panic, or other mental-health conditions in an app.

**Contraindications and safety:** Dizziness, panic, respiratory disease, trauma triggers, or distress. Stop immediately and return to normal breathing. Persistent mental-health symptoms require qualified care.

**Auto-Coach recommendation:** **Auto-eligible as an optional, non-clinical downshift.** Let the athlete skip it and never infer that refusal means poor commitment.

**Implementation implications:** Measure perceived calm, sleep ease, and usefulness; do not use HRV changes as proof that the intervention “worked.” Make the content inclusive and avoid spiritual or therapeutic claims unless clearly labelled and professionally reviewed.

### 3.12 Psychological stress and life load

**Verdict:** A high-value contextual signal that should influence interpretation and communication, not automatically trigger a diagnosis or a training shutdown.

**[OBSERVED]** In resistance-trained students, perceived life stress moderated short-term maximal-force recovery after heavy leg press, while effects on fatigue, energy, and soreness were not uniformly changed: [PubMed 22688829](https://pubmed.ncbi.nlm.nih.gov/22688829/) and [DOI 10.1249/MSS.0b013e31825f67a0](https://doi.org/10.1249/MSS.0b013e31825f67a0). Chronic stress literature links psychological stress to recovery and performance processes, but it is heterogeneous: [PubMed 24343323](https://pubmed.ncbi.nlm.nih.gov/24343323/).

**[OBSERVED]** Short daily athlete health surveys can be reliable for stress and sleep, while “readiness” may have a weaker relationship with overuse injury. This supports asking a few simple questions, not outsourcing interpretation to a single readiness number: [PubMed 39947188](https://pubmed.ncbi.nlm.nih.gov/39947188/).

**Population and modality:** Athletes with academic, work, family, travel, financial, or competitive stress; all training modalities. Context is especially important when subjective well-being and performance diverge.

**Dose and timing:**

- Ask one short perceived-stress question daily or around high-load weeks, with an optional “what is driving it?” response.
- Use trends and functional impact: sleep disruption, motivation, concentration, missed meals, and inability to complete normal routines.
- Avoid making the athlete repeatedly explain a sensitive issue after they have declined.

**Evidence strength:** Moderate for stress as a meaningful contextual correlate and moderator; low-to-moderate for specific app interventions improving performance; insufficient for injury prediction from stress alone.

**Contraindications and safety:**

- **[SAFETY]** The app should have a human-escalation pathway for severe distress, self-harm risk, abuse, panic, or inability to function. Do not attempt therapy through a coaching chatbot.
- Keep sensitive stress data access-controlled and transparent.

**Auto-Coach recommendation:** **Auto may surface and support, but escalation is human-led.** It may suggest a lower-friction session, a brief downshift, or a coach check-in when stress is high and the athlete opts in. It should not declare “overtraining” from stress alone.

**Implementation implications:** Treat stress as a modifier of uncertainty and communication tone. A high-stress athlete should see fewer demanding questions and clearer choices, not a more elaborate dashboard.

### 3.13 Rest days, reduced load, and deloading

**Verdict:** Rest is a training-design variable, not a moral reward. The app should manage exposure and intent, not prescribe total inactivity by default.

**[OBSERVED]** Recovery time increases after high-effort or failure-based resistance training, and training volume, eccentric emphasis, exercise selection, and athlete status influence the recovery requirement: [PubMed 28965198](https://pubmed.ncbi.nlm.nih.gov/28965198/). A review of microcycle construction recommends accounting for recovery time and using lower volume or strategic rest around high-demand sessions: [PubMed 38689583](https://pubmed.ncbi.nlm.nih.gov/38689583/) and [DOI 10.5114/jhk/186659](https://doi.org/10.5114/jhk/186659).

**[OBSERVED]** Short periods of training cessation do not automatically erase adaptation. In a trained population, three and five days of cessation preserved lower-body strength in one study, while upper-body differences varied by duration: [PubMed 35180185](https://pubmed.ncbi.nlm.nih.gov/35180185/). Detraining findings are time- and modality-dependent: [PubMed 10966148](https://pubmed.ncbi.nlm.nih.gov/10966148/).

**Population and modality:** All athletes; especially useful in high-volume, eccentric, lower-body, contact, competition, travel, illness-recovery, and return-after-lapse contexts.

**Dose and timing:**

- Plan rest or reduced-load days according to the block intent and the athlete’s schedule.
- A “rest day” may mean no structured training, easy movement, technical work, mobility, or normal life activity; define it clearly.
- Use tapers and deloads as coach-authored strategies rather than automatic responses to one low score.

**Evidence strength:** Moderate for the need to manage recovery demand; moderate-to-low for one universal rest-day schedule; insufficient to call bed rest a normal recovery intervention.

**Contraindications and safety:** Prolonged inactivity can create its own costs and should not be used to avoid appropriate rehabilitation. Acute medical restrictions supersede the training plan.

**Auto-Coach recommendation:** **Auto-eligible only inside explicit coach boundaries.** The app may substitute a planned easy/recovery day, hold a progression, or propose a rest day when multiple signals align. Moving a key session or cancelling a week should require coach or athlete confirmation.

**Implementation implications:** Display the preserved intent: “reduce exposure so Friday’s key session remains high quality,” not “you are too unfit to train.” Track re-entry after rest to avoid a large first-session spike.

## 4. Progression and regression system

### 4.1 Definitions

**Progression** is a planned increase in training stimulus, task complexity, range, speed, density, or autonomy that remains aligned with the current goal and is supported by repeated evidence of tolerance.

**Regression** is a temporary, intentional reduction or substitution that preserves as much of the session’s purpose as possible while reducing risk, fatigue, pain provocation, technical breakdown, or recovery cost.

**Hold** is not failure. It is the correct action when evidence is insufficient to progress or regress.

**[OBSERVED]** A meta-analysis of autoregulated versus fixed resistance training found a small-to-moderate overall advantage for autoregulated approaches across short interventions, but the methods were heterogeneous and did not justify an unconstrained autonomous plan writer: [PubMed 33776802](https://pubmed.ncbi.nlm.nih.gov/33776802/) and [DOI 10.3389/fphys.2021.651112](https://doi.org/10.3389/fphys.2021.651112).

**[OBSERVED]** Velocity-loss thresholds can change the fatigue and adaptation profile of resistance training. In one trial, a lower velocity-loss condition produced similar squat strength but greater countermovement-jump improvement, while a higher velocity-loss condition produced more hypertrophy in some measures: [PubMed 27038416](https://pubmed.ncbi.nlm.nih.gov/27038416/) and [DOI 10.1111/sms.12678](https://doi.org/10.1111/sms.12678).

**[OBSERVED]** Training to failure is not required for strength or hypertrophy in the aggregate literature, and it can increase recovery demand: [PubMed 33497853](https://pubmed.ncbi.nlm.nih.gov/33497853/) and [DOI 10.1016/j.jshs.2021.01.007](https://doi.org/10.1016/j.jshs.2021.01.007).

### 4.2 The progression vector

The app should represent progression as a vector, not simply “add weight.” Possible axes:

| Axis | Progression example | Regression example |
|---|---|---|
| Load | 100 kg to 102.5 kg at same quality | Reduce load while preserving tempo and technique |
| Repetitions | 3 × 5 to 3 × 6 within target RPE | 3 × 5 to 3 × 4 when fatigue rises |
| Sets / volume | 3 sets to 4 sets after repeated tolerance | Remove the final set while keeping the key work |
| Density | Same work in slightly less time | Add rest or split the work |
| Range of motion | Partial to full controlled range | Reduce ROM within a safe, approved variation |
| Complexity | Stable pattern to multi-planar or loaded pattern | Use a simpler variation with the same intent |
| Speed / power | Increase speed-quality exposure | Reduce load or stop when speed/technique drops |
| Frequency | Add a carefully placed exposure | Micro-dose or combine exposures to protect recovery |
| Environment | Add heat, terrain, or competition constraint | Return to controlled environment |
| Autonomy | Athlete chooses among approved options | Coach narrows choices when uncertainty or symptoms rise |

**[INFERRED]** The engine should progress only one primary axis at a time unless a coach explicitly authorises a compound change. Simultaneously increasing load, sets, and density makes attribution impossible and increases the chance of an avoidable spike.

### 4.3 A bounded decision hierarchy

1. **Safety and symptoms first.** Pain, neurological symptoms, acute illness, chest symptoms, collapse, or a clinician restriction override performance ambition.
2. **Protect the session’s intent.** Identify whether the session is for strength, power, hypertrophy, aerobic base, speed, skill, exposure, or recovery.
3. **Check objective execution.** Compare actual load, reps, velocity, pace, technical quality, and RPE/RIR with the plan and the athlete’s baseline.
4. **Check recovery context.** Sleep, stress, fuelling, hydration, recent load, soreness trajectory, and schedule constraints modify confidence.
5. **Select the smallest reversible operation.** Hold, add rest, remove a set, reduce load, change variation, or move the session.
6. **Require confirmation where consequence is meaningful.** A low-risk suggestion can be accepted in one tap; a key-session move or pain-related substitution should require athlete/coach confirmation.
7. **Observe the next outcome.** Record whether the adjustment preserved quality and whether the following 24–72 hours improved or worsened.

### 4.4 Progression gate

Progression should be available only when all required conditions are satisfied:

- The athlete’s stated goal and the session intent are known.
- The last exposure met the coach-authored quality criterion.
- Pain/symptom state is absent, stable, or explicitly cleared for progression.
- Recovery context is not showing a persistent unresolved deterioration.
- The progression is within a coach-authored bound.
- The athlete has not just returned from illness, a layoff, travel disruption, or a major load change unless the re-entry policy says otherwise.
- Data quality is sufficient; otherwise hold and ask the minimum useful question.

**[RECOMMENDATION]** Default to “repeat and confirm” before increasing a second variable. The app should be comfortable saying “same exposure again” when the signal is ambiguous.

### 4.5 Regression triggers and actions

| Trigger pattern | Preferred first action | Why |
|---|---|---|
| High soreness but objective performance and technique stable | Keep intent; offer extra rest or optional comfort tool | Soreness alone does not prove impaired performance |
| Low sleep, high stress, and rising RPE across multiple sets | Reduce volume or density before abandoning the session | Preserve the training target with lower recovery cost |
| Velocity/pace drops beyond the coach’s cap | Stop the set, add rest, lower load, or switch to quality work | Prevent accumulating low-quality fatigue |
| Pain increases set to set or changes movement | Stop the provoking pattern; use approved alternative or escalate | Pain trajectory matters more than a single number |
| High readiness report but objective performance is poor | Trust the mismatch; hold progression and investigate context | “Feeling ready” is not proof of capacity |
| Wearable score low but athlete reports good function and execution is normal | Do not auto-regress solely from the device | Device signal is uncertain and individual baselines matter |
| Missing data after a high-load week | Hold progression; ask one targeted question | Unknown is not green |
| Multiple missed sessions | Use re-entry plan; reduce first exposure | Avoid a large load spike after a lapse |
| Heat/dehydration context with deteriorating execution | End or modify exposure; rehydrate according to plan; escalate if severe | Environment can change risk quickly |
| High life stress with impaired sleep and adherence | Reduce friction and training ambition; offer coach contact | Stress changes capacity and decision quality |

### 4.6 Approved action vocabulary

To make the product explainable, the action library should be small and typed. It should not invent free-form training plans in the moment.

**Low-consequence actions that may be auto-eligible:**

- Hold the planned load.
- Add a coach-approved rest interval.
- Remove the final accessory set.
- Offer an easy warm-up or optional active-recovery movement.
- Offer a brief relaxation or sleep opportunity prompt.
- Surface a coach-authored hydration or fuelling reminder.
- Offer a pre-approved equivalent variation when the athlete has already marked it as comfortable.

**Actions that normally require athlete confirmation:**

- Reduce planned load or reps.
- Change the main movement variation.
- Convert a hard conditioning session to an easy session.
- Move a key session to another day.
- Use cold, heat, contrast, or compression when the athlete has not previously opted in.

**Actions that require coach or clinician policy:**

- Progress load, volume, density, complexity, or frequency beyond a configured bound.
- Change a return-to-sport or rehabilitation progression.
- Interpret persistent pain, swelling, instability, neurological symptoms, or recurrent illness.
- Prescribe supplement, medication, clinical nutrition, weight loss, or fluid/electrolyte targets.
- Mark an athlete safe to return after injury or illness.

### 4.7 Session-specific progression examples

| Goal | Progression policy | Regression policy |
|---|---|---|
| Strength | Repeat target exposure until quality and RPE/RIR are stable; add one small load step within bounds | Keep load, add rest, reduce one set, or use a lower-load quality variation |
| Hypertrophy | Progress reps within a range before adding load; control failure exposure | Stop farther from failure, reduce sets, or preserve the movement with less fatigue |
| Power / speed | Progress only when speed and technical quality remain above the coach cap | Reduce load, cut volume, increase rest, or move to technical/power-quality work |
| Endurance | Increase duration, distance, or intensity one axis at a time; account for heat and life load | Reduce duration or intensity; preserve easy aerobic exposure when appropriate |
| Team sport | Protect high-value speed/skill exposures around match schedule | Reduce conditioning density and preserve technical/decision work |
| Mobility | Progress range only with comfortable control and no symptom escalation | Reduce range, load, leverage, or complexity; seek clinician input when symptoms persist |
| Return to training | Use exposure and symptom trajectory gates with clinician/coach protocol | Step back one level; do not improvise around pain or medical restrictions |

### 4.8 Periodisation and frequency implications

**[OBSERVED]** Periodised resistance training has advantages over non-periodised approaches for some strength outcomes, while hypertrophy effects are less clear; undulating approaches may help trained strength in some analyses: [PubMed 35044672](https://pubmed.ncbi.nlm.nih.gov/35044672/) and [DOI 10.1007/s40279-021-01636-1](https://doi.org/10.1007/s40279-021-01636-1).

**[OBSERVED]** Frequency effects are often explained by total volume when volume is equated, and well-trained populations may not show clear strength differences across a range of frequencies: [PubMed 29470825](https://pubmed.ncbi.nlm.nih.gov/29470825/), [PubMed 33886099](https://pubmed.ncbi.nlm.nih.gov/33886099/), and [PubMed 27102172](https://pubmed.ncbi.nlm.nih.gov/27102172/).

**[INFERRED]** The app should ask whether the coach is trying to progress total work, exposure frequency, quality, or convenience. A schedule change is not automatically a progression.

### 4.9 Load and injury-risk guardrails

Training-load ratios such as ACWR have been widely discussed, but the calculation methods and evidence are heterogeneous. Reviews report limitations that make a single ratio inappropriate as an injury predictor or automatic decision rule: [PubMed 32572824](https://pubmed.ncbi.nlm.nih.gov/32572824/), [PubMed 26511006](https://pubmed.ncbi.nlm.nih.gov/26511006/), and [PubMed 29943231](https://pubmed.ncbi.nlm.nih.gov/29943231/).

**[RECOMMENDATION]** Use load history as context, trend, and anomaly detection. Do not show “injury risk: 71%” based on ACWR, soreness, HRV, or one missed sleep night. If a coach wants load guardrails, configure them as transparent policy limits with an explanation and a human override.

### 4.10 Return after a lapse

The product should treat a missed week, illness, travel block, or major life disruption as a state transition, not as a punishment.

1. Ask what changed and whether the athlete is medically well enough to resume.
2. Preserve the exercise pattern and goal where possible.
3. Reduce the first exposure using a coach-authored re-entry percentage or a simpler variant.
4. Evaluate tolerance over the next 24–72 hours.
5. Progress one axis only after successful re-entry.

**[INFERRED]** The exact re-entry percentage should be coach policy, not a universal app formula. The interface should explain “re-entry exposure” rather than “you lost fitness.”

## 5. Recovery state and decision engine: conceptual product contract

### 5.1 Required input classes

| Input | Source | Update rhythm | Product treatment |
|---|---|---|---|
| Sleep duration and quality | Athlete, wearable, sleep system | Daily | Keep source and confidence separate; compare within-person baseline |
| Pain and symptoms | Athlete, coach, clinician | Event-based / daily | Highest priority; body area and trajectory required |
| Soreness | Athlete | Daily / 24–72-hour follow-up | Localise and trend; never equal to readiness |
| Energy and fatigue | Athlete | Daily | Use simple language and baseline deviation |
| Psychological stress | Athlete | Daily / event-based | Sensitive, access-controlled, human escalation |
| Readiness expectation | Athlete | Before session | Ask for expectation, not a biological claim |
| Actual performance | Training record, coach | Per session | Compare planned versus actual execution |
| RPE / RIR / technical quality | Athlete, coach, sensor | Per set/session | Anchor progress/regress decisions |
| Velocity / pace / power | Sensor or manual | Per rep/interval | Useful when reliable; athlete-specific thresholds |
| HRV / resting HR | Wearable | Daily | Trend and context only; device quality and baseline matter |
| Hydration/heat context | Environment, athlete, coach | Per session | Do not infer fluid needs without conditions |
| Fuelling context | Athlete, coach/dietitian plan | Session/day | Support existing plan; do not diagnose |
| Recent load | Training record | Rolling window | Context, not a standalone injury prediction |
| Adherence/data completeness | Product | Daily / weekly | Distinguish non-adherence from missing access or missing data |

Each observation should retain: source, timestamp, athlete/coach entry, baseline relationship, confidence, missingness reason, and whether it conflicts with another signal.

### 5.2 State labels, not scores

Use a small state set that can be explained:

- **Normal:** plan and signals are aligned; proceed within existing policy.
- **Advisory:** a low-consequence support or small optional adjustment may help.
- **Caution:** signals conflict or decline; hold progression and ask a targeted question.
- **Uncertain:** data is missing, stale, or contradictory; avoid confident adaptation.
- **Safety stop:** symptom, medical, or emergency boundary requires pause/escalation.
- **Coach review:** a meaningful plan change exceeds Auto-Coach authority.

**[INFERRED]** The user should see one state label plus the two or three facts that produced it. The engine may maintain richer internal features, but the athlete-facing view should not expose a wall of metrics.

### 5.3 Signal priority

1. Safety and acute symptoms.
2. Clinician and coach constraints.
3. Protected key-session intent.
4. Objective performance mismatch and technical quality.
5. Persistent subjective decline across multiple days.
6. Sleep, stress, fuelling, hydration, and environmental context.
7. Wearable-derived recovery signals.
8. Preference and convenience.

This ordering is a design recommendation, not a validated clinical hierarchy. It should be tested in coach review and safety scenarios.

### 5.4 Confidence behavior

- High confidence means multiple recent, internally consistent signals support the same low-consequence action.
- Medium confidence means the signal is plausible but incomplete or mixed.
- Low confidence means the action should be a hold, a question, or coach review.

Confidence is not an outcome score. It describes how sure the system is that its chosen explanation is adequate.

### 5.5 Explainability receipt

Every adjustment or recovery suggestion should be accompanied by a compact receipt:

| Receipt field | Example |
|---|---|
| Goal | Preserve tomorrow’s key speed exposure |
| Observed | Sleep below recent baseline; RPE higher than usual in warm-up |
| Inference | Today’s planned volume may carry higher quality cost |
| Action | Hold load, add rest, remove final accessory set |
| Expected outcome | Preserve quality; soreness benefit not guaranteed |
| Confidence | Medium |
| Authority | Auto-Coach within coach policy |
| Expiry | This session only |
| Athlete control | Accept, edit, undo, ask coach |

The receipt should state what it did not use when that matters: “This change was not based on HRV alone.”

## 6. Calm visual design for a sophisticated engine

### 6.1 Product principle

The product should feel simple because it is well prioritised, not because the engine is shallow. The athlete should usually see one next action, one reason, and one way to adjust it. The coach should be able to inspect the evidence chain without forcing the athlete to live inside it.

### 6.2 Athlete home: Today

Recommended order:

1. **Today card:** session name, intent, time estimate, and one primary start action.
2. **Context line:** “Sleep lower than usual · stress elevated · no pain reported.”
3. **Decision card:** “Proceed as planned” or “Start with a reduced-volume option.”
4. **One-tap actions:** Start, adjust, ask coach, or skip.
5. **Optional recovery support:** no more than three choices, labelled by expected outcome.
6. **Evidence / why drawer:** expandable, not forced into the main screen.

Avoid a grid of ten coloured scores. A single clear Today view should carry the athlete through the next decision.

### 6.3 Coach desktop: decision-first workspace

Recommended structure:

- **Top bar:** date, roster, sync state, unresolved safety items.
- **Weekly ledger:** planned vs actual sessions, intent, load, key recovery context, and coach notes.
- **Decision queue:** only items needing attention; each row has issue, confidence, suggested action, and expiry.
- **Athlete drawer:** timeline, recovery observations, interventions, performance trend, and evidence links.
- **Policy panel:** which rules Auto-Coach may apply and what requires approval.
- **Review controls:** accept, edit, hold, dismiss, and annotate.

The coach should not have to navigate five screens to see why the system suggested a regression.

### 6.4 Visual grammar

- Use a neutral background, one primary accent, one warning accent, and a restrained safety colour.
- Do not rely on red/green alone; pair colour with labels, icons, and text.
- Use consistent card anatomy: title, one-line interpretation, evidence chips, primary action, details drawer.
- Keep one dominant hierarchy per screen: today’s decision, this week’s pattern, or evidence review.
- Use typography and whitespace as the primary sophistication signal.
- Prefer small trend lines and plain-language labels over giant gauges.
- Use animation only for confirmation, not for constant “live” stimulation.
- Provide compact and comfortable density modes for coaches; preserve the same semantic hierarchy.
- Use stable locations for actions; the interface should not make the athlete hunt for “skip” or “undo.”
- Show absolute values with units where useful, but lead with interpretation.
- Make uncertainty visible but quiet: “medium confidence” is better than a dramatic warning banner.

### 6.5 Progressive disclosure

The first layer answers: “What should I do now?”

The second layer answers: “Why?”

The third layer answers: “What evidence and history support that?”

The fourth layer answers: “What policy and permissions made this action possible?”

This structure allows the app to be deeply evidence-led without making every athlete read a literature review before training.

### 6.6 Core components

| Component | Athlete-facing purpose | Coach-facing purpose |
|---|---|---|
| Today card | Start the intended session with low friction | See whether intent is clear and accepted |
| Recovery snapshot | Show two or three useful context signals | Inspect full signal provenance |
| Readiness context chip | Explain support / caution / uncertainty | See baseline deviation and conflicts |
| Progression ladder | Show the next approved step | Edit bounds and criteria |
| Regression plan | Make a fallback feel intentional | Approve equivalent variations and triggers |
| Intervention receipt | Build trust and enable undo | Audit what happened |
| Evidence drawer | Explain a recommendation without clutter | Review citation, population, dose, limits |
| Pattern card | “Three high-stress days preceded two hard-session misses” | Investigate the pattern and annotate it |
| Weekly ledger | Let the athlete see continuity | Compare plan, actual, recovery, and outcomes |
| Coach queue | Ask for help when needed | Focus attention on decisions rather than data collection |

## 7. Auto-Coach behavior and permissions

### 7.1 Operating modes

Retain the prior handoff’s ability to configure:

- **Manual:** system observes and records; coach/athlete decides.
- **Assisted:** system proposes; user confirms.
- **Auto-daily:** system may execute only low-consequence, reversible actions inside policy.
- **Auto-weekly:** system may prepare a draft weekly adjustment; coach or athlete confirms.
- **Shadow:** system generates internal recommendations for evaluation without changing the plan.
- **Paused:** system records but does not recommend or act.

Every athlete should know which mode is active.

### 7.2 Auto-eligible recommendation classes

With athlete opt-in and coach policy, Auto-Coach may:

- Suggest a sleep opportunity or short nap.
- Surface an existing fuelling or hydration plan.
- Offer a low-intensity movement option.
- Offer a brief relaxation/downshift.
- Hold a planned load or remove a small accessory amount within configured limits.
- Add rest between sets.
- Present a pre-approved alternative movement.
- Ask a single clarifying question when the data is contradictory.

### 7.3 Conditional recommendation classes

These should require explicit enablement, prior tolerance, and appropriate screening:

- Cold-water immersion.
- Contrast therapy.
- Sauna or heat exposure.
- Compression.
- Naps when sleep inertia or night-sleep disruption is a known issue.
- Aggressive session rescheduling.
- Fuelling or electrolyte targets that go beyond a coach-authored plan.

### 7.4 Coach-only or clinician-only classes

- Diagnosis or classification of injury, RED-S, overtraining, dehydration, or sleep disorder.
- Pain-provoking rehabilitation changes.
- Medication or supplement recommendations.
- Weight loss or calorie-deficit prescriptions.
- Return-to-sport clearance.
- Large changes to weekly volume, intensity, frequency, or competition plan.
- Ignoring an athlete’s explicit safety boundary.

### 7.5 Intervention receipts and undo

Every executed change must be easy to reverse and must state:

- what changed;
- why it changed;
- which signals were used;
- which signals were not sufficient;
- expected benefit and trade-off;
- authority and policy;
- duration/expiry;
- how the athlete or coach can undo it.

**[INFERRED]** “Undo” is not merely a convenience feature. It is a safety mechanism and a trust mechanism.

## 8. Onboarding and check-ins

### 8.1 Onboarding additions

Ask only what is needed to set safe boundaries and useful personalisation:

- Primary goal and sport/modality.
- Training age and normal weekly pattern.
- Session-intent vocabulary the athlete understands.
- Current injuries, pain, clinician restrictions, or return-to-training status.
- Sleep schedule, nap tolerance, and major barriers.
- Nutrition support preference, food constraints, and whether a coach/dietitian plan exists.
- Hydration/sweat context and hot-environment exposure.
- Preferred recovery methods and previous adverse responses.
- Comfort with wearables and data sharing.
- Auto-Coach mode and actions requiring confirmation.
- Communication preferences and coach escalation route.

Do not ask for an unnecessary medical history in the first minute. Stage sensitive questions and explain why they matter.

### 8.2 Daily minimum check-in

Keep the default path to roughly 30 seconds:

1. “Any pain or symptoms that change how you move?” yes / no / unsure.
2. Sleep: shorter / usual / longer, plus quality: poor / okay / good.
3. Energy: low / usual / high.
4. Stress: low / moderate / high.
5. “How confident are you in completing today’s intended session?” low / medium / high.

Optional context appears only when relevant: recent hard session, hot conditions, long session, missed meals, illness, travel, or conflicting wearable signal.

### 8.3 Event-based follow-ups

Ask more only after a meaningful trigger:

- A pain score rises or changes location.
- RPE or technical quality diverges from plan.
- Three or more days of poor sleep or high stress.
- A key session is missed.
- Hydration context is unusually hot or long.
- The athlete repeatedly skips a recovery intervention.

The app should ask the smallest question that can change the decision. “What is the main constraint today?” may be better than eight separate questions.

### 8.4 Accessibility and inclusion

- All semantic states must work without colour.
- Use plain language, large tap targets, keyboard and screen-reader support, and adequate contrast.
- Avoid assuming a conventional sleep schedule, food access, training environment, gender, body composition goal, or recovery modality.
- Make units and time zones explicit.
- Support athletes with disability, chronic conditions, neurodivergence, and variable work/family schedules through coach-configured policies.

## 9. Weekly review and outcome evaluation

### 9.1 Weekly recovery ledger

For each key session, show:

- intended goal and actual execution;
- sleep/stress/fuelling/hydration context;
- pain and soreness trajectory;
- subjective fatigue and objective performance;
- any progression/regression;
- recovery interventions tried;
- next 24–72-hour outcome;
- athlete’s own assessment of usefulness.

### 9.2 Intervention trial design

When an athlete opts into a recovery method, record an informal N-of-1 trial:

- reason for trying it;
- expected outcome category;
- dose/timing;
- context and comparison period;
- immediate response;
- next-day soreness/fatigue;
- next-session performance;
- adverse effect or opportunity cost;
- keep / change / stop decision.

**[GAP]** A single successful use does not prove causality. The product should use language such as “seemed useful in three similar sessions” rather than “this method works for you” until repeated evidence accumulates.

### 9.3 Metrics that matter

- Quality of key-session execution.
- Fewer avoidable high-fatigue or pain-provoked exposures.
- Better re-entry after missed sessions.
- Athlete-reported clarity and trust.
- Coach time saved per decision.
- Recommendation acceptance, edit, and undo rates.
- False alarms, missed escalations, and inappropriate confidence.
- Actual performance and symptom outcomes after adjustments.

Do not optimise only for streaks, daily opens, completed check-ins, or adherence. Those metrics can reward compulsive use and hide poor coaching decisions.

## 10. Product data and evidence architecture, without implementation code

The product should conceptually preserve the following objects:

- **Athlete profile:** goals, constraints, preferences, permissions, and safety boundaries.
- **Plan item:** planned session, intent, target, bounds, and coach rationale.
- **Actual exposure:** what was performed, including substitutions and interruptions.
- **Recovery observation:** sleep, pain, soreness, fatigue, stress, readiness expectation, fuelling, hydration, and context.
- **Performance observation:** load, reps, pace, power, velocity, RPE/RIR, technique, and test result.
- **Intervention proposal:** suggested recovery method or training adjustment with expected outcome and evidence boundary.
- **Intervention resolution:** accepted, edited, rejected, expired, or undone.
- **Policy:** coach/clinician permissions, thresholds, approved variants, and escalation rules.
- **Progression state:** current level, next gate, evidence required, and last successful exposure.
- **Regression state:** trigger, fallback, intent preserved, and re-entry criterion.
- **Pattern:** repeated within-athlete relationship with confidence and supporting observations.
- **Safety event:** symptom, escalation, acknowledgement, and human follow-up.
- **Evidence record:** source, population, modality, dose, outcome, limitation, evidence grade, and product use restriction.

Every record needs provenance, timestamp, version, and who/what changed it. Coach edits should be first-class events, not silent overrides.

## 11. Evaluation and testing plan

### 11.1 Safety fixtures

Before any autonomous feature is trusted, test scenarios such as:

- low sleep but normal performance;
- high soreness but stable performance;
- high stress and low sleep with rising RPE;
- high wearable readiness with new pain;
- low wearable readiness with excellent execution;
- missing data after a hard week;
- conflicting athlete and wearable signals;
- hot session with large fluid loss;
- cold exposure after a hypertrophy-focused session;
- missed session followed by a return attempt;
- persistent pain and a request to “push through”;
- athlete with a medical restriction and a request for electrolytes/sauna;
- athlete declining a mental-health or nutrition follow-up;
- coach policy that forbids automatic plan changes.

### 11.2 Evaluation measures

- Correct separation of soreness, fatigue, performance, readiness, and injury language.
- Appropriate abstention when data is missing or contradictory.
- Correct escalation for symptoms and medical boundaries.
- Agreement with coach-authored progression/regression policy.
- Number of unnecessary questions.
- Athlete understanding of “why.”
- Acceptance, edit, and undo behaviour.
- Improvement or preservation of key-session quality.
- False-positive rate for caution or safety messaging.
- False-negative rate for escalation.
- Trust and perceived autonomy, not only adherence.

### 11.3 Rollout recommendation

1. Evidence drawer and manual logging.
2. Shadow recommendations with no plan changes.
3. Assisted mode with athlete confirmation.
4. Auto-daily only for low-consequence, reversible suggestions.
5. Coach-reviewed weekly drafts.
6. Periodic policy audit and red-team testing.

## 12. Comprehensive product suggestions, ranked

This is the recommended product backlog for a highly sophisticated but visually simple coaching app.

### P0 — foundations that make the product trustworthy

1. **Goal-and-intent-first planning.** Every session must have a purpose before it has a load.
2. **Separate planned versus actual.** Never overwrite the plan with what happened.
3. **Typed recovery observations.** Sleep, pain, soreness, fatigue, stress, fuelling, hydration, and wearables remain distinct.
4. **Unknown and stale states.** Missing data should lower confidence, not silently become normal.
5. **Within-athlete baselines.** Use personal trends before population norms.
6. **Safety and symptom gate.** Pain trajectory and red flags outrank readiness signals.
7. **Coach policy layer.** Define what Auto-Coach may suggest, execute, or never touch.
8. **Reversible action system.** Every adjustment can be accepted, edited, rejected, or undone.
9. **Intervention receipts.** Make decisions inspectable by athlete and coach.
10. **Evidence record.** Store source, population, dose, expected outcome, limitations, and product restriction.
11. **Minimal daily check-in.** Five simple inputs with event-based follow-ups.
12. **Weekly decision queue.** Surface only unresolved, high-value decisions.
13. **Coach notes as first-class evidence.** The expert’s contextual judgement should not disappear into a comment field.
14. **Immutable history with visible versioning.** Preserve why the plan changed.
15. **Data-quality indicators.** Distinguish sensor error, missing entry, athlete decline, and true change.

### P1 — sophisticated coaching intelligence that stays bounded

16. **Progression ladder.** Show current level, next gate, and exact evidence needed to progress.
17. **Regression ladder.** Pre-author equivalent alternatives that preserve session intent.
18. **One-axis progression rule.** Keep load, volume, density, complexity, and frequency changes attributable.
19. **Session-quality guardrails.** Use RPE/RIR, velocity, pace, technical quality, and completion rather than readiness alone.
20. **Soreness-performance split.** Let the athlete say “sore but capable” or “not sore but underperforming.”
21. **Recovery intervention library.** Group methods by goal: sleep, fuel, hydrate, downshift, move, comfort, short-turnaround performance.
22. **Goal-aware modality trade-offs.** Explain when cold may conflict with hypertrophy or when heat is relevant to endurance acclimation.
23. **Context engine.** Consider heat, travel, competition density, work, study, and life stress.
24. **Re-entry protocol.** Treat missed sessions and illness recovery as a distinct state.
25. **Pattern cards.** Show repeated relationships with cautious language and supporting dates.
26. **N-of-1 intervention log.** Let the athlete learn what works for them without pretending to run a clinical trial.
27. **Contradiction handler.** Ask one targeted question when subjective and objective signals diverge.
28. **Readiness as a session-specific statement.** “Likely able to complete easy aerobic work” is better than a universal score.
29. **Shadow mode.** Let coaches compare Auto-Coach proposals with their own decisions before enabling autonomy.
30. **Policy simulator.** Preview how a new rule would behave on recent historical weeks before activating it.

### P1 — coach experience

31. **Single-screen weekly ledger.** Plan, actual, context, adjustment, and outcome in one timeline.
32. **Decision queue prioritisation.** Sort by safety, key-session impact, uncertainty, and time sensitivity.
33. **Bulk review with individual exceptions.** Coaches can scan a roster but open deep context only where needed.
34. **Athlete comparison by pattern, not ranking.** Compare each athlete with their own baseline; avoid public recovery leaderboards.
35. **Coach-authored templates.** Approved regressions, fuelling reminders, sleep prompts, and modality policies should be reusable.
36. **Permission matrix.** Coach, assistant, athlete, clinician, and Auto-Coach actions are explicit.
37. **Escalation inbox.** Persistent pain, safety events, red flags, and unresolved conflicts have clear ownership.
38. **Evidence-at-the-point-of-decision.** Open the relevant source beside the rule, not in a separate research silo.
39. **Annotation and rationale.** Coaches can explain an exception so the system does not learn the wrong pattern from it.
40. **Exportable handoff.** Preserve a readable summary for clinician, coach, athlete, and future system migration.

### P1 — athlete experience

41. **Today-first home.** One primary action and one clear fallback.
42. **“Why this?” drawer.** Show the two or three facts behind the suggestion.
43. **“Not relevant” and “skip” controls.** Reduce unnecessary friction and protect autonomy.
44. **Comfortable, compact check-in.** No interrogation after every session.
45. **Plain-language recovery menu.** “Sleep,” “fuel,” “hydrate,” “move,” “downshift,” and “comfort” are clearer than a modality catalogue.
46. **Progression celebration without pressure.** Celebrate quality and consistency, not only heavier loads.
47. **Regression as a smart option.** Frame a fallback as a way to preserve the goal, not as failure.
48. **Visible expiry.** Every temporary adjustment says when it ends.
49. **Privacy controls.** Athletes choose what coaches see for sensitive stress, sleep, nutrition, or health data.
50. **Low-stimulation mode.** Useful for injured, stressed, or cognitively overloaded athletes.

### P2 — advanced differentiation

51. **Goal-specific recovery policies.** Tournament turnaround, hypertrophy block, heat acclimation, taper, return-to-training, and general wellbeing should not share one rule set.
52. **Wearable reliability layer.** Track device source, missingness, sleep-estimation uncertainty, and baseline drift.
53. **Environment-aware planner.** Use local heat, travel, altitude, and schedule context when available and consented.
54. **Competition congestion planner.** Protect high-value exposures and recommend only interventions with a relevant short-turnaround goal.
55. **Adaptive question budget.** Ask more only when the expected decision value justifies the burden.
56. **Evidence change log.** When a recommendation changes because a source or policy changed, show that history.
57. **Coach disagreement analytics.** Compare Auto-Coach proposals with coach edits to identify missing policy, not to score the coach.
58. **Anomaly review.** Detect repeated mismatches between high readiness and poor execution, or low readiness and good execution.
59. **Training-intent confidence.** If the athlete or coach has not clearly specified the purpose, ask before altering the session.
60. **Care-team handoff view.** Export a concise timeline with symptoms, load, changes, and outcomes without exposing irrelevant private data.

### P2 — visual simplicity safeguards

61. Cap the primary athlete screen at one dominant decision, three supporting facts, and three optional tools.
62. Use a consistent two-level card hierarchy; details open in a drawer or sheet.
63. Avoid dashboard tiles that have no decision attached.
64. Keep colour semantic and rare; use text labels for all states.
65. Use calm empty states: “No concern recorded” rather than an empty graph.
66. Do not animate scores or use urgency effects to increase engagement.
67. Prefer trend arrows and short labels to precision-heavy decimal values.
68. Keep the same component anatomy across athlete and coach surfaces.
69. Provide one-tap undo and a visible activity history.
70. Make advanced settings discoverable but not prominent for athletes who do not need them.

## Counterpoints / Challenges

### 1. Evidence quality is uneven

Recovery research often uses small samples, different protocols, short follow-up, and subjective endpoints. A polished evidence drawer can create false authority if it hides those limitations. Every source display needs population, modality, outcome, and limitation.

### 2. Soreness is easy to measure and easy to misuse

Athletes understand a soreness number, so products are tempted to make it the main recovery signal. The app must repeatedly separate soreness from performance and injury. A sore athlete may be safe and capable; a non-sore athlete may still be under-recovered.

### 3. Readiness is useful only when contextual

A daily score may be convenient but can become a self-fulfilling prophecy. Use the score, if retained at all, as a compact summary with source, confidence, and override—not as an instruction.

### 4. More data can reduce coaching quality

If every metric generates a question, athletes will either stop responding or answer without thought. Adaptive question budgets and event-based follow-up are essential.

### 5. Recovery tools can conflict with the goal

Cold may help short-term soreness while being undesirable as a routine after hypertrophy work. Heat may be valuable for heat acclimation but hazardous after dehydration. “Advanced recovery” is not a goal category.

### 6. Nutrition and mental-health features can become overreaching

The product must support plans and escalation, not diagnose, moralise, or treat. This is both a safety requirement and a trust requirement.

### 7. Automatic regression can feel like loss of agency

The athlete should see the preserved intent, the temporary nature, and the ability to accept or edit. The system should ask rather than silently downgrade a valued session unless a configured safety stop applies.

### 8. Simplicity may hide too much

Progressive disclosure must not become opaque automation. The athlete and coach should always be able to open the evidence chain, policy, and history.

### 9. Autoregulation is not autonomous periodisation

Evidence supports bounded autoregulation in some strength contexts. It does not establish that a general-purpose model should rewrite a training week from wearables, sleep, and mood.

### 10. Injury risk cannot be solved by a recovery feature

Load management, technical coaching, medical assessment, environment, equipment, previous injury, and behaviour all matter. The app should detect and escalate concerns; it should not sell injury prevention as a recovery modality.

## Actionable Next Steps

### Recommended build order for the product team

1. **Lock the evidence and safety language.** Create a shared glossary for soreness, fatigue, performance, readiness, symptom, safety stop, and adaptation.
2. **Define the typed objects and provenance rules.** Keep planned, actual, observation, intervention, resolution, and policy separate.
3. **Write coach policy templates.** Configure bounds for holds, small regressions, approved alternatives, and escalation.
4. **Design the Today screen and coach decision queue.** Validate the one-action, three-facts visual rule before adding advanced charts.
5. **Implement the minimal check-in conceptually.** Start with pain/symptoms, sleep, energy, stress, and session confidence.
6. **Create the progression/regression ladder.** Use session intent, quality criteria, one-axis progressions, and temporary fallbacks.
7. **Add intervention receipts and undo.** No autonomous action without attribution and expiry.
8. **Build the evidence drawer.** Every recovery method must display outcome type, population, dose, evidence strength, and limitation.
9. **Run shadow mode on historical weeks.** Compare system suggestions with coach decisions and look for false confidence.
10. **Pilot with a small coach/athlete group.** Measure clarity, trust, question burden, inappropriate suggestions, and key-session quality.
11. **Add optional modalities only after the foundation works.** Start with sleep opportunity, fuelling reminders, easy movement, mobility tied to a goal, and downshift.
12. **Gate heat, cold, contrast, compression, and specialised nutrition behind policy.** Treat them as optional modules, not core recovery requirements.
13. **Audit the visual hierarchy.** Remove any screen element that does not lead to a decision or meaningful understanding.
14. **Create a safety review cadence.** Review new evidence, coach exceptions, adverse events, and false-negative escalations.

### Immediate Claude build brief

When the downstream product-building Claude begins, it should first produce:

- a screen and state inventory;
- the athlete Today flow;
- the coach weekly ledger and decision queue;
- a recovery observation taxonomy;
- the progression/regression permission matrix;
- the evidence drawer anatomy;
- the intervention receipt and undo flow;
- representative edge-case fixtures;
- a visual system with calm density and accessibility rules.

It should not begin by building a giant recovery dashboard or autonomous weekly planner.

## Appendix A — source index and product use

The following sources are the core evidence set for this extension. Direct PubMed links are provided so a reviewer can verify population, protocol, outcome, and limitations before turning a claim into product policy.

| Area | Source | Product use |
|---|---|---|
| Broad recovery methods | Dupuy et al., 2018, PubMed 29755363 | High-level comparison of massage, immersion, active recovery, compression, and DOMS/fatigue outcomes; separate soreness from performance. |
| Sleep and performance | Fullagar et al., 2015, PubMed 25315456 | Sleep-loss performance/cognition context. |
| Athlete sleep consensus | Walsh et al., 2021, PubMed 33144349 | Individualised sleep assessment and sleep-toolbox framing. |
| Naps | Souabni et al., 2021, PubMed 34043185 | Nap opportunity and sleep-inertia logic. |
| Sleep and injury | Dobrosielski et al., 2021, PubMed 33560506; Goldberg et al., 2025, PubMed 41239840 | Mixed/observational injury boundary; no universal prediction. |
| Protein and muscle damage | Pearson et al., 2023, PubMed 36513777; Pasiakos et al., 2014, PubMed 24435468 | Acute recovery claims should remain modest. |
| Protein and adaptation | Morton et al., 2018, PubMed 28698222 | Daily/prolonged resistance adaptation context. |
| Carbohydrate recovery | Gonzalez et al., 2021, PubMed 33973552; Craven et al., 2021, PubMed 33507402; Henselmans et al., 2022, PubMed 35215506 | Short-turnaround glycogen and session-context logic. |
| Low energy availability / RED-S | Logue et al., 2020, PubMed 32245088; Mountjoy et al., 2019, PubMed 30632422; IOC consensus, PubMed 37752011 | Human review and non-diagnostic nutrition safeguards. |
| Hydration | Sawka et al., 2007, PubMed 17277604; McDermott et al., 2017, PubMed 28985128 | Avoid both under- and over-replacement; individualise. |
| Rehydration sodium | Maughan et al., 1995, PubMed 8549573; Ly et al., 2023, PubMed 38004153 | Context-specific sodium/retention suggestions only. |
| Exercise-associated hyponatraemia | PubMed 28316971; PubMed 32097926 | Safety language; never force fluids. |
| Active recovery | Ortiz et al., 2019, PubMed 29742750 | 6–10-minute optional low-intensity trial; no lactate promise. |
| Post-exercise stretching | Afonso et al., 2021, PubMed 34025459 | No generic stretching-as-recovery claim. |
| Stretching and soreness | Herbert et al., 2011, PubMed 21735398 | Very small soreness effect. |
| Acute stretching | Behm et al., 2016, PubMed 26642915 | Mobility/warm-up distinction. |
| Sports massage | Davis et al., 2020, PubMed 32426160 | Small DOMS/flexibility benefit; no reliable performance effect. |
| Foam rolling | Wiewelhove et al., 2019, PubMed 31024339; Cheatham et al., 2015, PubMed 26618062 | Short-term ROM/comfort; no tissue-healing claims. |
| Compression | Brown et al., 2017, PubMed 28434152; French et al., 2008, PubMed 18580411 | Small/conditional benefit; fit and safety. |
| Cold-water immersion | Poppendieck et al., 2013, PubMed 23434565; Bleakley et al., 2012, PubMed 22336838; Moore et al., 2023, PubMed 36527593 | Short-turnaround soreness/performance; goal-dependent use. |
| Cold and adaptation | Roberts et al., 2015, PubMed 26174323; Fyfe et al., 2019, PubMed 31513450; Grgic et al., 2023, PubMed 35068365 | Do not routine-use after hypertrophy without explaining trade-off. |
| Heat / sauna | Scoon et al., 2007, PubMed 16877041; Kirby et al., 2021, PubMed 33211153 | Endurance/heat-acclimation context; small studies. |
| Sauna safety | Laukkanen et al., 2019, PubMed 31102597 | Dehydration, cardiovascular, alcohol, and hypotension guardrails. |
| Passive heat evidence | Hamaya et al., 2025, PubMed 41049507 | Avoid overclaiming general health/recovery effects. |
| Contrast therapy | Bieuzen et al., 2013, PubMed 23626806; French et al., 2008, PubMed 18580411 | Heterogeneous, optional soreness tool. |
| Mindfulness / meditation | Goyal et al., 2014, PubMed 24395196; Pascoe et al., 2017, PubMed 28863392 | Stress/downshift support, not therapy or performance guarantee. |
| Slow breathing | Laborde et al., 2022, PubMed 35623448; Birdee et al., 2023, PubMed 36871835 | Gentle optional downshift. |
| Athlete mindfulness | Si et al., 2024, PubMed 38939219 | Emerging athlete-specific evidence; remain modest. |
| Psychological stress and recovery | Stults-Kolehmainen & Bartholomew, 2012, PubMed 22688829; Stults-Kolehmainen et al., 2014, PubMed 24343323 | Stress as context/modifier, not diagnosis. |
| Athlete monitoring | Saw et al., 2016, PubMed 26423706; Halson, 2014, PubMed 25200666; Coyne et al., 2018, PubMed 30570718 | Multivariate, subjective, within-person monitoring. |
| Daily athlete surveys | Pexa et al., 2025, PubMed 39947188 | Short check-ins; stress/sleep more useful than readiness alone. |
| Recovery microcycles | Sousa et al., 2024, PubMed 38689583; Morán-Navarro et al., 2017, PubMed 28965198 | Rest and recovery-demand rules. |
| Short training cessation | Travis et al., 2022, PubMed 35180185; Mujika & Padilla, 2000, PubMed 10966148 | Re-entry and detraining context. |
| Autoregulation | Zhang et al., 2021, PubMed 33776802; PubMed 35038063 | Bounded autoregulation; no autonomous rewrite. |
| Velocity loss | Pareja-Blanco et al., 2017, PubMed 27038416 | Fatigue caps and quality-preserving regression. |
| Failure training | Grgic et al., 2022, PubMed 33497853 | Failure is optional; recovery cost matters. |
| Periodisation | Lundberg et al., 2022, PubMed 35044672 | Goal- and athlete-specific progression blocks. |
| Frequency | Schoenfeld et al., 2016, PubMed 27102172; Grgic et al., 2018, PubMed 29470825; Cuthbert et al., 2021, PubMed 33886099 | Volume and schedule context. |
| Training load / injury | Andrade et al., 2020, PubMed 32572824; Hulin et al., 2016, PubMed 26511006; Eckard et al., 2018, PubMed 29943231 | Context/anomaly detection; no single-risk score. |
| Return to sport | Ardern et al., 2016, PubMed 27226389 | Continuum and risk-management model; clinician/coach authority. |
| Pain-monitoring model | Silbernagel et al., 2007, PubMed 17307888 | Only under an explicit clinician-authored policy. |

## Appendix B — final product rules to preserve

1. Soreness reduction is not proof of performance recovery.
2. Performance recovery is not proof of tissue healing.
3. A wearable readiness signal is not a diagnosis.
4. Low energy availability cannot be diagnosed from one metric.
5. Hydration advice must not create hyponatraemia risk.
6. Cold, heat, compression, and contrast are goal- and context-dependent.
7. Rest and regression preserve training intent; they are not punishments.
8. Progress one primary axis at a time.
9. Missing data reduces confidence.
10. Auto-Coach acts only within transparent, reversible, coach-approved boundaries.
11. Any symptom, medical, mental-health, or return-to-sport concern requires appropriate human escalation.
12. The interface shows one decision first and the evidence chain second.

**End of additive extension.**
