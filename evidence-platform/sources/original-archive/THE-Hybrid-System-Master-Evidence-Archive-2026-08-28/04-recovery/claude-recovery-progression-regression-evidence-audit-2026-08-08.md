# Research-only evidence audit: recovery, progression, regression, readiness, and load-management claims

**Date:** 8 August 2026  
**Status:** Research-only evidence and product-boundary brief; no code  
**Audience:** Product, coaching, clinical-safety, research, and design teams  
**Relationship to prior work:** Addendum to the preserved coaching-platform, onboarding/check-in, week-in-review, and recovery/progression/regression handoffs. Existing files remain intact and are not replaced by this document.

## High-Level Overview

### Executive verdict

The evidence supports a sophisticated coaching product that does four things well:

1. collects a small amount of high-value context;
2. compares an athlete with their own recent history;
3. offers bounded, explainable options for the next training exposure; and
4. routes pain, illness, uncertainty, and return-to-sport decisions to the appropriate human.

The evidence does **not** support a universal readiness oracle, an injury-probability calculator, a fixed percentage progression law, a mandatory deload calendar, or a single HRV threshold that safely determines training for every athlete.

The central product position should be:

> **Use evidence to constrain choices, not to pretend that individual training decisions are more precise than the evidence allows.**

### Six decisions that should be locked into the product brief

| Decision | Evidence audit conclusion | Product status |
|---|---|---|
| Recovery | Recovery is multidimensional and individual. Subjective wellness, sleep, load, symptoms, stress, and actual performance should be interpreted together. | State as fact; use a configurable monitoring policy |
| Progression | Progression can change load, repetitions, sets, range, density, complexity, frequency, or exercise selection. No single dimension or percentage is universally superior. | Configurable heuristic |
| Regression | A regression is a dose or task adjustment that preserves the training intent where possible. It is not a failure state and is not the same as injury management. | State as product policy; clinician-owned when injury/illness is involved |
| Deload | Deloading is widely practiced but directly studied far less than its popularity suggests. A one-week break did not improve hypertrophy in the first direct study and may have reduced some strength outcomes. | Configurable coach policy; not a fact or automatic threshold |
| HRV/readiness | HRV-guided training has mixed, mostly endurance-specific findings. Device validity, baseline choice, metric, athlete state, and protocol matter. | Configurable heuristic; never a universal cutoff |
| Injury prediction | Screening scores, acute:chronic workload ratios, and percentage rules do not justify individual injury predictions or “safe zones.” | Do not claim; show context and route uncertainty |

### Product claim classes

This audit uses three user-facing claim classes, plus a safety lane:

- **State as fact:** A narrow statement is sufficiently supported for the named population, outcome, and time horizon. The app must still avoid broadening it beyond the evidence.
- **Configurable heuristic:** A practical rule may be useful, but evidence does not establish it as universal. It must be coach-configurable, visible, reversible, and labeled as a policy or estimate.
- **Unknown:** Evidence is absent, indirect, contradictory, too imprecise, or too population-specific for the product to present the claim as established. The app should say what is unknown and ask for human review where appropriate.
- **Safety/clinician lane:** The product may record, display, enforce, or route an approved protocol, but must not diagnose, prescribe medical care, or silently invent a return-to-training rule.

### Highest-priority conclusions for the final product brief

1. **Do not ship “recovered,” “safe,” or “injury risk” as a single-number truth.** A status card may summarize context, but the components, data age, missingness, and action boundary must remain visible.
2. **Do not ship universal percentage rules.** The ACSM 2–10% increase is a practical resistance-training prescription under a specific performance condition, not a biological law. The 10% weekly running rule is not validated as a universal injury-prevention threshold.
3. **Do not make deloading calendar-driven by default.** The product may offer coach-authored deload templates, but timing and dose must remain policy choices rather than claims about a universal physiological threshold.
4. **Do not turn HRV into a binary gate.** HRV may be one input to an individualized endurance-training protocol after data-quality and baseline checks. It should not cause automatic progressions or provide medical reassurance.
5. **Do not use ACWR, “sweet spots,” or screening scores to predict individual injury.** The product may show a recent-versus-usual load change as a descriptive context signal and pair it with symptom/performance review.
6. **Separate acute relief from long-term adaptation.** Massage, compression, immersion, and cold may alter soreness or perceived fatigue; repeated cold-water immersion after resistance training may attenuate some adaptations. Heat evidence for general post-exercise recovery remains mixed and conditional.

## Deep Dive Analysis

## 1. Evidence-quality framework for coaching claims

### 1.1 Audit every claim as a decision, not as a topic

“Recovery,” “progression,” and “readiness” are not claims. A claim becomes auditable only when it specifies:

| Field | Required question |
|---|---|
| Population | Who was studied: healthy adults, trained athletes, clinical patients, adolescents, older adults, women, or a specific sport? |
| Exposure/intervention | What exactly was done, at what dose, timing, frequency, and duration? |
| Comparator | Compared with what: passive rest, usual training, another protocol, or no intervention? |
| Outcome | What changed: soreness, force, hypertrophy, performance, injury incidence, sleep, symptoms, or a surrogate marker? |
| Horizon | Was the result acute, next-day, several weeks, or long-term adaptation? |
| Decision | What would the app do differently if the result were true? |
| Uncertainty | What would make the claim fail: missing data, device error, population mismatch, contradiction, or a red flag? |
| Authority | Can Auto-Coached act, must the coach approve, or must a clinician assess? |

For example, “cold improves recovery” fails the audit because it does not identify whether recovery means soreness two hours later, next-day power, muscle protein synthesis, hypertrophy, endurance adaptation, or return from an injury. The product should not use vague intervention language where the evidence only supports a narrow outcome.

### 1.2 Source hierarchy

Use a source hierarchy, but do not confuse publication type with certainty.

| Tier | Source type | What it is good for | Main limitation |
|---|---|---|---|
| A | Relevant consensus statement, clinical practice guideline, umbrella review, or convergent meta-analyses | Definitions, safety boundaries, broad patterns, implementation principles | Consensus is not a substitute for direct intervention evidence |
| B | Systematic review/meta-analysis of RCTs or several relevant RCTs | Causal effects for a defined intervention and population | Heterogeneity, small samples, surrogate outcomes, short follow-up |
| C | Single RCT, prospective cohort, validation study, or well-designed applied study | Specific protocol, measurement behavior, or population signal | Limited generalizability and precision |
| D | Retrospective association, mechanistic study, expert practice, survey, narrative opinion | Hypothesis generation, workflow design, description of what practitioners do | Not enough to support a universal causal or safety claim |

### 1.3 Audit grade used in this document

This is an internal product audit grade, not a formal GRADE assessment of every source:

- **A — high/direct anchor:** strong consensus or convergent evidence for a narrow statement, with acceptable directness to the product decision.
- **B — moderate/conditional:** useful evidence, but bounded by population, protocol, outcome, sample size, or heterogeneity.
- **C — limited:** single study, small sample, indirect outcome, observational evidence, or validation that does not establish an action threshold.
- **D — practice signal only:** survey, theoretical model, coach practice, or mechanistic rationale.
- **U — unknown/unvalidated:** evidence does not support a product-level claim or threshold.

An A-grade source can still support only a narrow statement. For example, a consensus statement can justify “monitor recovery multidimensionally,” but it cannot validate a specific readiness score or an automatic deload trigger.

### 1.4 Conditions for “state as fact”

The product should state a claim as fact only when all of the following are true:

- the wording matches the studied population and intervention;
- the outcome is meaningful for the intended decision, not only a surrogate;
- the finding is reasonably consistent or the uncertainty is made explicit;
- there is no material safety contradiction;
- the statement does not imply diagnosis, certainty, or causality beyond the source;
- the app can explain what it observed and what it did not observe.

If any of these fail, downgrade to a configurable heuristic or unknown.

### 1.5 Evidence provenance should be a product object

Every high-impact rule should carry:

- claim ID and literal wording;
- source IDs, PMID, DOI, and access link;
- evidence grade and last review date;
- studied population and exclusions;
- outcome and time horizon;
- product status: fact, heuristic, unknown, or clinician-owned;
- action owner and approval scope;
- known contradictions and unresolved gaps;
- version history and retirement reason.

This lets a coach inspect “why this rule exists” without asking the athlete to read a literature review. It also prevents a source about acute soreness from silently becoming a rule about long-term hypertrophy.

## 2. Recovery: what is supported and what is not

### 2.1 Recovery is a multidimensional monitoring problem

The recovery consensus literature recommends balancing training and competition stress with recovery resources, while recognizing substantial inter- and intra-individual variability. Monitoring should combine practical measures across biological, psychological, social, subjective, and performance domains rather than rely on one definitive fatigue marker. ([Kellmann et al., PMID 29345524](https://pubmed.ncbi.nlm.nih.gov/29345524/); [Heidari et al., PMID 29543069](https://pubmed.ncbi.nlm.nih.gov/29543069/); [Halson, PMID 25200666](https://pubmed.ncbi.nlm.nih.gov/25200666/))

The 2026 multidimensional monitoring framework is particularly relevant to product design: it separates assessment from monitoring and emphasizes individual baselines, measurement error, smallest worthwhile change, and decision support rather than a standalone performance determinant. ([Rebelo et al., PMID 41824225](https://pubmed.ncbi.nlm.nih.gov/41824225/); [DOI](https://doi.org/10.1007/s40279-026-02417-4))

**Product statement:** “We use several signals to understand how today may fit your recent training and life context.” — **State as fact.**

**Product must not state:** “Your score proves you are recovered,” “your body is ready,” or “you are not at risk.” — **Unknown/unsafe.**

### 2.2 Subjective wellness is useful, but not a truth detector

A systematic review found subjective self-reported measures often showed greater sensitivity and consistency to training load than commonly used objective measures. That finding supports collecting athlete voice; it does not prove that subjective reports are always more accurate than objective data. ([Saw et al., PMID 26423706](https://pubmed.ncbi.nlm.nih.gov/26423706/); [DOI](https://doi.org/10.1136/bjsports-2015-094758))

**Product implications:**

- keep a small stable check-in set: sleep, energy, soreness, pain, stress, and perceived readiness;
- allow “not sure” and “prefer not to answer”;
- preserve the exact response and timestamp;
- interpret changes against the athlete’s own repeated baseline, not a population norm;
- treat missingness as unknown, not as a positive result;
- ask a short follow-up only when it can change the decision;
- let the athlete correct the app’s interpretation.

### 2.3 Sleep: high relevance, no universal hour threshold

Sleep loss often harms sport-specific and cognitive performance, but effects vary by task and protocol. The athlete-sleep consensus specifically cautions against forcing a universal “7–9 hours” target on every athlete and recommends individualizing sleep need and perceived sleep quality. ([Fullagar et al., PMID 25315456](https://pubmed.ncbi.nlm.nih.gov/25315456/); [Walsh et al., PMID 33144349](https://pubmed.ncbi.nlm.nih.gov/33144349/); [Bonnar et al., PMID 29352373](https://pubmed.ncbi.nlm.nih.gov/29352373/))

Sleep extension studies are encouraging but population-specific. For example, a small study in 11 male collegiate basketball players reported improvements in sprint, shooting, and mood measures after sleep extension; it should not become a universal promise for every athlete or sleep device. ([Mah et al., PMID 21731144](https://pubmed.ncbi.nlm.nih.gov/21731144/))

**State as fact:** Adequate, individualized sleep opportunity supports recovery and performance.  
**Configurable heuristic:** Flag a persistent personal deviation from baseline and offer a lower-demand option.  
**Unknown:** A single sleep-duration cutoff that determines whether an athlete should train.

### 2.4 Food, carbohydrate, protein, hydration, and RED-S boundaries

When recovery time is short, carbohydrate and fluid support subsequent performance; the exact need depends on exercise duration, intensity, sweat loss, time between sessions, and the athlete’s goals. Protein may be relevant to muscle repair and adaptation, but “protein timing fixes recovery” is too broad. ([McCartney et al., PMID 29098657](https://pubmed.ncbi.nlm.nih.gov/29098657/); [Nunes et al., PMID 35187864](https://pubmed.ncbi.nlm.nih.gov/35187864/))

The IOC RED-S consensus makes the safety boundary clear: an app must not diagnose relative energy deficiency or infer an endocrine, menstrual, bone, metabolic, or psychological disorder from check-in data. It may educate, identify a pattern worth discussing, and route to a qualified professional. ([Mountjoy et al., PMID 37752011](https://pubmed.ncbi.nlm.nih.gov/37752011/))

**Product stance:** general recovery education is permitted; individualized nutrition prescriptions, eating-disorder-sensitive interventions, and RED-S interpretation are clinician- or dietitian-owned.

### 2.5 Active recovery, massage, compression, and immersion

A systematic review with meta-analysis found reductions in DOMS across several post-exercise recovery methods, including active recovery, massage, compression, immersion, contrast water therapy, and cryotherapy. Massage showed comparatively strong effects for DOMS and perceived fatigue in that review. The evidence is heterogeneous and primarily concerns short-term symptoms or surrogate markers. ([Dupuy et al., PMID 29755363](https://pubmed.ncbi.nlm.nih.gov/29755363/); [DOI](https://doi.org/10.3389/fphys.2018.00403))

Active recovery findings are also mixed: brief low-intensity movement may help in some contexts, while the optimal intensity and its effect on meaningful subsequent performance remain unclear. Lactate reduction should not be used as a proxy for “clearing fatigue.” ([Ortiz et al., PMID 29742750](https://pubmed.ncbi.nlm.nih.gov/29742750/))

**Safe product language:**

- “This option may reduce soreness or help you feel better after this session.”
- “Choose it if it is comfortable and fits your goal.”
- “Feeling better does not prove that tissue adaptation or injury healing is faster.”

**Avoid:** “flushes toxins,” “repairs muscle,” “prevents injury,” or “guarantees faster recovery.”

### 2.6 Cold-water immersion: context-dependent, not a default recovery command

The strongest product distinction is between acute symptom relief and long-term resistance-training adaptation:

- Acute systematic reviews generally find that cold-water immersion can improve some post-exercise soreness or perceived recovery outcomes, with effects varying by comparator, timing, and outcome. ([Moore et al., PMID 36527593](https://pubmed.ncbi.nlm.nih.gov/36527593/); [Moore et al., PMID 35157264](https://pubmed.ncbi.nlm.nih.gov/35157264/))
- Repeated cold-water immersion after resistance training attenuated anabolic signaling and some long-term muscle adaptations in a controlled study. ([Roberts et al., PMID 26174323](https://pubmed.ncbi.nlm.nih.gov/26174323/); [DOI](https://doi.org/10.1113/JP270570))
- A systematic review/meta-analysis found a small overall attenuation of strength gains in the included studies, with mostly male participants and protocol-specific findings. ([Grgic et al., PMID 35068365](https://pubmed.ncbi.nlm.nih.gov/35068365/))
- Another review found regular cold-water immersion may be detrimental to resistance adaptations but did not show a clear endurance effect; the evidence base was small. ([Malta et al., PMID 33146851](https://pubmed.ncbi.nlm.nih.gov/33146851/))

**Product decision:** offer cold as an optional, goal-labeled tool for short-term soreness/perceived recovery; warn that frequent immediate use around a hypertrophy/strength block may conflict with the adaptation goal. Do not ban it universally and do not recommend it automatically after every hard session.

### 2.7 Heat: useful hypotheses, mixed general recovery evidence

A 2025 systematic review of post-exercise heat exposure included only 14 studies and 194 participants. Acute results were mixed, while some chronic evidence suggested potential benefits for running performance in hot conditions; the review did not establish a general post-exercise recovery benefit, and evidence quality was low to moderate. ([Ahokas et al., PMID 41032138](https://pubmed.ncbi.nlm.nih.gov/41032138/); [DOI](https://doi.org/10.1186/s40798-025-00910-0))

Passive heating before bed has a more specific sleep claim: warm shower or bath protocols around 40–42.5 °C, typically 1–2 hours before bedtime, may reduce sleep-onset latency and improve sleep efficiency. That is a sleep-support claim, not proof of muscle repair or faster injury healing. ([Haghayegh et al., PMID 31102877](https://pubmed.ncbi.nlm.nih.gov/31102877/); [DOI](https://doi.org/10.1016/j.smrv.2019.04.008))

**Product status:** heat for general recovery is **unknown/conditional**; heat as an optional sleep-support routine is a **narrow fact plus configurable heuristic**, subject to safety screening and user preference.

### 2.8 Stretching and recovery claims

Post-exercise stretching has not shown a robust meaningful effect on short-term or delayed recovery, soreness, or strength in the relevant systematic reviews. It can remain an athlete-preferred mobility or relaxation option, but it should not be marketed as a DOMS or injury-prevention guarantee. ([Afonso et al., PMID 34025459](https://pubmed.ncbi.nlm.nih.gov/34025459/); [Herbert et al., PMID 21735398](https://pubmed.ncbi.nlm.nih.gov/21735398/))

## 3. Progression: what can change and how to avoid universal rules

### 3.1 Progression is multi-dimensional

The product should treat progression as a change in a defined training dose or task demand, not synonymous with adding weight.

| Progression dimension | Examples | What the app should preserve |
|---|---|---|
| External load | More kg, resistance, grade, or carried load | Movement intent and technical constraint |
| Repetitions/time | More reps, longer interval, longer work bout | Target effort and quality |
| Sets/volume | More sets or total work | Recovery budget and weekly distribution |
| Frequency | More exposures per week | Spacing and life constraints |
| Density | Same work with shorter rest | Intended metabolic/conditioning demand |
| Range of motion | Larger controlled range | Symptoms, control, and exercise purpose |
| Velocity/power | Faster concentric intent or higher output | Technique and safety; measurement quality |
| Complexity | More unstable, coordinated, or sport-specific task | Skill readiness and supervision |
| Exercise selection | A more demanding variation | Pattern, tissue tolerance, and goal |
| Environment | Heat, altitude, surface, equipment, competition context | Contextual load and risk review |

Changing several dimensions at once makes the dose hard to interpret. The default product policy should be **one primary progression lever at a time**, unless a coach-authored plan intentionally couples them.

### 3.2 What resistance-training evidence actually supports

The 2026 ACSM overview of reviews synthesized 137 systematic reviews and more than 30,000 participants. It supports the broad effectiveness of resistance training, but found that relatively few prescription variables consistently determine adaptation across healthy adults. Narrow findings include heavier loading for strength, adequate weekly volume for hypertrophy, and lower-to-moderate loads with explosive intent for power. Failure, equipment, complexity, set structure, time under tension, blood-flow restriction, and periodization were not consistently decisive across outcomes. ([Currier et al., PMID 41843416](https://pubmed.ncbi.nlm.nih.gov/41843416/); [DOI](https://doi.org/10.1249/MSS.0000000000003897))

The product should therefore support goal-specific progression rather than a universal “add load every session” rule.

### 3.3 The ACSM 2–10% rule: useful heuristic, not universal law

The ACSM progression position stand recommends a practical 2–10% load increase when an athlete can perform the current workload for one to two repetitions above the desired target. ([Ratamess et al., PMID 19204579](https://pubmed.ncbi.nlm.nih.gov/19204579/); [DOI](https://doi.org/10.1249/MSS.0b013e3181915670))

The product must represent this accurately:

- **Fact:** this is an established practical prescription in a resistance-training position stand.
- **Heuristic:** the exact increase should be coach-configurable by exercise, athlete, goal, equipment, and observed response.
- **Unknown:** a universal 2%, 5%, or 10% increase that is optimal or safe for every person, movement, sport, or rehabilitation context.

Recommended UI language: “You met the coach’s progression condition. The next approved step is +2–5% for this exercise.” Avoid: “Science says your body requires a 5% increase.”

### 3.4 Load, failure, volume, frequency, and autoregulation

Key evidence boundaries:

- Low, moderate, and high loads can produce similar hypertrophy when sets are taken close to failure, while higher and moderate loads generally support strength better than very low loads. ([Lopez et al., PMID 33433148](https://pubmed.ncbi.nlm.nih.gov/33433148/); [DOI](https://doi.org/10.1249/MSS.0000000000002585))
- Training to momentary failure is not universally superior to non-failure training for strength or hypertrophy. ([Grgic et al., PMID 33497853](https://pubmed.ncbi.nlm.nih.gov/33497853/); [DOI](https://doi.org/10.1016/j.jshs.2021.01.007))
- Autoregulated and standardized loading did not show a universal strength advantage; pooled effects varied by volume-regulation approach and outcome. ([Hickmott et al., PMID 35038063](https://pubmed.ncbi.nlm.nih.gov/35038063/); [DOI](https://doi.org/10.1186/s40798-021-00404-9))
- Frequency effects often diminish when volume is equated. ([Schoenfeld et al., PMID 27102172](https://pubmed.ncbi.nlm.nih.gov/27102172/); [Grgic et al., PMID 29470825](https://pubmed.ncbi.nlm.nih.gov/29470825/))
- Periodization appears to offer a small strength advantage in volume-equated programs, while hypertrophy differences are less consistent. ([Moesgaard et al., PMID 35044672](https://pubmed.ncbi.nlm.nih.gov/35044672/))
- Velocity-loss thresholds influence acute fatigue and some adaptation/performance outcomes, but there is no single threshold that optimizes every goal or athlete. ([Jukic et al., PMID 36178597](https://pubmed.ncbi.nlm.nih.gov/36178597/); [Pareja-Blanco et al., PMID 27038416](https://pubmed.ncbi.nlm.nih.gov/27038416/))

**Product implication:** a progression engine should ask what the block is trying to improve before selecting the lever. It should preserve coach intent such as strength, hypertrophy, power, technical practice, aerobic base, or return-to-sport exposure.

### 3.5 Suggested progression rule hierarchy

| Situation | Preferred product response | Status |
|---|---|---|
| Target achieved, technique acceptable, symptoms stable, recovery context ordinary | Progress one coach-approved dimension | Configurable heuristic |
| Target achieved but technique or symptoms deteriorated | Repeat, reduce one dimension, or request coach review | Product safety policy |
| Target missed once with no concerning symptoms | Repeat the exposure or use an approved flex path; do not automatically regress the whole plan | Product policy |
| Target missed repeatedly with worsening trend | Reduce dose, change variation, or escalate for review | Configurable heuristic/safety policy |
| Performance exceeds target but pain, illness, or neurological symptoms are present | Safety lane takes priority; hold or refer | Product safety rule |
| Data missing or wearable stale | Do not infer readiness; use plan and athlete confirmation | Product safety rule |

The product should not punish an athlete for not progressing every session. A stable repeat can be the correct decision when the objective is skill, tissue tolerance, exposure, or consolidation.

## 4. Regression, re-entry, and return-to-training

### 4.1 Define the terms separately

| Term | Meaning for the product | What it is not |
|---|---|---|
| Regression | A temporary reduction or substitution in task demand while preserving intent where possible | A moral failure or automatic diagnosis |
| Hold/repeat | Repeat the current dose to consolidate performance or observe response | A negative outcome |
| Deload | A planned reduction in training stress, usually for fatigue management or preparation | A validated universal medical threshold |
| Taper | A time-limited reduction before an event while preserving selected intensity/frequency | A general-purpose deload |
| Detraining | Reduced or absent training exposure with resulting changes in capacity | Proof that all adaptation is lost |
| Re-entry | A staged return after absence, illness, pain, injury, or life disruption | A fixed number of days for everyone |
| Return to sport | A broader shared decision involving sport demand, health, function, and risk | A single test score or app certification |

### 4.2 “Smallest effective change” as a regression policy

When the training intent can remain, the app should prefer the smallest change that makes the next exposure achievable and interpretable:

1. reduce optional volume before abandoning the pattern;
2. reduce load or effort while preserving technical intent;
3. extend rest when density is the problem;
4. shorten range only when the coach or clinician has defined the purpose;
5. substitute a simpler or more stable variation when skill or symptoms are the limiter;
6. pause and route to a human when red flags, illness, or repeated deterioration are present.

This is a product policy, not a universal clinical prescription. The app should show which dimension changed and why.

### 4.3 Detraining and retraining: do not overstate muscle memory

Short breaks do not affect every quality equally. Strength may be retained comparatively well over brief periods, while endurance qualities can change sooner; exact effects vary with training history, duration, age, and the quality being measured. ([Mujika & Padilla, PMID 10966148](https://pubmed.ncbi.nlm.nih.gov/10966148/); [Bickel et al., PMID 21131862](https://pubmed.ncbi.nlm.nih.gov/21131862/))

Human retraining studies do not justify a simple “muscle memory” guarantee. One study found muscle cross-sectional area returned toward baseline during detraining while strength remained elevated, and retraining was not uniformly faster in the tested design. ([Psilander et al., PMID 30991013](https://pubmed.ncbi.nlm.nih.gov/30991013/))

**Product stance:** after an absence, do not prescribe a universal percentage reduction based only on calendar days. Re-enter through recent actual performance, symptoms, exercise familiarity, and the reason for absence. The athlete may be new to the context even if the movement is familiar.

### 4.4 Tendon and rehabilitation progression

Rehabilitation literature supports progressive loading, but it does not support a universal pain number or exercise ladder for all tendons and diagnoses. In a specific Achilles tendinopathy RCT, continued sports activity using an individualized pain-monitoring model had outcomes comparable to active rest when paired with rehabilitation. ([Silbernagel et al., PMID 17307888](https://pubmed.ncbi.nlm.nih.gov/17307888/))

A systematic review of lower-limb tendinopathy trials found that pain was commonly used as a progression criterion, but strong evidence for the optimal criterion was absent and trials did not establish one universal rule. ([Escriche-Escuder et al., PMID 33444210](https://pubmed.ncbi.nlm.nih.gov/33444210/); [DOI](https://doi.org/10.1136/bmjopen-2020-041433))

Exercise-loading studies can rank exercises by relative tendon demand in healthy participants, which is useful for building a coach/clinician-approved exercise library. They do not allow the app to diagnose a tendon problem or prescribe an individualized rehabilitation dose by itself. ([Baxter et al., PMID 32658037](https://pubmed.ncbi.nlm.nih.gov/32658037/); [Silva et al., PMID 37847102](https://pubmed.ncbi.nlm.nih.gov/37847102/))

### 4.5 Return-to-sport is a shared, criteria-informed decision

Consensus statements emphasize individualized rehabilitation and sport-specific demands. The hamstring consensus did not reach agreement on one optimal progression or on universal flexibility/strength benchmarks. ([Paton et al., PMID 36650032](https://pubmed.ncbi.nlm.nih.gov/36650032/); [DOI](https://doi.org/10.1136/bjsports-2021-105384))

The product may:

- store clinician restrictions and milestones;
- display completed exposures and next approved steps;
- compare test results with coach/clinician-defined criteria;
- record symptoms during, after, and the next day;
- route exceptions and failed milestones.

It must not:

- declare an athlete “cleared” from an app score;
- infer healing stage or tissue integrity;
- create a return-to-sport date from a calendar alone;
- treat a painless session as proof of readiness for full competition.

## 5. Deloads and tapers: the popular rule with a thin direct evidence base

### 5.1 What the literature shows

Deloading is common in strength and physique practice, but much of the literature describes what coaches and athletes do rather than whether a particular deload schedule improves outcomes.

- A cross-sectional survey of competitive athletes reported deloads around every 5–6 weeks and lasting roughly one week; this is practice description, not efficacy evidence. ([Rogerson et al., PMID 38499934](https://pubmed.ncbi.nlm.nih.gov/38499934/); [DOI](https://doi.org/10.1186/s40798-024-00691-y))
- A coach survey reported similar 5–7 day and 4–6 week patterns, while explicitly noting the absence of a clear operational definition and limited research. ([Bell et al., PMCID PMC9811819](https://pmc.ncbi.nlm.nih.gov/articles/PMC9811819/); [DOI](https://doi.org/10.3389/fspor.2022.1073223))
- The first direct study of a one-week complete deload during supervised resistance training found comparable hypertrophy but no hypertrophy advantage, with lower-body strength outcomes favoring continued training in some analyses. The small, specific protocol does not establish that all deloads are harmful or useless; it establishes that “a one-week break automatically improves adaptation” is unsupported. ([Coleman et al., PMID 38274324](https://pubmed.ncbi.nlm.nih.gov/38274324/); [PMCID PMC10809978](https://pmc.ncbi.nlm.nih.gov/articles/PMC10809978/); [DOI](https://doi.org/10.7717/peerj.16777))

Tapering has a stronger endurance-performance literature, but it is not interchangeable with a general resistance-training deload. Meta-analyses commonly support reducing endurance volume while maintaining selected intensity and frequency for a competition taper, often over approximately two to three weeks. ([Bosquet et al., PMID 17762369](https://pubmed.ncbi.nlm.nih.gov/17762369/); [Wang et al., PMID 37163550](https://pubmed.ncbi.nlm.nih.gov/37163550/))

### 5.2 Product decision

The app may provide a coach-authored deload policy with configurable:

- trigger: calendar, accumulated fatigue pattern, event preparation, life stress, or coach judgment;
- duration;
- volume reduction;
- intensity/effort treatment;
- movement substitutions;
- recovery objective;
- review checkpoint;
- exit criteria.

The app should label the trigger as **policy**, not as a validated physiological threshold. It should not say “your nervous system requires a deload after four weeks” or “readiness below 60 for three days proves overreaching.”

## 6. HRV and readiness algorithms

### 6.1 What HRV evidence supports

HRV can reflect autonomic regulation and may help monitor training status, but direction of change is not universally interpretable. A systematic review/meta-analysis found useful relationships alongside substantial contextual variation. ([Bellenger et al., PMID 26888648](https://pubmed.ncbi.nlm.nih.gov/26888648/); [DOI](https://doi.org/10.1007/s40279-016-0484-2))

HRV-guided endurance training shows mixed findings:

- one meta-analysis found a small advantage for VO2max with HRV-guided training, with moderators including athlete level and sex; this is endurance-specific and does not validate a universal cutoff. ([Granero-Gallegos et al., PMID 33143175](https://pubmed.ncbi.nlm.nih.gov/33143175/))
- another meta-analysis found a meaningful effect on cardiac-vagal modulation but small, non-significant effects for aerobic capacity and performance, while highlighting uncertainty around metric, posture, baseline, and rolling-average choices. ([Manresa-Rocamora et al., PMID 34639599](https://pubmed.ncbi.nlm.nih.gov/34639599/))
- a systematic review found both predefined and data-guided training improved running performance, without establishing decisive superiority for HRV guidance. ([Düking et al., PMID 32785959](https://pubmed.ncbi.nlm.nih.gov/32785959/))
- a cycling trial in well-trained athletes found some within-group improvements but no clear between-group superiority. ([Javaloyes et al., PMID 29809080](https://pubmed.ncbi.nlm.nih.gov/29809080/))

### 6.2 HRV cutoffs: the ±0.5 SD problem

Protocols sometimes use a deviation such as ±0.5 standard deviations from an individual baseline, a rolling average, or a log-transformed RMSSD measure. A 2026 cardiac-rehabilitation RCT used a ±0.5 SD protocol, but both groups improved and the threshold was specific to that study population and intervention. ([Besnier et al., PMID 41627302](https://pubmed.ncbi.nlm.nih.gov/41627302/); [DOI](https://doi.org/10.1097/HCR.0000000000001017))

**Product conclusion:** ±0.5 SD is a possible configurable protocol parameter, not a universal physiological cutoff. The app should display “below this athlete’s selected baseline rule” rather than “below normal.”

### 6.3 Wearable and measurement validity

Portable HRV measurement can be acceptably close to ECG in some settings, but the error is heterogeneous and influenced by metric, device, position, timing, and processing. ([Dobbs et al., PMID 30706234](https://pubmed.ncbi.nlm.nih.gov/30706234/); [DOI](https://doi.org/10.1007/s40279-019-01061-5))

Consumer ring studies show that nocturnal heart rate and some RMSSD measures may be reasonably accurate under specified conditions, while frequency-domain measures can be poor and accuracy can vary by participant and method. ([Cao et al., PMID 35040799](https://pubmed.ncbi.nlm.nih.gov/35040799/); [Liang et al., PMID 39686012](https://pubmed.ncbi.nlm.nih.gov/39686012/))

The algorithm must therefore have a **data-quality gate** before interpreting HRV:

- source and metric are known;
- measurement window and posture/timing are comparable;
- enough valid readings exist for the selected baseline;
- artifact or device-quality flags are acceptable;
- acute illness, alcohol, unusual travel, and major context changes are visible;
- the result is not treated as a diagnosis.

### 6.4 A defensible readiness pattern

If the product includes a readiness view, implement it as a transparent evidence panel:

1. show the athlete’s recent baseline and data freshness;
2. show HRV as one component, not the headline verdict;
3. combine it with subjective wellness, sleep context, planned demand, recent actual performance, symptoms, and life stress;
4. state what is missing or contradictory;
5. offer an action such as “continue,” “reduce optional volume,” “repeat,” or “review,” not “safe” or “unsafe”;
6. do not automatically increase load based on a favorable HRV value;
7. do not lower a medically prescribed or clinician-managed program without the required approval;
8. let the coach choose whether HRV is active for this athlete and goal.

## 7. Injury prediction, ACWR, and universal workload rules

### 7.1 The product must distinguish descriptive monitoring from prediction

The IOC load consensus supports monitoring training load in relation to injury and illness risk, but it does not provide a universal individual risk calculator. ([Soligard et al., PMID 27535989](https://pubmed.ncbi.nlm.nih.gov/27535989/))

The ACWR literature is especially vulnerable to false precision:

- conceptual critiques identify causal, mathematical, and methodological problems and warn that ACWR-based recommendations can be inappropriate. ([Impellizzeri et al., PMID 32502973](https://pubmed.ncbi.nlm.nih.gov/32502973/); [DOI](https://doi.org/10.1123/ijspp.2019-0864))
- systematic reviews find heterogeneous populations, load measures, lag structures, bins, and injury definitions, preventing a general threshold. ([Andrade et al., PMID 32572824](https://pubmed.ncbi.nlm.nih.gov/32572824/))
- the widely cited “sweet spot” and “spike” model is an observational/theoretical framework, not a validated individual safety boundary. ([Gabbett, PMID 26758673](https://pubmed.ncbi.nlm.nih.gov/26758673/))
- a systematic review in professional male soccer found fixture congestion may matter, but could not establish a minimum-risk GPS workload threshold. ([Jiang et al., PMID 36293817](https://pubmed.ncbi.nlm.nih.gov/36293817/))

**Prohibited product claims:**

- “ACWR 0.8–1.3 is safe.”
- “ACWR above 1.5 means a 2x injury risk for you.”
- “The model predicts whether you will be injured this week.”
- “The athlete passed the screen, so they are cleared.”

### 7.2 Why screening scores should not be injury oracles

Bahr’s critique explains that injury-prediction screening requires valid predictive properties and evidence that acting on the screen changes outcomes. A risk factor association does not become a useful individual screening test merely because it is statistically significant. ([Bahr, PMID 27095747](https://pubmed.ncbi.nlm.nih.gov/27095747/); [DOI](https://doi.org/10.1136/bjsports-2016-096256))

The product can show a **load-change alert** or **review prompt** when recent demand differs substantially from the athlete’s established pattern, but it must phrase it descriptively: “This week contains a larger change than your selected plan range; review symptoms, performance, and schedule.”

### 7.3 The 10% weekly progression rule

The 10% rule is often repeated as if it were validated injury science. Running research has explored large weekly-distance changes and associations with injury, but those findings do not establish a universal 10% boundary across sports, surfaces, training age, or individual contexts. A review of running injury research describes the 10% rule as an author suggestion rather than a validated rule. ([Nielsen et al., PMID 25155475](https://pubmed.ncbi.nlm.nih.gov/25155475/); [Training errors and running-related injuries](https://pmc.ncbi.nlm.nih.gov/articles/PMC3290924/))

**Product status:** unknown as a universal injury-prevention rule. A coach may configure a percentage range for a specific training plan, but the app must label it as a plan constraint rather than scientific certainty.

## 8. Common overclaims and contradictory findings

| Common claim | What the evidence actually says | Product disposition |
|---|---|---|
| “Add 10% every week.” | No universal percentage is validated across people, sports, tissues, and goals. | Unknown as fact; coach-configurable plan range |
| “Increase 2–10% whenever the target is met.” | ACSM offers this as a practical resistance-training progression condition. | Heuristic; exercise- and goal-specific |
| “Deload every 4–6 weeks for one week.” | Common practice; direct efficacy evidence is sparse and the first direct study did not show a hypertrophy benefit. | Coach policy, not physiological fact |
| “Readiness below 0.5 SD means reduce training.” | Used in selected protocols; no universal cutoff or outcome superiority. | Configurable protocol only |
| “High HRV means recovered; low HRV means fatigued.” | Direction can vary with training state, illness, measurement, and individual response. | Unknown as universal interpretation |
| “ACWR 0.8–1.3 is the safe zone.” | Heterogeneous observational literature and conceptual problems; no universal individual threshold. | Do not claim |
| “A screening score predicts injury.” | Prediction requires validated individual accuracy and evidence that acting on it improves outcomes. | Do not claim |
| “No pain means no injury.” | Pain and tissue state are not interchangeable; some conditions are asymptomatic and some pain is non-dangerous. | Do not claim |
| “Pain above 3/10 means stop; below 3/10 means safe.” | Pain-monitoring approaches are diagnosis- and protocol-specific; no universal cutoff. | Clinician/coach-owned heuristic |
| “Cold always speeds recovery.” | Acute soreness relief can coexist with possible attenuation of resistance adaptations. | Goal- and timing-dependent |
| “Cold always harms adaptation.” | Effects depend on modality, timing, training goal, comparator, and outcome. | Do not universalize |
| “Heat repairs muscle after training.” | General recovery evidence is mixed and limited. | Unknown |
| “Heat improves sleep.” | Specific pre-bed warming protocols may improve sleep-onset/efficiency. | Narrow fact; optional heuristic |
| “Massage flushes lactate/toxins.” | Soreness/perceived fatigue effects do not establish this mechanism or tissue repair. | Do not claim |
| “Static stretching prevents DOMS.” | Meaningful recovery/DOMS prevention effect is not established. | Do not claim |
| “Training to failure is required for growth.” | Failure is not universally superior; proximity, volume, goal, and population matter. | Configurable training choice |
| “More training days always produce more strength.” | Frequency effects often reduce when volume is equated. | Do not claim |
| “Periodization always produces more muscle.” | Strength effects may differ; hypertrophy findings are less consistent. | Goal-specific heuristic |
| “One week off loses all gains.” | Short detraining affects qualities differently and does not uniformly erase adaptation. | Do not claim |
| “One hard session proves capacity.” | A single performance result is noisy and context-dependent. | Unknown; require repeated response |

## 9. Product claim-boundary matrix

This matrix is the practical contract for copy, notification, model prompts, coach controls, and acceptance testing.

| Claim or behavior | Status | What the product may say/do | What it must not say/do |
|---|---|---|---|
| Sleep supports performance/recovery | Fact, narrow | Explain relevance; compare with personal baseline; offer options | Impose one universal sleep-hour pass/fail rule |
| Subjective wellness helps monitor response | Fact | Use stable repeated check-ins and preserve athlete voice | Treat self-report as infallible or dismiss it as irrelevant |
| Missing data | Safety rule | Display “unknown”; ask for confirmation if action depends on it | Treat missingness as normal recovery |
| Planned vs actual load | Fact/product policy | Reconcile dose, symptoms, and response | Shame the athlete or assume non-compliance is laziness |
| Carbohydrate/fluid support after short recovery | Conditional fact | Offer general education when the next session is soon | Promise that a specific intake guarantees performance |
| Protein supports adaptation | Conditional fact | Link to goal and professional guidance | Diagnose deficiency or prescribe individualized nutrition automatically |
| Massage/compression/immersion | Conditional fact | Offer as optional short-term symptom/perception tools | Promise tissue repair, toxin removal, or injury prevention |
| Cold after resistance training | Conditional caution | Show goal conflict around frequent immediate use during hypertrophy/strength blocks | Recommend universally or prohibit universally |
| Heat for general recovery | Unknown/conditional | Offer only with clear goal and caveat | State that heat reliably repairs muscle or accelerates all recovery |
| Warm bath/shower before bed | Narrow fact/heuristic | Offer as optional sleep routine with safety caveat | Convert it into a muscle-repair guarantee |
| Progression after successful exposure | Heuristic | Apply coach-defined condition and one approved progression lever | Add load automatically because a score is high |
| ACSM 2–10% rule | Heuristic | Use as a configurable starting range for healthy resistance training | Present it as universal or apply it to rehab/illness without approval |
| Weekly running percentage rule | Unknown as universal | Allow plan-specific guardrails with context | Market 10% as an injury-prevention law |
| Deload every N weeks | Heuristic | Offer coach template with explicit objective and exit review | Claim the body biologically requires a fixed interval |
| Deload after readiness below N for M days | Unknown/unvalidated | Use only as an explicit coach policy and show evidence status | Auto-deload from a score as if threshold were validated |
| HRV trend | Heuristic | Use after quality/baseline checks as one contextual input | Use a universal cutoff, diagnosis, or automatic progression |
| Readiness score | Product summary only | Show components, confidence, freshness, and action boundary | Call it “safe,” “recovered,” or “injury-free” |
| ACWR | Descriptive heuristic at most | Show recent-versus-usual load change with caveat | Output individual injury probability or safe zone |
| Injury screening | Clinician/coach-owned | Record test, result, and approved interpretation | Declare clearance or predict injury from a screen |
| Pain rating | Safety input | Capture location, behavior, trend, function, and red flags | Diagnose tissue or use one universal stop threshold |
| Soreness | Context input | Offer low-demand options and monitor next-day response | Label every soreness report as injury or ignore worsening symptoms |
| Illness/systemic symptoms | Safety lane | Pause or route according to approved policy | Treat illness as ordinary low readiness and prescribe exercise |
| Tendon/rehab exercise ladder | Clinician/coach-owned | Use approved loading tiers and response criteria | Invent diagnosis or return-to-sport clearance |
| Re-entry after absence | Heuristic | Rebuild from recent actuals and reason for absence | Apply a universal day-based percentage reduction |
| Auto-Coached | Bounded delegation | Trim, hold, substitute, add rest, or use approved flex path | Increase load by default, override safety, or conceal changes |
| Product confidence | Transparency feature | Show data quality and evidence confidence | Convert uncertainty into a reassuring color or precise percentage |

## 10. Sophisticated under the hood, simple to the eye

### 10.1 Complexity belongs in the evidence and policy layers

The product can be highly sophisticated without making the athlete inspect a research database. Put complexity in:

- claim provenance and evidence versioning;
- coach-configurable policy templates;
- separate plan, schedule, actual, context, symptom, intervention, outcome, and resolution records;
- rule precedence and safety gates;
- data-quality and missingness handling;
- population/goal restrictions;
- audit logs, before/after comparisons, and rollback;
- outcome evaluation and false-alarm monitoring.

Expose only the next meaningful decision on the athlete surface.

### 10.2 Core objects and separation of truth

Keep the following layers immutable or independently versioned:

| Object | Meaning |
|---|---|
| Plan | Coach-authored intent, targets, constraints, and approved flex paths |
| Schedule | When the plan is expected to occur |
| Actual | What was completed, including load, reps, time, and quality |
| Context | Sleep, stress, travel, life load, illness context, environment, and device freshness |
| Symptom | Pain, soreness, illness, function, and trend observations |
| Intervention | Recovery or training adjustment offered/accepted |
| Resolution | The Coordinator’s decision, reason, confidence, authority, and expiry |
| Outcome | Next-session performance, symptoms, adherence, and athlete feedback |
| Evidence rule | Source, claim boundary, population, policy, and review state |

This prevents the common failure where an inferred readiness score overwrites what the athlete actually did.

### 10.3 A deterministic Coordinator, not a black box

The Coordinator should resolve in a visible order:

1. **Safety:** red flags, illness, clinician restrictions, and missing critical information.
2. **Constraint:** equipment, schedule, facility, event, travel, and coach rules.
3. **Intent:** strength, hypertrophy, power, conditioning, skill, rehabilitation exposure, or recovery.
4. **Response:** recent actual performance, symptoms, sleep, stress, and repeated trend.
5. **Action:** continue, hold/repeat, reduce volume, reduce load/effort, add rest, substitute, pause/refer, or progress.
6. **Explanation:** what changed, why, what did not change, and when to review.

Auto-Coached should operate only inside coach-approved bounds. In the existing product contract, v1 should not automatically increase load; it may trim, hold, reduce, add rest, or use an explicitly approved flex path.

### 10.4 Make readiness a contextual card, not a hero score

Recommended athlete presentation:

**Today’s plan**  
One sentence: “Continue the planned session with the approved low-volume option available.”

**Why**  
Two or three concrete signals: “Sleep was shorter than your recent baseline; pain unchanged; last session completed as planned.”

**Confidence**  
“Moderate — HRV data missing; based on check-in and recent training only.”

**Choice**  
“Train as planned” / “Use flex option” / “Ask coach.”

**Details**  
Expandable evidence, source, policy, before/after plan, and undo.

Do not make a red/green ring the primary interaction. Use text, icon, and color together; never rely on color alone.

### 10.5 Minimum viable check-in with progressive disclosure

The default check-in should be short and stable:

- sleep: normal / shorter / fragmented / poor;
- energy: normal / lower / very low;
- soreness: none / expected / more than expected;
- pain: none / present / worsening or limiting function;
- stress: normal / elevated / high;
- readiness: “How prepared do you feel for today?” with an optional reason.

If a response can change the action, ask one follow-up. Examples:

- pain present → location, behavior, function, red flags;
- illness symptom → systemic screen and safety route;
- large readiness change → “What changed?”;
- missing wearable data → optional manual confirmation.

### 10.6 Goal-linked recovery toolbox

Do not show a catalog of hacks. Ask what the athlete is trying to achieve:

| Goal | Tool category | Honest label |
|---|---|---|
| Feel less sore today | Massage, gentle movement, optional immersion/compression | “May improve short-term soreness or perceived recovery” |
| Perform again soon | Sleep opportunity, food/fluid, session dose, rest spacing | “Supports the next exposure when matched to the situation” |
| Maximize strength/hypertrophy adaptation | Load distribution, sleep, nutrition, avoid routine immediate cold if it conflicts with goal | “Protect the training signal and recovery budget” |
| Sleep better tonight | Wind-down, consistent schedule, optional warm bath/shower | “May support sleep onset/efficiency” |
| Return after pain/illness/injury | Clinician/coach-approved staged plan | “Follow the approved protocol; app records response” |

### 10.7 The “intervention receipt” for trust

Every material adjustment should produce a compact receipt:

> **Session adjusted**  
> Changed: 4 sets → 3 sets; load unchanged.  
> Reason: pain was reported as worsening during the warm-up.  
> Not inferred: this does not diagnose an injury.  
> Next checkpoint: after the session and tomorrow morning.  
> Authority: Auto-Coached within your coach’s approved flex range.  
> [Undo] [Message coach] [View details]

This is sophisticated logic presented as a simple decision.

### 10.8 Coach bench: show the policy, not a pile of metrics

Coach-facing controls should center on:

- goals and priorities;
- approved progression levers and ranges;
- regression/flex paths;
- safety gates and referral rules;
- whether HRV, wearables, or subjective check-ins are active;
- deload/taper policy and objective;
- who may approve what;
- evidence status and source links;
- change history and athlete outcome after each rule.

The coach should be able to answer: “What rule changed this session, who authorized it, and did it help?”

### 10.9 Evaluation metrics for the product

Do not evaluate the system only by engagement or whether it produces a colorful score. Track:

- completion and re-entry after missed sessions;
- athlete understanding of why a change occurred;
- coach override rate and reason;
- false alarms and missed safety escalations;
- symptom trajectory after regressions;
- next-session performance relative to plan;
- time from red flag to human review;
- frequency of unsupported claims shown to users;
- whether recovery interventions help the athlete’s chosen outcome;
- subgroup performance by sex, age, training age, sport, disability, device, and clinical status;
- whether confidence and missing-data labels change decisions appropriately.

Do not claim that an algorithm improves performance or reduces injury until the product itself has prospective validation against meaningful outcomes.

## Counterpoints/Challenges

### 1. “Athletes want one simple score.”

A single score is easy to scan but can conceal conflicting signals and create false authority. Keep a simple top-level status if user testing proves it helps, but make it a summary of visible components with confidence and an immediate “why.” It must never be the only available explanation.

### 2. “Individualization makes the product too complex.”

The answer is not to remove nuance; it is to use progressive disclosure. The athlete sees one next action. The coach sees the policy. The research/clinical layer stores the evidence and exclusions.

### 3. “Thresholds are necessary for deterministic automation.”

Thresholds are useful as operational policy, but should be labeled as policy rather than discovered biological truth. The app can be deterministic about what it does when a coach-defined rule is met while remaining honest that the rule is configurable and imperfect.

### 4. “Wearables will solve the missing-data problem.”

Wearables add useful longitudinal information but also add device, metric, timing, and artifact error. A stale or low-quality signal should lower confidence, not silently become a normal value.

### 5. “Any symptom reduction means the recovery method worked.”

Feeling better is a valid athlete outcome, but it is not the same as tissue healing, adaptation, or injury-risk reduction. The app should let athletes select the outcome they care about and report it without exaggerating what the intervention proves.

### 6. “More conservative rules are always safer.”

Overly conservative automation can reduce useful training, undermine autonomy, and encourage athletes to ignore the app. Safety should be targeted to red flags, uncertainty, repeated deterioration, and clinician restrictions; ordinary variability should support flexible choices rather than blanket shutdowns.

### 7. Population limitations are not a footnote

Much of the evidence is based on young, healthy, male, endurance-trained, resistance-trained, or professional team-sport samples. Findings may not transfer to adolescents, older adults, women across the menstrual/life course, para-athletes, beginners, people with chronic disease, pregnant athletes, or clinical rehabilitation. The product should carry population tags and default to lower authority when the athlete falls outside the evidence base.

## Actionable Next Steps

### P0 — Lock the evidence boundary before feature expansion

1. Adopt the three claim classes and the safety/clinician lane in this document.
2. Ban universal injury-risk percentages, ACWR safety zones, HRV cutoffs, fixed deload triggers, and “recovered/safe” claims from copy and model prompts.
3. Create the evidence registry with the P0 sources below and attach a claim ID to every planned recommendation.
4. Keep pain, illness, readiness, soreness, and performance as separate data domains.
5. Preserve the current product contract: deterministic Coordinator, coach/athlete split, bounded Auto-Coached authority, immutable history, before/after explanation, and reversible changes.

### P1 — Define the configurable policy layer

1. Create exercise-, goal-, and population-specific progression templates.
2. Define coach-controlled flex paths: hold, reduce volume, reduce load/effort, add rest, substitute, pause/refer.
3. Define deload and taper as separate templates with objectives and exit criteria.
4. Make HRV an opt-in protocol with metric, baseline, window, data-quality gate, and no automatic load increases.
5. Add descriptive load-change views without injury probabilities.
6. Add structured symptom and next-morning response capture for re-entry and rehabilitation contexts.

### P1 — Make the interface simple

1. Default athlete view: one action, two reasons, one confidence statement, one next checkpoint.
2. Hide advanced evidence details behind “Why,” “Details,” and “View source.”
3. Use neutral language and avoid shame, alarmist red, and false reassurance.
4. Make missingness explicit and actionable.
5. Give the athlete a direct correction path and the coach a compact decision queue.

### P2 — Validate the product’s own decisions

1. Run a prospective pilot comparing planned dose, actual dose, check-in context, Coordinator action, coach override, symptoms, and next-session response.
2. Predefine safety metrics: missed escalation, unnecessary pause, false alarm, and time-to-human-review.
3. Predefine adaptation metrics: performance trend, adherence, symptom response, and athlete/coach understanding.
4. Stratify results by population and device source.
5. Retire rules that do not improve decisions or that produce unsupported confidence.

## Research gaps the product must label openly

- No broadly validated readiness algorithm that generalizes across sports, sexes, ages, training states, devices, and clinical contexts.
- No universal HRV threshold, direction-of-change rule, or minimum baseline window that safely prescribes training for all users.
- No validated universal 10% weekly progression rule for injury prevention.
- No universal ACWR range that predicts individual injury or defines safety.
- Sparse direct evidence for resistance-training deload frequency, duration, dose, and outcomes.
- Limited evidence comparing volume reduction, intensity reduction, exercise substitution, and active deloading in different training populations.
- Limited long-term trials of recovery modalities using meaningful performance, adaptation, injury, or health outcomes rather than soreness and biomarkers.
- Limited evidence in women, older adults, adolescents, para-athletes, beginners, and athletes with clinical conditions.
- Limited evidence on how to combine subjective wellness, sleep, HRV, external load, and performance without creating false precision.
- Limited prospective evidence that an app’s action, rather than the underlying training plan, improves outcomes.

## Prioritized bibliography

### P0 — Foundational anchors for the product’s evidence and safety contract

The P0 set should be attached to the product’s core claim registry before method-specific features are expanded.

| ID | Source and type | PMID / DOI / direct link | Audit grade and product use |
|---|---|---|---|
| P0-01 | Rebelo A et al. **Monitoring Training Effects in Athletes: A Multidimensional Framework for Decision-Making.** Narrative framework, 2026. | PMID [41824225](https://pubmed.ncbi.nlm.nih.gov/41824225/); DOI [10.1007/s40279-026-02417-4](https://doi.org/10.1007/s40279-026-02417-4) | **A for monitoring framework.** Use for individual baselines, measurement error, minimal/adequate/accurate monitoring, and separating monitoring from diagnosis. Not a validation study for a readiness algorithm. |
| P0-02 | Kellmann M et al. **Recovery and Performance in Sport: Consensus Statement.** Consensus, 2018. | PMID [29345524](https://pubmed.ncbi.nlm.nih.gov/29345524/); DOI [10.1123/ijspp.2017-0759](https://doi.org/10.1123/ijspp.2017-0759) | **A for multidimensional recovery principles.** Use for individualized recovery monitoring and the absence of a one-size-fits-all strategy. |
| P0-03 | Heidari J et al. **Multidimensional Monitoring of Recovery Status and Implications for Performance.** Consensus/practical statement, 2019. | PMID [29543069](https://pubmed.ncbi.nlm.nih.gov/29543069/); DOI [10.1123/ijspp.2017-0669](https://doi.org/10.1123/ijspp.2017-0669) | **A for monitoring design.** Use to justify biological, psychological, social, and performance context. |
| P0-04 | Halson SL. **Monitoring Training Load to Understand Fatigue in Athletes.** Review, 2014. | PMID [25200666](https://pubmed.ncbi.nlm.nih.gov/25200666/); DOI [10.1007/s40279-014-0253-z](https://doi.org/10.1007/s40279-014-0253-z) | **A/B.** Use for internal/external load, longitudinal divergence, and the absence of a single fatigue marker. |
| P0-05 | Bourdon PC et al. **Monitoring Athlete Training Loads: Consensus Statement.** Consensus, 2017. | PMID [28463642](https://pubmed.ncbi.nlm.nih.gov/28463642/); DOI [10.1123/IJSPP.2017-0208](https://doi.org/10.1123/IJSPP.2017-0208) | **A for load-monitoring vocabulary and limitations.** Supports descriptive load tracking, not injury probability. |
| P0-06 | Saw AE et al. **Monitoring the athlete training response: subjective self-reported measures trump commonly used objective measures: a systematic review.** Systematic review, 2016. | PMID [26423706](https://pubmed.ncbi.nlm.nih.gov/26423706/); DOI [10.1136/bjsports-2015-094758](https://doi.org/10.1136/bjsports-2015-094758) | **B.** Supports stable subjective check-ins; does not prove subjective data are always superior. |
| P0-07 | Soligard T et al. **IOC consensus statement on load in sport and risk of injury.** Consensus, 2016. | PMID [27535989](https://pubmed.ncbi.nlm.nih.gov/27535989/); DOI [10.1136/bjsports-2016-096581](https://doi.org/10.1136/bjsports-2016-096581) | **A for broad load/injury context.** Do not convert it into an individual injury calculator. |
| P0-08 | Bahr R. **Why screening tests to predict injury do not work—and probably never will.** Critical review, 2016. | PMID [27095747](https://pubmed.ncbi.nlm.nih.gov/27095747/); DOI [10.1136/bjsports-2016-096256](https://doi.org/10.1136/bjsports-2016-096256) | **A for rejecting unsupported screening claims.** Use as a product safety boundary. |
| P0-09 | Impellizzeri FM et al. **Acute:Chronic Workload Ratio: Conceptual Issues and Fundamental Pitfalls.** Critical review, 2020. | PMID [32502973](https://pubmed.ncbi.nlm.nih.gov/32502973/); DOI [10.1123/ijspp.2019-0864](https://doi.org/10.1123/ijspp.2019-0864) | **A/B for ACWR limitations.** Prohibits universal safe zones and individual injury probabilities. |
| P0-10 | Andrade R et al. **Is the ACWR Associated with Risk of Time-Loss Injury in Professional Team Sports? A Systematic Review of Methodological Considerations.** Systematic review, 2020. | PMID [32572824](https://pubmed.ncbi.nlm.nih.gov/32572824/); DOI [10.1007/s40279-020-01308-6](https://doi.org/10.1007/s40279-020-01308-6) | **B.** Use to show heterogeneity of populations, metrics, lag structures, and bins. |
| P0-11 | Ratamess NA et al. **Progression Models in Resistance Training for Healthy Adults.** ACSM position stand, 2009. | PMID [19204579](https://pubmed.ncbi.nlm.nih.gov/19204579/); DOI [10.1249/MSS.0b013e3181915670](https://doi.org/10.1249/MSS.0b013e3181915670) | **B for practical prescription.** The 2–10% rule is a configurable heuristic, not a universal law. Healthy adults only. |
| P0-12 | Currier BS et al. **Resistance Training Prescription for Muscle Function, Hypertrophy, and Physical Performance in Healthy Adults: An Overview of Reviews.** Overview of reviews, 2026. | PMID [41843416](https://pubmed.ncbi.nlm.nih.gov/41843416/); DOI [10.1249/MSS.0000000000003897](https://doi.org/10.1249/MSS.0000000000003897) | **A/B for current resistance-training synthesis.** Strong anchor for goal-specific programming; healthy adults and evidence through October 2024. |
| P0-13 | Lopez P et al. **Resistance Training Load Effects on Muscle Hypertrophy and Strength Gain: Systematic Review and Network Meta-analysis.** Meta-analysis, 2021. | PMID [33433148](https://pubmed.ncbi.nlm.nih.gov/33433148/); DOI [10.1249/MSS.0000000000002585](https://doi.org/10.1249/MSS.0000000000002585) | **B.** Supports goal-specific loading and warns against “light loads never work” or “heavy loads are always required.” |
| P0-14 | Hickmott LM et al. **The Effect of Load and Volume Autoregulation on Muscular Strength and Hypertrophy: A Systematic Review and Meta-Analysis.** Meta-analysis, 2022. | PMID [35038063](https://pubmed.ncbi.nlm.nih.gov/35038063/); DOI [10.1186/s40798-021-00404-9](https://doi.org/10.1186/s40798-021-00404-9) | **B.** Supports configurable autoregulation; no universal strength or hypertrophy threshold. |
| P0-15 | Moesgaard L et al. **Effects of Periodization on Strength and Muscle Hypertrophy in Volume-Equated Resistance Training Programs.** Meta-analysis, 2022. | PMID [35044672](https://pubmed.ncbi.nlm.nih.gov/35044672/); DOI [10.1007/s40279-021-01636-1](https://doi.org/10.1007/s40279-021-01636-1) | **B.** Small strength advantage for periodization; no general hypertrophy superiority. |
| P0-16 | Bellenger CR et al. **Monitoring Athletic Training Status Through Autonomic Heart Rate Regulation: A Systematic Review and Meta-Analysis.** Review/meta-analysis, 2016. | PMID [26888648](https://pubmed.ncbi.nlm.nih.gov/26888648/); DOI [10.1007/s40279-016-0484-2](https://doi.org/10.1007/s40279-016-0484-2) | **B.** Supports HRV as contextual monitoring input; no universal direction or cutoff. |
| P0-17 | Manresa-Rocamora A et al. **Heart Rate Variability-Guided Training for Enhancing Cardiac-Vagal Modulation, Aerobic Fitness, and Endurance Performance: Methodological Systematic Review with Meta-analysis.** Meta-analysis, 2021. | PMID [34639599](https://pubmed.ncbi.nlm.nih.gov/34639599/); DOI [10.3390/ijerph181910299](https://doi.org/10.3390/ijerph181910299) | **B.** Useful for mixed HRV outcomes and protocol moderators; endurance-specific. |
| P0-18 | Dobbs WC et al. **The Accuracy of Acquiring Heart Rate Variability from Portable Devices: A Systematic Review and Meta-Analysis.** Validation meta-analysis, 2019. | PMID [30706234](https://pubmed.ncbi.nlm.nih.gov/30706234/); DOI [10.1007/s40279-019-01061-5](https://doi.org/10.1007/s40279-019-01061-5) | **B.** Requires data-quality and device-source handling before HRV action. |
| P0-19 | Dupuy O et al. **An Evidence-Based Approach for Choosing Post-exercise Recovery Techniques…: A Systematic Review With Meta-Analysis.** Meta-analysis, 2018. | PMID [29755363](https://pubmed.ncbi.nlm.nih.gov/29755363/); DOI [10.3389/fphys.2018.00403](https://doi.org/10.3389/fphys.2018.00403) | **B.** Supports narrow short-term soreness/fatigue claims; surrogate and heterogeneous outcomes. |
| P0-20 | Mountjoy M et al. **IOC consensus statement on Relative Energy Deficiency in Sport (REDs): 2023 Update.** Consensus, 2023. | PMID [37752011](https://pubmed.ncbi.nlm.nih.gov/37752011/) | **A for clinical boundary.** The app may flag and route; it must not diagnose RED-S. |

### P1 — Method-specific anchors for recovery, progression, deloading, and return-to-training

| ID | Source and type | PMID / DOI / direct link | Audit grade and product use |
|---|---|---|---|
| P1-01 | Walsh NP et al. **Sleep and the athlete: narrative review and 2021 expert consensus recommendations.** Consensus, 2021. | PMID [33144349](https://pubmed.ncbi.nlm.nih.gov/33144349/); DOI [10.1136/bjsports-2020-102025](https://doi.org/10.1136/bjsports-2020-102025) | **A for individualized sleep messaging.** Do not apply a universal sleep-hour pass/fail rule. |
| P1-02 | Fullagar HHK et al. **Sleep and Athletic Performance: The Effects of Sleep Loss on Exercise Performance and Physiological and Cognitive Responses to Exercise.** Systematic/narrative review, 2015. | PMID [25315456](https://pubmed.ncbi.nlm.nih.gov/25315456/); DOI [10.1007/s40279-014-0260-0](https://doi.org/10.1007/s40279-014-0260-0) | **B.** Supports sleep relevance with task-specific variation. |
| P1-03 | Bonnar D et al. **Sleep Interventions Designed to Improve Athletic Performance and Recovery: A Systematic Review.** Systematic review, 2018. | PMID [29352373](https://pubmed.ncbi.nlm.nih.gov/29352373/); DOI [10.1007/s40279-017-0832-x](https://doi.org/10.1007/s40279-017-0832-x) | **B.** Useful for sleep-extension, nap, and hygiene option design. |
| P1-04 | McCartney D et al. **Post-exercise Ingestion of Carbohydrate, Protein and Water: A Systematic Review and Meta-analysis for Effects on Subsequent Athletic Performance.** Meta-analysis, 2018. | PMID [29098657](https://pubmed.ncbi.nlm.nih.gov/29098657/); DOI [10.1007/s40279-017-0800-5](https://doi.org/10.1007/s40279-017-0800-5) | **B.** Supports fueling/fluid context when recovery time is short; not a universal timing promise. |
| P1-05 | Nunes EA et al. **Systematic review and meta-analysis of protein intake to support muscle mass and strength.** Meta-analysis, 2022. | PMID [35187864](https://pubmed.ncbi.nlm.nih.gov/35187864/) | **B.** Supports goal/context-specific protein education; dose translation requires population and diet context. |
| P1-06 | Ortiz RO Jr et al. **A Systematic Review on the Effectiveness of Active Recovery Interventions on Exercise-Induced Muscle Damage, Inflammation, and Delayed-Onset Muscle Soreness.** Systematic review, 2019. | PMID [29742750](https://pubmed.ncbi.nlm.nih.gov/29742750/); DOI [10.1519/JSC.0000000000002589](https://doi.org/10.1519/JSC.0000000000002589) | **B/C.** Supports optional active recovery, but protocol and intensity are inconclusive. |
| P1-07 | Moore E et al. **Effects of Cold-Water Immersion Compared with Other Recovery Modalities on Acute Recovery and Exercise Performance.** Systematic review/meta-analysis, 2023. | PMID [36527593](https://pubmed.ncbi.nlm.nih.gov/36527593/); DOI [10.1007/s40279-022-01800-1](https://doi.org/10.1007/s40279-022-01800-1) | **B.** Narrow acute soreness/performance comparison; timing and goal matter. |
| P1-08 | Malta ES et al. **Effects of Regular Cold Water Immersion Use on Training-Induced Changes in Strength and Endurance Performance: A Systematic Review with Meta-analysis.** Meta-analysis, 2021. | PMID [33146851](https://pubmed.ncbi.nlm.nih.gov/33146851/); DOI [10.1007/s40279-020-01362-0](https://doi.org/10.1007/s40279-020-01362-0) | **B.** Supports a conditional caution around repeated CWI and resistance adaptation. |
| P1-09 | Roberts LA et al. **Post-exercise Cold Water Immersion Attenuates Acute Anabolic Signalling and Long-term Adaptations in Muscle to Strength Training.** Controlled trial, 2015. | PMID [26174323](https://pubmed.ncbi.nlm.nih.gov/26174323/); DOI [10.1113/JP270570](https://doi.org/10.1113/JP270570) | **B.** Direct long-term signal; specific protocol/population, not a universal cold ban. |
| P1-10 | Grgic J. **Effects of Post-exercise Cold-water Immersion on Resistance Training-induced Gains in Strength: A Meta-analysis.** Meta-analysis, 2023. | PMID [35068365](https://pubmed.ncbi.nlm.nih.gov/35068365/); DOI [10.1080/17461391.2022.2033851](https://doi.org/10.1080/17461391.2022.2033851) | **B.** Small overall strength attenuation; 92% male and protocol-specific. |
| P1-11 | Ahokas EK et al. **Effects of Post-Exercise Heat Exposure on Acute Recovery and Training-Induced Performance Adaptations: A Systematic Review.** Systematic review, 2025. | PMID [41032138](https://pubmed.ncbi.nlm.nih.gov/41032138/); DOI [10.1186/s40798-025-00910-0](https://doi.org/10.1186/s40798-025-00910-0); full text [PMC12488549](https://pmc.ncbi.nlm.nih.gov/articles/PMC12488549/) | **B/C.** Mixed acute findings, limited sample, possible hot-environment endurance relevance; no general recovery claim. |
| P1-12 | Haghayegh S et al. **Before-bedtime Passive Body Heating by Warm Shower or Bath to Improve Sleep: A Systematic Review and Meta-analysis.** Meta-analysis, 2019. | PMID [31102877](https://pubmed.ncbi.nlm.nih.gov/31102877/); DOI [10.1016/j.smrv.2019.04.008](https://doi.org/10.1016/j.smrv.2019.04.008) | **A/B for narrow sleep outcome.** Do not broaden to muscle repair. |
| P1-13 | Afonso J et al. **The Effectiveness of Post-exercise Stretching in Short-Term and Delayed Recovery: A Systematic Review.** Systematic review, 2021. | PMID [34025459](https://pubmed.ncbi.nlm.nih.gov/34025459/) | **B/C.** Supports not marketing stretching as a reliable DOMS or recovery cure. |
| P1-14 | Grgic J et al. **Effects of Resistance Training Performed to Repetition Failure or Non-failure on Muscular Strength and Hypertrophy: A Systematic Review and Meta-analysis.** Meta-analysis, 2022. | PMID [33497853](https://pubmed.ncbi.nlm.nih.gov/33497853/); DOI [10.1016/j.jshs.2021.01.007](https://doi.org/10.1016/j.jshs.2021.01.007) | **B.** Supports RIR/RPE and failure as configurable choices, not requirements. |
| P1-15 | Jukic I et al. **The Acute and Chronic Effects of Implementing Velocity Loss Thresholds During Resistance Training: A Systematic Review, Meta-analysis, and Critical Evaluation.** Review/meta-analysis, 2023. | PMID [36178597](https://pubmed.ncbi.nlm.nih.gov/36178597/); DOI [10.1007/s40279-022-01754-4](https://doi.org/10.1007/s40279-022-01754-4) | **B.** Supports goal-specific velocity-loss heuristics; no universal threshold. |
| P1-16 | Pareja-Blanco F et al. **Effects of Velocity Loss During Resistance Training on Athletic Performance, Strength Gains and Muscle Adaptations.** RCT, 2017. | PMID [27038416](https://pubmed.ncbi.nlm.nih.gov/27038416/); DOI [10.1111/sms.12678](https://doi.org/10.1111/sms.12678) | **B/C.** Supports context-specific lower/higher velocity-loss choices; young men and specific protocol. |
| P1-17 | Androulakis-Korakakis P et al. **The Minimum Effective Training Dose Required to Increase 1RM Strength in Resistance-Trained Men: A Systematic Review and Meta-analysis.** Meta-analysis, 2020. | PMID [31797219](https://pubmed.ncbi.nlm.nih.gov/31797219/); DOI [10.1007/s40279-019-01236-0](https://doi.org/10.1007/s40279-019-01236-0) | **B.** Supports minimum-dose/regression options for trained men; limited generalization. |
| P1-18 | Schoenfeld BJ et al. **Effects of Resistance Training Frequency on Measures of Muscle Hypertrophy: A Systematic Review and Meta-analysis.** Meta-analysis, 2016. | PMID [27102172](https://pubmed.ncbi.nlm.nih.gov/27102172/); DOI [10.1007/s40279-016-0543-8](https://doi.org/10.1007/s40279-016-0543-8) | **B.** Supports frequency as a volume/distribution choice, not a universal rule. |
| P1-19 | Grgic J et al. **Effect of Resistance Training Frequency on Gains in Muscular Strength: A Systematic Review and Meta-analysis.** Meta-analysis, 2018. | PMID [29470825](https://pubmed.ncbi.nlm.nih.gov/29470825/); DOI [10.1007/s40279-018-0872-x](https://doi.org/10.1007/s40279-018-0872-x) | **B.** Frequency advantage often disappears when volume is equated. |
| P1-20 | Coleman M et al. **Gaining More from Doing Less? The Effects of a One-week Deload Period During Supervised Resistance Training on Muscular Adaptations.** Direct intervention study, 2024. | PMID [38274324](https://pubmed.ncbi.nlm.nih.gov/38274324/); DOI [10.7717/peerj.16777](https://doi.org/10.7717/peerj.16777); full text [PMC10809978](https://pmc.ncbi.nlm.nih.gov/articles/PMC10809978/) | **C.** First direct deload study; narrow protocol and sample. Rejects automatic hypertrophy-benefit language, not all deload practice. |
| P1-21 | Rogerson D et al. **Deloading Practices in Strength and Physique Sports: A Cross-sectional Survey.** Survey, 2024. | PMID [38499934](https://pubmed.ncbi.nlm.nih.gov/38499934/); DOI [10.1186/s40798-024-00691-y](https://doi.org/10.1186/s40798-024-00691-y) | **D for efficacy; C for practice description.** Useful for template defaults, never for causal claims. |
| P1-22 | Bosquet L et al. **Effects of Tapering on Performance: A Meta-analysis.** Meta-analysis, 2007. | PMID [17762369](https://pubmed.ncbi.nlm.nih.gov/17762369/) | **B for endurance tapering.** Do not relabel as a general resistance deload. |
| P1-23 | Wang Z et al. **Effects of Tapering on Performance in Endurance Athletes.** Meta-analysis, 2023. | PMID [37163550](https://pubmed.ncbi.nlm.nih.gov/37163550/); DOI [10.1371/journal.pone.0282838](https://doi.org/10.1371/journal.pone.0282838) | **B.** Supports event-specific endurance taper design; not a universal recovery rule. |
| P1-24 | Escriche-Escuder A et al. **Load Progression Criteria in Exercise Programmes in Lower Limb Tendinopathy: A Systematic Review.** Systematic review, 2020. | PMID [33444210](https://pubmed.ncbi.nlm.nih.gov/33444210/); DOI [10.1136/bmjopen-2020-041433](https://doi.org/10.1136/bmjopen-2020-041433) | **B.** Shows pain criteria are common but optimal progression rules remain under-researched. |
| P1-25 | Silbernagel KG et al. **Continued Sports Activity, Using a Pain-monitoring Model, During Rehabilitation in Patients with Achilles Tendinopathy: A Randomized Controlled Study.** RCT, 2007. | PMID [17307888](https://pubmed.ncbi.nlm.nih.gov/17307888/) | **B/C.** Supports a condition-specific pain-monitoring rehabilitation model; not a universal pain cutoff. |
| P1-26 | Paton BM et al. **London International Consensus and Delphi Study on Hamstring Injuries Part 3: Rehabilitation, Running and Return to Sport.** Consensus/Delphi, 2023. | PMID [36650032](https://pubmed.ncbi.nlm.nih.gov/36650032/); DOI [10.1136/bjsports-2021-105384](https://doi.org/10.1136/bjsports-2021-105384) | **A for shared-decision boundary.** Individualized, sport-specific progression; no universal milestone ladder. |
| P1-27 | Lauersen JB et al. **Strength Training as Superior, Dose-dependent and Safe Prevention of Acute and Overuse Sports Injuries: A Systematic Review, Qualitative Analysis and Meta-analysis.** Meta-analysis, 2018. | PMID [30131332](https://pubmed.ncbi.nlm.nih.gov/30131332/); DOI [10.1136/bjsports-2018-099078](https://doi.org/10.1136/bjsports-2018-099078) | **B.** Supports strength-training prevention programs at population level; not individual prediction. |
| P1-28 | Wu H et al. **Do Exercise-based Prevention Programs Reduce Injury in Running? A Systematic Review and Meta-analysis.** Meta-analysis, 2024. | PMID [38261240](https://pubmed.ncbi.nlm.nih.gov/38261240/) | **B/C.** Important counterpoint: overall effect was not clearly significant and included studies were often low quality. |

### P2 — Representative RCTs and population-limited studies for calibration

| ID | Source and type | PMID / DOI / direct link | Audit grade and product use |
|---|---|---|---|
| P2-01 | Mah CD et al. **The Effects of Sleep Extension on the Athletic Performance of Collegiate Basketball Players.** Applied intervention, 2011. | PMID [21731144](https://pubmed.ncbi.nlm.nih.gov/21731144/); DOI [10.5665/SLEEP.1132](https://doi.org/10.5665/SLEEP.1132) | **C.** Small, male collegiate basketball sample; useful example of sleep-extension signal, not universal effect. |
| P2-02 | McCartney et al. source above | PMID [29098657](https://pubmed.ncbi.nlm.nih.gov/29098657/); DOI [10.1007/s40279-017-0800-5](https://doi.org/10.1007/s40279-017-0800-5) | **B.** Included again as an anchor for short-turnaround fueling decisions. |
| P2-03 | Fyfe JJ et al. **Cold Water Immersion Attenuates Anabolic Signaling and Skeletal Muscle Fiber Hypertrophy, but Not Strength Gain, Following Resistance Exercise.** Controlled trial, 2019. | PMID [31513450](https://pubmed.ncbi.nlm.nih.gov/31513450/); DOI [10.1152/japplphysiol.00127.2019](https://doi.org/10.1152/japplphysiol.00127.2019) | **C/B.** Useful contradiction/context: hypertrophy signaling and strength outcomes need not move together. |
| P2-04 | Dablainville V et al. **Muscle Regeneration is Improved by Hot Water Immersion but Unchanged by Cold Following a Simulated Musculoskeletal Injury in Humans.** Experimental intervention, 2025. | PMID [40437768](https://pubmed.ncbi.nlm.nih.gov/40437768/); DOI [10.1113/JP287777](https://doi.org/10.1113/JP287777) | **C.** Interesting mechanistic/experimental result; simulated injury and narrow protocol, not a general heat-over-cold treatment claim. |
| P2-05 | Javaloyes A et al. **Training Prescription Guided by Heart Rate Variability in Cycling.** Controlled training study, 2019. | PMID [29809080](https://pubmed.ncbi.nlm.nih.gov/29809080/); DOI [10.1123/ijspp.2018-0122](https://doi.org/10.1123/ijspp.2018-0122) | **C.** Small, well-trained cyclists; no general HRV algorithm validation. |
| P2-06 | Düking P et al. **Predefined vs Data-guided Training Prescription Based on Autonomic Nervous System Variation: A Systematic Review.** Systematic review, 2020. | PMID [32785959](https://pubmed.ncbi.nlm.nih.gov/32785959/); DOI [10.1111/sms.13802](https://doi.org/10.1111/sms.13802) | **B.** Important null/neutral comparison: predefined training can work as well as HRV-guided training. |
| P2-07 | Besnier F et al. **HRV-Guided Exercise Training Compared With Standard Exercise Training in Patients With Coronary Artery Disease: Randomized Controlled Trial.** RCT, 2026. | PMID [41627302](https://pubmed.ncbi.nlm.nih.gov/41627302/); DOI [10.1097/HCR.0000000000001017](https://doi.org/10.1097/HCR.0000000000001017) | **C.** Clinical population and protocol-specific ±0.5 SD rule; not athlete generalization. |
| P2-08 | Ogasawara R et al. **Comparison of Muscle Hypertrophy Following 6-month Continuous and Periodic Strength Training.** Intervention study, 2013. | PMID [23053130](https://pubmed.ncbi.nlm.nih.gov/23053130/); DOI [10.1007/s00421-012-2511-9](https://doi.org/10.1007/s00421-012-2511-9) | **C.** Small young male sample; useful for distinguishing periodic training from universal detraining claims. |
| P2-09 | Psilander N et al. **Effects of Training, Detraining, and Retraining on Strength, Hypertrophy, and Myonuclear Number in Human Skeletal Muscle.** Intervention study, 2019. | PMID [30991013](https://pubmed.ncbi.nlm.nih.gov/30991013/); DOI [10.1152/japplphysiol.00917.2018](https://doi.org/10.1152/japplphysiol.00917.2018) | **C.** Small mixed-sex sample; useful counterpoint to simple “muscle memory” automation. |
| P2-10 | Pritchard HJ et al. **Higher- Versus Lower-Intensity Strength-Training Taper: Effects on Neuromuscular Performance.** Small taper study, 2019. | PMID [30204523](https://pubmed.ncbi.nlm.nih.gov/30204523/); DOI [10.1123/ijspp.2018-0489](https://doi.org/10.1123/ijspp.2018-0489) | **C.** Eleven strength-trained men; taper-specific, not a general deload threshold. |
| P2-11 | Gabbett TJ. **The Training-injury Prevention Paradox: Should Athletes Be Training Smarter and Harder?** Observational/theoretical framework, 2016. | PMID [26758673](https://pubmed.ncbi.nlm.nih.gov/26758673/); DOI [10.1136/bjsports-2015-095788](https://doi.org/10.1136/bjsports-2015-095788) | **C/D.** Include as a historically influential model and a caution against treating a model as a universal safe zone. |
| P2-12 | Nielsen RO et al. **Excessive Progression in Weekly Running Distance and Risk of Running-related Injuries.** Prospective cohort, 2014. | PMID [25155475](https://pubmed.ncbi.nlm.nih.gov/25155475/) | **C.** Running-specific observational evidence; cannot validate a universal 10% rule. |
| P2-13 | Baxter JR et al. **Exercise Progression to Incrementally Load the Achilles Tendon.** Load-measurement study, 2021. | PMID [32658037](https://pubmed.ncbi.nlm.nih.gov/32658037/); DOI [10.1249/MSS.0000000000002459](https://doi.org/10.1249/MSS.0000000000002459) | **C.** Useful for exercise-library loading tiers; healthy participants, not rehabilitation efficacy. |
| P2-14 | Silva RS et al. **Patellar Tendon Load Progression During Rehabilitation Exercises.** Load-measurement study, 2024. | PMID [37847102](https://pubmed.ncbi.nlm.nih.gov/37847102/); DOI [10.1249/MSS.0000000000003323](https://doi.org/10.1249/MSS.0000000000003323); full text [PMC10925836](https://pmc.ncbi.nlm.nih.gov/articles/PMC10925836/) | **C.** Supports graded exercise cataloging; not automated diagnosis or clearance. |
| P2-15 | Herring SA et al. **Team Physician Consensus Statement: Return to Sport/Return to Play.** Consensus, 2024. | PMID [38709944](https://pubmed.ncbi.nlm.nih.gov/38709944/); DOI [10.1249/JSR.0000000000001169](https://doi.org/10.1249/JSR.0000000000001169) | **A for shared-decision and medical-authority boundaries.** Useful for routing and documentation. |

## Final product brief position

The coaching app should be confident about **process** and humble about **prediction**.

It can confidently record what happened, preserve athlete context, apply coach-approved constraints, show longitudinal patterns, offer a small number of explainable options, and route safety concerns. It should be cautious about declaring what a signal means inside one person, and it should refuse to convert population averages, coach customs, or surrogate outcomes into universal guarantees.

The winning interface is therefore not a stripped-down app with shallow logic. It is a simple surface over a deep evidence-and-policy layer:

> **One clear next action. Two or three reasons. Honest confidence. A visible human escape hatch.**

