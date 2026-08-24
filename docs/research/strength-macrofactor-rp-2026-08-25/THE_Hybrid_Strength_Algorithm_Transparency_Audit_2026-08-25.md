# THE Hybrid Engine — MacroFactor / RP algorithm-transparency audit

**Audit date:** 25 August 2026  
**Scope:** public, lawful sources only; no reverse engineering, scraping of private endpoints, credential use or attempt to extract app code.

## Executive conclusion

The defensible statement is not “the algorithms are completely unknown.” Both products publish meaningful behavioural descriptions. The defensible statement is:

> MacroFactor Workouts and RP Hypertrophy publicly disclose parts of their decision behaviour, but neither product publishes a complete, independently reproducible implementation of its core progression/programming engine. The exact equations, parameter values, history weighting, objective/tie-breaking rules and full decision tables remain undisclosed in the public sources reviewed.

That means THE Hybrid Engine can build a transparent behavioural analogue. It must not claim to be an exact MacroFactor or RP clone.

## Confidence by product

| Product | Publicly disclosed | Still not publicly reproducible | Confidence that exact core remains undisclosed |
|---|---|---|---:|
| MacroFactor Workouts | Rule-based Smart Progression; RIR/rep-range examples; performance feedback; equipment-aware rounding; load/rep adjustment options; generator inputs; lifecycle/update behaviour | Full estimator; history window and weighting; failure/missed-session treatment; e1RM/strength model; exercise ranking; muscle-credit weights; objective function; tie-breaks; complete generator tables; source/API | **9/10** |
| RP Hypertrophy | Qualitative weight, rep and set behaviour; pump/soreness/workload/“beat up” feedback; expert-system description; Emphasize/Grow/Maintain; broad mesocycle/deload behaviour; load-entry semantics | Coefficients; feedback weights; smoothing/window; fatigue thresholds; exact volume-landmark tables; exercise ranking; program-generation tables; full mesocycle state machine; source/API | **8.5/10** |

These are confidence ratings about the public evidence, not legal findings and not proof that no private code, private endpoint or unpublished filing exists.

## MacroFactor: what is public

MacroFactor explicitly describes Smart Progression as rule-based rather than generative AI. Its public documentation also exposes several behavioural anchors:

- A public example uses the midpoint of a target rep range plus target RIR as an expected failure-performance signal: for 7–9 reps at 2 RIR, midpoint 8 + 2 = 10 expected reps at failure.
- RIR is logged on a 0–6+ scale and can influence future recommendations.
- Correcting RIR after a set can update future recommendations.
- The system can adjust reps instead of forcing an excessively large equipment jump, and it can use weight matching.
- Recommendations account for equipment/loading constraints.
- Goal, experience, schedule, duration, equipment, exclusions and emphasis are public generator inputs.
- Logged performance updates recommendations while program structure is treated separately from the progression recommendation.
- Public release notes expose user-facing options such as reps-first adjustment, but not the internal selection logic.

Primary sources:

- [MacroFactor Workouts product page](https://macrofactor.com/workouts/)
- [Smart Progression](https://help.macrofactorapp.com/en/articles/305-understanding-and-using-smart-progressions)
- [Progressive overload / expected failure example](https://help.macrofactorapp.com/en/articles/372-what-does-progressive-overload-mean-in-macrofactor-workouts)
- [RIR](https://help.macrofactorapp.com/en/articles/385-what-is-rir-and-how-should-i-use-it-during-training)
- [Changing RIR during an active workout](https://help.macrofactorapp.com/en/articles/314-changing-rir-during-an-active-workout)
- [Generator inputs](https://help.macrofactorapp.com/en/articles/370-what-information-does-macrofactor-workouts-use-to-generate-your-program)
- [Program update timing](https://help.macrofactorapp.com/en/articles/369-how-often-does-my-program-update)
- [Release notes: reps-first adjustment](https://macrofactor.com/wo-version-1-1-8/)

## MacroFactor: what remains unknown

No public source found in this audit provides the complete Smart Progression implementation. The unresolved core includes:

- exact load/reps estimator and all parameter values;
- history window, smoothing and weighting across prior sessions;
- handling of failed, missed, unusually easy or contradictory observations;
- exact strength/e1RM model and confidence treatment;
- exercise similarity/substitution ranking;
- direct/indirect muscle-credit weights;
- the objective function when several feasible load/rep choices exist;
- tie-breaking among hold-load, add-rep, add-weight, rep-range expansion and weight-match options;
- complete Smart Generation decision tables;
- a documented public recommendation API or open-source progression engine.

Public integrations and spreadsheet import/export do not expose the recommendation engine. Public GitHub tools that parse exports are data tools, not evidence that the core algorithm was recovered.

MacroFactor’s current Terms of Service provide supporting evidence of company control over the software and methods: they reserve rights in the Services and related code, patents, trade secrets and methods of operation, and restrict decompilation, source extraction, reverse engineering, scraping and cloning. This supports “company-controlled/proprietary implementation,” but legal ownership alone does not prove that every algorithmic detail is a trade secret or that no patent exists.

- [MacroFactor Terms of Service](https://macrofactor.com/terms/), especially §§3.1, 7.4 and 10.1
- [MacroFactor integrations](https://help.macrofactorapp.com/en/articles/354-integrations-workouts)
- [MacroFactor import/export](https://help.macrofactorapp.com/en/articles/287-how-to-import-a-workout-or-program)

## RP Hypertrophy: what is public

RP publishes more qualitative detail about its feedback loop than a simple black-box label. Its official help material says:

- the algorithms are “a bit complex” but behave predictably in many cases;
- weight commonly rises by a few percentage points per week;
- if the next equipment increment is too large, reps may be added instead;
- pump, soreness, workload perception and feeling “beat up” influence future set recommendations;
- those calculations are applied continuously as feedback accumulates;
- the app describes itself as using an “expert-system AI” and allows users to override recommendations;
- Emphasize, Grow and Maintain are explicit muscle-priority modes;
- load entry differs for barbells, dumbbells, machines, cables, bodyweight and assistance.

RP also publishes a concrete *training-framework* algorithm in its volume-landmarks article: recovery and performance are scored from 1–4; excellent recovery/performance can add 2–3 sets, moderate results add 1 set, worsening fatigue tends to hold volume, and a performance score of 4 triggers a recovery session or deload. The same article shows a sample 12 → 14 → 16 → 18 → 20 set progression followed by a 6-set deload. This is real public algorithmic logic, but the article is not a versioned technical specification proving that the current app uses every constant literally.

Primary sources:

- [RP progression algorithm explanation](https://help.rpstrength.com/hc/en-us/articles/32600173777815-How-does-the-app-determine-when-to-add-weight-reps-and-sets)
- [RP expert-system description](https://help.rpstrength.com/hc/en-us/articles/32434237175447-Shouldn-t-I-be-doing-more-sets-or-weight)
- [RP muscle emphasis](https://help.rpstrength.com/hc/en-us/articles/34825395726743-Muscle-Emphasis-Breakdown)
- [RP load-entry semantics](https://help.rpstrength.com/hc/en-us/articles/30801977895063-What-to-put-in-the-load-box)
- [RP app scope](https://help.rpstrength.com/hc/en-us/articles/33510008280087-Who-is-the-RP-Hypertrophy-App-for)
- [RP Hypertrophy App listing](https://apps.apple.com/us/app/rp-hypertrophy/id1555614554)
- [RP volume landmarks and weekly set-progression algorithm](https://rpstrength.com/blogs/articles/training-volume-landmarks-muscle-growth)

## RP: what remains unknown

The public descriptions do not specify:

- the percentage-change coefficients or when they change;
- the relative weights of pump, soreness, workload, performance and “beat up” feedback;
- the smoothing/window used to combine past feedback;
- exact thresholds for adding, holding or removing sets;
- exercise- and muscle-specific volume-landmark tables;
- exact mesocycle generation, fatigue and deload state transitions;
- exercise ranking, substitution and resource-arbitration logic;
- the full expert-system rule base, source code or documented public API.

RP’s public website terms protect site materials, but the page reviewed is a website terms page rather than a complete public disclosure of the Hypertrophy App’s internal implementation. Therefore the algorithm conclusion for RP rests mainly on the absence of a public implementation plus RP’s own qualitative descriptions—not on a claim that the website terms alone prove app-code trade-secret status.

- [RP website Terms of Service](https://rpstrength.com/pages/terms-of-service)
- [RP app portal](https://apps.rpstrength.com/)

RP also has a historical US patent application, [US20170352289A1](https://patents.google.com/patent/US20170352289A1/en), assigned to Renaissance Periodization and now listed as abandoned. It describes a broad feedback-driven plan-generation architecture, not the current Hypertrophy App’s exact coefficients or rule base. It is useful provenance for the general architecture, not a reproducible copy of the production algorithm and not evidence of a currently enforceable patent monopoly.

## Adversarial checks

### Public code

Public GitHub projects describe themselves as RP-inspired, RP replacements or MacroFactor export/import tools. They are independent implementations or data utilities. They are not official RP/MacroFactor source repositories and do not establish that the private engines were recovered.

### APIs

The public documentation reviewed exposes account, app, health-integration and import/export surfaces, but no documented endpoint that accepts a complete workout history and returns the company’s internal recommendation calculation. A private or authenticated endpoint could still exist; it was not tested or accessed.

### Patents

Targeted public searches did not surface a relevant MacroFactor Workouts or RP Hypertrophy patent that publishes the complete production algorithm. This is negative search evidence only. It does not establish that no private patent application, continuation, trade-secret implementation or third-party patent exists.

### Reproducibility

The public examples are sufficient to reproduce a *family of behaviours*, not one uniquely identified program. Different choices for history weighting, smoothing, fatigue thresholds and tie-breaking can satisfy the same published examples while producing different future recommendations. That is the practical reason an exact clone cannot be claimed from public material alone.

## Product decision for THE Hybrid Engine

Implement two layers:

1. `PUBLIC_BEHAVIOUR_ANCHOR` — only rules directly supported by official product documentation, such as expected-failure midpoint + RIR, equipment-aware fallback, feedback dimensions and priority modes.
2. `HYBRID_POLICY` — transparent, versioned choices needed to make the app operational, such as history weighting, bounded progression steps, volume-credit fractions, fatigue thresholds and tie-breaks.

Every recommendation should record which layer produced it. The app should say “MacroFactor/RP-informed independent implementation” or “behavioural analogue,” never “the MacroFactor/RP algorithm,” unless the owners publish a complete implementation or grant access to one.

## What would change this conclusion

The status should be revisited if any of the following becomes public and verifiable:

- official source code or a complete official SDK;
- a documented public API with stable input/output examples;
- a full equation/parameter table and decision table;
- enough official controlled test vectors to identify the hidden parameters uniquely;
- a patent or technical filing that actually discloses the production logic rather than broad concepts;
- a company statement that a specific open-source implementation is authoritative.

Until then, the honest status is **partially disclosed, exact core not publicly reproducible**.
