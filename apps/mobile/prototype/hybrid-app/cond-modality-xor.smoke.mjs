import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');

function must(c, m) {
  if (!c) throw new Error(m);
}

function slice(name) {
  const i = html.indexOf('function ' + name);
  if (i < 0) throw new Error('missing ' + name);
  return html.slice(i, i + 3200);
}

must(html.includes('unitLock'), 'cond builder unitLock field missing');
must(html.includes('targetRpm'), 'cond builder targetRpm field missing');
must(
  html.includes('One unit for this block'),
  'builder helper meta for unit XOR missing',
);
must(html.includes('setCondBuilderUnitLock'), 'unit lock chip handler missing');
must(html.includes('setCondBuilderNum(\'targetRpm\''), 'fan bike RPM input path missing');

const render = slice('renderCondBuilder');
must(render.includes('condBuilderUnitChipsHtml'), 'renderCondBuilder must use unit chip control');

const chips = slice('condBuilderUnitChipsHtml');
must(chips.includes('aria-pressed'), 'unit chips must expose aria-pressed');

const fromBuilder = slice('condBlockTargetsFromBuilder');
must(
  fromBuilder.includes('targetRpm') && fromBuilder.includes('targetWatts'),
  'condBlockTargetsFromBuilder must emit XOR targets',
);
must(
  /targetWatts\s*=\s*''|targetWatts:''/.test(fromBuilder) &&
    /targetRpm\s*=\s*''|targetRpm:''/.test(fromBuilder),
  'save path must clear opposing unit when one is locked',
);

const adaptive = slice('condAdaptiveModality');
must(
  adaptive.includes("lock==='rpm'") || adaptive.includes('unitLock'),
  'condAdaptiveModality must honour unitLock rpm',
);

must(!html.includes('wattsToRpm'), 'no silent watts→rpm conversion helper');
must(!html.includes('rpmToWatts'), 'no silent rpm→watts conversion helper');
must(!html.includes('wattsFromRpm'), 'no silent rpm→watts conversion helper');

console.log('cond-modality-xor.smoke: ok');
