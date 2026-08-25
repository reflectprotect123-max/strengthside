import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const bundle = readFileSync(join(dir, 'strength-bundle.js'), 'utf8');

const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(`${bundle}; window.HybridStrength = HybridStrength;`, sandbox);

const HS = sandbox.window.HybridStrength;
if (!HS?.Resolve?.resolveTarget) throw new Error('Resolve missing');
if (!HS?.E1rm?.e1rm) throw new Error('E1rm missing');
if (!HS?.Load?.sessionLoad) throw new Error('Load missing');

console.log('strength-resolve.smoke: ok');
