"""Export the complete pre-removal workout builder and a runnable source preview."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parent.parent
SOURCE = '5551ef5a4394f16582c3a9687c38bb1e02859508'


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)


def export(ref, output):
    commit = git('rev-parse', '--verify', '--end-of-options', ref + '^{commit}').decode().strip()
    paths = git('ls-tree', '-r', '--name-only', commit).decode().splitlines()
    selected = [p for p in paths if p.startswith(('apps/athlete/', 'apps/shared/', 'checks/browser/', 'prototypes/strength-'))
                or p in ('scripts/stage-athlete.mjs', 'scripts/stage-athlete.test.mjs', 'scripts/sync-training-core.mjs',
                         'docs/training-contracts.md', 'docs/superpowers/specs/2026-10-16-session-builder-replacement-design.md')]
    files = {p: git('show', commit + ':' + p) for p in selected}
    for required in ('apps/athlete/library-ui.js', 'apps/athlete/library.js', 'apps/athlete/library.css', 'apps/athlete/app.js', 'apps/athlete/index.html'):
        if required not in files:
            raise RuntimeError('Source does not contain the full builder: ' + required)
    files['README.md'] = f'''# Full Strength workout builder export

Source: reflectprotect123-max/strengthside @ {commit} (before removal).

## Open the complete working preview

From this folder run `python3 -m http.server 4173 --directory apps/athlete`, then
open http://localhost:4173. Choose Library, then Create Session Template.
The original app shell and logger are included because the builder depends on
their shared contracts, state and rendering. No installation is needed to preview.

## Builder source map

- apps/athlete/library-ui.js: full creation/editing wizard, warm-up and cool-down,
  exercise/circuit pickers, numeric keypad, metrics, tempo, supersets, rep ranges,
  per-set prescriptions, final AMRAP and calendar posting.
- apps/athlete/library.js: template/catalog operations and compile-to-logger contract.
- apps/athlete/library.css: original builder styling.
- apps/athlete/app.js and index.html: application state, navigation and entry points.
- apps/shared: prescription, metric and strength contracts used by the builder.
- apps/athlete/plan-sync.js: existing template/assignment transport contract.
- apps/athlete/library*.test.js and checks/browser: original regression tests.
- prototypes/strength-*: original visual references.

To run the original builder unit tests: `node --test apps/athlete/library.test.js
apps/athlete/library-ui.test.js`. Browser tests additionally need
`npm install` and `npx playwright install chromium`, then `npm run test:browser`.

Use this as a source backup for the Coach dashboard. The app's public Supabase
configuration is preserved for compatibility; no private keys, account sessions,
local athlete data, handoff vault, node_modules or native build outputs are included.
The Engine page is a dependency snapshot, not a request to modify conditioning.

SOURCE.json records the source commit and SHA256 of each original file.
'''.encode()
    files['package.json'] = json.dumps({'private': True, 'type': 'module', 'scripts': {
        'test:builder': 'node --test apps/athlete/library.test.js apps/athlete/library-ui.test.js',
        'test:browser': 'playwright test -c checks/browser/playwright.config.mjs'},
        'devDependencies': {'playwright': '1.57.0'}}, indent=2).encode()
    manifest = {p: hashlib.sha256(body).hexdigest() for p, body in files.items()}
    files['SOURCE.json'] = json.dumps({'repository': 'reflectprotect123-max/strengthside', 'commit': commit, 'sha256': manifest}, indent=2).encode()
    output.mkdir(parents=True, exist_ok=True)
    dest = output / f'strength-workout-builder-{commit[:8]}.zip'
    with zipfile.ZipFile(dest, 'w', zipfile.ZIP_DEFLATED) as archive:
        for path, body in sorted(files.items()):
            archive.writestr(path, body)
    with zipfile.ZipFile(dest) as archive:
        assert archive.testzip() is None
        for path, digest in manifest.items():
            assert hashlib.sha256(archive.read(path)).hexdigest() == digest, path
    print(f'Verified {len(files)} files: {dest}')
    return dest


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--source-ref', default=SOURCE)
    parser.add_argument('--output-dir', type=Path, default=ROOT / 'dist/builder-export')
    args = parser.parse_args()
    export(args.source_ref, args.output_dir)
