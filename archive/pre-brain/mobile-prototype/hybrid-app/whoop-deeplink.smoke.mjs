/**
 * Android deep-link contract for WHOOP/Concept2 OAuth return.
 * Native callback is com.hybrid.athlete://whoop — without a VIEW intent-filter
 * Android cannot reopen the APK after consent.
 *
 * Run: node apps/mobile/prototype/hybrid-app/whoop-deeplink.smoke.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const mixedManifest = join(dir, '../../capacitor/android/app/src/main/AndroidManifest.xml');
const mixedStrings = join(dir, '../../capacitor/android/app/src/main/res/values/strings.xml');
const root = join(dir, '../../../..');

const failures = [];
function must(cond, msg) {
  if (!cond) failures.push(msg);
}

function checkManifest(label, manifest, strings, scheme) {
  must(existsSync(manifest), `${label}: AndroidManifest.xml missing`);
  must(existsSync(strings), `${label}: strings.xml missing`);
  if (!existsSync(manifest) || !existsSync(strings)) return;
  const xml = readFileSync(manifest, 'utf8');
  const str = readFileSync(strings, 'utf8');
  must(/custom_url_scheme/.test(str), `${label}: strings.xml must define custom_url_scheme`);
  must(str.includes(scheme), `${label}: custom_url_scheme must be ${scheme}`);
  if (label === 'mixed') {
    must(/android:scheme="hybridengine"/.test(xml), 'mixed APK must also register hybridengine:// (live hybrid1 NATIVE_RETURN_URL)');
  }
  must(/android.intent.action.VIEW/.test(xml), `${label}: VIEW intent-filter for OAuth return`);
  must(/android.intent.category.BROWSABLE/.test(xml), `${label}: VIEW intent-filter must be BROWSABLE`);
  must(
    /android:scheme="@string\/custom_url_scheme"/.test(xml) || xml.includes(`android:scheme="${scheme}"`),
    `${label}: VIEW intent-filter must bind custom_url_scheme`,
  );
  must(/android:launchMode="singleTask"/.test(xml), `${label}: MainActivity should be singleTask`);
}

checkManifest('mixed', mixedManifest, mixedStrings, 'com.hybrid.athlete');
checkManifest(
  'strength',
  join(root, 'apps/hybrid-strength/capacitor/android/app/src/main/AndroidManifest.xml'),
  join(root, 'apps/hybrid-strength/capacitor/android/app/src/main/res/values/strings.xml'),
  'com.hybrid.strength',
);
checkManifest(
  'engine',
  join(root, 'apps/hybrid-engine/capacitor/android/app/src/main/AndroidManifest.xml'),
  join(root, 'apps/hybrid-engine/capacitor/android/app/src/main/res/values/strings.xml'),
  'com.hybrid.engine',
);

if (failures.length) {
  console.error('whoop-deeplink.smoke FAIL');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}
console.log('whoop-deeplink.smoke: ok — mixed + product VIEW/BROWSABLE schemes');
