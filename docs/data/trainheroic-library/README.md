# TrainHeroic catalogue references

These files are the locally cleaned exercise-name references discussed with the user on 13 October 2026. They support catalogue review and alias matching, not automatic import of athlete performance.

| File | Contents |
| --- | --- |
| `custom_library_canonical.csv` | 382 canonical custom-library entries from 397 distinct source names |
| `canonical_exercise_library.csv` | 1,860 identities from 2,078 names across custom library and history |
| `exercise_alias_map.csv` | Each of the 2,078 original titles mapped to one local canonical ID |
| `merged_name_groups.csv` | 177 groups consolidating 218 redundant names |
| `similar_names_review.csv` | 217 related pairs: 117 alias/equipment review pairs, 100 separate variations |
| `exercise_name_cleanup_summary.json` | Cleanup counts and preservation checks |

RDL/Romanian Deadlift, DB/Dumbbell abbreviations, clear spelling errors and singular/plural variants were normalised. Meaningful equipment, stance, support, pause and movement differences remain distinct. Near spelling is not proof of interchangeability.

The complete cleaned dataset preserves 35,164 source occurrences, 28,840 grouped exercise rows and 11,425 exported set positions. Those performance CSVs, raw messages and the original ZIP are **not included here**. Do not claim these catalogue files contain actual effort, verified completed work or a full replayable training timeline.

User-confirmed conventions are documented in the [current handoff](../../cursor-handoff-engine-session-builder.md). Catalogue IDs are local reference IDs: map to existing app IDs rather than replacing historical references. The pending Grok core-library proposal still needs review; these 382 custom entries are not all approved for prominent display or automatic import.
