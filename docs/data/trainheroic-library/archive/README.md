# Archived catalogue sources — not for import or exercise selection

These are the original cleaned name references from 13 October 2026 and the
removal audit. Active catalogues live one directory up and must be used for new
exercise selection. Do not recursively import every CSV in this directory tree.

- `canonical_exercise_library.csv`: original 1,860 canonical identities.
- `custom_library_canonical.csv`: original 382 custom entries.
- `exercise_alias_map.csv`: original 2,078 name-to-ID mappings.
- `removed_exercises.csv`: 24 unclear and 9 non-exercise entries removed from all
  usable catalogues and active alias maps; audit only, not a pending review queue.
- `merged_name_groups.csv`, `similar_names_review.csv`, and
  `exercise_name_cleanup_summary.json`: original cleanup reports.

The generator reads the archived source CSVs, applies the recorded classification
and removals, then writes separate Main and Banded exports. Keeping these immutable
sources does not restore deleted exercises to either usable catalogue. Original
weights, messages and full raw training exports are not stored in these files.
