// Native strength boundary: verify the shell cannot load the combined app or OTA.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const athlete = join(dirname(fileURLToPath(import.meta.url)), '..');
const cap = join(athlete, '..', 'mobile', 'capacitor');
const read = (p) => readFileSync(p, 'utf8');
const cfg = JSON.parse(read(join(cap, 'capacitor.config.json')));
const pkg = JSON.parse(read(join(cap, 'package.json')));
assert.equal(cfg.appName, 'Hybrid Strength');
assert.equal(cfg.webDir, '../../athlete');
assert.equal(cfg.appId, 'com.hybrid.athlete');
assert.equal(cfg.plugins.CapacitorUpdater, undefined, 'no legacy update configuration');
assert.equal(pkg.dependencies['@capgo/capacitor-updater'], undefined, 'no legacy update plugin');
assert.ok(!read(join(cap, 'android/app/capacitor.build.gradle')).includes('capgo-capacitor-updater'));
assert.ok(!read(join(cap, 'android/capacitor.settings.gradle')).includes('capgo-capacitor-updater'));
assert.ok(!read(join(athlete, 'native-bridge.js')).includes('CapacitorUpdater'));
assert.ok(read(join(athlete, 'index.html')).includes('strength-only.js'));
assert.equal(JSON.parse(read(join(athlete, 'PRODUCT.json'))).hybridProduct, 'strength');
for (const p of ['engine.js', 'conditioning', 'adaptive-bundle.js']) assert.ok(!existsSync(join(athlete, p)), p + ' must not ship');
const staged = join(cap, 'android/app/src/main/assets/public');
if (existsSync(staged)) {
  assert.equal(JSON.parse(read(join(staged, 'PRODUCT.json'))).hybridProduct, 'strength');
  for (const p of ['engine.js', 'conditioning', 'adaptive-bundle.js']) assert.ok(!existsSync(join(staged, p)), 'staged ' + p);
}
console.log('strength-native-boundary: ok');
