# Morpheus profile inputs: evidence and StrengthSide implications

Reviewed 3 October 2026. Research only: no app changes or Capgo publication.
The exact proprietary estimator, fitness offsets and weekly progression function
were not recovered.

## Current first-party findings

| Label | Finding | Limitation |
| --- | --- | --- |
| **CONFIRMED** | Morpheus says an unspecified max HR is estimated using age, sex and fitness level. | No coefficients or per-input offsets disclosed. |
| **CONFIRMED** | Max HR and selected fitness level determine default zones, described as zones at 100% recovery. | No current per-level boundary table disclosed. |
| **CONFIRMED** | Users can supply their tested max HR instead. | A workout peak is not necessarily a true physiological maximum. |
| **CONFIRMED** | If a workout exceeds estimated max HR, Morpheus says it can notify the user and automatically adjust the setting. | Artifact rejection, persistence thresholds and consent details are not specified. |
| **CONFIRMED** | Low/Moderate/High are self-rated cardio fitness categories and can be changed later. | They are not a formal fitness test. |
| **CONFIRMED** | Initial weekly targets use early HRV tests, RHR, fitness category and Maintain/Improve Cardio goal. | Exact starting minutes and category differences are undisclosed. |
| **CONFIRMED** | Weekly updates consider training completed, recovery average and HRV/RHR trends. | Exact increases/decreases, caps and tie-breaking are undisclosed. |
| **CONFIRMED** | No recovery test leaves baseline zones visible; lower recovery lowers Green/Red boundaries. | Dynamic guidance should not be described as newly measured thresholds. |

The current setup guide describes Low as Morpheus HRV below 70/RHR 60–70,
Moderate as HRV 70–80/RHR 50–60, and High as HRV 80+/RHR low 50s or below.
It describes these as general guidance alongside a subjective self-assessment.
**INFERRED:** these Morpheus displayed HRV categories must not be applied directly
to WHOOP raw RMSSD in milliseconds. Their more recent fitness article also says
high HRV/low RHR alone do not establish cardiovascular fitness.

## Input-to-output separation

| Input | Documented Morpheus role | StrengthSide implication |
| --- | --- | --- |
| Age | Input to estimated max HR. | Changes the estimated HR scale; does not change received BPM. |
| Sex | Input to its undisclosed estimate. | Do not invent a sex adjustment without a chosen validated model. |
| Fitness level | Baseline zones and initial weekly targets; listed among max-estimate inputs. | Keep cardio fitness distinct from physiological max HR and daily recovery. |
| Entered/tested max HR | Replaces the estimate and places zones. | Recalculate future zone classification and horseshoe scale; preserve recorded historical boundaries. |
| RHR/HRV | Daily recovery and weekly target feedback. | Use personal trends, not cross-person fitness rankings. Karvonen's direct RHR-to-boundary mapping is our design, not confirmed Morpheus behavior. |
| Recovery | Daily adjustment of cardio guidance. | Keep max HR fixed; adjust guidance through a separate bounded model. |
| Maintain/Improve goal | Weekly dose targets. | Do not change measured BPM or physiological maximum to express a goal. |

## Quantitative behavior in our current Karvonen model

**STRENGTHSIDE-DESIGNED:** `boundary = RHR + fraction × (MaxHR − RHR)`
at Blue/Green/Red start fractions 0.50/0.70/0.85.

Holding RHR constant, a +10 bpm max-HR correction shifts the unrounded starts by
+5/+7/+8.5 bpm. Holding max HR constant, a −10 bpm RHR change shifts them by
−5/−3/−1.5 bpm. A lower RHR does not automatically raise these boundaries.
These are baseline effects; daily recovery adjustments are applied separately.
At the same received BPM, a higher maximum also reduces horseshoe fill.

## Proposed next implementation (not built)

**STRENGTHSIDE-DESIGNED:** offer age-based estimated max HR when unknown, with an
explicit measured/known maximum override. The Tanaka equation `208 − 0.7 × age`
is a candidate supported by independent research; that does not establish it as
Morpheus's equation. That study found no regression differences between sexes or
habitual physical activity levels, so do not arbitrarily raise max HR for High
fitness or invent sex offsets.

Add optional self-rated cardio fitness and Maintain/Improve goal only with
versioned, auditable rules for their effects. Do not silently attach arbitrary
fitness offsets to the current 50/70/85% model. Weekly automatic progression
remains disabled pending the response-based controller and validation.

If suggesting a max-HR correction from live workouts, reject obvious artifacts,
require corroboration and show the user the candidate before applying it. A
higher observed peak calibrates a setting; it is not proof of improved fitness.
Validate progress using pace/power at a comparable HR, standardized performance,
HR recovery and tolerability alongside physiology trends.

## Sources read

- [Maximum Heart Rate: Estimating It vs Measuring It](https://support.trainwithmorpheus.com/support/solutions/articles/4000148448-maximum-heart-rate-estimating-it-vs-measuring-it)
- [Mobile App Setup](https://support.trainwithmorpheus.com/support/solutions/articles/4000176907-mobile-app-setup)
- [Why Morpheus Heart Rate Zones Are Different](https://support.trainwithmorpheus.com/support/solutions/articles/4000148286-morpheus-heart-rate-zones)
- [Weekly Cardio Targets](https://support.trainwithmorpheus.com/support/solutions/articles/4000197128-weekly-training-zone-targets)
- [Morpheus App FAQs](https://support.trainwithmorpheus.com/support/solutions/articles/4000230971-morpheus-app-faqs)
- [Morpheus Settings & Phone Configuration Guide](https://support.trainwithmorpheus.com/support/solutions/articles/4000231431-morpheus-settings-phone-configuration-guide)
- [Why High HRV and Low RHR Do Not Always Mean Cardiovascular Fitness](https://support.trainwithmorpheus.com/support/solutions/articles/4000232368-why-high-hrv-and-low-resting-hr-don-t-always-mean-you-re-cardiovascularly-fit)
- [Why Knowing Zone 2 Workload Matters](https://support.trainwithmorpheus.com/support/solutions/articles/4000225961-why-knowing-your-zone-2-workload-matters-just-as-much-as-knowing-your-zone-2-hr-range)
- [Tanaka et al. (2001), Age-predicted maximal heart rate revisited](https://pubmed.ncbi.nlm.nih.gov/11153730/)

**HISTORICAL:** no new historical calibration findings were established in this
review; the previously supplied 2019 fixtures retain their original evidence
classification and do not establish current formulas.
