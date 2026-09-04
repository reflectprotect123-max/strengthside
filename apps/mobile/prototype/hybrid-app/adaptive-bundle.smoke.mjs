import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const bundle = readFileSync(join(dir, 'adaptive-bundle.js'), 'utf8');
const ctx = { HybridAdaptive: undefined };
vm.runInNewContext(bundle, ctx);
if (!ctx.HybridAdaptive?.decideNextLift) throw new Error('HybridAdaptive.decideNextLift missing');
if (!ctx.HybridAdaptive?.decideNextCond) throw new Error('HybridAdaptive.decideNextCond missing');
const next = ctx.HybridAdaptive.decideNextLift({
  dayKind: 'strength',
  range: { min: 8, max: 12 },
  logged: { loadKg: 80, reps: 12, rir: 4 },
});
if (next.loadKg !== 82.5 || next.reps !== 8) throw new Error('bundle lift Next mismatch');
const cond = ctx.HybridAdaptive.decideNextCond({
  dayKind: 'conditioning',
  modality: 'watts',
  targetRpe: { min: 7, max: 8 },
  actualRpe: 7,
  currentWatts: 220,
});
if (!cond.ok || cond.watts !== 220) throw new Error('bundle cond Next mismatch');
console.log('adaptive-bundle.smoke: ok');
