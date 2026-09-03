#!/usr/bin/env node
/**
 * Debt registry: each entry is a known gap. CI fails until the pattern rule passes.
 * Remove or set resolved when fixed — do not silence by weakening the pattern.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const registry = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'metric-logger-debt.registry.json'), 'utf8'));
const failures = [];

for (const item of registry) {
  if (item.resolved) continue;
  const path = join(root, item.file);
  const text = readFileSync(path, 'utf8');
  const re = new RegExp(item.pattern, 'm');
  const matched = re.test(text);
  if (item.mode === 'mustNotMatch' && matched) failures.push(`${item.id}: ${item.message}`);
  if (item.mode === 'mustMatch' && !matched) failures.push(`${item.id}: ${item.message}`);
}

if (failures.length) {
  console.error('metric-logger-debt FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('metric-logger-debt: ok', { rules: registry.filter((r) => !r.resolved).length });
