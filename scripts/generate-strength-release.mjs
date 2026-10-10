import {readFileSync,writeFileSync} from 'node:fs';
import {runtimeAssets} from './stage-athlete.mjs';
const rel=JSON.parse(readFileSync(new URL('../apps/athlete/release.json',import.meta.url),'utf8'));
if(!/^\d+\.\d+\.\d+$/.test(rel.version)||!Number.isSafeInteger(rel.androidVersionCode)||rel.androidVersionCode<1)throw new Error('Invalid release metadata');
function output(path,text){const p=new URL(path,import.meta.url);if(process.argv.includes('--check')){if(readFileSync(p,'utf8')!==text)throw new Error(`${path} stale; run node scripts/generate-strength-release.mjs`);}else writeFileSync(p,text);}
output('../apps/athlete/release.js',`/* Generated from release.json. */\nwindow.StrengthRelease = ${JSON.stringify({...rel,build:'strength-brain-v'+rel.version})};\n`);
const gradlePath='../apps/mobile/capacitor/android/app/build.gradle';
let gradle=readFileSync(new URL(gradlePath,import.meta.url),'utf8').replace(/versionCode \d+/,`versionCode ${rel.androidVersionCode}`).replace(/versionName "[^"]+"/,`versionName "${rel.version}"`);output(gradlePath,gradle);
const p='../apps/athlete/service-worker.js',worker=readFileSync(new URL(p,import.meta.url),'utf8').replace(/const CACHE = '[^']+';/,`const CACHE = 'strength-brain-${rel.version}';`).replace(/const ASSETS = .*?;/,`const ASSETS = ${JSON.stringify(runtimeAssets())};`);output(p,worker);
