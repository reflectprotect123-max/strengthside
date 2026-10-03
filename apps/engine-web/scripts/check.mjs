import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const html=fs.readFileSync('public/index.html','utf8');let count=0;for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(match[1],{filename:'inline-'+count++});
for(const file of ['web.js','sw.js','native-plugins.js'])new vm.Script(fs.readFileSync('public/'+file,'utf8'),{filename:file});
const manifest=JSON.parse(fs.readFileSync('public/manifest.webmanifest','utf8'));for(const icon of manifest.icons)assert.ok(fs.statSync('public'+icon.src).size>0);
assert.ok(html.includes("['Blue','Green','Red'].map"));assert.ok(html.includes('EngineApp'));assert.ok(html.includes('startNotifications'));assert.ok(html.includes('/web.js'));assert.ok(!html.includes('CLOUDFLARE_API_TOKEN'));assert.ok(!html.includes('sbp_'));assert.ok(!html.includes('service_role'));
console.log('PASS: app scripts, Blue/Green/Red catalogue, browser account/BLE integrations, PWA assets, no privileged-token markers. Inline scripts:',count);
