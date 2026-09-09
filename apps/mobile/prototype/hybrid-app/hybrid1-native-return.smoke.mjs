#!/usr/bin/env node
/**
 * Allowlist for hybrid1 native OAuth return. Never accept a raw URL from the client.
 * Run: node apps/mobile/prototype/hybrid-app/hybrid1-native-return.smoke.mjs
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_NATIVE_RETURN_URL,
  nativeReturnUrlForAppId,
  sealNativeReturnUrl,
} from '../../../../scripts/hybrid1-native-return-allowlist.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const failures = [];
function must(cond, msg) {
  if (!cond) failures.push(msg);
}

must(DEFAULT_NATIVE_RETURN_URL === 'hybridengine://whoop', 'live hybrid1 default is hybridengine://whoop');
must(nativeReturnUrlForAppId('com.hybrid.athlete') === 'com.hybrid.athlete://whoop', 'mixed scheme');
must(nativeReturnUrlForAppId('com.hybrid.strength') === 'com.hybrid.strength://whoop', 'strength scheme');
must(nativeReturnUrlForAppId('com.hybrid.engine') === 'com.hybrid.engine://whoop', 'engine scheme');
must(nativeReturnUrlForAppId('https://evil.example/steal') === DEFAULT_NATIVE_RETURN_URL, 'https URL is not an appId');
must(nativeReturnUrlForAppId('hybridengine://whoop') === DEFAULT_NATIVE_RETURN_URL, 'scheme string is not an appId');
must(nativeReturnUrlForAppId('') === DEFAULT_NATIVE_RETURN_URL, 'missing appId stays live default');
must(nativeReturnUrlForAppId(undefined) === DEFAULT_NATIVE_RETURN_URL, 'undefined appId stays live default');
must(sealNativeReturnUrl('https://evil.example/?code=1') === DEFAULT_NATIVE_RETURN_URL, 'seal drops open redirects');
must(sealNativeReturnUrl('com.hybrid.strength://whoop') === 'com.hybrid.strength://whoop', 'seal keeps allowlisted');

const whoop = readFileSync(path.join(dir, 'whoop.js'), 'utf8');
const c2 = readFileSync(path.join(dir, 'concept2.js'), 'utf8');
for (const [label, src] of [['whoop.js', whoop], ['concept2.js', c2]]) {
  must(src.includes("client: 'native', appId: nativeAppId()"), `${label} forwards appId on native connect`);
  must(!/returnUrl\s*:/.test(src), `${label} must not send a caller-chosen returnUrl`);
}

const proxy = readFileSync(path.join(dir, 'netlify/functions/_hybrid-proxy.mjs'), 'utf8');
must(proxy.includes('queryStringParameters'), 'proxy forwards query including appId');
must(!proxy.includes('NATIVE_RETURN_URL'), 'proxy is not a real WHOOP handler');

if (failures.length) {
  console.error('hybrid1-native-return.smoke FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('hybrid1-native-return.smoke OK');
