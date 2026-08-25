#!/usr/bin/env node
/**
 * Capgo wiring is additive + fail-soft. Run:
 *   node apps/mobile/prototype/hybrid-app/capgo-live-update.smoke.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const root = join(dir, '../../capacitor');
const failures = [];
function must(cond, msg) {
  if (!cond) failures.push(msg);
}

const bridge = readFileSync(join(dir, 'native-bridge.js'), 'utf8');
const cfg = JSON.parse(readFileSync(join(root, 'capacitor.config.json'), 'utf8'));
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const gradle = readFileSync(join(root, 'android/app/capacitor.build.gradle'), 'utf8');
const settings = readFileSync(join(root, 'android/capacitor.settings.gradle'), 'utf8');
const upload = readFileSync(join(root, 'scripts/upload-capgo-bundle.sh'), 'utf8');
const readme = readFileSync(join(root, 'README.md'), 'utf8');

must(!!pkg.dependencies['@capgo/capacitor-updater'], 'package.json has @capgo/capacitor-updater');
must(cfg.plugins && cfg.plugins.CapacitorUpdater, 'CapacitorUpdater in capacitor.config.json');
must(cfg.plugins.CapacitorUpdater.autoUpdate === false, 'autoUpdate stays false until opt-in');
must(cfg.plugins.CapacitorUpdater.defaultChannel === 'dogfood', 'dogfood channel');
must(!cfg.server || !cfg.server.url, 'no server.url — bundled assets remain default (Netlify not forced into WebView)');
must(bridge.includes('notifyLiveUpdateReady'), 'native-bridge Capgo handshake');
must(bridge.includes("plugin('CapacitorUpdater')"), 'uses CapacitorUpdater plugin');
must(bridge.includes("return Promise.resolve('skipped')") || bridge.includes("'skipped'"), 'browser skip path');
must(gradle.includes("project(':capgo-capacitor-updater')"), 'android gradle wires Capgo');
must(settings.includes("include ':capgo-capacitor-updater'"), 'settings.gradle includes Capgo');
must(upload.includes('CAPGO_TOKEN'), 'upload script gated on CAPGO_TOKEN');
must(upload.includes('exit 0'), 'upload script skips cleanly without token');
must(readme.includes('Capgo') && readme.includes('autoUpdate'), 'README documents Capgo + opt-in');
must(readme.includes('Reversible') || readme.includes('reversible'), 'README documents reversible path');
must(existsSync(join(root, 'scripts/upload-capgo-bundle.sh')), 'upload script exists');

if (failures.length) {
  console.error('capgo-live-update.smoke FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('capgo-live-update.smoke: ok (plugin present, autoUpdate off, fail-soft handshake)');
