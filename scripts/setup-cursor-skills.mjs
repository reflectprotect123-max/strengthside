import { readdirSync, existsSync, readFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
const sources = join(root, '.agents/skills');
let skills = 0, files = 0;
const failures = [];
function sync(source, destination) {
  for (const entry of readdirSync(source, { withFileTypes: true })) {
    const from = join(source, entry.name), to = join(destination, entry.name);
    if (entry.isDirectory()) { sync(from, to); continue; }
    if (!entry.isFile()) throw new Error(`Unsupported skill entry: ${from}`);
    files++;
    if (existsSync(to)) {
      if (!readFileSync(from).equals(readFileSync(to))) failures.push(`Different local file (preserved): ${relative(root, to)}`);
    } else if (check) failures.push(`Missing: ${relative(root, to)}`);
    else { mkdirSync(dirname(to), { recursive: true }); copyFileSync(from, to); }
  }
}
for (const entry of readdirSync(sources, { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name))) {
  if (!entry.isDirectory()) continue;
  const original = join(sources, entry.name);
  if (!existsSync(join(original, 'SKILL.md'))) throw new Error(`Missing SKILL.md: ${original}`);
  // Cursor already uses this saved variant. Do not replace it with the older pack.
  const source = entry.name === 'ui-ux-pro-max'
    ? join(root, '.agents/skill-alternatives/ui-ux-pro-max--variant-2') : original;
  sync(source, join(root, '.cursor/skills', entry.name));
  skills++;
}
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log(`${check ? 'Verified' : 'Prepared'} ${skills} Cursor skills (${files} files). Three alternative versions and two cloud snapshots remain in .agents for reference.`);
