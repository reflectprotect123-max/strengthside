"""Package only the usable Main/Banded catalogues for download; exclude archives."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'docs/data/trainheroic-library'
FILES = ('canonical_exercise_library.csv', 'custom_library_canonical.csv',
         'exercise_alias_map.csv', 'exercise_movement_categories.csv',
         'custom_library_movement_categories.csv', 'exercise_movement_library.json')


def export(output):
    subprocess.run([sys.executable, str(ROOT / 'scripts/categorise-exercise-library.py'), '--check'], cwd=ROOT, check=True, stdout=subprocess.DEVNULL)
    files = {}
    catalogues = {}
    for prefix, folder in [('', 'main'), ('banded_', 'banded')]:
        for name in FILES:
            files[folder + '/' + name] = (DATA / (prefix + name)).read_bytes()
        payload = json.loads(files[folder + '/exercise_movement_library.json'])
        assert payload['catalogue'] == folder and payload['schema_version'] == 2
        assert all(e['review_status'] == 'classified_from_name' for e in payload['exercises'])
        catalogues[folder] = payload['exercises']
    assert not ({e['canonical_exercise_id'] for e in catalogues['main']} &
                {e['canonical_exercise_id'] for e in catalogues['banded']})
    summary = json.loads((DATA / 'movement_category_summary.json').read_text())
    counts = summary['catalogues']
    files['README.md'] = f'''# Main and Banded exercise catalogues

Main: {counts['main']['exercise_count']:,} exercises, including {counts['main']['custom_count']} custom entries.
Banded: {counts['banded']['exercise_count']:,} exercises, including {counts['banded']['custom_count']} custom entries.
{summary['removed_count']} unclear/non-exercise entries are excluded from both catalogues and aliases.

Each folder contains CSVs for spreadsheet use and exercise_movement_library.json
for dashboard import. Custom-library CSVs contain just your custom subset.
Retained IDs and aliases are unchanged. Explicit band references, including
assisted, resisted, reverse bands and optional bands, live only in Banded.
The catalogues do not overlap. Metrics, load conventions and app behaviour are unchanged.

SOURCE.json records file hashes. This ZIP contains only usable exports, not
archived originals or the removal audit. Source repository: reflectprotect123-max/strengthside.
'''.encode()
    files['SOURCE.json'] = (json.dumps({'schema_version': 2, 'sha256': {
        name: hashlib.sha256(body).hexdigest() for name, body in files.items()
    }}, indent=2) + '\n').encode()
    output.mkdir(parents=True, exist_ok=True)
    dest = output / 'exercise-catalogues-main-and-banded.zip'
    with zipfile.ZipFile(dest, 'w') as archive:
        for name, body in sorted(files.items()):
            info = zipfile.ZipInfo(name)  # Stable timestamps make identical inputs reproducible.
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, body)
    with zipfile.ZipFile(dest) as archive:
        assert archive.testzip() is None
        for name, digest in json.loads(archive.read('SOURCE.json'))['sha256'].items():
            assert hashlib.sha256(archive.read(name)).hexdigest() == digest, name
    print(f'Verified {len(files)} files: {dest}')
    return dest


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output-dir', type=Path, default=ROOT / 'dist/catalogue-export')
    export(parser.parse_args().output_dir)
