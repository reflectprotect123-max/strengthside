import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const whoop = fs.readFileSync(path.join(__dirname, 'whoop.js'), 'utf8');

function must(cond, msg) {
  if (!cond) throw new Error(msg);
}

must(html.includes("LOCAL_BUILD='the-hybrid-athlete-blank-v182'"), 'LOCAL_BUILD v179');
must(html.includes('function athWhoopDialSvg'), 'Whoop-style dial helper');
must(html.includes('ath-whoop-dials'), 'three-dial row on home');
must(html.includes('>SLEEP<') || html.includes("'SLEEP'") || html.includes('"SLEEP"'), 'SLEEP dial label');
must(html.includes('>RECOVERY<') || html.includes("'RECOVERY'") || html.includes('"RECOVERY"'), 'RECOVERY dial label');
must(html.includes('>STRAIN<') || html.includes("'STRAIN'") || html.includes('"STRAIN"'), 'STRAIN dial label');
must(/#9[Dd][Bb]4[Cc]8/.test(html), 'sleep steel-blue arc #9db4c8');
must(/#16[Ff]26[Bb]/.test(html), 'recovery neon green arc #16f26b');
must(/#1[Bb][Aa]3[Ff][Ff]/.test(html), 'strain blue arc #1ba3ff');
must(!html.includes("athRingsSvg([{progress:m.recovery/100,color:'#3dff9e'}"), 'nested triple-ring sleep module removed');
must(whoop.includes('whoopSleepPerformance'), 'WHOOP stores raw sleep performance 0–100');
must(html.includes('function athSleepPercent'), 'athSleepPercent helper');
must(html.includes('ath-whoop-n'), 'percent dials stack number over %');
must(html.includes('flex-direction:column') && html.includes('ath-whoop-dial-val'), 'dial value column layout');

function extractFn(src, name) {
  const start = src.indexOf('function ' + name);
  must(start >= 0, name + ' present');
  let i = start;
  let depth = 0;
  let started = false;
  for (; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') {
      depth++;
      started = true;
    } else if (ch === '}') {
      depth--;
      if (started && depth === 0) {
        i++;
        break;
      }
    }
  }
  return src.slice(start, i);
}

const sandbox = {
  num(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  },
  athClamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  },
  athSaneRecovery(raw) {
    const n = Number(raw);
    if (!(n > 0)) return 50;
    return Math.max(0, Math.min(100, Math.round(n)));
  },
  __checkin: {},
  dailyCheckin() {
    return sandbox.__checkin;
  },
  today() {
    return '2026-09-05';
  },
};

vm.createContext(sandbox);
for (const name of ['athSleepPercent', 'athHomeMetrics']) {
  vm.runInContext(extractFn(html, name), sandbox);
}

sandbox.__checkin = {
  whoopRecovery: 85,
  whoopStrain: 14.2,
  whoopSleepPerformance: 74,
  sleepQuality: 7,
};
let m = sandbox.athHomeMetrics();
must(m.sleep === 74, 'prefers whoopSleepPerformance 74, got ' + m.sleep);
must(m.recovery === 85, 'recovery 85');
must(m.strain === 14.2, 'strain 14.2');

sandbox.__checkin = { whoopRecovery: 60, sleepQuality: 7 };
m = sandbox.athHomeMetrics();
must(m.sleep === 70, 'sleepQuality 7 on 1–10 scale → 70%, got ' + m.sleep);
must(m.sleep !== 100, 'sleep must not clamp to 100 from /5 math');

console.log('whoop-home-dials.smoke: ok');
