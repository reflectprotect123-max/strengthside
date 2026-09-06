#!/usr/bin/env node
/**
 * Hybrid Strength library cut: Library = Engine + Recovery only.
 * TDD red gate — fails until strength tab/doors are removed (Task 3).
 * Run: node apps/mobile/prototype/hybrid-app/cut-strength-library.smoke.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const failures = [];
function must(cond, msg) {
  if (!cond) failures.push(msg);
}

// Strength library surface must be gone after cut
must(!html.includes('Hybrid Strength'), 'Hybrid Strength tab label must be absent');
must(!html.includes('function openAthleteStrengthBuilder('), 'openAthleteStrengthBuilder must be removed');
must(!html.includes('function openAthleteStrengthLibrary('), 'openAthleteStrengthLibrary must be removed');
must(!html.includes('function libraryStrengthTab('), 'libraryStrengthTab must be removed');
must(!html.includes("setLibraryTab('strength')"), 'setLibraryTab strength door must be removed');
must(!/let libraryActiveTab='strength'/.test(html), 'libraryActiveTab default must not be strength');
must(/let libraryActiveTab='conditioning'/.test(html), 'libraryActiveTab default must be conditioning');

// Engine + Recovery library surfaces remain
must(html.includes("setLibraryTab('conditioning')"), 'Engine library tab switch');
must(html.includes("setLibraryTab('recovery')"), 'Recovery library tab switch');
must(html.includes('function libraryConditioningTab('), 'libraryConditioningTab');
must(html.includes('function libraryRecoveryTab('), 'libraryRecoveryTab');
must(html.includes('The Engine'), 'The Engine tab label');
must(html.includes('function openAthleteConditioningLibrary('), 'openAthleteConditioningLibrary');

if (failures.length) {
  console.error('cut-strength-library.smoke FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('cut-strength-library.smoke OK');
