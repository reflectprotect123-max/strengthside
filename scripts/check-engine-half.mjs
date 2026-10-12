import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ENGINE_ROOTS = [
  'packages/adaptive/package.json',
  'apps/athlete/conditioning/index.html',
  'apps/engine-web/package.json',
  'scripts/conditioning/build.mjs',
];

export function repoRoot() {
  return resolve(dirname(fileURLToPath(import.meta.url)), '..');
}

export function presentEngineRoots(root) {
  return ENGINE_ROOTS.filter((rel) => existsSync(join(root, rel)));
}

function collectTests(dir) {
  if (!existsSync(dir)) return [];
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...collectTests(full));
    else if (/\.test\.(mjs|js|ts)$/.test(entry.name)) found.push(full);
  }
  return found;
}

export function engineCommands(root) {
  const commands = [];
  const adaptivePackage = join(root, 'packages/adaptive/package.json');
  if (existsSync(adaptivePackage)) {
    const pkg = JSON.parse(readFileSync(adaptivePackage, 'utf8'));
    if (pkg.scripts?.test) commands.push({ command: 'pnpm', args: ['--dir', 'packages/adaptive', 'test'] });
  }
  for (const dir of ['scripts/conditioning', 'apps/athlete/conditioning', 'apps/engine-web']) {
    const tests = collectTests(join(root, dir)).map((full) => relative(root, full));
    if (tests.length) commands.push({ command: process.execPath, args: ['--test', ...tests] });
  }
  return commands;
}

export function engineAbsenceMessage() {
  return [
    'Engine half is not in this checkout.',
    `Expected one of: ${ENGINE_ROOTS.join(', ')}`,
    'Switch to an engine branch (known remote: origin/codex/engine-web-cloudflare) and run pnpm run verify:engine there.',
    'A strength-only checkout cannot verify the engine half.',
  ].join('\n');
}

function main() {
  const root = repoRoot();
  const present = presentEngineRoots(root);
  if (present.length === 0) {
    process.stderr.write(`${engineAbsenceMessage()}\n`);
    process.exit(1);
  }
  const commands = engineCommands(root);
  if (commands.length === 0) {
    process.stderr.write(`Engine files are present (${present.join(', ')}) but no engine test command is wired.\n`);
    process.exit(1);
  }
  process.stdout.write(`Engine roots: ${present.join(', ')}\n`);
  for (const step of commands) {
    const result = spawnSync(step.command, step.args, { cwd: root, stdio: 'inherit' });
    if (result.status !== 0) process.exit(result.status ?? 1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
