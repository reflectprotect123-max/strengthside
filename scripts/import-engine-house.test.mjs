import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { patchEngineHtml, applyIntegrationOverrides } from './import-engine-house.mjs';

const engineDir = fileURLToPath(new URL('../apps/athlete/engine/', import.meta.url));
const sample = "<script>const NATIVE_APP_ID = 'com.hybrid.athlete'; x.getLatest({channel:'engine-html'})</script></body>\n</html>";

test('patch points the Engine page at this install, its channel and the hallway', () => {
  const out = patchEngineHtml(sample);
  assert.match(out, /NATIVE_APP_ID = 'com\.hybrid\.strength';/);
  assert.match(out, /getLatest\(\{channel:'strength-live'\}\)/);
  assert.match(out, /<script src="hallway\.js"><\/script><\/body>/);
  assert.doesNotMatch(out, /com\.hybrid\.athlete|engine-html/);
});

test('patch refuses an upstream that moved or duplicated a patch point', () => {
  assert.throws(() => patchEngineHtml(sample.replace("'engine-html'", "'other'")), /getLatest/);
  assert.throws(() => patchEngineHtml(sample.replace('</body>', '</body></body>')), /<\/body>/);
  assert.throws(() => patchEngineHtml(sample.replace('com.hybrid.athlete', 'com.hybrid.engine')), /NATIVE_APP_ID/);
});

test('committed Engine house matches its recorded import', () => {
  const upstream = JSON.parse(readFileSync(engineDir + 'UPSTREAM.json', 'utf8'));
  for (const [file, sha] of Object.entries(upstream.output)) {
    const actual = createHash('sha256').update(readFileSync(engineDir + file)).digest('hex');
    assert.equal(actual, sha, `${file} was edited by hand; re-run scripts/import-engine-house.mjs`);
  }
  assert.match(upstream.commit, /^[0-9a-f]{40}$/);
});

test('integration overrides fail safely when WHOOP/date/chart context moved', () => {
  assert.throws(() => applyIntegrationOverrides('unrecognised upstream'), /override 0 matched 0/);
});
