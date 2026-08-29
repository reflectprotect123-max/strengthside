# Claude research handoff: recovery, progressions, regressions, pain-aware training, and return-to-training

**Date:** 8 August 2026  
**Status:** Research-only product/evidence handoff; no app code  
**Purpose:** Companion expansion to the preserved coaching-platform research, the athlete onboarding/check-ins/Auto-Coached brief, and the week-in-review handoff.

## How this document fits the existing work

Keep the earlier research files intact. This is a new evidence and product-design lane to be added to them, not a replacement or a rewrite.

The existing product contract remains binding:

- The product has an athlete app and a coach's bench.
- The training loop is **Plan → Schedule → Train → Log → Recover → Review → Progress**.
- The coach authors intent, constraints, and targets.
- The deterministic **Coordinator** resolves only within those constraints.
- The system separates coach prescription, athlete result, check-in context, intervention, and decision history.
- Pain and illness safety outrank readiness, performance, adherence, and progression.
- Auto-Coached is bounded delegation, not a black-box replacement for a coach or clinician.
- Every material change is explainable, versioned, inspectable, and reversible where policy allows.
- The weekly review is a reconciliation and decision record, not a compliance verdict.
- Nutrition and recovery are context and support, not moral scores.

This handoff answers a narrower but central question:

> How should the product safely decide when to progress, hold, regress, substitute, recover, pause, or return an athlete to training—while remaining clinically honest, operationally deterministic, and visually simple?

## Executive decision

Build recovery and adaptation as a **bounded decision-support system**. Do not build a universal readiness oracle.

The strongest product opportunity is a system that can say, clearly:

1. **What happened:** planned dose, completed dose, symptoms, context, and response.
2. **What is known:** measured, self-reported, observed, or repeatedly established for this athlete.
3. **What is only suspected:** a pattern, not a diagnosis or causal fact.
4. **What the next safe option is:** proceed, hold, regress, substitute, pause, or ask for review.
5. **Who must approve it:** Auto-Coach, coach, clinician, or athlete within a pre-agreed policy.

### Honest product verdict

The idea is **9/10** if the product becomes a transparent, coach-configurable adaptation system that protects training intent and makes recovery/re-entry easier. It is **5/10** if it becomes another app that turns sleep, HRV, soreness, and a coloured score into unexplained plan changes.

## What the evidence says, in plain language

1. Recovery is multidimensional. Training load, life stress, sleep, nutrition, illness, pain, psychology, and performance interact; there is no single definitive fatigue or readiness marker. The strongest monitoring literature recommends an individualized, longitudinal, practical approach rather than a single score. ([Halson, PMID 25200666](https://pubmed.ncbi.nlm.nih.gov/25200666/); [Kellmann et al., PMID 29345524](https://pubmed.ncbi.nlm.nih.gov/29345524/); [Rebelo et al., PMID 41824225](https://pubmed.ncbi.nlm.nih.gov/41824225/))

2. Pain is not a tissue-damage meter. The IASP definition explicitly treats pain as a sensory and emotional experience associated with, or resembling that associated with, actual or potential tissue damage. Pain can be important and real without allowing an app to identify the injured structure or diagnose the cause. ([Raja et al., PMID 32694387](https://pubmed.ncbi.nlm.nih.gov/32694387/); [Caneiro et al., PMID 32907798](https://pubmed.ncbi.nlm.nih.gov/32907798/))

3. Soreness, pain, and systemic symptoms must not share one control. Delayed-onset muscle soreness commonly follows unfamiliar or eccentric work, can peak later, and can temporarily alter range of motion and force. It is not automatically an injury, but severe or worsening symptoms should not be dismissed as DOMS. ([Cheung et al., PMID 12617692](https://pubmed.ncbi.nlm.nih.gov/12617692/); [Hotfiel et al., PMID 30537791](https://pubmed.ncbi.nlm.nih.gov/30537791/))

4. Tendon rehabilitation supports progressive loading, not universal rest and not reckless pain pushing. In a specific Achilles tendinopathy trial, continued activity under a pain-monitoring model did not produce worse outcomes than active rest, and progressive tendon loading was central to both groups. That does not validate the same threshold for every tissue, diagnosis, exercise, or athlete. ([Silbernagel et al., PMID 17307888](https://pubmed.ncbi.nlm.nih.gov/17307888/); [Silbernagel & Crossley, PMID 26390272](https://pubmed.ncbi.nlm.nih.gov/26390272/))

5. Progression is goal- and movement-specific. Load, volume, range of motion, velocity, rest, stability, contraction type, and exercise selection do not carry the same meaning. Full range of motion generally has advantages for lower-body strength and hypertrophy, but partial range can be a useful temporary exposure when a clinician or coach has defined the reason. ([Pallarés et al., PMID 34170576](https://pubmed.ncbi.nlm.nih.gov/34170576/); [Schoenfeld et al., PMID 32030125](https://pubmed.ncbi.nlm.nih.gov/32030125/); [Cormie et al., PMID 21244105](https://pubmed.ncbi.nlm.nih.gov/21244105/))

6. Short training breaks are not the same as injury or illness. Strength can be relatively well preserved over shorter periods, and retraining after a short break can recover lost strength and size quickly in some populations. Endurance and cardiorespiratory qualities can decline sooner. Exact time-based reductions are not universal. ([Mujika & Padilla, PMID 10966148](https://pubmed.ncbi.nlm.nih.gov/10966148/); [Bickel et al., PMID 21131862](https://pubmed.ncbi.nlm.nih.gov/21131862/); [Halonen et al., PMID 39364857](https://pubmed.ncbi.nlm.nih.gov/39364857/); [Spiering et al., PMID 33629972](https://pubmed.ncbi.nlm.nih.gov/33629972/))

7. Acute:chronic workload ratio is not a safe universal algorithm. There is no evidence that one ACWR threshold can be used as a general injury predictor, and systematic reviews are heterogeneous. The app may show recent-versus-usual load as context, but it must not present a ratio as an individual injury probability. ([Impellizzeri et al., PMID 32502973](https://pubmed.ncbi.nlm.nih.gov/32502973/); [Andrade et al., PMID 32572824](https://pubmed.ncbi.nlm.nih.gov/32572824/))

8. Illness return-to-training requires symptom and complication awareness, not a simplistic “above/below the neck” rule. The IOC evidence review says the neck-check rule lacks scientific validation and that return depends on symptom type, severity, regional/systemic involvement, pathogen, and individual response. ([Snyders et al., PMID 34789459](https://pubmed.ncbi.nlm.nih.gov/34789459/); [IOC consensus part 1, PMID 35863871](https://pubmed.ncbi.nlm.nih.gov/35863871/))

9. Recovery modalities can change how an athlete feels without proving faster tissue adaptation. Massage, compression, immersion, and related methods can reduce DOMS or perceived fatigue in some studies, while repeated immediate cold-water immersion after strength training may attenuate hypertrophy or strength adaptation. The product must tie a recovery suggestion to the athlete's goal and not sell every modality as universally beneficial. ([Dupuy et al., PMID 29755363](https://pubmed.ncbi.nlm.nih.gov/29755363/); [Roberts et al., PMID 26174323](https://pubmed.ncbi.nlm.nih.gov/26174323/); [Grgic et al., PMID 35068365](https://pubmed.ncbi.nlm.nih.gov/35068365/))

## Evidence and confidence labels

Use these labels throughout the product brief and its internal evidence library:

- **[HIGH RESEARCH CONFIDENCE]** — supported by a consensus statement, guideline, or convergent systematic reviews with reasonably direct applicability.
- **[MODERATE RESEARCH CONFIDENCE]** — supported by a relevant randomized trial, systematic review, or repeated applied finding, but limited by condition, population, sample, or generalizability.
- **[LOW RESEARCH CONFIDENCE]** — single study, clinical commentary, heterogeneous evidence, or a plausible but unvalidated product heuristic.
- **[PRODUCT INFERENCE]** — a design implication derived from the research; not itself a clinical finding.
- **[PRODUCT SAFETY RULE]** — a conservative software boundary proposed to prevent the app from exceeding its evidence or authority.
- **[CLINICIAN-OWNED]** — the app may record, display, route, or enforce a clinician/coach-defined protocol but must not invent the protocol.

The document intentionally does not use “evidence-based” as a blanket label. Every high-impact rule needs an evidence class, applicability note, and approval owner.

# Part I — The clinical distinctions the product must preserve

## 1. Pain is a signal, not a diagnosis

Pain is subjective, multidimensional, and context-sensitive. The product should respect pain as important information while refusing to infer a specific pathology from a number, body location, or exercise alone.

### What the app may record

- body region and side;
- exact exercise or movement that provoked it;
- onset: gradual, sudden, during a specific rep, after training, or unrelated to training;
- intensity at rest, during movement, immediately after, and the next morning;
- quality: ache, tightness, sharp, burning, electric, cramping, pressure, or “other”;
- whether it changes with warm-up, load, range, speed, or position;
- swelling, bruising, instability, locking, giving way, numbness, tingling, weakness, or loss of function;
- whether the athlete can perform normal daily tasks;
- trend: improving, stable, worsening, or fluctuating;
- whether a clinician has assessed it and what restrictions were prescribed.

### What the app cannot safely infer

- “This is tendon pain” from pain near a tendon.
- “This is a muscle strain” from pain during a stretch or contraction.
- “This is safe” because the pain is below an arbitrary number.
- “This is harmful” solely because pain occurred during a controlled rehabilitation exercise.
- “The athlete is recovered” because pain fell for one day.
- “The athlete has no injury” because no pain was reported.
- A diagnosis, tissue healing stage, rupture status, fracture status, neurological cause, or systemic cause without clinical assessment.

### Product implication

Pain should create a **structured observation and decision path**, not a diagnosis badge. The UI should say “pain reported during split squat” rather than “knee injury detected.”

## 2. Soreness is not the same as pain, and neither is the same as illness

### Possible DOMS-like pattern

DOMS is commonly associated with unfamiliar, high-intensity, or eccentric exercise; symptoms can be delayed rather than immediate, and commonly include muscle tenderness, stiffness, and temporary performance reduction. The literature does not give the app permission to diagnose DOMS from timing alone. ([Cheung et al., PMID 12617692](https://pubmed.ncbi.nlm.nih.gov/12617692/); [Hotfiel et al., PMID 30537791](https://pubmed.ncbi.nlm.nih.gov/30537791/))

The app may label a pattern as **“soreness-like response”** when the athlete reports diffuse muscle soreness after a novel/high-dose session and no red-flag feature. It must label this as a low-confidence interpretation and invite correction.

### More concerning musculoskeletal pattern

Escalate for coach/clinician review when the athlete reports one or more of:

- sudden onset or a “pop” during a rep;
- new bruising, marked swelling, visible deformity, or a palpable defect;
- inability to bear weight or perform a previously easy movement;
- progressive loss of strength, range, coordination, or function;
- locking, giving way, or a feeling of instability;
- numbness, tingling, radiating pain, or neurological change;
- pain that is severe, disproportionate, rapidly worsening, or present at rest/night in a new way;
- a repeated next-morning deterioration after a load;
- pain that does not settle or keeps recurring despite a coach-approved regression.

These are triage signals, not diagnostic criteria. The product should use neutral language: “This pattern needs human assessment before the app changes training.”

### Illness/systemic pattern

Keep illness questions separate from local musculoskeletal pain:

- fever or chills;
- unusual fatigue or malaise;
- chest pain, chest tightness, palpitations, fainting, or unusual breathlessness;
- widespread myalgia or systemic symptoms;
- cough or respiratory symptoms that worsen with exertion;
- gastrointestinal symptoms causing dehydration risk;
- confirmed or suspected infectious illness;
- recent surgery, hospitalization, or medically significant condition.

The app must not treat systemic symptoms as “low readiness” and simply prescribe an easier workout. Illness can require cessation, medical review, infection-control considerations, and a staged return.

## 3. Readiness, fatigue, capacity, and recovery are different objects

The product should distinguish:

| Object | Plain-language meaning | Safe product treatment |
|---|---|---|
| Readiness | A time-specific estimate of how prepared the athlete may be for today's planned task | Contextual input; never the sole decision-maker |
| Fatigue | A state of reduced ability or increased effort relative to a recent expectation | Compare with personal baseline and actual performance |
| Recovery | The process and current balance between stress and restoration | Multi-dimensional trend; not a single score |
| Capacity | What the athlete can currently tolerate or perform | Inferred from repeated exposures and outcomes, not one session |
| Pain | A reported sensory/emotional experience | Safety and coaching signal; not tissue diagnosis |
| Soreness | A reported post-exercise response, often delayed and diffuse | Contextual signal; monitor function and trajectory |
| Illness symptom | A local or systemic health complaint | Safety gate; often clinician-owned if significant |
| Performance | What was actually achieved under a defined task | Outcome evidence, not a direct tissue-health measure |

The app must never display all of these under one label such as “recovery score.” If a combined view is used, it must show the components and their freshness.

# Part II — Recovery methods and what the product should do with them

## 4. Recovery is a system, not a shopping list

The recovery surface should prioritize the least glamorous interventions that are most broadly useful: sleep opportunity, appropriate fueling, hydration, sensible load distribution, stress management, and sustainable scheduling. Specialized modalities can be offered as optional tools, with goal-specific caveats.

### Recommended recovery hierarchy

| Tier | Recovery domain | Product stance | Evidence confidence |
|---|---|---|---|
| 1 | Sleep opportunity and quality | Track simply, personalize, and surface persistent deterioration; do not impose a universal sleep target | High for relevance; low for one-size-fits-all threshold |
| 1 | Training-load distribution | Compare planned and actual internal/external load; look for divergence and accumulation | High/moderate |
| 1 | Adequate food, carbohydrate availability, protein, and fluids | Record context and offer general education; route individualized or risk-related issues to a dietitian/clinician | Moderate/high for context; clinician-owned for diagnosis |
| 1 | Psychological and life stress | Ask only when it can change a decision; do not turn it into a surveillance score | Moderate |
| 2 | Low-intensity movement or active recovery | Offer when the athlete wants it and no safety gate is active; do not prescribe it as a cure | Moderate for perceived recovery in some settings |
| 2 | Massage, compression, immersion | Optional, goal-dependent tools for soreness/perceived fatigue; no claim of guaranteed tissue repair | Moderate for some short-term symptoms |
| 2 | Heat/cold protocols | Goal- and timing-dependent; cold after strength is not a default recommendation | Moderate/conditional |
| 3 | Supplements, medication, hormonal interventions | Do not auto-prescribe; education and professional referral only | Highly variable/clinician-owned |
| 3 | Laboratory, imaging, HRV, biochemical or endocrine interpretation | Store imported values and clinician interpretation; do not diagnose or auto-adjust from one value | Variable/clinician-owned |

## 5. Sleep

The athlete-sleep consensus explicitly cautions against applying a universal “7–9 hours” rule to every athlete and recommends an individualized approach that considers perceived sleep need and sport-specific factors. ([Walsh et al., PMID 33144349](https://pubmed.ncbi.nlm.nih.gov/33144349/))

### Product recommendations

- Ask for sleep duration and perceived quality in under 10 seconds.
- Let the athlete choose “normal for me,” “shorter than usual,” “fragmented,” or “poor and affecting me.”
- Show a personal baseline trend after enough observations; do not flag a single short night as a training failure.
- Treat wearable sleep values as measured estimates with a device/source label, not ground truth.
- If sleep is persistently poor, pair the insight with practical options: reduce training ambition, protect a sleep opportunity, shorten the session, or discuss stress/health with the coach.
- Do not let the app prescribe sedatives, supplements, sleep restriction, or medical treatment.

### Rule boundary

**Auto-Coached may** reduce optional volume or choose an already-approved low-demand version when sleep is materially below the athlete's established baseline and no safety concern conflicts.  
**Auto-Coached may not** infer that one bad night means overtraining, prescribe a deload, or override a clinician's plan.

## 6. Subjective wellness and athlete voice

Subjective measures can be highly useful when collected consistently and interpreted longitudinally. Saw and colleagues found subjective measures reflected training load with greater sensitivity and consistency than commonly used objective measures in their cohort. That does not mean subjective reports are always more accurate; it means the app should not dismiss them as “just feelings.” ([Saw et al., PMID 26423706](https://pubmed.ncbi.nlm.nih.gov/26423706/))

### Product recommendations

- Use a small stable set of questions rather than rotating surveys.
- Preserve the exact athlete response and the time it was recorded.
- Ask “What changed?” after an unusual response; do not demand a numeric explanation.
- Let the athlete mark a response as “not sure” or “prefer not to answer.”
- Treat a skipped question as **unknown**, not healthy or unhealthy.
- Give the athlete a visible way to correct a misunderstanding or add context after a decision.

## 7. Active recovery, massage, compression, immersion, and cold

A systematic review and meta-analysis found that active recovery, massage, compression garments, immersion, contrast water therapy, and cryotherapy can reduce DOMS in some settings, while massage was among the more effective methods for DOMS and perceived fatigue. These findings concern short-term markers and perceptions; they do not establish that one method universally improves long-term adaptation or heals an injury. ([Dupuy et al., PMID 29755363](https://pubmed.ncbi.nlm.nih.gov/29755363/))

Repeated immediate cold-water immersion deserves a prominent caveat. A randomized study found smaller strength and muscle-mass gains in the cold-water group than in active recovery, and later reviews/meta-analyses report concerns about attenuated resistance-training adaptations. Cold may still have situational value when reducing soreness or preparing for closely spaced performance, but it should not be positioned as the default post-strength recovery action. ([Roberts et al., PMID 26174323](https://pubmed.ncbi.nlm.nih.gov/26174323/); [Broatch et al., PMID 29627884](https://pubmed.ncbi.nlm.nih.gov/29627884/); [Grgic et al., PMID 35068365](https://pubmed.ncbi.nlm.nih.gov/35068365/))

### Product recommendations

- Present modalities as a small “choose your recovery tool” menu tied to the goal: reduce soreness now, feel fresher for tomorrow, or maximize long-term adaptation.
- Explain the trade-off in one sentence before the athlete chooses.
- Never imply a modality repairs a tendon, muscle tear, bone, or illness.
- Ask whether the athlete has a medical contraindication before showing cold/heat suggestions.
- Track use and perceived effect as an experiment, not as a success requirement.

## 8. Nutrition, hydration, and low-energy-availability boundaries

Nutrition can explain training response, but it is a high-risk area for automated inference. The 2023 IOC REDs consensus describes a complex syndrome involving health and performance consequences of low energy availability and provides a clinical assessment/risk-stratification framework. The app must not diagnose RED-S from calorie logs, body weight, menstrual data, libido, mood, or training performance. ([Mountjoy et al., PMID 37752011](https://pubmed.ncbi.nlm.nih.gov/37752011/))

Recent commentary also emphasizes that energy availability is difficult to measure accurately enough for casual app diagnosis. ([Jeukendrup et al., PMID 39287777](https://pubmed.ncbi.nlm.nih.gov/39287777/))

### Product recommendations

- Let athletes record “under-fueled,” “well fueled,” “dehydrated,” “normal,” or “not sure” without requiring calorie tracking.
- If detailed nutrition is enabled, make it private by default and explicit who can see it.
- Use fuel data to explain context: “This session felt harder after a low-fuel day,” not “you failed nutrition.”
- Surface repeated patterns to the coach or dietitian only with athlete consent.
- Escalate persistent fatigue, recurrent illness, bone-stress concerns, disordered-eating signals, menstrual disturbance, or rapid weight change to an appropriate clinician/dietitian pathway.
- Do not automatically reduce food, recommend aggressive weight loss, or set supplement protocols.

# Part III — Load management and recovery monitoring

## 9. Use multiple load lenses

The IOC load consensus treats load broadly, including training, competition, psychological load, travel, and athlete well-being. The athlete-monitoring literature distinguishes external load from internal load and emphasizes that their relationship can reveal meaningful change. ([Soligard et al., PMID 27535989](https://pubmed.ncbi.nlm.nih.gov/27535989/); [Halson, PMID 25200666](https://pubmed.ncbi.nlm.nih.gov/25200666/); [Bourdon et al., PMID 28463642](https://pubmed.ncbi.nlm.nih.gov/28463642/))

### External load

Examples include:

- sets, reps, load, range, time under tension, total duration;
- distance, pace, power, heart-rate zones, intervals;
- jumps, sprints, accelerations, changes of direction;
- exercise-specific tissue or movement exposures;
- frequency, density, and number of hard days;
- competition, work, or other physical activity when the athlete chooses to record it.

### Internal load

Examples include:

- session RPE and session duration;
- exercise RPE/RIR and velocity loss when measured;
- perceived fatigue, soreness, pain response, sleep, stress, mood, and motivation;
- heart rate or HRV trends with source, freshness, and measurement quality;
- symptom burden and recovery time between sessions.

Session-RPE is attractive for the product because it is simple and has evidence as a practical measure of internal training load, but it is not a tissue-load measure and should not be confused with injury risk. ([Foster et al., PMID 11708692](https://pubmed.ncbi.nlm.nih.gov/11708692/); [Foster et al., PMID 33508782](https://pubmed.ncbi.nlm.nih.gov/33508782/))

## 10. Do not make ACWR the product's injury oracle

The app may calculate recent-versus-usual load if a coach wants it, but it should show the calculation as descriptive context. It must not state “your injury risk is 27%” from an ACWR band. Impellizzeri and colleagues state that there is no evidence supporting the use of ACWR in training-load decision making, and a systematic review found heterogeneous methods, populations, metrics, bins, and lag assumptions. ([Impellizzeri et al., PMID 32502973](https://pubmed.ncbi.nlm.nih.gov/32502973/); [Andrade et al., PMID 32572824](https://pubmed.ncbi.nlm.nih.gov/32572824/))

### Better product wording

Avoid:

> “Your acute:chronic ratio is dangerous.”

Use:

> “This week is materially higher than your recent recorded workload. That may be worth reviewing alongside pain, sleep, schedule, and actual performance. It does not diagnose injury or predict an individual outcome.”

### Better decision logic

The system should inspect:

1. absolute change in a relevant exposure;
2. distribution of hard days and recovery gaps;
3. divergence between external work and internal effort;
4. new or rapidly increased movement/tissue exposure;
5. pain, illness, and next-morning response;
6. missed or compressed sessions;
7. life stress, travel, work, and sleep when available;
8. whether the athlete has demonstrated tolerance to that exposure before.

No single item should silently determine a diagnosis or major plan rewrite.

## 11. Baselines, freshness, and uncertainty

The 2026 multidimensional monitoring review recommends interpreting readiness longitudinally using individual baselines and distribution-based thresholds while treating monitoring as decision support rather than a stand-alone determinant of performance. ([Rebelo et al., PMID 41824225](https://pubmed.ncbi.nlm.nih.gov/41824225/))

### Every signal needs four labels

| Label | Example |
|---|---|
| Source | Athlete, coach, wearable, sensor, imported activity, clinician |
| Age | Collected 5 minutes ago, yesterday, or 6 days ago |
| Confidence | Directly measured, self-reported, estimated, inferred, stale, missing |
| Scope | Today's session, recent week, long-term trend, or condition-specific protocol |

### Product rule

Never merge stale objective data with fresh subjective data and display a single green result. If the signal quality is poor, the result should say **“insufficient confidence”** and offer a safe low-complexity path.

# Part IV — Progressions, regressions, and substitutions

## 12. The product must preserve training intent, not exercise names

An exercise is not equivalent to an adaptation. “Leg press,” “front squat,” and “split squat” may all involve lower-limb force production, but they differ in joint angles, balance requirements, unilateral demand, range of motion, loading direction, velocity, and tissue exposure. A substitution engine that matches only a body-part label will create false equivalence.

The Coordinator should store a coach-authored **intent vector** for each prescription:

| Intent field | Examples | Why it matters |
|---|---|---|
| Primary adaptation | Max strength, hypertrophy, power, aerobic capacity, skill, tolerance | Defines what may not be lost in a substitution |
| Movement pattern | Squat, hinge, push, pull, carry, locomotion, rotation | Prevents generic body-part matching |
| Region and side | Knee-dominant, posterior chain, left shoulder | Enables side-specific constraints |
| Contraction and speed | Isometric, concentric/eccentric, ballistic, controlled | Changes tissue and fatigue exposure |
| Range of motion | Full tolerated, above parallel, limited, sport-specific | Makes a partial-ROM regression explicit |
| External dose | Load, repetitions, sets, distance, time, density | Defines the actual exposure |
| Internal target | RPE/RIR, heart-rate zone, talk test, technical quality | Makes autoregulation inspectable |
| Stability and complexity | Supported, free, single-leg, unstable, technical | Prevents a “lighter” option from being harder in another dimension |
| Equipment and environment | Barbell, cable, machine, pool, field, home | Determines feasible alternatives |
| Restrictions | Coach rule, clinician restriction, pain protocol, illness rule | Defines the authority boundary |

**Product inference:** a candidate substitution is acceptable only when the must-preserve fields match the coach’s policy. The app may suggest “same pattern, lower balance demand” or “same aerobic intent, lower impact,” but should not claim that two exercises are interchangeable in every respect.

## 13. What the evidence supports about progression dimensions

The ACSM progression position stand and earlier resistance-training guidance support progressive overload, specificity, individualization, and planned variation, but they do not create one universal progression sequence for every athlete or injury. ([ACSM progression models, PMID 19204579](https://pubmed.ncbi.nlm.nih.gov/19204579/); [Kraemer et al., PMID 15064596](https://pubmed.ncbi.nlm.nih.gov/15064596/))

| Dimension | What changes | Sensible use | Product caution |
|---|---|---|---|
| Load | External force or resistance | Strength stimulus when technique and symptoms are stable | A smaller weight is not automatically lower joint or tendon demand; leverage and ROM matter |
| Repetitions | Work per set | Adjusts local fatigue while preserving pattern | Do not infer equivalent stimulus across all rep ranges |
| Sets | Number of exposures | Controls weekly volume and a useful first regression lever | Volume is not just “more is better”; the response is individual and recovery-dependent |
| Range of motion | Joint excursion or depth | Useful for graded exposure or tolerance while retaining pattern | Partial ROM must be labelled as intentional; avoid implying it is universally safer |
| Tempo | Time under tension and movement speed | Can make technique, control, or a specific phase the target | Slow tempo can increase fatigue and local loading; “slow” is not synonymous with “safe” |
| Rest and density | Recovery between sets or bouts | Reduces cardiorespiratory and peripheral fatigue without changing the exercise | Shorter rest may turn a strength task into a conditioning task |
| Stability | Support, balance, and degrees of freedom | Useful when balance or coordination is the limiting factor | Machines and supported options can still be locally demanding |
| Complexity | Technical or decision demand | Appropriate when skill, speed, or environment is the target | Reduce complexity before changing the adaptation only when policy permits |
| Speed or velocity loss | Intentional speed and fatigue within a set | Useful for power or fatigue management when measured or reliably coached | The app should not pretend velocity is known without a validated measurement |
| Unilateral/bilateral arrangement | One side versus both sides | Can alter balance, coordination, side-specific dose, and cross-education | Unilateral work is not automatically a regression; it can create greater local damage or balance demand |
| Exercise variation | The movement used to express the intent | Needed for equipment, pain, environment, or variation | The substitution graph must expose what changed and what was preserved |

Research on low versus high loads suggests that a broad loading range can produce hypertrophy when effort and volume are appropriately managed, while heavier loading remains more specific to maximal strength. ([Schoenfeld et al., PMID 28834797](https://pubmed.ncbi.nlm.nih.gov/28834797/)) Failure is not a universal requirement for strength or hypertrophy; fatigue cost and technical breakdown must be considered. ([Grgic et al., PMID 33497853](https://pubmed.ncbi.nlm.nih.gov/33497853/)) Weekly volume has a dose-response pattern in group-level research, but the practical dose for a particular athlete should be individualized rather than mechanically maximized. ([Schoenfeld et al., PMID 27433992](https://pubmed.ncbi.nlm.nih.gov/27433992/); [Ralston et al., PMID 28755103](https://pubmed.ncbi.nlm.nih.gov/28755103/))

Velocity loss can quantify fatigue within a set in controlled settings, but this is a measurement and coaching problem, not a reason to invent a wearable-derived fatigue diagnosis. ([Sánchez-Medina & González-Badillo, PMID 21311352](https://pubmed.ncbi.nlm.nih.gov/21311352/)) RPE-based autoregulation is promising for matching dose to the athlete’s current state, with a still-developing evidence base and meaningful implementation variability. ([Helms et al., PMID 29786623](https://pubmed.ncbi.nlm.nih.gov/29786623/); [Hickmott et al., PMID 35038063](https://pubmed.ncbi.nlm.nih.gov/35038063/))

## 14. A regression ladder for the Coordinator

The ladder below is a product scaffold, not a medical protocol. The coach chooses which rungs are allowed for each exercise and athlete. The system should prefer the smallest change that resolves the stated problem while making any trade-off visible.

| Rung | Intervention | Preserves | Changes | Typical trigger |
|---|---|---|---|---|
| 0 | Keep the exercise; cap effort or stop at quality loss | Pattern, equipment, adaptation | Intensity of effort | Athlete is well but unexpectedly fatigued |
| 1 | Add rest or reduce density | Exercise and nominal dose | Fatigue accumulation | Rest is the apparent limiter |
| 2 | Reduce repetitions, time, distance, or sets | Pattern and often load | Volume | Symptoms or technique worsen with accumulated work |
| 3 | Reduce external load | Pattern, ROM, and often tempo | Force demand | The prescribed load is too demanding but the movement is tolerated |
| 4 | Reduce or alter ROM | Pattern and some intent | Excursion and tissue position | A defined part of the range is provocative, with no red flag |
| 5 | Change tempo or speed target | Pattern and ROM | Time under tension or velocity | Speed/coordination or control is the limiting factor |
| 6 | Add support or stability | Often pattern and target region | Balance/coordination demand | Stability, balance, or environment is the limiter |
| 7 | Change stance, grip, implement, or setup | Broad pattern | Leverage and local distribution | A coach-approved setup is less provocative or more feasible |
| 8 | Change unilateral/bilateral arrangement | Broad adaptation only if approved | Side-specific dose, balance, total load | Side-specific capacity or equipment requires it |
| 9 | Replace with a graph-approved variant | Declared intent fields | Exercise-specific exposure | Current exercise is unavailable or not tolerated |
| 10 | Remove the exposure and escalate | Safety | Training plan | Red flag, clinician restriction, or unresolved deterioration |

This sequence should not be hard-coded as a universal clinical order. For a tendon-loading protocol, reducing range may be preferable to reducing load; for a technical lift, reducing complexity may be preferable to adding fatigue; for illness, the correct regression may be no training. The policy attached to the prescription determines which rung is safe to offer.

### Progression gate

An automatic increase should require all of the following in the coach’s configured policy:

1. The athlete completed the intended exposure, or the actual exposure is explicitly accepted as an equivalent by the coach.
2. Technique or quality was within the defined tolerance.
3. The athlete’s effort was within the target band, or a deviation was explained.
4. Pain or symptoms were absent or within the exercise-specific protocol.
5. The next-morning response was not materially worse than baseline.
6. No illness, medication, clinician restriction, or unresolved data conflict is active.
7. The athlete has enough repeated exposure for the coach to regard the response as stable.

If any gate is unknown, the default should be **hold or ask**, not progress. In a first release, the Coordinator should be allowed to prepare a progression proposal and a rationale, but increases that change external load, total weekly volume, impact, speed, or a restricted exercise should require coach approval unless the coach has explicitly enabled a narrow rule.

## 15. Substitution logic: preserve the right things

The substitution library should present relationships, not a flat list:

| Candidate relation | Must preserve | May vary | Example wording |
|---|---|---|---|
| Same pattern, less complexity | Pattern, broad target, effort ceiling | Balance, support, implement | “Supported squat pattern; balance demand reduced” |
| Same pattern, different equipment | Pattern, ROM policy, internal target | Resistance curve, setup | “Cable row substituted for machine row; load is not carried across” |
| Same energy-system intent, less impact | Duration or work:rest policy, effort target | Surface, modality, impact | “Bike interval offered in place of running; running-specific exposure is not preserved” |
| Same side-specific intent | Side, side dose, symptom policy | Implement and position | “Left-side work retained; right side remains separate” |
| Same muscle-region intent, different pattern | Target region only | Pattern, balance, joint angles | Requires coach approval unless explicitly allowed |
| Temporary tolerance exposure | Coach-defined symptom rule and dose | Load, ROM, tempo | “Approved tendon exposure; next-morning response required” |

Every substitution receipt should answer four questions:

- What was the original intent?
- Which fields were preserved?
- Which fields changed?
- Who authorized the change, and when does it expire?

The receipt should never display “equivalent” without naming the dimension of equivalence. “Equivalent for lower-body volume” is materially safer than “same exercise.”

## 16. Unilateral and bilateral substitutions

Unilateral work may be useful for side-specific dosing, asymmetry management, balance, or maintaining training when one side is restricted. It is not automatically easier. A meta-analysis found differences in strength outcomes between unilateral and bilateral training that depend on the testing mode; cross-education can provide a strength benefit to an untrained limb, but it is not the same as restoring local tissue capacity. ([Liao et al., PMID 35959319](https://pubmed.ncbi.nlm.nih.gov/35959319/); [Manca et al., PMID 28936703](https://pubmed.ncbi.nlm.nih.gov/28936703/)) In one comparison, unilateral lower-body training produced more muscle-damage markers than bilateral training, which directly challenges a blanket “single-leg is a regression” rule. ([Isik et al., PMID 30709578](https://pubmed.ncbi.nlm.nih.gov/30709578/))

Product rules:

- Track left and right dose separately: sets, repetitions, load, RPE, symptoms, and quality.
- Do not silently halve or double a bilateral prescription when moving to unilateral work.
- Do not transfer the stronger side’s load to the symptomatic side.
- Allow the coach to specify “match the weaker side,” “match the prescribed side,” or “asymmetry is a review trigger.”
- Treat cross-education as a possible training effect, not proof that the restricted side is ready.
- If the substitution is made because of pain, keep the original exercise and reason visible in history.

## 17. Range of motion and tempo are separate controls

Full range of motion is often a useful default when it is tolerated, technically appropriate, and consistent with the athlete’s goal. Research on ROM and muscle adaptations does not support treating one ROM prescription as universally superior for every goal, body region, or injury. ([Pallarés et al., PMID 34170576](https://pubmed.ncbi.nlm.nih.gov/34170576/); [Schoenfeld & Grgic, PMID 32030125](https://pubmed.ncbi.nlm.nih.gov/32030125/))

The app should distinguish:

- **ROM unavailable:** the athlete could not access the intended position.
- **ROM intentionally modified:** the coach changed the target for a stated reason.
- **ROM not measured:** the app has no basis to claim what occurred.

Partial ROM can be a legitimate progression stage, a temporary tolerance strategy, or a different stimulus. It should not be labelled “safe,” “better,” or “equivalent” without a policy or evidence basis.

Tempo changes the time spent in phases of a movement, fatigue profile, and sometimes the adaptation emphasis. Evidence reviews describe meaningful effects of movement tempo but do not justify a universal slow-tempo safety rule. ([Wilk et al., PMID 34043184](https://pubmed.ncbi.nlm.nih.gov/34043184/)) A slower eccentric may be a coach-selected exposure, while a slow concentric may be an unplanned symptom or fatigue signal. The app should record the distinction.

## 18. Graded exposure should be explicit, bounded, and reversible

Graded exposure means progressing a defined demand in steps that can be observed and reviewed. It does not mean repeatedly forcing the athlete through pain until the app’s threshold is met. A useful exposure record contains:

- the demand being exposed: load, ROM, speed, impact, duration, or complexity;
- the current tolerated dose;
- the symptom rule, if a coach or clinician has supplied one;
- the immediate response;
- the later or next-morning response;
- the next decision: repeat, progress, regress, pause, or refer.

For persistent musculoskeletal pain, pain can be influenced by more than tissue damage, and carefully designed exercise can sometimes be performed with symptoms. That does not allow a general-purpose app to determine that a specific athlete’s pain is safe to continue. ([Caneiro et al., PMID 32907798](https://pubmed.ncbi.nlm.nih.gov/32907798/); [Smith et al., PMID 28596288](https://pubmed.ncbi.nlm.nih.gov/28596288/)) The coach-owned protocol must define the allowed symptom range and what counts as a flare.

Progress one main dimension at a time when the situation is uncertain. Changing load, ROM, speed, volume, and exercise simultaneously makes the response uninterpretable and weakens the next decision.

# Part V — Pain-aware training and traffic-light decisions

## 19. Pain, soreness, and symptoms are different data types

The app should never ask one vague question such as “How recovered are you?” and then treat the answer as a diagnosis. It should capture a small set of distinguishable observations.

| Data type | Useful description | What it can support | What it cannot establish |
|---|---|---|---|
| General soreness | Diffuse, often bilateral or muscle-specific tenderness after novel or demanding work; commonly peaks later rather than during the session | A lower-complexity recovery decision, movement choice, and monitoring | That a muscle is merely sore rather than injured |
| Pain during a movement | Location, side, onset, quality, severity, and movement relationship | A hold/regress decision and a reason to ask more questions | Tissue diagnosis or proof that continuing is safe |
| Pain at rest or night | Context, persistence, and change from baseline | Higher-priority review | A diagnosis from the rating alone |
| Swelling, bruising, warmth, deformity, or loss of function | Observable signs or athlete-reported changes | Escalation and affected-exposure stop | The exact structure involved |
| Neurological symptoms | Numbness, weakness, altered sensation, coordination change | Prompt clinical review | Localization or cause |
| Systemic illness symptoms | Fever, chills, marked malaise, chest symptoms, unusual breathlessness, palpitations, faintness | Illness stop/medical route | Whether the athlete can safely train from a readiness score |
| Next-morning response | Change in pain, stiffness, function, or general symptoms after the exposure | Protocol-specific progression or regression | A universal clearance decision |

The revised IASP definition describes pain as an unpleasant sensory and emotional experience associated with, or resembling that associated with, actual or potential tissue damage; pain is not a direct damage meter. ([Raja et al., PMID 32694387](https://pubmed.ncbi.nlm.nih.gov/32694387/)) DOMS is a distinct delayed response commonly associated with unaccustomed or eccentric exercise, but an app should not use timing alone to diagnose it. ([Cheung et al., PMID 12617692](https://pubmed.ncbi.nlm.nih.gov/12617692/); [Hotfiel et al., PMID 30537791](https://pubmed.ncbi.nlm.nih.gov/30537791/))

## 20. Traffic lights are a user-interface language, not a clinical classification

A traffic-light display can make a complex decision legible, but it becomes dangerous if the color is interpreted as “injury probability” or “medical clearance.” Use the traffic light to describe the **current action state** and show the evidence underneath it.

| State | Meaning | Default app action | Automatic progression? |
|---|---|---|---|
| Green — proceed | No new concerning symptom; current exposure is within the coach policy; data is sufficiently fresh | Show the session or approved adjustment | Only if all progression gates are satisfied |
| Blue/grey — unknown | Missing, stale, contradictory, or low-confidence data | Ask a short check-in; choose the conservative approved path; preserve the uncertainty label | No |
| Amber — caution | Mild, stable, local symptom or soreness with function intact and no red flag; or a first unexpected response | Hold or use a coach-approved regression; collect immediate and next-morning response | No; repeat/observe |
| Orange — review | Worsening trend, repeated next-morning flare, function loss, new swelling/bruising, illness symptoms, or conflicting signals | Stop the affected exposure; notify or queue coach/clinician review; provide safe non-affected options only if policy allows | No |
| Red — stop/escalate | Red flag or clinician restriction requiring immediate action | Stop affected training and direct urgent or appropriate medical route; do not offer a substitute that could delay care | Never |

Color should never be the only carrier of meaning. Pair it with a label, icon, text reason, and action. Use patterns or labels for color-vision accessibility. A green state should mean “proceed within this policy with this confidence,” not “the athlete is medically safe.”

## 21. A safe symptom check-in

The check-in should be short enough to complete, but structured enough to change the decision:

1. **Where?** Body region and side, using a body map and plain language.
2. **When?** At rest, during a specific movement, after training, on waking, or continuously.
3. **What changed?** Better, same, or worse than the athlete’s recent baseline.
4. **Function:** Can the athlete perform the relevant basic task normally, with limitation, or not at all?
5. **Visible/systemic signs:** Swelling, bruising, deformity, fever, chest symptoms, unusual breathlessness, faintness, palpitations, numbness, or sudden weakness.
6. **Context:** New exercise, unusual load, contact, fall, illness, medication change, travel, or missed training.

Numerical pain ratings can be useful within a known protocol, but they should not be the only input. A “2/10” with new weakness or a sudden pop is not a green result; a higher rating in a known clinician-directed tendon protocol may not automatically be a red result. The app should ask the policy question, not pretend a universal number answers it.

## 22. Traffic-light rules for general fitness versus a named rehab protocol

### General fitness mode

In general fitness mode, the app may:

- record symptoms and context;
- stop or reduce the affected exercise under a coach-authored rule;
- offer only pre-approved substitutions;
- monitor the next-morning response;
- flag repeated or worsening patterns;
- ask the athlete to contact a coach or clinician.

It should not diagnose DOMS, tendinopathy, strain, sprain, stress injury, concussion, or a cardiopulmonary condition.

### Protocol mode

In a clinician- or coach-authored protocol, the system may apply a stated threshold for a stated body region, exercise, dose, and time horizon. For example, an Achilles pain-monitoring model used continued sports participation with pain during activity kept below 5/10, allowed some post-exercise pain, and required that symptoms settle by the next morning without week-to-week worsening. ([Silbernagel et al., PMID 17307888](https://pubmed.ncbi.nlm.nih.gov/17307888/)) That model is a condition-specific research protocol; it is not a universal app-wide rule and should be shown with its source, owner, and expiry.

The system must refuse to generalize a tendon rule to a new pain location, a traumatic event, systemic symptoms, or a different diagnosis. It must also allow the clinician or coach to choose a stricter rule, including pain-free execution, when clinically appropriate.

## 23. Tendon loading: useful evidence, narrow claims

Progressive loading is central to many tendinopathy rehabilitation programs, but the exact exercise, load, frequency, pain tolerance, and return criteria are individualized. Achilles studies support progressive loading and show that heavy slow resistance and eccentric approaches can both be effective; this does not mean the app can identify Achilles tendinopathy or select the right program from a pain label. ([Malliaras et al., PMID 23494258](https://pubmed.ncbi.nlm.nih.gov/23494258/); [Beyer et al., PMID 26018970](https://pubmed.ncbi.nlm.nih.gov/26018970/)) Patellar tendon research likewise supports progressive tendon-loading strategies, but the intervention is a structured rehabilitation program, not a generic “push through” prompt. ([Breda et al., PMID 33219115](https://pubmed.ncbi.nlm.nih.gov/33219115/); [Malliaras et al., PMID 26390269](https://pubmed.ncbi.nlm.nih.gov/26390269/))

Isometric exercise should not be marketed as a universal pain-relief switch. A systematic review found no immediate pain-relieving superiority for isometrics in Achilles tendinopathy. ([van der Vlist et al., PMID 32474979](https://pubmed.ncbi.nlm.nih.gov/32474979/)) The app may expose an isometric option only when it is part of an approved progression graph.

## 24. Muscle injury and the return boundary

A sudden sprint-related pain, pop, bruising, acute loss of force, or major ROM loss is not a “soreness” state for the Coordinator to resolve. Muscle injury classification and return-to-sport work use clinical examination, injury location and severity, function, strength, and sport demands. ([Valle et al., PMID 27878524](https://pubmed.ncbi.nlm.nih.gov/27878524/); [Pollock et al., PMID 26888072](https://pubmed.ncbi.nlm.nih.gov/26888072/)) Hamstring rehabilitation literature emphasizes progressive, criterion-based rehabilitation and exposure to high-speed running before return, not a calendar-only rule. ([Heiderscheit et al., PMID 20118524](https://pubmed.ncbi.nlm.nih.gov/20118524/); [Erickson & Sherry, PMID 30356646](https://pubmed.ncbi.nlm.nih.gov/30356646/); [Hickey et al., PMID 28035586](https://pubmed.ncbi.nlm.nih.gov/28035586/))

Fitness-app boundary: it may record the athlete’s report, preserve the affected-side history, show a coach-authored staged plan, and prevent progression while a restriction is active. It may not grade the injury, predict recurrence, or clear high-speed or contact exposure.

## 25. Red flags and escalation boundaries

The following deterministic states should stop the affected training and require a clinician- or emergency-directed route according to severity and local policy:

- chest pain, fainting, new palpitations, severe or unusual breathlessness, or exercise intolerance that is disproportionate to the session;
- fever or systemic illness with marked malaise, dehydration, confusion, or rapidly worsening symptoms;
- sudden pop followed by deformity, major swelling, bruising, inability to bear weight, or abrupt loss of function;
- severe or rapidly escalating pain, pain after significant trauma, suspected fracture or dislocation;
- new neurological deficit, progressive numbness, loss of coordination, or unexplained marked weakness;
- suspected concussion or head injury symptoms;
- suspected bone stress injury, persistent focal bony pain, or pain that worsens with impact and does not settle;
- a clinician-imposed restriction, post-operative protocol, fracture or stress-injury plan, or medication-related exercise restriction;
- symptoms suggesting an eating-disorder or low-energy-availability risk that exceeds the app’s support scope.

The exact emergency wording and regional referral path must be configurable and legally reviewed. The app should not create false reassurance by offering a gentle substitute immediately after a red flag. It should show the reason, the scope of the stop, what the athlete should do next, and whether a coach has been notified.

# Part VI — Missed sessions, detraining, retraining, and return-to-training

## 26. A missed session is an event, not a missing workout to repay

The product should distinguish why the planned session did not become an actual session:

| Event | Record | Default consequence |
|---|---|---|
| Not scheduled or plan changed before the day | Planned version and change reason | No adherence penalty; use the current plan |
| Scheduling miss with no symptom | Missed session, stated reason if known | Consider a safe move only if sequence, rest, and anchors remain valid |
| Incomplete session | Actual sets/time/distance and stopping point | Do not impute the unperformed dose; decide whether to repeat or move on |
| Pain or symptom stop | Exercise, symptom, side, function, and stop point | Safety review; no catch-up or progression until resolved by policy |
| Illness stop | Symptoms and date, with no diagnosis inferred | Illness return path; no catch-up |
| Equipment or environment failure | Feasibility reason | Offer an approved substitute if the intent graph allows it |
| Data or sync failure | Missing-data incident | Mark unknown; do not turn absence of data into “completed” |
| Athlete chose rest | Rest decision and context | Preserve agency; check whether a recovery or coach conversation is needed |

The planned-versus-actual ledger should make this visible. The athlete should not receive a guilt message for a clinically appropriate stop, and the coach should not mistake an absent record for non-compliance.

## 27. Default missed-session handling rules

These rules are conservative product defaults. The coach can configure a narrower or more specific policy; the app must not broaden it silently.

1. **One isolated scheduling miss, symptom-free:** preserve the missed event. A same-week move may be proposed only if the required rest interval, session order, recovery anchors, and weekly load cap still pass. Never double the next session automatically.
2. **Incomplete session:** record actual work only. Do not backfill the prescription, score the athlete as complete, or add an automatic catch-up set.
3. **Pain- or illness-related miss:** do not catch up. Route to the relevant check-in and return policy. Protect recovery and safety over weekly completion.
4. **Compressed week:** if moving the session would create back-to-back hard exposures or exceed a coach-defined dose, keep it missed and show the trade-off.
5. **Two or more misses, or a meaningful time gap:** create a re-entry review rather than restoring the last planned dose automatically.
6. **Conflicting records:** preserve both planned and actual states; send the conflict to review instead of choosing the more flattering value.

The app can recommend “resume the next scheduled exposure” or “repeat the last stable exposure,” but “make up the missed session” should not be a default action.

## 28. What detraining evidence actually supports

Short-term detraining reviews report that cardiorespiratory adaptations can decline faster than strength, while the magnitude and timing depend on the athlete, training status, type of adaptation, and the length and nature of the interruption. ([Mujika & Padilla, PMID 10966148](https://pubmed.ncbi.nlm.nih.gov/10966148/)) Long-term detraining can reduce a broader set of adaptations, but it is not a linear reset to zero. ([Mujika & Padilla, PMID 10999420](https://pubmed.ncbi.nlm.nih.gov/10999420/))

In a controlled resistance-training study, substantially reduced maintenance doses retained much of the strength adaptation for young adults during the study period, while hypertrophy responses were more sensitive to the reduction and age-related differences mattered. ([Bickel et al., PMID 21131862](https://pubmed.ncbi.nlm.nih.gov/21131862/)) Reviews of minimal-dose training reach the practical conclusion that a small amount of well-chosen work can preserve some performance, but there is no single maintenance dose for every adaptation or athlete. ([Spiering et al., PMID 33629972](https://pubmed.ncbi.nlm.nih.gov/33629972/); [Fyfe et al., PMID 34822137](https://pubmed.ncbi.nlm.nih.gov/34822137/)) A recent periodic-versus-continuous resistance-training trial found that detraining losses were regained rapidly during retraining and that final outcomes were similar in that study, while still not validating a universal re-entry algorithm. ([Halonen et al., PMID 39364857](https://pubmed.ncbi.nlm.nih.gov/39364857/))

**Product implication:** the app should not say “you lost 23% of your fitness” from calendar time. It should say which capacity is uncertain, what evidence is available, and what conservative exposure will test readiness.

## 29. Re-entry bands: transparent heuristics, not clinical thresholds

The following bands are interface defaults for symptom-free planned training interruptions, not evidence-derived universal cutoffs. Coaches must be able to override them, and any illness or injury route supersedes them.

| Time since last comparable exposure | App posture | Suggested next step |
|---|---|---|
| 0–3 days | Usually preserve the planned pattern if the athlete is symptom-free and the warm-up response is normal | Use a brief quality/RPE check; do not force a personal best |
| 4–14 days | Treat readiness as less certain, especially for high-intensity, high-impact, or highly technical work | Repeat or modestly reduce the last stable exposure; inspect response before progressing |
| 2–4 weeks | Use a re-entry block rather than restoring peak planned volume | Reduce one or more exposure dimensions; progress after repeated stable sessions |
| More than 4 weeks | Refresh baseline and review the reason for the interruption | Coach-approved re-entry; add clinician input for illness, injury, surgery, or unusual symptoms |

These bands should be labelled **heuristic** in the product. The exact reduction should be selected by the coach or a validated, adaptation-specific policy; the app should not pretend there is a PubMed-validated “return at 70%” rule for all training.

## 30. Retraining should test tolerance before chasing lost performance

The re-entry sequence should prioritize:

1. normal movement and technical quality;
2. a manageable internal effort;
3. the next-morning response;
4. repeated exposure at the same dose;
5. one progression dimension at a time;
6. only then the performance target.

A prior best is historical context, not a current prescription. The app should show the athlete’s last stable exposure, the planned re-entry exposure, and the reason for the difference. It should not frame the difference as failure.

## 31. Return after illness

Return after illness is not the same as return after a missed workout. Acute respiratory infection symptoms and duration vary widely, and a systematic review found no universal evidence-based number of days that clears all athletes for return. It also challenged the scientific basis of the popular “neck check” rule. ([Snyders et al., PMID 34789459](https://pubmed.ncbi.nlm.nih.gov/34789459/); [BJSM version](https://bjsm.bmj.com/content/56/4/223))

IOC consensus guidance supports a symptom- and severity-informed approach to acute respiratory infections, with monitoring for abnormal responses during graded return. ([IOC ARI consensus, PMID 35863871](https://pubmed.ncbi.nlm.nih.gov/35863871/); [IOC non-infective ARI consensus, PMID 35623888](https://pubmed.ncbi.nlm.nih.gov/35623888/)) Febrile illness guidance does not support returning before fever has resolved; rehydration and gradual resumption are important. ([Dick et al., PMID 24790692](https://pubmed.ncbi.nlm.nih.gov/24790692/))

### Illness rules for the app

- No training recommendation during fever, significant dehydration, marked systemic illness, or symptoms that are rapidly worsening.
- The app may offer rest, hydration prompts, and a later check-in; it must not prescribe a medical treatment plan.
- Once the athlete reports that acute systemic symptoms have resolved and no clinician restriction is active, the app can display a coach-authored graded return, beginning below the normal exposure and using symptom response as a gate.
- Chest pain, fainting, palpitations, unusual breathlessness, or disproportionate exercise intolerance requires medical review rather than a lighter substitute.
- The app must not use a wearable recovery score to override illness symptoms.
- The app should record the date of symptom resolution and the first few return exposures without converting them into a diagnosis.

## 32. Return after injury, surgery, fracture, concussion, or stress injury

Return-to-sport consensus work distinguishes return to participation, return to sport, and return to performance; the final decision is a multidimensional clinical and performance decision rather than a single time point. ([Ardern et al., PMID 27226389](https://pubmed.ncbi.nlm.nih.gov/27226389/)) ACL consensus recommendations emphasize criteria-based progression, including strength, movement, psychological readiness, and sport-specific demands, rather than time alone. ([Meredith et al., PMID 34006577](https://pubmed.ncbi.nlm.nih.gov/34006577/); [Myer et al., PMID 16776488](https://pubmed.ncbi.nlm.nih.gov/16776488/))

For bone stress injury, the management and return process is diagnosis- and site-dependent, with staged loading and clinical assessment. ([Warden et al., PMID 25103133](https://pubmed.ncbi.nlm.nih.gov/25103133/)) Concussion return-to-play decisions are governed by specific clinical guidance and should not be reduced to a generic pain or readiness flow. ([AMSSM position statement, PMID 23243113](https://pubmed.ncbi.nlm.nih.gov/23243113/))

The product may support these pathways only as a structured record and display layer:

- clinician or qualified coach enters the restriction, stage, permitted activities, and review date;
- Coordinator prevents any action that exceeds the restriction;
- athlete logs symptoms and actual exposure;
- coach/clinician reviews stage criteria and advances the athlete;
- every transition has an owner, source, date, and expiry.

It must not infer clearance from “pain is lower,” a completed workout, a normal wearable signal, or elapsed calendar time.

## 33. Tendon and muscle return paths are not interchangeable

Tendon loading often uses repeated, progressive capacity exposures and may have a different symptom-monitoring rule than acute muscle injury. Muscle injury return may require restoration of ROM, strength, acceleration, maximum-speed exposure, and sport-specific actions. A substitution that is reasonable for one tissue or stage can be inappropriate for another. The exercise graph therefore needs a **protocol context** field, not only a body region.

When no protocol context exists, the system should fall back to the general safety route: stop the affected exposure if symptoms are concerning, preserve the record, and ask for review.

# Part VII — Deterministic Coordinator rules and approval boundaries

## 34. Decision priority

When signals conflict, the Coordinator should resolve them in this order:

1. Emergency or urgent safety signal.
2. Active clinician restriction or return-to-training protocol.
3. Fever, systemic illness, or cardiopulmonary warning.
4. New, worsening, or function-limiting pain/symptoms.
5. Exercise-specific technique or quality failure.
6. Recent load, missed sessions, and re-entry status.
7. Recovery context: sleep, stress, travel, nutrition/hydration, and subjective wellness.
8. Coach-authored plan intent and progression target.
9. Adherence, schedule efficiency, and performance goals.

This order is a product safety policy, not a diagnosis hierarchy. The app should show the higher-priority reason whenever it blocks a lower-priority goal: “Progression paused because the athlete reported new weakness,” not “readiness score reduced.”

## 35. What Auto-Coached may do, if explicitly enabled

Auto-Coached is bounded delegation. It may perform a low-risk, reversible action only when the coach has supplied the relevant policy and the data is sufficiently current:

- hold the current prescription;
- reduce optional sets, distance, or density within a coach-defined cap;
- lower load to a coach-defined effort ceiling;
- add rest between sets or bouts;
- select a pre-approved substitution that preserves declared intent fields;
- shift a session within a permitted scheduling window without creating a hard-day conflict;
- mark a session as re-entry and show the reduced exposure;
- prompt the athlete for a missing safety check-in;
- pause an affected exercise and queue a coach review;
- preserve a recovery or deload anchor;
- surface a referral or urgent action message when a red-flag rule is triggered.

Every automatic action must be reversible, scoped, and time-limited. “Reduce volume by 20% for this session” is bounded; “train easier until recovered” is not.

## 36. What should require coach approval

The following changes should require coach approval unless a narrow, pre-authorized policy explicitly covers the exact situation:

- any increase in load, volume, impact, speed, intensity, or weekly density;
- changing the target adaptation or replacing a strength/power/sport-specific task with a generic alternative;
- a substitution outside the approved exercise graph;
- changing unilateral/bilateral side dose or deciding how to handle an asymmetry;
- repeated regressions across sessions or a plan-wide rewrite;
- returning to a high-intensity, high-speed, contact, or maximal exposure after illness or injury;
- changing a pain-monitoring threshold or allowing symptoms beyond the protocol;
- overriding a coach or clinician restriction;
- interpreting a persistent symptom, injury pattern, illness, or wearable abnormality;
- changing a post-operative, fracture, stress-injury, concussion, or medication-related plan;
- interpreting nutrition, low energy availability, eating-disorder risk, or supplements as a medical intervention.

## 37. What must require clinician approval or medical direction

The app should not make the following a coach-only or automation decision:

- diagnosis or grading of an injury;
- clearance after surgery, fracture, suspected bone stress injury, concussion, cardiac symptoms, or significant systemic illness;
- return to impact, sprinting, contact, maximal lifting, or competition when a clinical restriction is active;
- interpretation of neurological deficits, severe trauma, unexplained weakness, or persistent night/rest pain;
- changes to a rehabilitation protocol supplied by a clinician;
- decisions involving suspected RED-S/low energy availability, eating-disorder symptoms, or clinically significant weight/fueling concerns;
- medication, supplement, or treatment recommendations.

The product can make a clinician’s instruction more usable; it cannot become the clinician by attaching a color to a self-report.

## 38. Explicitly forbidden inference

The Coordinator must not:

- diagnose a tissue or condition from pain location, exercise response, or wearable data;
- compute or display an “injury probability” as if validated for the individual;
- treat an ACWR value as a causal injury threshold or a safety guarantee;
- treat HRV, resting heart rate, sleep, readiness, or a single questionnaire as a medical clearance;
- fill in missing sets, reps, symptoms, or recovery data with an estimate and label it completed;
- infer that no report means no pain;
- infer that pain means tissue damage or that no pain means tissue readiness;
- use a universal traffic-light threshold across conditions;
- claim that a substitution is equivalent without naming the preserved adaptation and changed exposure;
- tell the athlete to “push through” a red flag or to ignore a clinician restriction;
- silently change the training goal, weekly structure, or progression logic;
- recommend medication, supplement dosing, or medical treatment.

## 39. Action receipt: the audit object every adaptation needs

For each material change, show:

| Field | Example |
|---|---|
| Original | “Back squat, 4 × 5 at coach target” |
| Actual trigger | “Athlete reported left knee pain during descent; function intact” |
| Evidence | Athlete report, timestamp, prior response, coach policy version |
| Decision | “Reduce ROM and hold load for this session” |
| Preserved | Squat pattern, bilateral intent, effort ceiling |
| Changed | ROM, progression status |
| Authority | Auto-Coached under coach policy v3.2 |
| Confidence | Moderate; self-report current, movement not observed |
| Scope | Today’s session only |
| Expiry/review | Next-morning response or coach review |
| Undo | “Restore original prescription” if policy permits |

This is the difference between adaptive coaching and opaque modification. The athlete sees a concise version; the coach can open the full evidence and policy trail.

## 40. Abstention is a successful outcome

The Coordinator should have explicit outcomes besides “prescribe” and “fail”:

- proceed;
- hold;
- regress within policy;
- substitute within policy;
- ask for missing information;
- queue coach review;
- require clinician review;
- stop and escalate.

“Insufficient confidence to change the plan” is a valid, measurable product outcome. The system should record why it abstained and whether a human later agreed.

# Part VIII — Product architecture for a sophisticated but simple coaching app

## 41. Separate the objects that are currently easy to confuse

The app should have distinct records for:

1. **Plan intent:** what the coach wants to develop and why.
2. **Assigned prescription:** what was scheduled for this athlete on this date.
3. **Actual result:** what the athlete really completed, including partial work.
4. **Context:** symptoms, illness, sleep, stress, travel, equipment, and other relevant conditions.
5. **Intervention:** a substitution, regression, progression, rest change, or schedule move.
6. **Resolution:** who made the change, under which policy, with what confidence and expiry.
7. **Observation:** immediate, next-morning, weekly, or longer-term response.
8. **Referral/restriction:** clinician instruction, review request, or safety stop.

The Week in Review and athlete check-in work already establish this separation. This research lane adds the minimum objects needed to keep pain-aware adaptation honest. A completed exercise should never overwrite the original prescription; a coach decision should never be indistinguishable from an athlete result.

## 42. Exercise graph, not exercise list

Each exercise node should include:

- movement pattern and primary adaptation;
- body region and side;
- equipment and environment;
- joint position and ROM tags;
- load direction and likely external exposure;
- stability and coordination demand;
- contraction and speed characteristics;
- impact/contact classification;
- coach-approved substitutes and prohibited substitutions;
- protocol contexts in which it is allowed;
- evidence notes and confidence;
- setup and technique cues;
- what the substitution does not preserve.

The graph should support one-to-many relationships but should not rank alternatives as medically safer without evidence. It should rank them by the coach’s declared intent and constraints: “best equipment match,” “lowest balance demand,” “same unilateral side,” or “lowest impact,” each with its own label.

## 43. Policy library and safety contracts

Every adaptation rule should be a versioned policy with:

- owner;
- applicable athlete group or individual;
- applicable exercise and protocol context;
- allowed inputs;
- allowed actions;
- hard stops;
- escalation path;
- confidence and evidence label;
- review date;
- expiry behavior;
- athlete-facing explanation;
- coach-facing override and reason.

Examples include “missed-session move,” “symptom-free re-entry,” “coach-approved Achilles pain-monitoring protocol,” and “no impact after clinician restriction.” A general readiness rule should not be allowed to override a condition-specific policy.

## 44. Provenance and uncertainty should be first-class

The system should visually distinguish:

- athlete-reported from coach-observed;
- measured from estimated;
- current from stale;
- complete from partial;
- observed from inferred;
- approved from proposed;
- general fitness policy from clinical protocol.

These labels prevent the app from projecting false precision. An inferred “high fatigue” state based on sleep and RPE is fundamentally different from a clinician-recorded restriction. Both may appear in the same timeline, but they should not have the same authority.

## 45. Version history and reversibility

Each plan and session needs a visible version history:

- original coach intent;
- changes before the session;
- changes during the session;
- actual work;
- later review;
- whether the decision was accepted, overridden, or undone.

The user interface should show the current state first and let the user open the decision receipt. The data model must retain the original state for research, audit, and trust. “Undo” should reverse the intervention when safe; it should not erase the fact that it happened.

# Part IX — Information architecture: depth behind a calm surface

## 46. Design principle: deep system, shallow surface

The app can be highly sophisticated if the default view answers only five questions:

1. What do I do now?
2. What changed?
3. Why did it change?
4. What should I watch for next?
5. Who needs to review it?

Everything else can live behind progressive disclosure. The athlete should not need to understand the evidence hierarchy, policy engine, or exercise graph to complete a session. The coach should be able to open those layers when a decision deserves scrutiny.

## 47. Athlete information architecture

### Home: “Today”

One primary card:

- session name and time;
- one-line intent (“build lower-body strength with controlled effort”);
- current status: ready, caution, unknown, review, or stop;
- one action: Start, Check in, Resume, or Contact coach.

Under the card, show only three compact rows:

- **Changed:** what differs from the plan;
- **Why:** the trigger and confidence;
- **Next:** what to report after training or tomorrow morning.

### Session screen

Use a fixed grammar for every exercise:

1. Goal.
2. Prescription.
3. One coaching cue.
4. Optional “adjust” button.
5. Actual result.
6. Quick symptom/quality check.

If an adjustment occurs, show a quiet banner: “Adjusted for current knee response — ROM reduced, load held.” Tapping the banner opens the receipt. Do not put a large red warning on every ordinary adjustment; reserve high-salience treatment for real safety states.

### End-of-session screen

Ask only what can change the next decision:

- completed, partial, stopped, or substituted;
- overall effort;
- symptom location/side and change from baseline;
- unusual response or red-flag screen;
- optional note.

Show “tomorrow morning check” as a clear, separate step rather than pretending the immediate response is the entire recovery picture.

### Re-entry screen

Use a small three-step wizard:

- reason for time off;
- last stable exposure and proposed first exposure;
- response gate and next review date.

The athlete should see “re-entry is not a penalty” language when appropriate. The product should make the safe choice feel like normal coaching, not failure.

## 48. Coach bench information architecture

The coach’s default workspace should be a triage surface, not a dashboard of every metric.

### Header: “Needs attention”

Sort by action priority:

- red/urgent safety;
- active clinician restriction;
- illness or concerning symptoms;
- unresolved pain trend;
- missed/re-entry review;
- substitution or progression proposal;
- ordinary plan edits.

Each row contains athlete, session, signal, current action, confidence, age of data, and owner. One click opens the action receipt.

### Week ledger

Show planned, assigned, actual, changed, missed, and pending—not one completion percentage. Allow filtering by athlete, block, movement pattern, side, body region, and policy state.

### Decision queue

Group similar decisions: “3 athletes have a new right-knee symptom,” “5 sessions are awaiting next-morning response,” “2 substitutions changed unilateral exposure.” This helps the coach see patterns without hiding individual context.

### Deep inspect

The coach can open:

- the evidence timeline;
- the exercise graph and preserved intent;
- the relevant policy and source;
- the original prescription versus actual;
- athlete notes and response trend;
- what Auto-Coached did and what it abstained from.

## 49. Visual system recommendations

- Use a calm neutral canvas with one primary accent for active coaching and semantic states for caution/review/stop.
- Never rely on red and green alone; always include text and an icon or pattern.
- Use one typography scale with large numbers only when a number drives a decision.
- Keep the primary action in the same location across screens.
- Use cards for decisions, not for every piece of data.
- Use drawers or bottom sheets for evidence, policy, and history.
- Make status labels sentence-like: “Hold load and repeat exposure,” not “amber 0.62.”
- Keep charts sparse: one trend, one baseline, one annotation, one action.
- Show a trend only when it changes a decision; otherwise show the last stable value.
- Use whitespace to separate safety, coaching, and history layers.
- Use microcopy that respects agency: “You reported…”, “The plan changed because…”, “Ask your coach before…”.
- Provide compact and comfortable density modes for coach and athlete contexts.
- Ensure tap targets, contrast, screen reader labels, keyboard navigation, and color-vision patterns are built into the system.

## 50. The recurring card grammar

Every adaptive card can use the same five-line structure:

**Status** — what state is active.

**Intent** — what the original plan was trying to achieve.

**Change** — what is different now.

**Reason** — source, confidence, and policy.

**Next** — the one action or review required.

This grammar is simple enough for athletes and deep enough for coach audit. It should appear in daily coaching, substitutions, missed sessions, recovery, and Week in Review.

## 51. Feature map: sophisticated capabilities behind simple entry points

| Module | Athlete-facing simplicity | Coach-facing depth |
|---|---|---|
| Onboarding | “What are you training for, and what should we protect?” | Goals, constraints, schedule, equipment, baseline confidence, referral needs |
| Check-in | 30-second safety and capacity check | Trend, context, missingness, alert threshold, review history |
| Session coach | Start, follow, adjust, report | Intent vector, substitution graph, policy receipt, audit |
| Recovery | Sleep/stress/fueling/context prompts | Multidimensional pattern view, no single readiness oracle |
| Progression | “Repeat or move forward” | Exposure dimensions, stable repetitions, proposal queue |
| Regression | “Here is the approved easier option” | What was preserved, what changed, expiry, reason |
| Substitution library | “Why this option?” | Graph edges, contraindications, equipment and side constraints |
| Return to training | “First exposure after time off” | Stage, criteria, restriction, owner, review date |
| Week in Review | Planned, actual, changed, next | Reconciliation, trend, decisions, unanswered questions |
| Coach bench | Needs attention first | Caseload triage, bulk patterns, athlete drill-down |
| Integrations | Imported context with source labels | Freshness, conflict resolution, permission, data quality |
| Safety center | Clear stop/review instruction | Policy authoring, escalation path, clinical handoff |

# Part X — Comprehensive product suggestions and launch checklists

## 52. Core product suggestions

### A. Make the coaching loop explicit

Keep the product loop as:

**Plan → Schedule → Train → Log → Recover → Review → Progress**

Add a visible exception loop:

**Signal → Protect → Explain → Review → Return**

The exception loop should feel like part of normal coaching. It should not be hidden in an error screen or treated as a failed workout.

### B. Add a “policy before prediction” layer

Before an algorithm offers any adjustment, it should know:

- what the coach intended;
- what the athlete is allowed to do;
- what the athlete reported;
- what data is missing or stale;
- which rule applies;
- what the action will preserve and change.

If one of these is absent, the interface should shift from “recommendation” to “question” or “review.”

### C. Build an intent-preserving substitution library

Do not launch with thousands of exercises and weak equivalence. Launch with a smaller, curated library that has high-quality tags, coach ownership, and visible trade-offs. A substitution should be searchable by:

- adaptation;
- movement pattern;
- side;
- equipment;
- impact;
- stability;
- ROM;
- speed;
- symptom or restriction policy;
- environment.

### D. Create a single source of truth for each session

The athlete sees the current prescription, but can open the original plan and every change. The coach sees the same event history with more evidence. The app should not have separate “athlete truth” and “coach truth.” It should have different views of the same versioned record.

### E. Make uncertainty a designed state

Use “Unknown” and “Needs review” as first-class visual states. Avoid fake precision such as a readiness number with two decimal places. When a wearable is not synced, the athlete is not automatically recovered or un-recovered; the app should ask or use a conservative rule.

### F. Treat recovery as a portfolio, not a marketplace of hacks

Prioritize sleep opportunity, manageable load distribution, adequate fueling/hydration, stress/context, and active recovery options before selling or foregrounding modalities. Sleep consensus guidance supports individualized sleep assessment, while reviews of recovery techniques show modality-specific and often modest effects. ([Walsh et al., PMID 33144349](https://pubmed.ncbi.nlm.nih.gov/33144349/); [Fullagar et al., PMID 25315456](https://pubmed.ncbi.nlm.nih.gov/25315456/); [Dupuy et al., PMID 29755363](https://pubmed.ncbi.nlm.nih.gov/29755363/))

Cold-water immersion can reduce soreness or perceived recovery in some contexts, but repeated post-resistance use may attenuate anabolic signaling or some adaptation outcomes; the app should present it as an optional context-dependent tool, not a universal recovery upgrade. ([Roberts et al., PMID 26174323](https://pubmed.ncbi.nlm.nih.gov/26174323/); [Grgic et al., PMID 35068365](https://pubmed.ncbi.nlm.nih.gov/35068365/))

### G. Put the “why” one tap away

Every change should have a human-readable sentence:

> “Your planned split squat was replaced with a supported split squat today. The pattern and side were preserved; balance demand was reduced because you reported right-ankle instability. Recheck before progressing.”

This is more useful than exposing a model score. The coach can open the evidence behind the sentence.

### H. Design for the next-morning response

Many training responses are not settled when the session ends. Add a lightweight next-morning check for:

- local symptom change;
- stiffness or function;
- general illness symptoms;
- perceived recovery;
- whether the previous regression felt appropriate.

Do not use this check to diagnose or to force a progression. Use it to decide whether to repeat, hold, regress, or ask.

### I. Give missed sessions a respectful workflow

The athlete should choose “missed,” “partial,” “stopped for symptoms,” “ill,” or “could not access equipment.” The app should then offer one safe next step. It should never show an automatic punishment, a red adherence score, or an inflated catch-up session.

### J. Make re-entry a first-class feature

Add a “return after time off” entry point from the home screen and coach bench. It should be available for ordinary breaks but immediately hand off to a clinician/coach-owned path for illness, injury, surgery, fracture, concussion, stress injury, or persistent symptoms.

### K. Preserve the athlete’s agency

Use “You reported,” “You can choose,” and “Ask your coach” language. Let the athlete disagree with an inferred state, but retain the original report and require a reason when overriding a safety stop. Agency is not the same as allowing the athlete to bypass a hard clinical restriction.

## 53. Athlete onboarding requirements

- Training goals and priority adaptation.
- Current weekly schedule and non-negotiable anchors.
- Training history and recent interruptions.
- Equipment, location, and environmental constraints.
- Preferred coaching tone and level of detail.
- Known clinician restrictions or active rehabilitation protocol.
- Current injuries or symptoms, without asking the app to diagnose them.
- Illness and return-to-training status.
- Sleep opportunity, shift work, travel, and life-stress context where relevant.
- Fueling constraints and any reason nutrition requires specialist support.
- Consent for data sources, wearable freshness, and coach visibility.
- Emergency and local referral copy reviewed for the user’s region.

The onboarding result should be a compact contract: goals, protected constraints, schedule, data permissions, and what Auto-Coached may or may not change.

## 54. Daily check-in requirements

- Current pain/symptom status, body region, side, and function.
- Illness/systemic screen.
- Sleep opportunity and subjective recovery.
- Optional stress, travel, and unusual-load context.
- A “prefer not to answer” path that does not fabricate a green state.
- Adaptive question branching: ask more only when the first answer changes the safety state.
- A visible “why we are asking” explanation.
- Clear stop/review instruction for red flags.

## 55. Session-adaptation requirements

- Show intent before prescription details.
- Make the warm-up an observation point, not an automatic diagnosis.
- Allow athlete-reported quality, effort, symptoms, and equipment constraints.
- Offer only approved regression/substitution options.
- Keep load, volume, ROM, tempo, density, and unilateral/bilateral changes separate.
- Display the changed field and the preserved field.
- Do not carry load across exercises as if it were equivalent.
- Capture incomplete work without penalizing or imputing.
- Ask whether the athlete stopped because of pain, illness, fatigue, equipment, or preference.
- Trigger next-morning follow-up when policy requires it.

## 56. Coach bench requirements

- Triage by safety and review priority.
- One-click comparison of plan, actual, and intervention.
- Filter by new symptom, repeated flare, side, movement pattern, illness, missed session, and re-entry.
- View confidence and freshness next to every alert.
- Approve, edit, reject, or expire an intervention.
- Author exercise-specific policies and symptom rules.
- Define which dimensions Auto-Coached may alter and by how much.
- See all overrides and unresolved conflicts.
- Add a plain-language athlete explanation.
- Export a clinician-facing summary without exposing unnecessary training or personal data.

## 57. Auto-Coached launch gate

Do not ship automatic progression until the system can demonstrate:

- no silent plan overwrites;
- no imputation of missing work as completed;
- no exercise substitution without intent comparison;
- no bypass of clinician restrictions;
- no automatic progression with unknown or worsening symptom response;
- no use of one readiness signal as a clearance;
- reversible actions with a visible receipt;
- deterministic hard stops;
- coach-configurable scopes and expiry;
- audit logs accessible to the coach;
- athlete-facing explanation tested for comprehension;
- safe handling of offline conflicts and delayed wearable data.

Start with proposals and coach approval. Move to bounded automation only after shadow-mode evaluation shows acceptable false-negative, false-positive, abstention, and override behavior.

## 58. Metrics that matter

Track safety and trust metrics before engagement vanity metrics:

- rate of symptom-related stops that were correctly escalated;
- false reassurance events;
- inappropriate progression proposals;
- inappropriate substitutions;
- clinician/coach agreement with the Coordinator;
- percentage of decisions that abstain because confidence is insufficient;
- coach override and undo rates;
- time from concerning signal to human review;
- missed-session catch-up errors prevented;
- re-entry completion and next-morning response capture;
- percentage of actual work correctly distinguished from planned work;
- athlete comprehension of “why this changed”;
- athlete-reported trust and perceived judgment;
- data burden and check-in completion without coercion;
- accessibility and color-interpretation errors;
- adverse-event review by policy version.

Do not optimize solely for completion, total volume, streaks, or time in app. A safe system may appropriately lower those metrics for a period.

## 59. Evaluation design

- Use a multidisciplinary review panel: strength coach, physiotherapist, sports physician, exercise physiologist, UX/accessibility specialist, and athletes with lived experience of pain or illness.
- Test with scripted edge cases: new pain with normal wearable data, stale wearable data with no check-in, fever after a hard week, partial session, asymmetrical symptoms, return after four weeks, and a clinician restriction that conflicts with the plan.
- Run Auto-Coached in shadow mode before it changes sessions.
- Compare decisions against a pre-specified policy, not only against user clicks.
- Sample false negatives with extra diligence; a low alert rate is not success if the system misses serious signals.
- Version every policy and source used in evaluation.
- Audit language for shame, blame, certainty, and implied diagnosis.
- Include offline, delayed-sync, timezone, and coach-override scenarios.
- Re-test policies when a source, model, exercise graph, or safety copy changes.

## 60. Visual QA checklist

- Can the athlete identify the next action in three seconds?
- Can they tell whether a change came from the plan, their report, a coach, or the system?
- Can they find the reason without opening a dense dashboard?
- Are caution and stop states understandable without color?
- Does every chart have one practical decision attached?
- Does the screen remain calm when many signals are present?
- Can the coach triage a caseload without opening every athlete?
- Are high-risk events visually prominent but not sensationalized?
- Are historical details available without competing with today’s action?
- Is the same status vocabulary used across athlete, coach, and Week in Review views?

# Part XI — Counterpoints, evidence limits, and research gaps

## 61. Where the product could overreach

### “One readiness score will simplify everything”

It will simplify the display by hiding the decision. Recovery is multidimensional, and subjective measures can be useful without becoming diagnostic. A score can be a compact input to a coach-authored policy; it should not be the app’s verdict on safety or readiness. ([Halson, PMID 25200666](https://pubmed.ncbi.nlm.nih.gov/25200666/); [Saw et al., PMID 26423706](https://pubmed.ncbi.nlm.nih.gov/26423706/))

### “ACWR gives us the injury threshold”

Load monitoring is useful for describing exposure and planning variation, but conceptual and systematic reviews do not support treating ACWR as a universal causal threshold or individual injury oracle. ([Impellizzeri et al., PMID 32502973](https://pubmed.ncbi.nlm.nih.gov/32502973/); [Andrade et al., PMID 32572824](https://pubmed.ncbi.nlm.nih.gov/32572824/)) Use load history as context, not a clinical decision by itself.

### “Pain-free means ready; pain means stop”

Both statements are too crude. Pain can be shaped by context and does not map one-to-one to tissue damage, yet some pain presentations and associated signs require immediate assessment. The product needs protocol scope, function, trend, and red-flag logic rather than a global pain slider. ([Raja et al., PMID 32694387](https://pubmed.ncbi.nlm.nih.gov/32694387/); [Caneiro et al., PMID 32907798](https://pubmed.ncbi.nlm.nih.gov/32907798/))

### “The neck check tells us when to train after a cold”

The popular rule lacks the evidentiary strength needed for an automatic clearance system. Infection severity, fever, dehydration, cardiopulmonary symptoms, and recovery trajectory matter. ([Snyders et al., PMID 34789459](https://pubmed.ncbi.nlm.nih.gov/34789459/))

### “A missed week only requires a percentage reduction”

Detraining and retraining are adaptation-specific. Strength, hypertrophy, cardiorespiratory fitness, skill, impact tolerance, and illness recovery do not decay or return at the same rate. Use a test exposure and human review instead of a universal percentage.

### “Unilateral is the easy substitute”

Unilateral work changes balance, side dose, and local fatigue. It can be a useful alternative, but may be more damaging or technically demanding in some contexts. ([Isik et al., PMID 30709578](https://pubmed.ncbi.nlm.nih.gov/30709578/))

### “More recovery tools make a more sophisticated product”

A longer list of modalities creates noise and marketing risk. Sophistication is transparent prioritization: identify the limiting factor, select the lowest-burden intervention with a plausible benefit, and make the uncertainty visible.

## 62. Confidence scale for the product

Use confidence to communicate the evidence and data quality, not to imply statistical certainty about an individual:

| Label | Appropriate use | Product behavior |
|---|---|---|
| High research confidence | Broad consensus or repeated evidence for a general principle, such as progressive overload, no training with fever, or recording actual rather than planned work | May support a default policy, still with scope and exceptions |
| Moderate research confidence | Consistent evidence with population, protocol, or outcome limits, such as RPE autoregulation or recovery modalities | Use as a coach-configurable option; show limitations |
| Low or mixed research confidence | Conflicting, sparse, or highly context-specific findings, such as exact recovery thresholds or universal unilateral equivalence | Do not automate; present as a hypothesis or coach note |
| Protocol-specific | Valid only for a named condition, exercise, population, and rule | Require owner, source, scope, and expiry |
| Product inference | Design consequence derived from the evidence rather than directly tested | Label as product policy; validate in user research and safety review |
| Clinician-owned | Diagnosis, clearance, medical restriction, or condition-specific treatment | Require clinician input or handoff; app may record and enforce |

## 63. Research gaps that should remain visible

- No universal traffic-light thresholds apply across pain, soreness, illness, and sports.
- No validated exercise-substitution graph covers all adaptations, equipment, tissues, and individuals.
- Exact load/volume/ROM/tempo reduction percentages after time off remain adaptation- and athlete-specific.
- Wearable recovery metrics have uncertain individual validity and cannot replace symptoms or clinical assessment.
- Pain-monitoring rules differ by condition and protocol; they should not be generalized.
- The effect of changing one progression dimension at a time in real-world coaching needs pragmatic study.
- Coach and athlete interpretation of adaptation receipts needs usability and comprehension testing.
- Safety-critical abstention and escalation rates need prospective evaluation, not only offline simulations.
- The relationship between recovery modalities, adaptation, and athlete preference is context-dependent.
- Low energy availability and RED-S risk cannot be safely reduced to a simple calorie or weight rule. ([Mountjoy et al., PMID 37752011](https://pubmed.ncbi.nlm.nih.gov/37752011/); [Jeukendrup et al., PMID 39287777](https://pubmed.ncbi.nlm.nih.gov/39287777/))

## 64. Research-only product posture

The app should be positioned as a transparent coaching and decision-support system. It can make training more adaptive, reduce needless catch-up behavior, preserve context, and help a coach see patterns earlier. It cannot independently diagnose, clear return to sport, quantify tissue damage, or guarantee injury prevention.

The strongest product promise is not “we know your body.” It is:

> “We preserve your coach’s intent, listen to what happened, make bounded changes when authorized, show our reasoning, and escalate when the information exceeds our scope.”

# Part XII — Direct evidence register

The register below is intentionally selective. It prioritizes PubMed-indexed reviews, consensus statements, clinical rehabilitation studies, and authoritative sports-medicine guidance relevant to this product lane. “Confidence” describes how safely the finding can inform a product policy, not the quality of the journal alone.

## Pain, soreness, and symptom interpretation

| Topic | Direct source | PMID | Product confidence |
|---|---|---:|---|
| Pain definition and limits of pain-as-damage-meter | [Raja et al., revised IASP definition](https://pubmed.ncbi.nlm.nih.gov/32694387/) | 32694387 | High for conceptual boundary; not a diagnostic tool |
| DOMS mechanisms and presentation | [Cheung et al., DOMS review](https://pubmed.ncbi.nlm.nih.gov/12617692/) | 12617692 | Moderate for general pattern; cannot diagnose an individual |
| DOMS imaging/pathophysiology review | [Hotfiel et al., DOMS Part I](https://pubmed.ncbi.nlm.nih.gov/30537791/) | 30537791 | Moderate |
| Pain is more than tissue damage; rehabilitation principles | [Caneiro et al.](https://pubmed.ncbi.nlm.nih.gov/32907798/) | 32907798 | High for avoiding simplistic pain rules; not a clearance protocol |
| Exercise with pain in chronic musculoskeletal pain | [Smith et al.](https://pubmed.ncbi.nlm.nih.gov/28596288/) | 28596288 | Moderate and condition-specific |

## Tendon loading and tendon-related return

| Topic | Direct source | PMID | Product confidence |
|---|---|---:|---|
| Achilles pain-monitoring model with continued sport | [Silbernagel et al.](https://pubmed.ncbi.nlm.nih.gov/17307888/) | 17307888 | Protocol-specific; coach/clinician approval required |
| Proposed Achilles return-to-sport continuum | [Silbernagel & Crossley](https://pubmed.ncbi.nlm.nih.gov/26390272/) | 26390272 | Moderate; protocol-specific |
| Achilles/patellar tendon loading programmes | [Malliaras et al.](https://pubmed.ncbi.nlm.nih.gov/23494258/) | 23494258 | Moderate-high for progressive loading principle |
| Patellar tendinopathy diagnosis/load management | [Malliaras et al.](https://pubmed.ncbi.nlm.nih.gov/26390269/) | 26390269 | Clinical, not app-diagnostic |
| Heavy slow resistance versus eccentric Achilles | [Beyer et al.](https://pubmed.ncbi.nlm.nih.gov/26018970/) | 26018970 | Moderate for named protocol; not automatic selection |
| Progressive tendon-loading exercise patellar tendon | [Breda et al.](https://pubmed.ncbi.nlm.nih.gov/33219115/) | 33219115 | Moderate and protocol-specific |
| Isometric exercise and immediate Achilles pain | [van der Vlist et al.](https://pubmed.ncbi.nlm.nih.gov/32474979/) | 32474979 | Moderate; cautions against universal isometric claims |
| Conservative Achilles tendinopathy management | [Silbernagel et al.](https://pubmed.ncbi.nlm.nih.gov/32267723/) | 32267723 | Moderate |
| Incremental Achilles loading exercise progression | [Baxter et al.](https://pubmed.ncbi.nlm.nih.gov/32658037/) | 32658037 | Moderate; progression model, not an app clearance |
| Patellar tendon loading tiers | [Silva et al.](https://pubmed.ncbi.nlm.nih.gov/37847102/) | 37847102 | Moderate; protocol-specific |

## Muscle injury and return-to-sport

| Topic | Direct source | PMID | Product confidence |
|---|---|---:|---|
| Muscle injury classification | [Valle et al., MLG-R classification](https://pubmed.ncbi.nlm.nih.gov/27878524/) | 27878524 | Clinical classification; no automated diagnosis |
| BAMIC classification and hamstring return/recurrence | [Pollock et al.](https://pubmed.ncbi.nlm.nih.gov/26888072/) | 26888072 | Moderate; clinical and sport-specific |
| Hamstring strain rehabilitation | [Erickson & Sherry](https://pubmed.ncbi.nlm.nih.gov/30356646/) | 30356646 | Moderate; clinician/coach protocol |
| Hamstring strain rehabilitation recommendations | [Heiderscheit et al.](https://pubmed.ncbi.nlm.nih.gov/20118524/) | 20118524 | Moderate |
| Hamstring return-to-play systematic review | [van der Horst et al.](https://pubmed.ncbi.nlm.nih.gov/26767837/) | 26767837 | Moderate; no universal calendar rule |
| Criteria for progressing hamstring rehabilitation | [Hickey et al.](https://pubmed.ncbi.nlm.nih.gov/28035586/) | 28035586 | Moderate; criteria must be measured/assessed |
| Return-to-play framework for muscle strains | [Orchard](https://pubmed.ncbi.nlm.nih.gov/16278548/) | 16278548 | Moderate |
| Acute hamstring management systematic review | [Rudissill et al.](https://pubmed.ncbi.nlm.nih.gov/34888392/) | 34888392 | Moderate |
| Hamstring rehabilitation review | [Hickey et al.](https://pubmed.ncbi.nlm.nih.gov/35201301/) | 35201301 | Moderate |

## Illness, return-to-training, and clinical boundaries

| Topic | Direct source | PMID | Product confidence |
|---|---|---:|---|
| Return-to-sport consensus framework | [Ardern et al.](https://pubmed.ncbi.nlm.nih.gov/27226389/) | 27226389 | High for criteria-based, shared decision framing |
| ACL return-to-sport consensus | [Panther Symposium consensus](https://pubmed.ncbi.nlm.nih.gov/34006577/) | 34006577 | High for clinical criteria boundary |
| Criteria-based ACL rehabilitation | [Myer et al.](https://pubmed.ncbi.nlm.nih.gov/16776488/) | 16776488 | Moderate-high; protocol-specific |
| Acute respiratory infection return-to-sport review | [Snyders et al.](https://pubmed.ncbi.nlm.nih.gov/34789459/) | 34789459 | Moderate; rejects universal return days/neck check |
| IOC ARI consensus, part 1 | [Schwellnus et al.](https://pubmed.ncbi.nlm.nih.gov/35863871/) | 35863871 | High for conservative clinical boundary |
| IOC non-infective ARI consensus, part 2 | [Schwellnus et al.](https://pubmed.ncbi.nlm.nih.gov/35623888/) | 35623888 | High for clinical boundary |
| Febrile illness and exercise | [Dick et al.](https://pubmed.ncbi.nlm.nih.gov/24790692/) | 24790692 | High for no training with fever; clinical exceptions remain |
| Concussion return-to-play position | [AMSSM](https://pubmed.ncbi.nlm.nih.gov/23243113/) | 23243113 | High for clinician-owned boundary |
| Infectious mononucleosis return | [Becker & Smith](https://pubmed.ncbi.nlm.nih.gov/24790693/) | 24790693 | Clinical and condition-specific |
| Mononucleosis/contact sport review | [O’Connor](https://pubmed.ncbi.nlm.nih.gov/21853428/) | 21853428 | Clinical and condition-specific |
| Bone stress injury management/return | [Warden et al.](https://pubmed.ncbi.nlm.nih.gov/25103133/) | 25103133 | Clinician-owned |
| Exercise preparticipation screening | [ACSM screening update](https://pubmed.ncbi.nlm.nih.gov/26473759/) | 26473759 | High for screening boundary; not a diagnosis |
| ACSM preparticipation guideline | [Thompson et al.](https://pubmed.ncbi.nlm.nih.gov/23851406/) | 23851406 | High for screening boundary |

## Detraining, retraining, and maintenance dose

| Topic | Direct source | PMID | Product confidence |
|---|---|---:|---|
| Short-term detraining | [Mujika & Padilla](https://pubmed.ncbi.nlm.nih.gov/10966148/) | 10966148 | Moderate; adaptation-specific |
| Long-term detraining | [Mujika & Padilla](https://pubmed.ncbi.nlm.nih.gov/10999420/) | 10999420 | Moderate; adaptation-specific |
| Reduced resistance-training dose to retain adaptations | [Bickel et al.](https://pubmed.ncbi.nlm.nih.gov/21131862/) | 21131862 | Moderate; population/protocol-specific |
| Minimal dose to preserve performance | [Spiering et al.](https://pubmed.ncbi.nlm.nih.gov/33629972/) | 33629972 | Moderate |
| Minimal-dose resistance training review | [Fyfe et al.](https://pubmed.ncbi.nlm.nih.gov/34822137/) | 34822137 | Moderate |
| Periodic versus continuous resistance training and retraining | [Halonen et al.](https://pubmed.ncbi.nlm.nih.gov/39364857/) | 39364857 | Moderate; cannot set universal re-entry percentages |
| Detraining in older adults meta-analysis | [Grgic et al.](https://pubmed.ncbi.nlm.nih.gov/36360927/) | 36360927 | Moderate; age-specific |
| Skeletal muscle memory review | [Sharples & Turner](https://pubmed.ncbi.nlm.nih.gov/37154489/) | 37154489 | Low-moderate for product algorithms |
| Disuse/atrophy and resistance exercise meta-analysis | [Guo et al.](https://pubmed.ncbi.nlm.nih.gov/39920735/) | 39920735 | Moderate; context-specific |

## Load management, monitoring, and fatigue

| Topic | Direct source | PMID | Product confidence |
|---|---|---:|---|
| IOC consensus on load, injury, and illness | [Soligard et al.](https://pubmed.ncbi.nlm.nih.gov/27535989/) | 27535989 | High for multidimensional monitoring |
| Training-load monitoring consensus | [Bourdon et al.](https://pubmed.ncbi.nlm.nih.gov/28463642/) | 28463642 | High for internal/external load distinction |
| Monitoring training load and fatigue | [Halson](https://pubmed.ncbi.nlm.nih.gov/25200666/) | 25200666 | High for no single definitive marker |
| Session-RPE method | [Foster et al.](https://pubmed.ncbi.nlm.nih.gov/11708692/) | 11708692 | Moderate-high for simple monitoring |
| 25 years of session-RPE | [Foster](https://pubmed.ncbi.nlm.nih.gov/33508782/) | 33508782 | Moderate-high |
| Subjective measures and objective measures | [Saw et al.](https://pubmed.ncbi.nlm.nih.gov/26423706/) | 26423706 | Moderate-high for individual monitoring context |
| ACWR conceptual issues | [Impellizzeri et al.](https://pubmed.ncbi.nlm.nih.gov/32502973/) | 32502973 | High for rejecting simplistic thresholds |
| ACWR systematic review | [Andrade et al.](https://pubmed.ncbi.nlm.nih.gov/32572824/) | 32572824 | High for uncertainty of injury oracle |
| Athlete monitoring cycle | [Gabbett et al.](https://pubmed.ncbi.nlm.nih.gov/28646100/) | 28646100 | Moderate-high for iterative context |
| Multidimensional monitoring framework | [Rebelo et al.](https://pubmed.ncbi.nlm.nih.gov/41824225/) | 41824225 | Moderate; recent and framework-level |
| Overtraining syndrome consensus | [Meeusen et al.](https://pubmed.ncbi.nlm.nih.gov/23247672/) | 23247672 | High for medical/diagnostic boundary |
| Swimming load, pain, and injury review | [Barry et al.](https://pubmed.ncbi.nlm.nih.gov/33486408/) | 33486408 | Moderate; sport-specific |

## Recovery, sleep, nutrition, and modalities

| Topic | Direct source | PMID | Product confidence |
|---|---|---:|---|
| Recovery and performance consensus | [Kellmann et al.](https://pubmed.ncbi.nlm.nih.gov/29345524/) | 29345524 | High for recovery as multidimensional |
| Athlete sleep consensus | [Walsh et al.](https://pubmed.ncbi.nlm.nih.gov/33144349/) | 33144349 | High for sleep-support principle |
| Sleep loss and athletic performance review | [Fullagar et al.](https://pubmed.ncbi.nlm.nih.gov/25315456/) | 25315456 | Moderate-high |
| Recovery techniques meta-analysis | [Dupuy et al.](https://pubmed.ncbi.nlm.nih.gov/29755363/) | 29755363 | Moderate; modality-specific |
| Cold-water immersion and anabolic signaling | [Roberts et al.](https://pubmed.ncbi.nlm.nih.gov/26174323/) | 26174323 | Moderate; protocol-specific |
| Cold-water immersion adaptive responses | [Broatch et al.](https://pubmed.ncbi.nlm.nih.gov/29627884/) | 29627884 | Moderate |
| Cold-water immersion after resistance training meta-analysis | [Grgic et al.](https://pubmed.ncbi.nlm.nih.gov/35068365/) | 35068365 | Moderate; adaptation-specific |
| Nutritional strategies for recovery | [Naderi et al.](https://pubmed.ncbi.nlm.nih.gov/40221559/) | 40221559 | Moderate; nutrition professional boundary |
| IOC RED-S consensus | [Mountjoy et al.](https://pubmed.ncbi.nlm.nih.gov/37752011/) | 37752011 | High for scope/escalation boundary |
| Energy-availability measurement critique | [Jeukendrup et al.](https://pubmed.ncbi.nlm.nih.gov/39287777/) | 39287777 | Moderate; reinforces measurement limits |

## Progression, regression, and exercise substitution evidence

| Topic | Direct source | PMID | Product confidence |
|---|---|---:|---|
| ACSM resistance-training progression models | [American College of Sports Medicine](https://pubmed.ncbi.nlm.nih.gov/19204579/) | 19204579 | High for progressive, individualized programming |
| Resistance-training fundamentals and prescription | [Kraemer et al.](https://pubmed.ncbi.nlm.nih.gov/15064596/) | 15064596 | High for specificity/individualization |
| Velocity loss and fatigue | [Sánchez-Medina & González-Badillo](https://pubmed.ncbi.nlm.nih.gov/21311352/) | 21311352 | Moderate; measurement-dependent |
| RPE-based volume autoregulation | [Helms et al.](https://pubmed.ncbi.nlm.nih.gov/29786623/) | 29786623 | Moderate; implementation-dependent |
| Autoregulated load/volume meta-analysis | [Hickmott et al.](https://pubmed.ncbi.nlm.nih.gov/35038063/) | 35038063 | Moderate |
| ROM and muscular adaptations | [Pallarés et al.](https://pubmed.ncbi.nlm.nih.gov/34170576/) | 34170576 | Moderate; goal/muscle specific |
| ROM review for hypertrophy/strength | [Schoenfeld & Grgic](https://pubmed.ncbi.nlm.nih.gov/32030125/) | 32030125 | Moderate |
| Movement tempo review | [Wilk et al.](https://pubmed.ncbi.nlm.nih.gov/34043184/) | 34043184 | Moderate; no universal safe tempo |
| Weekly resistance-training volume dose response | [Schoenfeld et al.](https://pubmed.ncbi.nlm.nih.gov/27433992/) | 27433992 | Moderate-high at group level |
| Weekly sets and strength meta-analysis | [Ralston et al.](https://pubmed.ncbi.nlm.nih.gov/28755103/) | 28755103 | Moderate |
| Low versus high load strength/hypertrophy | [Schoenfeld et al.](https://pubmed.ncbi.nlm.nih.gov/28834797/) | 28834797 | Moderate-high with adaptation distinction |
| Failure versus non-failure training | [Grgic et al.](https://pubmed.ncbi.nlm.nih.gov/33497853/) | 33497853 | Moderate; no universal need for failure |
| Unilateral versus bilateral training | [Liao et al.](https://pubmed.ncbi.nlm.nih.gov/35959319/) | 35959319 | Moderate; test-specific |
| Cross-education | [Manca et al.](https://pubmed.ncbi.nlm.nih.gov/28936703/) | 28936703 | Moderate; not local tissue clearance |
| Unilateral/bilateral lower-body muscle damage | [Isik et al.](https://pubmed.ncbi.nlm.nih.gov/30709578/) | 30709578 | Moderate; challenges “unilateral is easier” |
| Unilateral/bilateral training comparison | [Janzen et al.](https://pubmed.ncbi.nlm.nih.gov/16568338/) | 16568338 | Low-moderate; context-specific |
| Eccentric versus concentric training | [Roig et al.](https://pubmed.ncbi.nlm.nih.gov/18981046/) | 18981046 | Moderate; adaptation- and damage-specific |
| Power and movement specificity | [Cormie et al.](https://pubmed.ncbi.nlm.nih.gov/21244105/) | 21244105 | Moderate-high for intent preservation |

# Part XIII — Deterministic product policy summary

The following is the compact policy sheet that should be carried into product discovery, UX, and safety review.

## Proceed

Proceed within the current plan when the athlete is symptom-free or within an explicit protocol, data is current enough, the session is within policy, and no restriction or illness state is active.

## Hold

Hold progression when data is missing, stale, contradictory, or the athlete reports a new but non-red-flag symptom. Repeat or use the smallest coach-approved regression; ask for the next-morning response.

## Regress

Regress only the dimension identified as the limiter where possible: rest for density, sets/reps for volume, load for external force, ROM for a defined range issue, support for stability, or an approved substitution when the original exposure is unavailable. Explain what changed and what did not.

## Substitute

Substitute only from a coach-approved intent graph. Preserve the declared adaptation, pattern, side, and restriction fields; state the fields that changed. Do not call it “equivalent” without a qualified dimension.

## Escalate

Escalate worsening symptoms, function loss, red flags, systemic illness, concerning trauma, clinician restrictions, or any state the app cannot safely classify. Do not offer a distracting training substitute after a hard stop.

## Return

Return after illness, injury, surgery, fracture, concussion, stress injury, or a significant time gap through a staged, criteria-based, human-owned pathway. Time alone, pain alone, or wearable data alone cannot clear the athlete.

## Record

Record the plan, actual, context, intervention, authority, confidence, next check, and expiry. Preserve the original and the change. This is the product’s trust layer.

