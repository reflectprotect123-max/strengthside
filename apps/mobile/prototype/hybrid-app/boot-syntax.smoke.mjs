import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const m = html.match(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/);
if (!m) throw new Error('main inline script missing');
const tmp = path.join(__dirname, '.boot-syntax-check.js');
writeFileSync(tmp, m[1]);
const r = spawnSync(process.execPath, ['--check', tmp], { encoding: 'utf8' });
try { unlinkSync(tmp); } catch {}
if (r.status !== 0) {
  console.error(r.stderr || r.stdout);
  throw new Error('boot-syntax.smoke: main inline script failed node --check');
}
if (!html.includes('function resolveCanonicalExercise')) {
  throw new Error('boot-syntax.smoke: resolveCanonicalExercise missing after strength restore');
}
if (!html.includes('Hybrid Strength')) {
  throw new Error('boot-syntax.smoke: Hybrid Strength library tab missing');
}
console.log('boot-syntax.smoke: ok');
