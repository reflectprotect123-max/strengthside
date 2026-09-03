#!/usr/bin/env node
/**
 * Cond thin twin: 3 Easy/Med/Hard bands, plan-line helpers, mm:ss, cache bump.
 * Run: node apps/mobile/prototype/hybrid-app/cond-thin-twin.smoke.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = __dirname;
const failures = [];
function must(cond, msg) {
  if (!cond) failures.push(msg);
}

const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(dir, 'service-worker.js'), 'utf8');
const adapterSrc = fs.readFileSync(path.join(dir, 'engine-adapter.js'), 'utf8');

must(html.includes("LOCAL_BUILD='the-hybrid-athlete-engine-v159'"), 'LOCAL_BUILD v90');
must(sw.includes('the-hybrid-athlete-engine-v159'), 'service worker cache v90');
must(html.includes('function formatMmSs(') && html.includes('function parseMmSs('), 'mm:ss helpers');
must(html.includes('function condPlanLineBuilder(') && html.includes('function condPlanLineTask('), 'plan line helpers');
must(html.includes('mph-efforts') && html.includes('mph-planline'), 'thin twin CSS/classes');
must(html.includes('Heart rate · 3 bands today'), '3-band logger copy');
must(!adapterSrc.includes('Split Overload into anaerobic'), 'adapter no longer splits overload');
must(adapterSrc.includes("name: 'Easy'") && adapterSrc.includes("name: 'Hard'"), 'adapter Easy/Hard labels');

const sandbox = {
  console,
  Math,
  Date,
  Number,
  String,
  Array,
  Object,
  JSON,
  parseInt,
  isNaN,
  undefined,
  Uint8Array,
  DataView,
  ArrayBuffer,
};
sandbox.globalThis = sandbox;
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(dir, 'engine-bundle.js'), 'utf8'), sandbox);
vm.runInContext(adapterSrc, sandbox);

const zones = sandbox.EngineAdapter.zonesForProfile({ maxHr: 190, restingHr: 60 });
must(zones.length === 3, `zones length ${zones.length}`);
must(zones.map((z) => z.name).join('/') === 'Easy/Medium/Hard', `names ${zones.map((z) => z.name)}`);
must(zones[0].color === '#33c4ff' && zones[2].color === '#ff5b57', 'band colors blue/red');
must(zones[0].hi < zones[1].lo && zones[1].hi < zones[2].lo, 'exclusive band edges');

// mm:ss pure checks (mirrors index.html helpers)
vm.runInContext(
  `
  function num(v){const n=Number(v);return Number.isFinite(n)?n:0}
  function formatMmSs(sec){sec=Math.max(0,Math.round(num(sec)||0));let m=Math.floor(sec/60),s=sec%60;return m+':'+String(s).padStart(2,'0')}
  function parseMmSs(raw){raw=String(raw==null?'':raw).trim();if(!raw)return 0;if(/^\\d+$/.test(raw))return Math.max(0,num(raw));let m=raw.match(/^(\\d+)\\s*:\\s*(\\d{1,2})$/);if(m)return Math.max(0,num(m[1])*60+Math.min(59,num(m[2])));return Math.max(0,Math.round(num(raw)||0))}
  globalThis.__fmt = formatMmSs;
  globalThis.__parse = parseMmSs;
`,
  sandbox,
);
must(sandbox.__fmt(240) === '4:00', `formatMmSs(240)=${sandbox.__fmt(240)}`);
must(sandbox.__fmt(180) === '3:00', `formatMmSs(180)=${sandbox.__fmt(180)}`);
must(sandbox.__parse('4:00') === 240, `parseMmSs 4:00=${sandbox.__parse('4:00')}`);
must(sandbox.__parse('3:00') === 180, `parseMmSs 3:00=${sandbox.__parse('3:00')}`);
must(sandbox.__parse('90') === 90, 'parseMmSs plain seconds');

if (failures.length) {
  console.error('cond-thin-twin.smoke FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('cond-thin-twin.smoke OK');
