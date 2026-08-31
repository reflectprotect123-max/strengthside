import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = path.dirname(fileURLToPath(import.meta.url));
const ath = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const coach = fs.readFileSync(path.join(dir, 'coach.html'), 'utf8');
const master = fs.readFileSync(path.join(dir, '../../../../design-system/the-hybrid-engine/MASTER.md'), 'utf8');
function must(c, m){ if(!c) throw new Error(m); }
must(master.includes('#d4a574'), 'MASTER keeps copper');
must(master.includes('rejected'), 'MASTER rejects generic tool palette');
must(master.includes('Track Dawn'), 'MASTER names Track Dawn');
must(ath.includes('ath-tpl-schedule'), 'athlete Schedule primary');
must(ath.includes('min-height:var(--tap-min)'), 'athlete tap-min');
must(ath.includes('touch-action:manipulation'), 'athlete touch-action');
must(coach.includes('--r:16px'), 'coach radius 16');
must(coach.includes('.btn.small{min-height:var(--tap)'), 'coach small tap');
must(coach.includes('prefers-reduced-motion'), 'coach reduced motion');
must(coach.includes('min-width:var(--tap);min-height:var(--tap)'), 'coach drag/icon tap sizing');
console.log('track-dawn-polish.smoke: ok');
