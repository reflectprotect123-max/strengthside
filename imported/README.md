# Imported from the other repos

The live app stays `apps/athlete/`. These copies are here so the other GitHub repos are not the only place the work exists.

- `the-hybrid-engine1/` — database migrations and the migration check. The SQL files that were missing from `supabase/migrations/` are also copied into that live folder.
- `engine-side/` — older Engine app plus the Supabase WHOOP, coach, and integration functions. Those functions are also copied into `supabase/functions/` where a folder of the same name was not already there.
- `the-adaptivebrain/` — adaptive packages, apps, and docs. The vendor skill mirror and the zip bundles were left behind.

WHOOP client id and secret stay in the Supabase project environment. They were not copied into git. The athlete site still forwards WHOOP calls; this import does not change the live redirect.
