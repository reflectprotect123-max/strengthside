/**
 * Regression smokes from full-ecosystem bug audit (Aug 2026).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const loopSrc = readFileSync(join(dir, 'coach-loop.js'), 'utf8');
const syncSrc = readFileSync(join(dir, 'coach-sync.js'), 'utf8');
const cloudSrc = readFileSync(join(dir, 'coach-cloud.js'), 'utf8');
const coachHtml = readFileSync(join(dir, 'coach.html'), 'utf8');
const viewsSrc = readFileSync(join(dir, 'coach-views.js'), 'utf8');
const indexHtml = readFileSync(join(dir, 'index.html'), 'utf8');

const sandbox = { console, module: { exports: {} }, globalThis: {} };
sandbox.globalThis = sandbox;
vm.runInNewContext(loopSrc, sandbox);
const L = sandbox.module.exports;
sandbox.CoachLoop = L;
sandbox.module = { exports: {} };
vm.runInNewContext(syncSrc, sandbox);
const Sync = sandbox.CoachSync;
sandbox.module = { exports: {} };
vm.runInNewContext(cloudSrc, sandbox);
const Cloud = sandbox.CoachCloud;

// needsProgramming: published sessions beyond 21-day horizon should not flag athlete
{
  const start = L.today();
  const horizon = L.addDays(start, 21);
  const beyond = L.addDays(horizon, 5);
  const state = {
    athletes: [{ id: 'a1', name: 'Test' }],
    sessions: [
      {
        id: 's1',
        athleteId: 'a1',
        date: beyond,
        published: true,
        status: 'scheduled',
      },
    ],
  };
  const need = L.needsProgramming(state);
  if (need.athletes.length) {
    throw new Error('needsProgramming false-positive for beyond-horizon published session');
  }
}

// monthGridCells: invalid month rolls to current month grid, not empty
{
  const cells = L.monthGridCells('bad');
  const dated = cells.filter(Boolean);
  if (dated.length < 28 || dated.length > 31) {
    throw new Error('monthGridCells(bad) should yield a valid month, got ' + dated.length);
  }
}

// mergeSession: same date+templateId must not collapse distinct coach sessions
{
  const state = {
    sessions: [
      {
        id: 'local1',
        coachSessionId: 'coach-a',
        date: '2026-09-01',
        templateId: 'tpl1',
        source: 'coach-bridge',
        status: 'scheduled',
      },
    ],
  };
  const incoming = {
    id: 'incoming2',
    coachSessionId: 'coach-b',
    date: '2026-09-01',
    templateId: 'tpl1',
    source: 'coach-bridge',
    status: 'scheduled',
  };
  if (!Sync.mergeSession(state, incoming)) throw new Error('mergeSession should accept new coachSessionId');
  if (state.sessions.length !== 2) {
    throw new Error('mergeSession collapsed sessions on date+templateId: ' + state.sessions.length);
  }
}

// pickBucket: no silent fallback to athletes[0] (mirror module logic)
{
  const payload = {
    athletes: [{ email: 'other@example.com', sessions: [{ coachSessionId: 'x1' }] }],
  };
  const email = 'veldman@thehybrid.local';
  const picked =
    payload.athletes.find((a) => String(a.email || '').toLowerCase() === email.toLowerCase()) || null;
  if (picked) throw new Error('pickBucket should not match wrong email');
  if (syncSrc.includes('payload.athletes[0]')) {
    throw new Error('coach-sync.js still falls back to athletes[0]');
  }
}

// nutritionSnapshot: empty payload is null (no false Macros pill)
{
  const snap = Cloud.nutritionSnapshot({ nutrition: { targetsByAthlete: {}, mealDays: [] } }, 'a1', '2026-08-30');
  if (snap) throw new Error('nutritionSnapshot should be null when no targets/meals');
}

// setBlockType text clears conditioning residue
{
  const blocks = L.decorateBlocks([
    L.makeBlock({
      type: 'conditioning',
      category: 'Conditioning',
      condFmt: 'steady',
      modality: 'Bike',
      targetDurationMin: 20,
      effort: 'easy',
    }),
  ]);
  blocks[0].type = 'text';
  blocks[0].category = 'Prep';
  blocks[0].scoring = 'completion';
  delete blocks[0].condFmt;
  delete blocks[0].modality;
  delete blocks[0].targetDurationMin;
  delete blocks[0].effort;
  delete blocks[0].conditioningType;
  const out = L.decorateBlocks(blocks);
  if (out[0].type !== 'text') {
    throw new Error('text block reverted to ' + out[0].type);
  }
}

// coach.html audit hooks
if (!coachHtml.includes('closeCoachExEdit();')) throw new Error('coach.html missing closeCoachExEdit guards');
if (!coachHtml.includes('delete b.effort')) throw new Error('setBlockType text must clear effort');
if (!coachHtml.includes('blockTypeValue(b)')) throw new Error('cellSummary must use blockTypeValue');

// coach-views team calendar athlete picker
if (!viewsSrc.includes('pickLibraryAthlete')) throw new Error('team calendar athlete picker missing');
if (!viewsSrc.includes('pickAthlete: true')) throw new Error('team libPick athlete step missing');
if (!viewsSrc.includes('hasNutritionBundle = false')) {
  throw new Error('revertPublishOnCloudFail must clear hasNutritionBundle');
}

// athlete hybrid session routing
if (!indexHtml.includes('function sessionHasStrengthWork')) {
  throw new Error('sessionHasStrengthWork missing');
}
if (!indexHtml.includes('if(sessionHasStrengthWork(x)){train();return}')) {
  throw new Error('enterSessionScreen must prefer strength for hybrid sessions');
}
if (!indexHtml.includes("x.status!=='completed'&&!x.coachWithdrawn")) {
  throw new Error('coachControlsStrength must ignore completed/withdrawn prescriptions');
}

console.log('coach-audit-fixes: ok');
