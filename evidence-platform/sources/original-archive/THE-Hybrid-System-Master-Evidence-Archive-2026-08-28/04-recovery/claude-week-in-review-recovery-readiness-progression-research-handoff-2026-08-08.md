# Claude handoff: the coach’s week-in-review

## Research-only scope

This document is the integrated follow-up research brief for the retrospective week-in-review surface.

It is not an app prototype, UI implementation, database schema, or code task. It is a build-quality product and evidence handoff for Claude. The intended next step is to turn the recommendations into a product surface while preserving the constraints below.

The question is narrow:

> Once a week has happened and the system has planned, completed, missed, rescheduled, partially completed, manually annotated, or automatically adjusted work, what should a coach and athlete see so they can understand what happened and decide what happens next?

The earlier authoring research already covered plan construction, proposal review, and the `Proposal → Resolution Preview → Coach Decision → Version` pattern. This document does not redo that work. It concentrates on the retrospective loop:

`week closes → evidence is assembled → planned and actual work are reconciled → interventions are explained → safety and patterns are reviewed → the next decision is recorded`

## Executive decision

Build the first page around a **week ledger plus decision queue**, not a single adherence score and not a motivational report.

The first page should answer, in order:

1. Is anything unsafe, unresolved, stale, or missing?
2. What was intended, what actually happened, and what changed in between?
3. Which differences matter to the training intent rather than merely to volume?
4. Did Auto-Coach intervene, under which bounded rule, and can the user inspect or undo it?
5. What decision is now needed: one-day adjustment, hold, repeated-pattern review, program-level proposal, safety follow-up, or data request?

The core product principle is:

> A week review is an evidence reconciliation and decision record. It is not a compliance verdict.

The strongest cross-product pattern is not a particular chart. It is a sequence:

`triage → inspect → reconcile → explain → decide → version → observe`

TrainingPeaks contributes explicit planned/completed pairing and overlays; Everfit contributes weekly coach triage, historical weeks, filters, and a follow-up loop; TrainHeroic contributes broad-to-narrow review across compliance, readiness, session detail, and lift history; TrainerRoad contributes adaptation previews and post-session reasons. Their common weakness is incomplete, hard-to-recover decision history. The opportunity is to combine the useful review flows with a durable, human-readable intervention receipt.

### Non-negotiable product constraints

- The deterministic Coordinator remains the final authority over the resolved weekly plan.
- A coach changes inputs, constraints, goals, or decisions; the coach does not hand-place a resolved session directly.
- Auto-Coach may make only the narrowly permitted single-session adjustment within its policy envelope.
- Every Auto-Coach adjustment is recorded, inspectable, versioned, and reversible by the athlete where the policy permits.
- Pain and illness safety outrank readiness, performance, adherence, and progression signals.
- A missing, stale, or ambiguous data point is not silently treated as non-adherence.
- The system distinguishes an observed outcome from an inferred pattern and from a causal claim.
- A weekly review may produce a recommendation or a decision record, but it must not silently rewrite future sessions.
- Nutrition is context for training and safety, not a moral score or an automatic proxy for effort.

## Evidence notation

The brief uses the following labels:

- **[OBSERVED]** — directly stated in an official product document, help article, or documented workflow.
- **[USER REPORT]** — a complaint, feature request, or discussion in an official product forum. It demonstrates a failure mode, not prevalence.
- **[VENDOR CLAIM]** — a product or marketing claim from the vendor; useful for intended behavior, not independent validation.
- **[RESEARCH]** — peer-reviewed, consensus, systematic-review, or professional guidance evidence.
- **[INFERRED]** — a product implication derived from the observed evidence.
- **[RECOMMENDATION]** — the proposed behavior for this product.
- **[GAP]** — a question that the public evidence does not answer and that should be tested or instrumented.

The public product documentation often specifies click paths and business rules but does not expose current screenshots or exact responsive layout. When the visual order or density is reconstructed from the documented flow, it is labeled as an inference rather than presented as an observed pixel-level fact.

## High-Level Overview

### The central problem

Most training products make one of three errors when a week is over:

1. They collapse a multi-dimensional week into one percentage.
2. They show actual and planned numbers together without making the relationship explicit.
3. They show that an adaptive system changed something without preserving the exact before-state, trigger, rule, actor, and outcome.

All three errors create the same operational failure: the user cannot tell whether the week requires a decision, a conversation, patience, or better data.

### What the week review is and is not

| It is | It is not |
|---|---|
| A reconciliation of intent, execution, context, and system action | A pass/fail report |
| A coach’s decision queue | A replacement for clinical judgment |
| A versioned record of what the system changed | A hidden automation log |
| A way to detect repeated patterns without shaming a single miss | A leaderboard |
| A bounded bridge to the next plan decision | A direct-manipulation plan editor |
| A place to expose uncertainty and missing data | A reason to manufacture certainty |

### The first-page recommendation in one sentence

> Put a compact safety/data triage header above a seven-day planned-versus-actual ledger; attach intervention receipts to the affected day; keep nutrition and recovery as contextual lanes; end with an explicit resolution choice that creates a new version.

### Why one adherence number should not be the hero

An adherence percentage can answer only a narrow question, and even that question depends on the denominator. TrueCoach defines compliance as exercises completed divided by exercises assigned over a selected time window. Everfit exposes workout adherence, weekly completion, and a four-week trend. TrainingPeaks uses duration, distance, or TSS-based color thresholds. These are useful operational indicators, but they are not interchangeable and they do not measure intent, safety, data quality, or whether an athlete completed an unplanned but useful substitute.

The exercise-adherence literature also warns that the field lacks a single gold-standard measure for unsupervised exercise and relies heavily on self-report. A connected-health review identifies time, routine, pain, psychological symptoms, social support, perceived barriers, and measurement limitations as important factors. It also cautions that excessive information and threat-based framing can harm adherence. [RESEARCH: Argent, Daly, and Caulfield, JMIR 2018](https://mhealth.jmir.org/2018/3/e47/)

The product should therefore show several small, named facts rather than one judgment:

- **Intent coverage:** how much of the planned week has a resolved execution state.
- **Execution delta:** how actual dose, duration, intensity, or sets differ from the planned dose.
- **Training-intent status:** whether the relevant purpose appears completed, partial, substituted, or unresolved.
- **Context:** readiness, pain, illness, time, sleep, fueling, and athlete explanation.
- **Data confidence:** measured, self-reported, inferred, stale, missing, or ambiguous.
- **Intervention state:** unchanged, Auto-Coach adjusted, coach input changed, athlete changed, or unresolved.

### What the research says nobody does completely well

No reviewed platform publicly demonstrates all of the following in one coherent retrospective surface:

- a week-level planned/actual ledger;
- explicit handling of unplanned work and substituted intent;
- a durable event-level record of automatic intervention;
- exact before/after versions;
- a visible policy and trigger explanation;
- independent undo of one intervention;
- a separate, honest outcome panel that avoids causal overclaiming;
- safety-first handling of pain or illness;
- a coach/athlete view that shares the same facts without turning the athlete into a score.

That is the differentiator to pursue. “AI adapts your training” is not distinctive enough. “Every bounded automatic change is explainable, reversible, and honestly evaluated afterward” is.

## Deep Dive Analysis

## 1. The user jobs-to-be-done

### Coach job

The coach needs to move from a seven-day event stream to one of a small number of defensible decisions:

- no change; continue;
- resolve one exceptional day;
- hold the current load while more data arrives;
- investigate a repeated pattern;
- create a program-level proposal;
- follow up on pain, illness, or another safety concern;
- request or repair missing data.

The coach does not need another dashboard full of independent charts. The coach needs a reliable path from evidence to decision.

### Athlete job

The athlete needs to answer:

- What did I intend to do?
- What did I actually do?
- Did the system change anything, and why?
- Is a difference being treated as information or as a failure?
- What does the coach need from me?
- Can I correct a mistaken pairing, missing note, or automatic change?

### Product job

The product must preserve identity and causality boundaries:

`planned object ≠ completed object ≠ context object ≠ intervention object ≠ decision object`

A good week review joins these objects for reading but does not collapse them into one mutable row.

## 2. Platform screen teardowns

The following teardowns are deliberately click-level. “Observed” refers to the documented navigation and rule. Screen density and visual hierarchy are labeled as inference when the public page does not guarantee a current screenshot.

### 2.1 TrainingPeaks: explicit pairing, compliance color, interval overlay

**Primary review surface:** calendar and completed-workout detail.

**Documented click path:**

1. Open the athlete calendar.
2. Locate the uploaded or synced completed workout and the planned workout for the day.
3. Drag the completed workout onto the planned workout.
4. Review the single paired-workout preview.
5. Confirm the pairing.
6. To correct it, open the workout-card menu and choose unpair.
7. Open a completed structured workout to view the planned structure overlay over the completed intensity data.
8. Use the overlay controls to hide, show all channels, shift alignment, or create laps from the current overlay position.

TrainingPeaks documents that a pairing preview is shown before confirmation, that an unplanned workout is represented differently, and that the structured overlay is available on the web for Premium coach and athlete accounts. [OBSERVED: TrainingPeaks pairing](https://help.trainingpeaks.com/hc/en-us/articles/115002250311-How-can-I-pair-and-unpair-my-planned-and-completed-workouts) [OBSERVED: TrainingPeaks structured overlay](https://help.trainingpeaks.com/hc/en-us/articles/115006049708-How-can-I-compare-my-completed-workout-to-my-planned-structured-workout)

**Documented card anatomy:** title, sport, duration, distance, TSS, comments, peak performances, and a compliance indicator. The indicator is based on a selected priority among duration, distance, and TSS. Green represents within ±20%; yellow represents 50–79% or 121–150%; orange represents more than 50% away; red means not completed; grey means unplanned. [OBSERVED: TrainingPeaks workout card](https://help.trainingpeaks.com/hc/en-us/articles/204861204-Workout-Card-Overview)

**Likely screen order [INFERRED]:**

1. Calendar context and week totals.
2. Dense row/card for planned and completed state.
3. Color-coded compliance cue.
4. Detail panel with paired metrics.
5. Graph or structured overlay.
6. Comments and drill-down tools.

**What it does well:**

- Makes the identity operation—pairing a completed item to a planned item—explicit.
- Gives the user a confirmation point before the relationship changes.
- Separates unplanned work visually rather than forcing it into a planned denominator.
- Offers an interval-level overlay rather than only a single aggregate percentage.
- Allows correction through unpairing.

**What it leaves underspecified or weak:**

- The dominant compliance color can imply a single verdict even when duration, distance, and TSS disagree.
- The pairing action is a data-maintenance operation, not a training-intent interpretation. A ride may be paired correctly as a file while still failing the intended workout purpose.
- A late or mistaken pairing can change the apparent historical state without a visible decision ledger.
- The screen does not publicly show a durable record of who paired or unpaired, which prior pairing was replaced, or how the change affected later summaries.

**Borrow [RECOMMENDATION]:** explicit pair preview, visible unplanned state, dual planned/actual metrics, and interval-level overlay.

**Reject [RECOMMENDATION]:** one dominant color as the week’s primary judgment; a pairing action that silently changes analytics; treating an aggregate compliance metric as intent completion.

### 2.2 Intervals.icu: calendar totals, compliance field, and the “mixed total” trap

**Primary review surface:** calendar, week information, totals, and activity detail.

**Documented/community-documented click path:**

1. Open the athlete calendar and select the relevant week.
2. Inspect weekly totals and the planned/actual inclusion controls.
3. Pair a completed activity to a planned activity by dragging when the match is absent or wrong.
4. Open an activity to inspect the compliance field.
5. Use the calendar option to show compliance or adjust whether planned work is included in the current-week total.
6. Open Totals or a custom chart when the calendar summary does not answer the duration/load question.

The official Intervals.icu forum describes weekly totals as combining activity load/time with future planned workouts, with special behavior for unmatched activities and current-day pairing. It also documents a control for including planned work in the current week. [OBSERVED: Intervals.icu activities guide](https://forum.intervals.icu/t/activities-page-a-guide-to-getting-started/17698?page=5) [OBSERVED: Intervals.icu calendar/week update](https://forum.intervals.icu/t/calendar-and-week-info-update/109142?page=5)

The compliance field is documented as a ratio based on load or duration, with weekly compliance derived from total load divided by total planned load. The forum announcement also documents color bands and the option to ignore compliance for selected warmups. [OBSERVED: Intervals.icu compliance field](https://forum.intervals.icu/t/compliance-activity-field/47805)

**Likely screen order [INFERRED]:**

1. Calendar week and totals bar.
2. Planned and actual activity rows.
3. Compliance field or color.
4. Activity detail and pairing controls.
5. Secondary totals/custom charts.

**What it does well:**

- Makes the inclusion rule for planned work a user-visible setting rather than an invisible assumption.
- Supports a compact compliance field for scanning.
- Provides a route from calendar to detailed activity and custom charting.
- Exposes the operational reality that an unpaired activity can be both a useful real event and a reconciliation problem.

**Complaint evidence [USER REPORT]:** users report confusion when planned load disappears after pairing, when actual and planned values are mixed, when projected weekly time is no longer visible, and when the current week is compared with a complete prior week. Users have also reported misleading positive language after a workout was cut short and cases where an entirely different workout created two separate items with no useful compliance relationship. [USER REPORT: activities/weekly totals discussion](https://forum.intervals.icu/t/activities-page-a-guide-to-getting-started/17698?page=5) [USER REPORT: AI coach false “Outstanding” result and apples-to-oranges week comparison](https://forum.intervals.icu/t/intervalcoach-ai-workouts-that-adapt-daily-to-your-recovery-and-goals/120045?page=25)

**Borrow [RECOMMENDATION]:** explicit actual-only versus actual-plus-planned semantics, planned/current-week labeling, and a visible reconciliation state.

**Reject [RECOMMENDATION]:** totals that mix future planned work with completed work without a split; positive feedback that ignores cut-short execution; any comparison of partial current week to complete prior week without matching the date window.

### 2.3 TrainerRoad: adaptation preview, post-workout reasons, and weak audit history

**Primary review surface:** post-workout analysis and Plan Adaptation Overview.

**Documented click path:**

1. Complete or skip a workout.
2. Submit the post-workout survey, including effort and contextual reasons when applicable.
3. When adaptations are pending, open the notification.
4. Open Plan Adaptation Overview.
5. Review proposed future changes.
6. Accept, skip, or enable automatic acceptance depending on the account setting.
7. For illness, injury, travel, or time off, add a Training Adjustment; use Notes for context that should not adapt the plan.
8. Open future workouts or simulation views to inspect the forward effect.

TrainerRoad documents that a completed workout can update progression levels, prompt a post-workout survey, and generate pending adaptations. It distinguishes a Training Adjustment, which can change the plan, from a Note, which records context without adaptation. [OBSERVED: TrainerRoad adaptive training](https://www.trainerroad.com/blog/how-to-use-adaptive-training/) [OBSERVED: TrainerRoad training adjustments and notes](https://support.trainerroad.com/hc/en-us/articles/4404676155035-Training-Adjustments-and-Notes)

The post-workout survey can be edited for a limited period and captures more nuance than “done/not done.” [OBSERVED: TrainerRoad post-workout survey](https://support.trainerroad.com/hc/en-us/articles/4404884465563-What-are-Post-Workout-Surveys)

**What it does well:**

- Makes an adaptation pending state visible before the future calendar changes.
- Gives the athlete a preview and an acceptance boundary.
- Captures subjective difficulty and contextual reasons.
- Separates a schedule-changing adjustment from a non-adaptive note.
- Uses future simulation and predicted difficulty as a forward-looking aid.

**What it does not publicly establish:**

- A durable, user-readable event ledger for every adaptation.
- Exact input-to-rule-to-action receipts.
- A general event-level undo that works after subsequent changes.
- Selective acceptance of unrelated adaptations in one batch.
- A causal outcome record showing whether one particular adaptation helped.

The product’s own public materials and forum discussions show a gap between an adaptation preview and a complete history. User reports ask for a visible “why” behind each adaptation, reliable restoration, and protection from adaptation churn. [USER REPORT: why behind adaptations](https://www.trainerroad.com/forum/t/please-add-the-why-behind-proposed-adaptations/103597) [USER REPORT: undo/history](https://www.trainerroad.com/forum/t/ai-undo-button-feature-request-or-existing-feature/110298)

TrainerRoad also reports improved outcomes for adapted workouts, but its own Q&A qualifies the data as beta/vendor analysis rather than peer-reviewed causal evidence. [VENDOR CLAIM and qualification](https://www.trainerroad.com/blog/adaptive-training-live-qa-ask-a-cycling-coach-338/)

**Borrow [RECOMMENDATION]:** pending intervention preview, reason capture, forward simulation, and a clear distinction between a note and a plan-changing adjustment.

**Reject [RECOMMENDATION]:** accept-all bundles, hidden or fragile undo, generic “based on your performance” explanations, and claims that later improvement was caused by the adaptation.

### 2.4 Everfit: the clearest coach triage ritual

**Primary review surface:** Check-in Dashboard.

**Documented click path:**

1. Log in to the web app.
2. Open the left navigation.
3. Click Check-in Dashboard.
4. Configure which signals contribute to status; the system requires Training or Nutrition.
5. Review summary cards and the client list.
6. Select a pre-made or custom view such as At Risk, Needs Attention, No Activity, Forms to Review, or On Track.
7. Choose the week. Everfit documents current-week and historical-week semantics, with a Monday–Sunday week and up to four weeks available.
8. Filter by coach, group, status, or client.
9. Open a client to inspect the insight panel.
10. Drill into training, nutrition, tasks/habits, forms, program ending, private notes, and follow-up alerts.
11. Mark forms reviewed or follow up in the inbox.

Everfit explicitly documents the signal setup and breakdown behind a status, attention-first client ordering, custom views, historical weeks, and client insight panels. [OBSERVED: dashboard overview](https://help.everfit.io/en/articles/14495409-check-in-dashboard-overview-beta) [OBSERVED: client list and historical weeks](https://help.everfit.io/en/articles/16000579-check-in-dashboard-manage-your-client-list) [OBSERVED: client insights](https://help.everfit.io/en/articles/16000596-check-in-dashboard-review-client-insights)

**What it does well:**

- Gives the coach a weekly ritual rather than a bag of analytics.
- Orders attention before already-reviewed clients.
- Preserves historical-week semantics and warns when the user is looking at past data.
- Makes status configuration inspectable instead of pretending the label is objective.
- Connects review to forms, notes, and follow-up action.
- Supports saved views, which lets a coach build a repeatable review practice.

**Risks [INFERRED]:**

- A status that combines training, nutrition, tasks, and forms can compress different kinds of evidence into one risk label.
- Nutrition status based on logging frequency and macro closeness can make recording behavior look like physiological success.
- “At Risk” may be a useful internal triage label but is not necessarily suitable for the athlete-facing surface.
- A configuration that applies across a workspace can be too coarse for a single athlete or a safety-sensitive domain.

**Borrow [RECOMMENDATION]:** attention-first queue, period selector, historical banner, configurable signal breakdown, saved views, and direct follow-up loop.

**Reject [RECOMMENDATION]:** one composite status as the athlete’s primary identity; shared coach/athlete “risk” language; nutrition adherence as a dominant training judgment.

### 2.5 TrueCoach: simple coach-only compliance triage

**Primary review surface:** client list and compliance rates.

**Documented click path:**

1. Open the client list/dashboard.
2. Sort or filter by compliance, due date, groups, or client type.
3. Open a client.
4. Review 7-, 30-, and 90-day Compliance Rates.
5. Investigate a low short-term rate against the longer-term baseline.
6. If the rate drops by 20%, use the Needs Attention flag as a reason to schedule a check-in.

TrueCoach defines the rate as exercises completed divided by exercises assigned and says the client does not see the rate; the coach decides how to communicate the information. [OBSERVED: TrueCoach compliance rates](https://help.truecoach.co/en/articles/2403738-compliance-rates)

**What it does well:**

- Uses multiple time windows so one bad week is not the only context.
- Treats a sudden drop as an investigation trigger rather than an automatic diagnosis.
- Keeps the raw coach triage metric away from the athlete, which can prevent blunt shame.

**Risks [INFERRED]:**

- The athlete cannot inspect the denominator or correct the coach’s interpretation.
- Exercises completed is a weak proxy for session intent and may punish safe scaling.
- Hiding the score can protect the athlete, but it can also create an asymmetric reality if the coach uses the number as authority.
- A fixed sudden-drop threshold may be too sensitive or insensitive for different baselines.

**Borrow [RECOMMENDATION]:** short, medium, and long windows; sudden-change trigger as a coach prompt; investigation language.

**Reject [RECOMMENDATION]:** a hidden metric that drives consequential decisions without an inspectable definition; exercise-count compliance as the only adherence truth.

### 2.6 TrainHeroic: broad-to-narrow strength review

**Primary review surface:** Analytics, Coach Home Activity Feed, and individual session detail.

**Documented click path:**

1. Start in Analytics or the Coach Home Activity Feed.
2. Review compliance across athletes or a team.
3. Narrow to readiness survey trends.
4. Open Training Summary Analytics for a 30-day view of lifting amount, duration, and perceived intensity.
5. Open lift analytics for history, progress, best performance, working-max updates, and estimated 1RM.
6. Open an individual athlete calendar or session.
7. Inspect readiness, exercise results, substitutions, scaled/Rx status, RPE, duration, comments, and session scorecard.

TrainHeroic explicitly recommends starting broad and narrowing to compliance, readiness, training summary, lift analytics, activity feed, and individual session detail. It also documents a regular review cadence and a calendar scorecard. [OBSERVED: TrainHeroic review workflow](https://support.trainheroic.com/hc/en-us/articles/18156791749773-How-do-I-review-what-my-athletes-have-logged) [OBSERVED: TrainHeroic compliance analytics](https://support.trainheroic.com/hc/en-us/articles/18156702628621-Viewing-Compliance-Analytics) [OBSERVED: TrainHeroic session logging](https://support.trainheroic.com/hc/en-us/articles/18156631592589-Logging-your-Training-Session)

**What it does well:**

- Separates team triage from athlete-level interpretation.
- Treats readiness, session comments, perceived intensity, and lift history as complementary evidence.
- Preserves exercise-level and set-level detail for strength work.
- Provides an activity feed that can support a daily review cadence.
- Shows scaled and substituted execution rather than pretending every session is binary.

**What it leaves for the product to improve:**

- Compliance analytics still risk becoming a top-level verdict if detached from readiness and session detail.
- The activity feed is chronological but not necessarily a causal or versioned intervention ledger.
- Lift-history detail can be useful for strength but overwhelming as a default weekly surface.
- A coach can see what was logged without necessarily seeing an explicit “why this mattered to the intended session” interpretation.

**Borrow [RECOMMENDATION]:** broad-to-narrow drill path; readiness beside compliance; exercise/set detail on demand; activity feed as a secondary lane.

**Reject [RECOMMENDATION]:** putting team-scale analytics on a single-athlete first page; making the athlete infer session intent from raw lift history.

### 2.7 Oura and WHOOP: trend context without training-intent reconciliation

**Primary review surface:** reports, trends, scores, and contributor charts.

**Documented Oura click path:**

1. Open the Today tab.
2. Open the upper-left menu.
3. Choose Reports or Trends.
4. Choose the report type or metric.
5. Select the time range and daily/weekly/monthly/yearly view.
6. Inspect current value, average, contributor charts, tags, and baseline.
7. On the web, overlay two metrics and inspect the correlation value `r`.

Oura documents weekly reports with average Readiness, Sleep, and Activity scores plus contributor trends, and its Trends view provides time windows, baseline-oriented views, tags, and a two-metric correlation display. It explicitly calls the displayed value a correlation, not a causal conclusion. [OBSERVED: Oura Reports](https://support.ouraring.com/hc/en-us/articles/360046061373-Oura-Reports) [OBSERVED: Oura Trends](https://support.ouraring.com/hc/en-us/articles/360055983614-Using-Trends)

WHOOP documents trend views across Recovery, Sleep, Strain, and Stress, plus weekly plans and recovery insights. [OBSERVED: WHOOP Trends](https://support.whoop.com/s/article/Viewing-Trends) [OBSERVED: WHOOP Recovery Insights](https://support.whoop.com/s/article/Recovery-Insights)

**What it does well:**

- Gives time-series context rather than a single day.
- Uses personal baselines and contributor breakdowns.
- Makes data sufficiency and missing-report requirements explicit.
- Offers a useful visual model for “current value versus period average.”
- Demonstrates honest correlation language.

**What it does not solve:**

- A recovery trend is not a training-intent result.
- A correlation between a tag and a score is not a cause of a performance change.
- Data availability and sensor validity can be mistaken for health state.
- A wellness score cannot safely determine injury, illness, or readiness for every athlete.

**Borrow [RECOMMENDATION]:** baseline-aware trends, contributor drill-down, missing-data states, and explicit “associated with” language.

**Reject [RECOMMENDATION]:** turning wearable scores into hidden automatic diagnoses, or letting a recovery score override reported pain or illness.

## 3. Cross-platform pattern catalogue

The catalogue below is deliberately broader than a list of UI components. It describes the behaviors worth reusing and the reason each behavior matters in a retrospective loop.

### Review and navigation patterns

| ID | Pattern | Evidence | Borrow because |
|---|---|---|---|
| P01 | Start broad, then narrow to the athlete and session | [OBSERVED: TrainHeroic](https://support.trainheroic.com/hc/en-us/articles/18156791749773-How-do-I-review-what-my-athletes-have-logged) | A coach should not begin by opening a random detail page. |
| P02 | Attention-first queue | [OBSERVED: Everfit](https://help.everfit.io/en/articles/16000579-check-in-dashboard-manage-your-client-list) | Reduces scanning cost without claiming every other client is fine. |
| P03 | Saved review views | [OBSERVED: Everfit](https://help.everfit.io/en/articles/16000579-check-in-dashboard-manage-your-client-list) | Makes the weekly ritual repeatable. |
| P04 | Period selector with explicit week boundaries | [OBSERVED: Everfit](https://help.everfit.io/en/articles/16000579-check-in-dashboard-manage-your-client-list) | Prevents partial-week and full-week comparisons. |
| P05 | Historical data banner | [OBSERVED: Everfit](https://help.everfit.io/en/articles/16000579-check-in-dashboard-manage-your-client-list) | Stops an old week from being mistaken for current state. |
| P06 | Current-week live mode | [OBSERVED: Everfit](https://help.everfit.io/en/articles/16000579-check-in-dashboard-manage-your-client-list) | Future days should not lower the current week’s execution. |
| P07 | Direct follow-up action from the review state | [OBSERVED: Everfit](https://help.everfit.io/en/articles/16000596-check-in-dashboard-review-client-insights) | A review that cannot lead to an action becomes a report ritual. |
| P08 | Private coach notes linked to the same review object | [OBSERVED: Everfit](https://help.everfit.io/en/articles/16000596-check-in-dashboard-review-client-insights) | Keeps context near evidence without exposing private notes to the athlete. |
| P09 | Activity feed as a secondary chronological lane | [OBSERVED: TrainHeroic](https://support.trainheroic.com/hc/en-us/articles/18156740868493-Using-the-Coach-Home-Activity-Feed) | Useful for finding new comments and recent sessions. |
| P10 | Review cadence as a product behavior | [OBSERVED: TrainHeroic](https://support.trainheroic.com/hc/en-us/articles/18156791749773-How-do-I-review-what-my-athletes-have-logged) | The system should encourage a close-the-loop habit, not only expose data. |

### Planned-versus-actual patterns

| ID | Pattern | Evidence | Borrow because |
|---|---|---|---|
| P11 | Explicit pair action | [OBSERVED: TrainingPeaks](https://help.trainingpeaks.com/hc/en-us/articles/115002250311-How-can-I-pair-and-unpair-my-planned-and-completed-workouts) | Object identity must be visible and correctable. |
| P12 | Pair preview before confirmation | [OBSERVED: TrainingPeaks](https://help.trainingpeaks.com/hc/en-us/articles/115002250311-How-can-I-pair-and-unpair-my-planned-and-completed-workouts) | Prevents a silent relationship change. |
| P13 | Explicit unplanned state | [OBSERVED: TrainingPeaks](https://help.trainingpeaks.com/hc/en-us/articles/204861204-Workout-Card-Overview) | Unplanned work is not the same as no work. |
| P14 | Planned and actual values side by side | [OBSERVED: TrainingPeaks strength review](https://help.trainingpeaks.com/hc/en-us/articles/27972623640333-Reviewing-Your-Athletes-Logged-Strength-Sessions) | A crossed-out planned value is clearer than a color alone. |
| P15 | Interval or block-level overlay | [OBSERVED: TrainingPeaks](https://help.trainingpeaks.com/hc/en-us/articles/115006049708-How-can-I-compare-my-completed-workout-to-my-planned-structured-workout) | Aggregate duration can hide a materially different stimulus. |
| P16 | Actual-only versus actual-plus-planned toggle | [OBSERVED: Intervals.icu](https://forum.intervals.icu/t/calendar-and-week-info-update/109142?page=5) | Totals need a declared semantic mode. |
| P17 | Compliance field as a cue, not a verdict | [OBSERVED: Intervals.icu](https://forum.intervals.icu/t/compliance-activity-field/47805) | A compact cue is useful when the denominator and basis are visible. |
| P18 | Multiple time windows | [OBSERVED: TrueCoach](https://help.truecoach.co/en/articles/2403738-compliance-rates) | One bad week needs a baseline. |
| P19 | Scaled, substituted, and changed exercise states | [OBSERVED: TrainHeroic](https://support.trainheroic.com/hc/en-us/articles/18156631592589-Logging-your-Training-Session) | The product must represent useful adaptation, not only Rx completion. |
| P20 | Late or missing data as an explicit state | [OBSERVED: Oura](https://support.ouraring.com/hc/en-us/articles/360046061373-Oura-Reports) | Absence of data should not be mistaken for poor execution. |

### Intervention and explanation patterns

| ID | Pattern | Evidence | Borrow because |
|---|---|---|---|
| P21 | Pending adaptation preview | [OBSERVED: TrainerRoad](https://www.trainerroad.com/blog/how-to-use-adaptive-training/) | A future change deserves a review boundary. |
| P22 | Separate plan-changing adjustment from a note | [OBSERVED: TrainerRoad](https://support.trainerroad.com/hc/en-us/articles/4404676155035-Training-Adjustments-and-Notes) | Context should not accidentally mutate the plan. |
| P23 | Post-session reason capture | [OBSERVED: TrainerRoad](https://support.trainerroad.com/hc/en-us/articles/4404884465563-What-are-Post-Workout-Surveys) | “Not done” is not an explanation. |
| P24 | Configurable rule/status breakdown | [OBSERVED: Everfit](https://help.everfit.io/en/articles/14495409-check-in-dashboard-overview-beta) | A label must disclose what drives it. |
| P25 | Specific trigger language | [USER REPORT: TrainerRoad explanation request](https://www.trainerroad.com/forum/t/please-add-the-why-behind-proposed-adaptations/103597) | Generic “based on performance” does not build trust. |
| P26 | Separate decision rationale and observed outcome | [INFERRED from adaptation and audit evidence] | The reason for a change is not the same as what happened afterward. |
| P27 | Versioned before/after states | [INFERRED from undo/history failures and audit-log practice] | Reversal needs an exact previous state. |
| P28 | Compensating undo event | [INFERRED] | Undo should preserve history rather than erase it. |
| P29 | Single-session scope displayed prominently | [INFERRED from TrainerRoad accept-all complaints] | Users should understand the blast radius before accepting change. |
| P30 | Forecast language rather than guarantee language | [OBSERVED: Oura correlation model; [INFERRED] for training] | Predictions should be distinguishable from outcomes. |

### Safety, context, and agency patterns

| ID | Pattern | Evidence | Borrow because |
|---|---|---|---|
| P31 | Readiness alongside session execution | [OBSERVED: TrainHeroic](https://support.trainheroic.com/hc/en-us/articles/18156791749773-How-do-I-review-what-my-athletes-have-logged) | A low score needs context before intervention. |
| P32 | Pain as a separate high-priority signal | [RESEARCH: Argent et al.](https://mhealth.jmir.org/2018/3/e47/) | Pain can be a barrier and safety signal, not an adherence failure. |
| P33 | Athlete explanation beside machine measurement | [OBSERVED: TrainerRoad survey] | Sensor and plan data cannot explain every deviation. |
| P34 | Coach-only triage versus athlete-facing explanation | [OBSERVED: TrueCoach] | Internal triage language and athlete language need not be identical. |
| P35 | Non-judgmental positive feedback for useful unplanned work | [OBSERVED: Everfit activity logging documentation](https://help.everfit.io/en/articles/6323554-view-your-client-s-logged-activities) | Rewarding what happened is more useful than punishing the original plan. |
| P36 | Baseline and contributor trends | [OBSERVED: Oura](https://support.ouraring.com/hc/en-us/articles/360055983614-Using-Trends) | A single day is weak evidence. |
| P37 | Missing-data requirements shown explicitly | [OBSERVED: Oura](https://support.ouraring.com/hc/en-us/articles/360046061373-Oura-Reports) | Data sufficiency is itself part of interpretation. |
| P38 | User-configurable signal selection | [OBSERVED: Everfit](https://help.everfit.io/en/articles/14495409-check-in-dashboard-overview-beta) | The coach should know what the status includes. |
| P39 | Clear owner for follow-up | [OBSERVED: Everfit follow-up alerts] | A status without an owner becomes notification debt. |
| P40 | Honest correlation wording | [OBSERVED: Oura](https://support.ouraring.com/hc/en-us/articles/360055983614-Using-Trends) | Protects against causal overclaiming. |

## 4. Anti-pattern catalogue

| ID | Anti-pattern | Failure mechanism | Corrective design |
|---|---|---|---|
| A01 | One “weekly adherence” percentage as the hero | Collapses intent, dose, context, safety, and data quality | Show named components and a narrative resolution state |
| A02 | Hidden denominator | User cannot tell whether score means exercises, sessions, duration, TSS, or load | Display `completed / assigned`, basis, time window, and exclusions |
| A03 | One compliance color overrides conflicting dimensions | A session can be within duration but miss intensity or purpose | Show dimension-level deltas and intent status |
| A04 | Red for every deviation | Trains the user to avoid the product or hide context | Use neutral states: partial, substituted, awaiting context, safety hold |
| A05 | Planned and actual totals mixed by default | Future work looks completed or completed work looks missing | Default to actual-only for retrospective; label planned projection separately |
| A06 | Current partial week compared with a full prior week | Produces false deload or decline narratives | Match the date window or compare completed days only |
| A07 | Unplanned work counted as non-adherence | Penalizes useful substitution and creates perverse logging incentives | Show unplanned as a first-class event and assess intent separately |
| A08 | Planned item disappears after a pairing | User cannot reconstruct original intent | Preserve original plan version and pair history |
| A09 | Multiple activities silently double-count one planned item | Totals and adherence become mathematically wrong | Support explicit many-to-one reconciliation or leave unresolved |
| A10 | One activity silently satisfies multiple planned items | Creates false completion | Require explicit mapping and disclose coverage |
| A11 | Partial session classified as completed | Hides which block or intent was not delivered | Use block-level status and partial dose delta |
| A12 | A different sport treated as equivalent by duration | Duration similarity is not stimulus equivalence | Mark substitution and ask whether intended purpose was met |
| A13 | Auto-adjusted work judged against the original plan only | Makes successful safe adjustment look like failure | Compare against the resolved version and preserve original for context |
| A14 | Silent automatic rewrite | User loses agency and cannot explain the week | Create an intervention receipt before/at mutation |
| A15 | Accept-all adaptation bundle | One objection forces rejection of unrelated good changes | Keep intervention scope atomic; allow one decision per event |
| A16 | No previous-state snapshot | Undo cannot restore the exact plan | Store immutable before/after version references |
| A17 | Undo that erases the event | Audit and learning are destroyed | Create a compensating version with actor and timestamp |
| A18 | Generic “based on your performance” rationale | User cannot evaluate the machine’s reasoning | Name the decisive inputs and policy category |
| A19 | Reason panel blended with outcome panel | Later success is misread as proof of decision quality | Separate trigger/rationale from observed outcome |
| A20 | “Helped” presented as causal | One athlete/week cannot isolate causality | Use “followed by,” “consistent with,” or “not enough evidence” |
| A21 | Recovery wearable score treated as a diagnosis | Correlation and measurement become medical certainty | Show baseline, data confidence, and safety override |
| A22 | Nutrition logging treated as nutrition success | Logging behavior is mistaken for adequate intake | Show logs as context and avoid moral labels |
| A23 | Calories/weight as default adherence score | Can amplify disordered eating or compulsive exercise risk | Keep body metrics permissioned, optional, and clinically cautious |
| A24 | Pain grouped into readiness | Pain is safety-sensitive and not a performance preference | Separate pain/illness gate above readiness |
| A25 | Missing data treated as a miss | No upload looks like no effort | Distinguish not recorded, not completed, and not applicable |
| A26 | Coach-only metric used as athlete authority | Asymmetry becomes opaque power | Share definition and evidence even if the internal score stays coach-only |
| A27 | Athlete and coach see conflicting resolved plans | Conversation begins from incompatible facts | Use one versioned source of truth with role-specific detail |
| A28 | Dashboard opens with charts before exceptions | Coach spends time on low-value detail | Put safety/data exceptions and decisions first |
| A29 | Every status creates a notification | Alert fatigue makes true risk invisible | Route only actionable changes to a queue with owner and due date |
| A30 | Follow-up has no completion state | Review loop never closes | Mark reviewed, contacted, decision recorded, or deferred with reason |
| A31 | Trend window not visible | User cannot know whether apparent change is real | Display dates, number of observations, and baseline rule |
| A32 | Stale device data displayed as current | The machine reasons from the wrong state | Timestamp every signal and label freshness |
| A33 | Manual correction overwritten by later sync | User loses trust in editing | Preserve source, correction actor, and conflict state |
| A34 | Program-level change triggered by one odd day | Overreacts to noise | Require repeated pattern or explicit safety reason |
| A35 | More data presented as more insight | Cognitive load becomes a barrier | Layer detail: 30-second summary, 2-minute reconciliation, 10-minute audit |

## 5. Planned-versus-actual reconciliation model

### The minimum dimensions

Every planned item should be evaluated on at least five independent dimensions:

1. **Identity:** which planned item, if any, is this actual event associated with?
2. **Execution:** what was actually performed, at what dose and intensity?
3. **Intent:** which training purpose was the planned item supposed to serve?
4. **Context:** what explains the difference—pain, illness, readiness, time, travel, equipment, athlete choice, or missing data?
5. **Decision:** did the Coordinator, Auto-Coach, coach input, or athlete action change the resolved plan?

The display can be concise; the underlying facts cannot be collapsed.

### Recommended status vocabulary

Use a small set of semantically precise states:

- **Completed as resolved** — actual execution is sufficiently aligned with the resolved version for the intended purpose.
- **Completed with dose delta** — the intended item happened, but volume, duration, intensity, or density changed.
- **Partial** — some meaningful blocks happened and others did not.
- **Substituted** — a different event may serve a related purpose, but equivalence is not assumed.
- **Unplanned useful activity** — actual work exists without a planned identity.
- **Missed — context known** — no meaningful execution and a reason is recorded.
- **Missed — context unknown** — no execution and no explanation yet.
- **Rescheduled** — the identity moved to another day; do not count it twice.
- **Adjusted by Auto-Coach** — resolved version differs from original due to a recorded bounded intervention.
- **Awaiting reconciliation** — data is ambiguous, duplicated, stale, or unmatched.
- **Safety hold** — pain or illness requires a safety-first state and no performance interpretation.
- **Not applicable** — the item was canceled by an authorized decision or an availability constraint.

### Edge-case matrix

| Scenario | What the user sees | What the system must preserve | Weekly interpretation |
|---|---|---|---|
| Exact paired completion | Planned and actual side by side; intent marked completed | Original plan, actual event, pair ID, source, timestamp | Positive execution evidence |
| Shortened duration, same intent | Dose delta such as `45 min planned → 30 min actual`; block detail | Actual duration, completed blocks, reason if known | Partial or completed-with-dose-delta, not binary fail |
| Higher volume than planned | Over-target delta, intensity/context | Raw actual, planned dose, athlete note, safety signals | Investigate only if repeated or unsafe |
| Different sport or modality | “Substituted” with no automatic equivalence claim | Actual activity, proposed relation, coach/athlete interpretation | Intent unresolved until assessed |
| Unplanned relevant session | Separate unplanned row; no red penalty | Activity source, time, dose, relation candidate | May count as useful context or replacement candidate |
| Planned not done, note says travel | Missed—context known | Note, availability constraint, plan version | Candidate for one-day resolution, not shame |
| Planned not done, pain reported | Safety hold above adherence | Pain event, severity, location, timestamp, action | Safety follow-up; no automatic progression |
| Planned not done, no context | Missed—context unknown and follow-up prompt | Missing context state | Ask one low-friction question |
| Rescheduled to later day | Original row points to new date; one identity | Move event/version and pair history | Do not double-count or call original a miss |
| Two activities map to one planned session | “Multiple actuals—review pairing” | Many-to-one candidates and totals | Await reconciliation |
| One activity maps to two planned sessions | “Ambiguous coverage” | Candidate coverage split, no silent allocation | Await reconciliation |
| Auto-Coach adjusted before athlete starts | Original and resolved cards; one intervention receipt | Trigger, policy, before/after, actor, undo | Review against resolved plan; retain original context |
| Auto-Coach adjusts within the session | Session event timeline shows point of change | Trigger time, completed work, remaining work, safe boundary | Compare actual to resolved-at-time state |
| Athlete manually scales a set | Scaled execution with athlete reason if available | Original prescription, actual result, actor | Useful adaptation or partial intent |
| Duplicate device upload | Duplicate warning, no automatic total | Source IDs and dedup decision | Data-quality exception |
| Late upload after week close | Backdated event with “arrived later” badge | Ingest time versus activity time | Reopen review only if decision-relevant |
| Missing wearable signal | “No signal” not “low recovery” | Freshness and source status | Lower confidence; no safety inference |
| Nutrition log missing on a hard day | Context unavailable; no nutrition failure label | Missingness reason if known | Ask only when decision-relevant |

### Metrics that can coexist without becoming one score

The first page may show compact values, but each must retain its definition:

| Metric | Definition | Safe use |
|---|---|---|
| Intent coverage | Resolved planned items with a known execution state / resolved planned items | Data completeness, not quality |
| Session execution | Item-level state distribution | Operational summary |
| Dose delta | Actual dose minus resolved planned dose by dimension | Training-stimulus inspection |
| Training-intent status | Coach/Coordinator interpretation of whether purpose was met | Decision support, not automated fact |
| Context coverage | Items with a useful reason or readiness/pain context / deviations | Follow-up prioritization |
| Data confidence | Source and freshness rubric | Prevents false precision |
| Intervention count | Number of atomic Auto-Coach events | Audit and review, not reward |
| Repeated-pattern signal | Similar deviations across a defined window | Program-level proposal candidate only |

Do not sum these into a “week grade.” If a high-level summary is needed, use a sentence and a state, such as:

> “Four of five sessions have known execution states. Tuesday was Auto-Coach adjusted after illness was reported; Thursday was completed with a 20-minute dose reduction. No unresolved pain signal is present. Review the Thursday reduction before deciding whether next week should hold.”

## 6. First-page information architecture

### Recommended page title

`Week review · 5–11 August 2026`

The page should always state whether the selected period is current, complete, or historical.

### Above-the-fold order

#### A. Period and data-state header

Show:

- athlete name and coach context;
- explicit Monday–Sunday or selected date range;
- `Current week · live through Wednesday` or `Historical week · complete`;
- last data-ingest time;
- number of planned items and number with known states;
- one primary action: `Review decisions` or `No decisions pending`.

The header is not a score. It is a data contract.

#### B. Safety and exception strip

Order exceptions by risk and actionability:

1. pain or illness safety hold;
2. unresolved or conflicting actual/planned identity;
3. automatic intervention requiring inspection or athlete undo window;
4. repeated pattern candidate;
5. missing context that blocks interpretation.

Each item needs an owner and a next action. A status without an action is not a queue.

#### C. Week ledger

The ledger is the primary review surface. One row per planned item plus separate rows for unplanned actual activity. On a compact desktop layout, keep the first view to the week’s sessions; on mobile, each row becomes a disclosure card.

Recommended columns:

| Column | Content |
|---|---|
| Date/time | Planned date, actual date if different |
| Intent | Short name and intended training purpose |
| Resolved plan | What the Coordinator actually resolved for that day |
| Actual | What the athlete logged or what the device supplied |
| Delta | Duration, sets, volume, intensity, or key interval delta |
| State | Completed, partial, substituted, safety hold, etc. |
| Context | Pain/illness/readiness/time/fueling note indicators |
| Intervention | None, Auto-Coach, coach input, athlete scaling, unresolved |
| Next action | None, inspect, ask, hold, follow up, propose |

The row must make it visually obvious which plan the comparison uses: original plan or resolved plan. Default to resolved plan for execution judgment, with original plan available as the prior version.

#### D. Intervention receipts

Place receipts inline beneath affected rows and offer a compact “All interventions” drawer. Never hide automatic changes in a generic activity feed.

#### E. Context lanes

Show readiness, sleep/recovery, pain/illness, and nutrition as small context lanes connected to dates. Do not let them dominate the execution ledger. The point is to explain or qualify a deviation, not to create a second set of verdicts.

#### F. Resolution footer

End the review with a bounded choice:

- `Continue as resolved`
- `Hold and collect more data`
- `Resolve one day`
- `Open repeated-pattern review`
- `Create program-level proposal`
- `Safety follow-up`
- `Request missing context`

Every choice should produce a new decision record or a clearly recorded no-op. “Done” should not mean that the user merely scrolled to the bottom.

### Three depths of use

**30-second scan:** header, safety strip, unresolved count, intervention count, decision state.

**2-minute review:** ledger rows, planned/actual deltas, reason chips, context lanes, selected next action.

**10-minute audit:** version history, source freshness, raw inputs, policy explanation, pairing correction, and outcome timeline.

This layering is a direct response to the adherence literature’s warning about information overload and to the coach products that separate broad triage from drill-down.

## 7. Auto-Coach intervention receipt

### The receipt is the product’s trust unit

Every automatic adjustment should be inspectable as a small, immutable event. It should answer:

- What changed?
- Why was the system allowed to change it?
- What evidence triggered it?
- Which policy/version made the decision?
- What was the plan before and after?
- Who or what applied it?
- Can the athlete undo it?
- What happened afterward?

### Required fields

| Field | Example meaning |
|---|---|
| Intervention ID | Stable event identifier |
| Session ID | The one affected session |
| Athlete ID | Subject of the event |
| Created at | When the decision was made |
| Effective at | When the new resolved plan became active |
| Original version | Exact prior plan version |
| Resolved version | Exact resulting plan version |
| Trigger event | Check-in, pain note, readiness, time constraint, completed set, or data update |
| Trigger values | The relevant observed values, with timestamps and source |
| Safety gate | Whether pain/illness was absent, present, or unknown |
| Policy name/version | Human-readable bounded rule and version |
| Eligibility result | Why the event was allowed or rejected |
| Action | Exact change, such as `5 sets → 3 sets` |
| Scope | Explicitly `one session` for v1 |
| Actor | Auto-Coach, Coordinator, coach, athlete, or integration |
| Status | Proposed, applied, accepted, undone, superseded, or blocked |
| Undo window | Whether reversal is available and until when |
| Outcome link | The later session result and context |
| Explanation level | Summary, detail, raw inputs |

### Suggested user-facing receipt

**Auto-Coach adjusted Thursday strength**

`Applied 7 Aug · One session · Undo available`

**What changed**

`Back squat: 5 × 5 at the resolved load → 3 × 5 at the resolved load.`

**Why this was allowed**

`The athlete reported illness and elevated soreness. The safety policy blocked increasing load and selected an approved reduced-volume variant.`

**What it used**

`Athlete check-in at 07:12 · illness = yes · soreness = 6/10 · device recovery = unavailable.`

**What it did not do**

`It did not change the rest of the week.`

**Observed afterward**

`The athlete completed 3 × 5 and reported moderate effort. No causal conclusion is available from this one event.`

Buttons or actions:

- `View original`
- `View resolved`
- `Undo adjustment`
- `Add context`
- `Open decision history`

### State transitions

Do not represent intervention history as one mutable boolean.

`eligible → applied → observed → reviewed`

Possible side states:

- `blocked by safety`
- `rejected by Coordinator`
- `undone by athlete`
- `superseded by later decision`
- `awaiting outcome`
- `outcome unavailable`

Undo should create a new compensating version rather than deleting the applied event.

### Rationale versus outcome

These panels must remain separate.

**Decision rationale:** why the system acted and what rule permitted it.

**Observed outcome:** what happened after the change, including completion, RPE, pain, and later context.

Recommended wording:

- `The adjustment was triggered by…`
- `The Coordinator selected…`
- `The athlete completed…`
- `The adjustment was followed by…`
- `The available data is consistent with…`
- `The system cannot isolate the effect of this adjustment.`

Avoid:

- `The adjustment caused improvement.`
- `The AI knew the athlete was ready.`
- `The adjustment prevented injury.`
- `The athlete failed because…`

TrainerRoad’s public claims about lower failure rates are useful evidence that adaptive systems can be evaluated operationally, but the vendor qualifies the results and they do not establish event-level causality. [VENDOR CLAIM and qualification](https://www.trainerroad.com/blog/adaptive-training-live-qa-ask-a-cycling-coach-338/)

## 8. Nutrition alongside training

### Recommendation

Include nutrition as a **context lane**, not as an equal-weight adherence score.

Nutrition is useful in the weekly review when it explains a training event or creates a safety/follow-up need:

- fueling availability around a long or intense session;
- hydration context;
- repeated low energy or under-fueling concern;
- athlete-reported meal timing;
- weight trend when the athlete explicitly opted into it;
- nutrition plan adherence when the coach has defined a clear, non-moral operational target.

Nutrition is noise when it is presented as a generic “good week/bad week” score or when food logging is treated as proof of physiological adequacy.

The ACSM/Academy of Nutrition and Dietetics/Dietitians of Canada position statement says performance and recovery can be enhanced by appropriate type, amount, and timing of nutrition, and recommends referral to a registered dietitian/nutritionist for personalized plans. [RESEARCH: ACSM joint position statement](https://pubmed.ncbi.nlm.nih.gov/26891166/)

### Minimum useful context fields

- `Fueling context available / unavailable`
- `Pre-session fuel noted / not noted`
- `During-session fuel noted / not noted / not applicable`
- `Hydration concern noted / not noted`
- `Athlete-reported energy availability concern`
- `Coach note or qualified dietitian note`
- `Weight/body-composition trend` only with explicit consent and role restrictions

### Safety rules

- Do not label low logging as poor nutrition.
- Do not use calories, weight, or macro closeness as an automatic effort grade.
- Do not recommend automatic increases or decreases based solely on a nutrition log.
- Treat possible low energy availability, disordered eating, compulsive exercise, or rapid weight change as a qualified human follow-up signal, not a gamified intervention.
- Keep nutrition inputs timestamped and source-labeled.
- If nutrition is not required to make the current decision, collapse it by default.

### Copy examples

Good:

> “Fueling context is incomplete for Saturday’s long session. Ask before interpreting the lower-than-planned output.”

> “The athlete reported low energy and missed the planned session. This is a follow-up context, not a compliance score.”

Bad:

> “Nutrition adherence: 42%.”

> “Poor fueling caused the failed workout.”

## 9. Non-shaming adherence and agency

### Evidence boundary

There is useful evidence that autonomy-supportive, individualized support and social support can relate to exercise adherence, and that connected interventions can improve support and self-monitoring. However, direct causal evidence that a particular color, label, or “compliance score” improves long-term retention is thin. Do not claim the UI wording is scientifically proven to work.

The JMIR review emphasizes that adherence is multi-factorial, that self-report and objective measures have limitations, that threat-based approaches are questionable, and that users value feedback and support. [RESEARCH: Argent et al.](https://mhealth.jmir.org/2018/3/e47/) A systematic review of exercise motivation also links more autonomous forms of motivation with exercise behavior, but the product should not overextend that finding into a guaranteed UI effect. [RESEARCH: Teixeira et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC3441783/)

### Language policy

Use:

- `completed`
- `partial`
- `substituted`
- `not recorded`
- `context known`
- `context needed`
- `safe hold`
- `reviewed`
- `followed by`
- `associated with`

Avoid:

- `failed`
- `bad athlete`
- `lazy`
- `non-compliant` as an athlete-facing identity
- `perfect`
- `discipline score`
- `you caused this`

### Coach and athlete views

The underlying facts should be shared, but the action vocabulary can differ.

| Coach view | Athlete view |
|---|---|
| `Needs context before interpreting Thursday’s dose delta` | `Thursday was shorter than planned. Add a note if you want.` |
| `Potential repeated pattern: two high-intensity sessions shortened` | `Two recent sessions were shortened. Review what made them hard to complete.` |
| `Safety follow-up required` | `Pain was reported. The plan is on hold while this is reviewed.` |
| `Compliance denominator: 4/5 resolved sessions` | `4 of 5 planned sessions have a recorded outcome` |
| `Auto-Coach policy v1.3 applied` | `Auto-Coach reduced this session under the illness-safety rule` |

Do not hide a material plan change from the athlete. Role-specific language should reduce shame and clutter, not create conflicting facts.

## 10. Weekly ritual and close-the-loop behavior

### Recommended cadence

Use a recurring review ritual rather than an arbitrary dashboard visit:

1. **During the week:** capture execution, context, and intervention events.
2. **At week close:** freeze the historical period while allowing late data to reopen it explicitly.
3. **First pass:** review safety and data exceptions.
4. **Second pass:** reconcile planned and actual work.
5. **Third pass:** inspect repeated patterns and intervention outcomes.
6. **Decision:** choose continue, hold, one-day resolution, repeated-pattern review, program proposal, safety follow-up, or missing-data request.
7. **Close:** record the decision and communicate the athlete-relevant next step.

Everfit’s documented Monday/Tuesday default to the last week and Wednesday–Sunday live current-week behavior is a useful precedent for reducing ambiguity. [OBSERVED: Everfit week semantics](https://help.everfit.io/en/articles/16000579-check-in-dashboard-manage-your-client-list)

### Suggested 10-minute coach ritual

**Minute 0–1:** open the week; confirm period and data freshness.

**Minutes 1–3:** resolve safety and missing-data exceptions.

**Minutes 3–6:** inspect the ledger; open only rows with material deltas, substitutions, or interventions.

**Minutes 6–8:** compare with the previous two to four weeks for repeated patterns.

**Minutes 8–10:** record the decision, owner, and athlete-facing summary.

### Close-loop object

Every review should end with a record containing:

- period;
- reviewer;
- reviewed-at timestamp;
- evidence completeness;
- unresolved exceptions;
- chosen resolution;
- decision rationale;
- future plan version or explicit no-change;
- athlete communication state;
- follow-up owner and due date;
- next review trigger.

## 11. Repeated-pattern detection

The system may surface repeated patterns, but it should not call them causes.

### Candidate pattern types

- repeated short-duration completion;
- repeated high-RPE completion;
- repeated pain or illness signal;
- repeated unplanned substitution;
- repeated missed context;
- repeated late uploads or device gaps;
- repeated Auto-Coach intervention on the same session type;
- repeated nutrition/fueling concern near high-load sessions;
- repeated difference between planned and actual modality.

### Minimum threshold guidance [RECOMMENDATION]

Do not trigger a program-level proposal from one ordinary deviation. A first pass may surface a pattern candidate after two similar events in a rolling four-week window, but it should require a human review and show the raw events. A safety concern can bypass the repetition threshold.

### Pattern card copy

> “Two of the last four high-intensity sessions were shortened by more than 20 minutes. Both had low energy reported. This is a pattern candidate, not a diagnosis. Review before changing the program.”

## 12. Evidence and causal language

### Evidence tiers for a weekly review

| Tier | Example | UI treatment |
|---|---|---|
| Direct observation | Logged duration, actual sets, timestamped pain report | State as fact |
| Derived comparison | Actual duration versus resolved duration | Show formula and source |
| Pattern inference | Similar deltas across weeks | Label as pattern candidate |
| Model recommendation | Auto-Coach selected a variant | Show policy and status |
| Outcome association | Completion after an intervention | Use “followed by” |
| Causal claim | Adjustment improved performance | Do not make automatically |

### Outcome evaluation

For each intervention, the product may track:

- whether the adjusted session was started;
- whether it was completed against the resolved version;
- RPE and pain/illness afterward;
- the next one to three sessions’ execution state;
- whether the athlete undid the change;
- whether the coach overrode or superseded it;
- whether repeated interventions occurred.

These are operational outcome signals. They are not enough by themselves to claim that the intervention caused performance improvement.

## 13. Research gaps and live trials

### Gaps found in public evidence

- Public platform documentation rarely exposes the full historical adaptation ledger.
- Public documentation rarely shows policy version, exact trigger inputs, or atomic undo semantics.
- Vendor outcome claims are often not independently validated or designed to isolate event-level causality.
- Direct evidence on shame-free compliance wording and long-term retention is limited.
- There is no universal standard for exercise adherence measurement in unsupervised settings.
- Nutrition logging and macro closeness are not reliable substitutes for nutrition adequacy.
- Wearable recovery trends are useful context but not a safe universal readiness or injury predictor.
- Usage/churn data for a coach’s weekly review ritual is not publicly available in a form suitable for product decisions.

### First live trials

Run these as product discovery/validation trials before adding sophistication:

1. **Ledger comprehension test:** show five edge-case weeks and ask the coach what happened, what remains unresolved, and what decision is needed. Success means the coach can answer without opening raw logs.
2. **One-number versus multi-fact test:** compare a single adherence score with the named-facts summary. Measure interpretation accuracy, not preference only.
3. **Intervention receipt test:** ask the coach and athlete to reconstruct why an Auto-Coach change happened from the receipt alone.
4. **Undo test:** apply one automatic adjustment, make a later unrelated change, and verify that the user can still restore the original event without deleting history.
5. **Non-shaming language test:** compare “missed,” “partial,” “context needed,” and “failed” wording for willingness to add context and seek follow-up.
6. **Nutrition context test:** hide versus show the nutrition lane on sessions where it is decision-relevant; measure whether the coach makes better, faster decisions without over-interpreting logs.
7. **Period semantics test:** give the same coach current partial-week and complete prior-week views; verify that no false trend is inferred.
8. **Late data test:** add a completed activity after review close; verify that the prior decision remains intact and the review reopens explicitly.

### Product instrumentation

Track:

- time from opening review to first decision;
- number of raw detail pages opened before decision;
- proportion of weeks with unresolved identity or missing context;
- intervention receipt open rate;
- undo rate and undo success rate;
- rate of athlete-added context after a “context needed” prompt;
- proportion of program-level proposals triggered by repeated evidence versus one-off deviations;
- safety follow-up completion;
- late-data reopen frequency;
- coach/athlete disagreement rate on whether intent was met;
- false-positive pattern review rate;
- review completion and next-week continuation.

Do not optimize for a higher adherence number. Optimize for accurate interpretation, appropriate safety action, and a closed decision loop.

## Counterpoints/Challenges

### The ledger can become too dense

That risk is real. A literal row for every plan, actual, context, and intervention can become a spreadsheet. The answer is progressive disclosure:

- above the fold: exceptions and decisions;
- ledger: one row per meaningful planned/actual relationship;
- details: blocks, sets, raw inputs, and versions;
- audit drawer: source and event history.

The user should not need to read every data point to know whether action is needed.

### More transparency can increase anxiety

Transparency is not the same as exposing every model input. The first layer should explain the action in plain language; the second should disclose policy and decisive inputs; the third may show raw data for audit. The athlete should be able to inspect and correct without being forced into a forensic interface.

### A coach may prefer a score

Scores are fast. The product should not ban compact cues; it should keep them subordinate to definitions and context. A small `4/5 known outcomes` cue is safe. A headline `80% compliant` that implies the week was good or bad is not.

### “Intent met” is partly judgment

Correct. The system can derive dose deltas and identity states, but equivalence of a substitute or completion of a training purpose may require the coach or Coordinator. The UI should mark that as a human decision or a bounded rule result, not pretend the model knows intent perfectly.

### Automatic adjustment and retrospective review can conflict

If Auto-Coach adjusts a session before execution, the week review should judge execution against the resolved version while preserving the original. If it adjusts during the session, the review must split the event timeline so pre-adjustment work is not evaluated against a future state that did not yet exist.

### Safety can overwhelm the normal training loop

Safety must outrank performance, but not every mild soreness note should freeze the entire program. Use a separate safety state with explicit severity, confidence, and human follow-up. The Coordinator’s safety policy should define when an event blocks automation, when it allows a bounded conservative adjustment, and when it requires escalation.

### “No causal conclusion” can sound unhelpful

It is more helpful than false certainty when paired with the observable outcome. Say:

> “The reduced session was completed and no pain was reported. It is too early to tell whether the adjustment changed next week’s performance.”

That gives the user a useful answer without inventing a scientific conclusion.

## Actionable Next Steps

### Build order for Claude

1. Implement the week-period and data-freshness contract.
2. Define the distinct objects: original plan, resolved plan, actual event, context event, intervention, decision, outcome.
3. Build the ledger and edge-case states before charts.
4. Add explicit pairing/reconciliation and conflict states.
5. Add the atomic Auto-Coach receipt with before/after versions and undo semantics.
6. Add safety and missing-data triage above performance signals.
7. Add nutrition as a collapsible context lane with consent and safety boundaries.
8. Add repeated-pattern review only after the event-level record is trustworthy.
9. Add the resolution footer and versioned close-loop decision.
10. Test with the fixtures below before adding additional automation.

### Acceptance criteria

#### Period and data

- The selected date range is always visible.
- Current partial weeks exclude future planned days from execution totals.
- Historical weeks are labeled as historical and are not silently changed by late data.
- Each source shows event time, ingest time, freshness, and confidence where relevant.

#### Planned versus actual

- A completed event cannot silently become paired to a planned item.
- Pairing, unpairing, rescheduling, and duplicate resolution preserve history.
- Unplanned activity is visible and is not automatically a failure.
- Partial, substituted, safety-hold, unresolved, and not-recorded states are distinct.
- Execution is judged against the resolved version, with the original version accessible.

#### Auto-Coach

- An automatic adjustment affects only the allowed session scope.
- Every adjustment has a stable ID and an immutable before/after reference.
- The UI names the trigger, policy, action, scope, actor, and undo state.
- Undo creates a compensating version rather than erasing the event.
- A later unrelated change cannot destroy the ability to inspect the prior intervention.
- A safety signal blocks or constrains automation according to explicit policy.

#### Language and safety

- Athlete-facing copy does not use compliance as an identity or shame label.
- Missing data is not represented as a missed workout.
- Pain/illness appears above readiness and performance.
- The UI does not claim an intervention caused performance improvement.
- Nutrition is not used as a default moral or effort score.

#### Close loop

- Every completed review has a decision state, including explicit no-change.
- A decision records owner, time, rationale, and next review condition.
- A program-level change cannot be inferred from one ordinary deviation without a human decision or safety rule.

### Test fixtures

Use these as representative data cases:

1. Five exact completed sessions.
2. One shortened session with an athlete note.
3. One unplanned but relevant activity.
4. One different-modality substitution.
5. One planned session missed with travel context.
6. One planned session missed with pain context.
7. One planned session missed with no context.
8. Two actual activities that may map to one planned session.
9. One actual activity that ambiguously covers two planned sessions.
10. A session automatically reduced before start.
11. A session automatically reduced mid-session.
12. An athlete undo followed by a later plan change.
13. A duplicate device upload.
14. A late upload after review close.
15. Missing wearable recovery data.
16. Nutrition log available but incomplete.
17. Repeated shortfalls across four weeks.
18. A high performance week with a pain report, proving that performance must not outrank safety.

### Smallest coherent v1

If scope must be cut, keep:

- one athlete;
- one historical week at a time;
- one seven-day ledger;
- explicit original/resolved/actual relationships;
- six or seven semantic states;
- one bounded Auto-Coach intervention type;
- one receipt with undo;
- one safety lane;
- one nutrition context lane;
- one close-loop decision record.

Cut first:

- complex scorecards;
- social sharing;
- multi-athlete aggregation;
- causal outcome claims;
- automatic program-level changes;
- broad nutrition prescribing;
- extra charts that do not change a decision.

## Supplementary Research Lanes Incorporated

The following findings arrived after the first synthesis and are included here because they sharpen the data model, strengthen the evidence around coach/athlete ritual design, and add consumer recovery benchmarks without changing the core recommendation.

### A. Strength-platform evidence: the missing whole-week layer

#### Everfit: flexible execution, but separated planning and history

Everfit’s public documentation adds several important details to the earlier teardown:

- **[OBSERVED]** The Master Planner exposes week, day, workout, section, exercise, alternate exercise, tempo, rest, and side-specific tracking details. It also records planner changes with timestamps. [Everfit Master Planner](https://help.everfit.io/en/articles/11142555-master-planner-in-client-s-training-calendar)
- **[OBSERVED]** Logged and in-progress workouts do not appear in the Master Planner. Planning and execution are therefore separate surfaces. [Everfit Master Planner](https://help.everfit.io/en/articles/11142555-master-planner-in-client-s-training-calendar)
- **[OBSERVED]** Coaches can edit completed results, and the edit permission depends on who logged the workout and how recently it was completed. [Everfit Edit Completed Workout](https://help.everfit.io/en/articles/5521349-edit-a-completed-workout)
- **[OBSERVED]** Everfit supports structured tracking fields such as RPE, RIR, cadence, heart rate, calories, and custom fields. [Everfit Tracking Fields](https://help.everfit.io/en/articles/3060079-edit-tracking-fields-rpe-rir-hr-cadence-calories-and-more)
- **[OBSERVED]** Comments can attach to an exercise and remain in chronological exercise history, rather than being flattened into one generic session note. [Everfit Exercise Comment History](https://help.everfit.io/en/articles/13010112-view-exercise-comment-history)
- **[OBSERVED]** Athletes may choose alternate exercises and can log extra activities that were not planned. [Everfit Alternate Exercises](https://help.everfit.io/en/articles/3365668-add-an-alternate-exercise) [Everfit Logged Activities](https://help.everfit.io/en/articles/6323554-view-your-client-s-logged-activities)

**Product implication [INFERRED]:** Everfit is a strong precedent for flexible execution and exercise-level coaching context. Its edit-in-place behavior is a warning for the week review: correction is useful, but the original value, correction source, timestamp, and reason must remain recoverable. The product should distinguish:

- original athlete report;
- coach correction;
- integration correction;
- Auto-Coach adjustment;
- later interpretation.

The week-review ledger should unite planning and execution for reading while keeping their histories separate underneath.

#### TeamBuildr: broad reporting and wellness context

TeamBuildr’s public material adds a multi-athlete reporting precedent:

- **[OBSERVED]** Its reporting surfaces include Completion, Questionnaire, and Progress reports. Completion compares completed exercises with assigned exercises; Questionnaire reports support custom thresholds; Progress graphs a selected exercise. [TeamBuildr Reporting](https://www.teambuildr.com/reporting)
- **[OBSERVED]** Reports can be filtered by athlete, team, date range, and lift. [TeamBuildr Strength](https://www.teambuildr.com/platform-strength)
- **[OBSERVED]** The app exposes session tonnage, reps, duration, 1RM progress, times, bodyweight, and related metrics. [TeamBuildr Training App](https://apps.apple.com/us/app/teambuildr-training/id1588729407)
- **[OBSERVED]** TeamBuildr supports custom questionnaires covering pain, soreness, fatigue, sleep, stress, mood, food, nutrition quality, and hydration. [TeamBuildr Ready-to-Work Assessment](https://blog.teambuildr.com/posts/using-teambuildr-create-ready-work-assessment)
- **[OBSERVED]** Its AMS product supports pain location, severity, and injury status through check-ins. [TeamBuildr AMS](https://www.teambuildr.com/platform-ams)
- **[OBSERVED]** Athletes can opt out of an exercise and log extra work. [TeamBuildr Opt-Out](https://support.teambuildr.com/article/k5lAzVHOic-how-to-use-the-opt-out-button) [TeamBuildr Extra Work](https://support.teambuildr.com/article/reit0zv5yp-how-athlete-can-log-extra-work)

**Product implication [INFERRED]:** TeamBuildr is the strongest precedent for a multi-athlete-shaped data model even when the first product view is for one athlete. It shows why the model should support:

- parent program and individual overrides;
- exercise-level history;
- prescribed versus completed volume;
- readiness and pain inputs;
- team/date/lift filters;
- extra work and opt-outs.

It does not publicly demonstrate a single integrated weekly retrospective that joins all of those elements into one decision sequence. That is the gap to fill rather than copying the report sprawl.

#### JuggernautAI: adaptation granularity without retrospective governance

- **[OBSERVED]** JuggernautAI describes adaptation at set, day, week, block, and program levels. [JuggernautAI](https://www.juggernautai.app/)
- **[OBSERVED]** It uses readiness, pre- and post-training mindset check-ins, and end-of-session/week/block feedback. [JuggernautAI feedback guidance](https://www.juggernautai.app/blog/5-tips-to-get-the-most-out-of-the-juggernautai-app)
- **[OBSERVED]** Public material does not document a coach-facing retrospective, a planned-versus-actual ledger, a policy receipt, or an event-level undo history.

**Product implication [INFERRED]:** Granular adaptation is not enough. Every change in this product must be paired with governance: one-session scope, explicit trigger, policy version, safety gate, before/after state, actor, timestamp, and undo status.

### B. Consumer recovery benchmarks: use relationship and uncertainty, not verdicts

#### WHOOP: relationship view, but current surface has changed

- **[OBSERVED]** WHOOP’s historical Weekly Performance Assessment began with Training State, then Sleep Status, then community comparisons. [WHOOP Weekly Performance Assessment](https://medium.com/@whoop/new-feature-the-weekly-performance-assessment-b3f7eb209241)
- **[OBSERVED]** WHOOP’s current Weekly Plan documentation describes “My Week” with sleep, strain/training-load, heart-rate-zone, activity-frequency, and behavior goals, plus goal-by-goal progress and a Monday recap. The overall progress averages goal progress with equal weighting. [WHOOP Weekly Plan](https://support.whoop.com/s/article/Weekly-Plan?language=en_US)
- **[OBSERVED]** WHOOP documents weekly, one-month, and six-month trends for Strain, Recovery, Sleep, and Stress. [WHOOP Viewing Trends](https://support.whoop.com/s/article/Viewing-Trends?language=en_US)
- **[USER REPORT]** Users have described the older weekly assessment disappearing or feeling replaced by a planning tool. That is a self-selected complaint, not prevalence evidence. [WHOOP community discussion](https://www.reddit.com/r/whoop/comments/1kq05wk/did_anyone_else_notice_the_weekly_assessment/)

**Borrow [RECOMMENDATION]:** show the relationship between intended load, actual load, subjective response, and subsequent training—not isolated recovery values.

**Reject [RECOMMENDATION]:** social comparison and labels such as “Overreaching” when the state may be intentional within a training phase. Use neutral, contextual language such as `above intended load`, `planned recovery`, or `safety hold`.

#### Oura: calm trend framing and visible data gates

- **[OBSERVED]** Oura’s weekly reports show average Readiness, Sleep, and Activity scores with contributor trends; reports require a minimum amount of recent data. [Oura Reports](https://support.ouraring.com/hc/en-us/articles/360046061373-Oura-Reports)
- **[OBSERVED]** Oura Trends provides daily, weekly, monthly, and yearly views, current values, long-term averages, tags, and a two-metric correlation value on the web. [Oura Trends](https://support.ouraring.com/hc/en-us/articles/360055983614-Using-Trends)
- **[OBSERVED]** Oura’s documentation uses correlation language for tags and metric overlays rather than claiming that a tag caused a score change.
- **[OBSERVED]** Oura publicly acknowledges that health messages are hypotheses and that its data does not capture all context. [Oura insight-message design](https://ouraring.com/blog/inside-the-ring-the-story-behind-ouras-daily-insight-messages/)

**Borrow [RECOMMENDATION]:** calm tone, personal baseline, contributor drill-down, visible `not enough data`, and explicit association language.

**Reject [RECOMMENDATION]:** using a readiness score as a medical conclusion or allowing it to override pain/illness.

#### Garmin: strong load windows, judgmental status language

- **[OBSERVED]** Garmin Training Status reports current status, exercise load, 7-day total training load, and training-load focus, with longer windows available. [Garmin Training Status](https://support.garmin.com/en-US/?faq=672AQbbnuw2trvuTOOj9X8)
- **[OBSERVED]** Training Load Focus uses minimum-data requirements and categories such as low aerobic, high aerobic, and anaerobic. [Garmin Training Load Focus](https://www8.garmin.com/manuals/webhelp/GUID-AC520B63-3C82-4266-90F6-6E9F22D5F76E/EN-US/GUID-C3205D96-DAB6-4C93-A225-5B8D7B5A5621.html)
- **[OBSERVED]** Garmin uses labels including Productive, Unproductive, Detraining, Recovery, and Overreaching. [Garmin Training Status explanation](https://www.garmin.com/en-US/blog/fitness/garmin-training-status-and-how-to-use-it/)

**Borrow [RECOMMENDATION]:** explicit rolling windows and minimum-data gates.

**Reject [RECOMMENDATION]:** identity-like status labels. A training phase can deliberately be recovery or overreaching; an algorithmic label should not become an athlete judgment.

### C. Adherence, re-entry, and the weekly ritual

#### What the evidence supports

- **[RESEARCH]** A systematic review of 66 exercise studies found autonomous motivation consistently associated with exercise participation and intrinsic motivation more predictive of longer-term adherence. Most evidence was nonexperimental, so this informs direction rather than proving a UI effect. [Teixeira et al.](https://pubmed.ncbi.nlm.nih.gov/22726453/)
- **[RESEARCH]** A longitudinal qualitative study found guilt and obligation may help initiate exercise, while longer-term adherence was more associated with internalization, autonomy, perceived competence, and support. [Kinnafick et al.](https://pubmed.ncbi.nlm.nih.gov/24692183/)
- **[RESEARCH]** A habit-formation study found missing one opportunity did not materially disrupt habit formation, while inconsistent repetition was the more important problem. One missed session should not be framed as identity failure. [Lally et al.](https://onlinelibrary.wiley.com/doi/abs/10.1002/ejsp.674)
- **[RESEARCH]** Self-compassion was positively associated with adherence across several medical samples, partly through lower perceived stress. This is indirect evidence for fitness coaching, not proof of paid-retention lift. [Sirois and Hirsch](https://pubmed.ncbi.nlm.nih.gov/30662571/)
- **[RESEARCH]** A remote walking pilot found participants valued supportive accountability and realistic goals, but retention/acceptability did not prove improved activity outcomes. [Smart et al.](https://formative.jmir.org/2022/1/e31989/)
- **[RESEARCH]** A human-versus-automated coaching study found participants valued empathy but disliked poor timing, repetitive questions, and feeling obligated to respond quickly. [Mitchell et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC9605038/)
- **[RESEARCH]** Personalized prompts produced short-window gains in self-monitoring and self-reported exercise, with weaker effects later, suggesting event-sensitive rather than endlessly repetitive prompts. [MacPherson et al.](https://mhealth.jmir.org/2019/9/e12956/)

**Product implication [INFERRED]:** the weekly ritual should make truthful reporting and re-entry easy. It should not require a confession, a justification for every deviation, or a long conversation to rejoin the plan.

#### Recommended cadence

This is a product default, not a universal scientific rule:

- Athlete check-in: asynchronous, approximately 2–5 minutes.
- Coach review: batched and exception-oriented, with a defined response window.
- Daily prompts: optional and event-triggered, not mandatory repetition.
- Deeper review: weekly or biweekly depending on athlete stability, safety status, and coaching agreement.

There is no strong published benchmark for coach minutes per athlete per week in paid online strength or endurance coaching. Measure it in the product. Track review minutes, number of flagged athletes, proportion requiring follow-up, time to acknowledgment, feedback coverage, false-positive rate, and Auto-Coach accept/undo behavior.

#### Re-entry copy

Good:

> “Two of three planned sessions were completed. One was modified because of shoulder discomfort. What would make the next week more workable?”

> “No session data was recorded for Thursday. Add context if you want; you can also continue without explaining.”

> “Pain or illness changes the plan; it does not count against you.”

Avoid:

> “You failed Thursday.”

> “You owe a make-up workout.”

> “Your discipline score fell.”

### D. Planned-versus-actual research refinement

The strongest formal representation is four layers:

1. **Plan intent** — what was prescribed.
2. **Coordinator resolution** — what was authorized after deterministic policy and bounded Auto-Coach rules.
3. **Execution evidence** — what the athlete did, from device, structured log, coach log, or self-report.
4. **Association/data quality** — how confidently the execution belongs to the plan and how fresh/complete the evidence is.

This is stronger than an `adherence` field because it handles:

- completed late;
- partial blocks;
- replacement versus extra work;
- split sessions;
- duplicate integrations;
- stale or missing data;
- Auto-Coach adjustment;
- athlete undo;
- later corrections.

Independent adherence research separates attendance from compliance and highlights multidimensional measures of length, breadth, depth, and interaction. [RESEARCH: participation/adherence study](https://link.springer.com/article/10.1186/s12966-016-0425-3) [RESEARCH: mHealth adherence review](https://www.jmir.org/2022/6/e30817/)

Wearable and diary evidence also conflict at the participant level: exercise diaries can overestimate completion compared with accelerometers, while devices can miss manual strength work. [RESEARCH: exercise diary validation](https://pubmed.ncbi.nlm.nih.gov/30053792/) The product should therefore use evidence tiers, not assume device truth or self-report truth universally.

#### Required association vocabulary

- `fulfills`
- `partially fulfills`
- `completed late`
- `substitutes for`
- `split part of`
- `duplicate of`
- `unplanned`
- `ignored for compliance`
- `requires review`

Each association should record confidence, actor, timestamp, source records, and reason.

#### Historical plan protection

TrainingPeaks documents a lock feature because editing planned values after completion can make a workout appear more compliant than it was. [OBSERVED: TrainingPeaks lock](https://help.trainingpeaks.com/hc/en-us/articles/204072594-How-to-Hide-and-Lock-Workouts)

**Product rule [RECOMMENDATION]:** never overwrite the historical plan used for the review. If the plan is corrected, create a new version and make the as-of-review version explicit.

### E. Consolidated source-quality warnings

- Product documentation demonstrates intended behavior, not efficacy.
- Vendor marketing demonstrates positioning, not independent validation.
- Official forums demonstrate real failure modes, not prevalence.
- App-store reviews demonstrate friction hypotheses, not representative samples.
- Consumer wearable validation studies may support specific sensor measures without validating composite readiness narratives.
- Research on exercise adherence is useful for direction but does not prove that this exact week-review UI will improve retention.
- Public documentation rarely exposes full adaptation history, policy versioning, or reliable event-level undo; this is an opportunity, not evidence that every competitor is equally weak in all private or newer features.

## Source register

### First-party product evidence

- [TrainingPeaks: Pair and unpair planned and completed workouts](https://help.trainingpeaks.com/hc/en-us/articles/115002250311-How-can-I-pair-and-unpair-my-planned-and-completed-workouts)
- [TrainingPeaks: Structured Workout Overlay](https://help.trainingpeaks.com/hc/en-us/articles/115006049708-How-can-I-compare-my-completed-workout-to-my-planned-structured-workout)
- [TrainingPeaks: Workout Card Overview](https://help.trainingpeaks.com/hc/en-us/articles/204861204-Workout-Card-Overview)
- [TrainingPeaks: Strength session review](https://help.trainingpeaks.com/hc/en-us/articles/27972623640333-Reviewing-Your-Athletes-Logged-Strength-Sessions)
- [Intervals.icu: Activities page guide](https://forum.intervals.icu/t/activities-page-a-guide-to-getting-started/17698?page=5)
- [Intervals.icu: Compliance activity field](https://forum.intervals.icu/t/compliance-activity-field/47805)
- [Intervals.icu: Calendar and week information update](https://forum.intervals.icu/t/calendar-and-week-info-update/109142?page=5)
- [TrainerRoad: Adaptive Training](https://www.trainerroad.com/blog/how-to-use-adaptive-training/)
- [TrainerRoad: Training Adjustments and Notes](https://support.trainerroad.com/hc/en-us/articles/4404676155035-Training-Adjustments-and-Notes)
- [TrainerRoad: Post-Workout Surveys](https://support.trainerroad.com/hc/en-us/articles/4404884465563-What-are-Post-Workout-Surveys)
- [TrueCoach: Compliance Rates](https://help.truecoach.co/en/articles/2403738-compliance-rates)
- [Everfit: Check-in Dashboard overview](https://help.everfit.io/en/articles/14495409-check-in-dashboard-overview-beta)
- [Everfit: Manage client list and weeks](https://help.everfit.io/en/articles/16000579-check-in-dashboard-manage-your-client-list)
- [Everfit: Review client insights](https://help.everfit.io/en/articles/16000596-check-in-dashboard-review-client-insights)
- [Everfit: View logged activities](https://help.everfit.io/en/articles/6323554-view-your-client-s-logged-activities)
- [TrainHeroic: Review athlete logs](https://support.trainheroic.com/hc/en-us/articles/18156791749773-How-do-I-review-what-my-athletes-have-logged)
- [TrainHeroic: Compliance analytics](https://support.trainheroic.com/hc/en-us/articles/18156702628621-Viewing-Compliance-Analytics)
- [TrainHeroic: Logging a training session](https://support.trainheroic.com/hc/en-us/articles/18156631592589-Logging-your-Training-Session)
- [TrainHeroic: Coach Home activity feed](https://support.trainheroic.com/hc/en-us/articles/18156740868493-Using-the-Coach-Home-Activity-Feed)
- [Oura: Reports](https://support.ouraring.com/hc/en-us/articles/360046061373-Oura-Reports)
- [Oura: Trends](https://support.ouraring.com/hc/en-us/articles/360055983614-Using-Trends)
- [WHOOP: Viewing Trends](https://support.whoop.com/s/article/Viewing-Trends)
- [WHOOP: Recovery Insights](https://support.whoop.com/s/article/Recovery-Insights)

### Complaints and failure-mode evidence

- [Intervals.icu: Activity totals and confusion discussion](https://forum.intervals.icu/t/activities-page-a-guide-to-getting-started/17698?page=5)
- [Intervals.icu: IntervalCoach false positive and apples-to-oranges comparison](https://forum.intervals.icu/t/intervalcoach-ai-workouts-that-adapt-daily-to-your-recovery-and-goals/120045?page=25)
- [TrainerRoad: Why behind adaptations request](https://www.trainerroad.com/forum/t/please-add-the-why-behind-proposed-adaptations/103597)
- [TrainerRoad: Undo button/history discussion](https://www.trainerroad.com/forum/t/ai-undo-button-feature-request-or-existing-feature/110298)
- [TrainerRoad: Adaptation churn discussion](https://www.trainerroad.com/forum/t/base-training-adaptation-churn/78242)

### Research and professional guidance

- [Argent, Daly, and Caulfield: Patient involvement and adherence in connected health](https://mhealth.jmir.org/2018/3/e47/)
- [Teixeira et al.: Motivation and exercise behavior systematic review](https://pmc.ncbi.nlm.nih.gov/articles/PMC3441783/)
- [Teixeira et al.: Exercise motivation systematic review record](https://pubmed.ncbi.nlm.nih.gov/22726453/)
- [Kinnafick et al.: Autonomy, competence, and exercise adherence](https://pubmed.ncbi.nlm.nih.gov/24692183/)
- [Lally et al.: Habit formation and missed opportunities](https://onlinelibrary.wiley.com/doi/abs/10.1002/ejsp.674)
- [Sirois and Hirsch: Self-compassion and adherence](https://pubmed.ncbi.nlm.nih.gov/30662571/)
- [Smart et al.: Supportive accountability pilot](https://formative.jmir.org/2022/1/e31989/)
- [Mitchell et al.: Human versus automated coaching conversations](https://pmc.ncbi.nlm.nih.gov/articles/PMC9605038/)
- [MacPherson et al.: Personalized mobile prompts](https://mhealth.jmir.org/2019/9/e12956/)
- [Thomas, Erdman, and Burke: Nutrition and Athletic Performance position statement](https://pubmed.ncbi.nlm.nih.gov/26891166/)
- [Autoregulated resistance training systematic review and network meta-analysis](https://pmc.ncbi.nlm.nih.gov/articles/PMC12336695/)
- [Participation and adherence in physical activity](https://link.springer.com/article/10.1186/s12966-016-0425-3)
- [mHealth adherence methods review](https://www.jmir.org/2022/6/e30817/)
- [Exercise diary versus accelerometer validation](https://pubmed.ncbi.nlm.nih.gov/30053792/)
- [Wearable data-quality review](https://mhealth.jmir.org/2021/3/e20738/)

### Strength and adaptive-platform references

- [Everfit: Master Planner](https://help.everfit.io/en/articles/11142555-master-planner-in-client-s-training-calendar)
- [Everfit: Edit completed workout](https://help.everfit.io/en/articles/5521349-edit-a-completed-workout)
- [Everfit: Tracking fields](https://help.everfit.io/en/articles/3060079-edit-tracking-fields-rpe-rir-hr-cadence-calories-and-more)
- [Everfit: Exercise comment history](https://help.everfit.io/en/articles/13010112-view-exercise-comment-history)
- [Everfit: Alternate exercises](https://help.everfit.io/en/articles/3365668-add-an-alternate-exercise)
- [TeamBuildr: Reporting](https://www.teambuildr.com/reporting)
- [TeamBuildr: Strength platform](https://www.teambuildr.com/platform-strength)
- [TeamBuildr: Ready-to-work assessment](https://blog.teambuildr.com/posts/using-teambuildr-create-ready-work-assessment)
- [TeamBuildr: AMS](https://www.teambuildr.com/platform-ams)
- [TeamBuildr: Exercise opt-out](https://support.teambuildr.com/article/k5lAzVHOic-how-to-use-the-opt-out-button)
- [TeamBuildr: Extra work](https://support.teambuildr.com/article/reit0zv5yp-how-athlete-can-log-extra-work)
- [JuggernautAI](https://www.juggernautai.app/)
- [JuggernautAI: Feedback guidance](https://www.juggernautai.app/blog/5-tips-to-get-the-most-out-of-the-juggernautai-app)

### Consumer recovery references

- [WHOOP: Historical Weekly Performance Assessment](https://medium.com/@whoop/new-feature-the-weekly-performance-assessment-b3f7eb209241)
- [WHOOP: Weekly Plan](https://support.whoop.com/s/article/Weekly-Plan?language=en_US)
- [WHOOP: Trends](https://support.whoop.com/s/article/Viewing-Trends?language=en_US)
- [Oura: Reports](https://support.ouraring.com/hc/en-us/articles/360046061373-Oura-Reports)
- [Oura: Trends](https://support.ouraring.com/hc/en-us/articles/360055983614-Using-Trends)
- [Oura: Insight-message design](https://ouraring.com/blog/inside-the-ring-the-story-behind-ouras-daily-insight-messages/)
- [Garmin: Training Status](https://support.garmin.com/en-US/?faq=672AQbbnuw2trvuTOOj9X8)
- [Garmin: Training Load Focus](https://www8.garmin.com/manuals/webhelp/GUID-AC520B63-3C82-4266-90F6-6E9F22D5F76E/EN-US/GUID-C3205D96-DAB6-4C93-A225-5B8D7B5A5621.html)
- [Garmin: Training Status explanation](https://www.garmin.com/en-US/blog/fitness/garmin-training-status-and-how-to-use-it/)

### Auditability and safety references

- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
- [WHO: Ethics and governance of artificial intelligence for health](https://www.who.int/publications/i/item/9789240029200)
- [Linear: Audit log](https://linear.app/docs/audit-log)
- [Datadog: Audit Trail](https://docs.datadoghq.com/account_management/audit_trail/)
- [Atlassian: Incident timelines](https://www.atlassian.com/incident-management/postmortem/timelines)

## Final handoff sentence

Build the week review as a calm, inspectable reconciliation surface: make the relationship between intent and execution explicit, keep safety above performance, expose every bounded automatic change with a reversible receipt, treat nutrition and wearable data as context rather than truth, and end with a versioned human decision.

---

# Additive research appendix: readiness, recovery, progression, regression, and the deterministic Coordinator

**Prepared:** 8 August 2026  
**Purpose:** research-only handoff for Claude; no application code is included here.  
**Continuity:** this appendix is additive. Everything above it is preserved from the prior week-in-review handoff. It should be read as the evidence and product-rules extension for the recovery/readiness lane, not as a replacement for the existing coach/athlete, safety, auditability, nutrition, adherence, or week-review decisions.

## Research-only scope

This lane investigates:

- heart-rate variability (HRV), resting heart rate (RHR), and heart-rate recovery (HRR);
- sleep duration, timing, regularity, sleep quality, and consumer-device estimates;
- subjective wellness and short check-ins;
- session-RPE (sRPE), internal load, external load, and acute:chronic workload concepts;
- wearable validity, device disagreement, missingness, artifacts, and baseline construction;
- what these measures can and cannot predict about performance, maladaptation, injury, and training response;
- practical recovery methods, progression methods, regression methods, deloads, re-entry, and autoregulation;
- implementation implications for a deterministic, inspectable Coordinator; and
- product recommendations for an app that is sophisticated in its decision model but visually quiet and simple.

This is not a diagnostic framework. The app must not claim to diagnose overtraining syndrome, predict an individual's injury, determine medical readiness, or turn a consumer-device score into a clinical conclusion. Pain, acute illness, neurological symptoms, cardiopulmonary symptoms, eating-disorder/low-energy-availability concerns, and post-injury return-to-play decisions require the safety and professional-review pathways already defined elsewhere in the handoff.

## Evidence notation

The appendix separates four kinds of statements:

- **Direct evidence:** a finding reported by a primary study or systematic review.
- **Consensus/practice guidance:** a professional consensus statement or expert Delphi; useful for design principles but not equivalent to an intervention trial.
- **Population-limited evidence:** evidence that may be useful but comes from a narrow population, short protocol, or specific sport.
- **Product inference:** a proposed app rule derived from the evidence. It is a design recommendation, not a clinical fact.

Direct PubMed links, PMIDs, DOIs, and relevant population limitations are included so Claude can inspect the source rather than inheriting an unexplained conclusion.

## High-Level Overview

The central conclusion is simple:

> There is no universal readiness number. A trustworthy coaching app should combine task-specific performance evidence, athlete-reported experience, recent training exposure, standardized physiological trends, data quality, and explicit context—and should sometimes abstain.

“Recovery,” “readiness,” “performance,” “fatigue,” “adaptation,” and “injury risk” are related but non-identical constructs:

- **Recovery** is a changing process of returning toward a prior state after a stressor. It can be local, systemic, psychological, metabolic, or sport-specific.
- **Readiness** is task- and goal-specific capacity today. Someone may be ready for easy aerobic work but not a maximal sprint, heavy eccentric strength work, or a high-skill session.
- **Performance** is what the athlete actually expresses under a standardized or semi-standardized task. It is closer to the decision than a generic wearable score, but it is still affected by motivation, technique, environment, and task familiarity.
- **Fatigue** is not one thing. Peripheral muscle fatigue, central fatigue, soreness, sleepiness, illness, stress, and loss of motivation can move in different directions.
- **Adaptation** is the longer-term change produced by repeated exposure and recovery. A metric changing today does not establish whether the program is creating a positive or negative adaptation.
- **Injury risk** is a probabilistic, multifactorial and time-varying construct. HRV, sleep, RHR, wellness, and ACWR are not validated individual injury-probability meters.

The research favors a layered design:

1. **Safety gate first:** pain, injury, illness, red flags, or explicit professional restrictions override performance optimization.
2. **Task-specific capacity next:** warm-up performance, technique, bar speed or pace relative to the athlete's own history, and task RPE/RIR are close to the actual session decision.
3. **Athlete experience next:** sleep sufficiency, energy, soreness, stress, mood, motivation, and willingness to train reveal information that devices often miss.
4. **Recent exposure and execution next:** completed work, sRPE, duration, volume, missed work, and unusual external load explain what the body has recently been asked to do.
5. **Physiological trends as context:** HRV, RHR, HRR, and sleep-device data can corroborate or qualify a decision when measurement quality and baseline support them.
6. **Exploratory load ratios last:** ACWR-type quantities can describe exposure patterns but should not automatically label an athlete high risk or prescribe a deload.

The product should show the result as a small number of calm states—**stable, changed, uncertain, needs review, safety stop**—with an inspectable “why” drawer. Internally, it can preserve the full evidence graph. Externally, it should not force the athlete to interpret a dashboard of competing scores.

## Deep Dive Analysis

### 1. The constructs the Coordinator must keep separate

The most consequential product error would be to collapse all information into “readiness.” A good Coordinator keeps the following questions distinct:

| Question | What it is asking | Appropriate evidence | What it must not be inferred to mean |
|---|---|---|---|
| Is there a safety concern? | Is training inappropriate, unsafe, or in need of professional review? | Pain location/behavior, acute illness, red flags, clinician restrictions, athlete report | A low HRV or poor sleep alone is not a medical stop |
| Can the athlete complete today’s planned task? | What is task-specific capacity right now? | Warm-up, technique, RPE/RIR, pace/power, symptom response, time/equipment | A green wearable score does not prove readiness |
| How much internal load did the session create? | What did this session feel like for this athlete? | Session-RPE × duration, modality, notes | sRPE is not the same as external work |
| Is the athlete accumulating stress? | Is there a repeated pattern worth reviewing? | Trends in wellness, sleep, load, performance, life context | One bad day proves neither overtraining nor under-recovery |
| Is the plan producing adaptation? | Is performance improving over weeks? | Repeated standardized outcomes, progression history, goal metrics | A single biomarker change establishes adaptation |
| Is injury likely? | What is the probability of a future injury? | No single input; requires validated prospective model and clinical context | ACWR, HRV, sleep, or soreness is not an individual injury forecast |

The Coordinator should therefore produce separate outputs such as “today’s session is modified,” “progression is held,” “sleep-support action suggested,” or “coach review requested,” rather than a single red/amber/green badge that claims to summarize the athlete.

### 2. Evidence map: what each measure is good for and where it breaks

| Signal or method | Useful product role | Main limitations and confounders | Default Coordinator posture |
|---|---|---|---|
| Subjective sleep sufficiency | Detect whether the athlete feels recovered enough for today's task; prompt practical sleep support | Recall bias, mood effects, social context; not the same as polysomnography | High-value context; ask directly and preserve the answer |
| Sleep duration/timing | Trend sleep opportunity, schedule disruption, travel, and consistency | Device estimation error; one night may have small or task-specific effects; chronic sleep loss and acute restriction differ | Trend and explain; no sleep-stage diagnosis or automatic injury label |
| HRV, especially lnRMSSD/RMSSD | Individual trend in autonomic state when captured consistently | Sensitive to posture, breathing, timing, alcohol, illness, heat, hydration, prior exercise, artifacts, device method; direction is not universally “good” or “bad” | Use as corroboration with quality and baseline; never sole trigger |
| Resting heart rate | Context for unusual systemic stress when measured under repeatable conditions | Heat, dehydration, caffeine, anxiety, illness, menstrual phase, posture, measurement time, training status | Baseline-relative trend; ask about confounders before acting |
| Heart-rate recovery | Same-test change in post-exercise autonomic recovery and training status | Exercise intensity/duration, cooldown, temperature, hydration, medication, protocol differences; faster is not always better for every decision | Only compare standardized tests; use with RPE and performance |
| Subjective wellness items | Often sensitive to acute/chronic training response; captures lived state | Burden, compliance, response framing, social desirability; a composite can hide a decisive item | Use a small item set; preserve item-level data; do not average away pain |
| Session-RPE × duration | Low-cost, cross-modality internal-load record; durable fallback when wearables fail | Perceptual scale calibration; timing; influenced by session goal and athlete experience; not external load | Primary fallback and audit field; do not equate with GPS or HR load |
| Performance execution | Direct evidence of capacity for a specific task | Technique, motivation, conditions, learning, equipment, test noise | Strong input after safety; standardize enough to detect meaningful change |
| Wearable-derived score | Convenient summary and passive trend source | Proprietary algorithm, device disagreement, missingness, sensor artifacts, black-box normalization | Store as source-labelled context; never treat vendor score as truth |
| ACWR or rolling load ratio | Descriptive exposure view and coach-review prompt | Mathematical/causal pitfalls, arbitrary windows, collinearity, workload definition, reverse causality, heterogeneous injury bins | Exploratory visualization only; no automated injury risk or deload |
| Pain/symptoms | Safety and modification signal | Requires location, behavior, severity, onset, neurological/systemic context; soreness is not always injury | Separate safety branch; takes precedence over readiness optimization |

### 3. Research review and implementation implications

#### 3.1 Subjective wellness and check-ins

**Saw et al. (2016), systematic review.** “Monitoring the athlete training response: subjective self-reported measures trump commonly used objective measures.” The review included 56 studies and reported that subjective measures were generally more sensitive and consistent than commonly used objective measures for detecting acute and chronic training-load responses. Objective and subjective measures often did not correlate well, which is not an argument to discard either; it means they may be measuring different layers of the athlete's state. Sleep, fatigue, soreness, stress, mood, and general wellness were useful domains. The authors also warned that combining items into one total score can reduce the sensitivity of individual items. [PubMed PMID 26423706; DOI 10.1136/bjsports-2015-094758](https://pubmed.ncbi.nlm.nih.gov/26423706/).

**Duignan et al. (2020), systematic review.** Single-item team-sport wellbeing measures showed practical relationships with training load, but the literature was heterogeneous. The review supports brief, repeated check-ins as usable monitoring tools; it does not justify a universal scale or a universal response threshold. [PubMed PMID 32991706; DOI 10.4085/1062-6050-0528.19](https://pubmed.ncbi.nlm.nih.gov/32991706/).

**Govus et al. (2018), collegiate American football.** In an eight-week in-season sample, pretraining wellness, energy, soreness, and sleep had mostly trivial relationships with player load or sRPE training load. The authors concluded that wellness may provide information about capacity and response, but also noted that there was no consensus for how to use wellness scores to prescribe training. This is useful precisely because it limits the claim: a check-in can inform a decision without being a reliable stand-alone predictor. [PubMed PMID 28488913; DOI 10.1123/ijspp.2016-0714](https://pubmed.ncbi.nlm.nih.gov/28488913/).

**Saw et al. (2015), implementation study.** Interviews with 30 athletes across 20 sports identified accessibility, timing, buy-in, reinforcement, minimal burden, and a supportive environment as central to successful self-report monitoring. A check-in that is scientifically elegant but tedious, punitive, or ignored by coaches will produce poor data and poor adherence. [PubMed PMID 25729301; free full text](https://pubmed.ncbi.nlm.nih.gov/25729301/).

**Flatt et al. (2018), Division-I sprint swimmers.** Subjective recovery and HRV were related but not interchangeable. The population and sport are narrow, but the practical signal is broad: disagreement between a perceived state and an autonomic marker is expected, not necessarily a data failure. [PubMed PMID 30208575; PMCID PMC6162498; DOI 10.3390/sports6030093](https://pubmed.ncbi.nlm.nih.gov/30208575/).

**Implementation implications:**

- Keep pain/illness separate from wellness. Do not let a high energy score cancel a pain flag.
- Ask a short set of actionable questions rather than a long “wellness survey.”
- Preserve each item; do not rely on a single averaged wellness score.
- Make the check-in consequential in a bounded way: the athlete should see a clear, reversible adjustment or an explanation for no change.
- Treat non-response as **unknown**, not as “fine.”
- Use the athlete's language and context as first-class data, not as an annotation beneath device metrics.

#### 3.2 HRV: useful trend, poor oracle

**Bellenger et al. (2016), systematic review and meta-analysis.** The review found mixed autonomic responses across training states. Resting HRV was largely unaffected by overreaching in the available literature, while post-exercise HRR and HR acceleration showed some evidence of positive training adaptation. Methodological and interpretive problems were substantial. The app implication is not “HRV is useless”; it is “HRV needs an individual, standardized, longitudinal context and should not be asked to answer more than it can.” [PubMed PMID 26888648; DOI 10.1007/s40279-016-0484-2](https://pubmed.ncbi.nlm.nih.gov/26888648/).

**Plews et al. (2013), review and applied framework.** HRV can be convenient for monitoring individual adaptation, particularly when interpreted as a repeated individual series rather than an absolute population value. [PubMed PMID 23852425](https://pubmed.ncbi.nlm.nih.gov/23852425/).

**Plews et al., data sufficiency.** Research on daily HRV monitoring has suggested that a minimum of approximately three randomly selected valid measurements per week can be useful in some monitoring contexts. This is a study-specific observation, not a universal requirement. The product should expose a confidence state based on valid observations rather than hard-code a single “three readings means ready” rule.

**Manresa-Rocamora et al. (2021), systematic review with meta-analysis.** HRV-guided training may be more effective than predefined training for maintaining or improving vagally mediated HRV and may reduce negative responses, but group-level fitness/performance advantages appear small. The review also noted that best practices for HRV index selection, recording position, and fixed versus rolling baselines require further study. [PubMed PMID 34639599; open article DOI 10.3390/ijerph181910299](https://pubmed.ncbi.nlm.nih.gov/34639599/).

**Vesterinen et al. (2016), recreational runners.** In 40 recreational runners, HRV-guided training produced fewer moderate/high-intensity sessions and some performance benefit, but the between-group performance advantage was small and VO2max improved in both groups. This supports individualized timing of difficult sessions, not a universal daily readiness gate. [PubMed PMID 26909534; DOI 10.1249/MSS.0000000000000910](https://pubmed.ncbi.nlm.nih.gov/26909534/).

**Nuuttila et al. (2017), endurance athletes.** HRV-guided and predetermined block training have been compared in small endurance samples. Findings are useful for hypothesis generation, but the designs are not sufficient to generalize to strength training, team sports, older adults, clinical populations, or a consumer app population. [PubMed PMID 28950399; DOI 10.1055/s-0043-115122](https://pubmed.ncbi.nlm.nih.gov/28950399/).

**Resistance exercise is a confounder.** A 2022 systematic review/meta-analysis of 26 studies found that acute resistance exercise commonly produced parasympathetic withdrawal and sympathetic activation, with responses affected by sets, intensity, rest, and volume. An athlete's next-day HRV can therefore reflect the last session, not a generic “recovery capacity.” [PubMed PMID 33246163; PMCID PMC9189698; DOI 10.1016/j.jshs.2020.11.008](https://pubmed.ncbi.nlm.nih.gov/33246163/).

**Measurement and artifact.**

- Smartphone photoplethysmography and chest-strap recordings can agree acceptably with ECG for some short-term RMSSD measures under controlled conditions, but that does not validate every wearable's readiness score. Plews et al. studied 29 healthy adults. [PubMed PMID 28290720; DOI 10.1123/ijspp.2016-0668](https://pubmed.ncbi.nlm.nih.gov/28290720/).
- A 2017 athlete study examined the minimum window for accurate HRV recording and supports the need for a defined, repeatable recording protocol. [PubMed PMID 28848382; PMCID PMC5554345; DOI 10.3389/fnins.2017.00456](https://pubmed.ncbi.nlm.nih.gov/28848382/).
- Artifacts can badly distort RMSSD; a single artifact has been reported to create very large changes. [PubMed PMID 35719238](https://pubmed.ncbi.nlm.nih.gov/35719238/).
- A 2025 smartwatch missing-data study found that some resting time-domain measures were stable until substantial data degradation, while LF/HF-derived measures were unstable with much less degradation; device agreement with chest ECG varied. [PubMed PMID 39993288; PMCID PMC11894354; DOI 10.2196/53645](https://pubmed.ncbi.nlm.nih.gov/39993288/).

**HRV rules for the app:**

- Prefer a clearly named metric and method, such as morning lnRMSSD/RMSSD, instead of a vendor's opaque “recovery” number.
- Capture method, duration, posture, time, device, artifact handling, breathing instruction, and completeness.
- Compare only like-with-like observations. Do not mix morning seated smartphone readings with overnight proprietary scores in one baseline.
- Use an individual rolling baseline and trend. Do not use a population cutoff.
- Do not make a high-intensity session unavailable solely because one HRV observation is low.
- A persistent, quality-checked shift plus poor subjective state, elevated sRPE, or poor standardized performance can justify holding or reducing a session within the coach-authored policy.
- A normal HRV value never overrides pain, illness, or an explicit professional restriction.
- LF/HF should not be the primary consumer-facing recovery signal; it is more sensitive to missingness and methodological choices.

#### 3.3 Resting heart rate and heart-rate recovery

**Resting heart rate.** Bosquet et al.'s systematic review found short-term overload could be associated with moderate increases in resting HR and changes in autonomic indices, while long-term changes were inconsistent. Effects were small to moderate relative to day-to-day variation, and interpretation required other signs and symptoms. [PubMed PMID 18308872; DOI 10.1136/bjsm.2007.042200](https://pubmed.ncbi.nlm.nih.gov/18308872/).

RHR is affected by heat, dehydration, caffeine, anxiety, sleep timing, posture, medication, illness, menstrual phase, and measurement conditions. An app should therefore say “RHR is higher than your recent comparable mornings; context needed,” not “you are not recovered.”

**Heart-rate recovery.** Daanen et al.'s systematic review found that HRR has potential for tracking changes in training status, but studies were difficult to compare because of age, ambient temperature, exercise intensity, exercise duration, and recovery protocol. Better standardization was required. [PubMed PMID 22357753; DOI 10.1123/ijspp.7.3.251](https://pubmed.ncbi.nlm.nih.gov/22357753/).

Le Meur et al. studied 20 male triathletes and found that HRR changed after overload, but a faster HRR did not systematically predict better performance. Submaximal HRR may be useful only alongside RPE, training phase, and performance evidence. [PubMed PMID 27617566; DOI 10.1123/ijspp.2015-0675](https://pubmed.ncbi.nlm.nih.gov/27617566/).

**HRR rules for the app:**

- HRR is eligible only when the exercise test, intensity, duration, cooldown, sensor method, and recovery timepoint are sufficiently comparable.
- Store both the raw heart-rate trace/summary and the test context.
- Do not compare a race, a hot outdoor run, and a controlled submax test as if they were the same test.
- If the protocol is not standardized, mark HRR **not comparable** rather than normalizing it into a false trend.
- Use HRR to qualify a trend or suggest a standardized re-test; do not let it independently trigger a deload.

#### 3.4 Sleep metrics, performance, and injury

**Sleep and performance.** Fullagar et al.'s review found that sleep loss can impair some physical, cognitive, and sport-specific outcomes, but effects vary by task and the autonomic response is not uniform. Sleep loss can also resemble overtraining symptoms, making interpretation difficult. [PubMed PMID 25315456; DOI 10.1007/s40279-014-0260-0](https://pubmed.ncbi.nlm.nih.gov/25315456/).

The 2021 athlete sleep consensus emphasized individualized sleep needs, the frequency of short/poor sleep in elite athletes, measurement limitations, the need for a sleep toolbox, and the under-representation of women in the evidence. It does not support a one-size-fits-all app rule that “less than seven hours equals unsafe.” [PubMed PMID 33144349; DOI 10.1136/bjsports-2020-102025](https://pubmed.ncbi.nlm.nih.gov/33144349/).

Sleep extension studies are promising but narrow. Mah et al. studied 11 male collegiate basketball players in a 5–7 week extension protocol; sprint, shooting, vigilance, and mood improved, but the study was small and not randomized with a robust control. [PubMed PMID 21731144; PMCID PMC3119836; DOI 10.5665/SLEEP.1132](https://pubmed.ncbi.nlm.nih.gov/21731144/). Arnal et al. studied 12 healthy men and found prior sleep extension improved performance during subsequent sleep loss, again in a highly controlled and small sample. [PubMed PMID 27015382; DOI 10.1249/MSS.0000000000000925](https://pubmed.ncbi.nlm.nih.gov/27015382/). A systematic review of sleep extension in athletes found the evidence tentative and low to moderate in certainty. [PubMed PMID 33352457; DOI 10.1016/j.sleep.2020.11.028](https://pubmed.ncbi.nlm.nih.gov/33352457/).

**Consumer sleep devices.**

- A 2021 study comparing seven devices with polysomnography in 34 healthy young adults found high sleep/wake sensitivity but low-to-medium specificity and mixed sleep-stage performance; accuracy was worse during disrupted sleep. [PubMed PMID 33378539; PMCID PMC8120339; DOI 10.1093/sleep/zsaa291](https://pubmed.ncbi.nlm.nih.gov/33378539/).
- A 2022 validation of six devices in 53 healthy adults found acceptable sleep/wake agreement but only moderate agreement for sleep stages; global duration and timing were more useful than stage labels. [PubMed PMID 36016077; PMCID PMC9412437; DOI 10.3390/s22166317](https://pubmed.ncbi.nlm.nih.gov/36016077/).
- A 2025 meta-analysis of wrist-worn devices versus polysomnography found systematic differences in total sleep time, sleep efficiency, latency, and wake after sleep onset. The devices may support pattern monitoring but should not be treated as diagnostic sleep laboratories. [PubMed PMID 39484805; PMCID PMC11874098; DOI 10.5664/jcsm.11460](https://pubmed.ncbi.nlm.nih.gov/39484805/).

**Sleep and injury.** Dobrosielski et al.'s systematic review of 12 prospective cohorts found limited evidence and concluded that poor sleep was not supported as an independent sport-injury risk factor in adult athletic populations. Evidence was insufficient across elite, collegiate, professional, dance, and endurance groups. [PubMed PMID 33560506; DOI 10.1007/s40279-020-01416-3](https://pubmed.ncbi.nlm.nih.gov/33560506/). The app can responsibly say “sleep may affect today's performance and recovery support,” but not “your sleep score predicts injury.”

**Sleep rules for the app:**

- Ask “Did you get enough sleep for you to feel able to train today?” as a primary question; device duration is secondary context.
- Track opportunity, duration, timing, regularity, awakenings, perceived quality, and unusual disruption separately when possible.
- Prefer trend language: “three nights of reduced sleep opportunity” rather than “sleep score 62 means deload.”
- Use a low-sleep pattern to suggest low-cost actions—earlier wind-down, schedule protection, nap opportunity, hydration/fueling check, or a conservative cap—not to label the athlete injured.
- Do not expose sleep stages as authoritative in the primary experience.

#### 3.5 Session-RPE and internal load

Foster's session-RPE method remains valuable because it is cheap, modality-agnostic, and close to the athlete's experienced internal demand. Foster's monitoring review describes sRPE as simple and responsive while warning that wearable systems can create information overload and slow decision-making. [PubMed PMID 28253038; DOI 10.1123/ijspp.2016-0388](https://pubmed.ncbi.nlm.nih.gov/28253038/).

The classic formulation is session duration multiplied by a post-session global RPE. Foster's original monitoring work and subsequent soccer validation support its use for tracking training load, but it is not an external-load substitute. [PubMed PMID 9662690; DOI 10.1097/00005768-199807000-00023](https://pubmed.ncbi.nlm.nih.gov/9662690/); [Impellizzeri et al., PubMed PMID 15179175; DOI 10.1249/01.MSS.0000128199.23901.2F](https://pubmed.ncbi.nlm.nih.gov/15179175/).

A 2024 study of 10 elite cross-country skiers and 273 sessions found a moderate relationship between sRPE training load and HR-derived TRIMP overall, with weaker agreement at higher intensity. Session duration and intensity meaningfully affect the relationship. sRPE is a useful fallback, not an interchangeable physiological measurement. [PubMed PMID 38846717; PMCID PMC11155691; DOI 10.3389/fnins.2024.1341972](https://pubmed.ncbi.nlm.nih.gov/38846717/).

**sRPE rules for the app:**

- Ask for global session difficulty after the session, preferably after a short delay rather than immediately after the hardest set.
- Store scale anchors, duration, modality, athlete versus coach reporter, and whether the session was modified.
- Keep session-RPE, set RPE/RIR, heart-rate load, and external load as distinct fields.
- Use sRPE as the default load record when HR/GPS is missing or clearly noisy.
- Use repeated divergence—planned session moderate, experienced session very hard—as a reason to inspect recovery, fueling, illness, heat, or prescription mismatch.
- Do not convert sRPE into injury probability.

#### 3.6 Acute:chronic workload concepts and injury prediction

ACWR has intuitive appeal: compare a recent acute load with a longer rolling load. The problem is that intuitive ratios are not automatically valid causal models.

Griffin et al.'s systematic review found inconsistent evidence relating ACWR to injury. [PubMed PMID 31691167; DOI 10.1007/s40279-019-01218-2](https://pubmed.ncbi.nlm.nih.gov/31691167/). Andrade et al.'s systematic review/meta-analysis included 20 studies, 2,375 injuries, and 1,234 athletes, but all included athletes were male and the studies used heterogeneous methods and bins. [PubMed PMID 32572824](https://pubmed.ncbi.nlm.nih.gov/32572824/). Wang et al. found poor methodological quality and no consensus in elite male football ACWR research. [PubMed PMID 35073237; DOI 10.1080/24733938.2020.1765007](https://pubmed.ncbi.nlm.nih.gov/35073237/).

Impellizzeri et al. identified conceptual and mathematical pitfalls and stated that causal relationships had not been established. [PubMed PMID 32502973; DOI 10.1123/ijspp.2019-0864](https://pubmed.ncbi.nlm.nih.gov/32502973/). Their later paper explicitly argued for dismissing ACWR and its underlying theory as an automated decision model. [PubMed PMID 33332011; DOI 10.1007/s40279-020-01378-6](https://pubmed.ncbi.nlm.nih.gov/33332011/).

The IOC consensus also emphasizes that load is broader than external training: competition, travel, psychological stress, and other demands matter. [PubMed PMID 27535989; DOI 10.1136/bjsports-2016-096581](https://pubmed.ncbi.nlm.nih.gov/27535989/).

**ACWR rules for the app:**

- Do not display a “safe/unsafe” or “injury risk” gauge derived from ACWR.
- If the coach wants ACWR available, put it in an exploratory load-inspection drawer with definition, window, load source, missingness, and a warning that the causal model is disputed.
- Prefer descriptive views: recent load, rolling load, monotony/strain where appropriate, number of hard exposures, repeated high-intensity days, and abrupt changes in sport-specific exposure.
- Let the athlete's actual response—sRPE, performance, soreness, pain, sleep, and life context—qualify the exposure.
- A high recent load with good execution and no safety signals should not force a deload; it should create an observation or coach-review prompt.

#### 3.7 Wearable validity, vendor scores, and provenance

Wearables are often useful sensors and often poor interpreters. The product must separate the two.

Zhang et al.'s systematic review/meta-analysis of 44 articles, 738 effect sizes, and 15 brands found near-zero average heart-rate differences during sleep/rest/treadmill conditions but larger errors during resistance training and cycling. [PubMed PMID 32552580; DOI 10.1080/02640414.2020.1767348](https://pubmed.ncbi.nlm.nih.gov/32552580/). This supports using a chest strap or standardized optical reading for appropriate heart-rate contexts while relying on duration and sRPE for resistance-session load when the wrist signal is unreliable.

Miller et al. validated six devices against polysomnography and ECG in 53 healthy adults over one laboratory night. Sleep/wake estimates were more useful than stages, and device-specific differences matter. [PubMed PMID 36016077; PMCID PMC9412437; DOI 10.3390/s22166317](https://pubmed.ncbi.nlm.nih.gov/36016077/). A WHOOP validation study also illustrates the correct product posture: a device can be evaluated for sleep estimation without making its proprietary recovery score a validated readiness truth. [PubMed PMID 32713257](https://pubmed.ncbi.nlm.nih.gov/32713257/).

**Every imported observation should carry:**

- source and device;
- raw versus vendor-derived status;
- metric definition and units;
- start/end time and timezone;
- measurement context and posture where available;
- algorithm/device firmware version when available;
- completeness and quality flags;
- whether the observation is comparable with the athlete's baseline;
- import timestamp and provenance trail; and
- whether the athlete confirmed, corrected, or rejected it.

The primary UI should avoid device worship. The athlete should see “overnight heart-rate trend from Oura” or “sleep duration estimated by Garmin,” not an unlabeled universal score.

#### 3.8 What predicts performance or injury?

Borresen and Lambert's review is unusually clear: no single physiological marker had been identified that could measure fitness/fatigue responses or accurately predict performance, and training-performance models had poor accuracy partly because they lacked individual response information. [PubMed PMID 19691366; DOI 10.2165/11317780-000000000-00000](https://pubmed.ncbi.nlm.nih.gov/19691366/).

The evidence supports **useful association and decision support**, not deterministic individual forecasting:

- Subjective wellness can be sensitive to change and can relate weakly to training output, but a single item or score is not a reliable performance forecast.
- HRV-guided training may produce small group-level benefits or fewer hard sessions in selected endurance cohorts, but methodology and population limits are substantial.
- RHR and HRR can reflect training status or overload in standardized contexts, but day-to-day noise and confounding are large.
- Sleep loss can impair specific tasks, but the size and direction of effect vary by sport, task, dose, and individual.
- sRPE quantifies experienced internal load well enough to guide monitoring, but it is not a direct measure of tissue stress or injury risk.
- ACWR has substantial conceptual and empirical limitations and should not be used as an automated injury-risk label.
- Poor sleep is not established as an independent injury predictor across adult athletes.

For future predictive modeling, the app should require prospective validation, transparent calibration, subgroup evaluation, false-positive/false-negative analysis, and an explicit human review pathway. A high AUC in a retrospective, single-team dataset is not enough to expose an athlete-facing risk label.

### 4. Practical baseline and trend framework

#### 4.1 Baselines are personal, signal-specific, and versioned

The app should maintain a separate baseline for each signal and measurement mode:

- morning lnRMSSD/RMSSD captured with a named method;
- overnight HRV from a specific device;
- waking RHR from a specific method;
- standardized submax HRR test;
- perceived sleep sufficiency;
- estimated sleep duration from a named device;
- each subjective wellness item;
- session-RPE for each modality or session type;
- standardized warm-up performance;
- weekly load/exposure descriptors.

Do not create one pooled baseline from incompatible sources. A phone camera reading, a chest strap, a wrist wearable, and an overnight vendor metric can all be useful, but they do not automatically belong in one time series.

**Product defaults, explicitly labeled as design defaults rather than universal scientific cutoffs:**

- During onboarding, the app may accept seven days of comparable observations to begin showing a **cold-start, low-confidence** trend.
- Four weeks of reasonably comparable observations is a more useful initial individual reference for many daily signals.
- Baseline confidence should continue to grow with repeated valid observations across different ordinary life conditions; it should not be declared “true” after a fixed number of days.
- A baseline should be versioned when the measurement method, device, athlete schedule, medication context, training phase, or major life circumstance changes.
- The app should preserve prior baselines for historical interpretation instead of silently recalculating the past.

These defaults are product choices. They must not be presented as a physiological law.

#### 4.2 Robust baseline construction

For Claude's implementation spec, use a robust summary rather than a fragile arithmetic average:

- central tendency: median or trimmed mean;
- variability: median absolute deviation (MAD), interquartile range, or a robust standard deviation;
- trend: rolling median or smoothed slope over a stated window;
- deviation: the current observation relative to the athlete's own baseline and variability;
- persistence: number of comparable observations supporting the shift;
- quality: proportion of valid, comparable observations in the window;
- context: flags for travel, illness, unusual heat, alcohol, menstrual phase, medication changes, high stress, and prior hard exercise.

The user should not see a mathematically dense z-score unless they open the explanation. The app can use robust statistics under the hood while displaying “stable,” “shifted from your recent pattern,” or “not enough comparable data.”

#### 4.3 Trend states

Each signal should have a state independent of the final coaching decision:

| Signal state | Meaning | Example display | Coordinator implication |
|---|---|---|---|
| Stable | Comparable data are close to the athlete's recent pattern | “Within your recent range” | No signal-based change |
| Shifted | A meaningful individual-relative change is present, with acceptable quality | “Higher than your recent pattern” | Qualify or combine; do not act alone unless a coach rule says so |
| Improving/declining trend | Repeated directional movement over a stated window | “Three comparable readings trending lower” | Consider pattern review; not a diagnosis |
| Unstable | Large fluctuation or poor repeatability | “Readings are inconsistent” | Reduce confidence; seek context or standardize measurement |
| Confounded | A known context can plausibly explain the change | “Heat/travel may affect this reading” | Do not treat as pure readiness evidence |
| Stale | Last valid data are too old for the decision | “Last comparable reading was 8 days ago” | Do not use for today’s decision |
| Missing | No observation exists | “No data” | Abstain from that signal; never impute “normal” |
| Not comparable | Data exist but method/context changed | “Device or protocol changed” | Start a new baseline or show separate series |

#### 4.4 No universal cutoffs

The app must not hard-code statements such as:

- “HRV down 10% means rest”;
- “RHR up 5 bpm means illness”;
- “sleep under 7 hours means no intensity”;
- “ACWR above 1.5 means injury risk”; or
- “three bad answers mean deload.”

These numbers may appear in a research paper, commercial product, or coach's local protocol, but they are not universal truths. If a coach defines a threshold for a specific athlete and test, it should be stored as a versioned, coach-authored rule with scope, rationale, expiry/review date, and a visible warning that it is individualized.

#### 4.5 Confidence is evidence quality, not a hidden readiness score

Use a small, inspectable confidence state per signal and per decision:

- **High confidence:** comparable method, adequate recent observations, good signal quality, stable baseline, no major confounder.
- **Moderate confidence:** useful data with one limitation, such as fewer observations, a mild context flag, or imperfect device validation.
- **Low confidence:** sparse, noisy, method-changed, stale, or strongly confounded data.
- **No confidence:** missing or non-comparable data.

The final decision confidence should be allowed to be lower than the best signal's confidence. For example, a high-quality HRV trend plus missing symptom check-in should not yield high confidence about whether the athlete should train hard.

### 5. Signal disagreement and conflict resolution

Disagreement is normal and should be visible. It often tells the product that signals refer to different timescales or constructs:

- a wearable may reflect last night's autonomic or sleep estimate;
- a check-in may reflect current mood, energy, soreness, and life stress;
- a warm-up may reflect task-specific capacity;
- sRPE records the athlete's experienced demand after the session;
- ACWR describes a rolling exposure summary rather than current capacity.

#### 5.1 Recommended decision precedence

The Coordinator should resolve conflict in this order, with the exact action still bounded by the coach-authored plan:

1. **Safety and professional restrictions.** Pain behavior, acute illness, red flags, or explicit clinician restrictions.
2. **Immediate task-specific response.** Warm-up quality, technique, pain response, RPE/RIR, pace/power, or inability to meet the session's safe target.
3. **Athlete-reported state.** Sleep sufficiency, energy, soreness, stress, mood, motivation, and willingness.
4. **Recent execution and internal load.** Completed work, sRPE, duration, missed sessions, unusual difficulty, and repeated failure to recover between exposures.
5. **Standardized physiological trends.** Comparable HRV, RHR, or HRR with sufficient quality and baseline support.
6. **Device-estimated sleep and vendor summaries.** Useful context but weaker than direct report for the athlete's lived experience.
7. **Exploratory rolling load ratios.** Descriptive context only; never an injury or readiness verdict.

This is a practical product hierarchy, not a claim that subjective data are always more “objective” or that a warm-up is always more informative. The decision must be task-specific. A standardized HRR test may be more informative for an endurance test than a generic sleep score; pain still overrides both.

#### 5.2 Conflict examples

| Situation | Correct interpretation | Coordinator behavior |
|---|---|---|
| Wearable says “green”; athlete reports sharp focal pain | Safety disagreement, not readiness disagreement | Stop or route to the pain/safety branch; do not reassure from the wearable |
| HRV is low once; athlete feels normal; warm-up is normal | One low physiological observation with weak persistence | Keep or conservatively hold the session; flag the HRV as context; request repeat measurement |
| HRV is normal; athlete reports exhaustion; warm-up is poor and sRPE is historically high | Physiological signal conflicts with direct current response | Hold or reduce the hard component; suggest recovery support; investigate context |
| Sleep device is poor; athlete feels adequate; standardized warm-up is normal | Device estimate conflicts with direct function | Do not automatically cancel; preserve the result and offer sleep-support actions |
| Athlete reports poor sleep; warm-up is normal; planned session is high-skill/maximal | Capacity may be sufficient but uncertainty and consequence are high | Keep the session only within a coach-authored cap or shift to quality practice; do not make a binary sleep judgment |
| Wearable data are missing; check-in and session data are complete | One input is absent, not the athlete's state | Continue using available signals; label wearable evidence unavailable |
| Wearable is normal; athlete does not complete the check-in | Missing subjective information | Do not infer “well”; keep the plan or use only approved performance rules |
| ACWR is high; performance and wellness are stable | High exposure is not automatically maladaptation | Show an observation card or coach review; do not generate an injury warning |
| RHR is elevated after hot travel | A plausible confounder exists | Mark RHR confounded; ask hydration/illness questions; avoid an automatic deload |

#### 5.3 Do not average away disagreement

The product should not compute a single “readiness score” by averaging HRV, sleep, soreness, stress, and RHR. Averaging can hide the one item that matters most—for example, severe focal pain inside a generally good wellness profile. If a summary is required for a coach dashboard, use an explicit state such as:

> “No safety flag. Two supportive signals. One uncertain signal. Direct performance not yet observed.”

That summary is more honest and more actionable than “readiness 78.”

### 6. The abstention and uncertainty contract

Abstention is a feature, not a failure. The deterministic Coordinator should decline to infer when the evidence is not sufficient for the decision.

#### 6.1 Required abstention conditions

The Coordinator should abstain from an automatic readiness or progression inference when any of the following is true:

- no individual baseline exists for the signal;
- the observation is missing, stale, or non-comparable;
- signal quality is below the configured minimum;
- a known confounder is not resolved;
- key signals materially disagree and the policy has no conflict rule;
- pain or illness information is incomplete or ambiguous;
- the current task is outside the approved adaptation policy;
- the requested change could affect a protected anchor session, competition, medical restriction, or coach commitment;
- the exercise substitution is not equivalence-mapped;
- the program has insufficient recent execution data to know whether an increase is earned;
- a previous automatic change did not receive an outcome observation; or
- the decision would require a diagnosis, injury prediction, or individualized medical judgment.

#### 6.2 Allowed decision states

Use plain, bounded states rather than pretending to know a continuous internal condition:

- **No change:** continue the plan; no qualifying signal supports a change.
- **Hold progression:** repeat the current target and collect another comparable outcome.
- **Reduce within policy:** reduce load, volume, density, complexity, or intensity according to a named rule.
- **Alternate within policy:** swap to a coach-approved equivalent or lower-cost variation.
- **Review required:** surface the evidence and request coach input.
- **Safety stop:** stop, restrict, or route to professional review according to the safety policy.
- **Proposal only:** generate a reversible coach/athlete proposal; do not apply it automatically.
- **No data:** preserve the plan but explicitly state which evidence was unavailable.

#### 6.3 User-facing language

Prefer:

- “Your last three comparable readings are lower than your recent pattern, but your warm-up and check-in are normal. I’m holding the progression and keeping today’s work in the approved range.”
- “I don’t have enough comparable data to interpret this wearable change. No automatic adjustment was made.”
- “You reported focal knee pain. The recovery score cannot override that. Today’s lower-body work is paused and sent to the safety pathway.”
- “Your sleep estimate is lower than usual, but the device is uncertain. Consider the short-session option; no injury conclusion is being made.”

Avoid:

- “You are recovered.”
- “You are not ready.”
- “Your HRV says you should rest.”
- “Your injury risk is high.”
- “You failed recovery.”

### 7. Recovery methods: evidence-informed, goal-aware, and non-magical

The app should distinguish two questions:

1. **What may help the athlete feel or function better in the next few hours?**
2. **What best supports adaptation across days and weeks?**

The answers are not always identical. A modality that reduces soreness today may not improve strength adaptation when used after every hypertrophy session.

**Kellmann et al. consensus.** Recovery is a dynamic stress/recovery balance with substantial intra- and inter-individual variability. Monitoring should be systematic but multifaceted, and recovery routines should be individualized. [PubMed PMID 29345524; DOI 10.1123/ijspp.2017-0759](https://pubmed.ncbi.nlm.nih.gov/29345524/).

| Recovery method | What the evidence supports | Limitations/goal conflict | Product treatment |
|---|---|---|---|
| Sleep opportunity and regularity | First-line support for performance, mood, and recovery; individualized sleep need | Device estimates are imperfect; acute and chronic sleep loss differ | High-priority, low-friction action card; no universal cutoff |
| Sleep extension | Promising performance and mood benefits in small athlete studies; evidence tentative overall | Small samples, mostly young/male/elite or collegiate cohorts; adherence matters | Offer as an experiment with a before/after outcome, not a guarantee |
| Nap | May improve physical/cognitive/perceptual outcomes in some settings | Timing, duration, sleep inertia, and nighttime sleep effects vary | Suggest an optional, context-aware nap; record response |
| Carbohydrate/fluid/fueling | Important for restoration after demanding endurance or repeated sessions | Needs vary by goal, duration, body size, heat, and medical context | Checklist and reminder; avoid personalized medical nutrition claims |
| Active recovery | Can improve perceived recovery and some acute markers; low-cost movement may support routine | Not a universal cure; extra exercise can add load | Suggest easy movement only when it fits the plan and no safety flag exists |
| Massage | Can reduce DOMS and perceived fatigue in some studies | Does not necessarily restore force or adaptation; access/cost | Optional comfort tool; do not claim tissue repair |
| Compression | Some short-term perceptual/physiological benefits in selected protocols | Protocol and population heterogeneity | Optional, low-priority card; not a required recovery task |
| Cold-water immersion | Can improve soreness/perceived recovery and some repeated-bout performance outcomes | May attenuate anabolic signaling/adaptation after resistance training; protocol-sensitive | Goal-aware warning: potentially useful for rapid repeated performance, not default after hypertrophy/strength |
| Heat/sauna | May support relaxation or selected endurance adaptations | Heat stress, dehydration, medical contraindications, evidence context-specific | Optional and safety-gated; never prescribe as universal recovery |
| Breathing/relaxation | May support down-regulation, stress management, and sleep routine | Does not substitute for sleep, food, or load management | 2–5 minute optional action with user control |
| Mobility/low-intensity technique | Useful when the goal is movement quality and confidence | Stretching does not automatically resolve injury or DOMS | Place inside a goal-specific session, not as a universal “fix” |
| Rest day/reduced load | Often the most direct way to reduce training stress | Full rest is not always needed; too much avoidance can impair adherence | Make the smallest useful change; preserve routine when safe |

#### 7.1 Recovery modality evidence details

Dupuy et al.'s systematic review/meta-analysis found that several modalities—including massage, active recovery, compression, immersion, contrast, and cryotherapy—can reduce markers of soreness, fatigue, or muscle damage, but reductions in markers are not identical to improved long-term performance or adaptation. [PubMed PMID 29755363](https://pubmed.ncbi.nlm.nih.gov/29755363/).

Cold-water immersion studies suggest short-term benefits in soreness and perceived recovery, but the trade-off matters. Craven et al. found benefits for power and soreness/perceived recovery at 24 hours but no clear strength recovery benefit. [PubMed PMID 35157264](https://pubmed.ncbi.nlm.nih.gov/35157264/). Hyldahl et al.'s review describes more consistent concern about attenuation of strength/muscle-mass adaptations with regular post-resistance cooling than after endurance work. [PubMed PMID 32644914; DOI 10.1152/japplphysiol.00322.2020](https://pubmed.ncbi.nlm.nih.gov/32644914/). Roberts et al. reported attenuated acute anabolic signaling and longer-term strength-training adaptations after post-exercise cold-water immersion. [PubMed PMID 26174323](https://pubmed.ncbi.nlm.nih.gov/26174323/).

Laborde et al.'s 2024 systematic review/meta-analysis found small-to-moderate positive effects of physical recovery techniques on post-exercise RMSSD, with heterogeneity and technique-specific differences. That supports treating HRV change as a mechanism or recovery marker in a study context—not proof that a modality repaired the athlete or improved next-session performance. [PubMed PMID 37754676; DOI 10.1111/cpf.12855](https://pubmed.ncbi.nlm.nih.gov/37754676/).

#### 7.2 Recovery product rules

- First-line suggestions should be sleep opportunity, adequate fueling/hydration, stress reduction, and a correctly dosed next session.
- A recovery card should state the goal: “feel better today,” “prepare for a second session,” “support sleep,” or “protect long-term strength adaptation.”
- Every intervention should have a duration, an expected observation, and a way to dismiss it.
- The app should ask whether the athlete wants a recovery suggestion; it should not create an infinite recovery task list.
- Passive modalities should be presented as optional context-sensitive tools, not obligations.
- Cold-water immersion should be conditional on the near-term performance goal and the training adaptation goal.
- Recovery suggestions must never imply that soreness equals damage, that a metric proves tissue status, or that a modality prevents injury.
- If the athlete repeatedly needs a recovery intervention to tolerate the plan, surface the pattern for coach review rather than adding more interventions.

### 8. Progression: how the app should earn an increase

Progression is not simply “add more.” It is a controlled change in one or more training demands while preserving the goal, technical quality, recoverability, and athlete agency.

#### 8.1 Progression axes

| Axis | What increases | Typical use | Evidence or product caution |
|---|---|---|---|
| Load/intensity | External resistance, pace, power, incline, or target intensity | Strength, power, sport-specific performance | Do not infer permission from a wearable score; require successful prior execution |
| Repetitions/time/distance | Work completed within the same movement or zone | Hypertrophy, endurance, capacity | Use ranges, not a single rigid target; keep technique and RPE/RIR constraints |
| Sets/volume | Total work or exposures | Hypertrophy, strength, endurance | Volume is a meaningful stressor; increase one major dimension at a time unless the coach defines otherwise |
| Density | Same work in less time or shorter rest | Conditioning, work capacity | Density can increase internal load even when external work is unchanged |
| Frequency | More weekly exposures | Skill, endurance, distributed strength volume | Adds scheduling and recovery demand; needs adherence and life-context fit |
| Complexity/skill | More degrees of freedom, instability, speed, or coordination | Skill progression, sport transfer | Do not progress complexity and load simultaneously without explicit policy |
| Range/tempo/control | More range, slower eccentric, pause, or technical constraint | Movement quality, hypertrophy, rehabilitation under professional plan | This is still load; the app must not call it “easy” automatically |
| Environment/constraints | Less support, more sport specificity, more fatigue or pressure | Transfer to competition | Use only after the base skill is stable and safety permits |
| Phase/goal | Shift from accumulation to intensification, realization, maintenance, or taper | Periodized training | Phase changes are coach-authored; not triggered by one metric |
| Autonomy | Athlete chooses among approved variants | Adherence and agency | Choice set must preserve the session's intent and guardrails |

#### 8.2 Evidence on periodization and minimum effective dose

Moesgaard et al.'s 2022 systematic review/meta-analysis of 35 volume-equated studies found a small strength benefit for periodized versus non-periodized resistance training and for undulating versus linear periodization in some trained participants, while hypertrophy did not differ materially when volume was equated. [PubMed PMID 35044672; DOI 10.1007/s40279-021-01636-1](https://pubmed.ncbi.nlm.nih.gov/35044672/). Harries et al.'s earlier meta-analysis of 17 studies and 510 participants found no difference between linear and undulating periodization for upper- or lower-body strength, while noting short study durations and limited athletic populations. [PubMed PMID 25268290; DOI 10.1519/JSC.0000000000000712](https://pubmed.ncbi.nlm.nih.gov/25268290/). Grgic et al. found similar hypertrophy effects between linear and daily undulating periodization in 13 eligible studies, with limited evidence in trained and clinical populations. [PubMed PMID 28848690; PMCID PMC5571788; DOI 10.7717/peerj.3695](https://pubmed.ncbi.nlm.nih.gov/28848690/).

The product implication is not to choose one “best” periodization model. It is to make the selected model explicit and make adaptation rules respect the coach's goal. Variety and undulation can help strength expression or adherence without meaning that every athlete needs daily complexity.

Androulakis-Korakakis et al.'s systematic review/meta-analysis found that, in resistance-trained men, a single set of 6–12 repetitions performed 1–3 times per week at high effort could produce suboptimal but significant squat and bench strength gains over 8–12 weeks. The evidence was limited to six studies, mostly men, and was not clear for deadlift, trained women, or highly trained athletes. [PubMed PMID 31797219; DOI 10.1007/s40279-019-01236-0](https://pubmed.ncbi.nlm.nih.gov/31797219/). This is useful for the app's minimum-dose and re-entry lanes: a reduced plan can preserve continuity and produce some adaptation; it is not proof that minimum dose is optimal for every goal.

#### 8.3 Autoregulation and proximity to failure

Greig et al.'s review found inconsistent terminology and implementation in resistance-training autoregulation. Autoregulation should therefore be operationally defined in the product rather than used as a vague promise. [PubMed PMID 32813181; PMCID PMC7575491; DOI 10.1007/s40279-020-01330-8](https://pubmed.ncbi.nlm.nih.gov/32813181/).

Repetitions-in-reserve (RIR) is a useful way to keep effort inside a target, but it is not perfectly accurate. Helms et al. described the RIR-based RPE scale for resistance training; later work shows prediction accuracy varies by load, exercise, proximity to failure, and training experience. [Full text PMCID PMC4961270](https://pmc.ncbi.nlm.nih.gov/articles/PMC4961270/); [Steele et al., full text PMCID PMC5712461](https://pmc.ncbi.nlm.nih.gov/articles/PMC5712461/); [Refalo et al., PubMed PMID 37967832](https://pubmed.ncbi.nlm.nih.gov/37967832/).

Training to failure is not required for every adaptation. Grgic et al.'s systematic review/meta-analysis of 15 studies found no significant overall difference between failure and non-failure training for strength or hypertrophy, with important subgroup and volume differences; all studies used young adults and generalizability to older or highly trained people was limited. [PubMed PMID 33497853; PMCID PMC9068575; DOI 10.1016/j.jshs.2021.01.007](https://pubmed.ncbi.nlm.nih.gov/33497853/).

**Product implication:** use RIR/RPE as a guardrail and learning signal, not a perfect sensor. The app should accept “I thought I had two reps left, but the final rep was a grind” as calibration data rather than treating the athlete as wrong.

#### 8.4 Named progression primitives

The coach must choose the progression primitive per exercise, session, or block. The Coordinator should not invent a progression philosophy from data.

| Primitive | Coach-authored rule | Required evidence before increase | Safe response when evidence is absent or mixed |
|---|---|---|---|
| Double progression | Stay within a rep range; increase load after the athlete completes the upper bound across defined sets with target technique/RIR | Completed reps, load, set quality, RIR/RPE, pain status | Repeat range or reduce target; do not add load |
| Load-step progression | Increase external load by a small prescribed step after a successful exposure | Prior performance and stable technique | Hold current load; offer a smaller step if approved |
| RIR progression | Maintain load while target RIR decreases or increase load while target RIR is met | Reliable RIR report and execution trend | Keep load/target; recalibrate RIR |
| Volume progression | Add a set, interval, or weekly exposure | Recent volume tolerated; sRPE and recovery context acceptable | Hold volume or use minimum dose |
| Density progression | Same work with more efficient rest or shorter duration | Work quality remains acceptable and no excessive RPE | Preserve rest; do not chase time |
| Duration/distance progression | Extend an easy/steady exposure within a zone | Completed duration/pace and stable response | Repeat duration or shorten; no make-up debt |
| Intensity progression | Move pace, power, or zone target upward | Standardized test/execution and goal relevance | Keep intensity; reduce volume if intensity is protected |
| Skill/complexity progression | Move from supported/simple to less supported/complex variant | Technique, confidence, symptom-free execution | Keep variant or use an approved alternate |
| Tempo/range progression | Add pause, range, or controlled tempo | Quality and symptom response | Maintain current technical demand |
| Phase progression | Move from accumulation to intensification/realization/maintenance | Coach-defined phase completion and goal timing | Extend current phase or request review |
| Minimum-dose progression | Move from re-entry/maintenance dose toward normal dose | Consecutive successful low-dose sessions | Repeat minimum lane; do not repay missed work |
| Exposure progression | Increase sport-specific complexity, speed, or environmental demand | Prior base exposure and safety status | Retain controlled exposure |

#### 8.5 Automatic increase policy

For version one, automatic **increases** should be more constrained than automatic holds, reductions, or approved alternates:

- The coach defines the primitive, range, increment, prerequisites, and maximum weekly change.
- The athlete must have completed the relevant prior exposure; planned-but-missed work cannot count as evidence.
- The increase requires acceptable technical quality and no escalating pain or red-flag symptom.
- The increase should be based primarily on execution and task-specific feedback, not on HRV or a commercial readiness score.
- If data are missing or conflicting, the default is hold/proposal-only rather than inventing a more aggressive progression.
- If an increase crosses a protected anchor, competition window, medical restriction, or athlete preference, it becomes proposal-only.
- The receipt must show the rule, evidence, increment, and undo path.

### 9. Regression: preserve the goal while reducing the cheapest stressor

Regression is not failure. It is a controlled reduction in demand that preserves as much of the session's intent as possible.

#### 9.1 Regression hierarchy

When safety does not require stopping, reduce the smallest necessary dimension first. The right order depends on the goal, but a useful default is:

1. reduce complexity or choose an approved equivalent;
2. increase rest;
3. reduce density;
4. reduce repetitions or duration;
5. reduce sets/volume;
6. reduce external load or intensity;
7. switch to minimum-dose or recovery exposure;
8. stop and route to safety/professional review when symptoms require it.

The order should not be rigid when intensity is the protected goal. For example, a strength athlete may keep a moderate-heavy technical single and remove accessory volume, while an endurance athlete may keep easy duration but remove intervals.

#### 9.2 Named regression types

| Regression type | Use when | What it preserves | Return rule |
|---|---|---|---|
| Hold | Evidence is insufficient or the athlete is stable but not clearly progressing | Familiarity and consistency | Reassess on the next comparable exposure |
| Load reduction | Technique or effort is deteriorating but the movement is safe | Movement pattern and session intent | Restore only after target RIR/quality returns |
| Rep/time reduction | Per-set fatigue or breathing cost is high | Exercise and intensity character | Add reps/time after a successful repeat |
| Set/volume reduction | Accumulated fatigue, time pressure, or late-session decline | Key exposure and priority lift/interval | Restore volume after one or more successful sessions |
| Rest extension | Quality drops due to density rather than load | External work and skill | Keep longer rest until repeated quality is stable |
| Density reduction | Session is too compressed or sRPE is unexpectedly high | Total work if possible | Return to prior density gradually |
| Complexity regression | Technique or confidence is limiting safe expression | Relevant pattern or intent | Reintroduce complexity after clean, symptom-free execution |
| Range/tempo regression | Range or tempo triggers symptoms or overload | Pattern with lower local demand | Restore only under coach/professional policy |
| Approved alternate | Equipment, environment, pain-free variation, or athlete preference changes | Goal and stimulus category | Record equivalence and review outcome |
| Minimum lane | Illness recovery, travel, re-entry, severe time constraint, or repeated poor tolerance | Habit and minimum useful stimulus | Step back up using named re-entry progression |
| Deload | Repeated fatigue pattern, phase plan, or coach decision | Training continuity while reducing stress | End by date or evidence rule; never indefinite |
| Missed-session re-entry | One or more sessions missed | Current phase intent without debt | Resume from last successful exposure or a conservative bridge |
| Safety stop | Pain behavior, acute illness, red flag, or professional restriction | Safety, not training stimulus | Professional/coach review; no automatic return-to-play |

#### 9.3 Pain and illness are not ordinary readiness regressions

The app must not label pain as “low readiness” and then prescribe a generic 20% reduction. Pain requires location, onset, behavior, aggravating/easing factors, severity, neurological/systemic features, and the relevant professional policy. A mild general muscle soreness response may be handled inside a training rule; sharp, focal, progressive, or function-changing pain must follow the safety branch.

Similarly, an illness branch must distinguish mild non-systemic symptoms from fever, chest symptoms, severe systemic illness, dehydration, or other red flags. The app can offer “pause and seek guidance” language but must not act as a return-to-play clinician.

#### 9.4 Missed sessions and no make-up debt

The Coordinator should never punish a missed session by stacking it onto the next session. The re-entry algorithm should identify:

- the last successful exposure;
- the current phase goal;
- the number and reason of missed sessions;
- any illness, injury, travel, or life-stress context;
- the minimum useful next exposure; and
- the next checkpoint for stepping back up.

The default for a short gap is **resume or bridge**, not “catch up.” The app should show the athlete that the plan was changed intentionally and that no training debt was created.

### 10. Deloads: useful tool, not universal calendar law

Kellmann's recovery consensus supports individualized, multifaceted recovery rather than one fixed deload schedule. The direct resistance-training evidence remains limited and mixed.

**Bell et al. (2023), international Delphi.** Thirty-four coaches entered the first round and 21 completed the third. The consensus defined deloading as a period of reduced training stress designed to mitigate physiological and psychological fatigue, promote recovery, and enhance preparedness for subsequent training. This is expert consensus from strength and physique practice, not a randomized efficacy trial. [PubMed PMID 37730925; PMCID PMC10511399; DOI 10.1186/s40798-023-00633-0](https://pubmed.ncbi.nlm.nih.gov/37730925/).

**Rogerson et al. (2024), cross-sectional survey.** Among 246 competitive strength and physique athletes, typical reported deload duration was about 6.4 days and frequency about every 5.6 weeks, with energy/fatigue management, performance stalls, soreness, and joint aches among reasons. These are reported practices, not proof that this schedule is optimal or safe for all populations. [PubMed PMID 38499934; DOI 10.1186/s40798-024-00691-y](https://pubmed.ncbi.nlm.nih.gov/38499934/).

**Coleman et al. (2024), randomized study.** Thirty-nine resistance-trained young men and women were assigned to continuous training or a one-week complete break midway through a nine-week high-volume program. Hypertrophy, local endurance, and power were not appreciably different, but continuous training produced greater lower-body isometric and dynamic strength improvements. The study was short, lower-body focused, and had unsupervised upper-body training; it does not prove that all deloads harm strength. [PubMed PMID 38274324; PMCID PMC10809978; DOI 10.7717/peerj.16777](https://pubmed.ncbi.nlm.nih.gov/38274324/).

**Pancar et al. (2026), within-subject study.** Nineteen untrained young men completed an eight-week program in which one limb/condition used continuous training and the other used reduced weekly sets and frequency at midpoint/endpoint. The deload condition did not appear to hinder hypertrophy or strength-endurance. It used only two exercises, untrained young men, an eight-week period, and a within-subject design; it should not be generalized to trained athletes, maximal-strength blocks, or autoregulated deloads. [PubMed PMID 41730991; PMCID PMC13031491; DOI 10.1038/s41598-026-40612-5](https://pubmed.ncbi.nlm.nih.gov/41730991/).

**Deload implementation rules:**

- Support planned, reactive, and hybrid deload modes.
- Let the coach specify what reduces: sets, load, RIR, intensity, frequency, density, complexity, or exercise selection.
- Use the athlete's goal to choose the protected dimension.
- Do not schedule a deload solely because a wearable crossed a threshold.
- If an automatic deload is ever allowed, require persistence across multiple evidence layers and a named rule; otherwise make it a proposal.
- Make the deload finite, visible, reversible, and followed by a re-entry checkpoint.
- Record outcomes: performance, sRPE, wellness, adherence, motivation, and athlete preference.
- Do not claim that deloading prevents injury; present it as a way to manage training stress and preserve participation.

### 11. Deterministic Coordinator contract

The Coordinator should be deterministic in the sense that the same versioned inputs, policies, permissions, and missingness produce the same decision. Deterministic does not mean simplistic; it means inspectable and reproducible.

#### 11.1 Input layers

The Coordinator should read clearly separated layers:

1. **Plan intent:** goal, phase, session priority, protected anchor, prescribed target, permitted alternates, progression primitive, regression bounds.
2. **Resolution:** the current version of the plan after previous approved changes; historical plan versions remain immutable.
3. **Execution:** completed/missed/modified work, loads, reps, duration, technique flags, RPE/RIR, pain, notes, and device data.
4. **Readiness/context observations:** check-in items, sleep, HRV, RHR, HRR, recent load, stress, travel, illness, nutrition/hydration context, menstrual-cycle context when voluntarily provided, and equipment/time constraints.
5. **Data quality:** completeness, comparability, artifact status, stale status, device provenance, baseline confidence, and disagreement state.
6. **Safety policy:** pain/illness/red-flag rules, professional restrictions, age/population rules, and escalation requirements.
7. **Permissions:** coach authority, athlete preferences, Auto-Coached delegation scope, approval requirements, and protected plan elements.

#### 11.2 Evaluation order

The Coordinator's decision sequence should be:

| Order | Coordinator question | Possible output |
|---:|---|---|
| 1 | Is a safety or professional-review condition present? | Safety stop or review required |
| 2 | Is the planned task feasible with available equipment, time, and athlete consent? | Approved alternate, hold, or review |
| 3 | Is the direct task-specific response acceptable? | Continue, hold, or reduce within policy |
| 4 | Did prior execution earn a progression under the coach-authored primitive? | No change, progression proposal, or approved increase within bound |
| 5 | Do subjective state, recent load, or context warrant a bounded regression? | Hold, reduce, alternate, or recovery suggestion |
| 6 | Do physiological trends corroborate or qualify the above? | Confidence modifier or review prompt; rarely a sole action |
| 7 | Is the evidence sufficient and within delegated authority? | Apply, propose, or abstain |
| 8 | Can the result be explained and reversed? | Decision receipt required |

#### 11.3 Rule design requirements

Every Coordinator rule must include:

- a stable rule ID and human-readable name;
- the input fields it reads;
- allowed and disallowed data sources;
- a minimum data-quality condition;
- the target population, goal, exercise/session type, and phase scope;
- the action range and maximum change;
- precedence relative to other rules;
- what it does when a field is missing;
- what it does when signals disagree;
- an expiry or re-evaluation point;
- the required permission level;
- an explanation template; and
- an undo or rollback behavior.

No rule should say merely “if readiness is low, reduce the workout.” It should say which signal, which baseline, which context, which part of the session, by how much, under whose authority, for how long, and what evidence would restore the prior plan.

#### 11.4 Decision receipts

Every automatic or proposed change should produce a compact receipt:

| Receipt field | Example content |
|---|---|
| Decision | “Held load progression; repeated current target” |
| Trigger | “Last two comparable exposures missed the target RIR; today's check-in reports high fatigue” |
| Evidence | Links to the relevant execution records and observation timestamps |
| Data quality | “Execution high confidence; HRV unavailable; sleep estimate low confidence” |
| Rule | “STR-DOUBLE-PROG-003, v1.4” |
| Scope | “Bench press accessory only; today's main lift unchanged” |
| Permission | “Auto-Coached within coach-approved bound” |
| Alternative | “Coach can restore prior target or choose approved alternate” |
| Expiry | “Reassess after next successful comparable exposure” |
| Athlete action | “Log actual reps and post-session RPE” |
| Undo | “Restore prior target” |

Receipts should be readable by an athlete in one screen and inspectable by a coach in detail. The receipt is the trust mechanism: it turns adaptation into a visible, reversible event rather than unexplained churn.

#### 11.5 What Auto-Coached may and may not do

**Allowed within scope:**

- hold an increase;
- reduce a named exercise's sets/reps/load/density within a coach-defined bound;
- choose an approved alternate with preserved intent;
- suggest a recovery action;
- re-order non-protected accessories;
- create a proposal for coach approval; and
- record the reason and outcome.

**Not allowed in the default lane:**

- diagnose illness, overtraining, low energy availability, or injury;
- declare an athlete “ready” or “not ready” from a wearable score;
- automatically increase load outside the coach-defined rule;
- change a protected anchor, competition plan, medical restriction, or high-consequence session without approval;
- use ACWR as an injury-risk meter;
- hide a missing-data condition by filling it with a normal value;
- overwrite the historical plan;
- create training debt after a missed session; or
- keep modifying the plan repeatedly without an outcome checkpoint.

### 12. Check-in design: minimal surface, rich downstream meaning

The check-in should take roughly 30–60 seconds for a normal day, with optional depth when the answer warrants it. The screen should not look like a medical intake form or a sensor dashboard.

#### 12.1 Safety-first check-in flow

The first branch should identify whether the athlete has a reason to stop or seek guidance:

- “Any pain or injury concern that changes how you move today?”
- “Any illness, fever, chest/breathing symptom, dizziness, or unusual systemic symptom?”
- “Any professional restriction or return-to-training instruction active today?”

If yes or uncertain, ask only the minimum clarifying questions required by the safety policy and route appropriately. Do not bury the answer under sleep and HRV cards.

#### 12.2 Core daily items

For a non-safety day, ask only actionable items:

- sleep sufficiency: “Did you get enough sleep for you to feel able to train today?”;
- energy: low / typical / high, with optional note;
- general soreness and focal soreness separated;
- stress or mental load: low / typical / high;
- motivation or willingness to train;
- time/equipment/space constraints; and
- optional context: travel, heat, unusual work demand, alcohol, menstrual-cycle phase, or fueling/hydration concern if the athlete chooses to share.

Avoid asking the athlete to rate every construct on a 0–10 scale every day. Use anchored labels and allow “not sure” or “prefer not to answer.”

#### 12.3 Adaptive questions

The check-in should branch only when a response changes a possible action:

- high fatigue → ask whether it is physical, mental, sleep-related, or illness-related;
- focal soreness → ask location and whether it changes movement;
- poor sleep → ask whether the issue was short opportunity, awakenings, timing, or subjective quality;
- high stress → ask about time/attention constraints and whether a shorter session would help;
- low motivation with good physical state → offer a low-friction start or choice of approved session variant;
- repeated poor answers → prompt coach review, not a longer questionnaire.

#### 12.4 Post-session check-in

After the session, capture:

- completed as planned / modified / partial / stopped;
- global session RPE and duration;
- optional set or exercise RPE/RIR where the plan uses it;
- pain or symptom response;
- what caused the modification;
- whether the session felt easier/harder than prescribed;
- athlete confidence in the recorded data; and
- one optional free-text note.

This closes the loop from planned intent to actual execution and teaches the Coordinator which adaptations helped or harmed.

#### 12.5 Check-in UX rules

- Never punish low scores with a red “bad athlete” state.
- Never use a green state to pressure the athlete into extra work.
- Make “skip” and “unknown” explicit states.
- Show the consequence of an answer immediately when a change is made.
- Let the athlete correct imported sleep or load data.
- Keep the raw detail available but collapsed.
- Use a stable question order only for safety-critical items; adapt the rest to minimize burden.
- Surface patterns weekly, not anxiety-provoking minute-by-minute alerts.

### 13. The sophisticated-but-simple product architecture

The design goal is **deep model, shallow surface**. Sophistication should live in data provenance, rules, baselines, permissions, and receipts. The athlete should see one clear next action.

#### 13.1 Athlete surfaces

**Today**

- one primary card: “Today’s plan”;
- one small status line: “No safety flag / needs context / review needed”;
- one action: start check-in, start session, or review a proposed change;
- a “why” drawer with three evidence bullets at most;
- a collapsed “data quality” line when relevant.

**Check-in**

- one question per screen or a calm stacked form;
- safety first;
- large tap targets and plain anchored choices;
- no score theatrics;
- clear completion and edit affordance.

**Session**

- one current exercise/interval at a time;
- target, range, rest, technique cue, and approved alternate;
- optional RIR/RPE capture at the point of use;
- no hidden adaptation; if the Coordinator changes the prescription, show a small receipt.

**Adjustment receipt**

- “what changed” in one sentence;
- “why” in a few bullets;
- “what was not changed” to prevent anxiety;
- expiry and return rule;
- undo or ask-coach action.

**Trends**

- one signal per chart by default;
- individual baseline band, not population norm;
- clear missing/confounded segments;
- no spaghetti graph of HRV, sleep, load, mood, and readiness in one panel;
- tap to inspect raw observations, method, and quality.

#### 13.2 Coach surfaces

**Coach home / exceptions queue**

- review only items requiring attention: safety flags, repeated regressions, disagreement, stale baselines, unreviewed proposals, persistent high sRPE, and missed re-entry;
- sort by urgency, consequence, and confidence;
- do not rank athletes by a single recovery score.

**Week review**

- planned intent → Coordinator resolution → execution evidence → current pattern → coach decision;
- show a week ledger of what changed and why;
- distinguish athlete-entered, device-imported, coach-entered, and Coordinator-generated facts;
- offer “accept,” “edit,” “reject,” “ask athlete,” and “defer.”

**Pattern cards**

- “three hard sessions were rated harder than planned”;
- “sleep opportunity fell on travel days”;
- “progression held twice for the same lift”;
- “HRV data are sparse and should not be used”;
- “athlete repeatedly chooses the shorter approved variant.”

Each card should state the evidence window, confidence, and suggested next question—not just an alert.

#### 13.3 Visual language

- neutral background and restrained accent color;
- red reserved for safety, not low performance or low adherence;
- amber/blue/gray for uncertainty and context;
- “stable / changed / uncertain / review” labels instead of moralized good/bad;
- one primary action per screen;
- progressive disclosure: simple surface, deep drawer;
- consistent spacing and typography; no dense dashboard grids on the athlete home;
- accessible contrast, dynamic type, screen-reader labels, and non-color status cues;
- charts with direct labels and plain-language annotations;
- no animation that implies urgency for ordinary variability;
- allow a coach to switch between “athlete view” and “evidence view” without changing the underlying decision.

#### 13.4 The visual hierarchy of a decision

Every adaptation surface should answer in this order:

1. What do I do now?
2. What changed?
3. Why did it change?
4. How certain is that explanation?
5. What happens next?
6. Can I undo or ask someone?

If a screen cannot answer those six questions, it is not ready for automatic adaptation.

### 14. Data and auditability requirements

No implementation code is specified here; these are conceptual product objects that Claude should preserve in the implementation design.

#### 14.1 Core objects

| Object | Purpose | Minimum fields |
|---|---|---|
| Plan intent | What the coach prescribed and why | goal, phase, session, priority, targets, protected elements, progression primitive, permitted regressions |
| Plan resolution | What the Coordinator currently expects | version, resolved target, rule IDs, timestamp, authority, expiry |
| Execution record | What actually happened | planned target, actual work, completion state, duration, RPE/RIR, technique, pain, notes, reporter |
| Signal observation | A readiness/recovery/load measurement | metric, value, unit, method, source, timestamp, context, quality, comparability |
| Baseline | Athlete-specific reference | metric/method/device, window, center, variability, valid count, confidence, version |
| Context event | A plausible confounder or life demand | event type, start/end, source, athlete confirmation, privacy scope |
| Decision | Coordinator result | outcome state, trigger, evidence references, confidence, policy, authority |
| Receipt | Human-readable explanation | before, after, why, rule, scope, expiry, undo, user/coach action |
| Outcome | What happened after a decision | performance, RPE, wellness, adherence, symptom response, athlete feedback |
| Coach decision | Human acceptance or override | accepted/edited/rejected/deferred, reason, author, timestamp |

#### 14.2 Provenance rules

- Imported data must remain distinguishable from athlete-entered data.
- The app must store the raw observation before normalization.
- Derived values must point to source observations and the transformation/version that created them.
- Baseline recalculation must not rewrite historical decisions.
- Deleting a wearable source must not erase the athlete's manually recorded session history.
- The athlete should be able to correct an observation without losing the original provenance.
- Sensitive context, such as menstrual-cycle information, health symptoms, or mental-health-related notes, requires explicit privacy scope and should not appear in a coach dashboard by default unless shared.
- A model or rule change should create a new decision version, not silently alter the past.

### 15. Evaluation and quality assurance

The app should be tested on decision quality, trust, burden, and abstention—not only prediction accuracy.

#### 15.1 Golden scenarios

Create deterministic fixtures covering:

- high HRV / focal pain;
- low HRV / normal warm-up / normal check-in;
- normal HRV / severe fatigue / poor warm-up;
- good device sleep / athlete reports poor sleep;
- poor device sleep / athlete reports adequate sleep / good warm-up;
- missing wearable / complete check-in;
- missing check-in / normal wearable;
- stale baseline;
- device or method change;
- artifact-heavy HRV;
- heat/dehydration confounder;
- travel and time-zone shift;
- repeated high sRPE with stable external load;
- ACWR high but no symptoms;
- missed session after illness;
- safe approved alternate available;
- progression earned by execution but blocked by a protected anchor;
- coach override of a Coordinator proposal;
- athlete undoing a non-safety adjustment;
- repeated adaptation churn;
- a previous automatic change with no outcome data;
- a request that would require diagnosis or injury prediction.

The expected result for every fixture should state the output, reason, confidence, and whether the Coordinator abstains.

#### 15.2 Product metrics

Track:

- percentage of decisions with a complete receipt;
- automatic change acceptance, edit, rejection, and undo rates;
- false intervention rate: changes later judged unnecessary by athlete/coach;
- missed intervention rate: repeated poor execution or symptoms after no change;
- abstention rate and abstention reason distribution;
- percentage of decisions using missing or low-quality data;
- number of adaptation changes per athlete per week;
- adaptation churn and repeated reversal;
- check-in completion, skip, correction, and burden time;
- coach review time per athlete;
- athlete trust and perceived agency;
- re-entry success after missed sessions;
- progression sustainability over several exposures;
- injury/symptom escalation quality, not just raw injury counts; and
- subgroup performance across sex, age, sport, training status, device, accessibility needs, and health context.

#### 15.3 Predictive-model guardrails for the future

If a later version experiments with predictive models, require:

- prospective or temporally held-out evaluation;
- calibration plots and decision-curve analysis, not AUC alone;
- false positives and false negatives stated in user terms;
- subgroup calibration and missing-data robustness;
- a clear distinction between prediction and causal recommendation;
- a human-review threshold;
- a fallback deterministic policy when the model is uncertain; and
- no athlete-facing injury-risk output until external validation supports it.

Start new models in **shadow mode**. Let the system record what it would have suggested while the visible Coordinator follows the approved deterministic policy. Only promote a rule after the product team can inspect its false alarms, missed patterns, and user burden.

### 16. Comprehensive ranked recommendation list for Claude

#### Priority 0: non-negotiable foundations

1. Preserve the current coach/athlete authority model and make this appendix additive.
2. Keep safety, pain, illness, and professional restrictions above readiness optimization.
3. Do not create a universal readiness score or injury-risk score.
4. Give every signal a source, method, timestamp, quality, and comparability state.
5. Make missing data explicit; never impute “normal” for a missing check-in or wearable.
6. Maintain individual-relative, signal-specific, versioned baselines.
7. Use stable/changed/uncertain/review states rather than red/green moral judgments.
8. Separate pain from general soreness and separate both from wellness.
9. Use a short safety-first check-in with adaptive follow-up questions.
10. Store planned intent, resolved plan, execution, context, data quality, decision, and outcome as separate layers.
11. Require a decision receipt for every automatic or proposed change.
12. Preserve historical plan versions; never overwrite the original prescription.
13. Make Auto-Coached automatic increases approval-only in the first release unless a coach defines a narrow bound.
14. Permit bounded holds, reductions, and approved alternates within coach-authored rules.
15. Build explicit abstention states and explain why the Coordinator did not infer.
16. Use task-specific execution and athlete-reported experience before passive wearable metrics.
17. Treat ACWR as exploratory descriptive context only.
18. Never label an individual “high injury risk” from HRV, sleep, RHR, soreness, or ACWR.
19. Provide undo, expiry, and re-evaluation for every reversible adjustment.
20. Add shadow mode and golden scenario tests before widening delegation.

#### Priority 1: high-value product sophistication

21. Create a single Today card with one primary action and a collapsed evidence drawer.
22. Build the coach exceptions queue around decisions that need attention, not athlete rankings.
23. Add one-signal-at-a-time trend charts with individual baseline bands.
24. Distinguish “no data,” “stale,” “not comparable,” “confounded,” and “unstable.”
25. Use sRPE × duration as the durable cross-modality fallback load record.
26. Capture RPE/RIR as a range/estimate and learn athlete calibration over time.
27. Record standardization metadata for HRV and HRR tests.
28. Make wearable scores source-labelled and place raw/derived provenance in a drawer.
29. Offer sleep opportunity, fueling/hydration, stress down-regulation, and appropriately dosed training as first-line recovery actions.
30. Make recovery cards goal-aware: acute comfort versus long-term adaptation.
31. Add a conditional cold-water immersion warning after strength/hypertrophy work.
32. Add naps as optional, timed actions with sleep-inertia and nighttime-sleep caveats.
33. Add adaptive question branching so burden rises only when an answer may change the decision.
34. Show the athlete what was not changed, not only what changed.
35. Offer “short session,” “minimum dose,” “technique-only,” and approved alternate lanes.
36. Build no-debt missed-session re-entry.
37. Let each exercise use a named progression primitive: double progression, RIR, volume, density, time/distance, skill, or phase.
38. Let the coach define protected dimensions and maximum changes by goal/phase.
39. Build typed regressions with return rules, not a generic percentage reduction.
40. Add a pattern card for repeated planned-versus-actual divergence.

#### Priority 2: depth after the core is trusted

41. Add baseline-change review when device, measurement method, medication, schedule, or phase changes.
42. Add a “data quality education” drawer explaining why a metric was not used.
43. Add athlete-confirmed context events for travel, heat, stress, illness, and unusual workload.
44. Add a coach-defined local protocol for standardized submax HRR tests.
45. Add a recovery experiment feature with a predeclared hypothesis, intervention, and outcome check.
46. Add a library of evidence cards with population limitations and claim strength.
47. Add a rule simulator for coaches to preview how a policy handles conflict scenarios.
48. Add a version diff showing the prior plan, resolution, execution, and current proposal side by side.
49. Add a “why not” explanation when an athlete expects a progression but it is held.
50. Add an uncertainty budget: show how much of the decision is based on direct execution, self-report, passive data, or missing data.
51. Add device-specific validation metadata and vendor algorithm version where available.
52. Add prospective cohort evaluation before exposing any predictive injury output.
53. Add coach review of repeated pain, repeated regressions, or repeated reliance on passive recovery modalities.
54. Add accessibility and low-connectivity/offline handling so data quality is not confused with user failure.
55. Add exportable audit records for the coach and athlete.
56. Add privacy controls so sensitive health/context data are not broadly visible by default.
57. Add a weekly ritual that summarizes patterns without turning the week into a scorecard.
58. Add a “return to normal” checkpoint after each temporary regression or deload.
59. Add a calm notification policy: surface safety and decisions, not every metric fluctuation.
60. Add a research registry inside the product so each rule can link to its evidence, limitations, and local coach rationale.

### Counterpoints/Challenges

#### 1. Individual baselines can become a false sense of precision

A robust baseline is better than a population cutoff, but it is still a model of the athlete, not the athlete. Baselines can drift with training phase, age, illness, medication, menstrual cycle, lifestyle, device changes, and changing measurement behavior. The product must show baseline version and confidence and allow a “new normal” review rather than silently adapting forever.

#### 2. Subjective measures are valuable but not infallible

Subjective reports can be affected by mood, expectation, social pressure, or the desire to please a coach. Their value is not that they are perfectly objective; it is that they capture lived experience and often respond to stress that a sensor cannot see. Use them with respectful language, repeated patterns, and athlete agency.

#### 3. Objective measures are not automatically superior

HRV, RHR, sleep, HRR, GPS, and device scores look precise but can be noisy, proprietary, and context-sensitive. A decimal place is not the same as validity. The app should make quality visible and not allow a polished device number to overrule a direct symptom report.

#### 4. Reducing training can preserve participation but can also slow a goal

Regression is not free. The app should display the trade-off: “This protects today's quality and participation but may reduce the week's planned volume.” The athlete and coach should be able to choose a minimum-dose lane, a hold, or a proposal. A generic reduction can be as harmful to trust as a generic push.

#### 5. A conservative system can become too timid

If the Coordinator abstains on every disagreement, it becomes an expensive diary. Abstention should be targeted and actionable: request the missing data, use a standardized warm-up, propose a safe alternate, or route to a coach. Measure abstention quality, not just abstention frequency.

#### 6. Recovery-tool advice can become compulsive

More interventions are not necessarily more recovery. The product should offer one or two high-value actions, show when they are optional, and detect when the athlete is collecting tools instead of addressing sleep, fueling, load, stress, or symptoms.

#### 7. Injury prediction is especially vulnerable to false confidence

Injury definitions, exposure denominators, sport demands, reporting behavior, and causal direction vary. A system can appear accurate in a single team and fail in another. Keep injury-related outputs safety-oriented and review-oriented until there is strong prospective evidence and a clinically responsible workflow.

#### 8. Simplicity is not the same as hiding complexity

The interface should be simple because the system has done the work of organizing evidence, not because it has discarded nuance. The “why” drawer, data-quality state, rule ID, and receipt are the escape hatches for experts.

#### 9. The evidence is not evenly distributed

Many studies use young, healthy, male, trained participants; small samples; short interventions; endurance or team-sport cohorts; or controlled laboratory conditions. Women, older adults, youth, para-athletes, clinical populations, diverse sports, recreational users, and people with chronic disease are underrepresented. Every rule should carry population scope and should default to more human review when the athlete is outside the evidence population.

### Actionable Next Steps

1. Treat this appendix as the recovery/readiness/progression/regression research lane attached to the existing week-review handoff.
2. Freeze the non-negotiables: safety precedence, individual baselines, no universal cutoffs, source-labelled measurements, missing-data abstention, and receipts.
3. Define the smallest v1 check-in and post-session record before adding more wearable integrations.
4. Write a coach-facing policy template for each progression primitive and regression type.
5. Create the golden conflict fixtures before implementing any automatic adaptation.
6. Build the Today card, Check-in, Session, Receipt, and Coach Exceptions surfaces before building a large analytics dashboard.
7. Use sRPE and execution as the reliable fallback layer; add HRV/RHR/sleep only with provenance and quality states.
8. Keep ACWR hidden from automatic decisions; if included, show it only as descriptive coach research context.
9. Add deloads as configurable planned/reactive/hybrid policies, with a finite duration and return checkpoint.
10. Run all new rules in shadow mode; compare proposed action with athlete/coach judgment and actual outcome.
11. Audit false positives, false negatives, user burden, adaptation churn, and coach review time.
12. Add evidence citations and population limitations directly to the coach rule editor.
13. Review safety, privacy, and professional escalation with qualified sport/health professionals before releasing athlete-facing recovery or return-to-training claims.
14. Keep the primary athlete surface calm: one action, one explanation, one next checkpoint.

## Source register: recovery, readiness, load, wearables, and progression

### Subjective wellness and athlete monitoring

- Saw AE, Main LC, Gastin PB. “Monitoring the athlete training response: subjective self-reported measures trump commonly used objective measures: a systematic review.” **PMID 26423706; DOI 10.1136/bjsports-2015-094758.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/26423706/)
- Duignan C, et al. “Single-Item Self-Report Measures of Team-Sport Athlete Wellbeing and Their Relationship With Training Load: A Systematic Review.” **PMID 32991706; DOI 10.4085/1062-6050-0528.19.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/32991706/)
- Saw AE, Main LC, Gastin PB. “Monitoring athletes through self-report: factors influencing implementation.” **PMID 25729301; PMCID PMC4306765.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/25729301/) · [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC4306765/)
- Govus AD, et al. “Relationship Between Pretraining Subjective Wellness Measures, Player Load and Rating of Perceived Exertion Training Load in American College Football.” **PMID 28488913; DOI 10.1123/ijspp.2016-0714.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/28488913/)
- Flatt AA, et al. “Association between Subjective Indicators of Recovery Status and Heart Rate Variability among Division-1 Sprint-Swimmers.” **PMID 30208575; PMCID PMC6162498; DOI 10.3390/sports6030093.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/30208575/)

### HRV, RHR, HRR, and autonomic monitoring

- Bellenger CR, et al. “Monitoring Athletic Training Status Through Autonomic Heart Rate Regulation: A Systematic Review and Meta-Analysis.” **PMID 26888648; DOI 10.1007/s40279-016-0484-2.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/26888648/)
- Plews DJ, et al. “Training adaptation and heart rate variability in elite endurance athletes: opening the door to effective monitoring?” **PMID 23852425.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/23852425/)
- Manresa-Rocamora A, et al. “Heart Rate Variability-Guided Training for Enhancing Cardiac-Vagal Modulation, Aerobic Fitness, and Endurance Performance: A Methodological Systematic Review with Meta-Analysis.” **PMID 34639599; DOI 10.3390/ijerph181910299.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/34639599/)
- Vesterinen V, et al. “Individual Endurance Training Prescription with Heart Rate Variability.” **PMID 26909534; DOI 10.1249/MSS.0000000000000910.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/26909534/)
- Nuuttila OP, et al. “Effects of HRV-Guided vs. Predetermined Block Training on Performance, HRV and Serum Hormones.” **PMID 28950399; DOI 10.1055/s-0043-115122.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/28950399/)
- Marasingha-Arachchige SU, et al. “Factors that affect heart rate variability following acute resistance exercise: A systematic review and meta-analysis.” **PMID 33246163; PMCID PMC9189698; DOI 10.1016/j.jshs.2020.11.008.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/33246163/)
- Plews DJ, et al. “Comparison of Heart-Rate-Variability Recording With Smartphone Photoplethysmography, Polar H7 Chest Strap, and Electrocardiography.” **PMID 28290720; DOI 10.1123/ijspp.2016-0668.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/28290720/)
- Bourdillon N, et al. “Minimal Window Duration for Accurate HRV Recording in Athletes.” **PMID 28848382; PMCID PMC5554345; DOI 10.3389/fnins.2017.00456.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/28848382/)
- Bourdillon N, et al. “RMSSD Is More Sensitive to Artifacts Than Frequency-Domain HRV.” **PMID 35719238.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/35719238/)
- Davis-Wilson H, et al. “Effects of Missing Data on Heart Rate Variability Measured From a Smartwatch.” **PMID 39993288; PMCID PMC11894354; DOI 10.2196/53645.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/39993288/) · [Full text](https://formative.jmir.org/2025/1/e53645)
- Bosquet L, et al. “Is heart rate a convenient tool to monitor over-reaching? A systematic review of the literature.” **PMID 18308872; DOI 10.1136/bjsm.2007.042200.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/18308872/)
- Daanen HAM, et al. “A systematic review on heart-rate recovery to monitor changes in training status in athletes.” **PMID 22357753; DOI 10.1123/ijspp.7.3.251.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/22357753/)
- Le Meur Y, et al. “Assessing Overreaching With Heart-Rate Recovery: What Is the Minimal Exercise Intensity Required?” **PMID 27617566; DOI 10.1123/ijspp.2015-0675.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/27617566/)
- Bellenger CR, et al. “A systematic review on heart-rate recovery to monitor changes in training status in athletes” and autonomic monitoring literature. [PubMed review](https://pubmed.ncbi.nlm.nih.gov/22357753/)

### Sleep and wearables

- Fullagar HHK, et al. “Sleep and athletic performance: effects of sleep loss on exercise performance, and physiological and cognitive responses to exercise.” **PMID 25315456; DOI 10.1007/s40279-014-0260-0.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/25315456/)
- Walsh NP, et al. “Sleep and the athlete: narrative review and 2021 expert consensus recommendations.” **PMID 33144349; DOI 10.1136/bjsports-2020-102025.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/33144349/)
- Bonnar D, et al. “Sleep Interventions Designed to Improve Athletic Performance and Recovery: A Systematic Review.” **PMID 29352373; DOI 10.1007/s40279-017-0832-x.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/29352373/)
- Silva AC, et al. “Sleep extension in athletes: what we know so far—a systematic review.” **PMID 33352457; DOI 10.1016/j.sleep.2020.11.028.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/33352457/)
- Mah CD, et al. “The effects of sleep extension on the athletic performance of collegiate basketball players.” **PMID 21731144; PMCID PMC3119836; DOI 10.5665/SLEEP.1132.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/21731144/)
- Arnal PJ, et al. “Sleep Extension before Sleep Loss: Effects on Performance and Neuromuscular Function.” **PMID 27015382; DOI 10.1249/MSS.0000000000000925.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/27015382/)
- Chinoy ED, et al. “Performance of seven consumer sleep-tracking devices compared with polysomnography.” **PMID 33378539; PMCID PMC8120339; DOI 10.1093/sleep/zsaa291.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/33378539/)
- Miller DJ, et al. “A Validation of Six Wearable Devices for Estimating Sleep, Heart Rate and HRV in Healthy Adults.” **PMID 36016077; PMCID PMC9412437; DOI 10.3390/s22166317.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/36016077/)
- Lee YJ, et al. “Performance of consumer wrist-worn sleep tracking devices compared to polysomnography: a meta-analysis.” **PMID 39484805; PMCID PMC11874098; DOI 10.5664/jcsm.11460.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/39484805/)
- Dobrosielski DA, et al. “The Association Between Poor Sleep and the Incidence of Sport and Physical Training-Related Injuries in Adult Athletic Populations: A Systematic Review.” **PMID 33560506; DOI 10.1007/s40279-020-01416-3.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/33560506/)
- Miller DJ, et al. “A validation study of the WHOOP strap against polysomnography.” **PMID 32713257.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/32713257/)

### Training load, session-RPE, and ACWR

- Foster C, et al. “Monitoring Training Loads: The Past, Present, and Future.” **PMID 28253038; DOI 10.1123/ijspp.2016-0388.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/28253038/)
- Foster C. “Monitoring training in athletes with reference to overtraining syndrome.” **PMID 9662690; DOI 10.1097/00005768-199807000-00023.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/9662690/)
- Haddad M, et al. “Session-RPE Method for Training Load Monitoring: Validity, Ecological Usefulness, and Influencing Factors.” **PMID 29163016; DOI 10.3389/fnins.2017.00612.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/29163016/)
- Impellizzeri FM, et al. “Use of RPE-based training load in soccer.” **PMID 15179175; DOI 10.1249/01.MSS.0000128199.23901.2F.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/15179175/)
- Yang S, et al. “Research application of session-RPE in monitoring training load of elite endurance athletes.” **PMID 38846717; PMCID PMC11155691; DOI 10.3389/fnins.2024.1341972.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/38846717/)
- Bourdon PC, et al. “Monitoring Athlete Training Loads: Consensus Statement.” **PMID 28463642.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/28463642/)
- Borresen J, Lambert MI. “The quantification of training load, the training response and the effect on performance.” **PMID 19691366; DOI 10.2165/11317780-000000000-00000.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/19691366/)
- Griffin A, et al. “The Association Between the Acute:Chronic Workload Ratio and Injury: a Systematic Review.” **PMID 31691167; DOI 10.1007/s40279-019-01218-2.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/31691167/)
- Andrade R, et al. “Is the Acute:Chronic Workload Ratio (ACWR) Associated with Injury? A Systematic Review and Meta-Analysis.” **PMID 32572824.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/32572824/)
- Impellizzeri FM, et al. “Acute:Chronic Workload Ratio: Conceptual Issues and Fundamental Pitfalls.” **PMID 32502973; DOI 10.1123/ijspp.2019-0864.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/32502973/)
- Impellizzeri FM, et al. “What Role Do Chronic Workloads Play in the Acute to Chronic Workload Ratio? Time to Dismiss ACWR and Its Underlying Theory.” **PMID 33332011; DOI 10.1007/s40279-020-01378-6.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/33332011/)
- Soligard T, et al. “How much is too much? (Part 1) International Olympic Committee consensus statement on load in sport and risk of injury.” **PMID 27535989; DOI 10.1136/bjsports-2016-096581.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/27535989/)
- Passfield L, et al. “Validity of the Training-Load Concept.” **PMID 35247874; DOI 10.1123/ijspp.2021-0536.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/35247874/)

### Recovery methods

- Kellmann M, et al. “Recovery and Performance in Sport: Consensus Statement.” **PMID 29345524; DOI 10.1123/ijspp.2017-0759.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/29345524/)
- Dupuy O, et al. “An Evidence-Based Approach for Choosing Post-exercise Recovery Techniques to Reduce Markers of Muscle Damage, Soreness, Fatigue, and Inflammation: A Systematic Review With Meta-Analysis.” **PMID 29755363; PMCID PMC5932411; DOI 10.3389/fphys.2018.00403.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/29755363/) · [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC5932411/)
- Craven J, et al. “Impact of Cold-Water Immersion Compared with Passive Recovery Following a Single Bout of Strenuous Exercise on Athletic Performance and Physiological Restoration: A Systematic Review and Meta-Analysis.” **PMID 35157264.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/35157264/)
- Hyldahl RD, et al. “Combining cooling or heating applications with exercise training to enhance performance and muscle adaptations.” **PMID 32644914; DOI 10.1152/japplphysiol.00322.2020.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/32644914/)
- Roberts LA, et al. “Post-exercise cold water immersion attenuates acute anabolic signalling and long-term adaptations to strength training.” **PMID 26174323.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/26174323/)
- Laborde S, et al. “Influence of physical post-exercise recovery techniques on vagally-mediated heart rate variability: a systematic review and meta-analysis.” **PMID 37754676; DOI 10.1111/cpf.12855.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/37754676/)
- Lastella M, et al. “To Nap or Not to Nap? A Systematic Review Evaluating Napping Behavior in Athletes and the Impact on Various Measures of Athletic Performance.” **PMID 34194254; PMCID PMC8238550; DOI 10.2147/NSS.S315556.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/34194254/)

### Progression, autoregulation, periodization, deloading, and re-entry

- Greig L, et al. “Autoregulation in Resistance Training: Addressing the Inconsistencies.” **PMID 32813181; PMCID PMC7575491; DOI 10.1007/s40279-020-01330-8.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/32813181/)
- Grgic J, et al. “Effects of resistance training performed to repetition failure or non-failure on muscular strength and hypertrophy: A systematic review and meta-analysis.” **PMID 33497853; PMCID PMC9068575; DOI 10.1016/j.jshs.2021.01.007.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/33497853/)
- Jukic I, et al. “The Acute and Chronic Effects of Implementing Velocity Loss Thresholds During Resistance Training: A Systematic Review.” **PMID 36178597; PMCID PMC9807551; DOI 10.1007/s40279-022-01754-4.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/36178597/)
- Androulakis-Korakakis P, et al. “The Minimum Effective Training Dose Required to Increase 1RM Strength in Resistance-Trained Men: A Systematic Review and Meta-Analysis.” **PMID 31797219; DOI 10.1007/s40279-019-01236-0.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/31797219/)
- Schoenfeld BJ, et al. “Effects of Resistance Training Frequency on Measures of Muscle Hypertrophy: A Systematic Review and Meta-Analysis.” **PMID 27102172; DOI 10.1007/s40279-016-0543-8.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/27102172/)
- Moesgaard L, et al. “Effects of Periodization on Strength and Muscle Hypertrophy in Volume-Equated Resistance Training Programs: A Systematic Review and Meta-analysis.” **PMID 35044672; DOI 10.1007/s40279-021-01636-1.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/35044672/)
- Harries SK, et al. “Systematic review and meta-analysis of linear and undulating periodized resistance training programs on muscular strength.” **PMID 25268290; DOI 10.1519/JSC.0000000000000712.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/25268290/)
- Grgic J, et al. “Effects of linear and daily undulating periodized resistance training programs on measures of muscle hypertrophy: a systematic review and meta-analysis.” **PMID 28848690; PMCID PMC5571788; DOI 10.7717/peerj.3695.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/28848690/)
- Kraemer WJ, et al. “American College of Sports Medicine position stand. Progression models in resistance training for healthy adults.” **PMID 11828249; DOI 10.1097/00005768-200202000-00027.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/11828249/)
- Bell L, et al. “Integrating Deloading into Strength and Physique Sports Training Programmes: An International Delphi Consensus Approach.” **PMID 37730925; PMCID PMC10511399; DOI 10.1186/s40798-023-00633-0.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/37730925/)
- Rogerson D, et al. “Deloading Practices in Strength and Physique Sports: A Cross-sectional Survey.” **PMID 38499934; DOI 10.1186/s40798-024-00691-y.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/38499934/)
- Coleman M, et al. “Gaining more from doing less? The effects of a one-week deload period during supervised resistance training on muscular adaptations.” **PMID 38274324; PMCID PMC10809978; DOI 10.7717/peerj.16777.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/38274324/)
- Pancar Z, et al. “Effects of deload periods in resistance training on muscle hypertrophy and strength endurance in untrained young men using a randomized within-subject design.” **PMID 41730991; PMCID PMC13031491; DOI 10.1038/s41598-026-40612-5.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/41730991/) · [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC13031491/)
- Mujika I, Padilla S. “Detraining: loss of training-induced physiological and performance adaptations. Part I.” **PMID 10966148; DOI 10.2165/00007256-200030020-00002.** [PubMed](https://pubmed.ncbi.nlm.nih.gov/10966148/)

## Final handoff sentence

Build the recovery/readiness lane as a calm, inspectable decision system: treat HRV, RHR, HRR, sleep, subjective wellness, sRPE, and load as distinct, baseline-relative evidence with provenance; let safety and direct task response outrank passive scores; make progression and regression coach-authored, typed, bounded, reversible, and outcome-checked; use abstention when the data are missing, noisy, stale, confounded, or discordant; and keep the athlete-facing experience to one clear next action with a quiet explanation behind it.
