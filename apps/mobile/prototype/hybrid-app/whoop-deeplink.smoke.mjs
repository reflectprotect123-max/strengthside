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
const manifest = join(dir, '../../capacitor/android/app/src/main/AndroidManifest.xml');
const strings = join(dir, '../../capacitor/android/app/src/main/res/values/strings.xml');

const failures = [];
function must(cond, msg) {
  if (!cond) failures.push(msg);
}

must(existsSync(manifest), 'AndroidManifest.xml missing');
must(existsSync(strings), 'strings.xml missing');

const xml = readFileSync(manifest, 'utf8');
const str = readFileSync(strings, 'utf8');

must(/custom_url_scheme/.test(str), 'strings.xml must define custom_url_scheme');
must(/com\.hybrid\.athlete/.test(str), 'custom_url_scheme must be com.hybrid.athlete');

must(/android.intent.action.VIEW/.test(xml), 'AndroidManifest must have VIEW intent-filter for OAuth return');
must(/android.intent.category.BROWSABLE/.test(xml), 'VIEW intent-filter must be BROWSABLE');
must(
  /android:scheme="@string\/custom_url_scheme"/.test(xml) || /android:scheme="com\.hybrid\.athlete"/.test(xml),
  'VIEW intent-filter must bind custom_url_scheme',
);
must(/android:launchMode="singleTask"/.test(xml), 'MainActivity should be singleTask for OAuth return');

if (failures.length) {
  console.error('whoop-deeplink.smoke FAIL');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}
console.log('whoop-deeplink.smoke: ok — com.hybrid.athlete:// intent-filter present');
