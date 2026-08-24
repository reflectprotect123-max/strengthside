/**
 * Smoke: LabelScan paste path ↔ nutrition-core parse (no camera / ML Kit).
 * Run: node apps/mobile/prototype/hybrid-app/label-scan.smoke.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const bundle = readFileSync(join(dir, 'nutrition-bundle.js'), 'utf8');
const scan = readFileSync(join(dir, 'label-scan.js'), 'utf8');

const sandbox = { console, setTimeout, clearTimeout };
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
sandbox.document = {
  createElement: () => ({ set src(v) {}, set async(v) {}, onload: null, onerror: null }),
  head: { appendChild() {} },
};
vm.createContext(sandbox);
vm.runInContext(bundle, sandbox);
vm.runInContext(scan, sandbox);

const { parsed } = sandbox.LabelScan.parsePastedText(
  'Energy 124Cal (520kJ)\nProtein 3.2g\nFat, total 2.1g\nCarbohydrate 15.6g',
);
if (parsed.calories < 120 || parsed.calories > 128) throw new Error('calories');
if (Math.abs(parsed.proteinG - 3.2) > 0.01) throw new Error('protein');
if (Math.abs(parsed.carbsG - 15.6) > 0.01) throw new Error('carbs');
if (Math.abs(parsed.fatG - 2.1) > 0.01) throw new Error('fat');

const oneLine = sandbox.LabelScan.parsePastedText(
  'Energy 124Cal (520kJ) Protein 3.2g Fat, total 2.1g Carbohydrate 15.6g',
);
if (Math.abs(oneLine.parsed.proteinG - 3.2) > 0.01) throw new Error('one-line protein');
if (Math.abs(oneLine.parsed.fatG - 2.1) > 0.01) throw new Error('one-line fat');
if (Math.abs(oneLine.parsed.carbsG - 15.6) > 0.01) throw new Error('one-line carbs');

const carbsAlias = sandbox.LabelScan.parsePastedText(
  'Energy 520kJ Protein 3.2g Fat, total 2.1g Carbs 15.6g',
);
if (Math.abs(carbsAlias.parsed.carbsG - 15.6) > 0.01) throw new Error('carbs alias');

let emptyOk = false;
try {
  sandbox.LabelScan.parsePastedText('Ingredients: flour');
} catch (e) {
  emptyOk = e && e.code === 'empty_label';
}
if (!emptyOk) throw new Error('expected empty_label');

console.log('label-scan.smoke: ok');
