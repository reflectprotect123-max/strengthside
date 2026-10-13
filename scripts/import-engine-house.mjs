#!/usr/bin/env node
// Copies the built Engine page into apps/athlete/engine/ so one Strength install
// carries both houses. The Engine source of truth stays on its own branch; this
// tree only re-points three strings and never edits Engine logic.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('../', import.meta.url));
const outDir = fileURLToPath(new URL('../apps/athlete/engine/', import.meta.url));
const DEFAULT_REF = 'origin/codex/engine-web-cloudflare';
const SOURCES = {
  'index.html': 'apps/athlete/conditioning/index.html',
  'native-plugins.js': 'apps/athlete/conditioning/native-plugins.js',
};

const PATCHES = [
  ["const NATIVE_APP_ID = 'com.hybrid.athlete';", "const NATIVE_APP_ID = 'com.hybrid.strength';"],
  ["getLatest({channel:'engine-html'})", "getLatest({channel:'strength-live'})"],
  ['</body>', '<script src="hallway.js"></script></body>'],
];

export function patchEngineHtml(html) {
  let out = String(html);
  for (const [from, to] of PATCHES) {
    const count = out.split(from).length - 1;
    if (count !== 1) throw new Error(`Engine patch point ${from} found ${count} times; expected exactly 1`);
    out = out.replace(from, () => to);
  }
  return out;
}

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
const git = (...args) => execFileSync('git', args, { cwd: repo, maxBuffer: 64 * 1024 * 1024 });

export function importEngineHouse(ref = DEFAULT_REF) {
  const commit = git('rev-parse', `${ref}^{commit}`).toString().trim();
  const files = {};
  const source = {};
  for (const [name, path] of Object.entries(SOURCES)) {
    source[path] = git('rev-parse', `${commit}:${path}`).toString().trim();
    files[name] = git('show', `${commit}:${path}`);
  }
  files['index.html'] = Buffer.from(patchEngineHtml(files['index.html'].toString('utf8')));
  mkdirSync(outDir, { recursive: true });
  const output = {};
  for (const [name, buf] of Object.entries(files)) {
    writeFileSync(outDir + name, buf);
    output[name] = sha256(buf);
  }
  const upstream = { ref, commit, source, output };
  writeFileSync(outDir + 'UPSTREAM.json', JSON.stringify(upstream, null, 2) + '\n');
  return upstream;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const upstream = importEngineHouse(process.argv[2] || DEFAULT_REF);
  console.log(`Engine house imported from ${upstream.ref} @ ${upstream.commit.slice(0, 8)}`);
}
