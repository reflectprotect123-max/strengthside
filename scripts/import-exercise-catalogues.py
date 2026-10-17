"""Generate atomic Supabase seed SQL from the validated Main/Banded catalogues.

No credentials, network calls, archived training records or athlete maxes.
Apply the catalogue migration first; this seed can safely be applied repeatedly.
"""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'docs/data/trainheroic-library'


def literal(value):
    return "'" + value.replace("'", "''") + "'"


def build_sql():
    subprocess.run([sys.executable, str(ROOT / 'scripts/categorise-exercise-library.py'), '--check'],
                   cwd=ROOT, check=True, stdout=subprocess.DEVNULL)
    sources, exercises, seen = [], [], set()
    for prefix, catalogue, expected in [('', 'main', 1674), ('banded_', 'banded', 153)]:
        raw = (DATA / (prefix + 'exercise_movement_library.json')).read_bytes()
        payload = json.loads(raw)
        assert payload['schema_version'] == 2 and payload['catalogue'] == catalogue
        assert len(payload['exercises']) == expected
        sources.append({'catalogue': catalogue, 'schema_version': 2, 'taxonomy': payload['taxonomy'],
                        'source_sha256': hashlib.sha256(raw).hexdigest(), 'exercise_count': expected})
        for exercise in payload['exercises']:
            eid = exercise['canonical_exercise_id']
            assert eid not in seen, 'Duplicate canonical identity'
            seen.add(eid)
            assert exercise['review_status'] == 'classified_from_name'
            exercises.append(dict(exercise, catalogue=catalogue))
    source_json = literal(json.dumps(sources, ensure_ascii=False))
    exercise_json = literal(json.dumps(exercises, ensure_ascii=False))
    # Temporary typed tables make malformed data fail before either destination changes.
    return f"""begin;
set local standard_conforming_strings = on;
select pg_advisory_xact_lock(hashtext('clean-exercise-catalogue-import'));
create temporary table catalogue_source_import (like public.exercise_catalogue_sources including defaults) on commit drop;
create temporary table catalogue_exercise_import (like public.exercise_catalogue including defaults) on commit drop;
insert into catalogue_source_import(catalogue,schema_version,taxonomy,source_sha256,exercise_count)
select catalogue,schema_version,taxonomy,source_sha256,exercise_count
from jsonb_populate_recordset(null::public.exercise_catalogue_sources,{source_json}::jsonb);
insert into catalogue_exercise_import
select * from jsonb_populate_recordset(null::public.exercise_catalogue,{exercise_json}::jsonb);
-- Exact conflicts are no-ops. Never overwrite a different catalogue/version silently.
insert into public.exercise_catalogue_sources select * from catalogue_source_import on conflict do nothing;
insert into public.exercise_catalogue select * from catalogue_exercise_import on conflict do nothing;
do $verify$
begin
  if exists(select catalogue,schema_version,taxonomy,source_sha256,exercise_count from catalogue_source_import
    except select catalogue,schema_version,taxonomy,source_sha256,exercise_count from public.exercise_catalogue_sources)
    or exists(select * from catalogue_exercise_import except select * from public.exercise_catalogue)
    or exists(select * from public.exercise_catalogue except select * from catalogue_exercise_import)
    or (select count(*) from public.exercise_catalogue_sources) <> 2
  then raise exception 'Catalogue mismatch: entire import rolled back'; end if;
end $verify$;
commit;
select catalogue,count(*) as exercises,sum(cardinality(aliases)) as aliases,
  count(*) filter(where in_custom_library) as custom_exercises
from public.exercise_catalogue group by catalogue order by catalogue;
"""


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    args.output.write_text(build_sql(), encoding='utf-8')
    print('Generated validated, atomic catalogue import:', args.output)
