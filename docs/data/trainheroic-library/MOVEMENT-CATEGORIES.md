# Exercise movement categories

This is a non-destructive movement/search layer over the cleaned TrainHeroic name
library. It covers all **1,860 original canonical identities**, including the
**382 custom-library entries**, and preserves all **2,078 original name aliases**.
Original CSVs, exercise IDs, titles, source counts and historical references are
unchanged. These are classifications from names and available source instructions,
not video-verified technique or a clinically validated exercise ontology.

## Files to use

| File | Use |
| --- | --- |
| `custom_library_movement_categories.csv` | Spreadsheet-ready categories for the 382 custom entries; start here |
| `exercise_movement_categories.csv` | Categories for every one of the 1,860 identities |
| `exercise_movement_library.json` | Same entries plus taxonomy; importable into a future dashboard |
| `movement-taxonomy.json` | Stable category IDs, labels, definitions and allowed subcategories |
| `movement-overrides.json` | 220 reviewed exceptions, combinations and clarification decisions, keyed to original ID and guarded title |
| `movement_review_queue.csv` | 22 unclear identities and 9 programme/software entries; excludes ordinary classified entries |
| `movement_category_summary.json` | Counts and input SHA256 hashes; generated, not manually maintained |

There are **1,829 classified entries**, **22 requiring clarification**, and **9
non-exercise entries**. For the custom subset: **378 classified**, **3 requiring
clarification**, and **1 complete workout kept as a reference entry**. Classification
does not resolve the separate 117 alias/equipment review pairs in the name-cleanup
report; those identities and their pending decisions remain separate.

## Category choices

The main navigation groups are Squat, Hinge, Bridge / hip thrust, Lunge / step,
Horizontal push, Vertical / angled push and dip, Horizontal pull, Vertical pull,
Core, Carry, Isolation / accessory, Jump / throw / Olympic lift, Locomotion /
conditioning, Mobility, and Mixed movements. Preparation / recovery, Reference,
and Needs clarification are separate utility groups.

- Hip thrusts and bridges have their own group, instead of treating every hip
  extension as a deadlift hinge.
- Split squats belong with lunges/steps. Single-leg squats and leg presses stay
  under Squat. A jump squat is a power task rather than an ordinary squat.
- An incline bench press remains Horizontal push. A pike/handstand push-up is
  Vertical push. Landmine presses use the `angled_press` subcategory. Dips use
  `dip`; putting dips in that navigation group does not make them overhead lifts.
- Upright rows, face pulls, pull-aparts and pullovers are shoulder accessories,
  rather than lat-focused vertical pulls. A sled row is a row; a sled drag is
  locomotion. Sled face pulls currently share the sled-row family for search.
- A thruster is Mixed, searchable under Squat and Vertical push. A muscle-up is
  Mixed with a vertical pull and push. Clean-and-jerk remains an Olympic lift.
  Mixed entries are not split into newly invented exercises.
- A side-plank row keeps Core as primary and Horizontal pull as secondary.
  Rucking is a loaded carry; a stationary grip hold is an accessory.
- Preparation drills and named routines retain their scope. `context:routine`
  means the component exercises have not been reconstructed.
- Existing conditioning names are classified as data. No conditioning app or
  builder is added or changed.

## Fields and safeguards

`movement_category` is one primary grouping. `movement_subcategory` describes the
movement inside that group, such as elbow flexion or knee flexion. Additional
`secondary_categories` support search for combinations or support-position rows.
An explicit `or` choice is tagged `context:alternatives`; it is not a combined set.
For a row-plus-unspecified-press entry, the row secondary is recorded but the press
direction is deliberately not invented.

`tags` use separate namespaces: `equipment:`, `variation:`, `family:` and
`context:`. For example, B-Stance Dumbbell Romanian Deadlift has a hinge category,
Romanian-deadlift family, dumbbell equipment and B-stance variation. A paused back
squat stays a squat and carries paused/back-squat tags. Tags are only explicit
name evidence, not an exhaustive list of technique details. Absence of equipment
in a name means unspecified, not automatically bodyweight or barbell. Multiple
equipment tags may describe alternatives in the original name.

`basis` and `rule_id` make classification traceable. `classified_from_name` means
there is enough textual evidence for this navigation group. `reviewed_override`
means the generic rules required a deliberate exception, not that an athlete or
coach has confirmed a video. No guessed probability/confidence percentage is used.
Unknown names get `needs_review` with a reason rather than a forced classification.

The three unclear custom entries are **Bendh**, **Farmers Press**, and **Standing
Abductor Banded Pull-Apart**. Confirm the actual movement using instructions or a
video before treating these as ordinary selectable exercises. The full workout
**Lower Body Focus Full Body** is kept as a reference; its source instructions
contain multiple exercises and a warm-up.

## Use in a dashboard

1. Join metadata using `canonical_exercise_id`. Map that local reference to the
   existing app ID; do not replace historical IDs or name-match completed logs.
2. Search `canonical_title` and `aliases`. Filter category against the primary or
   secondary categories; optionally use equipment and variation tags. A category
   is for navigation, not proof that two variants are interchangeable.
3. Exclude `needs_review` and `non_exercise` from automatic suggestions. Make
   routines a deliberate option, rather than silently treating them as one lift.
4. Keep metrics and prescriptions independent. Categories do **not** determine
   reps, time, distance, tempo, load units, per-side convention, RPE/RIR, weight
   increments, e1RM eligibility, history pooling or progression. A weighted dip
   still needs its original load convention. Sharing a category never authorises
   sharing estimated strength or learning across exercises.

This task provides categorised data and checks. It does not import exercises into
Supabase, add dashboard filters, change the athlete app, or ship a Capgo update.

## Regenerate and validate

Python 3.11+ and the standard library are sufficient; no packages or secrets needed.
From the repository root:

```sh
python3 scripts/categorise-exercise-library.py
python3 scripts/categorise-exercise-library.py --check
python3 -m unittest discover -s scripts -p test_exercise_categories.py -v
```

Change the taxonomy/rules or `movement-overrides.json`, then regenerate the exports.
Overrides must reference an existing ID and its exact canonical title. Checks
reject orphan aliases, stale overrides, custom/source mismatches, invalid categories
and stale generated files. Tests cover independent examples of movement mechanics,
keyword traps, combinations, tag separation, deterministic regeneration and
preservation of the complete identity/alias sets. The dedicated GitHub workflow
runs these checks whenever this dataset or its generator changes.
