/**
 * Smoke: native BLE bridge for APK HR strap + Echo FTMS.
 * Run: node apps/mobile/prototype/hybrid-app/native-ble.smoke.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));

function must(cond, msg) {
  if (!cond) throw new Error(msg);
}

const ble = readFileSync(join(dir, 'native-ble.js'), 'utf8');
const echo = readFileSync(join(dir, 'echo-ftms.js'), 'utf8');
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const sw = readFileSync(join(dir, 'service-worker.js'), 'utf8');
const capPkg = readFileSync(join(dir, '../../capacitor/package.json'), 'utf8');

must(ble.includes('global.NativeBle'), 'NativeBle export');
must(ble.includes('connectHeartRate'), 'HR connect');
must(ble.includes('connectEchoFtms'), 'Echo FTMS connect');
must(ble.includes('androidNeverForLocation'), 'Android 12+ BLE without location');
must(ble.includes('00001826-0000-1000-8000-00805f9b34fb'), 'FTMS service UUID');
must(ble.includes('0000180d-0000-1000-8000-00805f9b34fb'), 'HR service UUID');

must(echo.includes('NativeBle.connectEchoFtms'), 'Echo delegates to native BLE');
must(echo.includes('nativeBleAvailable'), 'Echo native availability check');

must(html.includes('./native-ble.js'), 'index loads native-ble.js');
must(html.includes('NativeBle.isAvailable'), 'HR uses native BLE availability');
must(html.includes('NativeBle.connectHeartRate'), 'HR uses native connect');
must(html.includes("LOCAL_BUILD='the-hybrid-athlete-engine-v112'"), 'cache v90');

must(sw.includes('./native-ble.js'), 'service worker caches native-ble.js');
must(sw.includes('the-hybrid-athlete-engine-v112'), 'service worker cache v90');

must(capPkg.includes('@capacitor-community/bluetooth-le'), 'Capacitor BLE plugin dependency');

console.log('native-ble.smoke: ok');
