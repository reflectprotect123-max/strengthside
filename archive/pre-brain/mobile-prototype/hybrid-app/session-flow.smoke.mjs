/**
 * Smoke: unified session cursor + next-node handoff strip.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const src = readFileSync(join(dir, 'session-flow.js'), 'utf8');

if (!html.includes('session-flow.js')) throw new Error('index.html missing session-flow.js');
if (!html.includes('.session-handoff')) throw new Error('session-handoff CSS missing');

const sandbox = {
  window: {},
  console,
  esc: (s) => String(s),
  activeSession: () => sandbox._session,
  current: () => sandbox._session.tasks[sandbox._session.taskIndex],
  workElapsed: () => 125,
  SessionChrome: { applyBrand: () => {}, fmtElapsed: (n) => '02:05' },
  document: { getElementById: () => null },
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(src, sandbox);

sandbox._session = {
  id: 's1',
  taskIndex: 0,
  tasks: [
    { kind: 'strength', name: 'Bench Press', complete: false },
    { kind: 'conditioning', heading: 'Row ERG', modality: 'Rower', complete: false },
    { kind: 'text', heading: 'Cool-down', complete: false },
  ],
};

const c = sandbox.SessionFlow.cursor();
if (c.nodeKind !== 'strength') throw new Error('cursor kind ' + c.nodeKind);
if (c.nodeIndex !== 0) throw new Error('cursor index');

const preview = sandbox.SessionFlow.nextNodePreviewHtml();
if (!preview.includes('session-handoff')) throw new Error('handoff missing');
if (!preview.includes('Engine · Row ERG')) throw new Error('handoff label wrong: ' + preview);

sandbox._session.taskIndex = 1;
const preview2 = sandbox.SessionFlow.nextNodePreviewHtml();
if (!preview2.includes('Cool-down')) throw new Error('second handoff missing');

sandbox._session.taskIndex = 2;
if (sandbox.SessionFlow.nextNodePreviewHtml()) throw new Error('last task should have empty handoff');

console.log('session-flow.smoke: ok');
