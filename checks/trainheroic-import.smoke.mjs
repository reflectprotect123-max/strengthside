/**
 * Smoke: TrainHeroic import script produces mergeImportPayload-compatible JSON.
 */
import { readFileSync, existsSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const sampleCsv = join(repoRoot, 'test/fixtures/trainheroic-import-sample.csv');
const outPath = join(repoRoot, 'test/fixtures/trainheroic-import-sample-out.json');

function must(cond, msg) {
  if (!cond) throw new Error(msg);
}

if (existsSync(outPath)) unlinkSync(outPath);

execFileSync('node', ['scripts/import-trainheroic-history.mjs', sampleCsv], {
  cwd: repoRoot,
  env: { ...process.env, TH_IMPORT_OUT: 'test/fixtures/trainheroic-import-sample-out.json' },
  stdio: 'pipe',
});

must(existsSync(outPath), 'import output missing');
const payload = JSON.parse(readFileSync(outPath, 'utf8'));

must(payload.state?.sessions?.length >= 2, 'expected sessions');
must(payload.state?.strengthState?.loadHints, 'expected loadHints');
must(payload.state?.meta?.thTitleAliases, 'expected thTitleAliases');

const benchHint = payload.state.strengthState.loadHints['core-bench-press'];
must(benchHint && benchHint.loadKg > 0, 'bench press load hint');

const aliases = payload.state.meta.thTitleAliases;
must(aliases['Bench Press'] === 'core-bench-press', 'Bench Press maps to canonical id');
must(aliases['DB Lateral Raise'] === 'core-lateral-raise', 'DB Lateral Raise maps');

const alphaUses = Object.keys(aliases).filter((k) => k.includes('Rare Custom'));
must(alphaUses.length === 1, 'custom lift registered once with >3 uses');

const custom = (payload.state.exercises || []).find((e) => e.name === 'Rare Custom Lift Alpha');
must(custom && custom.id.startsWith('th-custom-'), 'custom exercise created');

console.log('trainheroic-import.smoke: ok');
