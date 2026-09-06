import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const html = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'index.html'), 'utf8');
function must(c, m) { if (!c) throw new Error(m); }
must(html.includes('loggedSplitSec'), 'logger actual split field missing');
must(html.includes('loggedWatts'), 'logger actual watts field missing');
must(html.includes('loggedRpm'), 'logger actual rpm field missing');
must(/actualSplitSec\s*:/.test(html), 'Next door must pass actualSplitSec');
must(/actualWatts\s*:/.test(html), 'Next door must pass actualWatts');
must(/actualRpm\s*:/.test(html), 'Next door must pass actualRpm');
console.log('cond-next-actual.smoke: ok');
