# Product requirements — MacroTrack

## 1. Product definition

MacroTrack is a fast, evidence-aware nutrition logger and adaptive coaching
tool for adults who want to track energy, macronutrients, micronutrients,
weight trend, and progress over time. The first market is Australia, so
Australian barcodes, units, and food-composition sources are first-class.

The product should feel calm and low-friction. It should help the user make a
decision, not make the user defend a missed day.

### Product target

The public MacroFactor feature set is a useful benchmark: barcode and verified
search logging, custom foods and recipes, quick add, copy/paste/history,
micronutrients, day-specific macro targets, fasting support, weight trend,
expenditure estimation, body metrics, progress photos, and weekly coaching
check-ins. See `docs/SOURCE_REGISTER.md` for the source URLs.

### Non-goals for the initial release

* claiming to be MacroFactor or reproducing its private implementation;
* diagnosing, treating, or monitoring a medical condition;
* turning a wearable’s calorie estimate into the app’s expenditure estimate;
* silently estimating a nutrition value that was not supplied by a source or
  explicitly entered by the user;
* making an unlogged day look like a successful zero-calorie day;
* shipping AI logging that overwrites a verified record without confirmation.

## 2. User and account requirements

| ID | Requirement | Acceptance signal |
| --- | --- | --- |
| AUTH-01 | Support account creation, sign-in, sign-out, session refresh, and password/account recovery through Supabase Auth. | An expired session returns to a recoverable auth state; no secret key is shipped in the APK. |
| AUTH-02 | Support metric/imperial display preferences and a user timezone. | A log created near midnight is assigned to the user’s selected local day, not the server’s day. |
| AUTH-03 | Support profile inputs needed for a transparent starting estimate: age or birth date, height, weight, optional body-fat estimate, sex setting, activity context, and goal. | Each input has provenance and can be edited; missing inputs do not cause a crash or hidden default. |
| AUTH-04 | Provide export and account deletion paths before release. | User can export their logs and request deletion; deletion is tested across user-owned tables and storage. |

## 3. Food database and provenance

| ID | Requirement | Acceptance signal |
| --- | --- | --- |
| FOOD-01 | Search generic foods and packaged foods by name and brand. | Search is paginated, responsive, and distinguishes source type. |
| FOOD-02 | Look up a product by exact barcode/GTIN. | Exact match is attempted before fuzzy search; a miss offers manual entry and source contribution flow. |
| FOOD-03 | Keep packaged/barcoded foods and generic foods distinguishable. | Open Food Facts rows retain barcode; AUSNUT/AFCD/NUTTAB rows retain a source food code and null barcode. |
| FOOD-04 | Preserve source URL, source version/date, original nutrient profile, basis unit, serving text, country tags, ingredients, allergens, categories, and data-quality flags. | A user can see why a food is in the database and what the values are based on. |
| FOOD-05 | Represent nutrition per an explicit basis, normally 100 g or 100 ml, and scale only when the unit is compatible. | A “1 cup” serving without a supplied mass does not receive an invented gram weight. |
| FOOD-06 | Permit multiple servings per food. | A food may offer grams, millilitres, package, or source-supplied household measures; only measures with known quantities are used for numeric scaling. |
| FOOD-07 | Validate barcode input. | Normalize digits and preserve leading zeroes; validate GTIN check digits where the format is known; do not reject a source row solely because an upstream contributor has a malformed code until the review policy says so. |
| FOOD-08 | Make source quality visible. | UI labels source-complete, converted, fallback-serving, user-entered, and AI-suggested states without shaming language. |
| FOOD-09 | Support favorites and recent foods. | A food can be logged in two taps from recent/favorites after the first use. |
| FOOD-10 | Support user custom foods. | User can enter calories, macros, serving, and optional micros; custom data is never confused with an official source row. |

## 4. Daily logging

### Day-state semantics

Every date relevant to the adaptive engine has an explicit state:

* `unlogged` — no conclusion about intake; it is not zero;
* `partial` — some logging exists, but the user says it is incomplete;
* `complete` — the user says the day is sufficiently logged for their use;
* `fasted` — the user explicitly declares a fast and the stored intake is
  intentionally zero or otherwise represented by the chosen fast model.

The app may suggest a state but must not infer `complete`, `fasted`, or zero
calories from silence.

### Logger requirements

| ID | Requirement | Acceptance signal |
| --- | --- | --- |
| LOG-01 | Show today’s targets, logged totals, remaining values, and day state. | Partial/unlogged state is visible beside totals. |
| LOG-02 | Log a food by grams, millilitres, or a source-supplied serving. | Calories and all tracked nutrients scale using the food’s explicit basis. |
| LOG-03 | Log a recipe as a snapshot of its current calculated nutrition. | Later recipe edits do not rewrite historical logs. |
| LOG-04 | Support quick-add calories and macros. | Quick-add rows have `entry_kind=quick_add`, no fake food ID, and a user-visible manual provenance label. |
| LOG-05 | Support meal assignment and notes. | Meals can be renamed/configured later without changing nutrition totals. |
| LOG-06 | Support duplicate, edit, delete/restore, and copy-to-date actions. | Operations are idempotent and preserve audit/snapshot fields. |
| LOG-07 | Support a “complete day” action and a “this day was partial/unlogged/fasted” action. | The user can correct an earlier declaration without deleting entries. |
| LOG-08 | Never punish late logging. | A late edit changes the historical day and marks estimates needing recomputation; it does not create calorie debt. |
| LOG-09 | Maintain fast interactions under poor network conditions. | Core food lookup from the local cache and logging work without network. |

## 5. Recipes and meals

* Create, edit, duplicate, archive, and favorite recipes.
* Add source foods and custom foods with quantity and unit.
* Calculate recipe totals and per-serving totals from stored source snapshots.
* Record number of servings prepared and number consumed separately where
  useful; do not force batch size to equal eaten servings.
* Preserve ingredient text/instructions as user content.
* Optional future adapters: import a URL, scan a nutrition label, or accept a
  photo. Every imported result enters a review screen before it becomes a
  verified custom food or recipe.

## 6. Micronutrients and nutrient targets

* Store a flexible nutrient profile keyed by a stable nutrient identifier and
  preserve the source label/unit.
* Track at least the nutrients available from the selected source without
  pretending that absent values are zero.
* Allow user targets with source, unit, effective date, and optional upper
  limit.
* Display “not available” separately from “0”.
* Provide daily and rolling views for energy, macros, fibre, sodium, sugar, and
  selected vitamins/minerals only when data coverage supports the claim.
* Treat FSANZ nutrient reference values as reference information, not a
  personalized medical prescription.

## 7. Goals, targets, and programs

Support three user modes:

1. **Coached** — the engine proposes target updates after a check-in.
2. **Collaborative** — the engine explains a proposed update; the user can
   accept, edit, or decline it.
3. **Manual** — the user owns the calorie and macro targets; expenditure may
   still be shown as an informational estimate if enough data exists.

Support goals of lose, gain, and maintain, with a signed target rate. Keep
weekly and day-specific targets as separate records. Users may select a
balanced, lower-carb, higher-carb, or custom preference only when the
allocation remains mathematically valid and the UI explains the trade-off.

Fasting days and non-uniform calorie distributions are scheduling/logging
features. They must not be used to hide missing data from the expenditure
engine.

## 8. Weight, trend, and body metrics

* Enter weight manually; optionally import from a future health integration.
* Show raw observations and a separate smoothed trend.
* Let the user correct/delete an observation with an audit event.
* Support measurements and progress photos as private, user-owned data.
* Avoid false precision: display uncertainty/coverage and the date window used.
* Do not infer body composition from scale weight alone.

## 9. Expenditure and check-ins

* Use logged intake and weight trend, not wearable calorie estimates.
* Hold the previous estimate when coverage is inadequate.
* Show the input window, countable nutrition days, weight days, trend slope,
  previous estimate, raw estimate, damping, and final recommendation.
* Make check-ins weekly but allow a fast path and the ability to skip/decline.
* Modules may include partial logging, weigh-in, fasted/logging break, and
  program update.
* A recommendation is not a punishment, a make-up target, or a retroactive
  calorie debt.

## 10. Insights and notifications

Initial useful insights:

* adherence-neutral weekly summary;
* trend versus scale weight;
* expenditure estimate and confidence state;
* macro/micronutrient coverage;
* recurring foods/recipes and recent history;
* data-quality warnings that invite correction.

Notifications are opt-in and must be quiet by default. Do not create a
streak-based shame loop.

## 11. Quality, safety, and trust

* Every automated suggestion has a reason code and a human-readable
  explanation.
* Manual, source, converted, fallback, and AI values are distinguishable.
* Pregnancy, eating-disorder history, relevant medical conditions, minors, or
  user-declared risk should route to a neutral/manual mode and safety copy;
  the app must not present a generic calorie target as clinical advice.
* AI/photo/OCR results require user confirmation and show uncertainty.
* The app must provide a path to correct bad source data and report a barcode.

## 12. Release definition

The product is not “MacroFactor-class” until a test user can:

1. create an account and set a timezone/units;
2. search and log a generic food offline;
3. scan or enter a packaged-food GTIN and see a source/provenance screen;
4. create a custom food and recipe;
5. edit a historical log without changing the original source row;
6. declare a partial, unlogged, or fasted day explicitly;
7. record weight and see raw versus trend values;
8. reach a check-in with a held state when coverage is insufficient;
9. receive an explainable target proposal when coverage is sufficient;
10. accept, edit, decline, export, and delete their data;
11. repeat the main flows offline and reconcile after reconnecting;
12. pass RLS, migration, unit, instrumentation, accessibility, and data-audit
    tests.
