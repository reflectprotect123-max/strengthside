/**
 * Smoke: ML Kit scan() returns { barcodes: [...] } — bridge must parse that shape.
 * Run: node apps/mobile/prototype/hybrid-app/native-bridge.barcode.smoke.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(dir, 'native-bridge.js'), 'utf8');

function must(cond, msg) {
  if (!cond) throw new Error(msg);
}

must(src.includes('function pickProductBarcode('), 'pickProductBarcode helper');
must(src.includes('result.barcodes'), 'scan() must read result.barcodes');
must(!/result\.rawValue\s*\|\|\s*result\.displayValue/.test(src), 'must not read rawValue from scan result root');
must(src.includes('barcode_cancelled'), 'handle scan cancel');
must(src.includes('EAN_13'), 'product barcode formats');
must(/digits\.length >= 8/.test(src), 'validate barcode digit length');

console.log('native-bridge.barcode.smoke: ok');
