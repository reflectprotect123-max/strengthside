/**
 * Smoke: Add food is barcode-first (scan primary; search secondary).
 * Run: node apps/mobile/prototype/hybrid-app/nutrition-ui.barcode.smoke.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(dir, 'nutrition-ui.js'), 'utf8');

function must(cond, msg) {
  if (!cond) throw new Error(msg);
}

// Primary CTA helpers exist
must(src.includes('function addFood('), 'addFood');
must(src.includes('function showBarcodeSheet(') || src.includes('function openBarcodeAdd('), 'barcode sheet helper');
must(src.includes('lookupTypedBarcode') || src.includes('resolveBarcodeCode'), 'typed barcode lookup');

// Add food opens barcode sheet first (scan is primary CTA inside)
must(
  /function addFood\([\s\S]*?showBarcodeSheet\(meal\)/.test(src),
  'addFood must open barcode sheet first',
);

// Meal Add uses addFood/barcode, not only quickAdd
must(
  /onclick="NutritionUI\.(addFood|scanBarcode)\('\$\{meal\}'\)"/.test(src),
  'meal Add button must go barcode/addFood first',
);

// Main Add food stays barcode-capable
must(src.includes("NutritionUI.addFood()"), 'main Add food button');

// Web fallback: digit entry for barcode without camera
must(/nutBarcodeDigits|type=.*tel|inputmode=.?numeric/.test(src), 'typed barcode input for web');

// Primary button label is Scan barcode (not buried as small secondary)
must(/Scan barcode/.test(src), 'Scan barcode label');
must(
  /btn primary[^"]*"[^>]*>Scan barcode|Scan barcode<\/button>[\s\S]{0,200}Search/.test(src) ||
    /Scan barcode[\s\S]{0,400}Search food|or search/i.test(src),
  'Scan barcode must appear before search as primary path',
);

console.log('nutrition-ui.barcode.smoke: ok');
