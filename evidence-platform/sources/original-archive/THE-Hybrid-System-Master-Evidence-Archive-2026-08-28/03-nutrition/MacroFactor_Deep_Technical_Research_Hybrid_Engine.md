# MacroFactor-like adaptive nutrition engine: technical and academic research

**For:** THE Hybrid Engine
**Research date:** 24 August 2026
**Scope:** energy-balance back-calculation, weight-trend filtering, missing-data handling, adaptive calorie targets, protein allocation, predictive modifiers, and weekly check-ins.

## Executive verdict

THE Hybrid Engine can safely reproduce the **architecture** of a MacroFactor-like system:

```text
raw intake + raw weight + activity + goal
        -> data-quality assessment
        -> smoothed weight state
        -> observed weight-change rate
        -> inferred expenditure
        -> goal calorie budget
        -> protein/fat/carbohydrate allocation
        -> weekly review and bounded update
```

It cannot honestly claim to reproduce MacroFactor exactly. MacroFactor has not published the V3 filter coefficients, update gains, outlier rules, confidence model, missing-nutrition estimator, or the exact mathematics of Step-Informed Updates and Predictive Goal Adjustment.

The safest product strategy is therefore:

1. ship a transparent, versioned empirical estimator;
2. keep the equations auditable in the event log;
3. use conservative update bounds;
4. validate with synthetic data and prospective user data;
5. only add predictive modifiers after measuring whether they improve forecasts rather than merely making the app feel responsive.

## 1. What MacroFactor publicly claims

MacroFactor describes its core expenditure principle as energy balance: if reported intake is stable and trend weight is stable, expenditure is approximately equal to intake; weight loss at that intake implies higher expenditure, and weight gain implies lower expenditure. Its V3 article says the algorithm makes predictions, compares them with observed outcomes, and updates the expenditure estimate from the residual. [MacroFactor V3 technical article](https://macrofactor.com/expenditure-v3/)

Publicly documented facts include:

- nutrition and weight are analysed together rather than relying only on a static TDEE calculator;
- weight trend is used instead of raw scale weight;
- missing weight observations may be filled by linear interpolation;
- recent observations receive greater emphasis in the trend;
- MacroFactor uses about 21 days of nutrition data for the expenditure calculation;
- partial logging is treated as dangerous because an artificially low intake value biases expenditure downward;
- a blank nutrition day is skipped rather than treated as zero intake;
- daily weighing is ideal, while once weekly is generally sufficient for expenditure updates;
- V3 is designed to be more stable under temporary water shifts and more tolerant of missing data;
- MacroFactor corrected an upward bias caused by asymmetric assumptions about the energy cost of weight gain versus loss;
- Step-Informed Updates are intended to accelerate updates when step trends improve confidence, not to assign a fixed calorie value to every step;
- Predictive Goal Adjustment temporarily changes expenditure estimates after a goal change;
- MacroFactor reports internal performance improvements for V3 and the modifiers, but these are vendor evaluations, not independent peer-reviewed validation.

Sources: [Weight Trend](https://help.macrofactorapp.com/dashboard/energy_insight/), [Partial Logging](https://help.macrofactorapp.com/en/articles/241-what-is-partial-logging), [nutrition logging frequency](https://help.macrofactorapp.com/en/articles/110-how-frequently-do-i-need-to-log-my-nutrition-for-the-expenditure-algorithm-and-weekly-coaching-updates), [weight logging frequency](https://help.macrofactorapp.com/en/articles/109-how-frequently-do-i-need-to-log-my-weight-for-the-expenditure-algorithm-and-weekly-coaching-updates), [Expenditure Modifiers](https://help.macrofactorapp.com/en/articles/274-expenditure-modifiers), [V3 release notes](https://macrofactor.com/version-3-1-0/).

### What remains proprietary

Do not present the following as known MacroFactor mathematics:

- exact trend-filter coefficients;
- exact duration and weighting of each historical window;
- exact treatment of interpolated versus observed weights;
- exact energy-density or body-composition partition function in V3;
- exact outlier rejection and menstrual-cycle handling;
- exact imputation model for missing nutrition data;
- exact confidence or data-quality score;
- exact damping, caps, and update gains;
- exact step-trend coefficient;
- exact goal-change modifier function;
- exact protein coefficient lookup for all combinations of goal, body composition, exercise, and preference.

## 2. Academic foundation: energy balance is dynamic, not a 3,500-kcal rule

### 2.1 Basic inference equation

For a time interval (t):

\[
E_{in,t} - E_{out,t} = \Delta E_{store,t}
\]

Therefore:

\[
\widehat{E}_{out,t} = E_{in,t} - \Delta E_{store,t}
\]

If body-energy storage is approximated from a trend-weight slope:

\[
\Delta E_{store,t} \approx \rho_{eff,t}\,\Delta W_{trend,t}
\]

where:

- (E_{in}) = reported or estimated energy intake;
- (E_{out}) = total daily energy expenditure;
- (W_{trend}) = filtered body mass;
- (ho_{eff}) = effective energy density of the tissue and fluid change.

Using a daily weight slope (b) in kg/day:

\[
\widehat{TDEE} = \overline{E_{in}} - \rho_{eff}b
\]

The sign is important:

- (b>0): inferred stored energy is positive, so TDEE is lower than intake;
- (b<0): inferred stored energy is negative, so TDEE is higher than intake;
- (b\approx0): TDEE converges toward average intake.

This is the correct conceptual basis for a MacroFactor-like estimator. The 3,500-kcal rule is only a rough heuristic and is not a good long-term dynamic model.

### 2.2 Windowed slope estimation

Do not calculate slope from two raw weigh-ins. Fit a weighted local line to the trend series over a window (W), preferably the same data context used for expenditure:

\[
\min_{a,b}\sum_{i\in W} w_i\left(T_i-a-b\tau_i\right)^2
\]

Then:

\[
rate_{kg/week}=7b
\]

Use (w_i) to encode:

- recency;
- observed versus interpolated weight;
- quality flags;
- uncertainty from the trend filter.

The closed-form weighted least-squares slope is:

\[
b=\frac{\sum_i w_i(\tau_i-\bar\tau_w)(T_i-\bar T_w)}{\sum_i w_i(\tau_i-\bar\tau_w)^2}
\]

This is more stable than an endpoint difference and makes the uncertainty measurable.

### 2.3 The academically richer Hall model

The NIH/NIDDK Body Weight Planner is based on a dynamic two-compartment model that tracks fat mass, lean mass, glycogen and fluid changes, thermic effect of food, adaptive thermogenesis, and physical activity. NIDDK publishes the model equations in the peer-reviewed supplementary appendix to Hall et al. [NIDDK research page](https://www.niddk.nih.gov/research-funding/at-niddk/labs-branches/laboratory-biological-modeling/integrative-physiology-section/research/body-weight-planner), [published model appendix](https://www.niddk.nih.gov/-/media/Files/Labs-Branches-Sections/laboratory-biological-modeling/integrative-physiology-section/Hall-Lancet-Web-Appendix_508.pdf), [Hall et al. 2011](https://pubmed.ncbi.nlm.nih.gov/21872751/).

The published model includes, in simplified form:

#### Glycogen dynamics

The published model includes a differential equation linking glycogen content to carbohydrate intake and baseline glycogen. I am deliberately not reproducing that equation from lossy text extraction here; if THE Hybrid Engine needs the full forward simulator, copy the formatted equation directly from the NIDDK appendix and implement it with unit tests against the published model. The verified physiological relationship is that glycogen is stored with approximately 2.7 g of water per gram of glycogen, so early diet changes can move scale weight without proportional tissue-energy change.

#### Energy partitioning

The Hall model uses fat mass (F), lean mass (L), glycogen (G), energy densities approximately:

\[
\rho_F\approx39.5\,MJ/kg,
\qquad
\rho_L\approx7.6\,MJ/kg
\]

and a nonlinear partitioning function based on the Forbes relationship. The NIDDK appendix describes the partitioning function as:

\[
p=\frac{C}{C+F}
\]

with (C=10.4\,kg\times\rho_L/\rho_F) in the published model.

#### Expenditure components

The full model represents expenditure as a function of body composition, physical activity, thermic effect of food, and adaptive thermogenesis. The appendix uses approximately 10% for the thermic effect of food and models adaptive thermogenesis with a coefficient and time constant. These values belong to the NIDDK forward model; they should not be silently inserted into the empirical MacroFactor-like estimator.

### Engineering decision

Use two separate engines:

1. **Empirical estimator:** learns TDEE from observed intake and trend-weight change. This is the MacroFactor-like coaching engine.
2. **Dynamic simulator:** uses the Hall-style model for scenario projections and goal-date simulations.

Do not use the complex forward simulator as the primary TDEE estimator unless the app has enough reliable body-composition and intake data to support its assumptions. Otherwise it creates false precision.

## 3. Weight-trend filtering

### 3.1 Why filtering is necessary

Daily scale weight contains transient variation from water, sodium, glycogen, gastrointestinal contents, inflammation, menstrual-cycle changes, and creatine. MacroFactor explicitly says the trend is a moving average that weights recent values more heavily and is used for expenditure and weekly-budget decisions. [MacroFactor Weight Trend](https://help.macrofactorapp.com/dashboard/energy_insight/)

### 3.2 Safe v1: robust exponentially weighted trend

On a daily time grid, first create an observation (x_t):

- use the raw weight when observed;
- linearly interpolate only between two known weigh-ins;
- do not extrapolate beyond the first or last observation;
- mark interpolated values separately.

Then use a robust EWMA:

\[
T_t=T_{t-1}+\alpha_t\,u_t(x_t-T_{t-1})
\]

where:

- (T_t) = trend weight;
- (\alpha_t) = smoothing gain;
- (u_t\in[0,1]) = outlier/quality weight.

Set:

\[
\alpha_t=\begin{cases}
\alpha_{obs}, & \text{observed weight}\\
\alpha_{interp}, & \text{interpolated weight}
\end{cases}
\qquad
\alpha_{interp}<\alpha_{obs}
\]

For the first release, expose the chosen half-life or alpha in configuration. Do not call it MacroFactor’s value.

An innovation-based robust weight can be:

\[
z_t=\frac{x_t-T_{t-1}}{\sigma_t+\epsilon}
\]

\[
u_t=\min\left(1,\frac{c}{|z_t|}\right)
\]

This downweights, rather than deletes, a large but possibly real observation.

### 3.3 Research-grade v2: local-linear state-space filter

A more principled model is:

\[
\begin{bmatrix}T_t\\v_t\end{bmatrix}
=
\begin{bmatrix}1&1\\0&1\end{bmatrix}
\begin{bmatrix}T_{t-1}\\v_{t-1}\end{bmatrix}
+\eta_t
\]

\[
x_t=\begin{bmatrix}1&0\end{bmatrix}
\begin{bmatrix}T_t\\v_t\end{bmatrix}
+\epsilon_t
\]

where (v_t) is the latent weight slope, (\eta_t) is process noise and (\epsilon_t) is measurement noise. With missing observations, run the prediction step but skip the measurement update. A Kalman filter can estimate and interpolate missing observations in state-space models; this is established time-series methodology. [Gómez & Maravall, 1994](https://doi.org/10.1080/01621459.1994.10476786)

### Recommendation

Ship robust EWMA first because it is easy to audit and test. Benchmark it against the local-linear Kalman filter on synthetic weight series and real anonymised logs. Select the filter based on forecast and stability metrics, not on which one looks visually smoother.

## 4. Missing-data handling

### 4.1 Nutrition and weight are not equally imputable

MacroFactor’s reasoning is sound: a missing weight between two nearby observations is constrained by the surrounding values, while missing food intake can vary by thousands of calories. MacroFactor therefore interpolates missing weights but warns that partial nutrition logging can bias expenditure. [Nutrition logging frequency](https://help.macrofactorapp.com/en/articles/110-how-frequently-do-i-need-to-log-my-nutrition-for-the-expenditure-algorithm-and-weekly-coaching-updates)

### 4.2 Required nutrition states

Store these as separate states:

```text
complete       full day logged or credible daily estimate
estimated      user supplied a deliberate total estimate
fasting        user explicitly confirms a zero-calorie day
partial        some intake logged but the day is known to be incomplete
blank          no nutrition data
imported       imported daily total with source metadata
suspect        automatically flagged for confirmation
```

Never treat `blank` as zero calories. Never silently treat `partial` as complete.

### 4.3 Detection of likely partial logging

The exact MacroFactor detector is not public. A transparent Hybrid rule can flag a day when all of the following are true:

1. intake is below a robust personal baseline;
2. the day is not explicitly fasting;
3. the day has fewer than the user’s normal number of meals or logging events;
4. the day is not explained by a deliberate logging break.

Example flag score:

\[
S_t=w_1\,\text{lowIntakeScore}
+w_2\,\text{lowMealCountScore}
+w_3\,\text{missingTimeCoverageScore}
\]

If (S_t) exceeds a threshold, ask the user:

- estimate the missing meal/day;
- mark the day partial and exclude it;
- confirm that it was genuinely a low-intake or fasting day.

MacroFactor publicly recommends estimating a missing meal when the user can get within roughly ±30%, otherwise deleting/blanking the day. Treat that ±30% figure as MacroFactor’s operational guidance, not as a universal scientific threshold. [Partial Logging](https://help.macrofactorapp.com/en/articles/241-what-is-partial-logging)

### 4.4 Update gates

For a safe first implementation:

- use a trailing 21-day estimation window;
- require at least 4 valid nutrition days in the most recent 7 days to update;
- require at least one observed weight in the most recent 7 days;
- require at least two usable weight observations spanning at least 3 days before calculating a new slope;
- hold the last estimate when the gate fails;
- preserve the raw data and reason for holding;
- resume without resetting the learned estimate when data quality returns.

This aligns with MacroFactor’s public V3 description that updates pause when more than three nutrition days are missing in a seven-day period, while the official help centre says one weigh-in per week is generally sufficient. [V3 article](https://macrofactor.com/expenditure-v3/), [weight logging frequency](https://help.macrofactorapp.com/en/articles/109-how-frequently-do-i-need-to-log-my-weight-for-the-expenditure-algorithm-and-weekly-coaching-updates)

### 4.5 Missing-data uncertainty

Do not simply omit missing data and report the same confidence as a complete period. Compute effective sample size:

\[
n_{eff}=\frac{(\sum_i w_i)^2}{\sum_i w_i^2}
\]

Use (n_{eff}), nutrition coverage, weight coverage, and slope uncertainty to set the update gain and confidence interval.

## 5. Inferred expenditure algorithm

### 5.1 Inputs

For each day (t):

```text
I_t             valid reported/estimated intake kcal
W_t             raw weight kg, if observed
T_t             filtered trend weight kg
q_t             data-quality weight
S_t             step/activity features, optional
G_t             current goal and target rate
```

### 5.2 Baseline estimate

Use a static estimate only as a prior. It may use Mifflin-St Jeor or the existing Hybrid onboarding equations, but the prior must carry uncertainty:

\[
E_0\sim\mathcal{N}(\mu_0,\sigma_0^2)
\]

The first observed expenditure estimate should be a blend, not an abrupt replacement:

\[
E_{prior,t}=\lambda_tE_{learned,t-1}+(1-\lambda_t)E_0
\]

where (\lambda_t) rises as valid evidence accumulates.

### 5.3 Empirical rolling estimate

Calculate a weighted average intake:

\[
\bar I_W=\frac{\sum_{i\in W}w_iI_i}{\sum_{i\in W}w_i}
\]

Estimate trend slope using weighted regression. Then:

\[
E_{raw,t}=\bar I_W-\rho_{eff}\,b_W
\]

If using kcal and kg:

\[
\rho_{eff}=7700\,kcal/kg
\]

is a simple symmetric v1 assumption. It is transparent but not physiologically exact. A configurable two-compartment approximation can use:

\[
\rho_{eff}=p_F\rho_F+(1-p_F)\rho_L
\]

where (p_F) is the estimated fraction of the mass change attributable to fat. Do not pretend that (p_F) is known from scale weight alone.

### 5.4 Expenditure update

Use a bounded update:

\[
E_t=E_{t-1}+\lambda_t\,\text{clip}(E_{raw,t}-E_{t-1},-\Delta_{max},+\Delta_{max})
\]

Suggested starting behaviour:

- low confidence: (\lambda_t) small or zero;
- normal confidence: moderate (\lambda_t);
- first 30 days: allow more responsiveness but retain a hard daily cap;
- after stable calibration: lower gain to reduce churn;
- after a confirmed activity or goal transition: temporarily increase gain, but only under a labelled modifier.

The exact coefficients must be chosen by backtesting. MacroFactor reports V3 as both more stable and more responsive than V2, but its coefficients are not public. [MacroFactor V3](https://macrofactor.com/expenditure-v3/)

### 5.5 Uncertainty estimate

At minimum report:

```text
estimate_kcal
lower_kcal
upper_kcal
confidence_level
valid_nutrition_days
observed_weight_days
trend_slope_kg_week
filter_version
energy_density_model
hold/update reason
```

The user should be able to see why the estimate changed.

## 6. Adaptive calorie targets

### 6.1 Goal-rate representation

Represent the goal as a signed target rate:

```text
loss:   negative kg/week
maint:  zero kg/week
gain:   positive kg/week
```

Let (r_g) be the target rate in kg/week. The simple energy-balance target is:

\[
C_{target}=E_t+\frac{\rho_{goal}r_g}{7}
\]

Examples:

- maintenance: (C_{target}=E_t);
- loss: target intake is below (E_t);
- gain: target intake is above (E_t).

The formula is a target-setting approximation. It should not be used as a claim that all gained or lost mass has the same energy density.

### 6.2 Controller using observed rate

Let (r_o) be the observed trend-weight rate. The rate error is:

\[
e_r=r_g-r_o
\]

A direct controller correction is:

\[
\Delta C_{rate}=K_r\frac{\rho_{eff}}{7}e_r
\]

where (K_r\) is a conservative controller gain, initially less than 1. Then:

\[
C_{new}=C_{old}+\text{clip}(\Delta C_{rate},-\Delta C_{week,max},+\Delta C_{week,max})
\]

In practice, the expenditure estimate plus the goal-rate formula already contains much of this correction. Avoid applying both full-strength or the system will oscillate.

### 6.3 Weekly budget

Maintain a weekly budget as the primary invariant:

\[
B_{week}=7C_{target}
\]

For daily distribution weights (d_1,...,d_7):

\[
C_d=B_{week}\frac{d_d}{\sum_{j=1}^{7}d_j}
\]

This supports higher-calorie training days without changing the weekly energy target. After rounding, correct the final day so that:

\[
\sum_{d=1}^{7}C_d=B_{week}
\]

### 6.4 Guardrails

Guardrails should be explicit and configurable:

- minimum calorie floor;
- maximum planned rate of loss/gain;
- maximum weekly target change;
- minimum fat floor;
- medical/special-population exclusions;
- manual hold;
- recovery or deload state;
- high fatigue or poor sleep state.

Do not hide a safety floor inside a mysterious adjustment.

## 7. Protein, fat and carbohydrate allocation

### 7.1 Evidence baseline

For resistance training, Morton et al.’s meta-analysis found no further average gain in fat-free mass beyond approximately 1.62 g/kg/day in the included training studies, although individual needs vary. [Morton et al.](https://pubmed.ncbi.nlm.nih.gov/28698222/)

The ISSN position stand gives a practical range of approximately 1.4–2.0 g/kg/day for exercising individuals and suggests approximately 20–40 g or 0.25 g/kg per feeding, distributed every 3–4 hours. [ISSN position stand](https://pubmed.ncbi.nlm.nih.gov/28642676/)

During aggressive energy restriction in lean, resistance-trained athletes, Helms et al. proposed approximately 2.3–3.1 g/kg FFM, but this is a review-based recommendation rather than a universal RCT-derived rule. [Helms et al.](https://pubmed.ncbi.nlm.nih.gov/24092765/)

MacroFactor publicly says its coached protein target scales with lean mass, goal, body-composition category, and exercise type. Its published 2025 table for lifters uses 1.75–3.5 g/kg FFM depending on goal and preference. [MacroFactor protein adjustment article](https://help.macrofactorapp.com/en/articles/222-how-does-macrofactor-make-adjustments-for-a-weight-gain-or-weight-loss-goal), [MacroFactor modifier article](https://macrofactor.com/expenditure-modifiers/)

### 7.2 Hybrid protein formula

Estimate lean mass:

\[
FFM=W(1-BF)
\]

If body fat is unavailable, use a broad category prior rather than false precision.

Set a protein coefficient (p_g) based on goal and training:

\[
P_g=\text{clip}(p_g\times FFM,P_{min},P_{max})
\]

Recommended policy:

```text
sedentary maintenance:  bodyweight-based lower range
resistance maintenance: moderate FFM coefficient
resistance gaining:     moderate-to-high coefficient
cutting with resistance: higher coefficient, increasing with leanness and deficit severity
```

Store (p_g) as a versioned policy table, not hard-coded scattered values.

### 7.3 Meal distribution

Provide a distribution suggestion rather than a compliance rule:

\[
P_{meal,target}=\frac{P_g}{n_{meals}}
\]

or use a 20–40 g / 0.25–0.4 g/kg practical band. Mamerow et al. found higher 24-hour muscle protein synthesis with an even distribution in a small acute crossover study, but a 16-week resistance-training weight-loss trial found no body-composition advantage for even versus skewed distribution when total protein was controlled. [Mamerow et al.](https://pubmed.ncbi.nlm.nih.gov/24477298/), [Leidy et al.](https://pubmed.ncbi.nlm.nih.gov/28903957/)

Therefore the app should optimize for total protein and adherence first, then suggest distribution as an optional performance refinement.

### 7.4 Fat and carbohydrate remainder

Calories supplied by protein:

\[
E_P=4P_g
\]

Choose a configurable fat floor (F_{min}), subject to professional review and special-population rules. Allocate remaining energy according to diet preference:

\[
E_R=C_{target}-4P_g-9F_{min}
\]

If (q_F) is the fraction of residual energy assigned to fat:

\[
F=F_{min}+\frac{q_FE_R}{9}
\]

\[
C=\frac{(1-q_F)E_R}{4}
\]

For a high-carb plan, lower (q_F); for a low-carb plan, raise (q_F); for balanced, use a middle value. If calories are too low to satisfy protein and fat floors, return a constraint warning rather than producing impossible macros.

## 8. Predictive modifiers

### 8.1 Step-Informed Updates

MacroFactor explicitly says this modifier does **not** directly assign calories to steps. It uses step trends to speed expenditure updates when activity data improves confidence. [MacroFactor release notes](https://macrofactor.com/version-5-5-0/), [modifier help](https://help.macrofactorapp.com/en/articles/274-expenditure-modifiers)

This is the safer design to reproduce:

1. calculate a robust recent step baseline;
2. calculate current step trend;
3. measure coverage and device reliability;
4. compare the direction of step change with the direction of the intake/weight residual;
5. increase the estimator gain only when the signals agree;
6. do not add (kcal/step) directly in v1.

Define:

\[
\Delta S=\text{medianSteps}_{7d}-\text{medianSteps}_{28d}
\]

and residual:

\[
R_E=E_{raw}-E_{learned}
\]

Then a transparent confidence boost could be:

\[
\lambda_{step}=\lambda_0\left[1+\gamma\,q_{step}\,\mathbb{1}(\operatorname{sign}(\Delta S)=\operatorname{sign}(R_E))\right]
\]

with a cap on (\lambda_{step}).

This avoids assuming that every extra step increases TDEE by a fixed amount. Step count can predict TEE in some samples, but the relationship depends on body size, cadence, sex, device coverage, and other activity; a DLW study found models using body weight, steps and cadence explained 79% of male and 65% of female TEE variance in its sample, not universal individual accuracy. [Tudor-Locke et al.](https://pubmed.ncbi.nlm.nih.gov/22963352/)

Physical activity can also be accompanied by compensation. Pontzer et al. reported evidence that total energy expenditure is constrained rather than rising linearly with activity across populations, while an exercise trial found compensation from increased energy intake. [Pontzer et al.](https://pubmed.ncbi.nlm.nih.gov/26832439/), [E-MECHANIC trial](https://ajcn.nutrition.org/article/S0002-9165%2822%2901223-0/fulltext)

### 8.2 Predictive Goal Adjustment

MacroFactor says the modifier temporarily raises expenditure when a user changes toward slower loss or faster gain, and lowers it when changing toward faster loss or slower gain. It reports an example of an additional approximately 6% expenditure adjustment over a couple of weeks, but the production function is not public. [MacroFactor modifier article](https://macrofactor.com/expenditure-modifiers/)

The same technical article publishes a useful initial-goal heuristic: multiply the initial expenditure estimate by approximately four times the intended weekly weight-change percentage, expressed as a signed fraction of body mass. In signed form:

```text
goal_prior_multiplier = 1 + 4 × intended_rate_fraction_per_week
```

Thus -1.0%/week implies about a 4% downward correction, +0.5%/week implies about a 2% upward correction, and changing from -1.0%/week to +0.5%/week creates an approximately 6% difference between priors. This is a creator-reported product heuristic, not an independently validated physiological constant. Exact caps, conditions, interaction with BMR adaptation, and time decay remain unpublished. [MacroFactor expenditure-modifier technical article](https://macrofactor.com/expenditure-modifiers/)

Do not hard-code “6%” as a scientific constant. Use a temporary, decaying, bounded prior:

\[
M_{goal}(t)=\operatorname{sign}(r_{new}-r_{old})
\cdot M_{max}
\cdot g(|r_{new}-r_{old}|)
\cdot (1-e^{-t/\tau_{rise}})
\cdot e^{-t/\tau_{decay}}
\]

\[
E_{prior,t}=E_{learned,t}+M_{goal}(t)
\]

where (g) maps the size of the goal change to a bounded modifier. Start with a small cap, for example 2–3% of learned expenditure, and compare it against a no-modifier control. Increase only if it improves out-of-sample weight-change prediction.

The modifier must expire or be absorbed by observed data. If the user changes the goal again, restart the event with a new audit record rather than stacking unbounded modifiers.

## 9. Weekly check-in algorithm

### 9.1 State machine

```text
READY
  -> COLLECT
  -> DIAGNOSE_DATA
  -> ASK_CONFIRMATIONS
  -> ESTIMATE
  -> PLAN_TARGETS
  -> PREVIEW_CHANGE
  -> ACCEPT / HOLD / EDIT
  -> PERSIST_AUDIT_EVENT
```

### 9.2 Diagnostic modules

Run modules only when relevant:

- partial-logging review;
- blank/fasting-day clarification;
- missing-weight prompt;
- unusual trend or outlier review;
- activity/step-change review;
- goal-change confirmation;
- target update preview;
- protein or macro-constraint warning.

The check-in should not ask questions that cannot change the calculation.

### 9.3 Update preview

Show:

```text
previous expenditure -> new expenditure
previous weekly budget -> new weekly budget
observed trend rate -> desired trend rate
protein change and reason
fat/carbohydrate changes and reason
confidence and data coverage
```

The user can accept, hold, or edit. Holding should freeze the prescription without destroying the learned expenditure state.

### 9.4 Audit event

Every update should persist:

```json
{
  "event": "nutrition_program_update",
  "algorithmVersion": "hybrid-exp-v1",
  "filterVersion": "robust-ewma-v1",
  "window": {"days": 21},
  "validNutritionDays": 16,
  "observedWeightDays": 12,
  "trendSlopeKgWeek": -0.42,
  "oldExpenditureKcal": 2680,
  "newExpenditureKcal": 2715,
  "goalRateKgWeek": -0.35,
  "weeklyBudgetKcal": 16555,
  "modifierEvents": [],
  "dataQuality": "updating",
  "userDecision": "accepted"
}
```

## 10. What is safe to implement now

### Ship in v1

- initial BMR/TDEE as a labelled prior;
- raw intake and weight storage separate from derived state;
- linear interpolation for internal missing weights only;
- robust EWMA trend;
- weighted regression trend slope;
- symmetric, versioned energy-density assumption;
- rolling empirical expenditure estimate;
- explicit complete/estimated/partial/blank/fasting states;
- update gates and holding state;
- weekly budget invariant;
- protein-first allocation;
- configurable fat/carbohydrate preference allocation;
- weekly check-in with confirmation and audit log;
- synthetic backtesting harness.

### Implement only behind a feature flag

- Kalman/local-linear state-space trend;
- model-based missing-intake estimates;
- step-informed gain changes;
- direct step-energy covariate;
- predictive goal modifier;
- menstrual-cycle-specific model;
- body-composition partition model from weight alone;
- wearable-derived calorie adjustments.

### Do not claim without validation

- “exactly reproduces MacroFactor”;
- “measures metabolism”;
- “knows calories burned from steps”;
- “predicts muscle gain from scale weight”;
- “corrects metabolic adaptation” as a measured physiological diagnosis;
- universal protein targets for every athlete;
- a fixed 6% predictive modifier as scientifically established.

## 11. Validation plan

### 11.1 Synthetic test generator

Generate ground-truth users with:

- stable TDEE;
- abrupt TDEE increase/decrease;
- gradual TDEE drift;
- weight-change phases;
- water-weight pulses;
- creatine-like step change;
- menstrual-like periodic fluid shifts;
- gain/loss reversals;
- missing weight days;
- missing nutrition days;
- partial logs;
- fasting days;
- step changes with and without compensation;
- goal changes that users follow and ignore.

### 11.2 Metrics

Measure:

1. TDEE MAE and RMSE when ground truth is known;
2. 7-day and 30-day weight-change prediction MAE;
3. bias during maintenance, cutting and gaining;
4. gain/loss symmetry bias;
5. time-to-detect after a real expenditure shift;
6. false-update rate when no shift occurred;
7. week-to-week calorie-target volatility;
8. missing-data degradation;
9. calibration of uncertainty intervals;
10. safety-floor violations;
11. subgroup performance by sex, body size, training status and activity level.

### 11.3 Prospective validation

For an app-level validation study:

- preregister the algorithm version;
- freeze parameters before evaluation;
- separate calibration and test periods;
- evaluate future predictions, not retrospective fit only;
- use adherence and data quality as covariates;
- compare no-modifier, step-informed, and goal-modifier arms;
- if possible, validate a subset against doubly labelled water or controlled intake/weight data.

Doubly labelled water is a field method for total energy expenditure and has been validated against intake/body-composition methods, but it is not a practical routine app input. [Schoeller & van Santen](https://journals.physiology.org/doi/10.1152/jappl.1982.53.4.955)

## 12. Recommended Hybrid Engine architecture

```text
Observation Store
  - food logs
  - weight logs
  - steps/activity
  - goals
  - user confirmations

Data Quality Service
  - complete/partial/blank/fasting
  - coverage and uncertainty

Trend Service
  - interpolation
  - robust filter
  - slope and confidence

Expenditure Service
  - initial prior
  - empirical back-calculation
  - bounded update
  - optional modifiers

Goal Service
  - target rate
  - weekly energy budget
  - daily distribution

Macro Service
  - protein policy
  - fat floor
  - carbohydrate/fat preference

Check-In Service
  - diagnostic modules
  - preview
  - accept/hold/edit
  - audit event

Simulation/Validation Service
  - synthetic data
  - backtesting
  - parameter reports
```

## Public-web gap-fill addendum

This addendum records the additional search across release notes, app-store history, GitHub, patents, podcasts, and reverse-engineering discussions.

### Recovered clues

- MacroFactor says V3 can infer intake on days without food logging. In its published test, the average relative error of those hidden intake predictions was about 13%, and more than 90% of errors were below 30%. The predictor’s input features and equation remain undisclosed.
- MacroFactor states that expenditure calculations use the last 21 days of nutrition data. A partial day can therefore influence the calculation for about three weeks. This is a lookback effect, not proof of a simple 21-day moving average.
- The partial-logging module flags days with energy totals considerably below the user’s recent norm and asks the user to confirm or exclude them. The exact production threshold is not public.
- V3’s public tissue explanation gives approximate energy densities of 4,282 kcal/lb for fat tissue and 824 kcal/lb for lean tissue. It says V1/V2 used asymmetric gain/loss assumptions and V3 corrected the resulting upward bias. The current interpolation between tissue types is not published.
- The official trend description supports a recent-weight-emphasised moving average. A Wits & Weights podcast transcript calls it a “20-day exponential moving average,” but that is a secondary speaker’s description, not an implementation disclosure. Confidence in “recent emphasis”: high. Confidence in “20-day EMA with conventional alpha”: low.
- A separate 2026 N=1 analysis of a long MacroFactor export labels the exported Trend Weight series “exponentially-smoothed.” This is consistent with an exponential-like output, but it does not recover an alpha or establish that V3 is a plain EMA. Confidence: low-to-medium for “exponential-like output”; low for the exact filter. See [The Silent Creep](https://nasser1931.com/paper).

### What release notes add

The October 2024 V3 release notes mention improved responsiveness, transient-weight stability, missing-data handling, and three days of consistent tracking to unpause. The November 2025 App Store entry says “Expenditure V3 optimized” and introduces the modifiers. Neither source publishes coefficients, gains, or equations. Later store notes are mostly product and bug-fix updates.

### What GitHub adds

Public repositories found in the search are export/import or integration projects rather than reimplementations:

- [vitals](https://github.com/jordangarrison/vitals) reads MacroFactor exports, including trend weight, TDEE, scale weight, and nutrition;
- [macrofactor-mcp](https://github.com/NasserAlbusaidi/macrofactor-mcp) requires manual exports and explicitly presents itself as an unofficial local decision engine;
- [sjawhar/macrofactor](https://github.com/sjawhar/macrofactor) exposes an unofficial backend client, but is archived and reports that Firebase App Check blocks third-party authentication.

No credible public V3 clone, coefficient dump, or reverse-engineered update controller was found. These projects are useful for export schemas and replay tooling only.

### Patent result

Searches for MacroFactor, Stronger By Science, Greg Nuckols, and combinations of trend weight, nutrition, adaptive calories, and expenditure on public Google Patents did not reveal a patent that identifies the V3 calculation. This is a negative search result rather than proof that no filing exists under another entity or in a non-public application.

### Remaining gaps

The exact trend filter, missing-intake model, tissue-composition function, update gain/cap schedule, flux-range construction, step modifier, predictive-goal modifier, and modifier interaction order remain proprietary or unrecoverable from public evidence. They should remain explicit feature flags and versioned approximations in THE Hybrid Engine rather than being presented as MacroFactor formulas.

### Official gap closure: activity, calibration, check-ins, floors, and updates

The following details were recovered from MacroFactor’s own article images, help centre, and release notes:

**Custom activity factors.** MacroFactor’s official correction-factor image documents general activity corrections of 1.2 (low), 1.4 (moderate), and 1.6 (high), plus exercise corrections of +0.0 for 0 sessions/week, +0.1 for 1–3, +0.2 for 4–6, and +0.3 for 7+. The worked example is `1938 × (1.4 + 0.1) = 2907 kcal/day`. The exact onboarding decision tree is still unknown. [Algorithms and Core Philosophy](https://macrofactor.com/macrofactors-algorithms-and-core-philosophy/)

**Calibration timeline.** MacroFactor says adaptive expenditure estimates begin updating on day 3; another official explanation says the initial estimate starts visibly moving after about a week. Its help centre describes 2–3 weeks to dial in a good estimate and 3–4 weeks before recommendations are fully informed by personal data. V3 release notes say three consistent tracking days are needed to unpause after inactivity. These are milestones, not a published confidence-state machine. [Algorithm accuracy](https://macrofactor.com/algorithm-accuracy/), [Algorithms and Core Philosophy](https://macrofactor.com/macrofactors-algorithms-and-core-philosophy/), [Expenditure interpretation](https://help.macrofactorapp.com/en/articles/26-how-should-i-interpret-changes-to-my-energy-expenditure), [V3 release notes](https://macrofactor.com/version-3-1-0/)

**Check-in availability and triggers.** Check-ins are weekly on a selected day for coached or collaborative programs. Official modules cover suspected partial logging, missing current-day weight, unlogged days that may be fasting, expenditure pauses, and program updates. Modules are curated, skippable, and dismissible; Fast Check-In bypasses them. The exact classifier and ranking logic are not public. [Check-ins and Coaching Modules](https://help.macrofactorapp.com/en/articles/247-introduction-to-check-ins-and-coaching-modules), [Weight logging](https://help.macrofactorapp.com/en/articles/109-how-frequently-do-i-need-to-log-my-weight-for-the-expenditure-algorithm-and-weekly-coaching-updates)

**Calorie floors.** Coached mode documents a standard 1,200 kcal/day floor, an individualised low floor based on minimum protein/fat/carbohydrate requirements, and an opt-out. The exact low-floor formula is not published. The separately documented fat lower-bound heuristic is `((height_cm − 150) × 0.5) + 30`, with 30 g/day for people under 150 cm. [Coached program options](https://help.macrofactorapp.com/en/articles/34-what-are-the-different-program-options-in-coached-mode), [Dietary fat](https://help.macrofactorapp.com/en/articles/78-how-much-dietary-fat-should-you-eat/)

**Program-update rules.** MacroFactor identifies expenditure changes, goal changes, and smoothing as the drivers of target updates. Goal-rate changes apply at the next check-in unless a new program is created first; a new program already reflects the changed goal. Creating a program or changing a goal does not reset expenditure history. Each forthcoming week is treated as self-contained, so there is no automatic catch-up. Exact update gains and caps remain unknown. [Weight gain/loss adjustments](https://help.macrofactorapp.com/en/articles/222-how-does-macrofactor-make-adjustments-for-a-weight-gain-or-weight-loss-goal), [Data reset](https://help.macrofactorapp.com/en/articles/204-does-my-data-reset-if-i-change-goals-or-create-a-new-program)

**Predictive-goal heuristic.** MacroFactor’s November 2025 technical article publishes an initial correction heuristic of approximately four times the intended weekly weight-change percentage, expressed as a signed fraction of body mass:

```text
goal_prior_multiplier = 1 + 4 × intended_rate_fraction_per_week
```

That implies roughly -4% for a -1.0%/week loss target and +2% for a +0.5%/week gain target; moving from -1.0%/week to +0.5%/week therefore produces an approximately 6% difference between priors. The exact caps, eligibility conditions, interaction with the BMR modifiers, and decay/update gains remain unpublished. Treat the heuristic as a versioned, bounded, creator-reported product rule—not a physiological constant. [Expenditure modifiers technical article](https://macrofactor.com/expenditure-modifiers/)

**Edge-case behavior.** Official guidance says an athlete may stop logging during illness and the expenditure estimate will hold the last calibrated state; after returning, about a week of consistent food and weight logging is expected before updates resume. V3’s release notes separately describe three consistent days to unpause after inactivity, so the Hybrid Engine should version these as context-specific recovery gates rather than force one universal number. V3 claims better tolerance for large menstrual-cycle weight shifts without requiring period tracking; period logging is currently described as personal reference. MacroFactor also says atypical water/scale days may be logged or skipped, and that day-to-day body-fat estimates are not used for program adjustments. [Sick-day guidance](https://help.macrofactorapp.com/en/articles/203-how-should-i-use-macrofactor-when-i-m-sick), [V3 release notes](https://macrofactor.com/version-3-1-0/), [Period tracking](https://help.macrofactorapp.com/en/articles/17-track-your-period), [Atypical weight logging](https://help.macrofactorapp.com/en/articles/209-should-i-still-log-my-weight-if-i-feel-like-i-m-bloated-constipated-or-retaining-water), [Body recomposition](https://help.macrofactorapp.com/en/articles/220-how-do-macrofactor-s-algorithms-respond-to-body-recomposition)

### Macro-allocation gap closure

Correct body-recomposition source URL: [MacroFactor body recomposition help](https://help.macrofactorapp.com/en/articles/220-how-do-macrofactors-algorithms-respond-to-body-recomposition).

**Non-lifter and endurance protein.** MacroFactor confirms the ordering `no structured exercise < aerobic/cardio only < resistance training`, but does not publish the current numeric lookup table for non-lifters or endurance-only users. Its public guidance gives approximately 1.2–1.8 g/kg/day for non-lifters and 1.2–2.2 g/kg/day for active people. Separately, a recent peer-reviewed endurance review suggests roughly 1.8 g/kg/day as a useful endurance-athlete target, with potentially higher needs during carbohydrate-restricted training or rest days. These are public guidance and research ranges, not recovered app coefficients. A defensible Hybrid policy is 1.2–1.6 g/kg for no structured exercise, 1.5–1.8 g/kg for endurance-only, 1.6–2.2 g/kg for resistance/hybrid, and an optional 2.3–3.1 g/kg FFM protection range for lean resistance-trained users in a cut. [Cardio experience](https://help.macrofactorapp.com/en/articles/59-change-your-cardio-experience), [Protein guidance](https://macrofactor.com/best-macro-tracker-app/), [Endurance protein review](https://pubmed.ncbi.nlm.nih.gov/40117058/), [Energy-restricted resistance-trained review](https://pubmed.ncbi.nlm.nih.gov/24092765/)

**Fat minimum.** MacroFactor publicly publishes the heuristic `fat_floor_g = max(30, 30 + 0.5 × (height_cm − 150))`; users under 150 cm use 30 g/day. Its coached plans preserve this lower bound when calories become very low, then reduce carbohydrate. The product also cites 20–35% of energy as a broad public-health range. Neither the absolute floor nor the standard 1,200 kcal floor should be represented as a universal physiological law. Australian NHMRC reference ranges are 20–35% fat, 45–65% carbohydrate and 15–25% protein for chronic-disease risk and micronutrient adequacy; athlete-specific guidance commonly treats <15% fat as a poor default because of essential-fat and fat-soluble-vitamin concerns. [Fat-floor help](https://help.macrofactorapp.com/en/articles/78-how-much-dietary-fat-should-you-eat), [Australian NHMRC ranges](https://www.eatforhealth.gov.au/nutrient-reference-values/chronic-disease/summary), [Sports-nutrition position paper](https://pubmed.ncbi.nlm.nih.gov/11128862/)

**Diet styles.** Coached MacroFactor plans allocate protein first and split remaining energy according to style: high-carb/low-fat prioritises carbohydrate; balanced splits remaining energy approximately evenly; low-carb/high-fat prioritises fat and typically keeps carbohydrate near 30% of energy or below an absolute ceiling around 200 g/day; keto treats carbohydrate as an upper limit generally around 50–60 g/day and assigns most remaining energy to fat. The product explicitly says fibre still counts toward dashboard carbohydrate, while net carbs are a separate view. [High-carb](https://help.macrofactorapp.com/en/articles/84-high-carb-and-low-fat-macro-program), [Balanced](https://help.macrofactorapp.com/en/articles/93-balanced-macro-program), [Low-carb](https://help.macrofactorapp.com/en/articles/94-low-carb-and-high-fat-macro-program), [Keto](https://help.macrofactorapp.com/en/articles/86-keto-macro-program), [Carbohydrate guidance](https://help.macrofactorapp.com/en/articles/76-how-many-carbohydrates-should-you-eat/)

**Body-fat category logic.** MacroFactor uses a rough profile-level estimate only to estimate lean mass for initial expenditure and to scale coached protein targets. It does not use day-to-day body-fat estimates for recommendations. A public example exposes adjacent category bands of 18–23%, 24–30% and 30–34%, but not the complete current table or all sex-specific boundaries. Store a category, representative fraction, source, confidence and version; do not pretend a smart scale gives a precise individual body-fat value. [Body-composition article](https://macrofactor.com/body-composition/), [Profile body-fat help](https://help.macrofactorapp.com/en/articles/58-change-your-body-fat-percentage)

**Activity/exercise classification.** MacroFactor’s published initial model is `BMR × (daily activity factor + exercise factor)`, with daily activity 1.2/1.4/1.6 for low/moderate/high and exercise additions +0/+0.1/+0.2/+0.3 for 0, 1–3, 4–6 and 7+ sessions/week. The missing part is the questionnaire decision tree: the public material does not define every borderline combination of job activity, session intensity, duration and frequency. [Algorithms and Core Philosophy](https://macrofactor.com/macrofactors-algorithms-and-core-philosophy/), [Counting macros](https://macrofactor.com/counting-macros/)

**Goal-rate and calorie floors.** MacroFactor expresses goal rate as percentage body mass per week. Public cutting guidance recommends starting around 0.25–1.0%/week, with 0.5–0.75%/week described as a moderate range; it recommends keeping the practical upper boundary below 2 lb/1 kg/week and notes that >1,000 kcal/day deficits are usually difficult to sustain. Public bulking recommendations vary with lifting experience: beginner 0.20/0.50/0.80/1.00%, intermediate 0.15/0.325/0.575/0.80%, experienced 0.10/0.15/0.35/0.60% per week across conservative through very-aggressive choices. The standard coached floor is 1,200 kcal/day; the low floor is individualized and its formula is not published; no-floor is an opt-out. For an athlete app, add an energy-availability risk screen rather than relying on one fixed floor: `EA = (intake − exercise expenditure) / FFM`. The IOC warns that a universal 30 kcal/kg FFM/day cutoff is not a reliable diagnostic threshold, particularly in men. [Cutting calculator](https://macrofactor.com/cutting-calculator/), [Bulking calculator](https://macrofactor.com/bulking-calculator/), [Coached options](https://help.macrofactorapp.com/en/articles/34-what-are-the-different-program-options-in-coached-mode), [IOC RED-S consensus](https://doi.org/10.1136/bjsports-2023-106994)

**Modifier defaults and export schema.** The current modifier help page calls Step-Informed Updates and Predictive Goal Adjustment optional and gives the `More` → `Expenditure` settings path, but neither it nor the 5.6.0 App Store note says whether the toggles default on or off. Keep the default state unknown unless the live UI is inspected for a specific account/version. The current export help names Quick Export fields as expenditure, weight trend, scale weight, calories, macros, and primary nutrition targets; Granular Export is selectable by dataset but its complete column schema is not published. The workout export page adds exercises, muscle groups, gym profiles, and the ability to include workout and nutrition data. Historical product notes mention nutrition targets, period, fasting, daily expenditure, body metrics, and more, but these should be treated as versioned additions rather than an exhaustive current schema. [Modifier help](https://help.macrofactorapp.com/en/articles/274-expenditure-modifiers), [App Store history](https://apps.apple.com/us/app/macrofactor-macro-tracker/id1553503471), [Export your data](https://help.macrofactorapp.com/en/articles/68-export-your-data), [Workouts export](https://help.macrofactorapp.com/en/articles/356-export-your-data), [September 2022 update](https://macrofactor.com/mm-september-2022/), [Privacy notice](https://macrofactor.com/privacy/)

**Low-carb evidence boundary.** Low-carb and ketogenic diets are viable preference options, not inherently superior fat-loss or muscle-building methods. The evidence is mixed for endurance outcomes and more concerning for repeated high-intensity work when glycogen availability is low. THE Hybrid Engine should warn when a user’s macro style conflicts with planned high-volume or high-intensity training, not silently override the user’s chosen style. [Endurance keto meta-analysis](https://pubmed.ncbi.nlm.nih.gov/34445057/), [Anaerobic performance meta-analysis](https://pubmed.ncbi.nlm.nih.gov/42197050/)

## Edge-case gap closure and primary physiology

This addendum contains the findings that were not explicit in the earlier sections. The first part is product evidence; the second part is independent human physiology. Neither should be used to claim that MacroFactor’s private V3 code has been recovered.

### A. Product facts recovered from official MacroFactor sources

#### A.1 Water, glycogen, creatine, and menstrual-cycle shifts

MacroFactor’s official V3 material names the edge cases it designed to reduce: salt/carb-related fluid retention, creatine initiation, ovulation or menses, carbohydrate reduction, a post-stall water “whoosh,” and the subsequent loss of water retained around ovulation or menses. V3 release notes say large temporary menstrual-cycle shifts should be handled better without requiring period tracking. The technique is intentionally undisclosed.

The help centre gives additional numerical examples:

| Situation | Officially described behavior |
|---|---|
| Several lb/kg higher or lower for 1–5 days | Expenditure may move, but the next recommendation may be only about 20–30 kcal/day from ideal. |
| Persistent water change from carb transition or creatine | Tested expenditure errors are generally `<10%` and resolve within about 2 weeks. |
| Worked example | A true 2,000 kcal/day expenditure may be estimated at 1,800–1,900 kcal/day for about 2 weeks after low-carb → high-carb or starting creatine. |
| User response | The user can skip a couple of check-ins and resume once the initial expenditure movement reverses. |

The 1–5 day and `<10%` figures are explanatory product examples, not published V3 caps or confidence limits. Implement them as acceptance-test expectations, not constants in the estimator.

Period tracking itself is not an expenditure input in the public help article. The nutrition app exposes `+ → Edit Day → Day Properties → Are you on your period?`, or Dashboard → Period → choose day → toggle. Visibility is under More → Data Visibility → Period Visibility. The current article describes the feature as personal reference and says cycle analytics were future intent. Store it as an optional context event, not a calorie correction.

Sources: [V3 article](https://macrofactor.com/expenditure-v3/), [V3 release notes](https://macrofactor.com/version-3-1-0/), [Interpreting expenditure changes](https://help.macrofactorapp.com/en/articles/26-how-should-i-interpret-changes-to-my-energy-expenditure), and [Period tracking](https://help.macrofactorapp.com/en/articles/17-track-your-period).

#### A.2 Body recomposition

MacroFactor says it does not use day-to-day body-composition estimates for program adjustments. Its numerical illustration uses approximately 1,800 kcal/kg for lean tissue and 9,400 kcal/kg for fat tissue:

- extreme illustration: +3.2 kg lean and −3.2 kg fat over 10 weeks gives an unobserved deficit of 2,432 kcal/week, or 347 kcal/day, about a 10% expenditure under-estimate;
- more typical illustration: +1 kg lean and −1 kg fat over 10 weeks gives about 108 kcal/day, about 3.5%.

The product’s conclusion is that the apparent expenditure error may be desirable for a maintenance/recomposition goal because the observed intake is the intake that actually maintains the athlete’s weight. The algorithm should not be “corrected” upward using a noisy day-to-day body-fat estimate.

Source: [Body recomposition](https://help.macrofactorapp.com/en/articles/220-how-do-macrofactors-algorithms-respond-to-body-recomposition).

#### A.3 Illness

Official behavior is user-controlled rather than an automatic illness detector:

1. stop logging if desired; expenditure enters holding and preserves the last calibrated/pre-illness target;
2. after return, the sick-day article says consistent food and weight logging for about a week will restart updates;
3. if sick-day data distorted the estimate, clear those food logs and return to the hold/recovery path;
4. after vomiting, either retain the last meal or delete it; do not fabricate an absorbed-calorie fraction;
5. if continuing to log, accept that the estimate may move temporarily and settle later.

The article also recommends at least maintenance calories or putting weight loss on hold, subject to medical advice. That is safety guidance, not a TDEE formula. A production engine should expose `illness_declared`, `illness_hold`, and `recovery_review`; it should not apply a universal fever multiplier.

Source: [Using MacroFactor when sick](https://help.macrofactorapp.com/en/articles/203-how-should-i-use-macrofactor-when-i-m-sick).

#### A.4 Logging breaks, partial logging, and fasting

**Logging breaks.** Extended missing data cause expenditure updates to pause. When tracking resumes, MacroFactor carries forward the last high-confidence expenditure estimate rather than restarting from the initial prior. V3 release notes say three consistent tracking days can unpause after inactivity, whereas the illness-specific article says about one week after illness. Treat those as separate public milestones with a `resumePolicyVersion`, not as one hidden universal threshold.

**Partial logging.** MacroFactor’s 21-day example is explicit: 3,000 kcal/day across 21 days with one day recorded as 1,500 produces a reported mean of about 2,929 and may lower the expenditure estimate by about 71 kcal/day. A 5,000-kcal day omitted from an otherwise 2,000-kcal/day three-week span produces an actual average near 2,140 versus a reported 2,000, with an estimated error around 140 kcal/day for about three weeks. Sporadic omission of large atypical meals is therefore materially different from a consistent, small daily omission.

The product’s correction choices are: deliberate total estimate using Edit Today/Quick Add; delete/blank the day when a total cannot be estimated within roughly ±30%; or mark a suspected partial day incomplete through the check-in module so it is ignored. The exact live classifier remains private.

**Fasting.** A confirmed fast means no calories were consumed for the whole calendar day and no foods or beverages were logged that day. The product counts it as 0 kcal. An unlogged, unmarked day is instead skipped. The help article specifically says that logging zero-calorie drinks or supplements means the day does not need the fasting property. The Fasting module asks the user to choose `mark as fasting` or `leave unlogged`.

Sources: [Partial logging](https://help.macrofactorapp.com/en/articles/241-what-is-partial-logging), [Unusual eating day](https://help.macrofactorapp.com/en/articles/221-if-you-have-an-unusual-day-of-eating-is-it-better-to-log-it-or-leave-the-day-blank), [Logging Break module](https://help.macrofactorapp.com/en/articles/251-coaching-module-logging-break), [Track a fasting day](https://help.macrofactorapp.com/en/articles/16-track-a-fasting-day), and [Fasting module](https://help.macrofactorapp.com/en/articles/250-coaching-module-fasting).

#### A.5 Confidence, states, and UI

MacroFactor’s public model is an operational state machine, not a disclosed statistical confidence model:

```text
updating  -- insufficient data --> holding/paused
holding   -- data gate restored --> updating
paused    -- V3 chart state --> square marker; estimate is held
```

The help centre describes `holding` and `updating`; V3 help describes `paused` as insufficient data with a reversion to holding, and says paused chart points use a square marker rather than a circular marker. `Flux range` is explicitly for curiosity and is not technically a confidence interval or a direct error probability.

The update behavior is also described in stages: tentative movement during the first week of a suspected change, larger movement if it persists into the second and third week; early calibration overshoots/undershoots are generally described as 50–150 kcal and smoothing is expected after 3–4 weeks. An apparent 500-kcal change in expenditure may lead to a 200–300-kcal program change because target updates have an additional smoothing layer. None of those examples discloses the live gain/cap formula.

Sources: [Expenditure Version](https://help.macrofactorapp.com/en/articles/74-expenditure-version), [Interpreting expenditure changes](https://help.macrofactorapp.com/en/articles/26-how-should-i-interpret-changes-to-my-energy-expenditure), and [New program smoothing](https://help.macrofactorapp.com/en/articles/205-why-does-my-new-program-have-slightly-different-calorie-and-macronutrient-targets-than-my-old-program-even-though-i-didn-t-change-my-goal).

### B. Primary human physiology evidence

These studies justify robust state handling and event annotations. They do not reveal MacroFactor’s coefficients.

#### B.1 Glycogen and water

- Nine trained subjects showed at least roughly 3 g of water stored per gram of glycogen during recovery from glycogen-depleting exercise; higher ratios were possible when extra water was supplied. [Primary study](https://pubmed.ncbi.nlm.nih.gov/25911631/)
- In eight subjects, 72 hours of high-carbohydrate refeeding increased total body water from about 39.3 to 40.2 kg and increased intracellular water in the legs. [Primary study](https://pubmed.ncbi.nlm.nih.gov/27231310/)

This is why a carb transition should be represented as a transient weight-context event. It is not a basis for a universal `grams of carbohydrate × calories` expenditure adjustment.

#### B.2 Creatine

- In 32 resistance-trained adults, a 25 g/day, 7-day loading protocol followed by 5 g/day for 21 days increased body mass and total body water without altering fluid distribution. [Primary study](https://pubmed.ncbi.nlm.nih.gov/12937471/)
- One week of creatine increased total body water and DXA/BIA-derived fat-free mass estimates in a 27-person study, showing how water can look like short-term lean-mass gain to common body-composition instruments. [Primary study](https://pubmed.ncbi.nlm.nih.gov/37675500/)

#### B.3 Menstrual cycle

In 42 women measured twice per week, body weight was about 0.450 kg higher during menstruation than in the first cycle week, associated with about 0.474 kg more extracellular water. This is a sample mean, not a correction factor for every athlete. [Primary study](https://pubmed.ncbi.nlm.nih.gov/37395124/)

#### B.4 Recomposition

Hall’s model uses 39.5 MJ/kg for fat-energy change and 7.6 MJ/kg for lean-mass change. In a 10-week Army basic-training cohort, women had little/no average body-mass change while gaining about 2.7 kg of DXA lean mass; men lost about 1.7 kg body mass while gaining about 1.7 kg lean mass. This demonstrates why weight-only inference can miss recomposition, but DXA fat-free mass is not identical to contractile muscle. [Hall model](https://pubmed.ncbi.nlm.nih.gov/17848938/), [Army training study](https://pubmed.ncbi.nlm.nih.gov/33414487/)

#### B.5 Illness

In 25 young men with naturally acquired respiratory infections, resting metabolic rate was about 8% higher during illness, with a subset averaging more than 14% higher. This is resting metabolism, not a validated total daily expenditure multiplier. [Primary study](https://pubmed.ncbi.nlm.nih.gov/20309883/)

In a controlled typhoid-vaccine experiment, metabolic rate peaked about 16% above baseline for 6–8 hours. It shows that immune activation can alter metabolism, but it is not a model for every infection. [Primary study](https://doi.org/10.1152/jappl.1992.72.6.2322)

#### B.6 Fasting

A small randomized trial in lean adults compared alternate-day 24-hour fasting with matched continuous restriction and an energy-balanced fasting pattern. Over three weeks, the fasting/restricted group lost about 1.60 kg, the matched continuous group about 1.91 kg, and the energy-balanced fasting group did not significantly reduce body mass. This supports encoding a confirmed fast as a 0-kcal intake state, not as an automatic metabolic bonus or penalty. [Primary randomized trial](https://pubmed.ncbi.nlm.nih.gov/34135111/)

#### B.7 Uncertainty

Hall’s dynamic model notes that individual baseline energy requirements cannot be known with perfect precision; even about 5% initial expenditure uncertainty can materially widen projected weight trajectories. This supports displaying estimator freshness, data coverage, and state reason codes instead of presenting an uncalibrated percentage confidence score. [Primary model paper](https://pubmed.ncbi.nlm.nih.gov/21872751/)

### B.8 Deep PubMed/NCBI confounder review for the weight-trend controller

This is a targeted PubMed/NCBI review checked on 24 August 2026. It prioritizes human primary studies and systematic reviews, but it is not a registered systematic review. The engineering question is not “what is the one true water correction?” It is: which observations are plausibly non-tissue scale noise, which contexts can invalidate the normal controller, and which inferences are not identifiable from a food log plus scale weight.

#### B.8.1 Evidence ledger

| Confounder | Human quantitative anchor | Main limitation | Hybrid action |
|---|---|---|---|
| Glycogen/water | 9 trained subjects: at least ~3 g water per g recovered glycogen; 8 subjects: 72 h carb loading increased TBW ~0.9 kg | Small, acute, trained samples; muscle/TBW results are not a universal scale equation | Annotate carb/depletion/refeed; down-weight abrupt residuals for ~1–3 days; never turn the scale jump into kcal |
| Creatine | 27 people: one week of 0.3 g/kg/day raised TBW ~2% and FFM estimates by 1.1 kg DXA, 1.2 kg SF-BIA, 1.9 kg MF-BIA | Short loading study; FFM is water-sensitive; response varies | Annotate start/loading/stop; hold or reduce gain ~1–3 weeks; do not infer muscle or TDEE change |
| Sodium | 12 men: extreme low-to-high salt transition raised weight 2.5 kg; 32 men: high salt raised plasma volume but not TBW or mass | Extreme, short, male-only and context-dependent; contradictory compartments | Context flag only; down-weight 1–3 days; no sodium-to-kg formula |
| Menstrual phase | 42 women: menstruation +0.450 kg weight and +0.474 kg ECW; newer athlete study found no phase effect on RMR/DXA | One-cycle/BIA studies, phase/contraception heterogeneity and large individual variability | Consent-based phase annotation; same-cycle-day comparisons; no universal correction or automatic calories |
| Illness/inflammation | 25 men with mild infection: RMR ~8% higher; typhoid vaccine: metabolic rate peak +16% for 6–8 h | RMR is not TDEE; small male-only or experimental immune activation | Preserve last calibrated estimate; hold through illness/recovery; safety hold for fever/dehydration; no fever multiplier |
| Fasting/refeeding | Matched 3-week trial: 0:150 fasting −1.60 kg vs matched daily restriction −1.91 kg; 7-day water fast −5.7 ± 0.8 kg in 12 | Protocols and hydration/body-composition methods are heterogeneous; blank log ≠ fast | Separate confirmed fast from missing data; prolonged fast/re-feed state holds normal controller |
| GI contents/stool | Healthy adults produce ~106–141 g stool/day on average, with broad ranges; bowel prep caused median −1.2 kg | Stool is not total gut content; meal mass and transit are under-measured | Annotate constipation/diarrhea/meal timing; down-weight 1–3 days; hard hold acute GI loss/bowel prep |
| Recomposition | 1,644 Army trainees: women ~0 kg body-mass change with +2.7 kg DXA lean mass; Longland RCT showed fat loss plus LBM gain | DXA FFM includes water; cohorts and protocols are not general; scale cannot partition tissue | Keep TDEE on long horizon; use multi-signal “possible recomp”; never equate FFM to contractile muscle |

The quantitative anchors are reason codes for cautious filtering, not correction constants. A high-carbohydrate meal can coincide with more sodium, fluid, food mass and changed exercise. Subtracting a glycogen correction and a sodium correction independently would double-count correlated response components.

#### B.8.2 Glycogen/water and carbohydrate transitions

Fernández-Elías et al. observed a 44% muscle-glycogen reduction after heat exercise/dehydration in nine trained subjects and at least a 1:3 glycogen-to-water recovery ratio; full rehydration produced 1:17 because much of the water was not glycogen-bound. [PMID 25911631; DOI 10.1007/s00421-015-3175-z](https://pubmed.ncbi.nlm.nih.gov/25911631/)

Shiose et al. then measured an increase in muscle glycogen from 72.7 ± 10.0 to 169.4 ± 55.9 mmol/kg wet weight and TBW from 39.3 ± 3.2 to 40.2 ± 3.0 kg after 72 hours at 12 g/kg/day carbohydrate. [PMID 27231310; DOI 10.1152/japplphysiol.00126.2016](https://pubmed.ncbi.nlm.nih.gov/27231310/) Bussau et al. showed that 10 g/kg/day raised glycogen from 95 ± 5 to 180 ± 15 mmol/kg wet mass in one day in trained men. [PMID 12111292; DOI 10.1007/s00421-002-0621-5](https://pubmed.ncbi.nlm.nih.gov/12111292/)

The app should therefore model a carb transition as a temporary observation-quality state, not as an energy-expenditure shock. A useful state variable is `water_shift_likelihood`, initially raised by a user-confirmed or high-confidence carb/depletion event and decayed with time and stable weigh-ins. It should modulate the observation variance or update gain, not directly alter the latent expenditure estimate.

Do not implement `water_kg = 3 * glycogen_kg` as a user-facing correction. The studies measure muscle glycogen and total body water under controlled protocols, not the exact change in next-morning body weight. A narrative review also concludes that methods and findings are heterogeneous. [PMID 36615811; DOI 10.3390/nu15010155](https://pubmed.ncbi.nlm.nih.gov/36615811/)

#### B.8.3 Creatine and body-composition instrumentation

Powers et al. used dilution methods in 32 resistance-training volunteers and found increased body mass and TBW after 25 g/day for 7 days followed by 5 g/day for 21 days, without altered fluid distribution. [PMID 12937471; PMC155510](https://pubmed.ncbi.nlm.nih.gov/12937471/)

Buck et al. randomized 27 young adults to one week of 0.3 g/kg/day creatine or maltodextrin. FFM increased by 1.2 kg with SF-BIA, 1.9 kg with MF-BIA and 1.1 kg with DXA in the creatine group; TBW rose from 40.4 ± 9.5 to 41.2 ± 9.6 kg. [PMID 37675500; DOI 10.23736/S0022-4707.23.15058-4](https://pubmed.ncbi.nlm.nih.gov/37675500/)

This is a direct warning for a Hybrid body-composition subsystem: a water-sensitive device can report a large FFM change even when the causal event is creatine-associated water. The event log should hold the device interpretation, not overwrite the raw scan. Store `measurement_context.creatine_active = true` and surface “compare after stabilization” rather than recalculating tissue mass.

#### B.8.4 Sodium is a context-sensitive fluid signal, not a scale equation

Rorije et al. reported a 2.5 kg increase after eight days moving from <50 to >200 mmol/day sodium in 12 men. [PMID 29206647; DOI 10.1097/ALN.0000000000001989](https://pubmed.ncbi.nlm.nih.gov/29206647/) Visser et al. found a mean 1.2 ± 1.8 L ECFV increase in 78 men over a similar low-to-high transition, with response correlated to BMI. [PMID 19282825; DOI 10.1038/oby.2009.61](https://pubmed.ncbi.nlm.nih.gov/19282825/)

But Heer et al. found that in 32 men, sodium up to 550 mEq/day increased plasma volume by 315 ± 37 mL without increasing TBW or body mass. [PMID 10751219; DOI 10.1152/ajprenal.2000.278.4.F585](https://pubmed.ncbi.nlm.nih.gov/10751219/) These results do not cancel one another: they show that baseline sodium status, fluid intake, renal handling and the fluid compartment being measured change the observed response. Long-duration sodium-balance work further shows that sodium can be stored without a parallel scale signal. [PMID 23312287; DOI 10.1016/j.cmet.2012.11.013](https://pubmed.ncbi.nlm.nih.gov/23312287/)

Implementation consequence: `high_sodium_meal` can raise observation variance for 24–72 hours, but it must not create `estimated_water_kg` or `estimated_kcal`. If a user enters sodium grams, preserve them for nutrition reporting and safety rules; do not feed them directly into the TDEE update equation.

#### B.8.5 Menstrual phase: filter by personal recurrence, not population mean

Kanellakis et al. found +0.450 kg body weight and +0.474 kg ECW during menstruation in 42 women measured twice per week. [PMID 37395124; DOI 10.1002/ajhb.23951](https://pubmed.ncbi.nlm.nih.gov/37395124/) Gould et al. found early-versus-mid-follicular differences of +0.56 ± 0.80 kg body mass and +0.27 ± 0.51 L extracellular fluid in 19 women, but no significant RMR difference (6.0 ± 190.93 kcal/day). [PMID 34280938; DOI 10.1249/MSS.0000000000002702](https://pubmed.ncbi.nlm.nih.gov/34280938/)

The metabolic literature is mixed. A 2020 meta-analysis found a small pooled luteal-phase RMR effect, but the post-2000 subgroup was not statistically significant. [PMID 32658929](https://pubmed.ncbi.nlm.nih.gov/32658929/) A 2026 review of seven newer studies estimates a small 3–5% range with substantial overlap with ordinary measurement noise. [PMID 41971666; DOI 10.3389/fphys.2026.1778735](https://pubmed.ncbi.nlm.nih.gov/41971666/) The 2024 phase-confirmed Australian athlete study found no significant cycle-phase effect on RMR or DXA body composition. [PMID 38653456; DOI 10.1123/ijsnem.2023-0193](https://pubmed.ncbi.nlm.nih.gov/38653456/)

The controller should use cycle data as a repeated-measures covariate only after enough within-person cycles exist. A safe initial policy is:

1. store cycle day/phase separately from weight and intake;
2. compare cycle day to the user's own prior cycles when possible;
3. increase observation variance around a logged period or symptom event;
4. do not subtract a population mean or automatically alter TDEE;
5. allow appetite/intake changes to be learned from logged data instead of presuming a 168 kcal/day luteal adjustment.

The 2025 energy-intake meta-analysis found a crude average luteal-versus-follicular difference of 168 kcal/day across 15 datasets and 330 women, but phase and intake-method inconsistencies limit use as a controller constant. [PMID 39008822; DOI 10.1093/nutrit/nuae093](https://pubmed.ncbi.nlm.nih.gov/39008822/)

#### B.8.6 Illness and inflammation: use a safety state, not a multiplier

Muehlenbein et al. measured ~8% higher RMR during mild respiratory infection in 25 young men, with a subset above 14%. [PMID 20309883; DOI 10.1002/ajhb.21045](https://pubmed.ncbi.nlm.nih.gov/20309883/) Cooper et al. found a 16% peak metabolic-rate rise for 6–8 hours after typhoid vaccine. [PMID 1321111; DOI 10.1152/jappl.1992.72.6.2322](https://pubmed.ncbi.nlm.nih.gov/1321111/)

Neither result is a valid daily multiplier: illness also changes movement, appetite, sleep, hydration, sodium intake, medication use and logging completeness. In severe sepsis, body-water and protein changes are so large that the normal dieting model is inappropriate; Plank and Hill observed post-resuscitation TBW losses of 11.1 L in sepsis and 6.7 L after trauma, with substantial protein loss. [PMID 10865810; DOI 10.1111/j.1749-6632.2000.tb06521.x](https://pubmed.ncbi.nlm.nih.gov/10865810/)

Use a state machine:

```text
normal -- illness_declared --> illness_hold
illness_hold -- recovered + ordinary data --> recovery_downweighted
recovery_downweighted -- stable observations --> normal
illness_hold -- fever/dehydration/acute GI loss --> safety_hold
```

`illness_hold` preserves the last calibrated expenditure and targets; it does not impute extra energy expenditure. `safety_hold` suppresses automatic target changes and surfaces a clinical-safety prompt appropriate to the product's scope.

#### B.8.7 Fasting and refeeding are separate intake states

Stekovic et al. separated fasting from energy restriction in 36 lean adults. Matched daily restriction produced −1.91 ± 0.99 kg body mass and −1.75 ± 0.79 kg fat; 0:150 alternate-day fasting produced −1.60 ± 1.06 kg and −0.74 ± 1.32 kg fat; energy-balanced fasting did not significantly reduce mass or fat. [PMID 34135111; DOI 10.1126/scitranslmed.abd8034](https://pubmed.ncbi.nlm.nih.gov/34135111/)

The 7-day water-only fast in 12 volunteers produced −5.7 ± 0.8 kg mean body mass and large systemic changes after day 3. [PMID 38429390](https://pubmed.ncbi.nlm.nih.gov/38429390/) A 2026 meta-analysis across 49 studies found reductions in weight, FM, FFM and TBW, with no robust duration-response relationship for FM/FFM. [PMID 42440276; DOI 10.1093/nutrit/nuag092](https://pubmed.ncbi.nlm.nih.gov/42440276/)

The data model must distinguish:

```ts
type IntakeAvailability =
  | { kind: "logged"; kcal: number }
  | { kind: "fasting_confirmed"; kcal: 0; confirmedAt: string }
  | { kind: "missing"; reason?: "logging_gap" | "partial_day" }
  | { kind: "unknown" };
```

An unlogged day is missing, not zero. A confirmed short fast is a real intake observation but is not evidence for a fasting-specific TDEE bonus. A prolonged fast and its refeed should be a separate controller state because glycogen, water, GI contents and activity all change together.

#### B.8.8 GI contents and acute bowel-related scale changes

Wierdsma et al. found 141 ± 49 g/day mean fecal output and ~90% energy absorption in 23 ambulant adults. [PMID 23647171; DOI 10.1111/jhn.12113](https://pubmed.ncbi.nlm.nih.gov/23647171/) Cummings et al. found a 106 g/day median in 220 healthy UK adults, a 60-hour median whole-gut transit and a 72–470 g/day average stool range across populations. [PMID 1333426; DOI 10.1016/0016-5085(92)91435-7](https://pubmed.ncbi.nlm.nih.gov/1333426/)

Fiber has measurable but modest effects. The 2026 systematic review of 113 RCTs estimated +1.76 g/day wet fecal weight per additional gram/day total fiber, +0.47 g/day dry fecal weight and −0.24 hours transit, with moderate certainty but indirect and heterogeneous dose/type evidence. [PMID 41611088; PMCID PMC12975388; DOI 10.1016/j.ajcnut.2026.101212](https://pubmed.ncbi.nlm.nih.gov/41611088/)

Bowel preparation is a distinct hard-hold event: 12 volunteers lost a median 1.2 kg and became more osmotically concentrated. [PMID 15484356; DOI 10.1007/s10350-004-0592-1](https://pubmed.ncbi.nlm.nih.gov/15484356/) Ordinary constipation or a large meal should increase observation variance; acute vomiting/diarrhea, dehydration or bowel preparation should invoke the safety/hold path.

Do not create an “absorption percentage” from a single stool report. Absorption research is controlled, population-level and not equivalent to scale mass. The app can ask about GI events to explain residuals, but it cannot identify how much of a person's logged meal was absorbed from weight data alone.

#### B.8.9 Recomposition and tissue-partition uncertainty

Hall's model explains that the energy density of weight change depends on fat versus lean composition and on starting body fat; the familiar 3,500-kcal-per-pound rule is not universal. [PMID 17848938; DOI 10.1038/sj.ijo.0803720](https://pubmed.ncbi.nlm.nih.gov/17848938/)

Foulis et al. provide a large human example: in 10 weeks of Army training, women had no average body-mass change while gaining 2.7 ± 1.6 kg DXA lean mass; men lost 1.7 kg while gaining 1.7 ± 2.0 kg lean mass. [PMID 33414487; DOI 10.1038/s41366-020-00730-0](https://pubmed.ncbi.nlm.nih.gov/33414487/) Longland et al. show a smaller, extreme RCT example: 1.2 ± 1.0 kg LBM gain and 4.8 ± 1.6 kg fat loss over four weeks in the high-protein group during severe energy restriction and intense exercise. [PMID 26817506; DOI 10.3945/ajcn.115.119339](https://pubmed.ncbi.nlm.nih.gov/26817506/)

The engine should represent tissue partition as a latent uncertainty, not an observed fact:

```text
scale trend = tissue-energy change
            + glycogen/water
            + extracellular/intracellular fluid
            + GI contents
            + measurement protocol noise
```

Use body composition, waist, training performance and strength as corroborating signals with their own quality flags. A DXA/BIA FFM increase should not automatically become `muscle_gain = true`; it should become `possible_recomp` only when repeated, comparable measurements and performance/anthropometric signals agree.

#### B.8.10 Non-inferences the product must block

- `weight_delta == fat_delta`.
- `FFM_delta == muscle_delta`.
- `sodium_grams -> water_kg` using a fixed coefficient.
- `fever -> universal TDEE percentage`.
- `menstrual_phase -> universal weight or calorie subtraction`.
- `fasting -> metabolic bonus`.
- `unlogged day -> 0 kcal`.
- `stool event -> calorie absorption coefficient`.
- `carb grams -> expenditure change`.
- `one noisy week -> program target rewrite`.

#### B.8.11 Recommended event contract

Extend the earlier event type with an explicit inference policy and evidence provenance:

```ts
type WeightContextKind =
  | "carb_shift"
  | "glycogen_depletion"
  | "high_sodium_meal"
  | "sodium_transition"
  | "creatine_started"
  | "creatine_stopped"
  | "period_logged"
  | "cycle_phase_known"
  | "illness_declared"
  | "recovery_declared"
  | "fasting_confirmed"
  | "refeed_started"
  | "large_late_meal"
  | "constipation"
  | "diarrhea"
  | "vomiting"
  | "bowel_prep"
  | "recomp_signal"
  | "logging_gap"
  | "partial_day_marked";

interface WeightContextEvent {
  id: string;
  kind: WeightContextKind;
  startedAt: string;
  endedAt?: string;
  source: "user" | "import" | "derived";
  userConfirmed: boolean;
  confidence: number;
  affectsEstimator: false | "downweight" | "hold" | "safety_hold";
  policyVersion: string;
  evidenceRefs?: string[]; // PMID/DOI/URL IDs, not free text only
}
```

The default is explanatory-only. A derived event can change observation variance only when its detection rule is replay-tested against labeled examples. Any `hold` or `safety_hold` decision must be visible in the audit log with a reason, start time, end time and resume condition. This preserves the distinction between physiology evidence and a product policy decision.

### C. Technical consequences for the Hybrid Engine

Add context events to the event log, but default them to explanatory-only:

```ts
type WeightContextEvent =
  | { kind: "carb_shift"; direction: "up" | "down"; startedAt: string }
  | { kind: "creatine_started"; startedAt: string; loading?: boolean }
  | { kind: "period_logged"; date: string }
  | { kind: "illness_declared"; startedAt: string; endedAt?: string }
  | { kind: "logging_break"; startedAt: string; endedAt?: string }
  | { kind: "fasting_confirmed"; date: string }
  | { kind: "partial_day_marked"; date: string };
```

Every event should carry `source`, `userConfirmed`, `affectsEstimator: false` by default, and `policyVersion`. The estimator may use it to reduce update gain or enter a hold only when the policy is explicit and validated. It must never silently convert a creatine start, period flag, or illness flag into a calorie adjustment.

Add replay cases for: a 1–5 day water spike; carb down/up transitions; creatine loading; menstrual-cycle rise and release; a sick week and recovery; one half-logged day; one unlogged high-calorie day; confirmed fast versus blank day; two-week logging break; recomposition at stable scale weight; and an activity change larger than roughly 500 kcal/day.

### D. Remaining unknowns after this pass

Still unrecovered: exact V3 filter coefficients; water-shift state estimator; hidden intake predictor; partial-logging classifier; update gains and caps; flux-range construction; exact cycle correction logic; exact illness/hold trigger; and any calibrated probability behind the expenditure point estimate. The public evidence now describes the edge-case behavior well enough to implement safely, but not to clone MacroFactor mathematically.

## Primary source list

- Hall KD et al. [Quantification of the effect of energy imbalance on bodyweight](https://pubmed.ncbi.nlm.nih.gov/21872751/).
- NIDDK. [Research behind the Body Weight Planner](https://www.niddk.nih.gov/research-funding/at-niddk/labs-branches/laboratory-biological-modeling/integrative-physiology-section/research/body-weight-planner).
- NIDDK/Hall et al. [Dynamic Mathematical Model of Body Weight Change in Adults](https://www.niddk.nih.gov/-/media/Files/Labs-Branches-Sections/laboratory-biological-modeling/integrative-physiology-section/Hall-Lancet-Web-Appendix_508.pdf).
- Hall KD. [Predicting metabolic adaptation, body weight change, and energy intake in humans](https://doi.org/10.1152/ajpendo.00559.2009).
- Chow CC & Hall KD. [The dynamics of human body weight change](https://doi.org/10.1371/journal.pcbi.1000045).
- Morton RW et al. [Protein supplementation and resistance-training adaptations](https://pubmed.ncbi.nlm.nih.gov/28698222/).
- Jäger R et al. [ISSN position stand: protein and exercise](https://pubmed.ncbi.nlm.nih.gov/28642676/).
- Mamerow MM et al. [Dietary protein distribution and 24-hour muscle protein synthesis](https://pubmed.ncbi.nlm.nih.gov/24477298/).
- Helms ER et al. [Protein during caloric restriction in resistance-trained lean athletes](https://pubmed.ncbi.nlm.nih.gov/24092765/).
- Longland TM et al. [Higher protein during energy restriction and intense exercise](https://pubmed.ncbi.nlm.nih.gov/26817506/).
- Tudor-Locke C et al. [Predicting DLW energy expenditure from ambulatory activity](https://pubmed.ncbi.nlm.nih.gov/22963352/).
- Pontzer H et al. [Constrained total energy expenditure](https://pubmed.ncbi.nlm.nih.gov/26832439/).
- Gómez V & Maravall A. [Kalman filtering with missing observations](https://doi.org/10.1080/01621459.1994.10476786).
- Schoeller DA & van Santen E. [Doubly labelled water validation](https://journals.physiology.org/doi/10.1152/jappl.1982.53.4.955).
- MacroFactor. [V3 expenditure algorithm](https://macrofactor.com/expenditure-v3/).
- MacroFactor Help. [Weight Trend](https://help.macrofactorapp.com/dashboard/energy_insight/).
- MacroFactor Help. [Partial Logging](https://help.macrofactorapp.com/en/articles/241-what-is-partial-logging).
- MacroFactor Help. [Expenditure Modifiers](https://help.macrofactorapp.com/en/articles/274-expenditure-modifiers).
- MacroFactor. [Expenditure modifiers technical article](https://macrofactor.com/expenditure-modifiers/).

## 20. PubMed/NCBI athlete-safety and validation review

The full evidence review is in [MacroFactor_PubMed_Athlete_Safety_Validation_Review.md](sandbox:/workspace/scratch/9db1c7f8a75a/MacroFactor_PubMed_Athlete_Safety_Validation_Review.md). It adds an important boundary to this technical pack:

> The expenditure estimator answers “what intake appears to maintain this observed weight trend?” It does not answer “is this athlete adequately fuelled and medically safe?”

### 20.1 Required safety layer

Add a separate `athleteSafetyState` to `whole-athlete-state` and the nutrition engine. It should combine persistent low-energy-availability proxies with performance decline, recovery decline, recurrent illness, injury/bone-stress concern, reproductive/menstrual or libido changes where voluntarily supplied, and disordered-eating concern. It must be a screening and routing feature, not a RED-S diagnosis. The IOC CAT2 model is a useful separation-of-concerns pattern: screening, risk stratification, then physician-led diagnosis/treatment. [IOC RED-S consensus](https://pubmed.ncbi.nlm.nih.gov/37752011/) · [IOC REDs CAT2](https://pubmed.ncbi.nlm.nih.gov/37752002/)

Do not use a universal `<30 kcal/kg FFM/day` rule, especially not as a male diagnostic threshold. Both measurement error and sex/population differences matter. [Male endurance-athlete evidence](https://pmc.ncbi.nlm.nih.gov/articles/PMC8294781/) · [RMR-equation validity study](https://pubmed.ncbi.nlm.nih.gov/40262739/)

If the safety state is `review` or `urgent_referral`, the controller must not respond to slow weight loss by escalating the deficit. High protein can preserve lean mass in some energy-deficit settings, but controlled LEA work shows that protein does not remove the underlying bone/energy-availability problem. [LEA bone study](https://pubmed.ncbi.nlm.nih.gov/33671093/)

### 20.2 Revised protein policy

Store the unit basis explicitly. The evidence uses both body mass and FFM, so a value without its basis is not reproducible. Resistance training at energy balance commonly supports a target around the evidence plateau near 1.6 g/kg/day, while lean resistance-trained athletes in a deficit may need a higher FFM-scaled range. Endurance evidence supports approximately 1.8 g/kg body mass/day as a useful starting point, with context-dependent increases. These are policy ranges, not hidden MacroFactor coefficients. [Morton meta-analysis](https://pubmed.ncbi.nlm.nih.gov/28698222/) · [Helms review](https://pubmed.ncbi.nlm.nih.gov/24092765/) · [Longland RCT](https://pubmed.ncbi.nlm.nih.gov/26817506/) · [Endurance review](https://pubmed.ncbi.nlm.nih.gov/40117058/)

Do not apply the published MacroFactor lifter table unchanged to endurance-only or mixed athletes, and do not use protein arithmetic to justify an unsafe calorie floor.

### 20.3 Revised activity policy

Wearable calorie estimates should remain outside the core equation: systematic reviews find poor individual energy-expenditure accuracy, while steps/cadence can be useful features in a validated population model. Use valid-day step trends, work/training context and device coverage to adjust responsiveness or a prior slightly; do not use `steps × kcal`. [Wearable accuracy review](https://pubmed.ncbi.nlm.nih.gov/35060915/) · [Step/cadence DLW model](https://pubmed.ncbi.nlm.nih.gov/22963352/)

Compensation is a reason to learn a person-specific response, not a reason to hard-code a universal constrained-expenditure exponent. [Pontzer](https://pubmed.ncbi.nlm.nih.gov/26832439/) · [Energy-compensation review](https://pubmed.ncbi.nlm.nih.gov/25988763/)

### 20.4 Missing data and uncertainty

Keep `blank`, `partial`, `estimated`, `fast_confirmed` and `excluded` as distinct states. Weight interpolation may support a display trend or latent filter, but it is not a new measurement. Intake missingness may be non-random, so a hidden typical-day imputation must carry uncertainty and sensitivity scenarios. State-space/Kalman methods are defensible for missing observations under MCAR/MAR assumptions, but performance worsens when missingness is non-ignorable. [Longitudinal imputation](https://pubmed.ncbi.nlm.nih.gov/32101358/) · [State-space missingness study](https://pubmed.ncbi.nlm.nih.gov/40091737/)

Keep `fluxRange` as an operational decision range. Do not call it a confidence interval until rolling-origin backtests demonstrate empirical coverage. Calibration can look good while hiding bias, and model instability can create miscalibration in new users. [Calibration](https://pubmed.ncbi.nlm.nih.gov/24021610/) · [Prediction-model stability](https://pubmed.ncbi.nlm.nih.gov/37466257/)

### 20.5 Validation gates

Add four validation layers:

1. criterion validity against DLW/chamber/indirect-calorimetry protocols where feasible;
2. future trend and target-tracking accuracy at 7/14/28 days;
3. training outcomes such as completion, performance, recovery, illness and injury signals;
4. safety/fairness performance across resistance, endurance, mixed training, sexes, body sizes, high-step occupations, device sources and missingness patterns.

MacroFactor’s first-party predictive claims should not be presented as independent physiological validation. The new PubMed review contains the proposed metrics and time-split validation design. [DLW validation](https://pubmed.ncbi.nlm.nih.gov/17209180/) · [Temporal validation methods](https://pubmed.ncbi.nlm.nih.gov/27262237/)
