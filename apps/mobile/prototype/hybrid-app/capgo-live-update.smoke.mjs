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
must(cfg.plugins.CapacitorUpdater.autoUpdate === true, 'autoUpdate enabled for dogfood OTA');
must(cfg.plugins.CapacitorUpdater.defaultChannel === 'dogfood', 'dogfood channel');
must(!cfg.server || !cfg.server.url, 'no server.url — bundled assets remain default (Netlify not forced into WebView)');
must(bridge.includes('notifyLiveUpdateReady'), 'native-bridge Capgo handshake');
must(bridge.includes("plugin('CapacitorUpdater')"), 'uses CapacitorUpdater plugin');
must(bridge.includes("return Promise.resolve('skipped')") || bridge.includes("'skipped'"), 'browser skip path');
must(bridge.includes('function probeLiveUpdate'), 'probeLiveUpdate for banner');
must(bridge.includes('function applyLiveUpdate'), 'applyLiveUpdate reloads ready bundle');
must(bridge.includes("addListener(ev, ping)") || bridge.includes('addListener(ev, ping)'), 'Capgo event listener loop');
must(bridge.includes('downloadComplete'), 'listens when bundle is ready');
must(bridge.includes('updateAvailable'), 'listens when Capgo finds a newer bundle');
must(bridge.includes('getNextBundle'), 'reads pending next bundle');
must(bridge.includes('getLatest'), 'asks Capgo for channel latest');
must(gradle.includes("project(':capgo-capacitor-updater')"), 'android gradle wires Capgo');
must(settings.includes("include ':capgo-capacitor-updater'"), 'settings.gradle includes Capgo');
must(upload.includes('CAPGO_TOKEN'), 'upload script gated on CAPGO_TOKEN');
must(upload.includes('exit 0'), 'upload script soft-skips without token by default');
must(upload.includes('CAPGO_REQUIRE'), 'upload script can hard-fail when CAPGO_REQUIRE=1');
must(existsSync(join(root, 'scripts/ship-capgo.sh')), 'ship-capgo.sh exists for dogfood+live');
const ship = readFileSync(join(root, 'scripts/ship-capgo.sh'), 'utf8');
must(ship.includes('channel set live'), 'ship pins live channel');
must(ship.includes('exit 1'), 'ship fails hard without token');
must(readme.includes('Capgo') && readme.includes('autoUpdate'), 'README documents Capgo + opt-in');
must(readme.includes('Reversible') || readme.includes('reversible'), 'README documents reversible path');
must(existsSync(join(root, 'scripts/upload-capgo-bundle.sh')), 'upload script exists');

const html = readFileSync(join(dir, 'index.html'), 'utf8');
must(html.includes('function otaBannerHtml'), 'Home/Settings render an OTA banner');
must(html.includes('id="otaBanner"') || html.includes("id='otaBanner'") || html.includes('id=otaBanner'), 'otaBanner mount');
must(html.includes('Restart now'), 'ready state has Restart now');
must(html.includes('function applyOtaUpdate'), 'applyOtaUpdate from banner');
must(html.includes('function refreshOtaBanner'), 'refreshOtaBanner after probe');
must(!html.includes('Check for updates'), 'do not revive coach-pull Check for updates copy');
must(html.includes('Look for app update'), 'Settings can look for an app update');
must(html.includes('.ota-banner'), 'OTA banner CSS');

if (failures.length) {
  console.error('capgo-live-update.smoke FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('capgo-live-update.smoke: ok (plugin present, autoUpdate on, fail-soft handshake)');
