import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const failures = [];
function must(cond, msg) {
  if (!cond) failures.push(msg);
}

must(html.includes('engine/index.html'), 'front door opens the engine');
must(html.includes('hybrid-product" content="engine"'), 'front door is marked engine');
must(!html.includes('library-ui.js'), 'front door does not load the strength builder');
must(!html.includes('logger.js'), 'front door does not load the strength logger');
must(!html.includes('Create session'), 'front door does not offer the strength session builder');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('engine-door: the app opens the engine and the strength builder stays parked');
