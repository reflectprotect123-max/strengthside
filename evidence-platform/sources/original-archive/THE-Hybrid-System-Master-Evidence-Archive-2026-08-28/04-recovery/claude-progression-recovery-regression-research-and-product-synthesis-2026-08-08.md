# Addendum: progression, recovery, regression, and plateau research for the Claude coaching product

Date: 2026-08-08  
Research lane: research-only; no implementation code  
Status: additive handoff; preserves the existing coaching-platform research

This document extends, rather than replaces, the earlier project material:

- claude-athlete-onboarding-and-checkins-build-brief-2026-08-06.md
- claude-week-in-review-research-handoff-2026-08-08.md
- coaching-platform-research-bundle-2026-08-06.md

The earlier handoffs remain the source of truth for the existing onboarding, check-in, trust, planned-versus-actual, week-review, Coordinator, and bounded Auto-Coach decisions. This addendum adds the evidence lane requested for progression methods, recovery, regressions, and plateaus, then translates that evidence into product requirements and a visually simple interaction model.

## High-Level Overview

The central finding is not that one progression formula wins. It is that a sophisticated coach needs a reliable decision system for choosing among several valid ways to progress, hold, regress, recover, or escalate.

The evidence supports these broad conclusions:

- Progressive overload is an adaptation principle, not a single algorithm. Load, repetitions, sets, and exercise-specific performance can all be legitimate progression axes. Direct trials comparing load progression with repetition progression found both can work, with no clear universal winner.
- Hypertrophy is generally supported across a broad range of loads when sets are sufficiently hard and the exercise can be performed safely and consistently. Heavier loading remains more specific and usually more useful for maximal strength.
- More weekly training volume tends to produce more hypertrophy and strength, but with diminishing returns, substantial individual variation, and uncertain set-count boundaries. The app must not turn “more sets” into an automatic prescription.
- Frequency is mostly a distribution variable for hypertrophy when volume is equated; it can help strength and practicality when it improves quality, recovery, or specificity.
- Training to momentary failure is not required for strength or hypertrophy. Getting closer to failure may support hypertrophy, but it also creates more acute fatigue. The correct product rule is goal-, exercise-, trainee-, and phase-dependent proximity to failure.
- RPE and RIR are useful control variables, but they are estimates. Their accuracy depends on exercise, load, trainee experience, and context. The product should record confidence in the estimate and avoid treating RIR as an oracle.
- Velocity-based training is an optional measurement and autoregulation layer, not a universal replacement for percentage loading or RIR. The evidence is mixed and device validity matters.
- Periodization is better supported as a strength and fatigue-management organization strategy than as a hypertrophy multiplier. Linear, undulating, and block models can all be useful when matched to the athlete and goal.
- A calendar deload is not a validated law. Complete cessation for one week has not shown a reliable benefit in short supervised studies; active volume reduction is more compatible with coaching practice, but direct evidence remains limited and population-specific.
- Exercise variation can help manage constraints and may support regional development, but excessive variation makes progress harder to measure and may blunt skill specificity.
- There is no validated universal plateau definition, no validated “2-for-2” rule, and no direct trial establishing double progression as the superior method. These are operational heuristics that can be useful if the product labels them as such and keeps them reversible.

The product implication is a controlled adaptation loop:

1. Define the intended stimulus and success condition.
2. Capture what actually happened, including data quality and uncertainty.
3. Check safety and exercise quality before chasing performance.
4. Decide whether to progress, hold, regress, recover, substitute, or escalate.
5. Change the smallest useful number of variables.
6. Show the reason, confidence, evidence class, bounds, expiry, and undo path.
7. Learn from the next comparable exposure rather than overreacting to one session.

That is the sophistication: not more knobs on the screen, but better state, decision precedence, and auditability underneath a calm surface.

## Deep Dive Analysis

### 1. Evidence standard and tags

The source register at the end contains direct PubMed links, PMIDs, and DOIs where available. PubMed-indexed systematic reviews and meta-analyses are used to establish broad patterns; primary trials are used to test whether a practical rule has direct support; consensus and survey work is separated from causal evidence.

Evidence tags used in this document:

| Tag | Meaning | Product posture |
|---|---|---|
| [strong evidence] | Repeated systematic-review, meta-analytic, or relatively consistent controlled evidence for a broad claim | Safe as a default principle, not necessarily as a fixed numeric rule |
| [moderate evidence] | Several trials or a useful synthesis, with meaningful heterogeneity or limitations | Use conditionally and expose the condition |
| [conditional] | Effect changes with goal, exercise, trainee status, dose, or measurement method | Require context fields before adapting |
| [practice/consensus] | Coach survey, qualitative study, practical scale, or consensus statement | Offer as configurable policy, never mislabel as proven outcome |
| [heuristic] | A product-operational rule proposed to make decisions consistent | Clearly label as a rule chosen by the coach/product; keep editable and reversible |
| [unknown] | Evidence is absent, conflicting, too indirect, or too weak to justify automation | Hold, ask, or escalate rather than invent certainty |

Important distinctions:

- A statistically significant average effect does not justify a universal prescription.
- A method can be effective without being optimal, and optimality is often not established.
- Acute fatigue, soreness, metabolic stress, or a velocity drop is not the same as long-term adaptation.
- A measurement can be reliable without being a valid proxy for the outcome the coach actually cares about.
- A practical coaching scale can be useful even when it is not a validated physiological law.

### 2. What “progressive overload” should mean inside the product

Progressive overload should be represented as an intended increase in the training stimulus or the quality of the athlete’s exposure over time. It should not be reduced to “add weight every week.”

Potential progression axes:

| Axis | What changes | Most defensible use | Main caveat |
|---|---|---|---|
| Repetitions | More repetitions at the same load | General strength/hypertrophy work; useful when load jumps are coarse | More reps can change fatigue and technical demand |
| Load | More external resistance at a similar repetition target | Strength specificity and measurable overload | Daily readiness and technique affect achievable load |
| Sets | More work sets for a pattern or muscle | When current dose is tolerated and response is inadequate | Dose-response has diminishing returns; fatigue and time rise |
| Frequency | More exposures or redistribution across the week | When quality, recovery, or scheduling improves | Not automatically superior when total volume is equated |
| Range of motion | More usable, controlled ROM | Where it is pain-free and compatible with the goal | Pain or anatomy can make “more” inappropriate |
| Rest | More complete recovery between sets | When performance quality or strength is the bottleneck | Increases session duration; not a direct hypertrophy law |
| Execution quality | More stable technique, tempo control, target-tissue consistency | Early learning, rehabilitation constraints, skill-specific work | Quality is not fully captured by a score |
| Density | Similar work in less time | Conditioning or time-efficient phases | Can trade away load, reps, and technical quality |
| Velocity/intent | Faster or more consistent concentric intent at a given load | Power and fatigue monitoring when measurement is valid | Device and exercise validity are limiting factors |
| Exercise specificity | More practice with a target pattern or competition lift | Strength and skill goals | Novel variation can make apparent progress incomparable |

A Coordinator should therefore ask: “Which stimulus is intended to improve, and what evidence do we have that the athlete can tolerate changing it?” This is more precise than asking whether the athlete “progressed.”

#### What direct progression trials show

Plotkin et al. compared increasing load while holding repetitions relatively fixed with increasing repetitions while holding load relatively fixed in resistance-trained participants. Both approaches produced meaningful adaptations over the study period, without a clear overall advantage for one model. Chaves et al. reported a similar result in previously untrained men and women using within-subject leg protocols. Scarpelli et al. found heterogeneous individual responses: some participants appeared to respond better to repetition progression, some to load progression, and some showed little difference. These studies support flexibility, not an adaptive algorithm that can identify a winner with confidence.

Evidence: [moderate evidence] for multiple viable progression axes; [unknown] for a universal best axis or a validated individual-response classifier.

Product requirement:

- Store the selected progression axis as an explicit prescription field.
- Do not infer that an athlete is failing simply because load did not increase if repetitions, quality, ROM, or the intended stimulus improved.
- If the selected axis is load, compare like-with-like loads and technique.
- If the selected axis is repetitions, preserve the load, exercise variant, rest, and quality requirements before declaring a successful progression.
- Record the coach’s reason for selecting the axis.

#### Double progression: useful operating procedure, not established law

Double progression usually means prescribing a repetition window, allowing repetitions to rise within that window, and then increasing load once the athlete reaches a criterion. It is attractive because it absorbs day-to-day variation and works with common gym equipment.

What the evidence supports:

- Repetition progression and load progression can both work.
- Broad repetition ranges can support hypertrophy when effort and execution are adequate.
- Load progression is especially relevant when the goal is maximal strength or when the test is load-specific.

What the evidence does not establish:

- That double progression is superior to load-first, RIR-first, percentage-based, or velocity-based progression.
- That “two extra reps on two consecutive sessions” is a universal threshold.
- That a fixed increment such as 2.5% or 5% is correct for every exercise, athlete, or equipment setup.

Product posture: implement double progression as a selectable coach heuristic. Label it as “reps-first within the approved window,” not as a physiological law. The default should be:

1. Hold the exercise, load mode, target set count, rest, and quality constraints stable.
2. Accumulate comparable successful exposures.
3. If the athlete reaches the top of the approved window with acceptable technique and effort, propose a small load increase.
4. After the load increase, reset the working repetition target to the lower or middle portion of the window.
5. If the athlete misses the bottom of the window with high effort, propose a small regression or longer rest.
6. If the athlete improves repetitions but quality falls, do not count the exposure as a clean progression.

Every numeric threshold above should be coach-configurable and marked [heuristic].

### 3. Volume, intensity, frequency, and dose-response

#### Volume

Weekly resistance-training volume is positively associated with hypertrophy, and low-to-high categorical comparisons generally favor more sets. Schoenfeld et al. reported a dose-response relationship between weekly sets and muscle growth; Schoenfeld et al. in trained men found that higher per-exercise set volumes produced more hypertrophy than one-set training, although strength differences were less clear. Ralston et al. found a graded relationship between weekly set volume and strength gain, with low volume often less effective for novice and intermediate male trainees.

The important product qualification is that “sets” are not a universal currency. A set of a compound lift may contribute to several muscles with different effective doses. Sets differ in load, ROM, technique, proximity to failure, exercise stability, and fatigue cost. Counting direct and fractional sets can be useful for planning, but it is a model assumption.

Evidence: [strong evidence] for a positive average relationship between volume and adaptation; [conditional] for the magnitude and point of diminishing returns; [unknown] for a universal optimal set number.

Requirements:

- Track direct sets, indirect contribution, target muscle/pattern, effort, and exercise stability separately.
- Show volume as a range and trend, not a single “optimal” number.
- Permit a low-dose maintenance or minimum-effective-dose mode.
- Require a tolerance and response check before adding sets.
- Treat a new set as a real fatigue and time cost, not a free progression.

#### Minimum effective dose is not minimum optimal dose

The minimum-effective-dose review by Androulakis-Korakakis et al. found that one set performed one to three times weekly at high effort and roughly moderate-to-heavy loading can improve 1RM strength in resistance-trained men over short periods, although gains are likely suboptimal and important populations were underrepresented. The broader minimal-dose review by Spiering et al. indicates that once-weekly low-volume training can maintain adaptations in some younger populations when intensity is maintained, while older adults may need more exposure.

Evidence: [moderate evidence] that very low doses can improve or maintain performance in some contexts; [conditional] by training age, goal, age, exercise, and time horizon.

Product requirement:

- Support three separate states: gain dose, maintenance dose, and minimum viable dose.
- Never interpret a small dose as “optimal.”
- When schedule, illness, travel, or stress constrains the athlete, degrade gracefully to a minimum viable plan rather than marking the week as failure.

#### Intensity and load

For hypertrophy, meta-analyses generally find similar muscle growth across low, moderate, and high loads when sets are sufficiently hard and volume is reasonably matched. Heavy loads produce larger improvements in maximal strength, partly because strength is specific to lifting heavy loads and practicing the relevant skill.

Product posture:

- Hypertrophy prescriptions may use broader load and repetition windows when the athlete can maintain technique and effort.
- Max-strength blocks should bias heavier, more specific loading.
- Power prescriptions need an intent and velocity-quality constraint, not merely a percentage of 1RM.
- Load should be recorded with the loading mode: absolute load, percentage estimate, RPE/RIR target, velocity target, or free target.

#### Frequency

Earlier frequency meta-analyses found apparent advantages for training a muscle more than once weekly, but the advantage is reduced or disappears in volume-equated analyses for hypertrophy. Strength may benefit from greater frequency, but part of that effect may be better practice and more total or better-distributed volume. A large recent meta-regression reported a positive relationship between volume and both outcomes with diminishing returns, while frequency appeared less important for hypertrophy and modestly positive for strength. Because the synthesis is new and the underlying studies are heterogeneous, it should inform design rather than become a fixed frequency law.

Evidence: [strong evidence] that frequency distributes volume and practice; [conditional] that more frequency independently improves outcome; [unknown] for one universal frequency.

Requirements:

- Use frequency to solve quality, recovery, schedule, and specificity problems.
- When volume is changed, state whether frequency changed to add dose or only to redistribute it.
- Allow the same weekly volume to be distributed differently without treating the athlete as on a new program.
- Avoid automatic frequency increases for a plateau unless quality and recovery data justify it.

#### Novice versus trained athletes

Novices often improve with a broad range of doses and loads because the initial adaptation signal is large and technical learning contributes to performance. Trained athletes generally require more specificity, better fatigue management, and enough stimulus to continue progressing, but they do not automatically need maximal volume. Lopez et al. found load-dependent differences in strength and training-status differences in the pattern of adaptation; Ralston et al. reported low-volume limitations for novice/intermediate strength development; Ahtiainen et al. highlights substantial individual and age-related variability.

Product requirement:

- Use training age as a context variable, not a rigid dosage tier.
- Separate “new to resistance training,” “new to this exercise,” and “advanced in the target lift.”
- Lower confidence when experience, consistency, or exercise history is missing.
- Avoid declaring an athlete a non-responder from a short block or a single outcome.

### 4. Repetition ranges and percentage-based loading

Schoenfeld et al. found that heavier loading produces better 1RM strength gains, while hypertrophy can be similar across low and high loads. A trained-men trial comparing roughly 8–12 repetitions with roughly 25–35 repetitions found similar hypertrophy but greater strength gains with the heavier condition. Volume-matched analyses reach a similar practical conclusion.

This does not mean “any reps work equally for everything.” A high-repetition set can be limited by discomfort, local fatigue, cardiovascular strain, grip, or technique before the target muscle receives a comparable stimulus. A low-repetition set can be limited by skill, joint stress, or load exposure. The app should preserve broad validity while respecting the constraint that made the range useful.

Percentage-based loading is valuable for specifying strength intent and planning a block, but the percentage is only as accurate as the current 1RM estimate and the exercise’s stability. Daily readiness, fatigue, and technical variance can make a fixed percentage produce different RIR values across days. Percentage prescriptions should therefore include a tolerance, a quality gate, or an autoregulation fallback.

Requirements:

- Store target repetition range, not only a single target number.
- Store goal specificity: hypertrophy, general strength, maximal strength, power, skill, conditioning, or maintenance.
- Allow a percentage anchor plus an RPE/RIR or velocity guardrail.
- Recalculate estimated strength only from comparable, high-confidence exposures.
- Do not compare a machine 10RM, a free-weight 5RM, and a competition-lift 1RM as if they were the same progress metric.

### 5. Proximity to failure, RIR, and RPE

#### What the failure evidence supports

Systematic reviews and meta-analyses generally find no overall strength or hypertrophy requirement to train every set to momentary failure. When volume is equated, the apparent hypertrophy advantage of failure often diminishes or disappears. Some analyses suggest a small benefit to getting closer to failure for hypertrophy, especially in trained participants, but the relationship is exploratory and the exact dose is unclear. Failure also creates greater acute fatigue and can slow neuromuscular, metabolic, and subjective recovery.

The recent single-set trial by Hermann et al. compared failure with stopping at approximately two repetitions in reserve in resistance-trained adults. Both conditions produced appreciable adaptations over eight weeks; some hypertrophy measures tended to favor failure, while strength and muscular endurance were similar. This is useful evidence against declaring either method universally correct.

Evidence summary:

- [strong evidence] Failure is not required for most strength or hypertrophy outcomes.
- [moderate evidence] Closer-to-failure work can be useful for hypertrophy, especially when load is lighter or volume is constrained.
- [moderate evidence] Failure increases acute fatigue and recovery cost.
- [conditional] The useful proximity depends on exercise stability, goal, load, trainee, phase, and the value of the final repetitions.

Product rule:

- Treat proximity to failure as a dose and fatigue-control variable.
- Do not default every compound lift to failure.
- Permit closer efforts on stable, lower-risk accessory work when coach policy allows.
- Permit more repetitions in reserve when the session is skill-, strength-, power-, or recovery-constrained.
- Record the target and the observed estimate separately.

#### RIR/RPE is useful but fallible

Helms et al. introduced the practical RIR-based RPE approach for physique and strength training; Zourdos et al. developed a resistance-training-specific RPE scale; Lovegrove et al. found RIR can be reliable in repeated testing, while Hughes et al. showed estimation accuracy changes by exercise and load. At lighter loads, an athlete can misjudge remaining repetitions; at higher loads, estimates may be more precise for some exercises but still vary across people and conditions.

Product requirements:

- Store target RIR/RPE, observed RIR/RPE, and confidence in the observation.
- Record whether RIR was entered before or after feedback from a device, coach, or completed reps.
- Calibrate RIR separately for major exercise families rather than assuming transfer.
- Do not use an exact RIR value to override clear performance, technique, or safety evidence.
- Use repeated estimates to adjust trust; do not punish an athlete for an honest estimate error.

Recommended presentation:

“Target: 2 RIR. Reported: 1 RIR, low confidence. Reps and load matched the plan. Hold the next exposure and recalibrate.”

This is more honest than showing “readiness 86.”

### 6. Autoregulation and the percentage-versus-RIR decision

The literature comparing autoregulated and fixed loading is heterogeneous. Reviews find no consistent universal advantage for load autoregulation or volume autoregulation, although some athlete studies and newer network analyses report favorable effects for APRE, RPE, or velocity approaches. The evidence is limited by small samples, different autoregulation protocols, different outcomes, and varying quality of feedback.

Percentage loading is easier to plan and audit. RIR/RPE can account for day-to-day variation. Velocity can provide an objective signal when the exercise, device, and athlete are calibrated. None should be treated as universally superior.

The Coordinator should choose a control mode by context:

| Context | Preferred primary control | Secondary guardrail |
|---|---|---|
| New trainee, unstable technique | Repetition range plus quality gate | Coach observation or simple RPE |
| Strength-specific block | Percentage or load anchor | RPE/RIR tolerance and technique |
| High day-to-day variability | RIR/RPE or load range | Performance and recovery trend |
| Power / ballistic intent | Velocity or execution quality | Stop threshold and fatigue cap |
| No reliable device or low reporting confidence | Repetition/load range | Coach review |
| Highly stable competition lift | Percentage plus observed performance | e1RM trend and RPE |

Evidence tag: [conditional]. Product tag: control mode is a policy choice; the app must make the mode visible.

### 7. Velocity-based training and velocity-loss thresholds

Meta-analyses comparing velocity-based training with percentage-based training have found no clear early universal difference in strength, jumping, sprinting, or change-of-direction outcomes. A newer meta-analysis in trained individuals reported small advantages for jumping and change-of-direction outcomes but no statistically clear strength or sprint advantage. The evidence is still evolving and should not be presented as a settled replacement for conventional programming.

Velocity-loss studies consistently show that larger velocity loss usually means more repetitions, higher fatigue, higher perceived effort, and greater acute performance cost. Long-term strength differences are not consistently established, and the relationship to hypertrophy is not yet precise enough for a universal threshold. Exercise and load matter.

Device validity is a product constraint. Commercial-device reviews report substantial variation in accuracy and reliability; linear transducers tend to be more dependable than some alternatives.

Product requirements:

- Make VBT an optional measurement layer.
- Store device type, exercise, load, velocity unit, best-rep definition, and quality status.
- Require an exercise-specific baseline rather than transferring thresholds blindly.
- Show “velocity signal unavailable” instead of fabricating a readiness decision.
- Fall back to RIR/RPE, repetitions, and technique when device data is absent or low confidence.
- Use velocity loss primarily to cap fatigue or protect power quality until a coach explicitly adopts a different policy.
- Never auto-increase load merely because velocity is high on one set.

### 8. Periodization, block models, and undulating models

The best-supported conclusion from periodization reviews is nuanced:

- Periodized programs often outperform non-periodized programs for 1RM strength, particularly in trained athletes.
- Hypertrophy differences between periodized and non-periodized programs are generally small or absent when volume is equated.
- Undulating and linear models usually produce similar hypertrophy.
- Undulating models can have a strength advantage in some trained subgroups, but study duration and training history limit certainty.
- Block and mixed-session models can produce different outcomes for power, fat-free mass, or lift-specific strength, but there is no universal winner.

Periodization should therefore be a planning and fatigue-management abstraction:

- Define the current outcome priority.
- Bias exposure toward the relevant load, velocity, volume, and skill.
- Manage competing adaptations and fatigue over time.
- Make transitions explicit and auditable.

Evidence tag: [moderate evidence] for strength organization; [conditional] by training status and goal; [unknown] for a universal block or undulating advantage for hypertrophy.

Product requirement:

- Represent a phase as a goal and constraint bundle, not just a colored calendar block.
- Show what changed between phases: load bias, volume range, exercise specificity, effort target, rest, or power intent.
- Allow a coach to use a block or undulating model without implying it is automatically superior.
- Keep the athlete-facing view focused on the current session and near-term target; place periodization depth in the coach layer.

### 9. Recovery methods: what the evidence actually supports

Recovery should mean returning the athlete to a state where the intended training exposure can be performed with acceptable quality and risk. It should not mean maximizing every acute recovery marker or eliminating all soreness.

| Recovery method | Evidence | Product use | Do not claim |
|---|---|---|---|
| Sleep adequacy and sleep extension | [moderate evidence] Sleep interventions can improve athletic recovery/performance; consecutive restriction can impair force in some multi-joint tasks | Prompt, trend, and adapt session ambition when the athlete reports poor sleep plus performance decline | Do not diagnose sleep disorders or convert one poor night into a full deload |
| Adequate protein | [strong/moderate evidence] Protein supports gains from training; average additional FFM benefit appears to plateau around roughly 1.6 g/kg/day, with uncertainty | Ask about adequacy and coordinate with the athlete’s nutrition policy | Do not promise that a supplement repairs a bad program or prescribe medical nutrition |
| Carbohydrate availability | [conditional] Little average effect in fed, lower-volume sessions; performance may benefit during high-volume or fasted work | Use for long/high-volume sessions or when performance drops with low intake | Do not claim extra carbohydrate independently guarantees hypertrophy |
| Rest intervals | [moderate evidence] Longer rest can preserve volume and improve strength; hypertrophy can occur with both short and long rests | Let performance quality extend rest; default by exercise and goal, not a universal 60-second rule | Do not force short rests when reps or technique deteriorate |
| Active low-intensity recovery | [practice/consensus; limited direct adaptation evidence] May help routine and subjective recovery | Offer optional movement, not as a required “repair” protocol | Do not claim it accelerates long-term hypertrophy |
| Massage, compression, foam rolling, similar modalities | [moderate for acute soreness/fatigue outcomes; uncertain long-term adaptation] | Offer as optional symptom-relief or preference information | Do not present acute relief as greater training adaptation |
| Cold-water immersion | [moderate evidence of possible adaptation interference in some resistance-training contexts] | Warn before frequent post-lifting use when hypertrophy/strength adaptation is the priority | Do not recommend it as a default muscle-growth recovery tool |
| Complete rest / passive deload | [low/conditional] One-week cessation did not improve short-term outcomes in a supervised trial and was worse for some lower-body strength outcomes | Use for clear scheduling, illness, coach policy, or safety reasons | Do not frame passive rest as the evidence-backed default deload |
| Active volume reduction | [low-to-moderate, population-specific] A short reduction in sets can preserve short-term adaptations; direct evidence remains limited | Prefer as a configurable recovery option when fatigue indicators converge | Do not claim a fixed 30–50% reduction for every athlete |
| Time and exposure spacing | [strong principle, numeric rule unknown] Recovery is affected by the interval between challenging exposures | Distribute volume and avoid stacking high-cost exposures without reason | Do not infer recovery from calendar time alone |

#### Sleep, nutrition, and recovery prompts

Sleep and nutrition data should be context, not an excuse to produce a black-box readiness score. The product should show the user which inputs are influencing a recommendation and how strong the evidence is.

Example:

“Sleep was 5h 20m, reported effort was 2 RIR lower than target, and last session’s final set lost 18% of reps. Coordinator proposes holding load and adding two minutes of rest. Confidence: moderate. This is a performance-management decision, not a medical assessment.”

#### Cold-water immersion is a deliberate warning surface

The Roberts trial found attenuated anabolic signaling and long-term strength and hypertrophy adaptations with regular post-exercise cold-water immersion compared with active recovery. A meta-analysis also found a small attenuation of resistance-training strength gains in some contexts. The proper product behavior is not to ban cold water; it is to ask what the athlete’s priority is and warn about the tradeoff if frequent immediate post-lifting immersion is being used for a hypertrophy/strength phase.

### 10. Deloads

Deloading is one of the clearest places where coaching practice is ahead of direct causal evidence. Surveys and qualitative work describe planned reductions in training demand, often through fewer sets and slightly lower effort while maintaining some frequency. However, there is no high-confidence universal calendar such as “every fourth week.”

Coleman et al. studied a one-week complete cessation during a supervised high-volume training program and found no hypertrophy, power, or endurance benefit; continuous training was better for some lower-body strength measures. This does not test every active deload design. Pancar et al. used a direct within-subject design in untrained young men and found that short periods with substantially fewer sets produced similar short-term hypertrophy and strength-endurance outcomes, but the study was small, short, and not a trained-athlete trial.

Evidence posture:

- [moderate evidence] A full stop is not proven to improve outcomes in a short training block.
- [low-to-moderate evidence] Active volume reduction can preserve short-term outcomes in some contexts.
- [practice/consensus] Reducing volume while preserving movement practice and some intensity is common coach practice.
- [heuristic] A fixed periodic deload schedule is a useful planning default only when it is explicitly configurable and overridden by observed response.

Coordinator deload trigger should require a bundle rather than a single symptom:

- repeated performance deterioration across comparable exposures;
- higher-than-target RPE/RIR difficulty;
- accumulated soreness or fatigue that is not resolving;
- reduced sleep or unusual stress;
- falling adherence or repeated missed sessions;
- no obvious technique or equipment explanation;
- no pain or symptom issue requiring clinical escalation.

The default active deload proposal can reduce sets or reduce effort, but its magnitude, duration, and frequency must be coach policy. The app should show the exact before-and-after exposure and not hide the change behind “recovery mode.”

### 11. Exercise rotation, substitutions, and regressions

Systematic variation can support regional hypertrophy or strength in some settings, while excessive or random variation may make adaptations harder to measure. Free weights and machines often produce similar broad strength and hypertrophy outcomes, but strength testing is specific: free-weight training tends to transfer better to free-weight tests and machine training to machine tests. Full ROM generally helps lower-limb strength and hypertrophy when it is tolerable and technically controlled, but upper-limb evidence is more limited.

#### Exercise family identity

Every exercise should have:

- a movement pattern;
- a primary and secondary target tissue;
- a skill/specificity class;
- a stability demand;
- a ROM profile;
- equipment and availability constraints;
- a pain/symptom policy;
- a comparable-exposure group for trend analysis.

This lets the product recognize that a safety-bar squat and a high-bar squat may be related but not identical outcomes. It can suggest a substitution without pretending the new performance is a clean continuation of the old lift.

#### Regression ladder

The regression ladder should preserve the intended stimulus as far as safely possible:

1. Keep the exercise and reduce load.
2. Keep the exercise and reduce repetitions or sets.
3. Increase rest.
4. Use a coach-approved ROM or tempo modification.
5. Reduce stability or technical complexity.
6. Substitute within the same movement and target-tissue family.
7. Move the exposure or split it across sessions.
8. Pause and escalate when symptoms, repeated failure, or safety concerns are present.

This hierarchy is a product heuristic, not a validated clinical algorithm. It should not be used to diagnose pain or tell an athlete to train through symptoms.

#### Exercise rotation rules

Rotation is most defensible when:

- the current exercise no longer fits equipment, schedule, or accessibility;
- pain or symptoms require a coach/clinical decision;
- the phase goal changes from general hypertrophy to lift-specific strength or power;
- a comparable stimulus is needed with lower fatigue or skill demand;
- the coach intentionally wants regional or pattern variation.

Rotation is least defensible as an automatic response to one poor session or a normal week of slow progress.

### 12. Plateaus: evidence, uncertainty, and a responsible diagnostic model

There is no universally validated plateau definition. A single missed rep is noise until proven otherwise. A persistent plateau is a decision problem involving measurement quality, exposure comparability, adherence, fatigue, recovery, exercise skill, dose, and goal specificity.

One-repetition maximum tests can be reliable under standardized conditions, but even a reliable measure has normal variation. Grgic et al. reported generally good-to-excellent test-retest reliability with a median coefficient of variation around 4.2% across studies. The app should therefore use confidence bands and comparable testing conditions rather than treating every one-kilogram difference as meaningful.

Plateau categories:

| Possible cause | What to check | Initial product response |
|---|---|---|
| Measurement noise | Same exercise, warm-up, rest, time, equipment, ROM, and reporting confidence | Hold; collect another comparable exposure |
| Skill or technique | Video/coach notes, inconsistent ROM, setup, tempo, bracing, grip | Technique cue or lower complexity; do not add volume automatically |
| Adherence/data missingness | Completed sets, skipped sessions, load entry quality, substitutions | Mark evidence incomplete; ask; do not call a plateau |
| Underdosing | Current effective sets, effort, frequency, and goal specificity | Propose one small dose change within policy |
| Overfatigue | Performance decline across exercises, RPE drift, sleep/stress, soreness | Hold, extend rest, reduce fatigue, or active deload |
| Recovery constraint | Sleep, nutrition, schedule, illness context | Reduce ambition and prompt support; no diagnosis |
| Exercise mismatch | Pain-free ROM, target tissue, stability, skill, transfer goal | Coach-approved substitution or regression |
| Goal conflict | Hypertrophy, maximal strength, power, conditioning competing | Reprioritize phase and make tradeoff explicit |
| Excessive novelty | Exercise recently changed or data are not comparable | Hold the new variant long enough to measure |

Recommended plateau sequence:

1. Verify that the apparent plateau is real and comparable.
2. Check data completeness, adherence, technique, pain/symptoms, and recovery.
3. Hold the current prescription for another comparable exposure if uncertainty is high.
4. Restore rest or reduce technical complexity if quality is the bottleneck.
5. Change one variable: load, repetitions, sets, frequency, rest, or exercise.
6. Re-measure for enough comparable exposures to test the change.
7. Escalate to the coach if symptoms, repeated regressions, or goal conflict persist.

The “one variable at a time” rule is [heuristic], but it is a strong interpretability choice. If the product changes load, sets, exercise, rest, and frequency together, it cannot tell the coach what worked.

## Coordinator and Auto-Coach Requirements

### 13. Coordinator contract

The Coordinator is the deterministic plan-resolution layer. It should combine the coach’s prescription, athlete context, actual execution, safety constraints, and approved policy to produce a versioned decision. It should not create a mysterious readiness score.

Minimum Coordinator inputs:

| Input group | Required fields |
|---|---|
| Prescription | goal, phase, exercise family, exercise variant, target reps, target sets, load mode, target load or range, target RIR/RPE or velocity, rest, ROM/tempo constraints |
| Athlete state | training age, exercise familiarity, current schedule, equipment availability, coach policy, prior response |
| Actual exposure | completed reps/sets, load, rest, observed effort, velocity if available, technique/quality, ROM, substitution, skipped work |
| Recovery context | sleep, stress, soreness/fatigue, nutrition context if volunteered, schedule constraints |
| Safety context | pain/symptoms separate from readiness, stop flags, medical/clinical constraints if coach-entered |
| Data quality | completeness, source, timestamp, confidence, comparability to baseline |
| Historical trend | comparable exposures, performance trend, volume trend, RPE/RIR drift, recent exercise changes |

Coordinator outputs:

- decision state: progress, hold, regress, recover, substitute, move, pause, or escalate;
- proposed or applied action;
- before/after prescription;
- reason category;
- evidence tag;
- confidence level;
- policy that permitted the action;
- bounds and expiry;
- what signal would reverse or confirm the decision;
- coach approval state;
- immutable version and intervention receipt.

### 14. Required action vocabulary

The product should use a small, explicit action vocabulary. A smaller action set makes the system easier to audit and the UI easier to understand.

| Action | Meaning | Default automation posture |
|---|---|---|
| PROGRESS_REP | Increase repetitions within the approved range | Auto-apply only if coach policy permits and quality is adequate |
| PROGRESS_LOAD | Increase load within a bounded increment | Proposal by default in v1 |
| PROGRESS_SET | Add a work set | Proposal and coach approval |
| HOLD | Repeat the current prescription | Safe default |
| REDUCE_LOAD | Lower load while preserving intent | Auto-apply only within explicit bounds |
| REDUCE_REPS | Lower repetition target | Auto-apply only within explicit bounds |
| REDUCE_SETS | Reduce volume | Auto-apply only when recovery policy permits |
| INCREASE_REST | Extend rest | Safe auto action if the session is active |
| SWITCH_VARIANT | Change to a related exercise variant | Coach approval, except pre-approved availability substitutions |
| REDUCE_ROM | Use a coach-approved ROM modification | Never infer from pain automatically |
| SUBSTITUTE | Use a family-matched alternative | Coach approval or pre-approved flex path |
| MOVE_SESSION | Reschedule or redistribute exposure | Policy-dependent; preserve recovery spacing |
| DELAY | Defer progression until comparable evidence exists | Safe default |
| PAUSE_ESCALATE | Stop automated progression and request coach review | Required for red flags, repeated failure, or uncertainty |

### 15. Auto-Coach v1 boundary

Auto-Coach should be bounded delegation, not a second coach with hidden authority.

Allowed to auto-apply when pre-approved:

- hold the same prescription;
- extend rest within a coach-defined maximum;
- reduce load or repetitions within a small, exercise-specific bound;
- reduce sets within a configured fatigue policy;
- follow a pre-approved substitution for equipment availability;
- choose the next step in a named progression policy, such as reps-first within a defined window;
- mark data as insufficient and request a check-in.

Proposal-only by default:

- increasing load;
- increasing weekly sets or frequency;
- introducing a new exercise;
- changing a phase, block, or priority lift;
- switching from hypertrophy to maximal-strength control;
- prescribing a deload based on subjective data alone;
- making pain-related exercise changes;
- using VBT to override a coach’s percentage policy;
- modifying nutrition, sleep treatment, or medical guidance.

Hard stops:

- pain, neurological symptoms, chest symptoms, dizziness, or other safety signals;
- repeated failure across comparable exposures;
- missing critical data when the proposed action could increase risk or dose;
- conflict with a coach’s explicit constraint;
- unclear exercise identity after a substitution;
- suspected injury or medical issue;
- contradictory goals with no declared priority;
- a device or measurement signal outside its validity policy.

### 16. Intervention receipt

Every material adaptation needs a compact receipt visible to the coach and available in the audit trail:

| Receipt field | Example |
|---|---|
| Decision | Hold load; add 2 minutes rest |
| Before | 3 sets × 8–12 at 80 kg, 2 RIR, 120 s rest |
| After | 3 sets × 8–12 at 80 kg, 2 RIR, 240 s rest |
| Trigger | Reps fell below target while reported effort rose; technique remained acceptable |
| Evidence | [moderate evidence] longer rest can preserve performance; current adjustment is [heuristic] |
| Confidence | Moderate |
| Bounds | Applies to next comparable exposure only |
| Expiry | Re-evaluate after next completed session |
| Undo | Restore prior rest target |
| Owner | Coordinator policy; coach can override |

The receipt is a core trust object, not an analytics afterthought.

### 17. Missing data and uncertainty

The Coordinator must distinguish:

- good performance;
- poor performance;
- missing performance;
- incomparable performance;
- performance with low-confidence data.

Missing data must never be treated as a successful exposure. When the athlete skips the RIR field but completes the prescribed reps, the system can mark the set completed but should not infer low fatigue or readiness. When the exercise changes, the system should preserve the historical link while flagging that the next result is not a clean continuation.

### 18. Evidence-aware adaptation

The app should not expose a research citation on every athlete-facing card. It should, however, let a coach open an evidence drawer from a decision:

- claim being used;
- evidence tag;
- population and outcome;
- what the evidence does not prove;
- PMID and DOI;
- last reviewed date;
- coach policy that converts the evidence into an operational rule.

Example:

“Failure is not required for hypertrophy” is a broad evidence claim.  
“This athlete’s final set may stop at 1–2 RIR today” is a conditional coaching decision.  
“Auto-stop all compound sets at exactly 2 RIR” is a heuristic policy.

The evidence drawer should make those three layers visibly distinct.

### 19. Progression-engine requirements

The product should support several progression policies under one common prescription model:

| Policy | Core decision | Good fit |
|---|---|---|
| Reps-first | Add repetitions within a window before load | General hypertrophy and mixed goals |
| Load-first | Add load while preserving a repetition target | Strength-specific work |
| RIR-first | Adjust load to hit a target effort | Variable readiness |
| Percentage-plus-tolerance | Use a percentage anchor with effort or quality guardrail | Structured strength phases |
| Velocity-gated | Use velocity or velocity loss to protect intent | Power and device-supported coaching |
| Set-progression | Add or remove sets after a response/tolerance review | Dose exploration |
| Frequency-redistribution | Spread the same dose across more or fewer exposures | Schedule, quality, recovery |
| Maintenance | Preserve the smallest dose likely to maintain the target | Travel, stress, transition, or deload |

All policies need:

- a target;
- a success condition;
- a failure condition;
- a data-quality threshold;
- a maximum adjustment;
- an expiry;
- a rollback;
- an escalation condition.

### 20. Recovery and readiness requirements

Do not build a single opaque readiness score in v1. Use separate lanes:

- performance readiness: what the athlete can currently do;
- recovery context: sleep, stress, soreness, fatigue, schedule;
- symptoms/safety: pain or other stop signals;
- data confidence: how much the system trusts the report;
- coach judgment: explicit override or note.

The Coordinator can combine these lanes for a specific decision, but the interface should show which lane drove the action. An athlete can have poor sleep but good performance, or good sleep but concerning symptoms. One score destroys that distinction.

### 21. Regression and substitution requirements

Every exercise family should have a coach-approved flex path with:

- same pattern;
- target tissue;
- acceptable ROM;
- stability/skill tier;
- equipment alternatives;
- loading mode;
- comparable-exposure status;
- pain/symptom handling;
- whether the substitution preserves or changes the phase goal.

The app should say:

“Substitution preserves the general hypertrophy intent but is not a clean test of barbell squat strength.”

That one sentence prevents a large class of false plateau conclusions.

### 22. Plateau detection requirements

Plateau detection should be a queue item, not an automatic diagnosis.

Required checks:

- at least two or more comparable exposures, with the count configurable;
- exercise identity and equipment match;
- completed volume and rest are known;
- technique/ROM quality is not materially different;
- the outcome change exceeds a coach-configurable measurement-noise band;
- no recent exercise, block, schedule, or goal change;
- adherence is sufficient to interpret the trend;
- symptoms are absent or routed to escalation.

The default interface should offer three statuses:

- “Not enough comparable data”
- “Stable / hold”
- “Possible plateau — review causes”

Avoid “plateau detected” as a definitive diagnostic label.

### 23. One-variable intervention rule

When the system proposes a plateau response, it should recommend one primary change and list deferred alternatives. For example:

Primary: preserve load and add 60–120 seconds rest.  
Deferred: reduce load, add a set, switch exercise, or deload.  
Reason: reps fell while effort rose, but volume and sleep data are incomplete.

This keeps the experiment interpretable and protects the athlete from the common coaching failure mode of changing everything at once.

## Sophisticated but visually simple product design

### 24. Design principle: calm surface, deep state

The app can be highly sophisticated if complexity is carried by state, provenance, and progressive disclosure rather than by visible controls.

The core visual rule:

> Show one primary decision, three supporting facts, and an obvious next action. Put the rest behind a deliberate expansion.

Use four product surfaces:

1. Today: what the athlete should do now.
2. Plan: what the coach intends across the week/block.
3. Review: what actually happened and what needs attention.
4. Evidence: why the system supports a rule or recommendation.

Avoid turning every surface into a dashboard. A dashboard is a warehouse; a coaching interface is a decision instrument.

### 25. Coach’s Bench: desktop-first operating surface

The primary coach view should be a dense but quiet weekly grid:

- rows: athletes;
- columns: days or exposures;
- cells: one status marker, one short intent label, one exception marker;
- click: opens an action drawer with the planned-versus-actual diff;
- keyboard: move across athlete/day/exercise contexts;
- filters: only by high-value queues such as attention needed, missing data, pending approvals, symptoms, plateau review, or deload proposal.

Do not put every metric in the grid. If a cell needs more than three visible elements, it is probably trying to be a detail view.

Recommended top-level queue:

- Needs coach decision
- Auto-Coach changes to review
- Missing or incomparable data
- Possible plateau
- Recovery concern
- Upcoming phase transition

This builds on the existing week-review handoff and keeps the coach’s attention on decisions, not decoration.

### 26. Athlete surface: one calm action

The athlete should see:

- next session;
- what matters today;
- target range and rest;
- one optional check-in;
- one “why this changed” link when adaptation occurs.

Do not expose a research dashboard, a readiness score, or a multicolored fatigue map as the primary experience. The athlete can open detail when curious, but the default should answer:

“What do I do, what should it feel like, and what do I do if today is different?”

### 27. Progressive disclosure tiers

| Tier | Audience | Visible information |
|---|---|---|
| Tier 0 | Athlete glance | Next action, target, rest, stop/escalate instruction |
| Tier 1 | Coach triage | Planned versus actual, exception, proposed action, confidence |
| Tier 2 | Coach deep audit | Data lineage, trend, evidence tag, source links, policy, version history |

This allows a sophisticated underlying state model without forcing the user to read the state model.

### 28. Adaptation preview as a diff

Every proposal should show a before-and-after diff:

- Load: 80 kg → 77.5 kg
- Sets: 3 → 2
- Rest: 120 s → 180 s
- RIR: 2 target unchanged
- Applies: next comparable exposure only
- Why: final two sessions missed the bottom of the range with rising effort
- Confidence: moderate
- Undo: restore previous prescription

Use a single accent color for the changed field. Do not color every field by sentiment. The eye should find the change immediately.

### 29. Visual language

Use five semantic states at most:

- normal;
- attention;
- blocked;
- approved/proposed;
- informational.

Prefer text and shape plus color. Do not make red, amber, green, blue, purple, and gray each mean a different physiological state. Color blindness, dark mode, and cognitive load all argue for restrained semantics.

Charts should be sparse:

- baseline and current trend;
- planned versus actual;
- one confidence or variability band;
- one event marker for exercise/block changes.

Avoid radar charts, “readiness gauges,” and decorative recovery meters. They create false precision and consume attention without improving a decision.

### 30. Evidence drawer

The evidence drawer is coach-facing and should be searchable by claim:

- “failure required?”
- “rep ranges for hypertrophy”
- “longer rest”
- “deload”
- “exercise variation”
- “VBT versus percentage”

Each result should show:

- claim summary;
- evidence tag;
- study type;
- population;
- outcome;
- limitation;
- PMID;
- DOI;
- source link.

The drawer should explicitly show “what this does not prove.” This is how the product resists turning useful research into rigid mythology.

### 31. Check-in design

Keep check-ins short and separate the lanes:

- readiness: energy, sleep, stress, motivation;
- symptoms: pain, unusual symptoms, stop flags;
- execution: what was completed and how it felt;
- constraints: time, equipment, schedule.

Do not ask ten questions when the system only needs one. Use adaptive prompts:

- If performance is stable and no symptoms are present, ask nothing extra.
- If performance drops and sleep is poor, ask one recovery question.
- If pain is reported, route to safety and coach review rather than asking more readiness questions.

### 32. Review and week-close

The week review should not produce one adherence score. It should show:

- planned dose;
- completed dose;
- meaningful substitutions;
- progression decisions;
- regressions/recovery actions;
- unresolved exceptions;
- data confidence;
- next-week proposals.

The coach should be able to approve, edit, reject, or defer each proposal. The app should remember the coach’s policy choice without pretending that one choice is universally correct.

### 33. Empty, offline, and error states

Sophistication is lost if the edge states are vague. Every state needs plain language:

- “No comparable exposure yet — hold until the next session.”
- “This result cannot be compared because the exercise changed.”
- “Velocity signal unavailable — using reps and reported effort.”
- “Pain/symptom reported — automated progression paused.”
- “Coach policy requires approval before increasing weekly volume.”
- “Data incomplete — this is not evidence of good readiness.”

### 34. Interaction budgets

Design for:

- five-second athlete glance;
- thirty-second coach triage;
- two-minute coach audit;
- five-minute deep evidence review only when needed.

If a standard progression decision requires navigating through multiple analytics pages, the system is sophisticated in the wrong place.

## Counterpoints and Challenges

### 35. The biggest risk: converting broad evidence into fake precision

Research often supports a direction but not the number a product wants to hard-code. “More volume often helps” does not mean “add one set after exactly two failed sessions.” “Failure is not required” does not mean “always stop at 2 RIR.” “Longer rest can preserve performance” does not mean “rest exactly 180 seconds.”

Every such number should be stored as coach policy with:

- a rationale;
- a scope;
- an evidence tag;
- a safe bound;
- a review date;
- an override.

### 36. The app should not chase novelty

New meta-analyses and individual-response studies are useful, but the product should not change its core rules every time a new paper appears. Stable primitives should be:

- comparable exposure;
- explicit intent;
- controlled progression axis;
- quality and safety gates;
- reversible decisions;
- audit trail.

New evidence should update policy defaults or evidence notes, not silently rewrite active programs.

### 37. Individualization is not the same as complexity

More inputs do not automatically create better coaching. The product should collect a field only if it can change a decision, improve safety, improve interpretability, or support a coach’s workflow. A high number of fields with no clear decision path will reduce adherence and data quality.

### 38. Autoregulation can become post hoc storytelling

If the app changes the plan after every hard session, it may appear responsive while destroying the ability to learn whether the plan worked. Autoregulation should be bounded and phase-aware. “Hold” is often the scientifically cleaner action than “adapt.”

### 39. Recovery is not a moral score

Poor sleep, stress, or a missed session should not be displayed as athlete failure. Recovery data are context for managing training demand. The product should reduce shame, not gamify exhaustion.

### 40. Pain is not a performance variable

Pain and symptoms should not be folded into a readiness score or translated into an automatic “regression.” The system can pause, route, and record; a coach or qualified clinician must decide what the symptom means. This is both a safety requirement and an evidence-boundary requirement.

## Actionable Next Steps

### 41. Ranked product recommendations

Priority 0 — trust and correctness:

1. Add explicit progression-axis selection to every exercise prescription.
2. Separate intent, planned prescription, actual exposure, and Coordinator resolution.
3. Add evidence tags and source links to coach-facing rules.
4. Make Auto-Coach increases proposal-only in v1.
5. Add intervention receipts with before/after, reason, confidence, bounds, expiry, and undo.
6. Separate readiness, recovery context, symptoms, and data confidence.
7. Implement “missing data is not good data.”
8. Add hard stops for pain/symptoms, repeated failures, missing critical data, and coach-policy conflicts.
9. Make substitutions preserve exercise-family identity and flag non-comparability.
10. Use “possible plateau” rather than “plateau detected.”

Priority 1 — progression and recovery:

11. Support reps-first, load-first, RIR-first, percentage-plus-tolerance, and optional velocity-gated policies.
12. Provide configurable repetition windows and load increments.
13. Add a minimum viable plan mode for travel, stress, illness recovery, or schedule constraints.
14. Add active-deload proposals based on converging fatigue signals, not calendar alone.
15. Let rest extend automatically within coach-defined bounds when performance quality falls.
16. Add a comparable-exposure confidence indicator.
17. Add a one-variable intervention recommendation to plateau review.
18. Track volume as a range and trend, including direct/indirect contribution assumptions.
19. Track exercise stability, ROM, equipment, and technical quality.
20. Use percentage, RIR, and velocity as visible control modes rather than hidden calculation details.

Priority 2 — sophisticated coach workflow:

21. Build the weekly Coach’s Bench grid with three visible items per cell: status, intent, exception.
22. Add a decision queue for approvals, missing data, possible plateaus, recovery proposals, and symptom escalations.
23. Add an adaptation-preview drawer with a before/after diff.
24. Add a coach-editable policy panel for numeric heuristics and safe bounds.
25. Add a compact evidence drawer with PMID, DOI, population, outcome, and limitation.
26. Add “why this did not progress” as a first-class explanation.
27. Add next-session expiry so temporary adaptations do not silently become permanent.
28. Add compare mode for the same exercise family across exposures.
29. Add keyboard-friendly navigation and command actions for coaches managing many athletes.
30. Add a week-close review that distinguishes completed, substituted, missing, and incomparable work.

Priority 3 — later intelligence:

31. Calibrate RIR accuracy by exercise family and athlete.
32. Evaluate whether VBT devices are reliable enough for each exercise and coach.
33. Study which plateau checks reduce unnecessary program changes.
34. Use within-athlete response data cautiously to compare progression axes.
35. Measure whether receipts improve coach acceptance, override quality, and athlete trust.

### 42. Acceptance criteria for the research-informed coaching loop

The product is ready for a first research-informed test when:

- a coach can state the goal, progression axis, effort target, and success condition for every key exercise;
- an athlete can complete the next session without seeing research complexity;
- every adaptation has a visible reason and rollback;
- the system never confuses missing data with success;
- a substitution is linked to an exercise family and marked as comparable or not comparable;
- a possible plateau shows its evidence and uncertainty;
- a recovery proposal names the signal that triggered it;
- a coach can override any heuristic;
- Auto-Coach cannot increase load, sets, frequency, or phase difficulty without explicit policy approval;
- symptoms pause adaptation and route to review;
- a researcher or coach can trace a decision back to the exact source claim and policy version.

### 43. Evaluation plan

Do not evaluate only whether the app predicts a future 1RM. Evaluate whether it improves coaching decisions.

Core measures:

- false progression rate;
- unnecessary regression rate;
- coach override rate and override reason;
- percentage of decisions with sufficient comparable data;
- time to triage a weekly roster;
- time to understand an adaptation receipt;
- rate of silent plan drift;
- athlete completion and check-in burden;
- plateau false-positive and false-negative review;
- symptom escalation compliance;
- whether different coaches reach consistent decisions from the same case;
- whether athletes understand what changed and why.

Use case-based evaluation with controlled scenarios:

- true improvement;
- one bad day;
- missing data;
- exercise substitution;
- high effort with stable load;
- load progression with declining technique;
- poor sleep with stable performance;
- pain report;
- repeated performance decline;
- device failure;
- goal change from hypertrophy to strength.

The test is not “did the algorithm add weight?” The test is “did the system choose a defensible next action, make its uncertainty visible, and preserve human control?”

## Source Register

The following sources are the backbone of this addendum. Links go directly to PubMed or the DOI landing page. Study type and evidence use are stated so that a source is not overextended beyond what it tested.

### Progression, overload, and dose

1. Plotkin DL, et al. Progressive overload without progressing load? The effects of load or repetition progression on muscular adaptations. PeerJ. 2022. Primary controlled trial in resistance-trained adults. PMID 36199287. DOI: 10.7717/peerj.14142. [PubMed](https://pubmed.ncbi.nlm.nih.gov/36199287/) · [DOI](https://doi.org/10.7717/peerj.14142)

2. Chaves TS, et al. Effects of Resistance Training Overload Progression Protocols on Strength and Muscle Mass. International Journal of Sports Medicine. 2024. Primary randomized trial in previously untrained men and women. PMID 38286426. DOI: 10.1055/a-2256-5857. [PubMed](https://pubmed.ncbi.nlm.nih.gov/38286426/) · [DOI](https://doi.org/10.1055/a-2256-5857)

3. Scarpelli MC, et al. Individual muscle hypertrophy response is affected by the overload progression model. European Journal of Applied Physiology. 2025. Exploratory primary trial in untrained adults; useful for heterogeneity, not a validated classifier. PMID 40500534. DOI: 10.1007/s00421-025-05817-y. [PubMed](https://pubmed.ncbi.nlm.nih.gov/40500534/) · [DOI](https://doi.org/10.1007/s00421-025-05817-y)

4. Enes AR, et al. Effects of Different Weekly Set Progressions on Muscular Adaptations in Trained Males: Is There a Dose-Response Effect? Medicine & Science in Sports & Exercise. 2024. Primary trial of planned set progression. PMID 37796222. [PubMed](https://pubmed.ncbi.nlm.nih.gov/37796222/)

5. Schoenfeld BJ, et al. Dose-response relationship between weekly resistance training volume and increases in muscle mass: a systematic review and meta-analysis. Journal of Sports Sciences. 2017. PMID 27433992. DOI: 10.1080/02640414.2016.1210197. [PubMed](https://pubmed.ncbi.nlm.nih.gov/27433992/) · [DOI](https://doi.org/10.1080/02640414.2016.1210197)

6. Schoenfeld BJ, et al. Resistance Training Volume Enhances Muscle Hypertrophy but Not Strength in Trained Men. Medicine & Science in Sports & Exercise. 2019. Primary trial. PMID 30153194. DOI: 10.1249/MSS.0000000000001764. [PubMed](https://pubmed.ncbi.nlm.nih.gov/30153194/) · [DOI](https://doi.org/10.1249/MSS.0000000000001764)

7. Ralston GW, et al. The Effect of Weekly Set Volume on Strength Gain: A Meta-Analysis. Sports Medicine. 2017. PMID 28755103. DOI: 10.1007/s40279-017-0762-7. [PubMed](https://pubmed.ncbi.nlm.nih.gov/28755103/) · [DOI](https://doi.org/10.1007/s40279-017-0762-7)

8. Pelland JC, et al. The Resistance Training Dose Response: Meta-Regressions Exploring the Effects of Weekly Volume and Frequency on Muscle Hypertrophy and Strength Gain. Sports Medicine. 2026. Recent meta-regression; useful but not a universal set-count law. PMID 41343037. DOI: 10.1007/s40279-025-02344-w. [PubMed](https://pubmed.ncbi.nlm.nih.gov/41343037/) · [DOI](https://doi.org/10.1007/s40279-025-02344-w)

9. Krieger JW. Single versus multiple sets of resistance exercise: a meta-regression. Journal of Strength and Conditioning Research. 2010. PMID 20300012. [PubMed](https://pubmed.ncbi.nlm.nih.gov/20300012/)

10. Androulakis-Korakakis P, et al. Minimum Effective Training Dose Required to Increase 1RM Strength in Resistance-Trained Men: A Systematic Review and Meta-Analysis. Sports Medicine. 2020. PMID 31797219. DOI: 10.1007/s40279-019-01236-0. [PubMed](https://pubmed.ncbi.nlm.nih.gov/31797219/) · [DOI](https://doi.org/10.1007/s40279-019-01236-0)

11. Spiering BA, et al. Maintaining Physical Performance: The Minimal Dose of Exercise. Sports Medicine. 2021. PMID 33629972. [PubMed](https://pubmed.ncbi.nlm.nih.gov/33629972/)

### Frequency, training status, and loading

12. Schoenfeld BJ, et al. Effects of Resistance Training Frequency on Measures of Muscle Hypertrophy: A Systematic Review and Meta-Analysis. Sports Medicine. 2016. PMID 27102172. DOI: 10.1007/s40279-016-0543-8. [PubMed](https://pubmed.ncbi.nlm.nih.gov/27102172/) · [DOI](https://doi.org/10.1007/s40279-016-0543-8)

13. Grgic J, et al. Effect of Resistance Training Frequency on Gains in Muscular Strength: A Systematic Review and Meta-Analysis. Sports Medicine. 2018. PMID 29470825. DOI: 10.1007/s40279-018-0872-x. [PubMed](https://pubmed.ncbi.nlm.nih.gov/29470825/) · [DOI](https://doi.org/10.1007/s40279-018-0872-x)

14. Lopez P, et al. Resistance Training Load Effects on Muscle Hypertrophy and Strength Gain: Systematic Review and Network Meta-analysis. Medicine & Science in Sports & Exercise. 2021. PMID 33433148. DOI: 10.1249/MSS.0000000000002585. [PubMed](https://pubmed.ncbi.nlm.nih.gov/33433148/) · [DOI](https://doi.org/10.1249/MSS.0000000000002585)

15. Schoenfeld BJ, et al. Strength and Hypertrophy Adaptations Between Low- vs. High-Load Resistance Training: A Systematic Review and Meta-analysis. Journal of Strength and Conditioning Research. 2017. PMID 28834797. DOI: 10.1519/JSC.0000000000002200. [PubMed](https://pubmed.ncbi.nlm.nih.gov/28834797/) · [DOI](https://doi.org/10.1519/JSC.0000000000002200)

16. Schoenfeld BJ, et al. Effects of Low- vs. High-Load Resistance Training on Muscle Strength and Hypertrophy in Well-Trained Men. Journal of Strength and Conditioning Research. 2015. PMID 25853914. DOI: 10.1519/JSC.0000000000000958. [PubMed](https://pubmed.ncbi.nlm.nih.gov/25853914/) · [DOI](https://doi.org/10.1519/JSC.0000000000000958)

17. Carvalho L, et al. Resistance Training with Different Loads in Volume-Matched Conditions: A Systematic Review and Meta-Analysis. Applied Physiology, Nutrition, and Metabolism. 2022. PMID 35015560. DOI: 10.1139/apnm-2021-0515. [PubMed](https://pubmed.ncbi.nlm.nih.gov/35015560/) · [DOI](https://doi.org/10.1139/apnm-2021-0515)

18. Ahtiainen JP, et al. Individual and Age-Related Variability in Response to Resistance Training. Age. 2016. PMID 26767377. DOI: 10.1007/s11357-015-9870-1. [PubMed](https://pubmed.ncbi.nlm.nih.gov/26767377/) · [DOI](https://doi.org/10.1007/s11357-015-9870-1)

### Failure, RIR/RPE, and fatigue

19. Grgic J, et al. Effects of resistance training performed to repetition failure or non-failure on muscular strength and hypertrophy: a systematic review and meta-analysis. Journal of Sport and Health Science. 2022. PMID 33497853. DOI: 10.1016/j.jshs.2021.01.007. [PubMed](https://pubmed.ncbi.nlm.nih.gov/33497853/) · [DOI](https://doi.org/10.1016/j.jshs.2021.01.007)

20. Vieira AF, et al. Effects of Resistance Training to Muscle Failure on Acute Fatigue: A Systematic Review and Meta-Analysis. Sports Medicine. 2022. PMID 34881412. DOI: 10.1007/s40279-021-01602-x. [PubMed](https://pubmed.ncbi.nlm.nih.gov/34881412/) · [DOI](https://doi.org/10.1007/s40279-021-01602-x)

21. Morán-Navarro R, et al. Time Course of Recovery Following Resistance Training Leading or Not to Failure. European Journal of Applied Physiology. 2017. PMID 28965198. DOI: 10.1007/s00421-017-3725-7. [PubMed](https://pubmed.ncbi.nlm.nih.gov/28965198/) · [DOI](https://doi.org/10.1007/s00421-017-3725-7)

22. Hermann AN, et al. Without Fail: Muscular Adaptations in Single-Set Resistance Training Performed to Failure or with Repetitions-in-Reserve. Medicine & Science in Sports & Exercise. 2025. Primary trial in resistance-trained adults. PMID 40249908. DOI: 10.1249/MSS.0000000000003728. [PubMed](https://pubmed.ncbi.nlm.nih.gov/40249908/) · [DOI](https://doi.org/10.1249/MSS.0000000000003728)

23. Refalo MC, et al. Towards improved understanding of proximity-to-failure in resistance training: a scoping review. Sports Medicine / Journal of Sports Sciences literature. 2022. PMID 35658845. DOI: 10.1080/02640414.2022.2080165. [PubMed](https://pubmed.ncbi.nlm.nih.gov/35658845/) · [DOI](https://doi.org/10.1080/02640414.2022.2080165)

24. Helms ER, et al. Application of the Repetitions in Reserve-Based Rating of Perceived Exertion Scale for Resistance Training. Strength and Conditioning Journal. 2016. PMID 27531969. DOI: 10.1519/SSC.0000000000000218. [PubMed](https://pubmed.ncbi.nlm.nih.gov/27531969/) · [DOI](https://doi.org/10.1519/SSC.0000000000000218)

25. Zourdos MC, et al. Novel Resistance Training-Specific Rating of Perceived Exertion Scale Measuring Repetitions in Reserve. Journal of Strength and Conditioning Research. 2016. PMID 26049792. DOI: 10.1519/JSC.0000000000001049. [PubMed](https://pubmed.ncbi.nlm.nih.gov/26049792/) · [DOI](https://doi.org/10.1519/JSC.0000000000001049)

26. Lovegrove A, et al. RIR is a Reliable Tool for Prescribing and Monitoring Resistance Training. Journal of Strength and Conditioning Research. 2022. PMID 36135029. DOI: 10.1519/JSC.0000000000003952. [PubMed](https://pubmed.ncbi.nlm.nih.gov/36135029/) · [DOI](https://doi.org/10.1519/JSC.0000000000003952)

27. Hughes LJ, et al. Estimating Repetitions in Reserve in Four Commonly Used Resistance Exercises. Journal of Strength and Conditioning Research. 2020. PMID 33337690. DOI: 10.1519/JSC.0000000000003865. [PubMed](https://pubmed.ncbi.nlm.nih.gov/33337690/) · [DOI](https://doi.org/10.1519/JSC.0000000000003865)

### Autoregulation, velocity, and periodization

28. Hickmott L, et al. The Effect of Load and Volume Autoregulation on Muscular Strength and Hypertrophy: A Systematic Review and Meta-Analysis. Sports Medicine - Open. 2022. PMID 35038063. DOI: 10.1186/s40798-021-00404-9. [PubMed](https://pubmed.ncbi.nlm.nih.gov/35038063/) · [DOI](https://doi.org/10.1186/s40798-021-00404-9)

29. Zhang Y, et al. Auto-Regulation Method vs. Fixed-Loading Method in Maximum Strength Training for Athletes: A Systematic Review and Meta-Analysis. Frontiers in Physiology. 2021. PMID 33776802. DOI: 10.3389/fphys.2021.651112. [PubMed](https://pubmed.ncbi.nlm.nih.gov/33776802/) · [DOI](https://doi.org/10.3389/fphys.2021.651112)

30. Huang W, et al. Autoregulated Resistance Training for Maximal Strength Enhancement: Systematic Review and Network Meta-Analysis. Journal of Exercise Science & Fitness. 2025. PMID 40791980. DOI: 10.1016/j.jesf.2025.07.006. [PubMed](https://pubmed.ncbi.nlm.nih.gov/40791980/) · [DOI](https://doi.org/10.1016/j.jesf.2025.07.006)

31. Liao CD, et al. Effects of Velocity-Based Training vs. Percentage-Based Training on Improving Muscle Strength: A Systematic Review and Meta-Analysis. PLOS ONE. 2021. PMID 34793506. DOI: 10.1371/journal.pone.0259790. [PubMed](https://pubmed.ncbi.nlm.nih.gov/34793506/) · [DOI](https://doi.org/10.1371/journal.pone.0259790)

32. Orange ST, et al. Comparison of the Effects of Velocity-Based Training and Traditional Resistance Training on Adaptations to Resistance Training in Trained Individuals: A Systematic Review and Meta-analysis. Sports Medicine. 2022. PMID 35380511. DOI: 10.1080/02640414.2022.2059320. [PubMed](https://pubmed.ncbi.nlm.nih.gov/35380511/) · [DOI](https://doi.org/10.1080/02640414.2022.2059320)

33. Wang R, et al. The effects of velocity-based vs percentage-based resistance training on sports performance in trained individuals: a systematic review and meta-analysis. BMC Sports Science, Medicine and Rehabilitation. 2026. PMID 41491263. DOI: 10.1186/s13102-025-01504-9. [PubMed](https://pubmed.ncbi.nlm.nih.gov/41491263/) · [DOI](https://doi.org/10.1186/s13102-025-01504-9)

34. Jukic I, et al. The Acute and Chronic Effects of Implementing Velocity Loss Thresholds in Resistance Training: A Systematic Review and Meta-Analysis. Sports Medicine. 2023. PMID 36178597. DOI: 10.1007/s40279-022-01754-4. [PubMed](https://pubmed.ncbi.nlm.nih.gov/36178597/) · [DOI](https://doi.org/10.1007/s40279-022-01754-4)

35. Pareja-Blanco F, et al. Effects of Velocity Loss During Resistance Training on Athletic Performance, Strength Gains and Muscle Adaptations. Scandinavian Journal of Medicine & Science in Sports. 2017. PMID 27038416. [PubMed](https://pubmed.ncbi.nlm.nih.gov/27038416/)

36. Weakley J, et al. Validity and Reliability of Commercially Available Resistance Training Monitoring Devices. Sports Medicine. 2021. PMID 33475985. DOI: 10.1007/s40279-020-01382-w. [PubMed](https://pubmed.ncbi.nlm.nih.gov/33475985/) · [DOI](https://doi.org/10.1007/s40279-020-01382-w)

37. Moesgaard L, et al. Effects of Periodization on Strength and Muscle Hypertrophy in Volume-Equated Resistance Training Programs: A Systematic Review and Meta-analysis. Sports Medicine. 2022. PMID 35044672. DOI: 10.1007/s40279-021-01636-1. [PubMed](https://pubmed.ncbi.nlm.nih.gov/35044672/) · [DOI](https://doi.org/10.1007/s40279-021-01636-1)

38. Harries SK, et al. Systematic Review and Meta-analysis of Linear and Undulating Periodized Resistance Training Programs on Muscular Strength. Journal of Strength and Conditioning Research. 2015. PMID 25268290. DOI: 10.1519/JSC.0000000000000712. [PubMed](https://pubmed.ncbi.nlm.nih.gov/25268290/) · [DOI](https://doi.org/10.1519/JSC.0000000000000712)

39. Grgic J, et al. Effects of Linear and Daily Undulating Periodized Resistance Training Programs on Measures of Muscle Hypertrophy: A Systematic Review and Meta-analysis. PeerJ. 2017. PMID 28848690. DOI: 10.7717/peerj.3695. [PubMed](https://pubmed.ncbi.nlm.nih.gov/28848690/) · [DOI](https://doi.org/10.7717/peerj.3695)

40. Bartolomei S, et al. Comparison Between Block and Traditional Periodization Models on Strength and Power in Trained Men. Journal of Strength and Conditioning Research. 2014. PMID 24476775. DOI: 10.1519/JSC.0000000000000366. [PubMed](https://pubmed.ncbi.nlm.nih.gov/24476775/) · [DOI](https://doi.org/10.1519/JSC.0000000000000366)

### Deloads, recovery, sleep, nutrition, and rest

41. Coleman M, et al. Gaining More from Doing Less? The Effects of a One-Week Deload Period During a 9-Week Strength Training Program on Muscular Adaptations. PeerJ. 2024. Primary trial; passive cessation rather than every possible deload design. PMID 38274324. DOI: 10.7717/peerj.16777. [PubMed](https://pubmed.ncbi.nlm.nih.gov/38274324/) · [DOI](https://doi.org/10.7717/peerj.16777)

42. Pancar Z, et al. Effects of Deload Periods in Resistance Training on Muscle Hypertrophy and Strength Endurance in Untrained Young Men: A Randomized Within-Subject Design. Scientific Reports. 2026. Primary active-deload trial; small and short untrained sample. PMID 41730991. DOI: 10.1038/s41598-026-40612-5. [PubMed](https://pubmed.ncbi.nlm.nih.gov/41730991/) · [DOI](https://doi.org/10.1038/s41598-026-40612-5)

43. Rogerson D, et al. Deloading Practices in Strength and Physique Sports: A Cross-sectional Survey. Sports Medicine - Open. 2024. Practice survey, not causal evidence. PMID 38499934. DOI: 10.1186/s40798-024-00691-y. [PubMed](https://pubmed.ncbi.nlm.nih.gov/38499934/) · [DOI](https://doi.org/10.1186/s40798-024-00691-y)

44. Bell L, et al. “You Can’t Shoot Another Bullet Until You’ve Reloaded the Gun”: Coach and Athlete Perspectives on Deloading. Frontiers in Sports and Active Living. 2022. Qualitative/consensus-adjacent evidence. PMID 36619355. DOI: 10.3389/fspor.2022.1073223. [PubMed](https://pubmed.ncbi.nlm.nih.gov/36619355/) · [DOI](https://doi.org/10.3389/fspor.2022.1073223)

45. Vann CG, et al. Molecular Differences Between Active Recovery and Passive Recovery Following a 6-Week High-Volume Resistance Training Program. Journal of Strength and Conditioning Research. 2021. PMID 34138821. DOI: 10.1519/JSC.0000000000004071. [PubMed](https://pubmed.ncbi.nlm.nih.gov/34138821/) · [DOI](https://doi.org/10.1519/JSC.0000000000004071)

46. Knowles OE, et al. Inadequate Sleep and Muscle Strength: Implications for Resistance Training. Journal of Science and Medicine in Sport. 2018. Systematic review. PMID 29422383. DOI: 10.1016/j.jsams.2018.01.012. [PubMed](https://pubmed.ncbi.nlm.nih.gov/29422383/) · [DOI](https://doi.org/10.1016/j.jsams.2018.01.012)

47. Bonnar D, et al. Sleep Interventions Designed to Improve Athletic Performance and Recovery: A Systematic Review. Sports Medicine. 2018. PMID 29352373. DOI: 10.1007/s40279-017-0832-x. [PubMed](https://pubmed.ncbi.nlm.nih.gov/29352373/) · [DOI](https://doi.org/10.1007/s40279-017-0832-x)

48. Morton RW, et al. A Systematic Review, Meta-analysis and Meta-regression of the Effect of Protein Supplementation on Resistance Training-Induced Gains in Muscle Mass and Strength in Healthy Adults. British Journal of Sports Medicine. 2018. PMID 28698222. DOI: 10.1136/bjsports-2017-097608. [PubMed](https://pubmed.ncbi.nlm.nih.gov/28698222/) · [DOI](https://doi.org/10.1136/bjsports-2017-097608)

49. Nunes EA, et al. Systematic Review and Meta-analysis of Protein Intake to Support Muscle Mass and Function in Healthy Adults. Journal of Cachexia, Sarcopenia and Muscle. 2022. PMID 35187864. DOI: 10.1002/jcsm.12922. [PubMed](https://pubmed.ncbi.nlm.nih.gov/35187864/) · [DOI](https://doi.org/10.1002/jcsm.12922)

50. Pearson AG, et al. Impact of Dietary Protein Supplementation on Recovery from Resistance Exercise-Induced Muscle Damage: A Systematic Review and Meta-analysis. European Journal of Nutrition. 2023. PMID 36513777. DOI: 10.1038/s41430-022-01250-y. [PubMed](https://pubmed.ncbi.nlm.nih.gov/36513777/) · [DOI](https://doi.org/10.1038/s41430-022-01250-y)

51. Henselmans M, et al. The Effect of Carbohydrate Intake on Strength and Resistance Training Performance: A Systematic Review. Nutrients. 2022. PMID 35215506. DOI: 10.3390/nu14040856. [PubMed](https://pubmed.ncbi.nlm.nih.gov/35215506/) · [DOI](https://doi.org/10.3390/nu14040856)

52. King AJ, et al. The Effect of Carbohydrate Intake on Strength and Resistance Exercise Performance: A Systematic Review and Meta-analysis. Sports Medicine. 2022. PMID 35809162. DOI: 10.1007/s40279-022-01716-w. [PubMed](https://pubmed.ncbi.nlm.nih.gov/35809162/) · [DOI](https://doi.org/10.1007/s40279-022-01716-w)

53. Schoenfeld BJ, et al. Longer Interset Rest Periods Enhance Muscle Strength and Hypertrophy in Resistance-Trained Men. Journal of Strength and Conditioning Research. 2016. PMID 26605807. DOI: 10.1519/JSC.0000000000001272. [PubMed](https://pubmed.ncbi.nlm.nih.gov/26605807/) · [DOI](https://doi.org/10.1519/JSC.0000000000001272)

54. Grgic J, et al. Effects of Rest Interval Duration in Resistance Training on Measures of Muscle Hypertrophy: A Systematic Review. Sports Medicine. 2017. PMID 28641044. DOI: 10.1080/17461391.2017.1340524. [PubMed](https://pubmed.ncbi.nlm.nih.gov/28641044/) · [DOI](https://doi.org/10.1080/17461391.2017.1340524)

55. Roberts LA, et al. Post-exercise Cold Water Immersion Attenuates Acute Anabolic Signalling and Long-term Adaptations in Muscle to Strength Training. Journal of Physiology. 2015. PMID 26174323. DOI: 10.1113/JP270570. [PubMed](https://pubmed.ncbi.nlm.nih.gov/26174323/) · [DOI](https://doi.org/10.1113/JP270570)

56. Grgic J, et al. Effects of Post-exercise Cold-water Immersion on Resistance Training-induced Gains in Muscle Strength: A Meta-analysis. European Journal of Sport Science. 2023. PMID 35068365. DOI: 10.1080/17461391.2022.2033851. [PubMed](https://pubmed.ncbi.nlm.nih.gov/35068365/) · [DOI](https://doi.org/10.1080/17461391.2022.2033851)

57. Dupuy O, et al. An Evidence-Based Approach for Choosing Post-exercise Recovery Techniques to Reduce Markers of Muscle Damage, Soreness, Fatigue, and Inflammation. Frontiers in Physiology. 2018. Systematic review and meta-analysis. PMID 29755363. DOI: 10.3389/fphys.2018.00403. [PubMed](https://pubmed.ncbi.nlm.nih.gov/29755363/) · [DOI](https://doi.org/10.3389/fphys.2018.00403)

### Exercise selection, variation, ROM, and plateaus

58. Kassiano W, et al. Does Varying Resistance Exercises Promote Superior Muscle Hypertrophy and Strength Gains? A Systematic Review. Journal of Strength and Conditioning Research. 2022. PMID 35438660. DOI: 10.1519/JSC.0000000000004258. [PubMed](https://pubmed.ncbi.nlm.nih.gov/35438660/) · [DOI](https://doi.org/10.1519/JSC.0000000000004258)

59. Heidel RE, et al. Free-weight and Machine-based Training: A Systematic Review and Meta-analysis. Journal of Sports Medicine and Physical Fitness. 2022. PMID 34609100. DOI: 10.23736/S0022-4707.21.12929-9. [PubMed](https://pubmed.ncbi.nlm.nih.gov/34609100/) · [DOI](https://doi.org/10.23736/S0022-4707.21.12929-9)

60. Hernández-Belmonte A, et al. Free-weight and Machine-based Training are Equally Effective on Strength and Hypertrophy: A Randomized Controlled Trial. Medicine & Science in Sports & Exercise. 2023. PMID 37535335. DOI: 10.1249/MSS.0000000000003271. [PubMed](https://pubmed.ncbi.nlm.nih.gov/37535335/) · [DOI](https://doi.org/10.1249/MSS.0000000000003271)

61. Haugen T, et al. Free-weight versus Machine-based Strength Training: A Systematic Review and Meta-analysis of 1RM Strength. BMC Sports Science, Medicine and Rehabilitation. 2023. PMID 37582807. DOI: 10.1186/s13102-023-00713-4. [PubMed](https://pubmed.ncbi.nlm.nih.gov/37582807/) · [DOI](https://doi.org/10.1186/s13102-023-00713-4)

62. Pallarés JG, et al. Effects of Range of Motion on Resistance Training Adaptations: A Systematic Review and Meta-analysis. Scandinavian Journal of Medicine & Science in Sports. 2021. PMID 34170576. DOI: 10.1111/sms.14006. [PubMed](https://pubmed.ncbi.nlm.nih.gov/34170576/) · [DOI](https://doi.org/10.1111/sms.14006)

63. Schoenfeld BJ, Grgic J. Effects of Range of Motion on Muscle Development During Resistance Training Interventions: A Systematic Review. SAGE Open Medicine. 2020. PMID 32030125. DOI: 10.1177/2050312120901559. [PubMed](https://pubmed.ncbi.nlm.nih.gov/32030125/) · [DOI](https://doi.org/10.1177/2050312120901559)

64. Nunes JP, et al. Resistance Training Exercise Order: A Systematic Review and Meta-analysis. European Journal of Sport Science. 2021. PMID 32077380. DOI: 10.1080/17461391.2020.1733672. [PubMed](https://pubmed.ncbi.nlm.nih.gov/32077380/) · [DOI](https://doi.org/10.1080/17461391.2020.1733672)

65. Grgic J, et al. Test-retest Reliability of the One-repetition Maximum Test: A Systematic Review. Sports Medicine - Open. 2020. PMID 32681399. DOI: 10.1186/s40798-020-00260-z. [PubMed](https://pubmed.ncbi.nlm.nih.gov/32681399/) · [DOI](https://doi.org/10.1186/s40798-020-00260-z)

### Broad synthesis

66. Currier BS, et al. Resistance Training Prescription for Muscle Function, Hypertrophy, and Physical Performance in Healthy Adults: An Overview of Reviews. Medicine & Science in Sports & Exercise. 2026. Large overview of reviews; use as a synthesis rather than a universal prescription. PMID 41843416. DOI: 10.1249/MSS.0000000000003897. [PubMed](https://pubmed.ncbi.nlm.nih.gov/41843416/) · [DOI](https://doi.org/10.1249/MSS.0000000000003897)

## Final product position

The coaching product should be opinionated about safety, provenance, and clarity, but flexible about progression methods. It should know the difference between an evidence-supported principle and a locally chosen rule. It should be willing to hold when evidence is weak, to ask when data are incomplete, and to escalate when symptoms or repeated failure make automation inappropriate.

The strongest product promise is therefore:

“A calm coaching surface that turns real training data into bounded, explainable next actions — without pretending that the literature has solved individual programming.”

