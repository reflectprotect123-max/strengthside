import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const logColumns = fs.readFileSync(path.join(__dirname, 'log-columns.js'), 'utf8');

function must(cond, msg) {
  if (!cond) throw new Error(msg);
}

must(html.includes("LOCAL_BUILD='the-hybrid-athlete-engine-v151'"), 'LOCAL_BUILD v151');
must(html.includes('function athExerciseSuggestBtn'), 'athExerciseSuggestBtn helper');
must(html.includes('class="searchpick ath-ex-pick"'), 'delegated athlete pick buttons');
must(html.includes('class="searchpick ex-sheet-pick"'), 'delegated sheet pick buttons');
must(html.includes('hybridExercisePickPointer'), 'pointerdown pick handler');
must(html.includes('function refreshAthleteLiftCard'), 'in-place lift card refresh');
must(!html.includes("onclick='pickAthleteLiftSuggest("), 'no fragile inline athlete pick onclick');
must(html.includes('overflow:visible;background:var(--panel)'), 'lift card does not clip suggest list');
must(logColumns.includes('id="athLiftName_${bi}_${ei}"'), 'stable lift name input ids');

console.log('athlete-exercise-pick.smoke: ok');
