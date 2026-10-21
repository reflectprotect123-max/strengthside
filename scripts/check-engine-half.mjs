import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ENGINE_ROOTS = [
  'apps/athlete/engine/index.html',
];

export function repoRoot() {
  return resolve(dirname(fileURLToPath(import.meta.url)), '..');
}

export function presentEngineRoots(root) {
  return ENGINE_ROOTS.filter((rel) => existsSync(join(root, rel)));
}

export function engineCommands(root) {
  const commands = [];
  if (existsSync(join(root, 'apps/athlete/engine/index.html'))) {
    commands.push({
      command: process.execPath,
      args: ['--test',
        'apps/athlete/engine/hallway.test.js',
        'apps/athlete/progress-chart.test.js',
        'scripts/stage-athlete.test.mjs',
        'scripts/import-engine-house.test.mjs',
        'scripts/engine-hr-transport.test.mjs',
        'scripts/engine-updates.test.mjs'],
    });
    commands.push({ command: process.execPath, args: ['apps/athlete/checks/engine-door.smoke.mjs'] });
    commands.push({ command: process.execPath, args: ['apps/athlete/checks/capgo-live-update.smoke.mjs'] });
  }
  return commands;
}

export function engineAbsenceMessage() {
  return [
    'Engine app is not in this checkout.',
    `Expected: ${ENGINE_ROOTS.join(', ')}`,
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
