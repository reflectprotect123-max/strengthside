# Exercise search, variant picker, and history foundation

**Date:** 2 September 2026  
**Status:** Implemented (search + picker + TH import script)  
**Related:** `test/fixtures/exercise-load-profiles.json`, `2026-09-02-exercise-load-profile-library.md`

## Problem

Today the athlete builder matches exercises by **exact normalized name** (`normExercise`). Every spelling (`deadlift`, `Dead Lift`, `dl`) or nickname (`DB lat raise`) can create a **new custom exercise id** with **no shared history**.

The engine already keys progression by **`exerciseId`** (`loadHints`, `volumeHints`, working max events). The gap is **resolution**: turning what the athlete types into the **canonical exercise they mean**, then loading **that** exercise’s history.

## User-approved behavior

### Search → variant picker → select

1. Athlete types in the exercise name field (typos OK), e.g. `deadlift`.
2. App shows a **list of matching variants** from the library — **names only**.
3. **Weights do not appear in this list.** No “last: 180 kg” in the picker.
4. Athlete **clicks the variant** they want (e.g. Sumo Deadlift).
5. Builder/logger uses **that** canonical `exercise_id`, its **load profile** (from exercise-load-profiles), and **weight/rep history** behind the scenes when the session starts or sets are stamped.

### Explicit rules

| Rule | Detail |
| --- | --- |
| **No auto-guess** | Typing `deadlift` does **not** silently pick “most recent deadlift”. User always picks from the variant list when multiple matches exist. |
| **No weights in search UI** | Picker shows exercise names (and optional category/equipment label). Load history applies **after** selection only. |
| **Full name = specific variant** | Typing `sumo deadlift` should narrow results to sumo (ideally one match → can auto-select or still show single-item list). |
| **Different families stay separate** | `lat pulldown` ≠ `lateral raise`. Search ranks within movement family; no cross-family merge. |
| **One history per canonical exercise** | Conventional Deadlift and Romanian Deadlift are separate ids with separate histories. |

### Example flows

**Deadlift family**

```
Type: deadlift
Picker:
  Deadlift
  Sumo Deadlift
  Romanian Deadlift
  Trap Bar Deadlift
  …
Tap: Sumo Deadlift
→ exercise_id = core-sumo-deadlift (or equivalent)
→ session uses sumo load hints / last session load (not shown in picker)
```

**Lateral vs pulldown**

```
Type: lat
Picker (ranked):
  Lat Pulldown
  Lateral Raise
  Cable Lateral Raise
  …
User must pick — “lat” alone is ambiguous.
```

## Architecture

### Components

| Unit | Responsibility |
| --- | --- |
| **Exercise index** | 120 canonical exercises + aliases + search tokens + optional `family` tag (e.g. `deadlift`, `lateral-raise`, `lat-pulldown`) |
| **Search resolver** | Query string → ranked list of `{ exercise_id, display_name, category? }` — no load fields |
| **Variant picker UI** | Builder exercise name field: debounced search, list overlay, tap to select |
| **History store** | Existing `strengthState` (loadHints, performed history, WM events) keyed by `exercise_id` |
| **TH import (optional seed)** | One-off parse of personal `trainheroic-userData-export-*.zip` → seed history per resolved `exercise_id` |

### Data flow

```
User types query
    → Search resolver (index + aliases + fuzzy)
    → Variant picker (names only)
    → User selects variant
    → saveExercise / registerExercise sets exerciseId = canonical id
    → stampSessionPrescription / applyLoadHintsToExercise uses profile + history
```

### Exercise index shape (proposed)

Extend or sit beside `hybrid-engine-exercise-library-120.json`:

```json
{
  "exercise_id": "core-deadlift",
  "name": "Deadlift",
  "family": "deadlift",
  "aliases": ["conventional deadlift", "barbell deadlift", "dl"],
  "search_tokens": ["deadlift", "dead", "lift"]
}
```

- **`family`**: groups variants for broad search (`deadlift` → all deadlift-family ids).
- **`aliases`**: TH export titles and nicknames mapped to this id (import + live search).
- **Equipment** (barbell, dumbbell, cable): encoded in canonical name or tags for ranking, not separate history unless distinct canonical entries (e.g. Lateral Raise vs Cable Lateral Raise).

### TrainHeroic import (foundation)

Personal export stays **gitignored** (see repo `.gitignore`).

Import pipeline (offline script, not shipped to all users):

1. Read `training_data.csv` → `ExerciseTitle` + parse `ExerciseData` (reps, load, time, …).
2. Resolve title → canonical `exercise_id` via alias table (manual review file for unmapped titles).
3. Write gitignored seed JSON consumed once on athlete device: performed sets / load hints per `exercise_id`.
4. Does **not** change the 120 public library without explicit curation.

Import validates the alias table; it does not replace the variant picker UX.

## UI spec (builder)

- **Trigger:** focus or typing in exercise name field (`exName` / `exNameVisible`).
- **Results:** scrollable list, min 44px row height, name + subtle category (optional).
- **Exclude from list:** weights, %WM, “last session”, RIR.
- **Empty state:** “No matches — create custom?” (custom still allowed but warned: no canonical history).
- **Single strong match:** may auto-highlight first result; user still confirms with tap (no silent submit on Enter unless exactly one match and user presses Enter — product choice at implement time).

## Integration with load profiles

After selection, `exercise-load-profiles.json` defines **which metrics to log** for that id (kg+reps, reps only, time, …). Picker does not need profile detail; adapter applies it post-selection.

## Out of scope (v1)

- Showing weights in the search/picker list
- Auto-selecting “most recent” variant without user tap
- Merging DB and cable lateral raise into one history
- Coach app / cloud sync of import seed
- LLM-based exercise matching (deterministic search + aliases first)
- Importing readiness, nutrition, teams from TH export

## Testing

- Search: `deadlift` returns multiple deadlift-family names, not Lat Pulldown.
- Search: `sumo deadlift` returns Sumo Deadlift (narrowed).
- Search: `db lat raise` ranks Lateral Raise / DB variants above Lat Pulldown.
- Picker HTML/smoke: result rows contain name only (no weight patterns in list template).
- Selection: chosen `exercise_id` flows to `saveExercise` and matches seeded load hint in smoke fixture.

## Phased delivery

| Phase | Deliverable |
| --- | --- |
| **1** | Exercise index + search resolver module + unit/smoke tests |
| **2** | Builder variant picker UI (names only) |
| **3** | Wire selection → existing `applyLoadHintsToExercise` / profiles |
| **4** | TH import script → bundled history seed (hints + aliases only) |

Phases 1–3 stand alone without import. Phase 4 fills load hints for dogfood.

## Exercise history seed (phase 4 — implemented)

```bash
pnpm run import:trainheroic -- path/to/trainheroic-userData-export.zip
pnpm run gen:exercise-history-seed
bash apps/mobile/sync-hybrid-html.sh
```

- **Threshold:** exercises with **>3** logged rows in `training_data.csv`
- **Maps** TH `ExerciseTitle` → canonical `exercise_id` (manual map + ExerciseSearch); unmapped titles kept as aliases only
- **Seed contains:** `loadHints` + `titleAliases` only — **no sessions**, no custom exercises, no templates
- **Output:** gitignored `exercise-history-seed.js` (generated from gitignored `THE-trainheroic-import.json`)
- **App boot:** auto-merges seed once — no Settings import step

## Success criteria

- Athlete types a vague name, sees **variant names**, picks one, and set 1 load comes from **that variant’s history** without weights cluttering search.
- Same canonical id whether they typed `DB Lateral Raise` or picked Lateral Raise from search after typing `lateral`.
- Personal TH export stays gitignored; bundled seed supplies hints/aliases without importing workout sessions.
