# Exercise catalogues

The usable library is split into **Main** and **Banded** catalogues. Unclear and
non-exercise entries have been deleted from both usable catalogues and their alias
maps. Exercise IDs and aliases for retained entries are unchanged.

| Catalogue | All entries | Custom-library entries | Category CSV | JSON |
| --- | ---: | ---: | --- | --- |
| Main | 1,674 | 346 | [Main categories](exercise_movement_categories.csv) | [Main JSON](exercise_movement_library.json) |
| Banded | 153 | 31 | [Banded categories](banded_exercise_movement_categories.csv) | [Banded JSON](banded_exercise_movement_library.json) |

For just the custom exercises, use [main custom categories](custom_library_movement_categories.csv)
and [banded custom categories](banded_custom_library_movement_categories.csv).

Each catalogue also has its own canonical/source-format CSV and alias map. Files
with `banded_` are the band catalogue; unprefixed catalogue files are Main.
See [movement categories and regeneration](MOVEMENT-CATEGORIES.md).

## Band routing

Anything explicitly naming band, bands, banded or Theraband in its canonical title
or aliases belongs only to Banded. This includes assisted, resisted, reverse-band,
optional-band and band-or-machine alternatives. An exercise with alternatives
keeps its original identity; it is not duplicated across catalogues. Unclear names
are removed before routing, including unclear banded names.

## Archived source references

The original 1,860-entry cleaned import, 382-entry custom subset and 2,078-name
alias map live only under [archive](archive/README.md), alongside historical
name-cleanup reports. The archive also records the **33 removed entries**: 24
unclear and 9 non-exercise entries. These records support historical ID lookup and
reproducible exports; they are not a selectable catalogue or a pending review queue.
Existing training records and load conventions have not been altered.

This is catalogue data for the future dashboard. The athlete app, Supabase and
Capgo have not been changed by this cleanup.
