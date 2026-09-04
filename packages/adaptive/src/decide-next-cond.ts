import type { CondNextInput, CondNextResult, RepRange } from './types';

function condBand(
  actual: number,
  target: RepRange,
  stopped?: boolean,
  cooked?: boolean,
): 'hold' | 'up' | 'down' | 'cut' {
  if (stopped || actual >= 10) return 'cut';
  if (cooked) return 'down';
  if (actual < target.min) return 'up';
  if (actual > target.max) return 'down';
  return 'hold';
}

function present(n: number | undefined): n is number {
  return n != null && Number.isFinite(n);
}

export function decideNextCond(input: CondNextInput): CondNextResult {
  if (input.dayKind !== 'conditioning') return { ok: false, reason: 'wrong_day' };

  const hasWatts = present(input.currentWatts);
  const hasSplit = present(input.currentSplitSec);
  if (!hasWatts && !hasSplit) return { ok: true, skipped: true };

  const band = condBand(input.actualRpe, input.targetRpe, input.stopped, input.cooked);
  const useWatts =
    input.modality === 'watts' ? hasWatts : hasWatts && !hasSplit;

  if (useWatts) {
    const w = input.currentWatts as number;
    if (band === 'hold') return { ok: true, watts: w };
    if (band === 'up') return { ok: true, watts: Math.round(w * 1.03) };
    if (band === 'down') return { ok: true, watts: Math.round(w * 0.95) };
    return { ok: true, watts: Math.round(w * 0.92) };
  }

  const s = input.currentSplitSec as number;
  if (band === 'hold') return { ok: true, splitSec: s };
  if (band === 'up') return { ok: true, splitSec: s - 1 };
  if (band === 'down') return { ok: true, splitSec: s + 1 };
  return { ok: true, splitSec: s + 3 };
}
