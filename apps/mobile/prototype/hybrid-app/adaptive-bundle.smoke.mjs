import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const bundle = readFileSync(join(dir, 'adaptive-bundle.js'), 'utf8');
const ctx = { HybridAdaptive: undefined };
vm.runInNewContext(bundle, ctx);
if (ctx.HybridAdaptive?.decideNextLift) throw new Error('HybridAdaptive.decideNextLift must be absent');
if (ctx.HybridAdaptive?.openLift) throw new Error('HybridAdaptive.openLift must be absent');
if (ctx.HybridAdaptive?.closeLift) throw new Error('HybridAdaptive.closeLift must be absent');
if (!ctx.HybridAdaptive?.decideNextCond) throw new Error('HybridAdaptive.decideNextCond missing');
if (!ctx.HybridAdaptive?.openCond) throw new Error('HybridAdaptive.openCond missing');
if (!ctx.HybridAdaptive?.closeCond) throw new Error('HybridAdaptive.closeCond missing');
const cond = ctx.HybridAdaptive.decideNextCond({
  dayKind: 'conditioning',
  modality: 'watts',
  targetRpe: { min: 7, max: 8 },
  actualRpe: 7,
  currentWatts: 220,
});
if (!cond.ok || cond.watts !== 220) throw new Error('bundle cond Next mismatch');
console.log('adaptive-bundle.smoke: ok');
