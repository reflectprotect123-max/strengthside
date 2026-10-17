# Exercise movement categories

## Supabase catalogue

Migration `20261018090000_exercise_catalogue.sql` stores the cleaned catalogue in
`public.exercise_catalogue` and the original taxonomy, file SHA-256 and expected
counts in `public.exercise_catalogue_sources`. Main and Banded remain separate
values of `catalogue`. Canonical IDs, aliases, tags and classification provenance
are preserved exactly. Both tables are readable by signed-in users; client writes
and anonymous access are denied. Trusted service/backend imports own writes.

Generate the repeatable seed with:

```sh
python scripts/import-exercise-catalogues.py --output /tmp/exercise-catalogue-seed.sql
```

Apply the migration once, then execute the generated SQL using a trusted database
connection or Supabase SQL editor. The seed runs in one transaction, checks exact
content, and accepts an identical repeat as a no-op. A conflicting source hash,
record or unexpected destination identity rolls the whole seed back; it never
silently updates/deletes existing records. An intentional new catalogue version
requires a reviewed update rather than bypassing this guard.

Search examples (authenticated Supabase client):

```sql
select canonical_exercise_id, canonical_title, aliases, tags, movement_category
from public.exercise_catalogue
where catalogue = 'main'
  and (canonical_title ilike '%back squat%'
    or exists(select 1 from unnest(aliases) as alias where alias ilike '%back squat%'))
order by canonical_title;
```

These text IDs are search-library identities, not the UUID keys in `public.exercise`.
No workout rows, athlete snapshots, working maxes or e1RMs are changed or inferred.
Category/alias similarity never authorizes sharing strength estimates. This import
does not change app UI or automatically switch an existing picker to Supabase.
The separate FBB warmup/cooldown reference pack is not merged into these catalogues.

This movement/search layer produces two usable catalogues: **Main (1,674 entries,
346 custom)** and **Banded (153 entries, 31 custom)**. All 33 unclear/non-exercise
entries are deleted from usable exports and their aliases. Retained entries keep
their original IDs and aliases. Classifications reflect names and available source
instructions, not video-verified technique.

## Files to use

| File | Use |
| --- | --- |
| `custom_library_movement_categories.csv` | 346 Main custom entries |
| `banded_custom_library_movement_categories.csv` | 31 Banded custom entries |
| `exercise_movement_categories.csv` | All 1,674 Main entries |
| `banded_exercise_movement_categories.csv` | All 153 Banded entries |
| `exercise_movement_library.json` | Main entries plus active taxonomy |
| `banded_exercise_movement_library.json` | Banded entries plus active taxonomy |
| `canonical_exercise_library.csv`, `custom_library_canonical.csv`, `exercise_alias_map.csv` | Main canonical records and aliases |
| `banded_canonical_exercise_library.csv`, `banded_custom_library_canonical.csv`, `banded_exercise_alias_map.csv` | Banded canonical records and aliases |
| `movement-taxonomy.json` | Classification definitions; active JSON omits removed utility categories |
| `movement-overrides.json` | 223 ID-guarded classification/retirement decisions used by the generator, not an import catalogue |
| `movement_category_summary.json` | Current counts and archived-input hashes |

## Deletion and separation

Deletion is applied first: 24 unclear and 9 non-exercise identities are excluded
from both catalogues, all custom subsets, and their alias maps. The original
sources and removal audit are retained only in `archive/`, for historical lookup
and reproducible generation. There is no active clarification queue.

Next, titles and aliases naming band, bands, banded or Theraband route an exercise
to Banded. Assisted/resisted bands, reverse bands, optional bands and explicit
band-or-machine alternatives all count. Banded records are moved, not duplicated.
Movement categories remain intact inside each catalogue. No implicit band use is
invented for names that do not identify it.

The archive reconciliation is exact: **1,674 Main + 153 Banded + 33 removed =
1,860 original identities**. Custom reconciliation is **346 + 31 + 5 = 382**.
The 117 historical alias/equipment review pairs are not new exercises and are not
silently merged by this routing change; their report is now archived.

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
- A seated dumbbell power clean is a shoulder accessory; the less specific seated
  clean names need clarification. They are not silently grouped with Olympic lifts.
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
Unknown names get `needs_review` with a reason and are removed from usable exports.

The removed custom identities are Bendh, Farmers Press, Standing Abductor Banded
Pull-Apart, Seated Power Clean, and the complete workout Lower Body Focus Full
Body. They remain only in the archival audit and classification inputs.

## Use in a dashboard

1. Join metadata using `canonical_exercise_id`. Map that local reference to the
   existing app ID; do not replace historical IDs or name-match completed logs.
2. Search `canonical_title` and `aliases`. Filter category against the primary or
   secondary categories; optionally use equipment and variation tags. A category
   is for navigation, not proof that two variants are interchangeable.
3. Import the chosen Main or Banded catalogue explicitly. Do not load `archive/`
   or treat classification overrides as exercise records. Removed entries are
   absent from both usable catalogues. Keep routines a deliberate option.
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
Schema version 2 JSON adds a `catalogue` field (`main` or `banded`); neither file
is the old full-source catalogue. The archived inputs are never rewritten.
Overrides must reference an existing ID and its exact canonical title. Checks
reject orphan aliases, stale overrides, custom/source mismatches, invalid categories
and stale generated files. Tests cover independent examples of movement mechanics,
keyword traps, combinations, tag separation, deterministic regeneration and
preservation of retained identities/aliases, disjoint band routing, deletion
precedence, and complete reconciliation against the archived source. The dedicated GitHub workflow
runs these checks whenever this dataset or its generator changes.
